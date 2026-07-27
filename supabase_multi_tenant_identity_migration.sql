-- ============================================================
-- MULTI-TENANT IDENTITY MIGRATION
-- Jalankan di Supabase SQL Editor jika tabel app_users/app_settings
-- sudah dibuat dari script lama.
--
-- Tujuan:
-- - Setiap akun admin punya tenant_id / identitas media sendiri.
-- - app_settings menyimpan identitas per tenant, bukan satu default global.
-- ============================================================

BEGIN;

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'gosball';

CREATE INDEX IF NOT EXISTS idx_app_users_tenant_id
  ON app_users (tenant_id);

UPDATE app_users
SET tenant_id = 'gosball'
WHERE tenant_id IS NULL OR tenant_id = '';

UPDATE app_users
SET tenant_id = 'garudagoal'
WHERE username = 'garuda_admin';

UPDATE app_users
SET tenant_id = 'bolanusantara'
WHERE username = 'bola_admin';

-- Untuk akun media lain yang sudah dibuat sebelum fitur tenant_id ada,
-- jangan biarkan Super Admin selain admin utama otomatis memakai tenant Gosball.
UPDATE app_users
SET tenant_id = 'media-' || TRIM(BOTH '-' FROM regexp_replace(lower(username), '[^a-z0-9]+', '-', 'g'))
WHERE role = 'Super Admin'
  AND username <> 'admin'
  AND tenant_id = 'gosball';

INSERT INTO app_settings (id, app_name, app_handle, app_logo_url, app_subtitle)
VALUES
  ('gosball', 'Gosball', '@gosball', '/brand/gosball-alt.png', 'Media Sepak Bola'),
  ('garudagoal', 'Garuda Goal', '@garudagoal', '/brand/gosball-alt.png', 'Media Sepak Bola Indonesia'),
  ('bolanusantara', 'Bola Nusantara', '@bolanusantara', '/brand/gosball-alt.png', 'Portal Berita Sepakbola')
ON CONFLICT (id) DO UPDATE SET
  app_name = EXCLUDED.app_name,
  app_handle = EXCLUDED.app_handle,
  app_logo_url = EXCLUDED.app_logo_url,
  app_subtitle = EXCLUDED.app_subtitle;

INSERT INTO app_settings (id, app_name, app_handle, app_logo_url, app_subtitle)
SELECT DISTINCT
  tenant_id,
  COALESCE(NULLIF(TRIM(regexp_replace(full_name, '^(Super Admin|Admin)[[:space:]]+', '', 'i')), ''), username),
  '@' || regexp_replace(lower(username), '[^a-z0-9_]+', '', 'g'),
  '/brand/gosball-alt.png',
  'Media Sepak Bola'
FROM app_users
WHERE tenant_id LIKE 'media-%'
ON CONFLICT (id) DO NOTHING;

COMMIT;

SELECT
  'multi-tenant identity siap' AS status,
  COUNT(*) AS total_user,
  COUNT(DISTINCT tenant_id) AS total_tenant
FROM app_users;
