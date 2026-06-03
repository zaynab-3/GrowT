create or replace function private.undo_task_status_action(p_action_id uuid)
returns public.task_status_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_action public.task_status_actions;
  v_previous_action public.task_status_actions;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_action
  from public.task_status_actions
  where id = p_action_id;

  if v_action.id is null then
    raise exception 'Action not found';
  end if;

  if v_action.user_id <> v_user_id then
    raise exception 'You can only undo your own contribution';
  end if;

  if v_action.is_undone then
    return v_action;
  end if;

  if not private.can_access_task(v_action.task_id, v_user_id) then
    raise exception 'You do not have access to this task';
  end if;

  update public.task_status_actions
  set
    is_undone = true,
    undone_at = now()
  where id = v_action.id
  returning * into v_action;

  select *
  into v_previous_action
  from public.task_status_actions
  where task_id = v_action.task_id
    and user_id = v_user_id
    and task_level_id is not distinct from v_action.task_level_id
    and is_undone = false
  order by created_at desc
  limit 1;

  if v_previous_action.id is null then
    delete from public.task_progress
    where task_id = v_action.task_id
      and user_id = v_user_id
      and task_level_id is not distinct from v_action.task_level_id;
  else
    update public.task_progress
    set status = v_previous_action.new_status
    where task_id = v_action.task_id
      and user_id = v_user_id
      and task_level_id is not distinct from v_action.task_level_id;

    if not found then
      insert into public.task_progress (task_id, task_level_id, user_id, status)
      values (v_action.task_id, v_action.task_level_id, v_user_id, v_previous_action.new_status);
    end if;
  end if;

  return v_action;
end;
$$;

create or replace function public.undo_task_status_action(action_id uuid)
returns public.task_status_actions
language sql
security invoker
set search_path = ''
as $$
  select private.undo_task_status_action(action_id);
$$;

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
    and tasks.owner_id = auth.uid()
    and tasks.deleted_at is null
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

  return v_task;
end;
$$;

create or replace function public.create_standalone_task(
  title text,
  description text default null,
  category text default 'personal',
  assigned_user_id uuid default null,
  due_date timestamptz default null
)
returns public.tasks
language sql
security invoker
set search_path = ''
as $$
  select private.create_standalone_task(title, description, category, assigned_user_id, due_date);
$$;

create or replace function private.list_deleted_folders()
returns setof public.folders
language sql
stable
security definer
set search_path = ''
as $$
  select folders.*
  from public.folders
  where folders.owner_id = auth.uid()
    and folders.deleted_at is not null
  order by folders.deleted_at desc, folders.updated_at desc;
$$;

create or replace function public.list_deleted_folders()
returns setof public.folders
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_deleted_folders();
$$;

create or replace function private.restore_folder(p_folder_id uuid)
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

  update public.folders
  set
    deleted_at = null,
    is_active = true
  where id = p_folder_id
    and owner_id = v_user_id
    and deleted_at is not null
  returning * into v_folder;

  if v_folder.id is null then
    raise exception 'Folder not found';
  end if;

  insert into public.folder_members (folder_id, user_id, role)
  values (v_folder.id, v_user_id, 'owner')
  on conflict (folder_id, user_id) do update set role = 'owner';

  return v_folder;
end;
$$;

create or replace function public.restore_folder(folder_id uuid)
returns public.folders
language sql
security invoker
set search_path = ''
as $$
  select private.restore_folder(folder_id);
$$;

create or replace function private.list_deleted_tasks()
returns setof public.tasks
language sql
stable
security definer
set search_path = ''
as $$
  select tasks.*
  from public.tasks
  left join public.folders on folders.id = tasks.folder_id
  where tasks.deleted_at is not null
    and (
      tasks.owner_id = auth.uid()
      or folders.owner_id = auth.uid()
    )
  order by tasks.deleted_at desc, tasks.updated_at desc;
$$;

create or replace function public.list_deleted_tasks()
returns setof public.tasks
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_deleted_tasks();
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

  return v_task;
end;
$$;

create or replace function public.restore_task(task_id uuid)
returns public.tasks
language sql
security invoker
set search_path = ''
as $$
  select private.restore_task(task_id);
$$;

create index if not exists tasks_standalone_owner_idx
on public.tasks (owner_id, deleted_at, position, created_at)
where folder_id is null;

create index if not exists task_status_actions_action_user_idx
on public.task_status_actions (id, user_id, is_undone);

revoke execute on function private.undo_task_status_action(uuid) from public, anon;
revoke execute on function public.undo_task_status_action(uuid) from public, anon;
revoke execute on function private.list_standalone_tasks() from public, anon;
revoke execute on function public.list_standalone_tasks() from public, anon;
revoke execute on function private.create_standalone_task(text, text, text, uuid, timestamptz) from public, anon;
revoke execute on function public.create_standalone_task(text, text, text, uuid, timestamptz) from public, anon;
revoke execute on function private.list_deleted_folders() from public, anon;
revoke execute on function public.list_deleted_folders() from public, anon;
revoke execute on function private.restore_folder(uuid) from public, anon;
revoke execute on function public.restore_folder(uuid) from public, anon;
revoke execute on function private.list_deleted_tasks() from public, anon;
revoke execute on function public.list_deleted_tasks() from public, anon;
revoke execute on function private.restore_task(uuid) from public, anon;
revoke execute on function public.restore_task(uuid) from public, anon;

grant execute on function private.undo_task_status_action(uuid) to authenticated;
grant execute on function public.undo_task_status_action(uuid) to authenticated;
grant execute on function private.list_standalone_tasks() to authenticated;
grant execute on function public.list_standalone_tasks() to authenticated;
grant execute on function private.create_standalone_task(text, text, text, uuid, timestamptz) to authenticated;
grant execute on function public.create_standalone_task(text, text, text, uuid, timestamptz) to authenticated;
grant execute on function private.list_deleted_folders() to authenticated;
grant execute on function public.list_deleted_folders() to authenticated;
grant execute on function private.restore_folder(uuid) to authenticated;
grant execute on function public.restore_folder(uuid) to authenticated;
grant execute on function private.list_deleted_tasks() to authenticated;
grant execute on function public.list_deleted_tasks() to authenticated;
grant execute on function private.restore_task(uuid) to authenticated;
grant execute on function public.restore_task(uuid) to authenticated;
