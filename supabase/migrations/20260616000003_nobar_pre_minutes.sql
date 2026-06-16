-- Menambahkan kolom nobar_pre_minutes ke tabel matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS nobar_pre_minutes INTEGER DEFAULT 30;
