create or replace function private.update_folder(
  p_folder_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_due_date date default null,
  p_is_active boolean default true
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

  update public.folders
  set
    title = trim(p_title),
    description = nullif(trim(coalesce(p_description, '')), ''),
    category = v_category,
    is_shared = v_category = 'shared',
    due_date = p_due_date,
    is_active = coalesce(p_is_active, true)
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
  is_active boolean default true
)
returns public.folders
language sql
security invoker
set search_path = ''
as $$
  select private.update_folder(folder_id, title, description, category, due_date, is_active);
$$;

create or replace function private.soft_delete_folder(p_folder_id uuid)
returns public.folders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_folder public.folders;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_folder_id is null then
    raise exception 'Folder is required';
  end if;

  if not private.is_folder_owner(p_folder_id, v_user_id) then
    raise exception 'Only the folder owner can delete this folder';
  end if;

  update public.folders
  set
    deleted_at = now(),
    is_active = false
  where id = p_folder_id
    and deleted_at is null
  returning * into v_folder;

  if v_folder.id is null then
    raise exception 'Folder not found';
  end if;

  return v_folder;
end;
$$;

create or replace function public.soft_delete_folder(folder_id uuid)
returns public.folders
language sql
security invoker
set search_path = ''
as $$
  select private.soft_delete_folder(folder_id);
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

  if p_assigned_user_id is not null
    and v_existing_task.folder_id is not null
    and not private.can_access_folder(v_existing_task.folder_id, p_assigned_user_id)
  then
    raise exception 'Assigned user does not have access to this folder';
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
  assigned_user_id uuid default null
)
returns public.tasks
language sql
security invoker
set search_path = ''
as $$
  select private.update_task(task_id, title, description, category, due_date, is_active, assigned_user_id);
$$;

create or replace function private.soft_delete_task(p_task_id uuid)
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
    raise exception 'Only the task owner or folder owner can delete this task';
  end if;

  update public.tasks
  set
    deleted_at = now(),
    is_active = false
  where id = p_task_id
    and deleted_at is null
  returning * into v_task;

  return v_task;
end;
$$;

create or replace function public.soft_delete_task(task_id uuid)
returns public.tasks
language sql
security invoker
set search_path = ''
as $$
  select private.soft_delete_task(task_id);
$$;

create index if not exists task_status_actions_active_contrib_idx
on public.task_status_actions (task_id, new_status, user_id, created_at desc)
where is_undone = false;

revoke execute on function private.update_folder(uuid, text, text, text, date, boolean) from public, anon;
revoke execute on function public.update_folder(uuid, text, text, text, date, boolean) from public, anon;
revoke execute on function private.soft_delete_folder(uuid) from public, anon;
revoke execute on function public.soft_delete_folder(uuid) from public, anon;
revoke execute on function private.update_task(uuid, text, text, text, date, boolean, uuid) from public, anon;
revoke execute on function public.update_task(uuid, text, text, text, date, boolean, uuid) from public, anon;
revoke execute on function private.soft_delete_task(uuid) from public, anon;
revoke execute on function public.soft_delete_task(uuid) from public, anon;

grant execute on function private.update_folder(uuid, text, text, text, date, boolean) to authenticated;
grant execute on function public.update_folder(uuid, text, text, text, date, boolean) to authenticated;
grant execute on function private.soft_delete_folder(uuid) to authenticated;
grant execute on function public.soft_delete_folder(uuid) to authenticated;
grant execute on function private.update_task(uuid, text, text, text, date, boolean, uuid) to authenticated;
grant execute on function public.update_task(uuid, text, text, text, date, boolean, uuid) to authenticated;
grant execute on function private.soft_delete_task(uuid) to authenticated;
grant execute on function public.soft_delete_task(uuid) to authenticated;
