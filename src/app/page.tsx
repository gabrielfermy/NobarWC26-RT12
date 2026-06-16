"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  "Turki": "tr", "Turkey": "tr", "Türkiye": "tr", "Turkiye": "tr",
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
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash">("qris");
  const [activeTab, setActiveTab] = useState<"laga" | "nobar">("laga");
  
  // Real database profiles & predictions state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [publicPredictions, setPublicPredictions] = useState<PublicPrediction[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Community Wall state
  const [comments, setComments] = useState<{ id: string; name: string; message: string; created_at: string }[]>([]);
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentMessage, setNewCommentMessage] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");


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

    async function loadComments() {
      try {
        const { data, error } = await supabase
          .from("community_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (!error && data) {
          setComments(data);
        }
      } catch (err) {
        console.error("Error loading comments:", err);
      }
    }

    loadComments();

    // Live update WebSocket untuk community_messages
    const commentsChannel = supabase
      .channel("comments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_messages" },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(predChannel);
      supabase.removeChannel(commentsChannel);
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

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (profile?.name) {
      setNewCommentName(profile.name);
    }
  }, [profile]);

  const handlePostComment = async () => {
    if (!newCommentName.trim()) {
      alert("Nama tidak boleh kosong!");
      return;
    }
    if (!newCommentMessage.trim()) {
      alert("Pesan tidak boleh kosong!");
      return;
    }
    if (!user && captchaInput.toUpperCase() !== captchaCode) {
      alert("Kode CAPTCHA tidak cocok!");
      generateCaptcha();
      return;
    }

    try {
      const { error } = await supabase
        .from("community_messages")
        .insert({
          name: newCommentName.trim(),
          message: newCommentMessage.trim()
        });

      if (error) throw error;
      setNewCommentMessage("");
      generateCaptcha();
    } catch (err: any) {
      alert("Gagal mengirim pesan: " + err.message);
    }
  };


  const getUpcomingMatches = (): Match[] => {
    const now = Date.now();
    return matches
      .filter((m) => m.status === "scheduled" && new Date(m.match_time).getTime() > now)
      .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime())
      .slice(0, 9);
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
          transaction_reference: paymentMethod === "qris" ? `QRIS-PENDING-${Date.now()}` : `CASH-PENDING-${Date.now()}`
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

      if (paymentMethod === "cash") {
        alert("Tebakan Anda berhasil diajukan! Status transaksi Anda saat ini PENDING. Silakan temui petugas RT 12 di meja registrasi nobar untuk melakukan pembayaran tunai sebesar Rp " + totalPrice.toLocaleString("id-ID") + " agar diaktifkan oleh admin.");
        setPredictionsCart({});
      } else {
        // Panggil API Payment Route kita untuk mendapatkan Midtrans Snap Token
        const payRes = await fetch("/api/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transactionId: newTx.id }),
        });
        const paymentData = await payRes.json();
        if (paymentData.error) throw new Error(paymentData.error);

        // Buka Midtrans Snap Popup
        if ((window as any).snap) {
          (window as any).snap.pay(paymentData.token, {
            onSuccess: function () {
              alert("Pembayaran sukses! Tebakan Anda kini terdaftar.");
              setPredictionsCart({});
            },
            onPending: function () {
              alert("Pembayaran pending. Silakan selesaikan pembayaran Anda.");
              setPredictionsCart({});
            },
            onError: function () {
              alert("Pembayaran gagal! Silakan coba lagi.");
            },
            onClose: function () {
              alert("Anda menutup halaman pembayaran sebelum menyelesaikan transaksi.");
            }
          });
        } else {
          alert("Gagal memuat sistem pembayaran Midtrans. Silakan coba beberapa saat lagi atau hubungi panitia.");
        }
      }
    } catch (err: any) {
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const totalPredictionsCount = Object.values(predictionsCart).reduce((sum, list) => sum + list.length, 0);
  const totalPrice = totalPredictionsCount * 10000;

  return (
    <div className="space-y-6 py-4">
      {/* Redesigned Header: Match Orange Theme with Logo */}
      <div className="bg-gradient-to-r from-primary to-orange-600 rounded-2xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none transform scale-150">
          <img src="/logo.png" alt="" className="w-48 h-48 filter blur-[1px]" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Flame className="h-3.5 w-3.5 animate-pulse" />
              <span>Official Nobar Partner</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight">
              NOBAR RT 12 PELEM KIDUL - PIALA DUNIA 2026
            </h1>
            <p className="text-white/85 text-xs max-w-xl font-medium leading-relaxed">
              Ayo tebak skor jagoanmu! Hanya <strong>Rp10.000</strong> per tebakan. Maksimal 5 tebakan per laga. Terbuka, transparan, dan seru untuk semua warga!
            </p>
          </div>
          <div className="flex justify-center sm:justify-end shrink-0 self-center sm:self-auto">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="Nobar 2026 Logo" className="h-20 w-20 sm:h-24 sm:w-24 object-contain filter drop-shadow-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex space-x-1 bg-muted p-1 rounded-xl max-w-md mx-auto">
        <Button
          variant={activeTab === "laga" ? "default" : "ghost"}
          className={`flex-1 text-xs py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
            activeTab === "laga"
              ? "bg-primary text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("laga")}
        >
          <Calendar className="h-4 w-4" />
          <span>Jadwal Laga</span>
        </Button>
        <Button
          variant={activeTab === "nobar" ? "default" : "ghost"}
          className={`flex-1 text-xs py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
            activeTab === "nobar"
              ? "bg-primary text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("nobar")}
        >
          <Tv className="h-4 w-4" />
          <span>Jadwal Nobar RT 12</span>
        </Button>
      </div>

      {/* Grid Utama (Mobile First Stack, Desktop Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Jadwal & Form Input Tebakan */}
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === "laga" ? (
            <>
              {/* 1. MATCH RESULTS (Pertandingan Terakhir & Live) */}
              <div className="space-y-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Match Results
                </h2>

                {loading ? (
                  <div className="flex h-24 flex-col items-center justify-center space-y-2 border border-border border-dashed rounded-xl">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Memuat hasil...</p>
                  </div>
                ) : recentMatches.length === 0 ? (
                  <div className="text-center py-8 border border-border border-dashed rounded-xl text-muted-foreground text-xs">
                    Belum ada hasil pertandingan.
                  </div>
                ) : (
                  <div className="space-y-3">
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
                        <div key={match.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                            <span className="bg-muted px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                              {match.stage}
                            </span>
                            <span>{formattedDate}</span>
                          </div>

                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center space-x-3 w-[40%]">
                              {flagA ? (
                                <img src={flagA} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/20 shrink-0" />
                              ) : (
                                <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                              )}
                              <span className="font-bold text-xs sm:text-sm truncate">{match.team_a}</span>
                            </div>

                            <div className="flex flex-col items-center justify-center px-3">
                              <div className="flex items-center space-x-2 bg-primary/10 px-3 py-1 rounded border border-primary/20">
                                <span className="font-mono text-sm font-black text-primary">{match.score_a}</span>
                                <span className="text-muted-foreground/50 text-[10px]">-</span>
                                <span className="font-mono text-sm font-black text-primary">{match.score_b}</span>
                              </div>
                              <span className="text-[8px] text-muted-foreground font-bold uppercase mt-1 tracking-wider">
                                {match.status === "completed" ? "Selesai" : match.status.replace("_", " ")}
                              </span>
                            </div>

                            <div className="flex items-center justify-end space-x-3 w-[40%] text-right">
                              <span className="font-bold text-xs sm:text-sm truncate">{match.team_b}</span>
                              {flagB ? (
                                <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/20 shrink-0" />
                              ) : (
                                <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-2">
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. UPCOMING MATCHES - Horizontal Scroll Layout */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                    Upcoming Matches
                  </h2>
                  <Link href="/bracket" className="text-xs text-primary font-bold hover:underline">
                    Bagan & Klasemen →
                  </Link>
                </div>

                {loading ? (
                  <div className="flex h-32 flex-col items-center justify-center space-y-2 border border-border border-dashed rounded-xl">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Memuat laga...</p>
                  </div>
                ) : upcomingMatches.length === 0 ? (
                  <div className="text-center py-8 border border-border border-dashed rounded-xl text-muted-foreground text-xs">
                    Semua pertandingan telah selesai!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                    {upcomingMatches.map((match) => {
                      const flagA = getFlagUrl(match.team_a);
                      const flagB = getFlagUrl(match.team_b);
                      const stadiumCountry = getStadiumCountry(match.stadium);
                      const stadiumFlag = getFlagUrl(stadiumCountry.name);
                      const isBettingClosed = match.status !== "scheduled" || new Date(match.match_time).getTime() < Date.now();
                      const formattedTime = new Date(match.match_time).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short"
                      });

                      return (
                        <div key={match.id} className="w-full bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">{match.stage}</span>
                            <span>{formattedDate}</span>
                          </div>

                          <div className="text-center text-[10px] font-bold text-muted-foreground">
                            World Cup Match
                          </div>

                          {/* Flag VS Flag Display */}
                          <div className="flex items-center justify-between py-1">
                            <div className="flex flex-col items-center space-y-1.5 w-[42%] text-center">
                              {flagA ? (
                                <img src={flagA} alt="" className="w-10 h-6.5 object-cover rounded shadow border border-border/20" />
                              ) : (
                                <Shield className="w-8 h-8 text-muted-foreground" />
                              )}
                              <span className="font-bold text-xs truncate max-w-full">{match.team_a}</span>
                            </div>

                            <div className="text-[10px] font-black text-muted-foreground bg-muted px-2.5 py-1 rounded">VS</div>

                            <div className="flex flex-col items-center space-y-1.5 w-[42%] text-center">
                              {flagB ? (
                                <img src={flagB} alt="" className="w-10 h-6.5 object-cover rounded shadow border border-border/20" />
                              ) : (
                                <Shield className="w-8 h-8 text-muted-foreground" />
                              )}
                              <span className="font-bold text-xs truncate max-w-full">{match.team_b}</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-center text-[10px] text-muted-foreground">
                            <div>Time: {formattedTime}</div>
                            <div className="flex items-center justify-center space-x-1 truncate max-w-full">
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate">{match.stadium}</span>
                              {stadiumFlag && (
                                <img src={stadiumFlag} alt="" className="w-3.5 h-2 object-cover rounded-xs border border-border/10 shrink-0" />
                              )}
                            </div>
                          </div>

                          {!isBettingClosed && (!profile || profile.role !== "admin") && (
                            <Button
                              onClick={() => router.push(user ? "/my-predictions?tab=new" : "/login")}
                              className="w-full text-[11px] h-8 font-bold bg-primary hover:bg-primary/90 text-white"
                            >
                              Tebak Skor (Get Out Now)
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Tab Jadwal Nobar */
            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <h2 className="text-lg font-bold flex items-center space-x-2 text-foreground">
                  <Tv className="h-5 w-5 text-primary" />
                  <span>Jadwal Nonton Bareng (Nobar) RT 12</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Saksikan keseruan bersama warga RT 12 Pelem Kidul di Pos Ronda.</p>
              </div>

              {loading ? (
                <div className="flex h-32 flex-col items-center justify-center space-y-2 border border-border border-dashed rounded-xl">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-xs text-muted-foreground">Memuat jadwal nobar...</p>
                </div>
              ) : matches.filter(m => m.is_nobar).length === 0 ? (
                <div className="text-center py-8 border border-border border-dashed rounded-xl text-muted-foreground text-xs">
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
                      <div key={match.id} className="rounded-xl border border-primary/20 bg-card p-4 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center text-xs">
                          <span className="bg-primary/15 px-2 py-0.5 rounded text-primary font-bold text-[9px] uppercase tracking-wider">
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
                          <div className="font-mono text-xs font-black bg-muted px-2.5 py-0.5 rounded text-muted-foreground">VS</div>
                          <div className="flex items-center justify-end space-x-2.5 w-[42%] text-right">
                            <span className="font-bold text-xs sm:text-sm truncate">{match.team_b}</span>
                            {flagB ? (
                              <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                            ) : (
                              <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>

                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-primary font-black uppercase tracking-wider block">Lokasi Nobar:</span>
                              <span className="text-xs font-bold text-foreground">{match.nobar_location || "Pos Ronda RT 12"}</span>
                            </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Community Wall Section */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  Community Wall
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Dengarkan serunya suara warga RT 12 Pelem Kidul.</p>
              </div>

              {/* List of comments/wishes */}
              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border rounded-lg">
                    Belum ada pesan. Ayo jadi yang pertama menulis!
                  </div>
                ) : (
                  comments.map((comment) => {
                    const initials = comment.name ? comment.name.substring(0, 1).toUpperCase() : "?";
                    const formattedTime = new Date(comment.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit"
                    }) + ", " + new Date(comment.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short"
                    });
                    
                    const isAdmin = comment.name.toLowerCase().includes("admin");

                    return (
                      <div key={comment.id} className="bg-background/50 border border-border/30 p-3 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center space-x-2">
                            <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                              isAdmin ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                            }`}>
                              {initials}
                            </div>
                            <span className={`font-bold ${isAdmin ? "text-accent" : "text-foreground"}`}>{comment.name}</span>
                            <span className="text-[8px] text-muted-foreground">• {formattedTime}</span>
                          </div>
                        </div>
                        <p className="text-xs font-medium text-foreground/90 pl-7 leading-relaxed whitespace-pre-wrap">
                          {comment.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Input Comment box & Captcha */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className={user ? "w-full" : "grid grid-cols-2 gap-2"}>
                <input
                  type="text"
                  placeholder="Nama Anda..."
                  value={newCommentName}
                  onChange={(e) => setNewCommentName(e.target.value)}
                  disabled={!!profile?.name}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-70 disabled:cursor-not-allowed"
                />
                {!user && (
                  <div className="flex items-center space-x-1">
                    <div className="bg-muted px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-widest text-primary border border-border select-none flex items-center justify-center flex-1 h-8">
                      {captchaCode}
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="CAPTCHA"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className="w-16 px-2 py-1.5 bg-background border border-input rounded-lg text-xs text-center uppercase placeholder-muted-foreground/45 focus:outline-none focus:ring-1 focus:ring-primary text-foreground h-8"
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-2 items-center">
                <textarea
                  placeholder="Tulis pesan warga..."
                  rows={2}
                  value={newCommentMessage}
                  onChange={(e) => setNewCommentMessage(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-input rounded-lg text-xs placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
                />
                <Button 
                  onClick={handlePostComment}
                  size="sm" 
                  className="h-10 text-[11px] font-bold bg-primary text-white px-4 shrink-0"
                >
                  Kirim
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
