-- Harden task privacy, realtime change payloads, and common list queries.

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
        or (
          tasks.folder_id is null
          and tasks.category = 'shared'
          and exists (
            select 1
            from public.task_members
            where task_members.task_id = tasks.id
              and task_members.user_id = p_user_id
          )
        )
      )
  );
$$;

create index if not exists folders_owner_deleted_position_idx
on public.folders (owner_id, deleted_at, position, updated_at desc);

create index if not exists folder_members_user_folder_role_idx
on public.folder_members (user_id, folder_id, role);

create index if not exists tasks_folder_deleted_position_created_idx
on public.tasks (folder_id, deleted_at, position, created_at);

create index if not exists tasks_owner_standalone_deleted_position_idx
on public.tasks (owner_id, deleted_at, position, created_at)
where folder_id is null;

create index if not exists tasks_assigned_user_deleted_idx
on public.tasks (assigned_user_id, deleted_at)
where assigned_user_id is not null;

create index if not exists task_levels_task_position_created_idx
on public.task_levels (task_id, position, created_at);

create index if not exists task_progress_task_level_user_status_idx
on public.task_progress (task_id, task_level_id, user_id, status);

create index if not exists task_status_actions_task_level_user_created_idx
on public.task_status_actions (task_id, task_level_id, user_id, created_at desc);

create index if not exists task_members_user_task_role_idx
on public.task_members (user_id, task_id, role);

create index if not exists notifications_user_created_idx
on public.notifications (user_id, created_at desc);

create index if not exists acquaintance_requests_receiver_status_created_idx
on public.acquaintance_requests (receiver_id, status, created_at desc);

create index if not exists acquaintance_requests_sender_status_created_idx
on public.acquaintance_requests (sender_id, status, created_at desc);

create index if not exists acquaintances_acquaintance_user_idx
on public.acquaintances (acquaintance_id, user_id);

create index if not exists invites_resource_idx
on public.invites (resource_type, resource_id);

create index if not exists invites_created_by_expires_idx
on public.invites (created_by, expires_at);

alter table public.folders replica identity full;
alter table public.folder_members replica identity full;
alter table public.tasks replica identity full;
alter table public.task_levels replica identity full;
alter table public.task_progress replica identity full;
alter table public.task_status_actions replica identity full;
alter table public.task_members replica identity full;
alter table public.notifications replica identity full;
alter table public.acquaintance_requests replica identity full;
alter table public.acquaintances replica identity full;

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'acquaintance_requests',
    'acquaintances',
    'folders',
    'folder_members',
    'tasks',
    'task_levels',
    'task_progress',
    'task_status_actions',
    'task_members',
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
