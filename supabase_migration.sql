-- MIGRASI DATABASE, HAK AKSES, & POLICY SUPABASE
-- Silakan salin dan jalankan query SQL ini di Supabase Dashboard -> SQL Editor proyek Anda

-- 1. Tambahkan kolom-kolom baru ke tabel 'clubs' jika belum ada
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS home_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS away_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS third_color TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS coach TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS stadium TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Indonesia';

-- 2. Migrasikan data warna tim yang sudah ada (dari kolom lama ke kolom baru)
UPDATE clubs 
SET 
  home_color = COALESCE(home_color, primary_color),
  away_color = COALESCE(away_color, secondary_color)
WHERE home_color IS NULL OR away_color IS NULL;

-- 3. PERBAIKAN HAK AKSES (GRANT PRIVILEGES) UNTUK SEMUA TABEL UTAMA
GRANT ALL PRIVILEGES ON TABLE clubs TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE players TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE club_rosters TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE club_seasons TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, anon, authenticated;

-- 4. NONAKTIFKAN ROW LEVEL SECURITY (RLS) AGAR BISA DI-UPDATE LANGSUNG DARI CLIENT ADMIN-PANEL
ALTER TABLE clubs DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_rosters DISABLE ROW LEVEL SECURITY;
ALTER TABLE club_seasons DISABLE ROW LEVEL SECURITY;

-- 5. ATAU BUAT PERMISSIVE POLICIES JIKA RLS SEWAKTU-WAKTU DIAKTIFKAN KEMBALI
DROP POLICY IF EXISTS "Allow all actions for clubs" ON clubs;
CREATE POLICY "Allow all actions for clubs" ON clubs FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions for players" ON players;
CREATE POLICY "Allow all actions for players" ON players FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions for club_rosters" ON club_rosters;
CREATE POLICY "Allow all actions for club_rosters" ON club_rosters FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions for club_seasons" ON club_seasons;
CREATE POLICY "Allow all actions for club_seasons" ON club_seasons FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. Tambahkan kolom timeline untuk menyimpan kejadian gol / kartu pertandingan jika belum ada
ALTER TABLE matches ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;

-- 6b. Tambahkan kolom regulasi lineup pada tabel competitions jika belum ada
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS max_foreign_starters INTEGER DEFAULT 7;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS max_foreign_matchday INTEGER DEFAULT 9;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS max_foreign_squad INTEGER DEFAULT 11;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS min_local_starters INTEGER DEFAULT 0;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS min_local_matchday INTEGER DEFAULT 0;

-- 7. Buat tabel 'rumors' untuk menyimpan data rumor & transfer pemain
CREATE TABLE IF NOT EXISTS rumors (
  id TEXT PRIMARY KEY,
  headline TEXT NOT NULL DEFAULT '',
  player TEXT NOT NULL DEFAULT '',
  from_club TEXT DEFAULT '',
  destination_club TEXT DEFAULT '',
  type TEXT DEFAULT 'rumor',
  reliability_tier TEXT DEFAULT 'C',
  source_name TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  publication_status TEXT DEFAULT 'Draft',
  transfer_status TEXT DEFAULT 'Rumor',
  probability INTEGER DEFAULT 50,
  short_summary TEXT DEFAULT '',
  article_body TEXT DEFAULT '',
  author TEXT DEFAULT 'Rumor Editor',
  publish_date TEXT,
  player_image_url TEXT DEFAULT '',
  player_image_position_x FLOAT DEFAULT 50,
  player_image_position_y FLOAT DEFAULT 20,
  player_image_zoom FLOAT DEFAULT 100,
  graphic_caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Grant akses dan disable RLS untuk tabel rumors
GRANT ALL PRIVILEGES ON TABLE rumors TO postgres, service_role, anon, authenticated;
ALTER TABLE rumors DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all actions for rumors" ON rumors;
CREATE POLICY "Allow all actions for rumors" ON rumors FOR ALL TO public USING (true) WITH CHECK (true);
