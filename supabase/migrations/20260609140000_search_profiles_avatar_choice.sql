drop function if exists public.search_profiles_with_relationship(text);
drop function if exists private.search_profiles_with_relationship(text);

create or replace function private.search_profiles_with_relationship(p_query text)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  avatar_choice text,
  relationship_status text,
  request_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  with normalized as (
    select nullif(trim(p_query), '') as query_text
  ),
  candidates as (
    select
      profiles.id as profile_id,
      profiles.username::text as username,
      profiles.display_name,
      profiles.avatar_url,
      profiles.avatar_choice,
      case
        when profiles.username::text = normalized.query_text then 0
        when profiles.username::text ilike normalized.query_text || '%' then 1
        else 2
      end as match_rank
    from public.profiles
    cross join normalized
    where auth.uid() is not null
      and normalized.query_text is not null
      and profiles.id <> auth.uid()
      and profiles.username is not null
      and profiles.username::text ilike '%' || normalized.query_text || '%'
    order by match_rank, profiles.username::text asc
    limit 10
  )
  select
    candidates.profile_id as user_id,
    candidates.username,
    candidates.display_name,
    candidates.avatar_url,
    candidates.avatar_choice,
    case
      when acquaintances.id is not null then 'acquaintance'
      when outgoing_request.id is not null then 'pending_outgoing'
      when incoming_request.id is not null then 'pending_incoming'
      else 'none'
    end::text as relationship_status,
    coalesce(outgoing_request.id, incoming_request.id) as request_id
  from candidates
  left join public.acquaintances
    on acquaintances.user_id = auth.uid()
   and acquaintances.acquaintance_id = candidates.profile_id
  left join lateral (
    select acquaintance_requests.id
    from public.acquaintance_requests
    where acquaintance_requests.sender_id = auth.uid()
      and acquaintance_requests.receiver_id = candidates.profile_id
      and acquaintance_requests.status = 'pending'
    order by acquaintance_requests.created_at desc
    limit 1
  ) as outgoing_request on true
  left join lateral (
    select acquaintance_requests.id
    from public.acquaintance_requests
    where acquaintance_requests.sender_id = candidates.profile_id
      and acquaintance_requests.receiver_id = auth.uid()
      and acquaintance_requests.status = 'pending'
    order by acquaintance_requests.created_at desc
    limit 1
  ) as incoming_request on true
  order by candidates.match_rank, candidates.username asc;
$$;

create or replace function public.search_profiles_with_relationship(query_text text)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  avatar_choice text,
  relationship_status text,
  request_id uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.search_profiles_with_relationship(query_text);
$$;

revoke execute on function private.search_profiles_with_relationship(text) from public, anon;
revoke execute on function public.search_profiles_with_relationship(text) from public, anon;

grant execute on function private.search_profiles_with_relationship(text) to authenticated;
grant execute on function public.search_profiles_with_relationship(text) to authenticated;
