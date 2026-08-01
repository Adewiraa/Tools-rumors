-- ============================================================
-- MIGRATION: Tambahkan kolom is_national_team ke tabel clubs
-- Jalankan di Supabase Dashboard -> SQL Editor
-- ============================================================

ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS is_national_team BOOLEAN NOT NULL DEFAULT FALSE;

-- Paksa PostgREST/Supabase refresh schema cache setelah kolom baru dibuat.
NOTIFY pgrst, 'reload schema';
