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

  insert into public.folders (
    owner_id,
    title,
    description,
    category,
    is_shared
  )
  values (
    v_user_id,
    trim(p_title),
    nullif(trim(coalesce(p_description, '')), ''),
    p_category,
    p_category = 'shared'
  )
  returning * into v_folder;

  insert into public.folder_members (folder_id, user_id, role)
  values (v_folder.id, v_user_id, 'owner')
  on conflict (folder_id, user_id) do nothing;

  return v_folder;
end;
$$;

create or replace function public.create_folder(
  title text,
  description text,
  category text
)
returns public.folders
language sql
security invoker
set search_path = ''
as $$
  select private.create_folder(title, description, category);
$$;

revoke execute on function public.create_folder(text, text, text) from public;
revoke execute on function public.create_folder(text, text, text) from anon;
grant execute on function public.create_folder(text, text, text) to authenticated;

grant execute on function private.create_folder(text, text, text) to authenticated;
