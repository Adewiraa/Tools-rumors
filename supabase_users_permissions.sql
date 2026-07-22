-- ============================================================
-- TABEL app_users DAN role_permissions (BULLETPROOF MIGRATION SCRIPT)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. TABEL ROLE PERMISSIONS (Matriks Hak Akses Menu)
CREATE TABLE IF NOT EXISTS role_permissions (
  role          TEXT PRIMARY KEY,
  allowed_menus JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memastikan kolom allowed_menus dan updated_at ada
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS allowed_menus JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Memastikan constraint UNIQUE/PRIMARY KEY pada role_permissions(role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_pkey' OR conname = 'role_permissions_role_key'
  ) THEN
    ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_key UNIQUE (role);
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

-- Memastikan kolom-kolom penting ada
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Memastikan constraint UNIQUE pada app_users(username)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_username_key' OR conname = 'app_users_username_unique'
  ) THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_username_key UNIQUE (username);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

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

-- 3. SEED DATA PERMISSIONS PER ROLE (Menggunakan WHERE NOT EXISTS agar aman 100%)
INSERT INTO role_permissions (role, allowed_menus)
SELECT 'Super Admin', '["dashboard", "schedule", "lineups", "results", "rumors", "clubs", "players", "competitions", "users", "permissions", "logs", "settings"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'Super Admin');

INSERT INTO role_permissions (role, allowed_menus)
SELECT 'Admin Data', '["dashboard", "schedule", "clubs", "players", "competitions", "logs"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'Admin Data');

INSERT INTO role_permissions (role, allowed_menus)
SELECT 'Match Editor', '["dashboard", "schedule", "lineups", "results"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'Match Editor');

INSERT INTO role_permissions (role, allowed_menus)
SELECT 'Rumor Editor', '["dashboard", "rumors"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'Rumor Editor');

INSERT INTO role_permissions (role, allowed_menus)
SELECT 'Reviewer', '["dashboard", "schedule", "lineups", "results", "rumors", "logs"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role = 'Reviewer');

-- 4. FOREIGN KEY CONSTRAINT
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

-- 5. SEED DATA USERS DEFAULTS (Menggunakan WHERE NOT EXISTS agar aman 100%)
INSERT INTO app_users (id, username, password_hash, full_name, role, status)
SELECT 'usr-superadmin', 'admin', 'admin123', 'Super Admin Gosball', 'Super Admin', 'active'
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'admin');

INSERT INTO app_users (id, username, password_hash, full_name, role, status)
SELECT 'usr-editor1', 'match_editor', 'editor123', 'Ahmad Editor Match', 'Match Editor', 'active'
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'match_editor');

INSERT INTO app_users (id, username, password_hash, full_name, role, status)
SELECT 'usr-rumoreditor', 'rumor_editor', 'rumor123', 'Budi Rumor Editor', 'Rumor Editor', 'active'
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'rumor_editor');

INSERT INTO app_users (id, username, password_hash, full_name, role, status)
SELECT 'usr-admindata', 'data_admin', 'data123', 'Citra Data Admin', 'Admin Data', 'active'
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE username = 'data_admin');

-- 6. RLS POLICIES (DROP & CREATE AGAR AMAN DIPANGGIL BERKALI-KALI)
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
