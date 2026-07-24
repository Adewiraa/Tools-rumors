-- ============================================================
-- RESET & INSERT PEMAIN TAMPINES ROVERS
-- Jalankan seluruh script ini di Supabase SQL Editor.
--
-- Catatan:
-- - Script mencari club_id dari name/short_name/slug klub Tampines Rovers.
-- - Script menghapus roster lama klub tersebut.
-- - Profil pemain lama ikut dihapus hanya jika sudah tidak dipakai roster klub lain.
-- - Nomor punggung "-" pada gambar disimpan sebagai 0.
-- ============================================================

ROLLBACK;
BEGIN;

DO $$
DECLARE
  v_club_id UUID;
  v_season_id UUID;
  v_club_season_id UUID;
  v_old_player_ids UUID[];
BEGIN
  DROP TABLE IF EXISTS tmp_tampines_rovers_players;

  CREATE TEMP TABLE tmp_tampines_rovers_players (
    full_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    shirt_number INTEGER NOT NULL,
    position TEXT NOT NULL,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    country_flag_url TEXT NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO tmp_tampines_rovers_players
    (full_name, display_name, shirt_number, position, country_code, country_name, country_flag_url)
  VALUES
    -- Kiper
    ('Zharfan Rohaizad',    'Zharfan Rohaizad',    0,  'GK', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Syazwan Buhari',      'Syazwan Buhari',      24, 'GK', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),

    -- Bek
    ('Raoul Suhaimi',       'Raoul Suhaimi',       2,  'DF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Dylan Fox',           'Dylan Fox',           16, 'DF', 'NZ', 'New Zealand', 'https://flags.restcountries.com/v5/svg/nz.svg'),
    ('Amirul Haikal',       'Amirul Haikal',       17, 'DF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Amirul Adli Azmi',    'Amirul Adli Azmi',    0,  'DF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Irfan Najeeb',        'Irfan Najeeb',        23, 'DF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),

    -- Gelandang
    ('Koya Kazama',         'Koya Kazama',         88, 'MF', 'JP', 'Japan',       'https://flags.restcountries.com/v5/svg/jp.svg'),
    ('Shodai Yokoyama',     'Shodai Yokoyama',     0,  'MF', 'JP', 'Japan',       'https://flags.restcountries.com/v5/svg/jp.svg'),
    ('Joel Chew',           'Joel Chew',           19, 'MF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Seiga Sumi',          'Seiga Sumi',          0,  'MF', 'JP', 'Japan',       'https://flags.restcountries.com/v5/svg/jp.svg'),
    ('Jacob Mahler',        'Jacob Mahler',        6,  'MF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Yuma Kimura',         'Yuma Kimura',         0,  'MF', 'JP', 'Japan',       'https://flags.restcountries.com/v5/svg/jp.svg'),
    ('Shah Shahiran',       'Shah Shahiran',       8,  'MF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Yuki Kobayashi',      'Yuki Kobayashi',      49, 'MF', 'JP', 'Japan',       'https://flags.restcountries.com/v5/svg/jp.svg'),
    ('Yu En Ong',           'Yu En Ong',           15, 'MF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Iman Hakim',          'Iman Hakim',          0,  'MF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Anton Yen Goh',       'Anton Yen Goh',       0,  'MF', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),

    -- Penyerang
    ('Faris Ramli',         'Faris Ramli',         10, 'FW', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Matthias Koesno',     'Matthias Koesno',     0,  'FW', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Marc Ryan Tan',       'Marc Ryan Tan',       14, 'FW', 'SG', 'Singapore',   'https://flags.restcountries.com/v5/svg/sg.svg'),
    ('Seia Kunori',         'Seia Kunori',         0,  'FW', 'JP', 'Japan',       'https://flags.restcountries.com/v5/svg/jp.svg'),
    ('Hide Higashikawa',    'Hide Higashikawa',    0,  'FW', 'JP', 'Japan',       'https://flags.restcountries.com/v5/svg/jp.svg'),
    ('Kenshin Yamazaki',    'Kenshin Yamazaki',    0,  'FW', 'JP', 'Japan',       'https://flags.restcountries.com/v5/svg/jp.svg');

  SELECT id
  INTO v_club_id
  FROM clubs
  WHERE LOWER(TRIM(name)) IN ('tampines rovers', 'tampines rovers fc')
     OR LOWER(TRIM(short_name)) IN ('tampines rovers', 'tampines')
     OR LOWER(TRIM(slug)) IN ('tam', 'tamp', 'tampines', 'tampines-rovers', 'tampines-rovers-fc')
  LIMIT 1;

  IF v_club_id IS NULL THEN
    RAISE EXCEPTION 'Club Tampines Rovers tidak ditemukan. Cek name/short_name/slug di tabel clubs.';
  END IF;

  SELECT ARRAY_AGG(DISTINCT cr.player_id)
  INTO v_old_player_ids
  FROM club_rosters cr
  JOIN club_seasons cs ON cs.id = cr.club_season_id
  WHERE cs.club_id = v_club_id;

  DELETE FROM club_rosters cr
  USING club_seasons cs
  WHERE cr.club_season_id = cs.id
    AND cs.club_id = v_club_id;

  IF v_old_player_ids IS NOT NULL THEN
    DELETE FROM players p
    WHERE p.id = ANY(v_old_player_ids)
      AND NOT EXISTS (
        SELECT 1
        FROM club_rosters cr
        WHERE cr.player_id = p.id
      );
  END IF;

  SELECT id
  INTO v_club_season_id
  FROM club_seasons
  WHERE club_id = v_club_id
  LIMIT 1;

  IF v_club_season_id IS NULL THEN
    SELECT id
    INTO v_season_id
    FROM seasons
    LIMIT 1;

    IF v_season_id IS NULL THEN
      RAISE EXCEPTION 'Tidak ada data di tabel seasons. Buat season terlebih dulu, lalu jalankan script ini lagi.';
    END IF;

    INSERT INTO club_seasons (club_id, season_id)
    VALUES (v_club_id, v_season_id)
    ON CONFLICT DO NOTHING;

    SELECT id
    INTO v_club_season_id
    FROM club_seasons
    WHERE club_id = v_club_id
      AND season_id = v_season_id
    LIMIT 1;
  END IF;

  UPDATE players p
  SET
    display_name = t.display_name,
    country_code = t.country_code,
    country_name = t.country_name,
    country_flag_url = t.country_flag_url
  FROM tmp_tampines_rovers_players t
  WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(t.full_name));

  INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
  SELECT
    gen_random_uuid(),
    t.full_name,
    t.display_name,
    t.country_code,
    t.country_name,
    t.country_flag_url
  FROM tmp_tampines_rovers_players t
  WHERE NOT EXISTS (
    SELECT 1
    FROM players p
    WHERE LOWER(TRIM(p.full_name)) = LOWER(TRIM(t.full_name))
  );

  INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
  SELECT DISTINCT ON (t.full_name)
    p.id,
    v_club_season_id,
    t.shirt_number,
    t.position
  FROM tmp_tampines_rovers_players t
  JOIN players p ON LOWER(TRIM(p.full_name)) = LOWER(TRIM(t.full_name))
  ORDER BY t.full_name, p.id
  ON CONFLICT (player_id, club_season_id)
  DO UPDATE SET
    shirt_number = EXCLUDED.shirt_number,
    position = EXCLUDED.position;
END $$;

COMMIT;

-- Verifikasi hasil
SELECT
  cr.shirt_number AS no,
  p.display_name AS pemain,
  cr.position,
  p.country_code,
  p.country_name,
  p.country_flag_url
FROM club_rosters cr
JOIN club_seasons cs ON cs.id = cr.club_season_id
JOIN clubs c ON c.id = cs.club_id
JOIN players p ON p.id = cr.player_id
WHERE LOWER(TRIM(c.name)) IN ('tampines rovers', 'tampines rovers fc')
   OR LOWER(TRIM(c.short_name)) IN ('tampines rovers', 'tampines')
   OR LOWER(TRIM(c.slug)) IN ('tam', 'tamp', 'tampines', 'tampines-rovers', 'tampines-rovers-fc')
ORDER BY
  CASE cr.position WHEN 'GK' THEN 1 WHEN 'DF' THEN 2 WHEN 'MF' THEN 3 WHEN 'FW' THEN 4 ELSE 5 END,
  NULLIF(cr.shirt_number, 0) NULLS LAST,
  p.display_name;
