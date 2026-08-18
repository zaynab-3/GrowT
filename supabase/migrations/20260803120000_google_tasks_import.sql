alter table public.tasks
  add column if not exists external_source text,
  add column if not exists external_list_id text,
  add column if not exists external_task_id text,
  add column if not exists external_url text,
  add column if not exists external_updated_at timestamptz;

alter table public.tasks
  drop constraint if exists tasks_external_source_check;

alter table public.tasks
  add constraint tasks_external_source_check
  check (external_source is null or external_source = 'google_tasks');

create unique index if not exists tasks_external_identity_idx
  on public.tasks (owner_id, external_source, external_list_id, external_task_id)
  where external_source is not null
    and external_list_id is not null
    and external_task_id is not null;

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
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(external_list_id), '') is null
    or nullif(trim(external_task_id), '') is null then
    raise exception 'Google task identity is required';
  end if;

  if nullif(trim(title), '') is null then
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
    update public.tasks
    set title = trim(sync_google_task.title),
        description = nullif(trim(coalesce(sync_google_task.description, '')), ''),
        due_date = sync_google_task.due_date::date,
        external_url = sync_google_task.external_url,
        external_updated_at = sync_google_task.external_updated_at,
        updated_at = timezone('utc', now())
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
    trim(sync_google_task.title),
    nullif(trim(coalesce(sync_google_task.description, '')), ''),
    'personal',
    sync_google_task.due_date::date,
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
end;
$$;

revoke all on function public.sync_google_task(text, text, text, text, timestamptz, text, timestamptz) from public;
grant execute on function public.sync_google_task(text, text, text, text, timestamptz, text, timestamptz) to authenticated;
