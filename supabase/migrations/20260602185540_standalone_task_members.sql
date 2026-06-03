create table if not exists public.task_members (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_members_task_user_key unique (task_id, user_id)
);

create index if not exists task_members_task_idx on public.task_members (task_id);
create index if not exists task_members_user_idx on public.task_members (user_id);
create index if not exists task_members_task_user_role_idx on public.task_members (task_id, user_id, role);

drop trigger if exists set_task_members_updated_at on public.task_members;
create trigger set_task_members_updated_at
before update on public.task_members
for each row execute function public.set_current_timestamp_updated_at();

create or replace function private.can_access_task(p_task_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks
    where tasks.id = p_task_id
      and tasks.deleted_at is null
      and (
        tasks.owner_id = p_user_id
        or (
          tasks.folder_id is not null
          and private.can_access_folder(tasks.folder_id, p_user_id)
        )
        or (
          tasks.folder_id is null
          and tasks.category = 'shared'
          and exists (
            select 1
            from public.task_members
            where task_members.task_id = tasks.id
              and task_members.user_id = p_user_id
          )
        )
      )
  );
$$;

alter table public.task_members enable row level security;
alter table public.task_members replica identity full;
grant select, insert, update, delete on public.task_members to authenticated;

drop policy if exists "Users can view accessible task memberships" on public.task_members;
create policy "Users can view accessible task memberships"
on public.task_members for select
to authenticated
using (private.can_access_task(task_id, (select auth.uid())));

drop policy if exists "Task owners can add task members" on public.task_members;
create policy "Task owners can add task members"
on public.task_members for insert
to authenticated
with check (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_members.task_id
      and tasks.folder_id is null
      and tasks.category = 'shared'
      and tasks.deleted_at is null
      and tasks.owner_id = (select auth.uid())
  )
);

drop policy if exists "Task owners can update task members" on public.task_members;
create policy "Task owners can update task members"
on public.task_members for update
to authenticated
using (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_members.task_id
      and tasks.folder_id is null
      and tasks.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_members.task_id
      and tasks.folder_id is null
      and tasks.category = 'shared'
      and tasks.deleted_at is null
      and tasks.owner_id = (select auth.uid())
  )
);

drop policy if exists "Task owners or members can remove task memberships" on public.task_members;
create policy "Task owners or members can remove task memberships"
on public.task_members for delete
to authenticated
using (
  (
    exists (
      select 1
      from public.tasks
      where tasks.id = task_members.task_id
        and tasks.folder_id is null
        and tasks.owner_id = (select auth.uid())
    )
  )
  or (
    task_members.user_id = (select auth.uid())
    and task_members.role <> 'owner'
  )
);

create or replace function private.list_standalone_tasks()
returns setof public.tasks
language sql
stable
security definer
set search_path = ''
as $$
  select tasks.*
  from public.tasks
  where tasks.folder_id is null
    and tasks.deleted_at is null
    and (
      tasks.owner_id = auth.uid()
      or (
        tasks.category = 'shared'
        and exists (
          select 1
          from public.task_members
          where task_members.task_id = tasks.id
            and task_members.user_id = auth.uid()
        )
      )
    )
  order by tasks.position asc, tasks.created_at asc;
$$;

create or replace function public.list_standalone_tasks()
returns setof public.tasks
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_standalone_tasks();
$$;

create or replace function public.list_visible_standalone_tasks()
returns setof public.tasks
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_standalone_tasks();
$$;

create or replace function private.create_standalone_task(
  p_title text,
  p_description text default null,
  p_category text default 'personal',
  p_assigned_user_id uuid default null,
  p_due_date timestamptz default null
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

  if p_assigned_user_id is not null and p_assigned_user_id <> v_user_id then
    raise exception 'Standalone tasks can only be assigned to yourself for now';
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
    position
  )
  values (
    null,
    v_user_id,
    p_assigned_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    v_category,
    p_due_date::date,
    v_position
  )
  returning * into v_task;

  if v_category = 'shared' then
    insert into public.task_members (task_id, user_id, role)
    values (v_task.id, v_user_id, 'owner')
    on conflict (task_id, user_id) do update set role = 'owner';
  end if;

  return v_task;
end;
$$;

create or replace function private.update_task(
  p_task_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_due_date date default null,
  p_is_active boolean default true,
  p_assigned_user_id uuid default null
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

  if v_category not in ('work', 'personal', 'shared') then
    raise exception 'Invalid task category: %', v_category;
  end if;

  if p_assigned_user_id is not null then
    if v_existing_task.folder_id is not null then
      if not private.can_access_folder(v_existing_task.folder_id, p_assigned_user_id) then
        raise exception 'Assigned user does not have access to this folder';
      end if;
    elsif p_assigned_user_id <> v_user_id then
      raise exception 'Standalone tasks can only be assigned to yourself for now';
    end if;
  end if;

  update public.tasks
  set
    title = trim(p_title),
    description = nullif(trim(coalesce(p_description, '')), ''),
    category = v_category,
    due_date = p_due_date,
    is_active = coalesce(p_is_active, true),
    assigned_user_id = p_assigned_user_id
  where id = p_task_id
    and deleted_at is null
  returning * into v_task;

  if v_task.folder_id is null and v_category = 'shared' then
    insert into public.task_members (task_id, user_id, role)
    values (v_task.id, v_user_id, 'owner')
    on conflict (task_id, user_id) do update set role = 'owner';
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

create or replace function private.restore_task(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_task public.tasks;
  v_task public.tasks;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_existing_task
  from public.tasks
  where id = p_task_id
    and deleted_at is not null;

  if v_existing_task.id is null then
    raise exception 'Task not found';
  end if;

  if v_existing_task.owner_id <> v_user_id
    and (
      v_existing_task.folder_id is null
      or not exists (
        select 1
        from public.folders
        where folders.id = v_existing_task.folder_id
          and folders.owner_id = v_user_id
      )
    )
  then
    raise exception 'Only the task owner or folder owner can restore this task';
  end if;

  update public.tasks
  set
    deleted_at = null,
    is_active = true
  where id = p_task_id
  returning * into v_task;

  if v_task.folder_id is null and v_task.category = 'shared' then
    insert into public.task_members (task_id, user_id, role)
    values (v_task.id, v_task.owner_id, 'owner')
    on conflict (task_id, user_id) do update set role = 'owner';
  end if;

  return v_task;
end;
$$;

create or replace function private.list_task_members(p_task_id uuid)
returns setof public.task_members
language sql
stable
security definer
set search_path = ''
as $$
  select task_members.*
  from public.task_members
  where task_members.task_id = p_task_id
    and private.can_access_task(p_task_id, auth.uid())
  order by task_members.role = 'owner' desc, task_members.created_at asc;
$$;

create or replace function public.list_task_members(task_id uuid)
returns setof public.task_members
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_task_members(task_id);
$$;

create or replace function private.add_task_member(
  p_task_id uuid,
  p_username text
)
returns public.task_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.tasks;
  v_profile public.profiles;
  v_member public.task_members;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_task
  from public.tasks
  where id = p_task_id
    and deleted_at is null;

  if v_task.id is null then
    raise exception 'Task not found';
  end if;

  if v_task.folder_id is not null then
    raise exception 'Task members are only for standalone tasks';
  end if;

  if v_task.category <> 'shared' then
    raise exception 'Change this task to Shared before adding members';
  end if;

  if v_task.owner_id <> v_user_id then
    raise exception 'Only the task owner can add members';
  end if;

  select *
  into v_profile
  from public.profiles
  where username = nullif(trim(p_username), '');

  if v_profile.id is null then
    raise exception 'No GrowT user found with that username';
  end if;

  insert into public.task_members (task_id, user_id, role)
  values (
    v_task.id,
    v_profile.id,
    case when v_profile.id = v_task.owner_id then 'owner' else 'member' end
  )
  on conflict (task_id, user_id) do update
  set role = case when excluded.user_id = v_task.owner_id then 'owner' else public.task_members.role end
  returning * into v_member;

  return v_member;
end;
$$;

create or replace function public.add_task_member(
  task_id uuid,
  username text
)
returns public.task_members
language sql
security invoker
set search_path = ''
as $$
  select private.add_task_member(task_id, username);
$$;

create or replace function private.remove_task_member(
  p_task_id uuid,
  p_user_id uuid
)
returns public.task_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.tasks;
  v_member public.task_members;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_task
  from public.tasks
  where id = p_task_id
    and deleted_at is null;

  if v_task.id is null then
    raise exception 'Task not found';
  end if;

  if v_task.owner_id <> v_user_id then
    raise exception 'Only the task owner can remove members';
  end if;

  if p_user_id = v_task.owner_id then
    raise exception 'Task owner membership cannot be removed';
  end if;

  delete from public.task_members
  where task_id = p_task_id
    and user_id = p_user_id
  returning * into v_member;

  if v_member.id is null then
    raise exception 'Task member not found';
  end if;

  return v_member;
end;
$$;

create or replace function public.remove_task_member(
  task_id uuid,
  user_id uuid
)
returns public.task_members
language sql
security invoker
set search_path = ''
as $$
  select private.remove_task_member(task_id, user_id);
$$;

insert into public.task_members (task_id, user_id, role)
select tasks.id, tasks.owner_id, 'owner'
from public.tasks
where tasks.folder_id is null
  and tasks.category = 'shared'
on conflict (task_id, user_id) do update set role = 'owner';

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'task_members'
  ) then
    alter publication supabase_realtime add table public.task_members;
  end if;
end;
$$;

revoke execute on function public.list_visible_standalone_tasks() from public, anon;
revoke execute on function private.list_task_members(uuid) from public, anon;
revoke execute on function public.list_task_members(uuid) from public, anon;
revoke execute on function private.add_task_member(uuid, text) from public, anon;
revoke execute on function public.add_task_member(uuid, text) from public, anon;
revoke execute on function private.remove_task_member(uuid, uuid) from public, anon;
revoke execute on function public.remove_task_member(uuid, uuid) from public, anon;

grant execute on function public.list_visible_standalone_tasks() to authenticated;
grant execute on function private.list_task_members(uuid) to authenticated;
grant execute on function public.list_task_members(uuid) to authenticated;
grant execute on function private.add_task_member(uuid, text) to authenticated;
grant execute on function public.add_task_member(uuid, text) to authenticated;
grant execute on function private.remove_task_member(uuid, uuid) to authenticated;
grant execute on function public.remove_task_member(uuid, uuid) to authenticated;
