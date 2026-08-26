create or replace function public.sync_google_task(
  external_list_id text,
  external_task_id text,
  title text,
  description text default null,
  due_date timestamptz default null,
  external_url text default null,
  external_updated_at timestamptz default null
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.tasks;
  v_description text := nullif(trim(coalesce(sync_google_task.description, '')), '');
  v_due_date date := sync_google_task.due_date::date;
  v_title text := trim(sync_google_task.title);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(external_list_id), '') is null
    or nullif(trim(external_task_id), '') is null then
    raise exception 'Google task identity is required';
  end if;

  if nullif(v_title, '') is null then
    raise exception 'Task title is required';
  end if;

  if external_url is not null and external_url !~ '^https://' then
    raise exception 'Google task URL must use HTTPS';
  end if;

  select tasks.*
  into v_task
  from public.tasks
  where tasks.owner_id = v_user_id
    and tasks.external_source = 'google_tasks'
    and tasks.external_list_id = sync_google_task.external_list_id
    and tasks.external_task_id = sync_google_task.external_task_id
  limit 1
  for update;

  if found then
    if sync_google_task.external_updated_at is not null
      and v_task.external_updated_at is not null
      and sync_google_task.external_updated_at < v_task.external_updated_at then
      return v_task;
    end if;

    if v_task.title is not distinct from v_title
      and v_task.description is not distinct from v_description
      and v_task.due_date is not distinct from v_due_date
      and v_task.external_url is not distinct from sync_google_task.external_url
      and v_task.external_updated_at is not distinct from sync_google_task.external_updated_at
      and v_task.is_active
      and v_task.deleted_at is null then
      return v_task;
    end if;

    update public.tasks
    set title = v_title,
        description = v_description,
        due_date = v_due_date,
        external_url = sync_google_task.external_url,
        external_updated_at = sync_google_task.external_updated_at,
        is_active = true,
        deleted_at = null,
        updated_at = now()
    where id = v_task.id
    returning * into v_task;

    return v_task;
  end if;

  perform private.normalize_standalone_task_positions(v_user_id);

  update public.tasks
  set position = position + 1
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
    recipient_amount,
    external_source,
    external_list_id,
    external_task_id,
    external_url,
    external_updated_at
  )
  values (
    null,
    v_user_id,
    null,
    v_title,
    v_description,
    'personal',
    v_due_date,
    0,
    false,
    0,
    'google_tasks',
    trim(sync_google_task.external_list_id),
    trim(sync_google_task.external_task_id),
    sync_google_task.external_url,
    sync_google_task.external_updated_at
  )
  returning * into v_task;

  return v_task;
exception
  when unique_violation then
    select tasks.*
    into v_task
    from public.tasks
    where tasks.owner_id = v_user_id
      and tasks.external_source = 'google_tasks'
      and tasks.external_list_id = sync_google_task.external_list_id
      and tasks.external_task_id = sync_google_task.external_task_id
    limit 1;

    if v_task.id is null then
      raise;
    end if;

    return v_task;
end;
$$;

create or replace function public.finish_google_tasks_sync(
  external_list_id text,
  active_external_task_ids text[] default '{}'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(external_list_id), '') is null then
    raise exception 'Google task list identity is required';
  end if;

  update public.tasks
  set is_active = false,
      updated_at = now()
  where owner_id = v_user_id
    and external_source = 'google_tasks'
    and public.tasks.external_list_id = finish_google_tasks_sync.external_list_id
    and deleted_at is null
    and is_active
    and not (external_task_id = any(coalesce(active_external_task_ids, '{}')));

  get diagnostics v_updated_count = row_count;
  return v_updated_count;
end;
$$;

revoke all on function public.sync_google_task(text, text, text, text, timestamptz, text, timestamptz) from public;
grant execute on function public.sync_google_task(text, text, text, text, timestamptz, text, timestamptz) to authenticated;
revoke all on function public.finish_google_tasks_sync(text, text[]) from public;
grant execute on function public.finish_google_tasks_sync(text, text[]) to authenticated;
