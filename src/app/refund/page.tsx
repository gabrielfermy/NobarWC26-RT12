import { RefreshCw, ShieldAlert, Award, FileText } from "lucide-react";

export const metadata = {
  title: "Kebijakan Refund - Nobar PilDun 2026 RT 12",
  description: "Kebijakan pengembalian dana (refund/pembatalan) tebak skor Nobar RT 12 Pelem Kidul.",
};

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Kebijakan <br />
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Refund & Pembatalan
          </span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
          Penjelasan mengenai kebijakan pengembalian dana tebakan yang telah dikirimkan di aplikasi Nobar RT 12.
        </p>
      </div>

      <div className="space-y-6">
        {/* Card 1: Tebakan Bersifat Final */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-primary">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">1. Tebakan Bersifat Final</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Semua transaksi pembayaran tebakan skor yang telah berstatus **PAID (Lunas)** di sistem kami bersifat **final dan tidak dapat dibatalkan, diubah, atau di-refund** dengan alasan apa pun. Kebijakan ini diterapkan demi menjaga integritas jumlah kumpulan hadiah (*prize pool*) yang bersifat transparan untuk seluruh penebak lainnya.
          </p>
        </div>

        {/* Card 2: Penundaan Pertandingan */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-secondary">
            <div className="bg-secondary/10 p-2 rounded-lg">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">2. Penundaan / Pembatalan Pertandingan Resmi</h2>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground list-disc list-inside leading-relaxed">
            <li>Apabila ada pertandingan resmi Piala Dunia 2026 yang ditunda (*postponed*), tebakan yang sudah masuk akan tetap disimpan dan dianggap sah hingga pertandingan tersebut dimainkan kembali di jadwal barunya.</li>
            <li>Jika suatu pertandingan dibatalkan sepenuhnya secara resmi oleh FIFA dan tidak dijadwalkan ulang dalam kurun waktu 7x24 jam sejak jadwal awal, maka panitia akan mengembalikan saldo tebakan warga yang bersangkutan ke saldo dompet akun masing-masing sebesar Rp10.000 per tebakan yang dapat ditarik (*withdraw*) kembali secara utuh.</li>
          </ul>
        </div>

        {/* Card 3: Kesalahan Pengguna */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-accent">
            <div className="bg-accent/10 p-2 rounded-lg">
              <Award className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">3. Kesalahan Input Skor</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Panitia tidak bertanggung jawab atas kesalahan ketik atau input prediksi skor yang dilakukan oleh pengguna saat mengisi keranjang belanja tebakan. Pengguna diharapkan memeriksa kembali seluruh detail tebakan sebelum menekan tombol bayar/checkout.
          </p>
        </div>

        {/* Card 4: Transaksi Gagal atau Double Payment */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <div className="bg-muted p-2 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold">4. Gangguan Teknis Gerbang Pembayaran</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Jika terjadi kendala teknis (seperti uang Anda sudah terpotong di e-wallet/bank tetapi transaksi di web berstatus gagal atau pending), Anda dapat menghubungi panitia nobar RT 12 di meja registrasi atau melalui menu Kontak Kami dengan menyertakan bukti mutasi transaksi Anda. Panitia akan berkoordinasi dengan Midtrans dan secara manual mengubah status tebakan Anda menjadi aktif jika verifikasi mutasi berhasil.
          </p>
        </div>
      </div>
    </div>
  );
}
