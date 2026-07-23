-- ============================================================
-- MIGRATION: Master Kompetisi + Relasi ke Club
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel master kompetisi
CREATE TABLE IF NOT EXISTS competitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT,
  slug        TEXT UNIQUE,
  type        TEXT DEFAULT 'league',   -- league | cup | friendly
  country     TEXT DEFAULT 'Indonesia',
  logo_url    TEXT,
  season      TEXT,                    -- contoh: '2026/27'
  is_active   BOOLEAN DEFAULT TRUE,
  max_foreign_starters INTEGER DEFAULT 7,
  max_foreign_matchday INTEGER DEFAULT 9,
  max_foreign_squad INTEGER DEFAULT 11,
  min_local_starters INTEGER DEFAULT 0,
  min_local_matchday INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE competitions ADD COLUMN IF NOT EXISTS max_foreign_starters INTEGER DEFAULT 7;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS max_foreign_matchday INTEGER DEFAULT 9;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS max_foreign_squad INTEGER DEFAULT 11;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS min_local_starters INTEGER DEFAULT 0;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS min_local_matchday INTEGER DEFAULT 0;

-- 2. Tabel relasi many-to-many: club <-> competition
CREATE TABLE IF NOT EXISTS club_competitions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id        UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season         TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, competition_id, season)
);

-- 3. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_club_competitions_club_id       ON club_competitions(club_id);
CREATE INDEX IF NOT EXISTS idx_club_competitions_competition_id ON club_competitions(competition_id);

-- 4. Trigger auto-update updated_at pada competitions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_competitions_updated_at ON competitions;
CREATE TRIGGER set_competitions_updated_at
  BEFORE UPDATE ON competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Data awal kompetisi (seed)
INSERT INTO competitions (id, name, short_name, slug, type, country, season, is_active)
VALUES
  (gen_random_uuid(), 'Liga Nusantara Utama',   'LNU',   'liga-nusantara-utama',   'league',   'Indonesia', '2026/27', TRUE),
  (gen_random_uuid(), 'Piala Nusantara',         'PN',    'piala-nusantara',         'cup',      'Indonesia', '2026',    TRUE),
  (gen_random_uuid(), 'Liga Nusantara 2',        'LN2',   'liga-nusantara-2',        'league',   'Indonesia', '2026/27', TRUE),
  (gen_random_uuid(), 'Piala Super Nusantara',   'PSN',   'piala-super-nusantara',   'cup',      'Indonesia', '2026',    FALSE),
  (gen_random_uuid(), 'AFC Champions League',    'AFCCL', 'afc-champions-league',    'league',   'Asia',      '2026/27', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 6. RLS Policies (opsional, aktifkan jika RLS dipakai)
-- ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE club_competitions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for service_role" ON competitions FOR ALL USING (true);
-- CREATE POLICY "Allow all for service_role" ON club_competitions FOR ALL USING (true);
