# Panduan Setup Database (Supabase)

Dokumen ini memuat langkah setup database secara lokal menggunakan Supabase CLI, skema database PostgreSQL lengkap (termasuk kolom penunjang Nobar dan tabel Pencairan Dana), aturan keamanan Row-Level Security (RLS), dan pemicu trigger basis data.

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
   *Catatan: Semua berkas migrasi database di `supabase/migrations/` akan otomatis diterapkan.*

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

## 1. Skema Database Lengkap

Berikut adalah skema tabel lengkap beserta tipe data, default, dan foreign key yang digunakan di lingkungan staging maupun produksi online:

```sql
-- 1. Tabel Pertandingan (Matches)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_a VARCHAR(100) NOT NULL,
    team_b VARCHAR(100) NOT NULL,
    match_time TIMESTAMP WITH TIME ZONE NOT NULL,
    stage VARCHAR(50) NOT NULL, -- Contoh: '32 Besar', '16 Besar', 'Semifinal', 'Final'
    stadium VARCHAR(150),
    score_a INTEGER,
    score_b INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed')),
    is_nobar BOOLEAN DEFAULT FALSE,
    nobar_location VARCHAR(255),
    nobar_pre_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Profil User / Peserta (Profiles)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_user_id UUID DEFAULT auth.uid(), -- Menyimpan pemetaan ID Supabase Auth
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Transaksi / Invoice (Transactions)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Kelipatan Rp10.000 (misal: 3 tebakan = Rp30.000)
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('qris', 'cash')),
    transaction_reference VARCHAR(255), -- ID invoice pembayaran digital
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
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Penarikan Dana / Klaim Saldo Hadiah (Withdrawals)
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 2. Keamanan & Kebijakan Row Level Security (RLS)

Untuk menjamin transparansi data tebakan dan keamanan transaksi keuangan warga, RLS wajib diaktifkan pada semua tabel:

```sql
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
```

### Fungsi Helper Keamanan Admin (Non-Recursive)
Fungsi di bawah ini digunakan untuk memeriksa status peran administrator secara efisien tanpa menyebabkan loop rekursi kebijakan RLS:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;
```

### Kebijakan Akses (Security Policies)

#### 🛡️ Kebijakan Publik (Membaca Data)
```sql
CREATE POLICY "Jadwal dapat dilihat siapa saja" ON matches FOR SELECT TO public USING (true);
CREATE POLICY "Profil dapat dilihat siapa saja" ON profiles FOR SELECT TO public USING (true);
CREATE POLICY "Tebakan lunas dapat dilihat siapa saja" ON predictions FOR SELECT TO public 
    USING (EXISTS (SELECT 1 FROM transactions WHERE id = predictions.transaction_id AND payment_status = 'paid'));
CREATE POLICY "Transaksi lunas dapat dilihat siapa saja" ON transactions FOR SELECT TO public USING (payment_status = 'paid');
```

#### 🔑 Kebijakan Pengguna Terdaftar (Akses Mandiri)
```sql
CREATE POLICY "User dapat mengelola profil sendiri" ON profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "User dapat melihat transaksi pending sendiri" ON transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User dapat membuat transaksi baru" ON transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User dapat melihat tebakan sendiri" ON predictions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User dapat membuat tebakan baru" ON predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User dapat melihat penarikan sendiri" ON withdrawals FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = withdrawals.user_id AND auth_user_id = auth.uid()));
CREATE POLICY "User dapat membuat penarikan baru" ON withdrawals FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = withdrawals.user_id AND auth_user_id = auth.uid()));
```

#### 👑 Kebijakan Istimewa Administrator
```sql
CREATE POLICY "Admin memiliki akses penuh ke matches" ON matches FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admin memiliki akses penuh ke transactions" ON transactions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin memiliki akses penuh ke predictions" ON predictions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin memiliki akses penuh ke profiles" ON profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin memiliki akses penuh ke withdrawals" ON withdrawals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
```

---

## 3. Otomatisasi Sinkronisasi Profil dari Auth Supabase

Jalankan trigger ini agar profil pengguna di tabel `public.profiles` terbuat secara otomatis saat ada user baru yang mendaftar melalui Supabase Auth:

```sql
-- Membuat function sinkronisasi profil baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, auth_user_id, name, phone_number, role)
  VALUES (
    new.id,
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User Baru'),
    COALESCE(new.raw_user_meta_data->>'phone_number', '-'),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Membuat pemicu trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
