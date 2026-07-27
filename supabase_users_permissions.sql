-- ============================================================
-- TABEL app_users DAN role_permissions (GOSBALL MEDIA TOOLS)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- RE-CREATE TABEL LAMA AGAR TIDAK KONFLIK DENGAN SCHEMA LAIN
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;

-- 1. TABEL ROLE PERMISSIONS (Matriks Hak Akses Menu)
CREATE TABLE role_permissions (
  role          TEXT PRIMARY KEY,
  allowed_menus JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL APP USERS (Manajemen User Admin)
CREATE TABLE app_users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL REFERENCES role_permissions(role) ON UPDATE CASCADE ON DELETE RESTRICT,
  status        TEXT NOT NULL DEFAULT 'active',
  avatar_url    TEXT DEFAULT '',
  tenant_id     TEXT NOT NULL DEFAULT 'gosball',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER trg_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_app_users_updated_at ON app_users;
CREATE TRIGGER trg_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 3. SEED DATA PERMISSIONS PER ROLE DEFAULTS
INSERT INTO role_permissions (role, allowed_menus) VALUES
(
  'Super Admin',
  '["dashboard", "schedule", "lineups", "results", "rumors", "clubs", "players", "competitions", "users", "permissions", "logs", "settings"]'::jsonb
),
(
  'Admin Data',
  '["dashboard", "schedule", "clubs", "players", "competitions", "logs"]'::jsonb
),
(
  'Match Editor',
  '["dashboard", "schedule", "lineups", "results"]'::jsonb
),
(
  'Rumor Editor',
  '["dashboard", "rumors"]'::jsonb
),
(
  'Reviewer',
  '["dashboard", "schedule", "lineups", "results", "rumors", "logs"]'::jsonb
)
ON CONFLICT (role) DO UPDATE SET allowed_menus = EXCLUDED.allowed_menus;

-- 4. SEED DATA USERS DEFAULTS
INSERT INTO app_users (id, username, password_hash, full_name, role, status, tenant_id) VALUES
('usr-superadmin', 'admin', 'admin123', 'Super Admin Gosball', 'Super Admin', 'active', 'gosball'),
('usr-garuda-admin', 'garuda_admin', 'admin123', 'Admin Garuda Goal', 'Super Admin', 'active', 'garudagoal'),
('usr-bola-admin', 'bola_admin', 'admin123', 'Admin Bola Nusantara', 'Super Admin', 'active', 'bolanusantara'),
('usr-editor1', 'match_editor', 'editor123', 'Ahmad Editor Match', 'Match Editor', 'active', 'gosball'),
('usr-rumoreditor', 'rumor_editor', 'rumor123', 'Budi Rumor Editor', 'Rumor Editor', 'active', 'gosball'),
('usr-admindata', 'data_admin', 'data123', 'Citra Data Admin', 'Admin Data', 'active', 'gosball')
ON CONFLICT (username) DO NOTHING;

-- 5. RLS POLICIES
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permissions_select_all" ON role_permissions;
DROP POLICY IF EXISTS "role_permissions_write_all" ON role_permissions;
CREATE POLICY "role_permissions_select_all" ON role_permissions FOR SELECT USING (true);
CREATE POLICY "role_permissions_write_all" ON role_permissions FOR ALL USING (true);

DROP POLICY IF EXISTS "app_users_select_all" ON app_users;
DROP POLICY IF EXISTS "app_users_write_all" ON app_users;
CREATE POLICY "app_users_select_all" ON app_users FOR SELECT USING (true);
CREATE POLICY "app_users_write_all" ON app_users FOR ALL USING (true);
