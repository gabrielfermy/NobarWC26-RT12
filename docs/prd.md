# Project Requirement Documentation (PRD)

Aplikasi Nonton Bareng (Nobar) Piala Dunia Tingkat Kelurahan dengan Fitur Tebak Skor Berbayar.

---

## 1. Pendahuluan
Aplikasi ini dirancang khusus untuk memeriahkan acara nonton bareng (nobar) Piala Dunia di lingkup kelurahan/RT-RW. Aplikasi ini memungkinkan warga untuk melakukan tebak skor secara berbayar guna meningkatkan partisipasi dan keseruan acara. Data tebakan bersifat terbuka (transparan) sehingga dapat dilihat oleh seluruh warga untuk menghindari kecurangan.

---

## 2. Fitur Utama

### A. Jadwal & Hasil Pertandingan
* Menampilkan jadwal pertandingan Piala Dunia, dimulai dari babak **gugur pertama (Fase Knockout 32 Besar)** setelah babak grup selesai, dilanjutkan dengan 16 Besar, Perempat Final, Semifinal, perebutan juara ke-3, hingga Final.
* Menampilkan pemenang/skor akhir dari pertandingan-pertandingan yang telah selesai.
* Pengelolaan jadwal dan hasil dilakukan secara manual oleh Admin melalui dashboard admin.

### B. Sistem Tebak Skor (Prediksi)
* Peserta dapat memilih pertandingan dan memasukkan prediksi skor masing-masing tim.
* Sistem bersifat **Terbuka/Transparan**: Semua orang dapat melihat tebakan peserta lain (misal: *User A menebak 1-0 pada pertandingan X*).
* **Multi-Tebakan Terbatas**: Satu pengguna diperbolehkan memasukkan lebih dari satu tebakan untuk pertandingan yang sama, tetapi **dibatasi maksimal 5 tebakan per pertandingan** (maksimal Rp50.000 per pertandingan per user).
* Setiap tebakan dikenakan biaya **Rp10.000**.

### C. Alur Pembayaran & Transaksi Terkonsolidasi
Aplikasi ini mendukung dua metode pembayaran yang dikelompokkan dalam satu **Transaksi / Invoice**:
1. **Otomatis (QRIS)**:
   * Menggunakan integrasi API **Xendit** (Sandbox).
   * User dapat memilih beberapa prediksi sekaligus untuk satu atau beberapa pertandingan, lalu melakukan checkout bersama. Sistem men-generate satu QRIS untuk total nominal (misal: 8 tebakan = Rp80.000). Status seluruh tebakan dalam transaksi tersebut akan otomatis berubah menjadi `Paid` setelah pembayaran dikonfirmasi webhook.
2. **Manual (Tunai via Admin)**:
   * Admin dapat memasukkan beberapa tebakan sekaligus untuk seorang user dalam satu sesi transaksi di Dashboard Admin.
   * Admin menerima total pembayaran tunai, mengonfirmasi transaksi, lalu sistem mencetak **satu struk fisik terkonsolidasi** berisi daftar semua tebakan tersebut guna menghemat kertas thermal dan waktu.

### D. Dashboard Publik & Leaderboard
* Menampilkan status tebakan masuk yang telah lunas (`Paid`).
* Menampilkan papan peringkat (Leaderboard) berdasarkan ketepatan tebakan skor setelah pertandingan selesai.

### E. Dashboard Admin & Pencetakan Struk
* Manajemen pertandingan (input skor akhir, mengubah status pertandingan).
* Input tebakan manual (pembayaran tunai).
* Tombol cetak struk thermal yang dioptimalkan untuk ukuran kertas thermal (58mm atau 80mm) menggunakan standar `window.print()` browser.

## 2.1 Desain UI/UX & Responsivitas (Mobile & Desktop)
Mengingat mayoritas peserta akan mengakses aplikasi menggunakan smartphone di lokasi nobar, antarmuka aplikasi harus dirancang dengan prinsip **Mobile-First**:
* **Jadwal & Tebak Skor**: Tampilan tabel atau grid kartu yang adaptif. Di layar HP, informasi tim dikompresi (menggunakan bendera/inisial) agar muat dalam satu baris, dan tombol tebakan berukuran ramah sentuhan (min. 44x44px).
* **Alur QRIS di HP**: Ketika dibuka di smartphone, selain QR Code, disediakan pula tombol "Salin QRIS String/Deep Link" untuk mempermudah pembayaran menggunakan aplikasi e-wallet (GoPay, OVO, Dana) di perangkat yang sama tanpa perlu men-scan layar sendiri.
* **Dashboard Terbuka & Leaderboard**: Papan peringkat dirancang ringkas dengan kolom yang bisa digeser (horizontal scroll) pada layar mobile, namun tampil penuh di layar desktop.

* **Tema Warna FIFA World Cup 2026**:
  * **Latar Belakang**: Hitam arang / Deep Charcoal (`#0d0d0d` atau `#121212`) yang elegan.
  * **Aksen Utama**: Hijau Elektrik / Lapangan (`#00f076` / `#10b981` mewakili nuansa rumput stadion dan Meksiko) dan Merah Crimson/Kanada (`#e11d48`).
  * **Aksen Sekunder / Highlight**: Emas Trophy (`#eab308` / `#fbbf24`) dan Putih/Perak Bersih untuk teks primer.
  * Kombinasi warna ini akan memberikan atmosfer stadion malam hari yang modern dan semarak.


---

## 3. Spesifikasi Teknis

* **Frontend & Backend**: Next.js 14 (App Router) + TypeScript
* **Styling & UI**: Tailwind CSS v3 + shadcn/ui
* **Database & Auth**: Supabase (PostgreSQL)
* **Payment Gateway**: Xendit API (QRIS / Invoice)
* **Hosting**: Vercel (Hobby/Free Tier)
