-- ============================================================
-- MIGRATION: Tambah regulasi lineup kompetisi
-- Jalankan di Supabase Dashboard -> SQL Editor
-- ============================================================

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS max_foreign_starters INTEGER,
  ADD COLUMN IF NOT EXISTS max_foreign_matchday INTEGER,
  ADD COLUMN IF NOT EXISTS max_foreign_squad INTEGER,
  ADD COLUMN IF NOT EXISTS min_local_starters INTEGER,
  ADD COLUMN IF NOT EXISTS min_local_matchday INTEGER;

UPDATE public.competitions
SET
  max_foreign_starters = COALESCE(max_foreign_starters, 7),
  max_foreign_matchday = COALESCE(max_foreign_matchday, 9),
  max_foreign_squad = COALESCE(max_foreign_squad, 11),
  min_local_starters = COALESCE(min_local_starters, 0),
  min_local_matchday = COALESCE(min_local_matchday, 0);

ALTER TABLE public.competitions
  ALTER COLUMN max_foreign_starters SET DEFAULT 7,
  ALTER COLUMN max_foreign_matchday SET DEFAULT 9,
  ALTER COLUMN max_foreign_squad SET DEFAULT 11,
  ALTER COLUMN min_local_starters SET DEFAULT 0,
  ALTER COLUMN min_local_matchday SET DEFAULT 0;

ALTER TABLE public.competitions
  ALTER COLUMN max_foreign_starters SET NOT NULL,
  ALTER COLUMN max_foreign_matchday SET NOT NULL,
  ALTER COLUMN max_foreign_squad SET NOT NULL,
  ALTER COLUMN min_local_starters SET NOT NULL,
  ALTER COLUMN min_local_matchday SET NOT NULL;

GRANT ALL PRIVILEGES ON TABLE public.competitions TO postgres, service_role, anon, authenticated;

-- Paksa PostgREST/Supabase refresh schema cache setelah kolom baru dibuat.
NOTIFY pgrst, 'reload schema';
