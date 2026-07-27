alter table public.profiles
  drop constraint if exists profiles_color_palette_check,
  add constraint profiles_color_palette_check
    check (
      color_palette in (
        'sage',
        'duck',
        'penguin',
        'sprout',
        'rose',
        'lavender',
        'watermelon',
        'coffee',
        'wine'
      )
    );

alter table public.profiles
  drop constraint if exists profiles_avatar_choice_check,
  add constraint profiles_avatar_choice_check
    check (
      avatar_choice in (
        'default',
        'duck',
        'penguin',
        'sprout',
        'cat1',
        'butterfly',
        'moonsun',
        'blueheart'
      )
    );
