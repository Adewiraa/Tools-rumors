-- ============================================================
-- FIX BENDERA PEMAIN PERSIB (B. Sekulić & L. Menalo)
-- ============================================================

-- 1. Fix B. Sekulić (Slovakia)
UPDATE players
SET 
  country_code = 'SK',
  country_name = 'Slovakia',
  country_flag_url = 'https://flagcdn.com/w40/sk.png'
WHERE LOWER(full_name) LIKE '%sekul%' OR LOWER(display_name) LIKE '%sekul%';

-- 2. Fix L. Menalo (Bosnia and Herzegovina)
UPDATE players
SET 
  country_code = 'BA',
  country_name = 'Bosnia and Herzegovina',
  country_flag_url = 'https://flagcdn.com/w40/ba.png'
WHERE LOWER(full_name) LIKE '%menalo%' OR LOWER(display_name) LIKE '%menalo%';

-- 3. Update country_flag_url untuk semua pemain asing lainnya
UPDATE players
SET country_flag_url = 'https://flagcdn.com/w40/' || LOWER(country_code) || '.png'
WHERE country_code IS NOT NULL
  AND country_code != 'ID'
  AND (
    country_flag_url IS NULL
    OR country_flag_url = ''
    OR country_flag_url LIKE '%restcountries%'
  );

-- 4. Update pemain Indonesia
UPDATE players
SET country_flag_url = 'https://flagcdn.com/w40/id.png'
WHERE country_code = 'ID'
  AND (
    country_flag_url IS NULL
    OR country_flag_url = ''
    OR country_flag_url LIKE '%restcountries%'
  );

-- Verifikasi hasil
SELECT
  full_name,
  display_name,
  country_code,
  country_name,
  country_flag_url
FROM players
WHERE LOWER(full_name) LIKE '%sekul%' OR LOWER(full_name) LIKE '%menalo%' OR country_code != 'ID';
