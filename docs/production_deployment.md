# Panduan Deployment Produksi & Struktur Aplikasi

Dokumen ini menjelaskan struktur arsitektur aplikasi, langkah-langkah deployment ke lingkungan produksi (online), panduan pembersihan database (cleanup), dan cara inisialisasi user administrator pertama.

---

## 1. Struktur Folder & Arsitektur Aplikasi

Aplikasi dibangun menggunakan **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Supabase (PostgreSQL + Auth)**.

Berikut adalah gambaran struktur folder utama:

*   `src/app/` - Halaman dan rute aplikasi Next.js:
    *   `src/app/page.tsx` - Halaman beranda utama (Jadwal terdekat & info nobar).
    *   `src/app/login/` - Halaman login warga dan admin.
    *   `src/app/register/` - Halaman pendaftaran warga.
    *   `src/app/my-predictions/` - Halaman tebakan/prediksi milik warga yang sedang masuk.
    *   `src/app/leaderboard/` - Halaman klasemen poin berdasarkan ketepatan tebakan.
    *   `src/app/nobar/` - Halaman info jadwal acara nonton bareng kelurahan.
    *   `src/app/admin/` - Halaman Dashboard Admin untuk kelola skor, cetak struk thermal, input tebakan tunai, & approval pencairan dana.
    *   `src/app/api/` - Rute API backend (Midtrans/Xendit payments, Sinkronisasi API Jadwal, dll).
*   `src/components/` - Komponen UI global (Navbar, ReceiptPrint, AutoLogoutProvider).
*   `src/lib/` - Konfigurasi pihak ketiga dan utilitas helper:
    *   `src/lib/supabase.ts` - Client Supabase dengan konfigurasi `sessionStorage` untuk perlindungan durasi sesi.
*   `supabase/migrations/` - Berkas migrasi database SQL terurut untuk membuat skema tabel, RLS, trigger, dan view.

---

## 2. Langkah Deployment ke Produksi (Online)

Untuk merilis aplikasi ini ke publik (production), lakukan langkah-langkah berikut:

### Langkah A: Setup Database Produksi di Supabase
1.  Buat proyek baru di [Supabase Console](https://supabase.com).
2.  Buka menu **SQL Editor** pada Dashboard Supabase Anda.
3.  Jalankan berkas migrasi SQL secara berurutan sesuai berkas di `supabase/migrations/` atau gabungan seluruh skema.
    *   *Pastikan RLS (Row-Level Security) aktif pada semua tabel.*
    *   *Pastikan fungsi trigger `public.handle_new_user()` dan trigger `on_auth_user_created` terpasang di database online.*

### Langkah B: Konfigurasi Keamanan Sesi di Supabase Dashboard
1.  Di Dashboard Supabase Anda, buka **Project Settings** (ikon gerigi) -> **API**.
2.  Di bagian **JWT Settings**, ubah **JWT Expiry** menjadi `900` detik (15 menit). Langkah ini membatasi umur token otentikasi di level database demi keamanan (inactivity timeout).
3.  Klik **Save**.

### Langkah C: Deploy Frontend di Vercel
1.  Hubungkan repositori Git Anda ke proyek baru di [Vercel](https://vercel.com).
2.  Masukkan variabel lingkungan (**Environment Variables**) berikut di Vercel Settings sebelum menekan tombol *Deploy*:

```env
# Supabase Credentials (ambil dari Settings -> API Supabase Anda)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Midtrans / Xendit Payment Gateway Credentials (jika menggunakan)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_SERVER_KEY=your-midtrans-server-key
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true
```

3.  Jalankan **Deploy**. Vercel akan otomatis melakukan proses build.

---

## 3. Inisialisasi User Administrator Pertama

Ketika database baru dibuat, belum ada akun administrator. Berikut cara membuat atau mengubah user biasa menjadi admin:

### Metode 1: Melalui Dashboard Supabase (Tanpa SQL)
1.  Buka web aplikasi Anda yang sudah di-deploy, kunjungi halaman `/register` untuk membuat akun baru dengan mengisi nama, nomor WhatsApp, email, dan password.
2.  Setelah terdaftar, buka **Supabase Dashboard** proyek Anda -> **Table Editor**.
3.  Pilih tabel `profiles`.
4.  Cari baris akun yang baru saja Anda daftarkan, ubah kolom `role` dari `'user'` menjadi `'admin'`.
5.  Simpan perubahan. Akun tersebut sekarang memiliki akses penuh ke `/admin`.

### Metode 2: Menggunakan SQL Editor (Rekomendasi)
Jika Anda sudah mendaftarkan email di Supabase Auth, jalankan query berikut di SQL Editor untuk menaikkan role menjadi admin secara instan:

```sql
-- Ganti 'email_anda@domain.com' dengan email admin yang didaftarkan
UPDATE public.profiles
SET role = 'admin'
WHERE auth_user_id IN (
    SELECT id FROM auth.users WHERE email = 'email_anda@domain.com'
);
```

---

## 4. Pembersihan Data Database (Cleanup)

Sebelum kompetisi nobar dimulai secara resmi (atau setelah fase uji coba selesai), Anda mungkin perlu membersihkan data transaksi bayangan tanpa menghapus daftar pertandingan/jadwal laga yang sudah diimpor.

Buka **SQL Editor** di Supabase dan jalankan perintah pembersihan berikut:

### Hapus Seluruh Transaksi & Tebakan (Pertandingan Tetap Ada)
Perintah ini akan membersihkan semua tebakan warga, riwayat pembayaran, dan penarikan dana tanpa mengganggu jadwal pertandingan:

```sql
-- Matikan sementara perlindungan RLS agar admin dapat menghapus massal (jika diperlukan)
-- Hapus data dengan aman (Foreign Key cascading akan otomatis menghapus predictions terkait)
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.withdrawals CASCADE;
TRUNCATE TABLE public.predictions CASCADE;

-- Mengembalikan nilai urutan penomoran (bila ada kolom auto-increment)
-- Catatan: RLS akan tetap aktif untuk pengakses luar setelah truncate.
```

### Hapus Seluruh User Non-Admin
Jika Anda ingin menghapus seluruh user uji coba tetapi tetap menyisakan akun admin:

```sql
-- Hapus semua user biasa dari auth.users (akan men-cascade hapus ke public.profiles)
DELETE FROM auth.users
WHERE id NOT IN (
    SELECT auth_user_id FROM public.profiles WHERE role = 'admin'
);
```
