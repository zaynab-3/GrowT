alter table public.acquaintance_requests replica identity full;
alter table public.acquaintances replica identity full;

create or replace function private.search_profiles_by_username(p_query text)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profiles.id as profile_id,
    profiles.username::text as username,
    profiles.display_name,
    profiles.avatar_url
  from public.profiles
  where auth.uid() is not null
    and nullif(trim(p_query), '') is not null
    and profiles.id <> auth.uid()
    and profiles.username is not null
    and profiles.username::text ilike '%' || trim(p_query) || '%'
  order by
    case when profiles.username::text = trim(p_query) then 0 else 1 end,
    profiles.username::text asc
  limit 10;
$$;

create or replace function public.search_profiles_by_username(query_text text)
returns table (
  profile_id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.search_profiles_by_username(query_text);
$$;

create or replace function private.send_acquaintance_request(p_username text)
returns public.acquaintance_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_receiver_id uuid;
  v_request public.acquaintance_requests;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(p_username), '') is null then
    raise exception 'Username is required';
  end if;

  select profiles.id
  into v_receiver_id
  from public.profiles
  where profiles.username = nullif(trim(p_username), '');

  if v_receiver_id is null then
    raise exception 'No GrowT user found with that username';
  end if;

  if v_receiver_id = v_user_id then
    raise exception 'You cannot send an acquaintance request to yourself';
  end if;

  if exists (
    select 1
    from public.acquaintances
    where acquaintances.user_id = v_user_id
      and acquaintances.acquaintance_id = v_receiver_id
  ) then
    raise exception 'You are already acquainted with this user';
  end if;

  if exists (
    select 1
    from public.acquaintance_requests
    where acquaintance_requests.status = 'pending'
      and (
        (
          acquaintance_requests.sender_id = v_user_id
          and acquaintance_requests.receiver_id = v_receiver_id
        )
        or (
          acquaintance_requests.sender_id = v_receiver_id
          and acquaintance_requests.receiver_id = v_user_id
        )
      )
  ) then
    raise exception 'An acquaintance request is already pending';
  end if;

  if exists (
    select 1
    from public.acquaintance_requests
    where acquaintance_requests.status = 'accepted'
      and (
        (
          acquaintance_requests.sender_id = v_user_id
          and acquaintance_requests.receiver_id = v_receiver_id
        )
        or (
          acquaintance_requests.sender_id = v_receiver_id
          and acquaintance_requests.receiver_id = v_user_id
        )
      )
  ) then
    raise exception 'You are already acquainted with this user';
  end if;

  insert into public.acquaintance_requests (sender_id, receiver_id, status)
  values (v_user_id, v_receiver_id, 'pending')
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function public.send_acquaintance_request(username text)
returns public.acquaintance_requests
language sql
security invoker
set search_path = ''
as $$
  select private.send_acquaintance_request(username);
$$;

create or replace function private.accept_acquaintance_request(p_request_id uuid)
returns public.acquaintance_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.acquaintance_requests;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_request
  from public.acquaintance_requests
  where id = p_request_id
    and status = 'pending'
    and receiver_id = v_user_id;

  if v_request.id is null then
    raise exception 'Pending request not found';
  end if;

  update public.acquaintance_requests
  set status = 'accepted'
  where id = p_request_id
  returning * into v_request;

  insert into public.acquaintances (user_id, acquaintance_id)
  values
    (v_request.sender_id, v_request.receiver_id),
    (v_request.receiver_id, v_request.sender_id)
  on conflict (user_id, acquaintance_id) do nothing;

  return v_request;
end;
$$;

create or replace function public.accept_acquaintance_request(request_id uuid)
returns public.acquaintance_requests
language sql
security invoker
set search_path = ''
as $$
  select private.accept_acquaintance_request(request_id);
$$;

create or replace function private.reject_acquaintance_request(p_request_id uuid)
returns public.acquaintance_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.acquaintance_requests;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.acquaintance_requests
  set status = 'rejected'
  where id = p_request_id
    and status = 'pending'
    and receiver_id = v_user_id
  returning * into v_request;

  if v_request.id is null then
    raise exception 'Pending request not found';
  end if;

  return v_request;
end;
$$;

create or replace function public.reject_acquaintance_request(request_id uuid)
returns public.acquaintance_requests
language sql
security invoker
set search_path = ''
as $$
  select private.reject_acquaintance_request(request_id);
$$;

create or replace function private.remove_acquaintance(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_removed_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_user_id is null or p_user_id = v_user_id then
    raise exception 'Invalid acquaintance';
  end if;

  delete from public.acquaintances
  where (
    acquaintances.user_id = v_user_id
    and acquaintances.acquaintance_id = p_user_id
  )
  or (
    acquaintances.user_id = p_user_id
    and acquaintances.acquaintance_id = v_user_id
  );

  get diagnostics v_removed_count = row_count;

  if v_removed_count = 0 then
    raise exception 'Acquaintance not found';
  end if;

  return p_user_id;
end;
$$;

create or replace function public.remove_acquaintance(user_id uuid)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.remove_acquaintance(user_id);
$$;

create or replace function private.list_acquaintances()
returns table (
  relationship_id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    acquaintances.id as relationship_id,
    acquaintances.acquaintance_id as user_id,
    profiles.username::text as username,
    profiles.display_name,
    profiles.avatar_url,
    acquaintances.created_at
  from public.acquaintances
  join public.profiles
    on profiles.id = acquaintances.acquaintance_id
  where acquaintances.user_id = auth.uid()
  order by profiles.display_name nulls last, profiles.username::text asc;
$$;

create or replace function public.list_acquaintances()
returns table (
  relationship_id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_acquaintances();
$$;

create or replace function private.list_acquaintance_requests()
returns table (
  request_id uuid,
  direction text,
  sender_id uuid,
  receiver_id uuid,
  status text,
  sender_username text,
  sender_display_name text,
  sender_avatar_url text,
  receiver_username text,
  receiver_display_name text,
  receiver_avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    requests.id as request_id,
    case when requests.receiver_id = auth.uid() then 'incoming' else 'outgoing' end as direction,
    requests.sender_id,
    requests.receiver_id,
    requests.status,
    sender_profile.username::text as sender_username,
    sender_profile.display_name as sender_display_name,
    sender_profile.avatar_url as sender_avatar_url,
    receiver_profile.username::text as receiver_username,
    receiver_profile.display_name as receiver_display_name,
    receiver_profile.avatar_url as receiver_avatar_url,
    requests.created_at,
    requests.updated_at
  from public.acquaintance_requests as requests
  join public.profiles as sender_profile
    on sender_profile.id = requests.sender_id
  join public.profiles as receiver_profile
    on receiver_profile.id = requests.receiver_id
  where requests.status = 'pending'
    and auth.uid() in (requests.sender_id, requests.receiver_id)
  order by requests.created_at desc;
$$;

create or replace function public.list_acquaintance_requests()
returns table (
  request_id uuid,
  direction text,
  sender_id uuid,
  receiver_id uuid,
  status text,
  sender_username text,
  sender_display_name text,
  sender_avatar_url text,
  receiver_username text,
  receiver_display_name text,
  receiver_avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_acquaintance_requests();
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'acquaintance_requests'
  ) then
    alter publication supabase_realtime add table public.acquaintance_requests;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'acquaintances'
  ) then
    alter publication supabase_realtime add table public.acquaintances;
  end if;
end;
$$;

revoke execute on function private.search_profiles_by_username(text) from public, anon;
revoke execute on function public.search_profiles_by_username(text) from public, anon;
revoke execute on function private.send_acquaintance_request(text) from public, anon;
revoke execute on function public.send_acquaintance_request(text) from public, anon;
revoke execute on function private.accept_acquaintance_request(uuid) from public, anon;
revoke execute on function public.accept_acquaintance_request(uuid) from public, anon;
revoke execute on function private.reject_acquaintance_request(uuid) from public, anon;
revoke execute on function public.reject_acquaintance_request(uuid) from public, anon;
revoke execute on function private.remove_acquaintance(uuid) from public, anon;
revoke execute on function public.remove_acquaintance(uuid) from public, anon;
revoke execute on function private.list_acquaintances() from public, anon;
revoke execute on function public.list_acquaintances() from public, anon;
revoke execute on function private.list_acquaintance_requests() from public, anon;
revoke execute on function public.list_acquaintance_requests() from public, anon;

grant execute on function private.search_profiles_by_username(text) to authenticated;
grant execute on function public.search_profiles_by_username(text) to authenticated;
grant execute on function private.send_acquaintance_request(text) to authenticated;
grant execute on function public.send_acquaintance_request(text) to authenticated;
grant execute on function private.accept_acquaintance_request(uuid) to authenticated;
grant execute on function public.accept_acquaintance_request(uuid) to authenticated;
grant execute on function private.reject_acquaintance_request(uuid) to authenticated;
grant execute on function public.reject_acquaintance_request(uuid) to authenticated;
grant execute on function private.remove_acquaintance(uuid) to authenticated;
grant execute on function public.remove_acquaintance(uuid) to authenticated;
grant execute on function private.list_acquaintances() to authenticated;
grant execute on function public.list_acquaintances() to authenticated;
grant execute on function private.list_acquaintance_requests() to authenticated;
grant execute on function public.list_acquaintance_requests() to authenticated;
