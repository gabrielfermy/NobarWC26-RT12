# World Cup Nobar Prediction App

Aplikasi web interaktif untuk mengelola dan memantau kegiatan Nonton Bareng (Nobar) Piala Dunia tingkat kelurahan dengan fitur tebak skor berbayar.

---

## 📚 Dokumentasi Proyek

Untuk mempermudah pelacakan dan pengembangan proyek ini, silakan baca dokumentasi berikut:
* **[Project Requirement Documentation (PRD)](file:///k:/Personal/RT12/NobarWC26-RT12/docs/prd.md)**: Detail fitur, alur tebak skor, pembayaran (QRIS & Manual), serta pencetakan struk fisik.
* **[Panduan Setup Database (Supabase)](file:///k:/Personal/RT12/NobarWC26-RT12/docs/database_setup.md)**: Skema database PostgreSQL, aturan Row Level Security (RLS), dan trigger sinkronisasi profil user.

---

## 🚀 Memulai Pengembangan (Lokal)

### 1. Instalasi Dependensi
Pastikan Anda berada di direktori utama, lalu jalankan:
```bash
npm install
```

### 2. Konfigurasi Environment Variables
Buat berkas `.env.local` di folder root dan isi variabel lingkungan berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

XENDIT_SECRET_KEY=your_xendit_secret_key
XENDIT_WEBHOOK_VERIFICATION_TOKEN=your_xendit_webhook_token
```

### 3. Jalankan Server Dev
Mulai server lokal Anda:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

