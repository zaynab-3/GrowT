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
    0,
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
