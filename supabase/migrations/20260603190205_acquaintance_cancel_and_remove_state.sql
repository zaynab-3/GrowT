alter table public.acquaintance_requests
drop constraint if exists acquaintance_requests_status_check;

alter table public.acquaintance_requests
add constraint acquaintance_requests_status_check
check (status in ('pending', 'accepted', 'rejected', 'cancelled'));

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

  insert into public.acquaintance_requests (sender_id, receiver_id, status)
  values (v_user_id, v_receiver_id, 'pending')
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function private.cancel_acquaintance_request(p_request_id uuid)
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
  set status = 'cancelled'
  where id = p_request_id
    and status = 'pending'
    and sender_id = v_user_id
  returning * into v_request;

  if v_request.id is null then
    raise exception 'Pending outgoing request not found';
  end if;

  return v_request;
end;
$$;

create or replace function public.cancel_acquaintance_request(request_id uuid)
returns public.acquaintance_requests
language sql
security invoker
set search_path = ''
as $$
  select private.cancel_acquaintance_request(request_id);
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

revoke execute on function private.cancel_acquaintance_request(uuid) from public, anon;
revoke execute on function public.cancel_acquaintance_request(uuid) from public, anon;

grant execute on function private.cancel_acquaintance_request(uuid) to authenticated;
grant execute on function public.cancel_acquaintance_request(uuid) to authenticated;
