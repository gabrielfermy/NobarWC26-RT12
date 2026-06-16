import { FileText, Shield, Info, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Syarat & Ketentuan - Nobar PilDun 2026 RT 12",
  description: "Syarat dan ketentuan penggunaan platform tebak skor Nobar RT 12 Pelem Kidul.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Syarat & <br />
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Ketentuan Layanan
          </span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
          Harap baca syarat dan ketentuan ini dengan cermat sebelum berpartisipasi dalam tebak skor Piala Dunia 2026 di RT 12 Pelem Kidul.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Ketentuan Umum */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-primary">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">1. Ketentuan Umum</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
            <li>Platform tebak skor ini diselenggarakan secara independen oleh kepanitiaan Nonton Bareng (Nobar) RT 12 Pelem Kidul untuk memeriahkan Piala Dunia 2026.</li>
            <li>Partisipasi terbuka untuk seluruh warga RT 12 Pelem Kidul serta tamu undangan yang hadir di lokasi nobar resmi.</li>
            <li>Dengan membuat akun dan mendaftarkan tebakan, Anda menyatakan setuju untuk mematuhi seluruh aturan main dan keputusan panitia yang bersifat mutlak.</li>
          </ul>
        </div>

        {/* Card 2: Penggunaan Akun */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-secondary">
            <div className="bg-secondary/10 p-2 rounded-lg">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">2. Akun dan Keamanan</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
            <li>Setiap peserta wajib mendaftar menggunakan nomor WhatsApp aktif yang dapat dihubungi untuk kebutuhan verifikasi dan koordinasi hadiah.</li>
            <li>Anda bertanggung jawab penuh atas keamanan akun Anda sendiri dan seluruh tebakan yang dikirimkan melalui akun tersebut.</li>
            <li>Panitia berhak menonaktifkan akun yang terindikasi melakukan kecurangan, spamming pada Dinding Komunitas, atau manipulasi sistem.</li>
          </ul>
        </div>

        {/* Card 3: Batasan Tebakan */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-accent">
            <div className="bg-accent/10 p-2 rounded-lg">
              <Info className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">3. Aturan Tebakan dan Hadiah</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
            <li>Biaya setiap tebakan adalah sebesar Rp10.000 dan harus diselesaikan sebelum pertandingan dimulai.</li>
            <li>Penentuan pemenang didasarkan pada skor akhir pertandingan resmi (termasuk extra time jika ada, namun tidak termasuk adu penalti, kecuali ditentukan lain oleh pengumuman panitia).</li>
            <li>Hadiah akan didistribusikan sesuai dengan kalkulasi sistem pari-mutuel setelah hasil pertandingan diverifikasi secara resmi di database.</li>
          </ul>
        </div>

        {/* Card 4: Tanggung Jawab */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <div className="bg-muted p-2 rounded-lg">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">4. Perubahan Ketentuan</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Panitia nobar RT 12 berhak untuk mengubah, memodifikasi, atau memperbarui syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan terlebih dahulu demi kelancaran bersama. Seluruh pembaruan syarat akan ditampilkan pada halaman ini.
          </p>
        </div>
      </div>
    </div>
  );
}
