-- GrowT starter schema for a hosted Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.growt_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growt_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growt_checkpoints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.growt_workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'paused', 'complete')),
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_growt_profiles_updated_at on public.growt_profiles;
create trigger set_growt_profiles_updated_at
before update on public.growt_profiles
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_growt_workspaces_updated_at on public.growt_workspaces;
create trigger set_growt_workspaces_updated_at
before update on public.growt_workspaces
for each row
execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_growt_checkpoints_updated_at on public.growt_checkpoints;
create trigger set_growt_checkpoints_updated_at
before update on public.growt_checkpoints
for each row
execute function public.set_current_timestamp_updated_at();

alter table public.growt_profiles enable row level security;
alter table public.growt_workspaces enable row level security;
alter table public.growt_checkpoints enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.growt_profiles to authenticated;
grant select, insert, update, delete on public.growt_workspaces to authenticated;
grant select, insert, update, delete on public.growt_checkpoints to authenticated;

drop policy if exists "Users can read own profile" on public.growt_profiles;
create policy "Users can read own profile"
on public.growt_profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.growt_profiles;
create policy "Users can insert own profile"
on public.growt_profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.growt_profiles;
create policy "Users can update own profile"
on public.growt_profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Owners can manage workspaces" on public.growt_workspaces;
create policy "Owners can manage workspaces"
on public.growt_workspaces
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can manage checkpoints" on public.growt_checkpoints;
create policy "Owners can manage checkpoints"
on public.growt_checkpoints
for all
to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.growt_workspaces
    where growt_workspaces.id = growt_checkpoints.workspace_id
      and growt_workspaces.owner_id = (select auth.uid())
  )
);
