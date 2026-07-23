-- ============================================================
-- MIGRATION: Tambah negara asal klub
-- Jalankan di Supabase Dashboard -> SQL Editor
-- ============================================================

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS country TEXT;

UPDATE public.clubs
SET country = 'Indonesia'
WHERE country IS NULL OR trim(country) = '';

ALTER TABLE public.clubs
  ALTER COLUMN country SET DEFAULT 'Indonesia';

ALTER TABLE public.clubs
  ALTER COLUMN country SET NOT NULL;

GRANT ALL PRIVILEGES ON TABLE public.clubs TO postgres, service_role, anon, authenticated;

-- Paksa PostgREST/Supabase refresh schema cache setelah kolom baru dibuat.
NOTIFY pgrst, 'reload schema';
