with ranked_folders as (
  select
    id,
    row_number() over (
      partition by owner_id
      order by position asc, updated_at desc, created_at asc, id asc
    ) - 1 as next_position
  from public.folders
  where deleted_at is null
)
update public.folders
set position = ranked_folders.next_position
from ranked_folders
where folders.id = ranked_folders.id
  and folders.position is distinct from ranked_folders.next_position;

with ranked_folder_tasks as (
  select
    id,
    row_number() over (
      partition by folder_id
      order by position asc, created_at asc, id asc
    ) - 1 as next_position
  from public.tasks
  where folder_id is not null
    and deleted_at is null
)
update public.tasks
set position = ranked_folder_tasks.next_position
from ranked_folder_tasks
where tasks.id = ranked_folder_tasks.id
  and tasks.position is distinct from ranked_folder_tasks.next_position;

with ranked_standalone_tasks as (
  select
    id,
    row_number() over (
      partition by owner_id
      order by position asc, created_at asc, id asc
    ) - 1 as next_position
  from public.tasks
  where folder_id is null
    and deleted_at is null
)
update public.tasks
set position = ranked_standalone_tasks.next_position
from ranked_standalone_tasks
where tasks.id = ranked_standalone_tasks.id
  and tasks.position is distinct from ranked_standalone_tasks.next_position;

create index if not exists folders_owner_active_position_idx
on public.folders (owner_id, deleted_at, position, created_at);

create or replace function private.normalize_folder_positions(p_owner_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  with ranked as (
    select
      id,
      row_number() over (
        order by position asc, updated_at desc, created_at asc, id asc
      ) - 1 as next_position
    from public.folders
    where owner_id = p_owner_id
      and deleted_at is null
  )
  update public.folders
  set position = ranked.next_position
  from ranked
  where folders.id = ranked.id
    and folders.position is distinct from ranked.next_position;
$$;

create or replace function private.normalize_folder_task_positions(p_folder_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  with ranked as (
    select
      id,
      row_number() over (
        order by position asc, created_at asc, id asc
      ) - 1 as next_position
    from public.tasks
    where folder_id = p_folder_id
      and deleted_at is null
  )
  update public.tasks
  set position = ranked.next_position
  from ranked
  where tasks.id = ranked.id
    and tasks.position is distinct from ranked.next_position;
$$;

create or replace function private.normalize_standalone_task_positions(p_owner_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  with ranked as (
    select
      id,
      row_number() over (
        order by position asc, created_at asc, id asc
      ) - 1 as next_position
    from public.tasks
    where folder_id is null
      and owner_id = p_owner_id
      and deleted_at is null
  )
  update public.tasks
  set position = ranked.next_position
  from ranked
  where tasks.id = ranked.id
    and tasks.position is distinct from ranked.next_position;
$$;

create or replace function private.create_folder(
  p_title text,
  p_description text,
  p_category text
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
    position
  )
  values (
    v_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_category,
    p_category = 'shared',
    v_position
  )
  returning * into v_folder;

  insert into public.folder_members (folder_id, user_id, role)
  values (v_folder.id, v_user_id, 'owner')
  on conflict (folder_id, user_id) do nothing;

  return v_folder;
end;
$$;

create or replace function private.reorder_folder(
  p_folder_id uuid,
  p_direction text
)
returns setof public.folders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_direction text := lower(trim(coalesce(p_direction, '')));
  v_folder public.folders;
  v_target public.folders;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_direction not in ('up', 'down') then
    raise exception 'Direction must be up or down';
  end if;

  select *
  into v_folder
  from public.folders
  where id = p_folder_id
    and deleted_at is null;

  if v_folder.id is null then
    raise exception 'Folder not found';
  end if;

  if v_folder.owner_id <> v_user_id then
    raise exception 'Only the folder owner can reorder this folder';
  end if;

  perform private.normalize_folder_positions(v_user_id);

  select *
  into v_folder
  from public.folders
  where id = p_folder_id
    and deleted_at is null;

  if v_direction = 'up' then
    select *
    into v_target
    from public.folders
    where owner_id = v_user_id
      and deleted_at is null
      and position < v_folder.position
    order by position desc
    limit 1;
  else
    select *
    into v_target
    from public.folders
    where owner_id = v_user_id
      and deleted_at is null
      and position > v_folder.position
    order by position asc
    limit 1;
  end if;

  if v_target.id is not null then
    update public.folders
    set position = case
      when id = v_folder.id then v_target.position
      when id = v_target.id then v_folder.position
      else position
    end
    where id in (v_folder.id, v_target.id);
  end if;

  return query
  select folders.*
  from public.folders
  where folders.deleted_at is null
    and private.can_access_folder(folders.id, v_user_id)
  order by folders.position asc, folders.updated_at desc;
end;
$$;

create or replace function public.reorder_folder(
  folder_id uuid,
  direction text
)
returns setof public.folders
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.reorder_folder(folder_id, direction);
$$;

create or replace function private.reorder_task(
  p_task_id uuid,
  p_direction text
)
returns setof public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_direction text := lower(trim(coalesce(p_direction, '')));
  v_task public.tasks;
  v_target public.tasks;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_direction not in ('up', 'down') then
    raise exception 'Direction must be up or down';
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
    if not private.is_folder_owner(v_task.folder_id, v_user_id) then
      raise exception 'Only the folder owner can reorder folder tasks';
    end if;

    perform private.normalize_folder_task_positions(v_task.folder_id);

    select *
    into v_task
    from public.tasks
    where id = p_task_id
      and deleted_at is null;

    if v_direction = 'up' then
      select *
      into v_target
      from public.tasks
      where folder_id = v_task.folder_id
        and deleted_at is null
        and position < v_task.position
      order by position desc
      limit 1;
    else
      select *
      into v_target
      from public.tasks
      where folder_id = v_task.folder_id
        and deleted_at is null
        and position > v_task.position
      order by position asc
      limit 1;
    end if;

    if v_target.id is not null then
      update public.tasks
      set position = case
        when id = v_task.id then v_target.position
        when id = v_target.id then v_task.position
        else position
      end
      where id in (v_task.id, v_target.id);
    end if;

    return query
    select *
    from private.list_folder_tasks(v_task.folder_id);
    return;
  end if;

  if v_task.owner_id <> v_user_id then
    raise exception 'Only the task owner can reorder standalone tasks';
  end if;

  perform private.normalize_standalone_task_positions(v_user_id);

  select *
  into v_task
  from public.tasks
  where id = p_task_id
    and deleted_at is null;

  if v_direction = 'up' then
    select *
    into v_target
    from public.tasks
    where folder_id is null
      and owner_id = v_user_id
      and deleted_at is null
      and position < v_task.position
    order by position desc
    limit 1;
  else
    select *
    into v_target
    from public.tasks
    where folder_id is null
      and owner_id = v_user_id
      and deleted_at is null
      and position > v_task.position
    order by position asc
    limit 1;
  end if;

  if v_target.id is not null then
    update public.tasks
    set position = case
      when id = v_task.id then v_target.position
      when id = v_target.id then v_task.position
      else position
    end
    where id in (v_task.id, v_target.id);
  end if;

  return query
  select *
  from private.list_standalone_tasks();
end;
$$;

create or replace function public.reorder_task(
  task_id uuid,
  direction text
)
returns setof public.tasks
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.reorder_task(task_id, direction);
$$;

revoke execute on function private.normalize_folder_positions(uuid) from public, anon;
revoke execute on function private.normalize_folder_task_positions(uuid) from public, anon;
revoke execute on function private.normalize_standalone_task_positions(uuid) from public, anon;
revoke execute on function private.reorder_folder(uuid, text) from public, anon;
revoke execute on function public.reorder_folder(uuid, text) from public, anon;
revoke execute on function private.reorder_task(uuid, text) from public, anon;
revoke execute on function public.reorder_task(uuid, text) from public, anon;

grant execute on function private.reorder_folder(uuid, text) to authenticated;
grant execute on function public.reorder_folder(uuid, text) to authenticated;
grant execute on function private.reorder_task(uuid, text) to authenticated;
grant execute on function public.reorder_task(uuid, text) to authenticated;
grant execute on function private.create_folder(text, text, text) to authenticated;
