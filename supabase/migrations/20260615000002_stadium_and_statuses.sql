-- 1. Menghapus check constraint status yang lama
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;

-- 2. Menambahkan kolom stadium
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stadium VARCHAR(255);

-- 3. Menambahkan check constraint status yang baru dan lebih detail untuk live match
ALTER TABLE matches ADD CONSTRAINT matches_status_check 
  CHECK (status IN ('scheduled', 'first_half', 'half_time', 'second_half', 'overtime', 'penalties', 'completed'));
