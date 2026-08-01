-- ============================================================
-- MIGRATION: Tambahkan kolom primary_color ke tabel competitions
-- Jalankan di Supabase Dashboard -> SQL Editor
-- ============================================================

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS primary_color VARCHAR(10) NOT NULL DEFAULT '#0F172A';

-- Paksa PostgREST/Supabase refresh schema cache setelah kolom baru dibuat.
NOTIFY pgrst, 'reload schema';
