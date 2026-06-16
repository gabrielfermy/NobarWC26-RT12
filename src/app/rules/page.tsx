import { Trophy, ShieldAlert, Award, FileText, ChevronRight, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Aturan Main & Cara Kerja - Nobar PilDun 2026",
  description: "Panduan lengkap sistem tebak skor Piala Dunia 2026 RT 12 Pelem Kidul.",
};

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Aturan Main & <br />
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Cara Kerja Tebak Skor
          </span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
          Silakan pahami aturan main tebak skor Piala Dunia 2026 di RT 12 Pelem Kidul agar permainan tetap adil, seru, dan transparan!
        </p>
      </div>

      {/* Grid Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Cara Ikutan */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-primary/20 transition-all">
          <div className="flex items-center space-x-3 text-primary">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">1. Cara Berpartisipasi</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
            <li>Daftarkan akun atau login menggunakan nomor WhatsApp Anda.</li>
            <li>Pilih pertandingan terdekat di halaman utama atau menu tebakan.</li>
            <li>Masukkan prediksi skor jagoanmu secara detail (Tim A vs Tim B).</li>
            <li>Setiap tebakan dikenakan biaya pendaftaran sebesar <strong className="text-foreground">Rp10.000</strong>.</li>
            <li>Anda diperbolehkan memasukkan maksimal <strong className="text-foreground">5 tebakan variatif</strong> untuk satu pertandingan yang sama.</li>
            <li>Tebakan ditutup segera setelah pertandingan dimulai.</li>
          </ul>
        </div>

        {/* Card 2: Validasi Pembayaran */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 hover:border-secondary/20 transition-all">
          <div className="flex items-center space-x-3 text-secondary">
            <div className="bg-secondary/10 p-2 rounded-lg">
              <Award className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">2. Validasi Pembayaran</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
            <li>Tebakan Anda berstatus <strong className="text-yellow-500 font-semibold">PENDING</strong> sebelum pembayaran diselesaikan.</li>
            <li><strong>Metode QRIS (Otomatis):</strong> Bayar menggunakan QRIS yang muncul di layar, dan tebakan Anda akan langsung aktif secara otomatis setelah pembayaran sukses dideteksi.</li>
            <li><strong>Metode Tunai (Cash):</strong> Lakukan pembayaran tunai ke meja panitia RT 12 di lokasi nobar. Admin akan mengaktifkan tebakan Anda secara manual dan mencetak struk fisik.</li>
            <li>Hanya tebakan berstatus <strong className="text-green-500 font-semibold">PAID (LUNAS)</strong> yang dihitung dalam pembagian hadiah.</li>
          </ul>
        </div>
      </div>

      {/* Callout Formula Hadiah (Pari-mutuel) */}
      <div className="rounded-2xl bg-gradient-to-br from-card via-[#122218] to-card border border-primary/20 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="flex items-center space-x-3 text-accent">
          <div className="bg-accent/10 p-2 rounded-lg">
            <Trophy className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Sistem Pembagian Hadiah (Pari-mutuel)</h2>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Semua biaya pendaftaran tebakan dikumpulkan ke dalam **Kumpulan Hadiah (Prize Pool)** pertandingan tersebut. 
          Hadiah dari total taruhan pada pertandingan tersebut akan dibagi rata kepada seluruh tebakan yang menebak skor akhir dengan tepat secara presisi.
        </p>

        <div className="bg-background/80 p-4 rounded-xl border border-border space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-muted-foreground border-b border-border/40 pb-2">
            <span>Total Kumpulan Hadiah (Gross Pool)</span>
            <span className="text-foreground font-bold">Jumlah Tebakan Terdaftar x Rp10.000</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground border-b border-border/40 pb-2">
            <span>Porsi Bagian Hadiah Kotor (Sebelum Fee)</span>
            <span className="text-foreground font-bold">Gross Pool / Jumlah Penebak Tepat</span>
          </div>
          <div className="text-muted-foreground pt-1">
            <span className="text-accent font-bold">Aturan Potongan Komisi RT 12 (Panitia):</span>
            <ul className="list-disc list-inside mt-2 space-y-1 pl-2 text-[11px]">
              <li>Jika bagian hadiah per tebakan yang tepat <strong className="text-foreground">&gt; Rp20.000</strong>, maka dipotong <strong className="text-foreground">10%</strong> untuk kas kas RT 12 / uang lelah panitia.</li>
              <li>Jika bagian hadiah per tebakan yang tepat <strong className="text-foreground">&le; Rp20.000</strong>, maka **BEBAS BIAYA (0% potongan)** untuk pemenang.</li>
            </ul>
          </div>
        </div>

        {/* Contoh Kasus */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center">
            <HelpCircle className="h-4 w-4 mr-2 text-primary" />
            Contoh Simulasi Pembagian Hadiah:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-card border border-border p-4 rounded-lg space-y-2">
              <span className="font-bold text-accent">Kasus A: Hadiah Besar (Dikenakan Fee 10%)</span>
              <p className="text-muted-foreground">
                Pada laga Indonesia vs Jepang, total ada <strong>100 tebakan lunas</strong> (Gross Pool = Rp1.000.000). 
                Skor akhir adalah 2-1, dan hanya ada <strong>5 orang</strong> yang menebak 2-1 dengan benar.
              </p>
              <div className="border-t border-border/50 pt-2 text-muted-foreground space-y-1">
                <div>Bagian kotor: <span className="text-foreground font-bold">Rp1.000.000 / 5 = Rp200.000</span> (di atas Rp20.000)</div>
                <div>Potongan RT (10%): <span className="text-foreground font-bold">Rp20.000</span></div>
                <div>Diterima pemenang: <span className="text-green-500 font-bold">Rp180.000 net per tebakan</span></div>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-lg space-y-2">
              <span className="font-bold text-accent">Kasus B: Hadiah Kecil (Bebas Potongan RT)</span>
              <p className="text-muted-foreground">
                Pada laga Jerman vs Spanyol, total ada <strong>10 tebakan lunas</strong> (Gross Pool = Rp100.000). 
                Skor akhir adalah 1-1, dan ada <strong>6 orang</strong> yang menebak 1-1 dengan benar.
              </p>
              <div className="border-t border-border/50 pt-2 text-muted-foreground space-y-1">
                <div>Bagian kotor: <span className="text-foreground font-bold">Rp100.000 / 6 = Rp16.666</span> (di bawah Rp20.000)</div>
                <div>Potongan RT (0%): <span className="text-foreground font-bold">Rp0</span></div>
                <div>Diterima pemenang: <span className="text-green-500 font-bold">Rp16.666 net per tebakan</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Penarikan Dana */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center space-x-3 text-destructive">
          <div className="bg-destructive/10 p-2 rounded-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold">Pencairan Hadiah (Withdrawal)</h2>
        </div>
        <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
          Saldo kemenangan Anda terkumpul di dashboard profil Anda pada menu **&quot;Tebakan Saya&quot;**. 
          Anda dapat mengajukan permohonan pencairan dana (Withdrawal) kapan saja dengan mengisi data rekening bank atau e-wallet yang dituju.
          </p>
          <ul className="list-disc list-inside pl-2 space-y-1">
            <li>Minimal penarikan dana adalah sebesar <strong className="text-foreground">Rp10.000</strong>.</li>
            <li>Pengajuan akan diverifikasi dan diproses oleh Admin dalam waktu maksimal 24 jam.</li>
            <li>Setelah dana ditransfer ke rekening Anda, Admin akan mengunggah **Bukti Transfer resmi**. Anda dapat melihat dan mengunduh bukti transfer tersebut langsung dari riwayat transaksi penarikan Anda.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
