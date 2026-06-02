-- Fixes Supabase security advisor warnings from the MVP schema migration.

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_extension
    join pg_namespace on pg_namespace.oid = pg_extension.extnamespace
    where pg_extension.extname = 'citext'
      and pg_namespace.nspname = 'public'
  ) then
    alter extension citext set schema extensions;
  end if;
end;
$$;
