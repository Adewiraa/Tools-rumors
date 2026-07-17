-- ============================================================
-- UPDATE country_flag_url untuk semua pemain asing Persib
-- Ganti dari flags.restcountries.com ke flagcdn.com (reliable)
-- ============================================================

-- Update berdasarkan country_code
UPDATE players
SET country_flag_url = 'https://flagcdn.com/w40/' || LOWER(country_code) || '.png'
WHERE country_code IS NOT NULL
  AND country_code != 'ID'
  AND (
    country_flag_url IS NULL
    OR country_flag_url = ''
    OR country_flag_url LIKE '%restcountries%'
  );

-- Update semua pemain Indonesia juga (untuk konsistensi)
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
  country_code,
  country_name,
  country_flag_url
FROM players
WHERE country_flag_url LIKE '%flagcdn%'
  AND country_code != 'ID'
ORDER BY country_name, full_name;
