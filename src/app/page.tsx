"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Trophy, Award, Users, AlertCircle, ShoppingCart, UserCheck, Flame, Shield, Play, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

// Kamus Kode Negara ISO2 untuk Bendera (FlagCDN)
const countryCodes: Record<string, string> = {
  "Meksiko": "mx", "Mexico": "mx",
  "Amerika Serikat": "us", "United States": "us",
  "Kanada": "ca", "Canada": "ca",
  "Afrika Selatan": "za", "South Africa": "za",
  "Korea Selatan": "kr", "South Korea": "kr",
  "Republik Ceko": "cz", "Czech Republic": "cz",
  "Bosnia & Herzegovina": "ba", "Bosnia and Herzegovina": "ba",
  "Arab Saudi": "sa", "Saudi Arabia": "sa",
  "Prancis": "fr", "France": "fr",
  "Australia": "au",
  "Brasil": "br", "Brazil": "br",
  "Kamerun": "cm", "Cameroon": "cm",
  "Jerman": "de", "Germany": "de",
  "Jepang": "jp", "Japan": "jp",
  "Spanyol": "es", "Spain": "es",
  "Kosta Rika": "cr", "Costa Rica": "cr",
  "Inggris": "gb", "England": "gb",
  "Iran": "ir",
  "Argentina": "ar",
  "Belanda": "nl", "Netherlands": "nl",
  "Italia": "it", "Italy": "it",
  "Belgia": "be", "Belgium": "be",
  "Kroasia": "hr", "Croatia": "hr",
  "Portugal": "pt",
  "Uruguay": "uy",
  "Kolombia": "co", "Colombia": "co",
  "Maroko": "ma", "Morocco": "ma",
  "Swiss": "ch", "Switzerland": "ch",
  "Polandia": "pl", "Poland": "pl",
  "Senegal": "sn",
  "Denmark": "dk",
  "Tunisia": "tn",
  "Ekuador": "ec", "Ecuador": "ec",
  "Wales": "gb-wls",
  "Ukraina": "ua", "Ukraine": "ua",
  "Turki": "tr", "Turkey": "tr",
  "Swedia": "se", "Sweden": "se",
  "Austria": "at",
  "Hongaria": "hu", "Hungary": "hu",
  "Skotlandia": "gb-sct", "Scotland": "gb-sct",
  "Selandia Baru": "nz", "New Zealand": "nz",
  "Peru": "pe",
  "Cile": "cl", "Chile": "cl",
  "Mesir": "eg", "Egypt": "eg",
  "Nigeria": "ng",
  "Aljazair": "dz", "Algeria": "dz",
  "Ghana": "gh",
  "Irak": "iq", "Iraq": "iq",
  "Norwegia": "no", "Norway": "no",
  "Qatar": "qa",
  "Pantai Gading": "ci", "Ivory Coast": "ci",
  "Haiti": "ht",
  "Paraguay": "py",
  "Curaçao": "cw", "Curacao": "cw",
  "Tanjung Verde": "cv", "Cape Verde": "cv",
  "Yordania": "jo", "Jordan": "jo",
  "Kongo Demokratik": "cd", "Democratic Republic of the Congo": "cd", "Congo DR": "cd", "DR Congo": "cd", "Democratic Republic of...": "cd", "Democratic Re...": "cd",
  "Uzbekistan": "uz",
  "Panama": "pa",
  "Tiongkok": "cn", "China": "cn",
  "Jamaika": "jm", "Jamaica": "jm",
  "Honduras": "hn",
  "El Salvador": "sv",
  "Venezuela": "ve",
  "Bolivia": "bo",
  "Mali": "ml",
  "Oman": "om",
  "Uni Emirat Arab": "ae", "United Arab Emirates": "ae", "UAE": "ae",
  "Bahrain": "bh",
  "Suriah": "sy", "Syria": "sy",
  "Palestina": "ps", "Palestine": "ps",
  "Kirgistan": "kg", "Kyrgyzstan": "kg",
  "Tajikistan": "tj",
  "India": "in"
};

const getFlagUrl = (teamName: string) => {
  const code = countryCodes[teamName];
  if (!code) return null;
  return `https://flagcdn.com/w80/${code}.png`;
};

interface Match {
  id: string;
  team_a: string;
  team_b: string;
  match_time: string;
  stage: string;
  score_a: number | null;
  score_b: number | null;
  status: string;
  stadium: string;
}

const MOCK_PUBLIC_PREDICTIONS = [
  { id: "p1", name: "Pak RT Eko", match: "Argentina vs Prancis", score: "2 - 1", status: "paid", method: "cash" },
  { id: "p2", name: "Budi Santoso", match: "Argentina vs Prancis", score: "1 - 3", status: "paid", method: "qris" },
  { id: "p3", name: "Pak RT Eko", match: "Argentina vs Prancis", score: "0 - 0", status: "paid", method: "cash" },
  { id: "p4", name: "Brasil vs Jerman", match: "Jerman vs Pantai Gading", score: "2 - 0", status: "paid", method: "qris" },
];

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictionsCart, setPredictionsCart] = useState<{ [matchId: string]: { score_a: number; score_b: number }[] }>({});
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash">("qris");

  useEffect(() => {
    async function loadMatches() {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .order("match_time", { ascending: true });

        if (error) throw error;
        setMatches(data || []);
      } catch (err) {
        console.error("Error loading matches:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();

    // Live update WebSocket untuk skor di halaman utama
    const channel = supabase
      .channel("matches-home-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === payload.new.id);
            if (idx !== -1) {
              updated[idx] = payload.new as Match;
            } else if (payload.eventType === "INSERT") {
              updated.push(payload.new as Match);
            }
            return updated.sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Dapatkan pertandingan yang akan datang (belum dimulai, di masa depan)
  const getUpcomingMatches = (): Match[] => {
    const now = Date.now();
    return matches
      .filter((m) => m.status === "scheduled" && new Date(m.match_time).getTime() > now)
      .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime())
      .slice(0, 6);
  };

  // Dapatkan pertandingan terakhir (sedang berlangsung atau sudah selesai/di masa lalu)
  const getRecentMatches = (): Match[] => {
    const now = Date.now();
    return matches
      .filter((m) => m.status !== "scheduled" || new Date(m.match_time).getTime() <= now)
      .sort((a, b) => new Date(b.match_time).getTime() - new Date(a.match_time).getTime())
      .slice(0, 3);
  };

  const upcomingMatches = getUpcomingMatches();
  const recentMatches = getRecentMatches();

  const addPrediction = (matchId: string) => {
    const currentList = predictionsCart[matchId] || [];
    if (currentList.length >= 5) {
      alert("Maksimal tebakan untuk satu pertandingan adalah 5 tebakan!");
      return;
    }
    setPredictionsCart({
      ...predictionsCart,
      [matchId]: [...currentList, { score_a: 0, score_b: 0 }],
    });
  };

  const updateScore = (matchId: string, index: number, team: "a" | "b", val: number) => {
    const currentList = [...(predictionsCart[matchId] || [])];
    if (team === "a") currentList[index].score_a = Math.max(0, val);
    else currentList[index].score_b = Math.max(0, val);

    setPredictionsCart({
      ...predictionsCart,
      [matchId]: currentList,
    });
  };

  const removePrediction = (matchId: string, index: number) => {
    const currentList = [...(predictionsCart[matchId] || [])];
    currentList.splice(index, 1);
    setPredictionsCart({
      ...predictionsCart,
      [matchId]: currentList,
    });
  };

  const totalPredictionsCount = Object.values(predictionsCart).reduce((sum, list) => sum + list.length, 0);
  const totalPrice = totalPredictionsCount * 10000;

  return (
    <div className="space-y-10 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-[#122218] to-card border border-primary/20 p-8 sm:p-12 text-center space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="mx-auto inline-flex items-center space-x-2 bg-primary/10 px-4 py-1.5 rounded-full text-xs font-semibold text-primary border border-primary/20">
          <Flame className="h-4 w-4" />
          <span>Nonton Bareng & Tebak Skor Terbuka</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
          Nobar PilDun 2026 <br />
          <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            RT 12 Pelem Kidul
          </span>
        </h1>
        
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
          Ayo tebak skor jagoanmu! Hanya <strong>Rp10.000</strong> per tebakan. Maksimal 5 tebakan per laga. Terbuka, transparan, dan seru!
        </p>
      </div>

      {/* Grid Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Jadwal & Form Input Tebakan */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. SECTION: Pertandingan Terakhir & Live */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center space-x-2 text-foreground">
                <Trophy className="h-5 w-5 text-accent" />
                <span>Pertandingan Terakhir & Live</span>
              </h2>
              <a 
                href="/bracket" 
                className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center space-x-1 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/25 transition-all"
              >
                <span>Bagan & Klasemen Lengkap</span>
                <span>→</span>
              </a>
            </div>

            {loading ? (
              <div className="flex h-24 flex-col items-center justify-center space-y-2 border border-border border-dashed rounded-xl">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Memuat hasil terakhir...</p>
              </div>
            ) : recentMatches.length === 0 ? (
              <div className="text-center py-8 border border-border border-dashed rounded-xl text-muted-foreground text-xs">
                Belum ada pertandingan yang berlangsung atau selesai.
              </div>
            ) : (
              <div className="space-y-4">
                {recentMatches.map((match) => {
                  const flagA = getFlagUrl(match.team_a);
                  const flagB = getFlagUrl(match.team_b);
                  const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).replace(/\./g, ':');

                  return (
                    <div key={match.id} className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-3 shadow-sm hover:border-accent/30 transition-all backdrop-blur-sm">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="bg-accent/20 px-2 py-0.5 rounded text-accent font-medium uppercase tracking-wider">
                          {match.stage}
                        </span>
                        <span className="text-muted-foreground font-medium">{formattedDate}</span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        {/* Team A */}
                        <div className="flex items-center space-x-3 w-[42%]">
                          {flagA ? (
                            <img src={flagA} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-semibold text-xs sm:text-sm truncate">{match.team_a}</span>
                        </div>

                        {/* Skor Tengah / VS */}
                        <div className="flex flex-col items-center justify-center px-3">
                          <div className="flex items-center space-x-2 bg-accent/10 px-3 py-1 rounded border border-accent/20">
                            <span className="font-mono text-sm font-black text-accent">{match.score_a}</span>
                            <span className="text-muted-foreground/50 text-[10px]">-</span>
                            <span className="font-mono text-sm font-black text-accent">{match.score_b}</span>
                          </div>
                          {match.status !== "completed" && (
                            <span className="text-[8px] text-green-500 font-bold uppercase mt-1 tracking-wider animate-pulse flex items-center">
                              <Play className="w-2 h-2 fill-green-500 mr-0.5" />
                              {match.status.replace("_", " ")}
                            </span>
                          )}
                          {match.status === "completed" && (
                            <span className="text-[8px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">
                              Selesai
                            </span>
                          )}
                        </div>

                        {/* Team B */}
                        <div className="flex items-center justify-end space-x-3 w-[42%] text-right">
                          <span className="font-semibold text-xs sm:text-sm truncate">{match.team_b}</span>
                          {flagB ? (
                            <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-muted-foreground flex items-center border-t border-border/30 pt-2">
                        <MapPin className="h-3 w-3 mr-1 text-accent shrink-0" />
                        <span className="truncate">{match.stadium}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. SECTION: Jadwal Laga Terdekat (Akan Datang) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center space-x-2 text-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Jadwal Laga Terdekat</span>
            </h2>

            {loading ? (
              <div className="flex h-32 flex-col items-center justify-center space-y-2 border border-border border-dashed rounded-xl">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-xs text-muted-foreground">Memuat jadwal terdekat...</p>
              </div>
            ) : upcomingMatches.length === 0 ? (
              <div className="text-center py-12 border border-border border-dashed rounded-xl text-muted-foreground">
                Tidak ada pertandingan mendatang yang belum dimainkan. Semua pertandingan telah selesai!
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMatches.map((match) => {
                  const userPreds = predictionsCart[match.id] || [];
                  const flagA = getFlagUrl(match.team_a);
                  const flagB = getFlagUrl(match.team_b);

                  // Aturan Penutupan Tebakan: Pertandingan sudah mulai (status bukan 'scheduled') atau waktu tanding terlewati
                  const isBettingClosed = match.status !== "scheduled" || new Date(match.match_time).getTime() < Date.now();

                  const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).replace(/\./g, ':');

                  return (
                    <div key={match.id} className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm hover:border-primary/20 transition-all">
                      {/* Header Card Laga */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="bg-secondary/20 px-2 py-0.5 rounded text-secondary font-medium text-[10px]">
                          {match.stage}
                        </span>
                        <span className="text-muted-foreground font-medium">{formattedDate}</span>
                      </div>

                      {/* Bendera & Nama Tim */}
                      <div className="flex items-center justify-between py-2">
                        {/* Team A */}
                        <div className="flex items-center space-x-3 w-[42%]">
                          {flagA ? (
                            <img src={flagA} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-semibold text-xs sm:text-sm truncate">{match.team_a}</span>
                        </div>

                        {/* Skor Tengah / VS */}
                        <div className="flex flex-col items-center justify-center px-3">
                          <div className="text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded">VS</div>
                        </div>

                        {/* Team B */}
                        <div className="flex items-center justify-end space-x-3 w-[42%] text-right">
                          <span className="font-semibold text-xs sm:text-sm truncate">{match.team_b}</span>
                          {flagB ? (
                            <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Informasi Stadion */}
                      <div className="text-[10px] text-muted-foreground flex items-center border-t border-border/30 pt-3">
                        <MapPin className="h-3 w-3 mr-1 text-primary shrink-0" />
                        <span className="truncate">{match.stadium}</span>
                      </div>

                      {/* Form Input Tebakan (Hanya untuk Babak Knockout) */}
                      {!match.stage.includes("Fase Grup") && (
                        <div className="border-t border-border/50 pt-4 space-y-3">
                          {/* Tampilkan tebakan yang sudah masuk keranjang untuk laga ini */}
                          {userPreds.map((pred, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-background/50 p-2.5 rounded-lg border border-border/30">
                              <span className="text-xs font-medium text-muted-foreground">Tebakan #{idx + 1}</span>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={pred.score_a}
                                  onChange={(e) => updateScore(match.id, idx, "a", parseInt(e.target.value) || 0)}
                                  className="w-12 h-8 text-center rounded border border-input bg-card text-sm font-bold focus:border-primary"
                                  disabled={isBettingClosed}
                                />
                                <span className="text-xs text-muted-foreground font-bold">-</span>
                                  <input
                                    type="number"
                                    value={pred.score_b}
                                    onChange={(e) => updateScore(match.id, idx, "b", parseInt(e.target.value) || 0)}
                                    className="w-12 h-8 text-center rounded border border-input bg-card text-sm font-bold focus:border-primary"
                                    disabled={isBettingClosed}
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                  onClick={() => removePrediction(match.id, idx)}
                                >
                                  Hapus
                                </Button>
                              </div>
                            ))}

                            {/* Tombol Aksi Tebak Skor */}
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[11px] text-muted-foreground">
                                {isBettingClosed ? "Tebakan ditutup untuk laga ini" : `${userPreds.length} dari 5 tebakan terpakai`}
                              </span>

                              {isBettingClosed ? (
                                <div className="bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide">
                                  Tebak Skor Ditutup
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                  onClick={() => addPrediction(match.id)}
                                  disabled={userPreds.length >= 5}
                                >
                                  + Tambah Tebakan (Rp10.000)
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        {/* Kolom Papan Transaksi & Tebakan Publik */}
        <div className="space-y-8">
          {/* Checkout Cart */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
              <ShoppingCart className="h-5 w-5 text-accent" />
              <span>Checkout Pembayaran</span>
            </h3>

            {totalPredictionsCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p>Belum ada tebakan yang dipilih.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Tebakan:</span>
                  <span className="font-bold text-foreground">{totalPredictionsCount} item</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Harga per Item:</span>
                  <span className="font-medium">Rp10.000</span>
                </div>
                <div className="border-t border-border/50 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-sm">Total Bayar:</span>
                  <span className="text-xl font-black text-primary">Rp {totalPrice.toLocaleString("id-ID")}</span>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={paymentMethod === "qris" ? "default" : "outline"}
                      className="text-xs h-9"
                      onClick={() => setPaymentMethod("qris")}
                    >
                      QRIS (Otomatis)
                    </Button>
                    <Button
                      variant={paymentMethod === "cash" ? "default" : "outline"}
                      className="text-xs h-9"
                      onClick={() => setPaymentMethod("cash")}
                    >
                      Tunai (Admin)
                    </Button>
                  </div>
                </div>

                <Button className="w-full mt-2" onClick={() => setShowInvoiceModal(true)}>
                  Bayar & Daftarkan Tebakan
                </Button>
              </div>
            )}
          </div>

          {/* Transparansi Tebakan Terkini */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
              <Users className="h-5 w-5 text-primary" />
              <span>Tebakan Terbuka (Paid)</span>
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {MOCK_PUBLIC_PREDICTIONS.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs p-2.5 rounded bg-background/50 border border-border/30">
                  <div>
                    <div className="font-semibold text-foreground">{p.name}</div>
                    <div className="text-muted-foreground text-[10px]">{p.match}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-accent">{p.score}</div>
                    <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                      {p.method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Dialog Invoice Simulasi */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                {paymentMethod === "qris" ? "Pembayaran QRIS" : "Bayar Tunai ke Admin"}
              </h3>
              <p className="text-xs text-muted-foreground">Selesaikan pembayaran Anda untuk memproses tebakan.</p>
            </div>

            {paymentMethod === "qris" ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center space-y-2 text-black">
                    <div className="font-bold text-lg">QRIS OUTLET</div>
                    <div className="mx-auto w-32 h-32 bg-slate-300 rounded flex items-center justify-center font-bold text-xs">
                      [SIMULASI QR CODE]
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-primary">Total: Rp {totalPrice.toLocaleString("id-ID")}</div>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Di lingkungan production, kami memanggil API Xendit untuk memunculkan QRIS Dinamis dan melacak status bayar secara real-time.
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserCheck className="h-8 w-8" />
                </div>
                <div className="text-sm">
                  Silakan serahkan uang tunai sebesar <strong>Rp {totalPrice.toLocaleString("id-ID")}</strong> kepada petugas Admin di meja registrasi nobar.
                </div>
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Admin akan memasukkan tebakan Anda di dashboard admin, dan Anda akan menerima struk fisik tercetak.
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowInvoiceModal(false)}>
                Batal
              </Button>
              <Button className="flex-1" onClick={() => {
                alert("Simulasi pembayaran sukses! Tebakan Anda terdaftar.");
                setPredictionsCart({});
                setShowInvoiceModal(false);
              }}>
                Simulasi Sukses
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
