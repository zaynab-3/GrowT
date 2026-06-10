-- Recreate handle_new_auth_user function with robust unique username generation and safe OAuth support
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_username text;
  v_display_name text;
  v_base_username text;
  v_counter integer := 1;
  v_inserted boolean := false;
begin
  -- If a profile already exists for this id, do not overwrite and return safely
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  -- 1. Extract Display Name
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- 2. Extract Base Username
  v_base_username := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    split_part(new.email, '@', 1)
  );

  -- 3. Sanitize Username (lowercase, alphanumeric/underscore only)
  v_base_username := regexp_replace(lower(v_base_username), '[^a-z0-9_]', '', 'g');
  if v_base_username = '' then
    v_base_username := 'user';
  end if;

  v_username := v_base_username;

  -- 4. Loop to insert catching unique_violation
  while not v_inserted loop
    begin
      insert into public.profiles (id, username, display_name)
      values (new.id, v_username, v_display_name);
      v_inserted := true;
    exception 
      when unique_violation then
        if v_counter < 6 then
          v_username := v_base_username || v_counter::text;
        else
          v_username := v_base_username || '_' || substring(md5(random()::text) from 1 for 6);
        end if;
        v_counter := v_counter + 1;
        
        -- Loop safety limit to avoid locks/infinite loops
        if v_counter > 50 then
          raise exception 'Could not generate a unique username after 50 attempts';
        end if;
    end;
  end loop;

  return new;
end;
$$;

-- Drop and recreate the trigger to ensure the updated function is correctly registered
drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

-- Revoke public execution to secure the handle_new_auth_user function
revoke execute on function private.handle_new_auth_user() from public, anon;

