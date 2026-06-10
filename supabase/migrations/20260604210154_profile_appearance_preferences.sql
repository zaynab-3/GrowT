alter table public.profiles
  add column if not exists theme_mode text not null default 'light',
  add column if not exists color_palette text not null default 'sage',
  add column if not exists avatar_choice text not null default 'default';

alter table public.profiles
  drop constraint if exists profiles_theme_mode_check,
  add constraint profiles_theme_mode_check
    check (theme_mode in ('light', 'dark'));

alter table public.profiles
  drop constraint if exists profiles_color_palette_check,
  add constraint profiles_color_palette_check
    check (color_palette in ('sage', 'duck', 'penguin', 'sprout', 'rose', 'lavender'));

alter table public.profiles
  drop constraint if exists profiles_avatar_choice_check,
  add constraint profiles_avatar_choice_check
    check (avatar_choice in ('default', 'duck', 'penguin', 'sprout'));
