# Panduan Setup Database (Supabase)

Dokumen ini memuat langkah setup database secara lokal menggunakan Supabase CLI, skema database PostgreSQL, aturan keamanan Row-Level Security (RLS), dan panduan migrasi.

---

## 0. Setup Supabase Lokal (Rekomendasi Pengembangan)

Anda tidak perlu membuat akun online terlebih dahulu untuk mulai mengembangkan. Kita bisa menjalankan Supabase di komputer Anda menggunakan **Supabase CLI** dan **Docker**.

### Prasyarat:
* Pastikan aplikasi **Docker Desktop** sudah berjalan di komputer Anda.

### Langkah Setup:
1. **Inisialisasi Supabase Lokal**:
   Jalankan perintah ini di direktori utama proyek untuk membuat konfigurasi Supabase lokal:
   ```bash
   npx supabase init
   ```
2. **Jalankan Supabase**:
   Jalankan perintah berikut untuk mengunduh image Docker dan menyalakan server database, auth, serta dashboard lokal:
   ```bash
   npx supabase start
   ```
   *Catatan: Migrasi database di [supabase/migrations/20260615000000_init.sql](file:///k:/Personal/RT12/NobarWC26-RT12/supabase/migrations/20260615000000_init.sql) akan otomatis diterapkan.*

3. **Gunakan Kredensial Lokal**:
   Setelah berhasil dijalankan, terminal akan menampilkan detail API. Salin nilai tersebut ke berkas `.env.local` di root proyek:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dengan_anon_key_dari_terminal
   SUPABASE_SERVICE_ROLE_KEY=isi_dengan_service_role_key_dari_terminal
   ```
4. **Dashboard Lokal (Supabase Studio)**:
   Anda bisa mengelola data secara visual dengan membuka tautan dashboard studio lokal di: **http://127.0.0.1:54323**

---

## 1. Skema Database (Untuk Deployment Produksi / Online)

Jalankan script SQL berikut di **SQL Editor** pada Supabase Console online Anda jika nanti ingin melakukan deploy ke Cloud:

```sql
-- 1. Tabel Pertandingan (Matches)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_a VARCHAR(100) NOT NULL,
    team_b VARCHAR(100) NOT NULL,
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    stage VARCHAR(50) NOT NULL, -- Contoh: '32 Besar', '16 Besar', 'Perempat Final', 'Final'
    score_a INTEGER,
    score_b INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Profil User / Peserta (Profiles)
-- Catatan: Tabel ini terhubung secara cascading dengan tabel bawaan auth.users Supabase.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Transaksi / Invoice (Transactions)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Kelipatan Rp10.000 (misal: 3 tebakan = 30000)
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('qris', 'cash')),
    transaction_reference VARCHAR(255), -- ID invoice Xendit atau referensi Admin
    is_printed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Tebak Skor / Prediksi (Predictions)
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
    predicted_score_a INTEGER NOT NULL,
    predicted_score_b INTEGER NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE, -- Ditautkan ke transaksi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 2. Keamanan & Row Level Security (RLS)

Untuk menjamin keamanan data dan transparansi taruhan, aktifkan RLS dan buat kebijakan (policies) berikut:

```sql
-- Mengaktifkan RLS pada masing-masing tabel
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Publik (Semua pengunjung web)
CREATE POLICY "Jadwal dapat dilihat siapa saja" ON matches FOR SELECT TO public USING (true);
CREATE POLICY "Profil dapat dilihat siapa saja" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Tebakan lunas dapat dilihat siapa saja" ON predictions FOR SELECT TO public 
    USING (EXISTS (SELECT 1 FROM transactions WHERE id = predictions.transaction_id AND payment_status = 'paid'));
CREATE POLICY "Transaksi lunas dapat dilihat siapa saja" ON transactions FOR SELECT TO public USING (payment_status = 'paid');

-- Kebijakan User yang Terautentikasi (Terlogin)
CREATE POLICY "User dapat mengelola profil sendiri" ON profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "User dapat melihat transaksi pending sendiri" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User dapat membuat transaksi baru" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User dapat melihat tebakan sendiri" ON predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User dapat membuat tebakan baru" ON predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Kebijakan Khusus Admin (Berdasarkan kolom 'role' di tabel profiles)
CREATE POLICY "Admin memiliki akses penuh ke matches" ON matches FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin memiliki akses penuh ke transactions" ON transactions FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin memiliki akses penuh ke predictions" ON predictions FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

## 3. Otomatisasi Sinkronisasi Profil dari Auth Supabase

Agar profil pengguna di tabel `profiles` terbuat secara otomatis saat ada user baru yang mendaftar melalui Supabase Auth, jalankan Trigger berikut:

```sql
-- Membuat function untuk memasukkan profil baru saat user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone_number, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'phone_number', '-'),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Membuat trigger setelah proses sign up selesai
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
