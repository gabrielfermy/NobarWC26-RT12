"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, Trophy, Users, AlertCircle, ShoppingCart, UserCheck, Flame, Shield, Play, MapPin, Tv, Clock } from "lucide-react";
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

const getStadiumCountry = (stadiumName: string) => {
  const nameLower = (stadiumName || "").toLowerCase();
  if (nameLower.includes("estadio bbva") || 
      nameLower.includes("estadio banorte") || 
      nameLower.includes("estadio akron") || 
      nameLower.includes("estadio azteca") || 
      nameLower.includes("mexico") || 
      nameLower.includes("meksiko")) {
    return { name: "Meksiko", code: "mx" };
  }
  if (nameLower.includes("bmo field") || 
      nameLower.includes("bc place") || 
      nameLower.includes("canada") || 
      nameLower.includes("kanada")) {
    return { name: "Kanada", code: "ca" };
  }
  return { name: "Amerika Serikat", code: "us" };
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
  is_nobar?: boolean;
  nobar_location?: string;
  nobar_pre_minutes?: number;
}

interface PublicPrediction {
  id: string;
  name: string;
  match: string;
  score: string;
  method: string;
}

export default function Home() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictionsCart, setPredictionsCart] = useState<{ [matchId: string]: { score_a: number; score_b: number }[] }>({});
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash">("qris");
  const [activeTab, setActiveTab] = useState<"laga" | "nobar">("laga");
  
  // Real database profiles & predictions state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [publicPredictions, setPublicPredictions] = useState<PublicPrediction[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);


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

    async function loadPublicPredictions() {
      try {
        const { data, error } = await supabase
          .from("predictions")
          .select(`
            id,
            predicted_score_a,
            predicted_score_b,
            profiles (
              name
            ),
            matches (
              team_a,
              team_b
            ),
            transactions (
              payment_method
            )
          `)
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) throw error;

        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          name: p.profiles?.name || "Warga",
          match: `${p.matches?.team_a || "TBD"} vs ${p.matches?.team_b || "TBD"}`,
          score: `${p.predicted_score_a} - ${p.predicted_score_b}`,
          method: p.transactions?.payment_method || "cash"
        }));

        setPublicPredictions(mapped);
      } catch (err) {
        console.error("Error loading public predictions:", err);
      }
    }

    loadMatches();
    loadPublicPredictions();

    // Listen to user auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Live update WebSocket untuk skor di halaman utama
    const channel = supabase
      .channel("matches-home-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === (payload.new as any).id);
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

    // Live update WebSocket untuk predictions
    const predChannel = supabase
      .channel("predictions-home-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions" },
        () => {
          loadPublicPredictions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(predChannel);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };


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

  const handleCheckoutClick = async () => {
    if (!user) {
      alert("Silakan masuk/login terlebih dahulu untuk mendaftarkan tebakan Anda.");
      router.push("/login");
      return;
    }
    if (!profile) {
      alert("Profil warga tidak ditemukan. Silakan hubungi admin atau login kembali.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Buat Transaksi Pending
      const { data: newTx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: profile.id,
          amount: totalPrice,
          payment_status: "pending",
          payment_method: paymentMethod,
          transaction_reference: paymentMethod === "qris" ? `QRIS-SIM-${Date.now()}` : `CASH-PENDING-${Date.now()}`
        })
        .select()
        .single();

      if (txErr) throw txErr;

      // 2. Buat Prediksi
      const predictionsPayload: any[] = [];
      Object.entries(predictionsCart).forEach(([matchId, list]) => {
        list.forEach((pred) => {
          predictionsPayload.push({
            user_id: profile.id,
            match_id: matchId,
            predicted_score_a: pred.score_a,
            predicted_score_b: pred.score_b,
            transaction_id: newTx.id
          });
        });
      });

      const { error: predErr } = await supabase
        .from("predictions")
        .insert(predictionsPayload);

      if (predErr) throw predErr;

      setCurrentTxId(newTx.id);

      if (paymentMethod === "cash") {
        alert("Tebakan Anda berhasil diajukan! Status transaksi Anda saat ini PENDING. Silakan temui petugas RT 12 di meja registrasi nobar untuk melakukan pembayaran tunai sebesar Rp " + totalPrice.toLocaleString("id-ID") + " agar diaktifkan oleh admin.");
        setPredictionsCart({});
        setCurrentTxId(null);
      } else {
        // QRIS, buka modal invoice untuk simulasi bayar
        setShowInvoiceModal(true);
      }
    } catch (err: any) {
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!currentTxId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: "paid" })
        .eq("id", currentTxId);

      if (error) throw error;
      alert("Simulasi pembayaran sukses! Status transaksi Anda menjadi PAID dan tebakan Anda kini aktif.");
      setPredictionsCart({});
      setShowInvoiceModal(false);
      setCurrentTxId(null);
    } catch (err: any) {
      alert("Gagal memproses pembayaran simulasi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPayment = async () => {
    if (currentTxId) {
      // Set status transaksi ke failed agar tidak menggantung sebagai pending terus
      await supabase
        .from("transactions")
        .update({ payment_status: "failed" })
        .eq("id", currentTxId);
      setCurrentTxId(null);
    }
    setShowInvoiceModal(false);
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

      {/* Navigation tabs for schedules */}
      <div className="flex space-x-1.5 bg-muted p-1 rounded-xl max-w-md mx-auto">
        <Button
          variant={activeTab === "laga" ? "secondary" : "ghost"}
          className="flex-1 text-xs py-2 rounded-lg font-bold flex items-center justify-center space-x-2"
          onClick={() => setActiveTab("laga")}
        >
          <Calendar className="h-4 w-4" />
          <span>Jadwal Laga</span>
        </Button>
        <Button
          variant={activeTab === "nobar" ? "secondary" : "ghost"}
          className="flex-1 text-xs py-2 rounded-lg font-bold flex items-center justify-center space-x-2"
          onClick={() => setActiveTab("nobar")}
        >
          <Tv className="h-4 w-4" />
          <span>Jadwal Nobar RT 12</span>
        </Button>
      </div>

      {/* Grid Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kolom Jadwal & Form Input Tebakan */}
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === "laga" ? (
            <>
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
                      const stadiumCountry = getStadiumCountry(match.stadium);
                      const stadiumFlag = getFlagUrl(stadiumCountry.name);
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

                          <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-2">
                            <div className="flex items-center max-w-[80%]">
                              <MapPin className="h-3 w-3 mr-1 text-accent shrink-0" />
                              <span className="truncate mr-1.5">{match.stadium}</span>
                              {stadiumCountry && (
                                <span className="inline-flex items-center space-x-1 bg-muted px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0">
                                  {stadiumFlag && (
                                    <img src={stadiumFlag} alt="" className="w-4 h-2.5 object-cover rounded-xs border border-border/20" />
                                  )}
                                  <span>{stadiumCountry.name}</span>
                                </span>
                              )}
                            </div>
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
                      const flagA = getFlagUrl(match.team_a);
                      const flagB = getFlagUrl(match.team_b);
                      const stadiumCountry = getStadiumCountry(match.stadium);
                      const stadiumFlag = getFlagUrl(stadiumCountry.name);

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
                          <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-3">
                            <div className="flex items-center max-w-[80%]">
                              <MapPin className="h-3 w-3 mr-1 text-primary shrink-0" />
                              <span className="truncate mr-1.5">{match.stadium}</span>
                              {stadiumCountry && (
                                <span className="inline-flex items-center space-x-1 bg-muted px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0">
                                  {stadiumFlag && (
                                    <img src={stadiumFlag} alt="" className="w-4 h-2.5 object-cover rounded-xs border border-border/20" />
                                  )}
                                  <span>{stadiumCountry.name}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Tombol Aksi Tebak Skor Arahkan ke Dashboard */}
                          {!isBettingClosed && (!profile || profile.role !== "admin") && (
                            <div className="flex justify-end items-center pt-3 border-t border-border/30">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => router.push(user ? "/my-predictions?tab=new" : "/login")}
                              >
                                + Tebak Skor (Rp10.000)
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-bold flex items-center space-x-2 text-foreground">
                  <Tv className="h-5 w-5 text-primary" />
                  <span>Jadwal Nonton Bareng (Nobar) RT 12</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Saksikan pertandingan babak gugur seru bersama warga RT 12 Pelem Kidul di Pos Ronda.</p>
              </div>

              {loading ? (
                <div className="flex h-32 flex-col items-center justify-center space-y-2 border border-border border-dashed rounded-xl">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-xs text-muted-foreground">Memuat jadwal nobar...</p>
                </div>
              ) : matches.filter(m => m.is_nobar).length === 0 ? (
                <div className="text-center py-12 border border-border border-dashed rounded-xl text-muted-foreground text-xs">
                  Belum ada jadwal Nonton Bareng yang diumumkan oleh admin.
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.filter(m => m.is_nobar).map((match) => {
                    const flagA = getFlagUrl(match.team_a);
                    const flagB = getFlagUrl(match.team_b);
                    const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).replace(/\./g, ':');

                    return (
                      <div key={match.id} className="rounded-xl border border-primary/20 bg-card p-5 space-y-4 shadow-sm hover:border-primary/45 transition-all">
                        <div className="flex justify-between items-center text-xs">
                          <span className="bg-primary/20 px-2 py-0.5 rounded text-primary font-bold text-[9px] uppercase tracking-wider">
                            {match.stage}
                          </span>
                          <span className="text-muted-foreground font-medium">{formattedDate} WIB</span>
                        </div>

                        <div className="flex items-center justify-between py-2 border-y border-border/40">
                          <div className="flex items-center space-x-2.5 w-[42%]">
                            {flagA ? (
                              <img src={flagA} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                            ) : (
                              <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-bold text-xs sm:text-sm truncate">{match.team_a}</span>
                          </div>
                          {match.status === "completed" ? (
                            <div className="flex items-center space-x-1.5 bg-muted px-2.5 py-0.5 rounded font-mono text-xs font-black">
                              <span>{match.score_a}</span>
                              <span>-</span>
                              <span>{match.score_b}</span>
                            </div>
                          ) : (
                            <div className="font-mono text-xs font-black text-muted-foreground bg-muted px-2 py-0.5 rounded">VS</div>
                          )}
                          <div className="flex items-center justify-end space-x-2.5 w-[42%] text-right">
                            <span className="font-bold text-xs sm:text-sm truncate">{match.team_b}</span>
                            {flagB ? (
                              <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                            ) : (
                              <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>

                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex flex-col sm:flex-row justify-between gap-3 text-left">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-primary font-black uppercase tracking-wider block">Lokasi Nobar:</span>
                              <span className="text-xs font-bold text-foreground">{match.nobar_location || "Pos Ronda RT 12"}</span>
                            </div>
                          </div>
                          
                          {(() => {
                            const preMins = match.nobar_pre_minutes || 30;
                            const gatheringTime = new Date(new Date(match.match_time).getTime() - preMins * 60000);
                            const formattedGatheringTime = gatheringTime.toLocaleString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            }).replace(/\./g, ':');
                            return (
                              <div className="flex items-start space-x-2">
                                <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                  <span className="text-[9px] text-primary font-black uppercase tracking-wider block">Acara Mulai (Pre-match):</span>
                                  <span className="text-xs font-bold text-foreground">
                                    Pukul {formattedGatheringTime} WIB ({preMins} menit sebelum Kick-off)
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kolom Papan Transaksi & Tebakan Publik */}
        <div className="space-y-8">
          {/* Transparansi Tebakan Terkini */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
              <Users className="h-5 w-5 text-primary" />
              <span>Tebakan Terbuka (Paid)</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {publicPredictions.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Belum ada tebakan aktif dari warga saat ini.
                </div>
              ) : (
                publicPredictions.map((p) => (
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
                ))
              )}
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
              <Button variant="outline" className="flex-1" onClick={handleCancelPayment} disabled={submitting}>
                Batal
              </Button>
              {paymentMethod === "qris" && (
                <Button className="flex-1" onClick={handleSimulatePaymentSuccess} disabled={submitting}>
                  {submitting ? "Memproses..." : "Simulasi Sukses"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
