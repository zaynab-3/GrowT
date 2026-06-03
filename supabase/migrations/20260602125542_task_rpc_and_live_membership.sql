create or replace function private.list_folder_tasks(p_folder_id uuid)
returns setof public.tasks
language sql
stable
security definer
set search_path = ''
as $$
  select tasks.*
  from public.tasks
  where tasks.folder_id = p_folder_id
    and tasks.deleted_at is null
    and private.can_access_folder(p_folder_id, auth.uid())
  order by tasks.position asc, tasks.created_at asc;
$$;

create or replace function public.list_folder_tasks(folder_id uuid)
returns setof public.tasks
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_folder_tasks(folder_id);
$$;

create or replace function private.create_task(
  p_folder_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
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
  v_folder public.folders;
  v_category text;
  v_position integer;
  v_task public.tasks;
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

  if v_category not in ('work', 'personal', 'shared') then
    raise exception 'Invalid task category: %', v_category;
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
    position
  )
  values (
    p_folder_id,
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

create or replace function public.create_task(
  folder_id uuid,
  title text,
  description text default null,
  category text default null,
  assigned_user_id uuid default null,
  due_date timestamptz default null
)
returns public.tasks
language sql
security invoker
set search_path = ''
as $$
  select private.create_task(folder_id, title, description, category, assigned_user_id, due_date);
$$;

revoke execute on function private.list_folder_tasks(uuid) from public, anon;
revoke execute on function public.list_folder_tasks(uuid) from public, anon;
revoke execute on function private.create_task(uuid, text, text, text, uuid, timestamptz) from public, anon;
revoke execute on function public.create_task(uuid, text, text, text, uuid, timestamptz) from public, anon;

grant execute on function private.list_folder_tasks(uuid) to authenticated;
grant execute on function public.list_folder_tasks(uuid) to authenticated;
grant execute on function private.create_task(uuid, text, text, text, uuid, timestamptz) to authenticated;
grant execute on function public.create_task(uuid, text, text, text, uuid, timestamptz) to authenticated;
