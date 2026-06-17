# Panduan Integrasi Pihak Ketiga (Third-Party Integrations)

Aplikasi ini terintegrasi dengan dua layanan eksternal utama: **ESPN Sports API** untuk pembaruan data pertandingan otomatis, dan **Midtrans Payment Gateway** untuk pembayaran online otomatis (QRIS dan Virtual Account).

---

## 1. Sinkronisasi Jadwal & Hasil Laga (ESPN Sports API)

Untuk menghemat waktu panitia dan menghindari input manual jadwal satu per satu, sistem dapat mengambil data turnamen Piala Dunia 2026 secara otomatis dari ESPN.

### Detail Teknis API
*   **Sumber Endpoint**: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`
*   **Rentang Tanggal**: `20260611-20260719` (periode penuh Piala Dunia 2026).
*   **Rute Pemroses**: [route.ts](file:///k:/Personal/RT12/NobarWC26-RT12/src/app/api/admin/sync-matches/route.ts)

### Mekanisme Kerja & Transformasi Data
1.  **Penerjemahan Nama Tim**: Tim-tim dunia diterjemahkan dari bahasa Inggris ke Bahasa Indonesia yang akrab bagi warga (misal: "Czech Republic" menjadi "Republik Ceko", "Mexico" menjadi "Meksiko") menggunakan kamus pemetaan di dalam kode.
2.  **Pemetaan Babak (Stage)**: Sistem secara dinamis memetakan status game note ESPN ke kategori babak lokal (Fase Grup, Babak 32 Besar, Babak 16 Besar, Perempat Final, Semifinal, Perebutan Juara Ke-3, Final).
3.  **Konsistensi UUID**: Agar ID pertandingan di database tetap konsisten dan tidak berubah saat sinkronisasi ulang, UUID pertandingan diturunkan secara deterministik dari ID event ESPN asli:
    `00000000-0000-0000-0000-<ESPN_ID_PADDED>`
4.  **Preservasi Data Lokal**: Lokasi nonton bareng (`nobar_location`) dan penanda nobar (`is_nobar`) yang telah dimasukkan oleh admin lokal tidak akan tertimpa atau hilang saat sinkronisasi data dari ESPN dijalankan.

### Cara Memicu Sinkronisasi
*   **Otomatis (Cron Job)**: Anda dapat menjadwalkan trigger HTTP POST ke `https://domain-anda.com/api/admin/sync-matches` dengan menyertakan header authorization:
    `Authorization: Bearer <SYNC_SECRET_KEY>`
*   **Manual (Dashboard Admin)**: Admin dapat menekan tombol **"Sinkronisasi Hasil Laga (Real-time)"** di dashboard. Ini akan memanggil endpoint perantara [trigger-sync/route.ts](file:///k:/Personal/RT12/NobarWC26-RT12/src/app/api/admin/trigger-sync/route.ts) yang memverifikasi sesi admin terlebih dahulu sebelum melakukan sinkronisasi data.

---

## 2. Gateway Pembayaran Online (Midtrans)

Warga dapat melunasi tagihan tebakan secara otomatis secara online melalui e-wallet / QRIS dengan integrasi Midtrans.

### Alur Integrasi
1.  **Frontend (Snap JS)**:
    Aplikasi memuat library script Midtrans Snap secara dinamis di [layout.tsx](file:///k:/Personal/RT12/NobarWC26-RT12/src/app/layout.tsx):
    *   Sandbox: `https://app.sandbox.midtrans.com/snap/snap.js`
    *   Production: `https://app.midtrans.com/snap/snap.js`
2.  **Pembuatan Transaksi**:
    Saat warga menekan tombol checkout di keranjang prediksi, frontend mengirim payload nominal ke `/api/payment` untuk membuat Snap Transaction Token. Token ini dikirim balik ke browser untuk menampilkan popup pembayaran Snap.
3.  **Webhook Notifikasi**:
    Setelah warga melakukan pembayaran di e-wallet/bank mereka, server Midtrans akan mengirimkan POST request berisi status pembayaran ke endpoint webhook kita di `/api/webhooks/midtrans`.

### Keamanan Webhook (Signature Verification)
Untuk mencegah eksploitasi di mana pihak luar menembak webhook palsu, endpoint [midtrans/route.ts](file:///k:/Personal/RT12/NobarWC26-RT12/src/app/api/webhooks/midtrans/route.ts) memverifikasi keaslian signature key yang dikirim Midtrans menggunakan algoritma hashing SHA-512:
`signature_key = SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`

Jika signature key hasil komputasi lokal berbeda dengan yang dikirim di payload, request langsung ditolak dengan status code `403 Forbidden`.

### Pemetaan Status Pembayaran
Status pembayaran dari Midtrans dipetakan ke status internal `transactions` di database Supabase:
*   `settlement` / `capture` (accept) $\rightarrow$ `paid` (Tebakan langsung muncul di dashboard publik & dihitung ke klasemen).
*   `cancel` / `deny` / `expire` / `failure` $\rightarrow$ `failed` (Tebakan dibatalkan).
*   `pending` $\rightarrow$ `pending` (Warga harus menyelesaikan pembayaran).
