alter table public.folders
add column if not exists recipient_task_amount numeric(10, 2) not null default 0;

alter table public.tasks
add column if not exists recipient_amount numeric(10, 2) not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'folders_recipient_task_amount_nonnegative'
  ) then
    alter table public.folders
    add constraint folders_recipient_task_amount_nonnegative
    check (recipient_task_amount >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_recipient_amount_nonnegative'
  ) then
    alter table public.tasks
    add constraint tasks_recipient_amount_nonnegative
    check (recipient_amount >= 0);
  end if;
end;
$$;

drop function if exists public.create_folder(text, text, text, boolean);
drop function if exists private.create_folder(text, text, text, boolean);

create or replace function private.create_folder(
  p_title text,
  p_description text,
  p_category text,
  p_contains_export_videos boolean default false,
  p_recipient_task_amount numeric default 0
)
returns public.folders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_folder public.folders;
  v_position integer;
  v_recipient_task_amount numeric(10, 2) := round(coalesce(p_recipient_task_amount, 0), 2);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Folder title is required';
  end if;

  if p_category not in ('work', 'personal', 'shared') then
    raise exception 'Invalid folder category: %', p_category;
  end if;

  if v_recipient_task_amount < 0 then
    raise exception 'Recipient amount cannot be negative';
  end if;

  select coalesce(max(position), -1) + 1
  into v_position
  from public.folders
  where owner_id = v_user_id
    and deleted_at is null;

  insert into public.folders (
    owner_id,
    title,
    description,
    category,
    is_shared,
    position,
    contains_export_videos,
    recipient_task_amount
  )
  values (
    v_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_category,
    p_category = 'shared',
    v_position,
    coalesce(p_contains_export_videos, false),
    v_recipient_task_amount
  )
  returning * into v_folder;

  insert into public.folder_members (folder_id, user_id, role)
  values (v_folder.id, v_user_id, 'owner')
  on conflict (folder_id, user_id) do nothing;

  return v_folder;
end;
$$;

create or replace function public.create_folder(
  title text,
  description text default null,
  category text default 'personal',
  contains_export_videos boolean default false,
  recipient_task_amount numeric default 0
)
returns public.folders
language sql
security invoker
set search_path = ''
as $$
  select private.create_folder(title, description, category, contains_export_videos, recipient_task_amount);
$$;

drop function if exists public.update_folder(uuid, text, text, text, date, boolean, boolean);
drop function if exists private.update_folder(uuid, text, text, text, date, boolean, boolean);

create or replace function private.update_folder(
  p_folder_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_due_date date default null,
  p_is_active boolean default true,
  p_contains_export_videos boolean default false,
  p_recipient_task_amount numeric default 0
)
returns public.folders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_folder public.folders;
  v_category text;
  v_recipient_task_amount numeric(10, 2) := round(coalesce(p_recipient_task_amount, 0), 2);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_folder_id is null then
    raise exception 'Folder is required';
  end if;

  if not private.is_folder_owner(p_folder_id, v_user_id) then
    raise exception 'Only the folder owner can edit this folder';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Folder title is required';
  end if;

  v_category := coalesce(nullif(trim(p_category), ''), 'personal');

  if v_category not in ('work', 'personal', 'shared') then
    raise exception 'Invalid folder category: %', v_category;
  end if;

  if v_recipient_task_amount < 0 then
    raise exception 'Recipient amount cannot be negative';
  end if;

  update public.folders
  set
    title = trim(p_title),
    description = nullif(trim(coalesce(p_description, '')), ''),
    category = v_category,
    is_shared = v_category = 'shared',
    due_date = p_due_date,
    is_active = coalesce(p_is_active, true),
    contains_export_videos = coalesce(p_contains_export_videos, false),
    recipient_task_amount = v_recipient_task_amount
  where id = p_folder_id
    and deleted_at is null
  returning * into v_folder;

  if v_folder.id is null then
    raise exception 'Folder not found';
  end if;

  return v_folder;
end;
$$;

create or replace function public.update_folder(
  folder_id uuid,
  title text,
  description text default null,
  category text default null,
  due_date date default null,
  is_active boolean default true,
  contains_export_videos boolean default false,
  recipient_task_amount numeric default 0
)
returns public.folders
language sql
security invoker
set search_path = ''
as $$
  select private.update_folder(folder_id, title, description, category, due_date, is_active, contains_export_videos, recipient_task_amount);
$$;

drop function if exists public.create_task(uuid, text, text, text, uuid, timestamptz, boolean);
drop function if exists private.create_task(uuid, text, text, text, uuid, timestamptz, boolean);

create or replace function private.create_task(
  p_folder_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_assigned_user_id uuid default null,
  p_due_date timestamptz default null,
  p_has_export_button boolean default false,
  p_recipient_amount numeric default null
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_folder public.folders;
  v_category text;
  v_position integer;
  v_task public.tasks;
  v_recipient_amount numeric(10, 2);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_folder_id is null then
    raise exception 'Folder is required';
  end if;

  select *
  into v_folder
  from public.folders
  where id = p_folder_id
    and deleted_at is null;

  if v_folder.id is null then
    raise exception 'Folder not found';
  end if;

  if not private.can_access_folder(p_folder_id, v_user_id) then
    raise exception 'You do not have access to this folder';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Task title is required';
  end if;

  v_category := coalesce(nullif(trim(p_category), ''), v_folder.category);
  v_recipient_amount := round(coalesce(p_recipient_amount, v_folder.recipient_task_amount, 0), 2);

  if v_category not in ('work', 'personal', 'shared') then
    raise exception 'Invalid task category: %', v_category;
  end if;

  if v_recipient_amount < 0 then
    raise exception 'Recipient amount cannot be negative';
  end if;

  if p_recipient_amount is not null and not private.is_folder_owner(p_folder_id, v_user_id) then
    raise exception 'Only the folder owner can set recipient amounts';
  end if;

  if p_assigned_user_id is not null and not private.can_access_folder(p_folder_id, p_assigned_user_id) then
    raise exception 'Assigned user does not have access to this folder';
  end if;

  select coalesce(max(position), -1) + 1
  into v_position
  from public.tasks
  where folder_id = p_folder_id
    and deleted_at is null;

  insert into public.tasks (
    folder_id,
    owner_id,
    assigned_user_id,
    title,
    description,
    category,
    due_date,
    position,
    has_export_button,
    recipient_amount
  )
  values (
    p_folder_id,
    v_user_id,
    p_assigned_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    v_category,
    p_due_date::date,
    v_position,
    coalesce(p_has_export_button, false),
    v_recipient_amount
  )
  returning * into v_task;

  return v_task;
end;
$$;

create or replace function public.create_task(
  folder_id uuid,
  title text,
  description text default null,
  category text default null,
  assigned_user_id uuid default null,
  due_date timestamptz default null,
  has_export_button boolean default false,
  recipient_amount numeric default null
)
returns public.tasks
language sql
security invoker
set search_path = ''
as $$
  select private.create_task(folder_id, title, description, category, assigned_user_id, due_date, has_export_button, recipient_amount);
$$;

drop function if exists public.create_standalone_task(text, text, text, uuid, timestamptz, boolean);
drop function if exists private.create_standalone_task(text, text, text, uuid, timestamptz, boolean);

create or replace function private.create_standalone_task(
  p_title text,
  p_description text default null,
  p_category text default 'personal',
  p_assigned_user_id uuid default null,
  p_due_date timestamptz default null,
  p_has_export_button boolean default false,
  p_recipient_amount numeric default 0
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_category text;
  v_position integer;
  v_task public.tasks;
  v_recipient_amount numeric(10, 2) := round(coalesce(p_recipient_amount, 0), 2);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Task title is required';
  end if;

  v_category := coalesce(nullif(trim(p_category), ''), 'personal');

  if v_category not in ('work', 'personal', 'shared') then
    raise exception 'Invalid task category: %', v_category;
  end if;

  if v_recipient_amount < 0 then
    raise exception 'Recipient amount cannot be negative';
  end if;

  if p_assigned_user_id is not null and p_assigned_user_id <> v_user_id then
    if v_category <> 'shared' then
      raise exception 'Standalone tasks can only be assigned to yourself for now';
    end if;
  end if;

  select coalesce(max(position), -1) + 1
  into v_position
  from public.tasks
  where folder_id is null
    and owner_id = v_user_id
    and deleted_at is null;

  insert into public.tasks (
    folder_id,
    owner_id,
    assigned_user_id,
    title,
    description,
    category,
    due_date,
    position,
    has_export_button,
    recipient_amount
  )
  values (
    null,
    v_user_id,
    p_assigned_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    v_category,
    p_due_date::date,
    v_position,
    coalesce(p_has_export_button, false),
    v_recipient_amount
  )
  returning * into v_task;

  if v_category = 'shared' then
    insert into public.task_members (task_id, user_id, role)
    values (v_task.id, v_user_id, 'owner')
    on conflict (task_id, user_id) do update set role = 'owner';

    if p_assigned_user_id is not null and p_assigned_user_id <> v_user_id then
      insert into public.task_members (task_id, user_id, role)
      values (v_task.id, p_assigned_user_id, 'member')
      on conflict (task_id, user_id) do nothing;
    end if;
  end if;

  return v_task;
end;
$$;

create or replace function public.create_standalone_task(
  title text,
  description text default null,
  category text default 'personal',
  assigned_user_id uuid default null,
  due_date timestamptz default null,
  has_export_button boolean default false,
  recipient_amount numeric default 0
)
returns public.tasks
language sql
security invoker
set search_path = ''
as $$
  select private.create_standalone_task(title, description, category, assigned_user_id, due_date, has_export_button, recipient_amount);
$$;

drop function if exists public.update_task(uuid, text, text, text, date, boolean, uuid, boolean);
drop function if exists private.update_task(uuid, text, text, text, date, boolean, uuid, boolean);

create or replace function private.update_task(
  p_task_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_due_date date default null,
  p_is_active boolean default true,
  p_assigned_user_id uuid default null,
  p_has_export_button boolean default null,
  p_recipient_amount numeric default null
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_task public.tasks;
  v_task public.tasks;
  v_category text;
  v_recipient_amount numeric(10, 2);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_task_id is null then
    raise exception 'Task is required';
  end if;

  select *
  into v_existing_task
  from public.tasks
  where id = p_task_id
    and deleted_at is null;

  if v_existing_task.id is null then
    raise exception 'Task not found';
  end if;

  if v_existing_task.owner_id <> v_user_id
    and (
      v_existing_task.folder_id is null
      or not private.is_folder_owner(v_existing_task.folder_id, v_user_id)
    )
  then
    raise exception 'Only the task owner or folder owner can edit this task';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Task title is required';
  end if;

  v_category := coalesce(nullif(trim(p_category), ''), v_existing_task.category);
  v_recipient_amount := round(coalesce(p_recipient_amount, v_existing_task.recipient_amount, 0), 2);

  if v_category not in ('work', 'personal', 'shared') then
    raise exception 'Invalid task category: %', v_category;
  end if;

  if v_recipient_amount < 0 then
    raise exception 'Recipient amount cannot be negative';
  end if;

  if p_recipient_amount is not null
    and v_existing_task.folder_id is not null
    and not private.is_folder_owner(v_existing_task.folder_id, v_user_id)
  then
    raise exception 'Only the folder owner can set recipient amounts';
  end if;

  if p_assigned_user_id is not null then
    if v_existing_task.folder_id is not null then
      if not private.can_access_folder(v_existing_task.folder_id, p_assigned_user_id) then
        raise exception 'Assigned user does not have access to this folder';
      end if;
    elsif p_assigned_user_id <> v_user_id then
      if v_category <> 'shared' then
        raise exception 'Standalone tasks can only be assigned to yourself for now';
      end if;
    end if;
  end if;

  update public.tasks
  set
    title = trim(p_title),
    description = nullif(trim(coalesce(p_description, '')), ''),
    category = v_category,
    due_date = p_due_date,
    is_active = coalesce(p_is_active, true),
    assigned_user_id = p_assigned_user_id,
    has_export_button = coalesce(p_has_export_button, v_existing_task.has_export_button),
    recipient_amount = v_recipient_amount
  where id = p_task_id
    and deleted_at is null
  returning * into v_task;

  if v_task.folder_id is null and v_category = 'shared' then
    insert into public.task_members (task_id, user_id, role)
    values (v_task.id, v_user_id, 'owner')
    on conflict (task_id, user_id) do update set role = 'owner';

    if p_assigned_user_id is not null and p_assigned_user_id <> v_user_id then
      insert into public.task_members (task_id, user_id, role)
      values (v_task.id, p_assigned_user_id, 'member')
      on conflict (task_id, user_id) do nothing;
    end if;
  elsif v_task.folder_id is null and v_category <> 'shared' then
    delete from public.task_members
    where task_id = v_task.id
      and role <> 'owner';

    delete from public.task_members
    where task_id = v_task.id
      and role = 'owner'
      and user_id <> v_user_id;
  end if;

  return v_task;
end;
$$;

create or replace function public.update_task(
  task_id uuid,
  title text,
  description text default null,
  category text default null,
  due_date date default null,
  is_active boolean default true,
  assigned_user_id uuid default null,
  has_export_button boolean default null,
  recipient_amount numeric default null
)
returns public.tasks
language sql
security invoker
set search_path = ''
as $$
  select private.update_task(task_id, title, description, category, due_date, is_active, assigned_user_id, has_export_button, recipient_amount);
$$;

revoke execute on function private.create_folder(text, text, text, boolean, numeric) from public, anon;
revoke execute on function public.create_folder(text, text, text, boolean, numeric) from public, anon;
revoke execute on function private.update_folder(uuid, text, text, text, date, boolean, boolean, numeric) from public, anon;
revoke execute on function public.update_folder(uuid, text, text, text, date, boolean, boolean, numeric) from public, anon;
revoke execute on function private.create_task(uuid, text, text, text, uuid, timestamptz, boolean, numeric) from public, anon;
revoke execute on function public.create_task(uuid, text, text, text, uuid, timestamptz, boolean, numeric) from public, anon;
revoke execute on function private.create_standalone_task(text, text, text, uuid, timestamptz, boolean, numeric) from public, anon;
revoke execute on function public.create_standalone_task(text, text, text, uuid, timestamptz, boolean, numeric) from public, anon;
revoke execute on function private.update_task(uuid, text, text, text, date, boolean, uuid, boolean, numeric) from public, anon;
revoke execute on function public.update_task(uuid, text, text, text, date, boolean, uuid, boolean, numeric) from public, anon;

grant execute on function private.create_folder(text, text, text, boolean, numeric) to authenticated;
grant execute on function public.create_folder(text, text, text, boolean, numeric) to authenticated;
grant execute on function private.update_folder(uuid, text, text, text, date, boolean, boolean, numeric) to authenticated;
grant execute on function public.update_folder(uuid, text, text, text, date, boolean, boolean, numeric) to authenticated;
grant execute on function private.create_task(uuid, text, text, text, uuid, timestamptz, boolean, numeric) to authenticated;
grant execute on function public.create_task(uuid, text, text, text, uuid, timestamptz, boolean, numeric) to authenticated;
grant execute on function private.create_standalone_task(text, text, text, uuid, timestamptz, boolean, numeric) to authenticated;
grant execute on function public.create_standalone_task(text, text, text, uuid, timestamptz, boolean, numeric) to authenticated;
grant execute on function private.update_task(uuid, text, text, text, date, boolean, uuid, boolean, numeric) to authenticated;
grant execute on function public.update_task(uuid, text, text, text, date, boolean, uuid, boolean, numeric) to authenticated;
