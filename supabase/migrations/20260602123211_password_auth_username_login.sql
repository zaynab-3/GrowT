create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  v_display_name text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
begin
  if v_username is null then
    return new;
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(v_username),
    coalesce(v_display_name, lower(v_username))
  )
  on conflict (id) do update
  set username = coalesce(public.profiles.username, excluded.username),
      display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function private.resolve_login_email(p_identifier text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select auth_users.email
  from public.profiles
  join auth.users as auth_users on auth_users.id = profiles.id
  where profiles.username = nullif(trim(p_identifier), '')
  limit 1;
$$;

create or replace function public.resolve_login_email(identifier text)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select private.resolve_login_email(identifier);
$$;

grant usage on schema private to anon;

revoke execute on function private.is_folder_owner(uuid, uuid) from public, anon;
revoke execute on function private.can_access_folder(uuid, uuid) from public, anon;
revoke execute on function private.can_access_task(uuid, uuid) from public, anon;
revoke execute on function private.set_task_progress(uuid, uuid, text) from public, anon;
revoke execute on function private.undo_latest_task_progress(uuid, uuid) from public, anon;
revoke execute on function private.create_folder(text, text, text) from public, anon;
revoke execute on function private.handle_new_auth_user() from public, anon;
revoke execute on function private.resolve_login_email(text) from public;
revoke execute on function public.resolve_login_email(text) from public;

grant execute on function private.is_folder_owner(uuid, uuid) to authenticated;
grant execute on function private.can_access_folder(uuid, uuid) to authenticated;
grant execute on function private.can_access_task(uuid, uuid) to authenticated;
grant execute on function private.set_task_progress(uuid, uuid, text) to authenticated;
grant execute on function private.undo_latest_task_progress(uuid, uuid) to authenticated;
grant execute on function private.create_folder(text, text, text) to authenticated;
grant execute on function private.resolve_login_email(text) to anon, authenticated;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
