-- Put new standalone tasks first, make invite acceptance resilient, and expose
-- a sanitized view-only payload for standalone task share links.

create or replace function private.place_new_standalone_task_first()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.folder_id is null and new.deleted_at is null then
    update public.tasks
    set position = position + 1
    where folder_id is null
      and owner_id = new.owner_id
      and deleted_at is null;

    new.position := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists place_new_standalone_task_first on public.tasks;
create trigger place_new_standalone_task_first
before insert on public.tasks
for each row execute function private.place_new_standalone_task_first();

revoke execute on function private.place_new_standalone_task_first() from public, anon, authenticated;

create or replace function private.list_standalone_tasks()
returns setof public.tasks
language sql
stable
security definer
set search_path = ''
as $$
  select tasks.*
  from public.tasks
  where tasks.folder_id is null
    and tasks.deleted_at is null
    and (
      tasks.owner_id = auth.uid()
      or (
        tasks.category = 'shared'
        and exists (
          select 1
          from public.task_members
          where task_members.task_id = tasks.id
            and task_members.user_id = auth.uid()
        )
      )
    )
  order by tasks.position asc, tasks.created_at desc, tasks.id asc;
$$;

drop policy if exists "Invites are readable by everyone." on public.invites;
drop policy if exists "Invite creators can read their invites." on public.invites;
create policy "Invite creators can read their invites."
on public.invites for select
to authenticated
using (auth.uid() = created_by);

create or replace function private.accept_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invites;
  v_user_id uuid := auth.uid();
  v_resource_owner_id uuid;
begin
  if v_user_id is null then
    raise exception 'Sign in to join this shared item';
  end if;

  select *
  into v_invite
  from public.invites
  where id = p_invite_id;

  if v_invite.id is null then
    raise exception 'Invite not found';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  if v_invite.resource_type = 'folder' then
    select owner_id
    into v_resource_owner_id
    from public.folders
    where id = v_invite.resource_id
      and deleted_at is null;
  elsif v_invite.resource_type = 'task' then
    select owner_id
    into v_resource_owner_id
    from public.tasks
    where id = v_invite.resource_id
      and deleted_at is null;
  else
    raise exception 'Unsupported invite type';
  end if;

  if v_resource_owner_id is null or v_resource_owner_id <> v_invite.created_by then
    raise exception 'This invite is no longer valid';
  end if;

  if v_user_id <> v_resource_owner_id then
    insert into public.acquaintances (user_id, acquaintance_id)
    values
      (v_user_id, v_resource_owner_id),
      (v_resource_owner_id, v_user_id)
    on conflict (user_id, acquaintance_id) do nothing;

    update public.acquaintance_requests
    set status = 'accepted'
    where status = 'pending'
      and (
        (sender_id = v_user_id and receiver_id = v_resource_owner_id)
        or (sender_id = v_resource_owner_id and receiver_id = v_user_id)
      );
  end if;

  if v_invite.resource_type = 'folder' then
    insert into public.folder_members (folder_id, user_id, role)
    values (v_invite.resource_id, v_user_id, case when v_user_id = v_resource_owner_id then 'owner' else 'member' end)
    on conflict (folder_id, user_id) do nothing;
  else
    insert into public.task_members (task_id, user_id, role)
    values (v_invite.resource_id, v_user_id, case when v_user_id = v_resource_owner_id then 'owner' else 'member' end)
    on conflict (task_id, user_id) do nothing;
  end if;

  return jsonb_build_object(
    'resource_type', v_invite.resource_type,
    'resource_id', v_invite.resource_id
  );
end;
$$;

create or replace function public.accept_invite(p_invite_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.accept_invite(p_invite_id);
$$;

revoke execute on function private.accept_invite(uuid) from public, anon;
revoke execute on function public.accept_invite(uuid) from public, anon;
grant execute on function private.accept_invite(uuid) to authenticated;
grant execute on function public.accept_invite(uuid) to authenticated;

create or replace function private.get_public_task_share(p_share_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_payload jsonb;
begin
  select jsonb_build_object(
    'task', jsonb_build_object(
      'id', tasks.id,
      'title', tasks.title,
      'description', tasks.description,
      'category', tasks.category,
      'due_date', tasks.due_date,
      'created_at', tasks.created_at,
      'is_active', tasks.is_active
    ),
    'shared_by', jsonb_build_object(
      'display_name', profiles.display_name,
      'username', profiles.username
    ),
    'checklist', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', task_levels.id,
            'title', coalesce(task_levels.title, task_levels.description),
            'position', task_levels.position
          )
          order by task_levels.position asc, task_levels.created_at asc
        )
        from public.task_levels
        where task_levels.task_id = tasks.id
      ),
      '[]'::jsonb
    )
  )
  into v_payload
  from public.invites
  join public.tasks
    on tasks.id = invites.resource_id
   and tasks.owner_id = invites.created_by
   and tasks.folder_id is null
   and tasks.deleted_at is null
  join public.profiles
    on profiles.id = invites.created_by
  where invites.id = p_share_id
    and invites.resource_type = 'task'
    and invites.expires_at >= now();

  if v_payload is null then
    raise exception 'This task link is invalid or has expired';
  end if;

  return v_payload;
end;
$$;

create or replace function public.get_public_task_share(p_share_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.get_public_task_share(p_share_id);
$$;

revoke execute on function private.get_public_task_share(uuid) from public, anon, authenticated;
revoke execute on function public.get_public_task_share(uuid) from public;
grant execute on function public.get_public_task_share(uuid) to anon, authenticated;
