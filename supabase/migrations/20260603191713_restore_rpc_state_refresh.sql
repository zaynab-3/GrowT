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

  if p_folder_id is null then
    raise exception 'Folder is required';
  end if;

  update public.folders
  set
    deleted_at = null,
    is_active = true,
    updated_at = now()
  where id = p_folder_id
    and owner_id = v_user_id
    and deleted_at is not null
  returning * into v_folder;

  if v_folder.id is null then
    raise exception 'Deleted folder not found';
  end if;

  insert into public.folder_members (folder_id, user_id, role)
  values (v_folder.id, v_user_id, 'owner')
  on conflict (folder_id, user_id) do update
  set
    role = 'owner',
    updated_at = now();

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

  if p_task_id is null then
    raise exception 'Task is required';
  end if;

  select *
  into v_existing_task
  from public.tasks
  where id = p_task_id
    and deleted_at is not null;

  if v_existing_task.id is null then
    raise exception 'Deleted task not found';
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
    is_active = true,
    updated_at = now()
  where id = p_task_id
    and deleted_at is not null
  returning * into v_task;

  if v_task.id is null then
    raise exception 'Deleted task not found';
  end if;

  if v_task.folder_id is null and v_task.category = 'shared' then
    insert into public.task_members (task_id, user_id, role)
    values (v_task.id, v_task.owner_id, 'owner')
    on conflict (task_id, user_id) do update
    set
      role = 'owner',
      updated_at = now();
  end if;

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

revoke execute on function private.restore_folder(uuid) from public, anon;
revoke execute on function public.restore_folder(uuid) from public, anon;
revoke execute on function private.restore_task(uuid) from public, anon;
revoke execute on function public.restore_task(uuid) from public, anon;

grant execute on function private.restore_folder(uuid) to authenticated;
grant execute on function public.restore_folder(uuid) to authenticated;
grant execute on function private.restore_task(uuid) to authenticated;
grant execute on function public.restore_task(uuid) to authenticated;
