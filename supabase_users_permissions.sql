-- ============================================================
-- TABEL app_users DAN role_permissions (ULTIMATE SAFE MIGRATION)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. TABEL ROLE PERMISSIONS (Matriks Hak Akses Menu)
CREATE TABLE IF NOT EXISTS role_permissions (
  role          TEXT PRIMARY KEY,
  allowed_menus JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memastikan kolom allowed_menus dan updated_at ada jika tabel role_permissions sudah ada sebelumnya
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS allowed_menus JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Memastikan constraint PRIMARY KEY / UNIQUE pada role_permissions(role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_pkey'
  ) THEN
    ALTER TABLE role_permissions ADD PRIMARY KEY (role);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. TABEL APP USERS (Manajemen User Admin)
CREATE TABLE IF NOT EXISTS app_users (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  avatar_url    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memastikan kolom-kolom penting ada jika tabel app_users sudah ada sebelumnya
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

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

-- SEED DATA DEFAULTS: PERMISSIONS PER ROLE
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

-- Menambahkan Foreign Key secara aman jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_app_users_role'
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT fk_app_users_role
      FOREIGN KEY (role) REFERENCES role_permissions(role)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- SEED DATA DEFAULTS: USERS DEFAULTS
INSERT INTO app_users (id, username, password_hash, full_name, role, status) VALUES
('usr-superadmin', 'admin', 'admin123', 'Super Admin Gosball', 'Super Admin', 'active'),
('usr-editor1', 'match_editor', 'editor123', 'Ahmad Editor Match', 'Match Editor', 'active'),
('usr-rumoreditor', 'rumor_editor', 'rumor123', 'Budi Rumor Editor', 'Rumor Editor', 'active'),
('usr-admindata', 'data_admin', 'data123', 'Citra Data Admin', 'Admin Data', 'active')
ON CONFLICT (username) DO NOTHING;

-- RLS POLICIES (DROP & CREATE AGAR AMAN DIPANGGIL BERKALI-KALI)
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
