-- ============================================================
-- INSERT PEMAIN BALI UNITED FC
-- club_id  : 58061cea-6155-459b-9f5d-dbd51468415a
-- season_id: bb0a25d7-8676-40c8-88cd-9989df227169 (Super League 2026-27)
-- ============================================================

-- STEP 1: Pastikan club_season ada
INSERT INTO club_seasons (club_id, season_id)
VALUES (
  '58061cea-6155-459b-9f5d-dbd51468415a'::uuid,
  'bb0a25d7-8676-40c8-88cd-9989df227169'::uuid
)
ON CONFLICT DO NOTHING;

-- Ambil club_season_id untuk dipakai di roster
-- Jalankan ini dulu untuk cek:
-- SELECT id FROM club_seasons
-- WHERE club_id = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid
-- AND season_id = 'bb0a25d7-8676-40c8-88cd-9989df227169'::uuid;

-- ============================================================
-- STEP 2: Insert semua pemain
-- ============================================================
INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
VALUES
  -- PENJAGA GAWANG
  (gen_random_uuid(), 'Mike Hauptmeijer',    'Mike Hauptmeijer',    'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  (gen_random_uuid(), 'Wayan Arta',           'Wayan Arta',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Dikri Yusron',         'Dikri Yusron',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Fitrul Dwi Rustapa',   'Fitrul Dwi Rustapa',   'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  -- BEK
  (gen_random_uuid(), 'Joao Ferrari',         'João Ferrari',         'BR', 'Brasil',     'https://flagcdn.com/w40/br.png'),
  (gen_random_uuid(), 'Kadek Arel',           'Kadek Arel',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Bagas Adi Nugroho',    'Bagas Adi Nugroho',    'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Rizky Dwi Febrianto',  'Rizky Dwi Febrianto',  'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Ricky Fajrin',         'Ricky Fajrin',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Made Andhika',         'Made Andhika',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Putu Panji',           'Putu Panji',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Yusuf Meilana',        'Yusuf Meilana',        'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Gede Agus',            'Gede Agus',            'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Komang Dedi',          'Komang Dedi',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  -- GELANDANG
  (gen_random_uuid(), 'Brandon Wilson',       'Brandon Wilson',       'BW', 'Botswana',   'https://flagcdn.com/w40/bw.png'),
  (gen_random_uuid(), 'Thijmen Goppel',       'Thijmen Goppel',       'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  (gen_random_uuid(), 'Jordy Bruijn',         'Jordy Bruijn',         'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  (gen_random_uuid(), 'Mirza Mustafic',       'Mirza Mustafic',       'LU', 'Luksemburg', 'https://flagcdn.com/w40/lu.png'),
  (gen_random_uuid(), 'Tim Receveur',         'Tim Receveur',         'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  (gen_random_uuid(), 'Teppei Yachida',       'Teppei Yachida',       'JP', 'Jepang',     'https://flagcdn.com/w40/jp.png'),
  (gen_random_uuid(), 'Kadek Agung',          'Kadek Agung',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Maouri Simon',         'Maouri Simon',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Made Tito',            'Made Tito',            'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Gede Sunu',            'Gede Sunu',            'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Aris Sanjaya',         'Aris Sanjaya',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Reyner Barusu',        'Reyner Barusu',        'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  -- PENYERANG
  (gen_random_uuid(), 'Boris Kopitovic',      'Boris Kopitovic',      'ME', 'Montenegro', 'https://flagcdn.com/w40/me.png'),
  (gen_random_uuid(), 'Yabes Roni',           'Yabes Roni',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Jens Raven',           'Jens Raven',           'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  (gen_random_uuid(), 'Irfan Jaya',           'Irfan Jaya',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Rahmat Arjuna',        'Rahmat Arjuna',        'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Muhammad Rahmat',      'Muhammad Rahmat',      'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  (gen_random_uuid(), 'Diego Campos',         'Diego Campos',         'CR', 'Kosta Rika', 'https://flagcdn.com/w40/cr.png')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 3: Insert roster (nomor punggung + posisi)
-- Menggunakan club_season_id dari tabel club_seasons
-- ============================================================
INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
SELECT
  p.id,
  cs.id AS club_season_id,
  r.shirt_number,
  r.position
FROM (VALUES
  ('Mike Hauptmeijer',    1,  'GK'),
  ('Wayan Arta',          21, 'GK'),
  ('Dikri Yusron',        31, 'GK'),
  ('Fitrul Dwi Rustapa',  95, 'GK'),
  ('João Ferrari',         2,  'DF'),
  ('Kadek Arel',           4,  'DF'),
  ('Bagas Adi Nugroho',    5,  'DF'),
  ('Rizky Dwi Febrianto', 16, 'DF'),
  ('Ricky Fajrin',        24, 'DF'),
  ('Made Andhika',        33, 'DF'),
  ('Putu Panji',          44, 'DF'),
  ('Yusuf Meilana',       77, 'DF'),
  ('Gede Agus',           93, 'DF'),
  ('Komang Dedi',         87, 'DF'),
  ('Brandon Wilson',       6,  'MF'),
  ('Thijmen Goppel',       7,  'MF'),
  ('Jordy Bruijn',         8,  'MF'),
  ('Mirza Mustafic',      10, 'MF'),
  ('Tim Receveur',        14, 'MF'),
  ('Teppei Yachida',      17, 'MF'),
  ('Kadek Agung',         18, 'MF'),
  ('Maouri Simon',        42, 'MF'),
  ('Made Tito',           55, 'MF'),
  ('Gede Sunu',           28, 'MF'),
  ('Aris Sanjaya',        79, 'MF'),
  ('Reyner Barusu',       92, 'MF'),
  ('Boris Kopitovic',      9,  'FW'),
  ('Yabes Roni',          11, 'FW'),
  ('Jens Raven',          19, 'FW'),
  ('Irfan Jaya',          41, 'FW'),
  ('Rahmat Arjuna',       47, 'FW'),
  ('Muhammad Rahmat',     91, 'FW'),
  ('Diego Campos',        99, 'FW')
) AS r(full_name, shirt_number, position)
JOIN players p ON p.full_name = r.full_name
JOIN club_seasons cs ON
  cs.club_id  = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid
  AND cs.season_id = 'bb0a25d7-8676-40c8-88cd-9989df227169'::uuid
ON CONFLICT (player_id, club_season_id)
DO UPDATE SET
  shirt_number = EXCLUDED.shirt_number,
  position     = EXCLUDED.position;

-- ============================================================
-- VERIFIKASI — jalankan setelah insert selesai
-- ============================================================
SELECT
  cr.shirt_number AS "No",
  p.full_name     AS "Nama",
  p.display_name  AS "Display",
  cr.position     AS "Pos",
  p.country_name  AS "Negara"
FROM players p
JOIN club_rosters cr  ON cr.player_id    = p.id
JOIN club_seasons cs  ON cs.id           = cr.club_season_id
WHERE cs.club_id   = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid
  AND cs.season_id = 'bb0a25d7-8676-40c8-88cd-9989df227169'::uuid
ORDER BY
  CASE cr.position WHEN 'GK' THEN 1 WHEN 'DF' THEN 2 WHEN 'MF' THEN 3 ELSE 4 END,
  cr.shirt_number;
