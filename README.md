# 🏆 Nobar Piala Dunia 2026 RT 12 Pelem Kidul

Aplikasi web interaktif premium untuk memeriahkan dan mengelola kegiatan **Nonton Bareng (Nobar) Piala Dunia 2026** di tingkat RT 12 Pelem Kidul. Aplikasi ini menggabungkan sistem tebak skor berbayar transparan dengan manajemen offline-friendly untuk panitia lokal.

---

## 🎯 Gambaran Umum Proyek (Business Logic)

Aplikasi ini dibuat khusus untuk memfasilitasi antusiasme warga selama pergelaran Piala Dunia 2026. Alur utama sistem dirancang sebagai berikut:
1. **Pendaftaran Warga**: Warga mendaftar menggunakan nomor WhatsApp atau Email aktif.
2. **Sistem Tebak Skor Terbuka**: Warga memasukkan prediksi skor untuk pertandingan babak gugur. Semua tebakan warga bersifat terbuka dan dapat diakses publik setelah statusnya lunas (`paid`) untuk menghindari manipulasi data.
3. **Multi-Tebakan Terbatas**: Untuk setiap pertandingan, satu warga dapat memasukkan maksimal **5 tebakan** (Rp10.000 per tebakan, maksimal Rp50.000 per laga per user) untuk meningkatkan peluang menang.
4. **Metode Pembayaran**:
   * **Online (QRIS)**: Pembayaran instan otomatis menggunakan gateway pembayaran (terintegrasi Sandbox).
   * **Offline (Tunai via Admin)**: Warga menyetorkan uang tunai kepada panitia RT. Admin menginput tebakan secara massal lalu mencetak **satu struk fisik thermal terkonsolidasi** menggunakan printer thermal ukuran 58mm/80mm.
5. **Pembagian Hadiah (Pool Prize)**:
   * Total biaya tebakan yang terkumpul di suatu pertandingan masuk ke dalam *Prize Pool*.
   * Setelah admin memperbarui skor akhir laga, sistem menghitung warga yang berhasil menebak skor dengan tepat.
   * Uang pool dibagikan rata kepada para pemenang. Jika hadiah per pemenang > Rp20.000, dipotong host fee sebesar 10% untuk kas RT 12. Jika <= Rp20.000, tidak ada potongan host fee.
   * Warga dapat mengajukan klaim pencairan dana (withdraw) secara transfer bank (mengunggah struk bukti) atau tunai langsung dari kas fisik admin.

---

## 🛠️ Teknologi yang Digunakan

Aplikasi ini mengadopsi stack modern yang andal dan mudah dideploy:
* **Framework**: Next.js 14 (App Router) + TypeScript
* **Database & Auth**: Supabase (PostgreSQL) dengan pemicu trigger basis data serta RLS (Row-Level Security)
* **Styling**: Tailwind CSS + Shadcn/ui (Aksen Hijau Elektrik, Merah Crimson, & Hitam Premium)
* **Keamanan Sesi**: Inactivity Auto-Logout Provider (15 Menit) + Token Expiry Server-Side (sessionStorage client fallback)

---

## 📂 Panduan Dokumentasi Lengkap

Untuk detail teknis mendalam, bacalah dokumen-dokumen berikut di dalam direktori `docs`:
1. 📄 **[Project Requirement Documentation (PRD)](file:///k:/Personal/RT12/NobarWC26-RT12/docs/prd.md)**
   * Menjelaskan detail fitur, desain visual, batasan fungsional, dan desain responsif mobile-first.
2. 📄 **[Panduan Setup Database (Supabase)](file:///k:/Personal/RT12/NobarWC26-RT12/docs/database_setup.md)**
   * Menjelaskan skema tabel database (Matches, Profiles, Transactions, Predictions), konfigurasi Row-Level Security (RLS) lengkap, dan trigger sinkronisasi profil otomatis dari auth.
3. 📄 **[Panduan Deployment Produksi & Struktur Aplikasi](file:///k:/Personal/RT12/NobarWC26-RT12/docs/production_deployment.md)**
   * Menjelaskan struktur file proyek, langkah deployment online ke Vercel dan Supabase Cloud, inisialisasi akun admin pertama, serta instruksi pembersihan database sebelum peluncuran resmi.
4. 📄 **[Panduan Integrasi Pihak Ketiga (Integrations)](file:///k:/Personal/RT12/NobarWC26-RT12/docs/integrations.md)**
   * Menjelaskan detail teknis sinkronisasi otomatis jadwal laga ESPN API dan sistem verifikasi signature webhook Midtrans Payment Gateway.

---

## 💻 Cara Menjalankan Aplikasi di Lokal (Pengembangan)

### Prasyarat
* Node.js versi 18 atau lebih baru.
* Docker Desktop (diperlukan jika ingin menjalankan Supabase lokal).

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Supabase Lokal (Opsional)
Jika ingin mengembangkan menggunakan database offline lokal:
```bash
npx supabase init
npx supabase start
```
*Gunakan kredensial yang muncul di terminal untuk mengisi file `.env.local` Anda.*

### 3. Buat File Environment `.env.local`
Buat file bernama `.env.local` di folder root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Opsional: Credentials Midtrans / Xendit untuk testing pembayaran
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_SERVER_KEY=your_server_key
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 👥 Kontribusi & Pemeliharaan

* **Keamanan Sesi**: Konfigurasi client Supabase telah diatur di [supabase.ts](file:///k:/Personal/RT12/NobarWC26-RT12/src/lib/supabase.ts) menggunakan `sessionStorage` agar sesi otomatis hilang saat browser ditutup. Jika ingin memperketat sesi, ikuti instruksi konfigurasi JWT Expiry di [production_deployment.md](file:///k:/Personal/RT12/NobarWC26-RT12/docs/production_deployment.md).
* **Reset Database**: Harap gunakan instruksi `TRUNCATE` di panduan deployment saat memotong data uji coba sebelum masuk ke hari-H turnamen.
