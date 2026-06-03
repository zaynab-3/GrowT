create or replace function private.create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_folder_id uuid default null,
  p_task_id uuid default null,
  p_task_level_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    return;
  end if;

  if p_actor_id is not null and p_user_id = p_actor_id then
    return;
  end if;

  insert into public.notifications (
    user_id,
    actor_id,
    type,
    title,
    message,
    folder_id,
    task_id,
    task_level_id
  )
  values (
    p_user_id,
    p_actor_id,
    p_type,
    p_title,
    p_message,
    p_folder_id,
    p_task_id,
    p_task_level_id
  );
end;
$$;

create or replace function private.profile_label(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    nullif(trim(profiles.display_name), ''),
    case when profiles.username is not null then '@' || profiles.username::text else null end,
    'Someone'
  )
  from public.profiles
  where profiles.id = p_user_id;
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
  v_actor_label text;
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

  v_actor_label := coalesce(private.profile_label(v_user_id), 'Someone');

  perform private.create_notification(
    v_receiver_id,
    v_user_id,
    'acquaintance_request_received',
    'Acquaintance request',
    v_actor_label || ' sent you an acquaintance request.'
  );

  return v_request;
end;
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
  v_actor_label text;
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

  v_actor_label := coalesce(private.profile_label(v_user_id), 'Someone');

  perform private.create_notification(
    v_request.sender_id,
    v_user_id,
    'acquaintance_request_accepted',
    'Request accepted',
    v_actor_label || ' accepted your acquaintance request.'
  );

  return v_request;
end;
$$;

create or replace function private.add_folder_member(
  p_folder_id uuid,
  p_username text
)
returns public.folder_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_folder public.folders;
  v_profile public.profiles;
  v_member public.folder_members;
  v_was_member boolean;
  v_actor_label text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_folder_id is null then
    raise exception 'Folder is required';
  end if;

  if nullif(trim(p_username), '') is null then
    raise exception 'Username is required';
  end if;

  select *
  into v_folder
  from public.folders
  where id = p_folder_id
    and deleted_at is null;

  if v_folder.id is null then
    raise exception 'Folder not found';
  end if;

  if v_folder.owner_id <> v_user_id then
    raise exception 'Only the folder owner can add members';
  end if;

  if v_folder.category <> 'shared' and not v_folder.is_shared then
    raise exception 'Convert this folder to Shared before adding members';
  end if;

  select *
  into v_profile
  from public.profiles
  where username = nullif(trim(p_username), '');

  if v_profile.id is null then
    raise exception 'No GrowT user found with that username';
  end if;

  select exists (
    select 1
    from public.folder_members
    where folder_id = v_folder.id
      and user_id = v_profile.id
  )
  into v_was_member;

  insert into public.folder_members (folder_id, user_id, role)
  values (
    v_folder.id,
    v_profile.id,
    case when v_profile.id = v_folder.owner_id then 'owner' else 'member' end
  )
  on conflict (folder_id, user_id) do update
  set
    role = case
      when excluded.user_id = v_folder.owner_id then 'owner'
      else public.folder_members.role
    end,
    updated_at = now()
  returning * into v_member;

  if not v_was_member and v_profile.id <> v_user_id then
    v_actor_label := coalesce(private.profile_label(v_user_id), 'Someone');

    perform private.create_notification(
      v_profile.id,
      v_user_id,
      'shared_folder_added',
      'Shared folder',
      v_actor_label || ' added you to "' || v_folder.title || '".',
      v_folder.id,
      null,
      null
    );
  end if;

  return v_member;
end;
$$;

create or replace function public.add_folder_member(
  folder_id uuid,
  username text
)
returns public.folder_members
language sql
security invoker
set search_path = ''
as $$
  select private.add_folder_member(folder_id, username);
$$;

create or replace function private.add_task_member(
  p_task_id uuid,
  p_username text
)
returns public.task_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_task public.tasks;
  v_profile public.profiles;
  v_member public.task_members;
  v_was_member boolean;
  v_actor_label text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_task
  from public.tasks
  where id = p_task_id
    and deleted_at is null;

  if v_task.id is null then
    raise exception 'Task not found';
  end if;

  if v_task.folder_id is not null then
    raise exception 'Task members are only for standalone tasks';
  end if;

  if v_task.category <> 'shared' then
    raise exception 'Change this task to Shared before adding members';
  end if;

  if v_task.owner_id <> v_user_id then
    raise exception 'Only the task owner can add members';
  end if;

  select *
  into v_profile
  from public.profiles
  where username = nullif(trim(p_username), '');

  if v_profile.id is null then
    raise exception 'No GrowT user found with that username';
  end if;

  select exists (
    select 1
    from public.task_members
    where task_id = v_task.id
      and user_id = v_profile.id
  )
  into v_was_member;

  insert into public.task_members (task_id, user_id, role)
  values (
    v_task.id,
    v_profile.id,
    case when v_profile.id = v_task.owner_id then 'owner' else 'member' end
  )
  on conflict (task_id, user_id) do update
  set role = case when excluded.user_id = v_task.owner_id then 'owner' else public.task_members.role end
  returning * into v_member;

  if not v_was_member and v_profile.id <> v_user_id then
    v_actor_label := coalesce(private.profile_label(v_user_id), 'Someone');

    perform private.create_notification(
      v_profile.id,
      v_user_id,
      'shared_task_added',
      'Shared task',
      v_actor_label || ' added you to "' || v_task.title || '".',
      null,
      v_task.id,
      null
    );
  end if;

  return v_member;
end;
$$;

revoke execute on function private.create_notification(uuid, uuid, text, text, text, uuid, uuid, uuid) from public, anon;
revoke execute on function private.profile_label(uuid) from public, anon;
revoke execute on function private.add_folder_member(uuid, text) from public, anon;
revoke execute on function public.add_folder_member(uuid, text) from public, anon;

grant execute on function private.create_notification(uuid, uuid, text, text, text, uuid, uuid, uuid) to authenticated;
grant execute on function private.profile_label(uuid) to authenticated;
grant execute on function private.add_folder_member(uuid, text) to authenticated;
grant execute on function public.add_folder_member(uuid, text) to authenticated;
