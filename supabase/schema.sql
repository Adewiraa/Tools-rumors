create extension if not exists pgcrypto;

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  country_code text not null default 'ID',
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  code text not null,
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (competition_id, code)
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  slug text not null unique,
  ileague_slug text unique,
  ileague_url text,
  primary_color text not null default '#111827',
  secondary_color text not null default '#f3efe2',
  logo_storage_path text,
  logo_public_url text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_seasons (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  head_coach text,
  created_at timestamptz not null default now(),
  unique (club_id, season_id)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  display_name text,
  country_code text not null default 'ID',
  country_name text,
  country_flag_url text,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_rosters (
  id uuid primary key default gen_random_uuid(),
  club_season_id uuid not null references public.club_seasons(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  shirt_number integer,
  position text not null default 'Unknown',
  source_url text,
  created_at timestamptz not null default now(),
  unique (club_season_id, player_id)
);

create index if not exists clubs_ileague_slug_idx on public.clubs (ileague_slug);
create index if not exists club_rosters_club_season_idx on public.club_rosters (club_season_id);
create index if not exists players_country_code_idx on public.players (country_code);

insert into public.competitions (code, name, country_code)
values ('BRI_SUPER_LEAGUE', 'BRI Super League', 'ID')
on conflict (code) do nothing;

insert into public.clubs
  (name, short_name, slug, ileague_slug, ileague_url, primary_color, secondary_color, city)
values
  (
    'Arema FC',
    'AREMA',
    'arema-fc',
    'AREMA_FC',
    'https://ileague.id/clubs/single/BRI_SUPER_LEAGUE_2025-26/AREMA_FC',
    '#2563eb',
    '#f3efe2',
    'Malang'
  ),
  (
    'Bali United FC',
    'BALI',
    'bali-united-fc',
    'BALI_UNITED_FC',
    'https://ileague.id/clubs/single/BRI_SUPER_LEAGUE_2025-26/BALI_UNITED_FC',
    '#dc2626',
    '#f3efe2',
    'Gianyar'
  )
on conflict (slug) do update set
  short_name = excluded.short_name,
  ileague_slug = excluded.ileague_slug,
  ileague_url = excluded.ileague_url,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  updated_at = now();
