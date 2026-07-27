-- ============================================================
-- TABEL app_settings
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  id           TEXT PRIMARY KEY DEFAULT 'default',
  app_name     TEXT NOT NULL DEFAULT 'Media Tools',
  app_handle   TEXT NOT NULL DEFAULT '@mediatools',
  app_logo_url TEXT DEFAULT '',
  app_subtitle TEXT DEFAULT 'MEDIA APP',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_app_settings_updated_at();

-- Seed data identitas per media tenant (insert jika belum ada)
INSERT INTO app_settings (id, app_name, app_handle, app_logo_url, app_subtitle)
VALUES
  ('gosball', 'Gosball', '@gosball', '/brand/gosball-alt.png', 'Media Sepak Bola'),
  ('garudagoal', 'Garuda Goal', '@garudagoal', '/brand/gosball-alt.png', 'Media Sepak Bola Indonesia'),
  ('bolanusantara', 'Bola Nusantara', '@bolanusantara', '/brand/gosball-alt.png', 'Portal Berita Sepakbola')
ON CONFLICT (id) DO NOTHING;

-- RLS: bisa dibaca semua, write pakai service role
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "app_settings_read_all"
  ON app_settings FOR SELECT USING (true);

-- Konfirmasi
SELECT * FROM app_settings WHERE id IN ('gosball', 'garudagoal', 'bolanusantara');
