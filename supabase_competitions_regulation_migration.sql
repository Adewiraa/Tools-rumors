-- ============================================================
-- MIGRATION: Lengkapi schema master kompetisi
-- Jalankan di Supabase Dashboard -> SQL Editor
-- ============================================================

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS season TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN,
  ADD COLUMN IF NOT EXISTS max_foreign_starters INTEGER,
  ADD COLUMN IF NOT EXISTS max_foreign_matchday INTEGER,
  ADD COLUMN IF NOT EXISTS max_foreign_squad INTEGER,
  ADD COLUMN IF NOT EXISTS min_local_starters INTEGER,
  ADD COLUMN IF NOT EXISTS min_local_matchday INTEGER;

UPDATE public.competitions
SET
  short_name = COALESCE(short_name, ''),
  slug = COALESCE(slug, lower(regexp_replace(name, '\s+', '-', 'g'))),
  type = COALESCE(type, 'league'),
  country = COALESCE(country, 'Indonesia'),
  logo_url = COALESCE(logo_url, ''),
  season = COALESCE(season, ''),
  is_active = COALESCE(is_active, true),
  max_foreign_starters = COALESCE(max_foreign_starters, 7),
  max_foreign_matchday = COALESCE(max_foreign_matchday, 9),
  max_foreign_squad = COALESCE(max_foreign_squad, 11),
  min_local_starters = COALESCE(min_local_starters, 0),
  min_local_matchday = COALESCE(min_local_matchday, 0);

ALTER TABLE public.competitions
  ALTER COLUMN short_name SET DEFAULT '',
  ALTER COLUMN type SET DEFAULT 'league',
  ALTER COLUMN country SET DEFAULT 'Indonesia',
  ALTER COLUMN logo_url SET DEFAULT '',
  ALTER COLUMN season SET DEFAULT '',
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN max_foreign_starters SET DEFAULT 7,
  ALTER COLUMN max_foreign_matchday SET DEFAULT 9,
  ALTER COLUMN max_foreign_squad SET DEFAULT 11,
  ALTER COLUMN min_local_starters SET DEFAULT 0,
  ALTER COLUMN min_local_matchday SET DEFAULT 0;

ALTER TABLE public.competitions
  ALTER COLUMN short_name SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN country SET NOT NULL,
  ALTER COLUMN logo_url SET NOT NULL,
  ALTER COLUMN season SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN max_foreign_starters SET NOT NULL,
  ALTER COLUMN max_foreign_matchday SET NOT NULL,
  ALTER COLUMN max_foreign_squad SET NOT NULL,
  ALTER COLUMN min_local_starters SET NOT NULL,
  ALTER COLUMN min_local_matchday SET NOT NULL;

GRANT ALL PRIVILEGES ON TABLE public.competitions TO postgres, service_role, anon, authenticated;

-- Paksa PostgREST/Supabase refresh schema cache setelah kolom baru dibuat.
NOTIFY pgrst, 'reload schema';
