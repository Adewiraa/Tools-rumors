-- ============================================================
-- MASTER MEDIA IKLAN + RELASI JADWAL PERTANDINGAN
-- Jalankan seluruh script ini di Supabase SQL Editor.
--
-- Tujuan:
-- - Media iklan bisa berupa gambar atau video.
-- - Iklan bisa disimpan sebagai master, lalu dipasang ke jadwal tertentu.
-- - Matches tetap punya snapshot JSONB match_media agar share HT/FT cepat dan stabil.
-- ============================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_media JSONB NOT NULL DEFAULT '{"enabled":false,"ads":[]}'::jsonb;

CREATE TABLE IF NOT EXISTS media_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  label TEXT DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  poster_url TEXT,
  mime_type TEXT,
  file_name TEXT,
  fit TEXT NOT NULL DEFAULT 'contain'
    CHECK (fit IN ('contain', 'cover')),
  placement TEXT NOT NULL DEFAULT 'result_package'
    CHECK (placement IN ('result_package', 'lineup_package', 'all')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived')),
  competition TEXT,
  club_id TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_media_ads (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  media_ad_id UUID NOT NULL REFERENCES media_ads(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  label_override TEXT,
  fit_override TEXT CHECK (fit_override IS NULL OR fit_override IN ('contain', 'cover')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (match_id, media_ad_id)
);

CREATE INDEX IF NOT EXISTS idx_media_ads_status_sort
  ON media_ads (status, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_ads_competition
  ON media_ads (competition);

CREATE INDEX IF NOT EXISTS idx_match_media_ads_match_sort
  ON match_media_ads (match_id, sort_order);

CREATE OR REPLACE FUNCTION update_media_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_media_ads_updated_at ON media_ads;
CREATE TRIGGER trg_media_ads_updated_at
  BEFORE UPDATE ON media_ads
  FOR EACH ROW EXECUTE FUNCTION update_media_ads_updated_at();

-- Bucket publik untuk aset iklan. Service role tetap dipakai aplikasi untuk upload.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-ads',
  'media-ads',
  TRUE,
  83886080,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE media_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_media_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_ads_read_all" ON media_ads;
CREATE POLICY "media_ads_read_all"
  ON media_ads FOR SELECT USING (true);

DROP POLICY IF EXISTS "match_media_ads_read_all" ON match_media_ads;
CREATE POLICY "match_media_ads_read_all"
  ON match_media_ads FOR SELECT USING (true);

-- Tambahkan akses menu Master Iklan untuk role yang mengelola master data.
DO $$
BEGIN
  IF to_regclass('public.role_permissions') IS NOT NULL THEN
    UPDATE role_permissions
    SET allowed_menus = (
      SELECT jsonb_agg(DISTINCT menu)
      FROM jsonb_array_elements_text(allowed_menus || '["media-ads"]'::jsonb) AS menu
    )
    WHERE role IN ('Super Admin', 'Admin Data');
  END IF;
END $$;

-- View praktis untuk mengambil iklan aktif per match, dengan fallback label/fit override.
CREATE OR REPLACE VIEW match_media_ads_resolved AS
SELECT
  mma.match_id,
  ma.id AS media_ad_id,
  ma.title,
  COALESCE(NULLIF(mma.label_override, ''), ma.label, 'MEDIA PARTNER') AS label,
  ma.media_type,
  ma.media_url,
  ma.poster_url,
  ma.mime_type,
  ma.file_name,
  COALESCE(mma.fit_override, ma.fit) AS fit,
  ma.placement,
  ma.competition,
  ma.club_id,
  mma.sort_order,
  mma.enabled
FROM match_media_ads mma
JOIN media_ads ma ON ma.id = mma.media_ad_id
WHERE mma.enabled = TRUE
  AND ma.status = 'active'
  AND (ma.starts_at IS NULL OR ma.starts_at <= NOW())
  AND (ma.ends_at IS NULL OR ma.ends_at >= NOW());

COMMIT;

-- Verifikasi cepat
SELECT
  'media_ads migration siap' AS status,
  COUNT(*) AS total_master_iklan
FROM media_ads;
