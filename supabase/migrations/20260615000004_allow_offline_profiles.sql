-- 1. Hapus constraint foreign key lama yang mengaitkan primary key 'id' ke auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Atur default value primary key 'id' agar digenerate otomatis menggunakan UUID acak
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Tambahkan kolom 'auth_user_id' untuk merelasikan secara opsional ke auth.users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE;

-- 4. Pindahkan data relasi lama ke kolom 'auth_user_id' yang baru
UPDATE profiles SET auth_user_id = id WHERE auth_user_id IS NULL;

-- 5. Tambahkan index unik untuk phone_number (WhatsApp) untuk menghindari nomor ganda, kecuali nomor kosong '-'
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_uidx ON profiles (phone_number) 
WHERE phone_number <> '-' AND phone_number <> '';

-- 6. Perbarui RLS policies agar mencakup pencarian via auth_user_id
DROP POLICY IF EXISTS "User dapat mengelola profil sendiri" ON profiles;
CREATE POLICY "User dapat mengelola profil sendiri" ON profiles FOR ALL TO authenticated 
    USING (auth.uid() = auth_user_id);

-- 7. Perbarui fungsi trigger sinkronisasi profil saat user baru terdaftar di Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  existing_profile_id UUID;
  meta_phone VARCHAR(50);
  meta_name VARCHAR(255);
BEGIN
  -- Ambil data phone_number dan name dari user metadata
  meta_phone := COALESCE(new.raw_user_meta_data->>'phone_number', '');
  meta_name := COALESCE(new.raw_user_meta_data->>'name', 'User Baru');

  -- Jika pendaftaran menyertakan nomor telepon, cari profil offline yang cocok
  IF meta_phone <> '' AND meta_phone <> '-' THEN
    SELECT id INTO existing_profile_id FROM public.profiles WHERE phone_number = meta_phone LIMIT 1;
  END IF;

  IF existing_profile_id IS NOT NULL THEN
    -- Jika profil offline ditemukan, hubungkan akun auth ini ke profil tersebut
    UPDATE public.profiles
    SET auth_user_id = new.id,
        name = CASE WHEN name = 'User Baru' OR name = '-' THEN meta_name ELSE name END,
        role = CASE WHEN new.email = 'admin@nobar.id' THEN 'admin' ELSE role END
    WHERE id = existing_profile_id;
  ELSE
    -- Jika tidak ada profil yang cocok, buat profil baru
    INSERT INTO public.profiles (id, auth_user_id, name, phone_number, role)
    VALUES (
      gen_random_uuid(),
      new.id,
      meta_name,
      CASE WHEN meta_phone = '' THEN '-' ELSE meta_phone END,
      CASE WHEN new.email = 'admin@nobar.id' THEN 'admin' ELSE 'user' END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Pastikan trigger terpasang kembali dengan benar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
