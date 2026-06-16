-- Menambahkan kolom is_nobar dan nobar_location ke tabel matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_nobar BOOLEAN DEFAULT FALSE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS nobar_location VARCHAR(255);
