-- ============================================================
-- FULL SETUP: Master Kompetisi + Relasi Club + Storage Bucket
-- Jalankan SELURUH script ini di Supabase SQL Editor
-- Project: fsntguzvlbpwkjcbzfsd
-- ============================================================

-- ============================================================
-- STEP 1: Tabel competitions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.competitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL DEFAULT '',
  slug        TEXT UNIQUE,
  type        TEXT NOT NULL DEFAULT 'league'
                CHECK (type IN ('league', 'cup', 'friendly')),
  country     TEXT NOT NULL DEFAULT 'Indonesia',
  logo_url    TEXT NOT NULL DEFAULT '',
  season      TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  foreign_regulation_free BOOLEAN NOT NULL DEFAULT FALSE,
  max_foreign_starters INTEGER NOT NULL DEFAULT 7,
  max_foreign_matchday INTEGER NOT NULL DEFAULT 9,
  max_foreign_squad INTEGER NOT NULL DEFAULT 11,
  min_local_starters INTEGER NOT NULL DEFAULT 0,
  min_local_matchday INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS foreign_regulation_free BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS max_foreign_starters INTEGER NOT NULL DEFAULT 7;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS max_foreign_matchday INTEGER NOT NULL DEFAULT 9;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS max_foreign_squad INTEGER NOT NULL DEFAULT 11;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS min_local_starters INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS min_local_matchday INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- STEP 2: Tabel relasi many-to-many club <-> competition
-- ============================================================
CREATE TABLE IF NOT EXISTS public.club_competitions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id        UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  season         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(club_id, competition_id)
);

-- ============================================================
-- STEP 3: Index performa
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_club_competitions_club_id
  ON public.club_competitions(club_id);

CREATE INDEX IF NOT EXISTS idx_club_competitions_competition_id
  ON public.club_competitions(competition_id);

CREATE INDEX IF NOT EXISTS idx_competitions_is_active
  ON public.competitions(is_active);

CREATE INDEX IF NOT EXISTS idx_competitions_type
  ON public.competitions(type);

-- ============================================================
-- STEP 4: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_competitions_updated_at ON public.competitions;
CREATE TRIGGER set_competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STEP 5: Seed data kompetisi awal
-- (ON CONFLICT DO NOTHING agar aman dijalankan ulang)
-- ============================================================
INSERT INTO public.competitions (id, name, short_name, slug, type, country, season, is_active)
VALUES
  ('00000000-0001-0000-0000-000000000001', 'Liga Nusantara Utama',  'LNU',   'liga-nusantara-utama',  'league',   'Indonesia', '2026/27', TRUE),
  ('00000000-0001-0000-0000-000000000002', 'Piala Nusantara',        'PN',    'piala-nusantara',        'cup',      'Indonesia', '2026',    TRUE),
  ('00000000-0001-0000-0000-000000000003', 'Liga Nusantara 2',       'LN2',   'liga-nusantara-2',       'league',   'Indonesia', '2026/27', TRUE),
  ('00000000-0001-0000-0000-000000000004', 'Piala Super Nusantara',  'PSN',   'piala-super-nusantara',  'cup',      'Indonesia', '2026',    FALSE),
  ('00000000-0001-0000-0000-000000000005', 'AFC Champions League',   'AFCCL', 'afc-champions-league',   'league',   'Asia',      '2026/27', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 6: Storage Bucket untuk logo kompetisi
-- Jalankan ini SETELAH tabel selesai dibuat
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('competition-logos', 'competition-logos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 7: Storage Policy — izinkan public read & service_role write
-- ============================================================

-- Public bisa baca/unduh logo
DROP POLICY IF EXISTS "Public read competition logos" ON storage.objects;
CREATE POLICY "Public read competition logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'competition-logos');

-- Service role bisa upload, update, delete
DROP POLICY IF EXISTS "Service role manage competition logos" ON storage.objects;
CREATE POLICY "Service role manage competition logos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'competition-logos')
  WITH CHECK (bucket_id = 'competition-logos');

-- ============================================================
-- STEP 8: RLS untuk tabel competitions & club_competitions
-- Aktifkan RLS dan beri akses penuh ke service_role
-- ============================================================
ALTER TABLE public.competitions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_competitions ENABLE ROW LEVEL SECURITY;

-- Izinkan semua operasi via service_role (API routes pakai ini)
DROP POLICY IF EXISTS "Service role full access competitions" ON public.competitions;
CREATE POLICY "Service role full access competitions"
  ON public.competitions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access club_competitions" ON public.club_competitions;
CREATE POLICY "Service role full access club_competitions"
  ON public.club_competitions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Izinkan anon/authenticated hanya baca (untuk client-side jika diperlukan)
DROP POLICY IF EXISTS "Public read competitions" ON public.competitions;
CREATE POLICY "Public read competitions"
  ON public.competitions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read club_competitions" ON public.club_competitions;
CREATE POLICY "Public read club_competitions"
  ON public.club_competitions FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================
-- STEP 9: Verifikasi setup (jalankan query ini untuk mengecek)
-- ============================================================

-- Cek tabel competitions
-- SELECT * FROM public.competitions ORDER BY name;

-- Cek tabel club_competitions
-- SELECT cc.club_id, c.name AS competition_name
-- FROM public.club_competitions cc
-- JOIN public.competitions c ON c.id = cc.competition_id;

-- Cek bucket storage
-- SELECT * FROM storage.buckets WHERE id = 'competition-logos';

-- ============================================================
-- SELESAI — Setup master kompetisi siap digunakan
-- ============================================================
