-- MIGRASI DATABASE & HAK AKSES SUPABASE
-- Silakan salin dan jalankan query SQL ini di Supabase Dashboard -> SQL Editor proyek Anda

-- 1. Tambahkan kolom-kolom baru ke tabel 'clubs' jika belum ada
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS home_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS away_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS third_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS coach TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stadium TEXT;

-- 2. Migrasikan data warna tim yang sudah ada (dari kolom lama ke kolom baru)
UPDATE clubs 
SET 
  home_color = COALESCE(home_color, primary_color),
  away_color = COALESCE(away_color, secondary_color)
WHERE home_color IS NULL OR away_color IS NULL;

-- 3. PERBAIKAN HAK AKSES (GRANT PRIVILEGES)
-- Ini untuk memperbaiki error "permission denied for table clubs" di level Postgres database
GRANT ALL PRIVILEGES ON TABLE clubs TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, anon, authenticated;
