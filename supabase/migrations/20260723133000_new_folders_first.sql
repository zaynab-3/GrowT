create or replace function private.create_folder(
  p_title text,
  p_description text,
  p_category text,
  p_contains_export_videos boolean default false,
  p_recipient_task_amount numeric default 0
)
returns public.folders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_folder public.folders;
  v_recipient_task_amount numeric(10, 2) := round(coalesce(p_recipient_task_amount, 0), 2);
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

  if v_recipient_task_amount < 0 then
    raise exception 'Recipient amount cannot be negative';
  end if;

  perform private.normalize_folder_positions(v_user_id);

  update public.folders
  set position = position + 1
  where owner_id = v_user_id
    and deleted_at is null;

  insert into public.folders (
    owner_id,
    title,
    description,
    category,
    is_shared,
    position,
    contains_export_videos,
    recipient_task_amount
  )
  values (
    v_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_category,
    p_category = 'shared',
    0,
    coalesce(p_contains_export_videos, false),
    v_recipient_task_amount
  )
  returning * into v_folder;

  insert into public.folder_members (folder_id, user_id, role)
  values (v_folder.id, v_user_id, 'owner')
  on conflict (folder_id, user_id) do nothing;

  return v_folder;
end;
$$;
