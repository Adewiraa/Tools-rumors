-- ============================================================
-- TABEL MATCHES (Lineup Pertandingan)
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS matches (
  id                    TEXT PRIMARY KEY,
  home_club_id          TEXT,
  home_club_name        TEXT NOT NULL DEFAULT '',
  home_logo             TEXT DEFAULT '',
  away_club_id          TEXT,
  away_club_name        TEXT NOT NULL DEFAULT '',
  away_logo             TEXT DEFAULT '',
  competition           TEXT DEFAULT '',
  season                TEXT DEFAULT '',
  kickoff               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  venue                 TEXT DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'Scheduled'
                          CHECK (status IN ('Scheduled','Live','Finished','Postponed','Cancelled')),
  home_score            INTEGER,
  away_score            INTEGER,
  half_time_home_score  INTEGER,
  half_time_away_score  INTEGER,
  lineup_status         TEXT NOT NULL DEFAULT 'Draft'
                          CHECK (lineup_status IN ('Draft','Needs Review','Complete')),
  publication_status    TEXT NOT NULL DEFAULT 'Draft'
                          CHECK (publication_status IN ('Draft','Scheduled','Published','Archived')),
  editor                TEXT DEFAULT 'Admin',
  last_updated          TEXT DEFAULT 'Baru saja',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_matches_kickoff      ON matches (kickoff DESC);
CREATE INDEX IF NOT EXISTS idx_matches_home_club    ON matches (home_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_club    ON matches (away_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_lineup_status ON matches (lineup_status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_matches_updated_at ON matches;
CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_matches_updated_at();

-- RLS: baca publik, write butuh service role
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "matches_read_all"
  ON matches FOR SELECT USING (true);

-- Konfirmasi
SELECT 'Tabel matches berhasil dibuat.' AS status;
