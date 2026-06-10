-- Fix standalone task assignment restriction in create_standalone_task and update_task
-- This allows assigning shared standalone tasks to other users.

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

    if p_assigned_user_id is not null and p_assigned_user_id <> v_user_id then
      insert into public.task_members (task_id, user_id, role)
      values (v_task.id, p_assigned_user_id, 'member')
      on conflict (task_id, user_id) do nothing;
    end if;
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
    assigned_user_id = p_assigned_user_id
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
