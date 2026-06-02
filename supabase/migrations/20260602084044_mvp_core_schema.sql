-- GrowT canonical MVP schema.
-- Non-destructive: keeps the early growt_* prototype tables in place while the
-- frontend migrates to the production app shape.

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username citext unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acquaintance_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint acquaintance_requests_not_self check (sender_id <> receiver_id)
);

create unique index if not exists acquaintance_requests_pending_pair_key
on public.acquaintance_requests (sender_id, receiver_id)
where status = 'pending';

create table if not exists public.acquaintances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  acquaintance_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint acquaintances_not_self check (user_id <> acquaintance_id),
  constraint acquaintances_user_pair_key unique (user_id, acquaintance_id)
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'personal'
    check (category in ('work', 'personal', 'shared')),
  is_shared boolean not null default false,
  is_active boolean not null default true,
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.folder_members (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.folders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint folder_members_folder_user_key unique (folder_id, user_id)
);

create table if not exists public.folder_share_links (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.folders(id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  assigned_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'personal'
    check (category in ('work', 'personal', 'shared')),
  is_active boolean not null default true,
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.task_levels (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_progress (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  task_level_id uuid references public.task_levels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('ongoing', 'half_done', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists task_progress_task_user_root_key
on public.task_progress (task_id, user_id)
where task_level_id is null;

create unique index if not exists task_progress_task_level_user_key
on public.task_progress (task_id, task_level_id, user_id)
where task_level_id is not null;

create table if not exists public.task_status_actions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  task_level_id uuid references public.task_levels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  old_status text check (old_status is null or old_status in ('ongoing', 'half_done', 'completed')),
  new_status text not null check (new_status in ('ongoing', 'half_done', 'completed')),
  is_undone boolean not null default false,
  undone_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  folder_id uuid references public.folders(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  task_level_id uuid references public.task_levels(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists acquaintance_requests_sender_idx on public.acquaintance_requests (sender_id, status);
create index if not exists acquaintance_requests_receiver_idx on public.acquaintance_requests (receiver_id, status);
create index if not exists acquaintances_user_idx on public.acquaintances (user_id);
create index if not exists folders_owner_idx on public.folders (owner_id, deleted_at);
create index if not exists folder_members_user_idx on public.folder_members (user_id);
create index if not exists folder_members_folder_idx on public.folder_members (folder_id);
create index if not exists tasks_folder_idx on public.tasks (folder_id, deleted_at, position);
create index if not exists tasks_owner_idx on public.tasks (owner_id, deleted_at);
create index if not exists task_levels_task_idx on public.task_levels (task_id, position);
create index if not exists task_progress_task_idx on public.task_progress (task_id, status);
create index if not exists task_progress_user_idx on public.task_progress (user_id, status);
create index if not exists task_status_actions_task_user_idx on public.task_status_actions (task_id, user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, read_at, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_acquaintance_requests_updated_at on public.acquaintance_requests;
create trigger set_acquaintance_requests_updated_at
before update on public.acquaintance_requests
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_folders_updated_at on public.folders;
create trigger set_folders_updated_at
before update on public.folders
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_folder_members_updated_at on public.folder_members;
create trigger set_folder_members_updated_at
before update on public.folder_members
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_folder_share_links_updated_at on public.folder_share_links;
create trigger set_folder_share_links_updated_at
before update on public.folder_share_links
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_task_levels_updated_at on public.task_levels;
create trigger set_task_levels_updated_at
before update on public.task_levels
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_task_progress_updated_at on public.task_progress;
create trigger set_task_progress_updated_at
before update on public.task_progress
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_task_status_actions_updated_at on public.task_status_actions;
create trigger set_task_status_actions_updated_at
before update on public.task_status_actions
for each row execute function public.set_current_timestamp_updated_at();

create or replace function private.is_folder_owner(p_folder_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.folders
    where id = p_folder_id
      and owner_id = p_user_id
      and deleted_at is null
  );
$$;

create or replace function private.can_access_folder(p_folder_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.folders
    where id = p_folder_id
      and owner_id = p_user_id
      and deleted_at is null
  )
  or exists (
    select 1
    from public.folder_members
    join public.folders on folders.id = folder_members.folder_id
    where folder_members.folder_id = p_folder_id
      and folder_members.user_id = p_user_id
      and folders.deleted_at is null
  );
$$;

create or replace function private.can_access_task(p_task_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks
    where tasks.id = p_task_id
      and tasks.deleted_at is null
      and (
        tasks.owner_id = p_user_id
        or (
          tasks.folder_id is not null
          and private.can_access_folder(tasks.folder_id, p_user_id)
        )
      )
  );
$$;

create or replace function private.set_task_progress(
  p_task_id uuid,
  p_task_level_id uuid,
  p_new_status text
)
returns public.task_status_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_old_status text;
  v_action public.task_status_actions;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_new_status not in ('ongoing', 'half_done', 'completed') then
    raise exception 'Invalid status: %', p_new_status;
  end if;

  if not private.can_access_task(p_task_id, v_user_id) then
    raise exception 'You do not have access to this task';
  end if;

  if p_task_level_id is not null and not exists (
    select 1
    from public.task_levels
    where id = p_task_level_id
      and task_id = p_task_id
  ) then
    raise exception 'Task level does not belong to task';
  end if;

  select status
  into v_old_status
  from public.task_progress
  where task_id = p_task_id
    and user_id = v_user_id
    and task_level_id is not distinct from p_task_level_id;

  if v_old_status is not distinct from p_new_status then
    select *
    into v_action
    from public.task_status_actions
    where task_id = p_task_id
      and user_id = v_user_id
      and task_level_id is not distinct from p_task_level_id
    order by created_at desc
    limit 1;

    return v_action;
  end if;

  if v_old_status is null then
    insert into public.task_progress (task_id, task_level_id, user_id, status)
    values (p_task_id, p_task_level_id, v_user_id, p_new_status);
  else
    update public.task_progress
    set status = p_new_status
    where task_id = p_task_id
      and user_id = v_user_id
      and task_level_id is not distinct from p_task_level_id;
  end if;

  insert into public.task_status_actions (
    task_id,
    task_level_id,
    user_id,
    old_status,
    new_status
  )
  values (
    p_task_id,
    p_task_level_id,
    v_user_id,
    v_old_status,
    p_new_status
  )
  returning * into v_action;

  return v_action;
end;
$$;

create or replace function private.undo_latest_task_progress(
  p_task_id uuid,
  p_task_level_id uuid
)
returns public.task_status_actions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_action public.task_status_actions;
  v_current_status text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not private.can_access_task(p_task_id, v_user_id) then
    raise exception 'You do not have access to this task';
  end if;

  select *
  into v_action
  from public.task_status_actions
  where task_id = p_task_id
    and user_id = v_user_id
    and task_level_id is not distinct from p_task_level_id
    and is_undone = false
  order by created_at desc
  limit 1
  for update;

  if v_action.id is null then
    raise exception 'No undoable action found';
  end if;

  select status
  into v_current_status
  from public.task_progress
  where task_id = p_task_id
    and user_id = v_user_id
    and task_level_id is not distinct from p_task_level_id;

  if v_current_status is distinct from v_action.new_status then
    raise exception 'Progress changed since this action';
  end if;

  if v_action.old_status is null then
    delete from public.task_progress
    where task_id = p_task_id
      and user_id = v_user_id
      and task_level_id is not distinct from p_task_level_id;
  else
    update public.task_progress
    set status = v_action.old_status
    where task_id = p_task_id
      and user_id = v_user_id
      and task_level_id is not distinct from p_task_level_id;
  end if;

  update public.task_status_actions
  set is_undone = true,
      undone_at = now()
  where id = v_action.id
  returning * into v_action;

  return v_action;
end;
$$;

create or replace function public.set_task_progress(
  task_id uuid,
  task_level_id uuid,
  new_status text
)
returns public.task_status_actions
language sql
security invoker
set search_path = ''
as $$
  select private.set_task_progress(task_id, task_level_id, new_status);
$$;

create or replace function public.undo_latest_task_progress(
  task_id uuid,
  task_level_id uuid
)
returns public.task_status_actions
language sql
security invoker
set search_path = ''
as $$
  select private.undo_latest_task_progress(task_id, task_level_id);
$$;

alter table public.profiles enable row level security;
alter table public.acquaintance_requests enable row level security;
alter table public.acquaintances enable row level security;
alter table public.folders enable row level security;
alter table public.folder_members enable row level security;
alter table public.folder_share_links enable row level security;
alter table public.tasks enable row level security;
alter table public.task_levels enable row level security;
alter table public.task_progress enable row level security;
alter table public.task_status_actions enable row level security;
alter table public.notifications enable row level security;

grant usage on schema public to authenticated;
grant usage on schema private to authenticated;

grant select on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;

grant select, insert, update, delete on public.acquaintance_requests to authenticated;
grant select, delete on public.acquaintances to authenticated;
grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.folder_members to authenticated;
grant select, insert, update, delete on public.folder_share_links to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.task_levels to authenticated;
grant select on public.task_progress to authenticated;
grant select on public.task_status_actions to authenticated;
grant select, update on public.notifications to authenticated;

grant execute on function public.set_task_progress(uuid, uuid, text) to authenticated;
grant execute on function public.undo_latest_task_progress(uuid, uuid) to authenticated;
grant execute on function private.set_task_progress(uuid, uuid, text) to authenticated;
grant execute on function private.undo_latest_task_progress(uuid, uuid) to authenticated;

create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can view own acquaintance requests"
on public.acquaintance_requests for select
to authenticated
using ((select auth.uid()) in (sender_id, receiver_id));

create policy "Users can send acquaintance requests"
on public.acquaintance_requests for insert
to authenticated
with check ((select auth.uid()) = sender_id);

create policy "Receivers can answer acquaintance requests"
on public.acquaintance_requests for update
to authenticated
using ((select auth.uid()) = receiver_id)
with check ((select auth.uid()) = receiver_id);

create policy "Users can delete own pending sent requests"
on public.acquaintance_requests for delete
to authenticated
using ((select auth.uid()) = sender_id and status = 'pending');

create policy "Users can view own acquaintances"
on public.acquaintances for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can remove own acquaintances"
on public.acquaintances for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view accessible folders"
on public.folders for select
to authenticated
using (private.can_access_folder(id, (select auth.uid())));

create policy "Users can create owned folders"
on public.folders for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Owners can update folders"
on public.folders for update
to authenticated
using (private.is_folder_owner(id, (select auth.uid())))
with check (private.is_folder_owner(id, (select auth.uid())));

create policy "Owners can delete folders"
on public.folders for delete
to authenticated
using (private.is_folder_owner(id, (select auth.uid())));

create policy "Members can view folder memberships"
on public.folder_members for select
to authenticated
using (private.can_access_folder(folder_id, (select auth.uid())));

create policy "Folder owners can add members"
on public.folder_members for insert
to authenticated
with check (private.is_folder_owner(folder_id, (select auth.uid())));

create policy "Folder owners can update members"
on public.folder_members for update
to authenticated
using (private.is_folder_owner(folder_id, (select auth.uid())))
with check (private.is_folder_owner(folder_id, (select auth.uid())));

create policy "Folder owners or users can remove memberships"
on public.folder_members for delete
to authenticated
using (
  private.is_folder_owner(folder_id, (select auth.uid()))
  or ((select auth.uid()) = user_id and role <> 'owner')
);

create policy "Folder owners can manage share links"
on public.folder_share_links for all
to authenticated
using (private.is_folder_owner(folder_id, (select auth.uid())))
with check (private.is_folder_owner(folder_id, (select auth.uid())));

create policy "Users can view accessible tasks"
on public.tasks for select
to authenticated
using (private.can_access_task(id, (select auth.uid())));

create policy "Users can create tasks they own in accessible spaces"
on public.tasks for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and (
    folder_id is null
    or private.can_access_folder(folder_id, (select auth.uid()))
  )
);

create policy "Task owners or folder owners can update tasks"
on public.tasks for update
to authenticated
using (
  (select auth.uid()) = owner_id
  or (folder_id is not null and private.is_folder_owner(folder_id, (select auth.uid())))
)
with check (
  (select auth.uid()) = owner_id
  or (folder_id is not null and private.is_folder_owner(folder_id, (select auth.uid())))
);

create policy "Task owners or folder owners can delete tasks"
on public.tasks for delete
to authenticated
using (
  (select auth.uid()) = owner_id
  or (folder_id is not null and private.is_folder_owner(folder_id, (select auth.uid())))
);

create policy "Users can view accessible task levels"
on public.task_levels for select
to authenticated
using (private.can_access_task(task_id, (select auth.uid())));

create policy "Task owners or folder owners can create task levels"
on public.task_levels for insert
to authenticated
with check (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_levels.task_id
      and (
        tasks.owner_id = (select auth.uid())
        or (
          tasks.folder_id is not null
          and private.is_folder_owner(tasks.folder_id, (select auth.uid()))
        )
      )
  )
);

create policy "Task owners or folder owners can update task levels"
on public.task_levels for update
to authenticated
using (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_levels.task_id
      and (
        tasks.owner_id = (select auth.uid())
        or (
          tasks.folder_id is not null
          and private.is_folder_owner(tasks.folder_id, (select auth.uid()))
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_levels.task_id
      and (
        tasks.owner_id = (select auth.uid())
        or (
          tasks.folder_id is not null
          and private.is_folder_owner(tasks.folder_id, (select auth.uid()))
        )
      )
  )
);

create policy "Task owners or folder owners can delete task levels"
on public.task_levels for delete
to authenticated
using (
  exists (
    select 1
    from public.tasks
    where tasks.id = task_levels.task_id
      and (
        tasks.owner_id = (select auth.uid())
        or (
          tasks.folder_id is not null
          and private.is_folder_owner(tasks.folder_id, (select auth.uid()))
        )
      )
  )
);

create policy "Users can view progress on accessible tasks"
on public.task_progress for select
to authenticated
using (private.can_access_task(task_id, (select auth.uid())));

create policy "Users can view actions on accessible tasks"
on public.task_status_actions for select
to authenticated
using (private.can_access_task(task_id, (select auth.uid())));

create policy "Users can view own notifications"
on public.notifications for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'acquaintance_requests',
    'folders',
    'folder_members',
    'tasks',
    'task_levels',
    'task_progress',
    'task_status_actions',
    'notifications'
  ];
begin
  foreach table_name in array realtime_tables
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
