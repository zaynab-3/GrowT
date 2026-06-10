-- Migration: add_invite_links
-- Description: Create invites table and RPC for the share link feature

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null check (resource_type in ('folder', 'task')),
  resource_id uuid not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.invites enable row level security;

create policy "Invites are readable by everyone." on public.invites
  for select using (true);

create policy "Users can insert their own invites." on public.invites
  for insert with check (auth.uid() = created_by);

create policy "Users can delete their own invites." on public.invites
  for delete using (auth.uid() = created_by);

create or replace function private.accept_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_invite public.invites;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_invite from public.invites where id = p_invite_id;
  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.expires_at < now() then
    raise exception 'Invite has expired';
  end if;

  -- Add mutual acquaintances
  if v_user_id != v_invite.created_by then
    insert into public.acquaintances (user_id, acquaintance_id)
    values (v_user_id, v_invite.created_by)
    on conflict do nothing;

    insert into public.acquaintances (user_id, acquaintance_id)
    values (v_invite.created_by, v_user_id)
    on conflict do nothing;
  end if;

  -- Add to resource
  if v_invite.resource_type = 'folder' then
    insert into public.folder_members (folder_id, user_id, role)
    values (v_invite.resource_id, v_user_id, 'member')
    on conflict (folder_id, user_id) do nothing;
  elsif v_invite.resource_type = 'task' then
    insert into public.task_members (task_id, user_id, role)
    values (v_invite.resource_id, v_user_id, 'member')
    on conflict (task_id, user_id) do nothing;
  end if;

  return jsonb_build_object(
    'resource_type', v_invite.resource_type,
    'resource_id', v_invite.resource_id
  );
end;
$$;

-- Allow authenticated users to call the accept_invite RPC
grant execute on function private.accept_invite(uuid) to authenticated;

-- Expose via API
create or replace function public.accept_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  return private.accept_invite(p_invite_id);
end;
$$;
