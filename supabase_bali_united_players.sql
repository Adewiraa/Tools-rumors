-- ============================================================
-- INSERT PEMAIN BALI UNITED FC
-- Jalankan di Supabase SQL Editor
-- 
-- LANGKAH:
-- 1. Jalankan query ini setelah tabel clubs, players,
--    club_seasons, dan club_rosters sudah ada
-- 2. Ganti nilai CLUB_ID di bawah dengan ID Bali United
--    yang ada di tabel clubs kamu
-- ============================================================

-- ── STEP 1: Ambil club_id Bali United ──────────────────────
-- Jalankan ini dulu untuk cek ID:
-- SELECT id, name FROM clubs WHERE name ILIKE '%bali%';

-- ── STEP 2: Pastikan club_season ada ───────────────────────
-- Ganti 'CLUB_ID_BALI_UNITED' dengan ID asli dari tabel clubs
DO $$
DECLARE
  v_club_id        TEXT;
  v_season_id      UUID;
  v_club_season_id UUID;
BEGIN
  -- Ambil club_id Bali United
  SELECT id INTO v_club_id FROM clubs WHERE name ILIKE '%bali united%' LIMIT 1;
  IF v_club_id IS NULL THEN
    RAISE EXCEPTION 'Club Bali United tidak ditemukan. Pastikan sudah ada di tabel clubs.';
  END IF;

  -- Ambil season_id aktif
  SELECT id INTO v_season_id FROM seasons LIMIT 1;
  IF v_season_id IS NULL THEN
    RAISE EXCEPTION 'Tidak ada data di tabel seasons. Buat season dulu.';
  END IF;

  -- Pastikan club_season ada
  SELECT id INTO v_club_season_id
    FROM club_seasons
   WHERE club_id = v_club_id
     AND season_id = v_season_id
   LIMIT 1;

  IF v_club_season_id IS NULL THEN
    INSERT INTO club_seasons (club_id, season_id)
    VALUES (v_club_id, v_season_id)
    RETURNING id INTO v_club_season_id;
    RAISE NOTICE 'club_season dibuat: %', v_club_season_id;
  ELSE
    RAISE NOTICE 'club_season sudah ada: %', v_club_season_id;
  END IF;
END $$;

-- ── STEP 3: Insert Players + Roster ────────────────────────
-- Jalankan blok ini SETELAH STEP 2 berhasil

DO $$
DECLARE
  v_club_id        TEXT;
  v_club_season_id UUID;
  v_season_id      UUID;
BEGIN
  SELECT id INTO v_club_id FROM clubs WHERE name ILIKE '%bali united%' LIMIT 1;
  SELECT id INTO v_season_id FROM seasons LIMIT 1;
  SELECT id INTO v_club_season_id
    FROM club_seasons
   WHERE club_id = v_club_id AND season_id = v_season_id
   LIMIT 1;

  -- ── PENJAGA GAWANG ──────────────────────────────────────
  INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
  VALUES
    (gen_random_uuid()::text, 'Mike Hauptmeijer',     'Mike Hauptmeijer',     'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
    (gen_random_uuid()::text, 'Wayan Arta',            'Wayan Arta',            'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Dikri Yusron',          'Dikri Yusron',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Fitrul Dwi Rustapa',    'Fitrul Dwi Rustapa',    'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  -- ── BEK ─────────────────────────────────────────────────
    (gen_random_uuid()::text, 'João Ferrari',          'João Ferrari',          'BR', 'Brasil',     'https://flagcdn.com/w40/br.png'),
    (gen_random_uuid()::text, 'Kadek Arel',            'Kadek Arel',            'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Bagas Adi Nugroho',     'Bagas Adi Nugroho',     'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Rizky Dwi Febrianto',   'Rizky Dwi Febrianto',   'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Ricky Fajrin',          'Ricky Fajrin',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Made Andhika',          'Made Andhika',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Putu Panji',            'Putu Panji',            'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Yusuf Meilana',         'Yusuf Meilana',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Gede Agus',             'Gede Agus',             'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Komang Dedi',           'Komang Dedi',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  -- ── GELANDANG ────────────────────────────────────────────
    (gen_random_uuid()::text, 'Brandon Wilson',        'Brandon Wilson',        'BW', 'Botswana',   'https://flagcdn.com/w40/bw.png'),
    (gen_random_uuid()::text, 'Thijmen Goppel',        'Thijmen Goppel',        'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
    (gen_random_uuid()::text, 'Jordy Bruijn',          'Jordy Bruijn',          'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
    (gen_random_uuid()::text, 'Mirza Mustafić',        'Mirza Mustafić',        'LU', 'Luksemburg', 'https://flagcdn.com/w40/lu.png'),
    (gen_random_uuid()::text, 'Tim Receveur',          'Tim Receveur',          'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
    (gen_random_uuid()::text, 'Teppei Yachida',        'Teppei Yachida',        'JP', 'Jepang',     'https://flagcdn.com/w40/jp.png'),
    (gen_random_uuid()::text, 'Kadek Agung',           'Kadek Agung',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Maouri Simon',          'Maouri Simon',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Made Tito',             'Made Tito',             'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Gede Sunu',             'Gede Sunu',             'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Aris Sanjaya',          'Aris Sanjaya',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Reyner Barusu',         'Reyner Barusu',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  -- ── PENYERANG ────────────────────────────────────────────
    (gen_random_uuid()::text, 'Boris Kopitović',       'Boris Kopitović',       'ME', 'Montenegro', 'https://flagcdn.com/w40/me.png'),
    (gen_random_uuid()::text, 'Yabes Roni',            'Yabes Roni',            'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Jens Raven',            'Jens Raven',            'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
    (gen_random_uuid()::text, 'Irfan Jaya',            'Irfan Jaya',            'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Rahmat Arjuna',         'Rahmat Arjuna',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Muhammad Rahmat',       'Muhammad Rahmat',       'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
    (gen_random_uuid()::text, 'Diego Campos',          'Diego Campos',          'CR', 'Kosta Rika', 'https://flagcdn.com/w40/cr.png')
  ON CONFLICT (id) DO NOTHING;

  -- ── Insert Roster (nomor punggung + posisi) ───────────────
  -- Ambil ID player berdasarkan nama dan insert ke club_rosters
  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  SELECT p.id, v_club_season_id, r.shirt_number, r.position
  FROM (VALUES
    -- (full_name, shirt_number, position)
    ('Mike Hauptmeijer',     1,  'GK'),
    ('Wayan Arta',           21, 'GK'),
    ('Dikri Yusron',         31, 'GK'),
    ('Fitrul Dwi Rustapa',   95, 'GK'),
    ('João Ferrari',          2,  'DF'),
    ('Kadek Arel',            4,  'DF'),
    ('Bagas Adi Nugroho',     5,  'DF'),
    ('Rizky Dwi Febrianto',  16, 'DF'),
    ('Ricky Fajrin',         24, 'DF'),
    ('Made Andhika',         33, 'DF'),
    ('Putu Panji',           44, 'DF'),
    ('Yusuf Meilana',        77, 'DF'),
    ('Gede Agus',            93, 'DF'),
    ('Komang Dedi',          87, 'DF'),
    ('Brandon Wilson',        6,  'MF'),
    ('Thijmen Goppel',        7,  'MF'),
    ('Jordy Bruijn',          8,  'MF'),
    ('Mirza Mustafić',       10, 'MF'),
    ('Tim Receveur',         14, 'MF'),
    ('Teppei Yachida',       17, 'MF'),
    ('Kadek Agung',          18, 'MF'),
    ('Maouri Simon',         42, 'MF'),
    ('Made Tito',            55, 'MF'),
    ('Gede Sunu',            28, 'MF'),
    ('Aris Sanjaya',         79, 'MF'),
    ('Reyner Barusu',        92, 'MF'),
    ('Boris Kopitović',       9,  'FW'),
    ('Yabes Roni',           11, 'FW'),
    ('Jens Raven',           19, 'FW'),
    ('Irfan Jaya',           41, 'FW'),
    ('Rahmat Arjuna',        47, 'FW'),
    ('Muhammad Rahmat',      91, 'FW'),
    ('Diego Campos',         99, 'FW')
  ) AS r(full_name, shirt_number, position)
  JOIN players p ON p.full_name = r.full_name
  ON CONFLICT (player_id, club_season_id) DO UPDATE
    SET shirt_number = EXCLUDED.shirt_number,
        position     = EXCLUDED.position;

  RAISE NOTICE 'Selesai. % pemain Bali United berhasil diinsert.', 33;
END $$;

-- ── VERIFIKASI ───────────────────────────────────────────────
-- Jalankan ini untuk cek hasilnya:
SELECT
  p.full_name,
  p.country_name,
  p.country_flag_url,
  cr.shirt_number,
  cr.position
FROM players p
JOIN club_rosters cr ON cr.player_id = p.id
JOIN club_seasons cs  ON cs.id = cr.club_season_id
JOIN clubs c          ON c.id  = cs.club_id
WHERE c.name ILIKE '%bali united%'
ORDER BY
  CASE cr.position
    WHEN 'GK' THEN 1
    WHEN 'DF' THEN 2
    WHEN 'MF' THEN 3
    WHEN 'FW' THEN 4
  END,
  cr.shirt_number;
