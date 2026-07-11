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

alter table public.players
drop constraint if exists players_full_name_country_code_key;

alter table public.players
add constraint players_full_name_country_code_key unique (full_name, country_code);

create index if not exists clubs_ileague_slug_idx on public.clubs (ileague_slug);
create index if not exists club_rosters_club_season_idx on public.club_rosters (club_season_id);
create index if not exists players_country_code_idx on public.players (country_code);
create index if not exists players_full_name_idx on public.players (full_name);

alter table public.competitions enable row level security;
alter table public.seasons enable row level security;
alter table public.clubs enable row level security;
alter table public.club_seasons enable row level security;
alter table public.players enable row level security;
alter table public.club_rosters enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.competitions to anon, authenticated;
grant select on public.seasons to anon, authenticated;
grant select on public.clubs to anon, authenticated;
grant select on public.club_seasons to anon, authenticated;
grant select on public.players to anon, authenticated;
grant select on public.club_rosters to anon, authenticated;
grant all privileges on public.competitions to service_role;
grant all privileges on public.seasons to service_role;
grant all privileges on public.clubs to service_role;
grant all privileges on public.club_seasons to service_role;
grant all privileges on public.players to service_role;
grant all privileges on public.club_rosters to service_role;

drop policy if exists "Public read competitions" on public.competitions;
create policy "Public read competitions"
on public.competitions for select
to anon, authenticated
using (true);

drop policy if exists "Public read seasons" on public.seasons;
create policy "Public read seasons"
on public.seasons for select
to anon, authenticated
using (true);

drop policy if exists "Public read clubs" on public.clubs;
create policy "Public read clubs"
on public.clubs for select
to anon, authenticated
using (true);

drop policy if exists "Public read club seasons" on public.club_seasons;
create policy "Public read club seasons"
on public.club_seasons for select
to anon, authenticated
using (true);

drop policy if exists "Public read players" on public.players;
create policy "Public read players"
on public.players for select
to anon, authenticated
using (true);

drop policy if exists "Public read club rosters" on public.club_rosters;
create policy "Public read club rosters"
on public.club_rosters for select
to anon, authenticated
using (true);

insert into public.competitions (code, name, country_code)
values
  ('BRI_SUPER_LEAGUE', 'Super League', 'ID'),
  ('PIALA_PRESIDEN', 'Piala Presiden', 'ID'),
  ('ACL_TWO', 'ACL Two', 'AS'),
  ('ACL_CHALLENGE', 'ACL Challenge', 'AS')
on conflict (code) do update set
  name = excluded.name,
  country_code = excluded.country_code;

insert into public.seasons (competition_id, code, name, starts_on, ends_on)
select
  competitions.id,
  season_seed.code,
  season_seed.name,
  season_seed.starts_on::date,
  season_seed.ends_on::date
from public.competitions
join (
  values
    ('BRI_SUPER_LEAGUE', 'BRI_SUPER_LEAGUE_2026-27', 'Super League 2026-27', '2026-08-01', '2027-05-31'),
    ('PIALA_PRESIDEN', 'PIALA_PRESIDEN_2026', 'Piala Presiden 2026', '2026-07-01', '2026-08-31'),
    ('ACL_TWO', 'ACL_TWO_2026-27', 'ACL Two 2026-27', '2026-08-01', '2027-05-31'),
    ('ACL_CHALLENGE', 'ACL_CHALLENGE_2026-27', 'ACL Challenge 2026-27', '2026-08-01', '2027-05-31')
) as season_seed (competition_code, code, name, starts_on, ends_on)
  on season_seed.competition_code = competitions.code
on conflict (competition_id, code) do update set
  name = excluded.name,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on;

insert into public.clubs
  (name, short_name, slug, ileague_slug, ileague_url, primary_color, secondary_color, city)
values
  (
    'Arema FC',
    'AREMA',
    'arema-fc',
    'AREMA_FC',
    'https://ileague.id/clubs/single/BRI_SUPER_LEAGUE_2026-27/AREMA_FC',
    '#2563eb',
    '#f3efe2',
    'Malang'
  ),
  (
    'Bali United FC',
    'BALI',
    'bali-united-fc',
    'BALI_UNITED_FC',
    'https://ileague.id/clubs/single/BRI_SUPER_LEAGUE_2026-27/BALI_UNITED_FC',
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

insert into public.club_seasons (club_id, season_id, head_coach)
select clubs.id, seasons.id, null
from public.clubs
cross join public.seasons
join public.competitions on competitions.id = seasons.competition_id
where competitions.code = 'BRI_SUPER_LEAGUE'
  and seasons.code = 'BRI_SUPER_LEAGUE_2026-27'
  and clubs.slug in ('arema-fc', 'bali-united-fc')
on conflict (club_id, season_id) do nothing;
