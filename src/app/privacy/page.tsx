import { Shield, Eye, Lock, Globe } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi - Nobar PilDun 2026 RT 12",
  description: "Kebijakan privasi dan perlindungan data warga pada platform Nobar RT 12 Pelem Kidul.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Kebijakan <br />
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Privasi Pengguna
          </span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
          Kami berkomitmen menjaga kerahasiaan dan perlindungan data pribadi Anda selaku peserta tebak skor Nobar RT 12.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Data yang Dikumpulkan */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-primary">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Eye className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">1. Data yang Kami Kumpulkan</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
            <li><strong>Informasi Akun:</strong> Nama warga dan nomor WhatsApp yang didaftarkan untuk verifikasi status tebakan dan pencairan hadiah.</li>
            <li><strong>Data Transaksi:</strong> Informasi detail pembayaran tebakan (nominal, waktu transfer, status pembayaran, bukti transfer) untuk pencatatan keuangan internal nobar.</li>
            <li><strong>Pesan Komunitas:</strong> Nama dan isi pesan yang Anda tulis di Dinding Komunitas (*Community Wall*) yang ditampilkan secara publik di web.</li>
          </ul>
        </div>

        {/* Card 2: Penggunaan Data */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-secondary">
            <div className="bg-secondary/10 p-2 rounded-lg">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">2. Bagaimana Kami Menggunakan Data Anda</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
            <li>Memproses dan memvalidasi tebakan skor Anda agar terdaftar secara sah dalam kumpulan hadiah.</li>
            <li>Menghubungi Anda melalui WhatsApp apabila tebakan Anda memenangkan hadiah guna koordinasi serah terima hadiah.</li>
            <li>Memproses pencairan dana kemenangan (Withdrawal) ke nomor rekening atau e-wallet yang Anda daftarkan di dashboard.</li>
          </ul>
        </div>

        {/* Card 3: Keamanan Data */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-accent">
            <div className="bg-accent/10 p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">3. Keamanan Data Pribadi</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seluruh database disimpan dengan aman di platform cloud database serverless (Supabase) yang dienkripsi dan terlindungi oleh sistem keamanan bawaan industri. Kami berkomitmen untuk **tidak pernah menjual, membagikan, atau membocorkan** data nomor WhatsApp maupun data perbankan warga kepada pihak ketiga mana pun di luar kepentingan transaksi Midtrans/panitia nobar.
          </p>
        </div>

        {/* Card 4: Cookies */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <div className="bg-muted p-2 rounded-lg">
              <Globe className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">4. Tautan Luar & Sistem Pihak Ketiga</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Untuk memproses transaksi secara aman, platform kami menggunakan gerbang pembayaran eksternal (Midtrans). Data transaksi pembayaran Anda tunduk pada Kebijakan Privasi milik Midtrans selaku penyedia jasa pembayaran resmi yang terdaftar di Bank Indonesia.
          </p>
        </div>
      </div>
    </div>
  );
}
