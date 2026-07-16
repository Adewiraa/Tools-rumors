-- ============================================================
-- DEBUG QUERIES: PEMAIN BALI UNITED TIDAK MUNCUL
-- Jalankan per blok secara berurutan di Supabase SQL Editor
-- ============================================================

-- ============================================================
-- QUERY 1: Cek apakah pemain sudah masuk ke tabel players
-- Expected: 4 baris (atau lebih kalau insert berhasil)
-- Jika kosong: berarti INSERT STEP 2 belum/gagal dijalankan
-- ============================================================
SELECT id, full_name, country_name 
FROM players 
WHERE full_name IN ('Mike Hauptmeijer', 'Wayan Arta', 'Kadek Arel', 'Diego Campos')
LIMIT 10;

-- ============================================================
-- QUERY 2: Cek apakah club_seasons untuk Bali United ada
-- Expected: minimal 1 baris dengan season_id yg benar
-- Jika kosong: berarti INSERT STEP 1 gagal
-- ============================================================
SELECT 
  cs.id         AS club_season_id,
  cs.club_id,
  cs.season_id,
  c.name        AS club_name
FROM club_seasons cs
JOIN clubs c ON c.id = cs.club_id
WHERE cs.club_id = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid;

-- ============================================================
-- QUERY 3: Cek club_rosters untuk Bali United
-- Expected: 33 baris (total pemain)
-- Jika kosong: berarti INSERT STEP 3 gagal
-- ============================================================
SELECT 
  cr.player_id,
  cr.club_season_id,
  cr.shirt_number,
  cr.position
FROM club_rosters cr
JOIN club_seasons cs ON cs.id = cr.club_season_id
WHERE cs.club_id = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid
LIMIT 10;

-- ============================================================
-- QUERY 4: Cek total count per tabel (gambaran umum)
-- ============================================================
SELECT 
  (SELECT COUNT(*) FROM players) AS total_players,
  (SELECT COUNT(*) FROM club_seasons WHERE club_id = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid) AS bali_club_seasons,
  (SELECT COUNT(*) FROM club_rosters cr JOIN club_seasons cs ON cs.id = cr.club_season_id WHERE cs.club_id = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid) AS bali_rosters;

-- ============================================================
-- QUERY 5: Cek apakah season_id yang dipakai benar
-- Expected: ada baris dengan id = bb0a25d7-...
-- ============================================================
SELECT id, name FROM seasons 
WHERE id = 'bb0a25d7-8676-40c8-88cd-9989df227169'::uuid;

-- ============================================================
-- QUERY 6: Cek konflik nama pemain (duplikat)
-- Jika JOIN di STEP 3 tidak match, mungkin nama ada spasi/typo
-- ============================================================
SELECT full_name, COUNT(*) as jumlah
FROM players
WHERE full_name IN (
  'Mike Hauptmeijer', 'Wayan Arta', 'Dikri Yusron', 'Fitrul Dwi Rustapa',
  'Joao Ferrari', 'Kadek Arel', 'Bagas Adi Nugroho', 'Rizky Dwi Febrianto',
  'Ricky Fajrin', 'Made Andhika', 'Putu Panji', 'Yusuf Meilana',
  'Gede Agus', 'Komang Dedi', 'Brandon Wilson', 'Thijmen Goppel',
  'Jordy Bruijn', 'Mirza Mustafic', 'Tim Receveur', 'Teppei Yachida',
  'Kadek Agung', 'Maouri Simon', 'Made Tito', 'Gede Sunu',
  'Aris Sanjaya', 'Reyner Barusu', 'Boris Kopitovic', 'Yabes Roni',
  'Jens Raven', 'Irfan Jaya', 'Rahmat Arjuna', 'Muhammad Rahmat', 'Diego Campos'
)
GROUP BY full_name
ORDER BY full_name;

-- ============================================================
-- QUERY 7: Verifikasi lengkap - roster Bali United gabungan
-- Expected: 33 pemain dengan nama, posisi, nomor punggung
-- ============================================================
SELECT
  cr.shirt_number AS "No",
  p.full_name     AS "Nama",
  cr.position     AS "Pos",
  p.country_name  AS "Negara",
  cs.season_id    AS "Season"
FROM players p
JOIN club_rosters cr  ON cr.player_id    = p.id
JOIN club_seasons cs  ON cs.id           = cr.club_season_id
WHERE cs.club_id   = '58061cea-6155-459b-9f5d-dbd51468415a'::uuid
ORDER BY
  CASE cr.position WHEN 'GK' THEN 1 WHEN 'DF' THEN 2 WHEN 'MF' THEN 3 ELSE 4 END,
  cr.shirt_number;

-- ============================================================
-- QUERY 8: Cek apakah ada RLS policy yang memblokir
-- Jalankan sebagai superuser/service_role
-- ============================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('players', 'club_seasons', 'club_rosters');
