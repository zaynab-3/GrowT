alter table public.profiles
  alter column theme_mode set default 'system';

alter table public.profiles
  drop constraint if exists profiles_theme_mode_check,
  add constraint profiles_theme_mode_check
    check (theme_mode in ('system', 'light', 'dark'));

update public.profiles
set theme_mode = 'system'
where theme_mode = 'light';
