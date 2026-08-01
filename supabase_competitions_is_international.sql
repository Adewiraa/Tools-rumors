-- ============================================================
-- MIGRATION: Tambahkan kolom agenda internasional ke tabel kompetisi
-- Jalankan di Supabase Dashboard -> SQL Editor
-- ============================================================

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS is_international BOOLEAN NOT NULL DEFAULT FALSE;

-- Paksa PostgREST/Supabase refresh schema cache setelah kolom baru dibuat.
NOTIFY pgrst, 'reload schema';
