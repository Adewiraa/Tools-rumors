-- ============================================================
-- TABEL AUDIT LOG (GOSBALL MEDIA TOOLS)
-- Jalankan di Supabase SQL Editor agar aktivitas user tersimpan permanen.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY,
  timestamp   TEXT NOT NULL,
  user_name   TEXT NOT NULL DEFAULT 'Sistem',
  action      TEXT NOT NULL,
  module      TEXT NOT NULL,
  details     TEXT NOT NULL,
  ip_address  TEXT DEFAULT '',
  user_agent  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs (module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_all" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_all" ON audit_logs;

CREATE POLICY "audit_logs_select_all"
  ON audit_logs
  FOR SELECT
  USING (true);

CREATE POLICY "audit_logs_insert_all"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);
