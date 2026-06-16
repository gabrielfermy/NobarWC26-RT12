import { MapPin, Phone, MessageSquare, Clock } from "lucide-react";

export const metadata = {
  title: "Hubungi Kami - Nobar PilDun 2026 RT 12",
  description: "Kontak dan lokasi pengelola pos ronda panitia nobar RT 12 Pelem Kidul.",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
          Hubungi <br />
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Panitia Nobar RT 12
          </span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
          Punya pertanyaan seputar tebak skor atau ingin berdiskusi dengan panitia nobar? Silakan hubungi kami di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Info Panitia */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Informasi Kontak</h2>
            
            <div className="space-y-4 text-xs text-muted-foreground">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-0.5">Lokasi Pos Ronda Resmi:</strong>
                  <span>Pos Ronda RT 12, Pelem Kidul, Baturetno, Banguntapan, Bantul, D.I. Yogyakarta</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-0.5">WhatsApp Panitia (Ashvin):</strong>
                  <span>+62 813-9506-092</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block mb-0.5">Jam Operasional Pelayanan:</strong>
                  <span>30 menit sebelum kick-off pertandingan berlangsung hingga selesai.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form Placeholder / Direct WA */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Hubungi Via WhatsApp</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Untuk respon cepat terkait verifikasi pembayaran tunai, kendala mutasi QRIS, atau pencairan saldo hadiah, silakan hubungi WhatsApp panitia secara langsung.
            </p>
          </div>

          <a 
            href="https://wa.me/628139506092?text=Halo%20Ashvin%2C%20saya%20ingin%20bertanya%20tentang%20tebak%20skor..." 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-colors shadow-lg"
          >
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span>Kirim Pesan WhatsApp Sekarang</span>
          </a>
        </div>
      </div>
    </div>
  );
}
