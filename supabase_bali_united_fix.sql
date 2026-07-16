-- ============================================================
-- FIX INSERT PEMAIN BALI UNITED FC - PENDEKATAN LANGSUNG
-- Jalankan semua sekaligus di Supabase SQL Editor
-- ============================================================

-- STEP 1: Cek club_season yang ada
SELECT id AS club_season_id, club_id, season_id 
FROM club_seasons 
WHERE club_id = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid;

-- Jika kosong, insert dulu:
INSERT INTO club_seasons (club_id, season_id)
SELECT 
  '58061cea-6155-459b-9f5d-dbd51468415a'::uuid,
  'bb0a25d7-8676-40c8-88cd-9989df227169'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM club_seasons 
  WHERE club_id = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid
    AND season_id = 'bb0a25d7-8676-40c8-88cd-9989df227169'::uuid
);

-- STEP 2: Insert players (skip jika sudah ada berdasarkan full_name)
INSERT INTO players (id, full_name, display_name, country_code, country_name, country_flag_url)
SELECT gen_random_uuid(), v.full_name, v.display_name, v.cc, v.cn, v.flag
FROM (VALUES
  ('Mike Hauptmeijer',   'Mike Hauptmeijer',   'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  ('Wayan Arta',          'Wayan Arta',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Dikri Yusron',        'Dikri Yusron',        'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Fitrul Dwi Rustapa',  'Fitrul Dwi Rustapa',  'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Joao Ferrari',        'Joao Ferrari',        'BR', 'Brasil',     'https://flagcdn.com/w40/br.png'),
  ('Kadek Arel',          'Kadek Arel',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Bagas Adi Nugroho',   'Bagas Adi Nugroho',   'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Rizky Dwi Febrianto', 'Rizky Dwi Febrianto', 'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Ricky Fajrin',        'Ricky Fajrin',        'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Made Andhika',        'Made Andhika',        'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Putu Panji',          'Putu Panji',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Yusuf Meilana',       'Yusuf Meilana',       'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Gede Agus',           'Gede Agus',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Komang Dedi',         'Komang Dedi',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Brandon Wilson',      'Brandon Wilson',      'BW', 'Botswana',   'https://flagcdn.com/w40/bw.png'),
  ('Thijmen Goppel',      'Thijmen Goppel',      'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  ('Jordy Bruijn',        'Jordy Bruijn',        'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  ('Mirza Mustafic',      'Mirza Mustafic',      'LU', 'Luksemburg', 'https://flagcdn.com/w40/lu.png'),
  ('Tim Receveur',        'Tim Receveur',        'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  ('Teppei Yachida',      'Teppei Yachida',      'JP', 'Jepang',     'https://flagcdn.com/w40/jp.png'),
  ('Kadek Agung',         'Kadek Agung',         'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Maouri Simon',        'Maouri Simon',        'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Made Tito',           'Made Tito',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Gede Sunu',           'Gede Sunu',           'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Aris Sanjaya',        'Aris Sanjaya',        'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Reyner Barusu',       'Reyner Barusu',       'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Boris Kopitovic',     'Boris Kopitovic',     'ME', 'Montenegro', 'https://flagcdn.com/w40/me.png'),
  ('Yabes Roni',          'Yabes Roni',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Jens Raven',          'Jens Raven',          'NL', 'Belanda',    'https://flagcdn.com/w40/nl.png'),
  ('Irfan Jaya',          'Irfan Jaya',          'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Rahmat Arjuna',       'Rahmat Arjuna',       'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Muhammad Rahmat',     'Muhammad Rahmat',     'ID', 'Indonesia',  'https://flagcdn.com/w40/id.png'),
  ('Diego Campos',        'Diego Campos',        'CR', 'Kosta Rika', 'https://flagcdn.com/w40/cr.png')
) AS v(full_name, display_name, cc, cn, flag)
WHERE NOT EXISTS (
  SELECT 1 FROM players WHERE full_name = v.full_name
);

-- STEP 3: Insert roster — pakai subquery untuk dapat club_season_id
INSERT INTO club_rosters (player_id, club_season_id, shirt_number, position)
SELECT
  p.id AS player_id,
  cs.id AS club_season_id,
  r.no::integer,
  r.pos
FROM (VALUES
  ('Mike Hauptmeijer',    '1',  'GK'),
  ('Wayan Arta',          '21', 'GK'),
  ('Dikri Yusron',        '31', 'GK'),
  ('Fitrul Dwi Rustapa',  '95', 'GK'),
  ('Joao Ferrari',         '2', 'DF'),
  ('Kadek Arel',           '4', 'DF'),
  ('Bagas Adi Nugroho',    '5', 'DF'),
  ('Rizky Dwi Febrianto', '16', 'DF'),
  ('Ricky Fajrin',        '24', 'DF'),
  ('Made Andhika',        '33', 'DF'),
  ('Putu Panji',          '44', 'DF'),
  ('Yusuf Meilana',       '77', 'DF'),
  ('Gede Agus',           '93', 'DF'),
  ('Komang Dedi',         '87', 'DF'),
  ('Brandon Wilson',       '6', 'MF'),
  ('Thijmen Goppel',       '7', 'MF'),
  ('Jordy Bruijn',         '8', 'MF'),
  ('Mirza Mustafic',      '10', 'MF'),
  ('Tim Receveur',        '14', 'MF'),
  ('Teppei Yachida',      '17', 'MF'),
  ('Kadek Agung',         '18', 'MF'),
  ('Maouri Simon',        '42', 'MF'),
  ('Made Tito',           '55', 'MF'),
  ('Gede Sunu',           '28', 'MF'),
  ('Aris Sanjaya',        '79', 'MF'),
  ('Reyner Barusu',       '92', 'MF'),
  ('Boris Kopitovic',      '9', 'FW'),
  ('Yabes Roni',          '11', 'FW'),
  ('Jens Raven',          '19', 'FW'),
  ('Irfan Jaya',          '41', 'FW'),
  ('Rahmat Arjuna',       '47', 'FW'),
  ('Muhammad Rahmat',     '91', 'FW'),
  ('Diego Campos',        '99', 'FW')
) AS r(full_name, no, pos)
JOIN players p ON p.full_name = r.full_name
CROSS JOIN (
  SELECT id FROM club_seasons
  WHERE club_id  = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid
    AND season_id = 'bb0a25d7-8676-40c8-88cd-9989df227169'::uuid
  LIMIT 1
) cs
WHERE NOT EXISTS (
  SELECT 1 FROM club_rosters cr2
  WHERE cr2.player_id = p.id AND cr2.club_season_id = cs.id
);

-- VERIFIKASI AKHIR
SELECT
  cr.shirt_number AS no,
  p.full_name,
  cr.position,
  p.country_name
FROM players p
JOIN club_rosters cr ON cr.player_id = p.id
JOIN club_seasons cs ON cs.id = cr.club_season_id
WHERE cs.club_id = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid
ORDER BY
  CASE cr.position WHEN 'GK' THEN 1 WHEN 'DF' THEN 2 WHEN 'MF' THEN 3 ELSE 4 END,
  cr.shirt_number;
