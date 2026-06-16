"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Trophy, DollarSign, Search, ShoppingCart, CreditCard, History, 
  ArrowDownRight, Eye, X, Calendar, MapPin, ShieldAlert, Award, 
  Flame, CheckCircle, Clock, AlertCircle, Play, Shield
} from "lucide-react";
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
  "Kongo Demokratik": "cd", "Democratic Republic of the Congo": "cd", "Congo DR": "cd", "DR Congo": "cd",
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

interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_score_a: number;
  predicted_score_b: number;
  transaction_id: string;
  created_at: string;
  matches: Match;
  transactions: {
    payment_status: string;
    payment_method: string;
    transaction_reference: string;
  };
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  receipt_url: string | null;
  created_at: string;
}

export default function MyPredictionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Data lists
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [allPaidPredictions, setAllPaidPredictions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  
  // Unpaid Transactions list (from DB status: pending)
  const [unpaidTransactions, setUnpaidTransactions] = useState<any[]>([]);

  // Local Cart State
  const [cart, setCart] = useState<{ [matchId: string]: { score_a: number; score_b: number }[] }>({});
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash">("qris");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Search Match State
  const [matchQuery, setMatchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed">("all");

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<"history" | "new" | "cart" | "withdraw">("history");

  // Withdrawal Form State
  const [wdAmount, setWdAmount] = useState("");
  const [wdBank, setWdBank] = useState("");
  const [wdNumber, setWdNumber] = useState("");
  const [wdName, setWdName] = useState("");
  const [wdSubmitting, setWdSubmitting] = useState(false);

  // Receipt Preview State
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      
      const { data: userProfile, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", session.user.id)
        .single();

      if (pErr || !userProfile) {
        console.error("Profile not found");
        setLoading(false);
        return;
      }
      
      if (userProfile.role === "admin") {
        alert("Akses ditolak: Administrator tidak dapat membuat tebakan untuk diri sendiri.");
        router.push("/admin");
        return;
      }

      setProfile(userProfile);
      
      // Parse query params to set active tab
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab === "new") {
          setActiveSubTab("new");
        } else if (tab === "cart") {
          setActiveSubTab("cart");
        }
      }
      
      await loadDashboardData(userProfile.id);
      setLoading(false);
    }
    init();
  }, []);

  async function loadDashboardData(profileId: string) {
    try {
      // 1. Fetch matches
      const { data: matchesData } = await supabase
        .from("matches")
        .select("*")
        .order("match_time", { ascending: true });
      setMatches(matchesData || []);

      // 2. Fetch user predictions
      const { data: predsData } = await supabase
        .from("predictions")
        .select(`
          *,
          matches (*),
          transactions (
            payment_status,
            payment_method,
            transaction_reference
          )
        `)
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });
      setUserPredictions(predsData as unknown as Prediction[] || []);

      // 3. Fetch all paid predictions for pool/winner calculations
      const { data: allPaidData } = await supabase
        .from("predictions")
        .select(`
          id,
          match_id,
          predicted_score_a,
          predicted_score_b,
          transaction_id,
          transactions!inner (
            payment_status
          )
        `)
        .eq("transactions.payment_status", "paid");
      setAllPaidPredictions(allPaidData || []);

      // 4. Fetch user withdrawals
      const { data: withdrawalsData } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });
      setWithdrawals(withdrawalsData || []);

      // 5. Fetch unpaid database transactions (pending)
      const { data: pendingTxData } = await supabase
        .from("transactions")
        .select(`
          *,
          predictions (
            *,
            matches (*)
          )
        `)
        .eq("user_id", profileId)
        .eq("payment_status", "pending")
        .order("created_at", { ascending: false });
      setUnpaidTransactions(pendingTxData || []);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  }

  // --- PARI-MUTUEL CALCULATIONS ---
  const getMatchPoolStats = (matchId: string, actualScoreA: number | null, actualScoreB: number | null) => {
    const matchPaidPreds = allPaidPredictions.filter((p) => p.match_id === matchId);
    const totalGuesses = matchPaidPreds.length;
    const grossPool = totalGuesses * 10000;

    let winnersCount = 0;
    let prizePerWinner = 0;
    let hostFeePerWinner = 0;

    if (actualScoreA !== null && actualScoreB !== null) {
      const correctPreds = matchPaidPreds.filter(
        (p) => p.predicted_score_a === actualScoreA && p.predicted_score_b === actualScoreB
      );
      winnersCount = correctPreds.length;
      if (winnersCount > 0) {
        const potentialShare = grossPool / winnersCount;
        if (potentialShare > 20000) {
          hostFeePerWinner = potentialShare * 0.10;
          prizePerWinner = potentialShare * 0.90;
        } else {
          hostFeePerWinner = 0;
          prizePerWinner = potentialShare;
        }
      }
    }

    return {
      totalGuesses,
      grossPool,
      winnersCount,
      prizePerWinner,
      hostFeePerWinner
    };
  };

  // User financial statistics
  let totalGuessesPaid = 0;
  let totalWinsCount = 0;
  let totalWinningsEarned = 0;

  // Process paid predictions
  const paidPredictions = userPredictions.filter(p => p.transactions?.payment_status === "paid");
  totalGuessesPaid = paidPredictions.length;

  paidPredictions.forEach(pred => {
    const match = pred.matches;
    if (match && match.status === "completed" && match.score_a !== null && match.score_b !== null) {
      const isCorrect = pred.predicted_score_a === match.score_a && pred.predicted_score_b === match.score_b;
      if (isCorrect) {
        totalWinsCount++;
        const stats = getMatchPoolStats(match.id, match.score_a, match.score_b);
        totalWinningsEarned += stats.prizePerWinner;
      }
    }
  });

  // Withdrawals info
  const totalWithdrawn = withdrawals
    .filter(w => w.status === "approved")
    .reduce((sum, w) => sum + w.amount, 0);

  const totalPendingWd = withdrawals
    .filter(w => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);

  const availableBalance = Math.max(0, totalWinningsEarned - totalWithdrawn - totalPendingWd);

  // --- SEARCH & FILTER MATCHES ---
  const filteredUpcomingMatches = matches.filter(match => {
    const isUpcoming = match.status === "scheduled" && new Date(match.match_time).getTime() > Date.now();
    const isCompleted = match.status === "completed";
    
    // Status filter
    if (statusFilter === "scheduled" && !isUpcoming) return false;
    if (statusFilter === "completed" && !isCompleted) return false;

    // Search query filter
    const query = matchQuery.toLowerCase();
    const teamAMatch = match.team_a.toLowerCase().includes(query);
    const teamBMatch = match.team_b.toLowerCase().includes(query);
    const stageMatch = match.stage.toLowerCase().includes(query);
    const stadiumMatch = match.stadium?.toLowerCase().includes(query) || false;

    return teamAMatch || teamBMatch || stageMatch || stadiumMatch;
  });

  // --- LOCAL CART ACTIONS ---
  const addPredictionToCart = (matchId: string) => {
    const currentList = cart[matchId] || [];
    if (currentList.length >= 5) {
      alert("Maksimal tebakan untuk satu pertandingan adalah 5 tebakan!");
      return;
    }
    setCart({
      ...cart,
      [matchId]: [...currentList, { score_a: 0, score_b: 0 }],
    });
    setActiveSubTab("cart");
  };

  const updateCartScore = (matchId: string, index: number, team: "a" | "b", val: number) => {
    const currentList = [...(cart[matchId] || [])];
    if (team === "a") currentList[index].score_a = Math.max(0, val);
    else currentList[index].score_b = Math.max(0, val);

    setCart({
      ...cart,
      [matchId]: currentList,
    });
  };

  const removeCartPrediction = (matchId: string, index: number) => {
    const currentList = [...(cart[matchId] || [])];
    currentList.splice(index, 1);
    const updatedCart = { ...cart };
    if (currentList.length === 0) {
      delete updatedCart[matchId];
    } else {
      updatedCart[matchId] = currentList;
    }
    setCart(updatedCart);
  };

  const totalCartCount = Object.values(cart).reduce((sum, list) => sum + list.length, 0);
  const totalCartPrice = totalCartCount * 10000;

  const handleCheckoutLocalCart = async () => {
    if (!profile) return;

    // Check for duplicate predictions (same match_id and same predicted scores)
    for (const [matchId, preds] of Object.entries(cart)) {
      const match = matches.find(m => m.id === matchId);
      const matchName = match ? `${match.team_a} vs ${match.team_b}` : "Pertandingan";
      
      // 1. Check duplicates within the cart itself
      const seen = new Set<string>();
      for (const pred of preds) {
        const scoreKey = `${pred.score_a}-${pred.score_b}`;
        if (seen.has(scoreKey)) {
          alert(`Gagal: Terdapat tebakan ganda ${pred.score_a} - ${pred.score_b} untuk laga ${matchName} di dalam keranjang belanja Anda.`);
          return;
        }
        seen.add(scoreKey);
      }

      // 2. Check duplicates against existing database predictions (paid & pending)
      for (const pred of preds) {
        const isDuplicateDb = userPredictions.some(dbPred => 
          dbPred.match_id === matchId && 
          dbPred.predicted_score_a === pred.score_a && 
          dbPred.predicted_score_b === pred.score_b &&
          dbPred.transactions?.payment_status !== "failed"
        );
        if (isDuplicateDb) {
          alert(`Gagal: Anda sudah pernah mengirim tebakan ${pred.score_a} - ${pred.score_b} untuk laga ${matchName} sebelumnya.`);
          return;
        }
      }
    }

    setCheckoutSubmitting(true);
    try {
      // 1. Create Transaction (Pending)
      const { data: newTx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: profile.id,
          amount: totalCartPrice,
          payment_status: "pending",
          payment_method: paymentMethod,
          transaction_reference: paymentMethod === "qris" ? `QRIS-PENDING-${Date.now()}` : `CASH-PENDING-${Date.now()}`
        })
        .select()
        .single();

      if (txErr) throw txErr;

      // 2. Create Predictions
      const predictionsPayload: any[] = [];
      Object.entries(cart).forEach(([matchId, list]) => {
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

      setCart({});
      await loadDashboardData(profile.id);
      
      if (paymentMethod === "cash") {
        alert("Tebakan Anda berhasil diajukan! Status transaksi saat ini PENDING. Silakan lakukan pembayaran tunai ke meja panitia RT 12 sebesar Rp " + totalCartPrice.toLocaleString("id-ID") + ".");
      } else {
        await payWithMidtrans(newTx.id);
      }
    } catch (err: any) {
      alert("Gagal memproses transaksi: " + err.message);
      setCheckoutSubmitting(false);
    }
  };

  const payWithMidtrans = async (txId: string) => {
    try {
      setCheckoutSubmitting(true);
      const payRes = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId: txId }),
      });
      const paymentData = await payRes.json();
      if (paymentData.error) throw new Error(paymentData.error);

      if ((window as any).snap) {
        (window as any).snap.pay(paymentData.token, {
          onSuccess: async function () {
            alert("Pembayaran sukses! Tebakan Anda kini terdaftar.");
            if (profile) await loadDashboardData(profile.id);
          },
          onPending: async function () {
            alert("Pembayaran pending. Silakan selesaikan pembayaran Anda.");
            if (profile) await loadDashboardData(profile.id);
          },
          onError: function () {
            alert("Pembayaran gagal! Silakan coba lagi.");
          },
          onClose: async function () {
            alert("Anda menutup halaman pembayaran sebelum menyelesaikan transaksi.");
            if (profile) await loadDashboardData(profile.id);
          }
        });
      } else {
        alert("Gagal memuat sistem pembayaran Midtrans. Silakan coba beberapa saat lagi atau hubungi panitia.");
      }
    } catch (err: any) {
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Pay pending transactions in DB
  const handlePayPendingTx = async (txId: string) => {
    const tx = unpaidTransactions.find(t => t.id === txId);
    if (tx) {
      if (tx.payment_method === "cash") {
        alert("Pembayaran tunai harus diselesaikan di meja panitia RT 12 secara langsung.");
      } else {
        await payWithMidtrans(txId);
      }
    }
  };

  // --- WITHDRAWAL SUBMIT ---
  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const amountNum = parseInt(wdAmount);
    if (isNaN(amountNum) || amountNum < 10000) {
      alert("Minimal penarikan dana adalah Rp 10.000!");
      return;
    }
    if (amountNum > availableBalance) {
      alert("Saldo Anda tidak mencukupi untuk melakukan penarikan sebesar ini!");
      return;
    }
    if (!wdBank.trim() || !wdNumber.trim() || !wdName.trim()) {
      alert("Silakan lengkapi semua kolom bank tujuan!");
      return;
    }

    setWdSubmitting(true);
    try {
      const { error } = await supabase
        .from("withdrawals")
        .insert({
          user_id: profile.id,
          amount: amountNum,
          bank_name: wdBank.trim(),
          account_number: wdNumber.trim(),
          account_name: wdName.trim(),
          status: "pending"
        });

      if (error) throw error;
      alert("Pengajuan penarikan dana sebesar Rp " + amountNum.toLocaleString("id-ID") + " berhasil dikirim! Silakan tunggu konfirmasi & transfer dari panitia.");
      setWdAmount("");
      await loadDashboardData(profile.id);
    } catch (err: any) {
      alert("Gagal mengajukan penarikan: " + err.message);
    } finally {
      setWdSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-semibold">Memuat dashboard tebakan Anda...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-xl">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-2" />
        <p className="font-bold">Error: Profil warga tidak ditemukan.</p>
        <p className="text-xs text-muted-foreground mt-1">Silakan coba hubungi admin atau login ulang.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      
      {/* Top Profile Summary Header */}
      <div className="rounded-2xl bg-gradient-to-br from-card via-[#122218] to-card border border-border p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="space-y-2 relative">
          <span className="text-[10px] font-bold uppercase bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded">
            Dashboard Warga RT 12
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">{profile.name}</h1>
          <p className="text-xs text-muted-foreground">WhatsApp: <strong>+{profile.phone_number}</strong></p>
        </div>

        {/* Finance Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto relative">
          <div className="bg-background/80 border border-border/80 rounded-xl p-4 text-center space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Winnings (Net)</span>
            <span className="text-lg font-black text-green-500">Rp {totalWinningsEarned.toLocaleString("id-ID")}</span>
          </div>

          <div className="bg-background/80 border border-border/80 rounded-xl p-4 text-center space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Telah Dicairkan</span>
            <span className="text-lg font-black text-muted-foreground">Rp {totalWithdrawn.toLocaleString("id-ID")}</span>
          </div>

          <div className="bg-background/80 border border-primary/30 rounded-xl p-4 text-center space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Saldo Tersedia</span>
            <span className="text-lg font-black text-primary">Rp {availableBalance.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Navigation & Sub-screens */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2 bg-card border border-border rounded-xl p-4 h-fit">
          <Button
            variant={activeSubTab === "history" ? "secondary" : "ghost"}
            className="w-full justify-start text-xs font-semibold h-10"
            onClick={() => setActiveSubTab("history")}
          >
            <History className="mr-2 h-4 w-4" />
            <span>Tebakan Saya ({userPredictions.length})</span>
          </Button>

          <Button
            variant={activeSubTab === "new" ? "secondary" : "ghost"}
            className="w-full justify-start text-xs font-semibold h-10"
            onClick={() => setActiveSubTab("new")}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Cari Laga & Tebak Skor</span>
          </Button>

          <Button
            variant={activeSubTab === "cart" ? "secondary" : "ghost"}
            className="w-full justify-start text-xs font-semibold h-10 relative"
            onClick={() => setActiveSubTab("cart")}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Keranjang Belanja</span>
            {(totalCartCount > 0 || unpaidTransactions.length > 0) && (
              <span className="absolute right-3 top-2.5 bg-accent text-accent-foreground rounded-full text-[10px] font-bold px-1.5 py-0.5">
                {totalCartCount + unpaidTransactions.length}
              </span>
            )}
          </Button>

          <Button
            variant={activeSubTab === "withdraw" ? "secondary" : "ghost"}
            className="w-full justify-start text-xs font-semibold h-10"
            onClick={() => setActiveSubTab("withdraw")}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Pencairan Dana (Withdraw)</span>
          </Button>
        </div>

        {/* Dynamic Display Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB: GUESS HISTORY */}
          {activeSubTab === "history" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center space-x-2 text-foreground">
                <Trophy className="h-5 w-5 text-accent" />
                <span>Riwayat Tebakan Terdaftar</span>
              </h2>

              {userPredictions.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl space-y-3">
                  <Flame className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground font-semibold">Anda belum memiliki tebakan terdaftar.</p>
                  <Button size="sm" onClick={() => setActiveSubTab("new")} className="text-xs">
                    Tebak Skor Sekarang
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPredictions.map((pred) => {
                    const match = pred.matches;
                    if (!match) return null;
                    const isPaid = pred.transactions?.payment_status === "paid";
                    
                    let flagA = getFlagUrl(match.team_a);
                    let flagB = getFlagUrl(match.team_b);
                    
                    const isMatchCompleted = match.status === "completed";
                    
                    let isWinner = false;
                    let payout = 0;
                    let totalMatchGuesses = 0;
                    let winnersCount = 0;

                    if (isPaid && isMatchCompleted && match.score_a !== null && match.score_b !== null) {
                      isWinner = pred.predicted_score_a === match.score_a && pred.predicted_score_b === match.score_b;
                      const stats = getMatchPoolStats(match.id, match.score_a, match.score_b);
                      payout = stats.prizePerWinner;
                      totalMatchGuesses = stats.totalGuesses;
                      winnersCount = stats.winnersCount;
                    }

                    const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    }).replace(/\./g, ':');

                    return (
                      <div key={pred.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm relative overflow-hidden">
                        
                        {/* Winner/Status Banner */}
                        {isPaid && isMatchCompleted && (
                          <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-wider ${isWinner ? 'bg-green-500 text-black' : 'bg-red-500/25 text-red-500 border-l border-b border-red-500/20'}`}>
                            {isWinner ? `Menang (+Rp ${payout.toLocaleString("id-ID")})` : "Kalah / Salah"}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="bg-secondary/20 px-2 py-0.5 rounded text-secondary font-medium uppercase">
                            {match.stage}
                          </span>
                          <span>{formattedDate}</span>
                        </div>

                        {/* Match Details */}
                        <div className="flex items-center justify-between py-1 text-xs sm:text-sm">
                          {/* Team A */}
                          <div className="flex items-center space-x-2.5 w-[38%]">
                            {flagA ? (
                              <img src={flagA} alt="" className="w-6 h-4 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                            ) : (
                              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-semibold truncate">{match.team_a}</span>
                          </div>

                          {/* Scores & Predictions */}
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Skor Akhir</div>
                            {isMatchCompleted ? (
                              <div className="font-mono font-black text-sm text-foreground bg-muted px-2 py-0.5 rounded border border-border">
                                {match.score_a} - {match.score_b}
                              </div>
                            ) : (
                              <div className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded animate-pulse">
                                {match.status.replace("_", " ")}
                              </div>
                            )}
                          </div>

                          {/* Team B */}
                          <div className="flex items-center justify-end space-x-2.5 w-[38%] text-right">
                            <span className="font-semibold truncate">{match.team_b}</span>
                            {flagB ? (
                              <img src={flagB} alt="" className="w-6 h-4 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                            ) : (
                              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Prediction info & Pool Info */}
                        <div className="border-t border-border/30 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                          <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">Prediksi Anda:</span>
                            <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                              {pred.predicted_score_a} - {pred.predicted_score_b}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isPaid ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                              {isPaid ? "Paid (Lunas)" : "Pending (Belum Bayar)"}
                            </span>
                            {isPaid && isMatchCompleted && (
                              <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                Penebak Tepat: <strong>{winnersCount}</strong> / Total Tebakan Laga: <strong>{totalMatchGuesses}</strong>
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
          )}

          {/* TAB: SEARCH & GUESS MATCH */}
          {activeSubTab === "new" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center space-x-2 text-foreground">
                <Search className="h-5 w-5 text-primary" />
                <span>Cari Laga & Ajukan Tebakan</span>
              </h2>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan negara, babak, stadion..."
                    value={matchQuery}
                    onChange={(e) => setMatchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-card border border-input rounded-lg text-xs placeholder-muted-foreground/50 text-foreground"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setStatusFilter("all")}
                  >
                    Semua
                  </Button>
                  <Button
                    variant={statusFilter === "scheduled" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setStatusFilter("scheduled")}
                  >
                    Akan Datang
                  </Button>
                  <Button
                    variant={statusFilter === "completed" ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setStatusFilter("completed")}
                  >
                    Selesai
                  </Button>
                </div>
              </div>

              {/* Match Cards */}
              {filteredUpcomingMatches.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                  Pertandingan tidak ditemukan atau tidak sesuai filter.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUpcomingMatches.map((match) => {
                    const isBettingClosed = match.status !== "scheduled" || new Date(match.match_time).getTime() < Date.now();
                    const flagA = getFlagUrl(match.team_a);
                    const flagB = getFlagUrl(match.team_b);
                    const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit"
                    }).replace(/\./g, ':');

                    // Count paid predictions for this match (pool size simulation info)
                    const matchPaidPreds = allPaidPredictions.filter(p => p.match_id === match.id);
                    const currentCartCount = cart[match.id]?.length || 0;

                    return (
                      <div key={match.id} className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/20 transition-all shadow-sm">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="bg-secondary/20 px-2 py-0.5 rounded text-secondary font-medium uppercase">
                            {match.stage}
                          </span>
                          <span className="text-muted-foreground">{formattedDate}</span>
                        </div>

                        <div className="flex items-center justify-between py-1 text-xs sm:text-sm">
                          {/* Team A */}
                          <div className="flex items-center space-x-3 w-[40%]">
                            {flagA ? (
                              <img src={flagA} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                            ) : (
                              <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-semibold truncate">{match.team_a}</span>
                          </div>

                          {/* Central divider */}
                          <div className="text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded">
                            {match.status === "completed" ? `${match.score_a} - ${match.score_b}` : "VS"}
                          </div>

                          {/* Team B */}
                          <div className="flex items-center justify-end space-x-3 w-[40%] text-right">
                            <span className="font-semibold truncate">{match.team_b}</span>
                            {flagB ? (
                              <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                            ) : (
                              <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>

                        <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-2.5">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-primary shrink-0" />
                            <span className="truncate max-w-[180px]">{match.stadium}</span>
                          </div>

                          <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                            {matchPaidPreds.length} Tebakan Lunas (Pool: Rp {(matchPaidPreds.length * 10000).toLocaleString("id-ID")})
                          </span>
                        </div>

                        {/* Add guessing interface */}
                        {!isBettingClosed && (
                          <div className="flex justify-end pt-1 border-t border-border/30">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addPredictionToCart(match.id)}
                              disabled={currentCartCount >= 5}
                              className="h-7 text-[10px] text-primary border-primary/20 hover:bg-primary/10"
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
          )}

          {/* TAB: SHOPPING CART & PENDING TRANSACTIONS */}
          {activeSubTab === "cart" && (
            <div className="space-y-6">
              
              {/* Part 1: Local Cart Checkout */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-5">
                <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
                  <ShoppingCart className="h-5 w-5 text-accent" />
                  <span>Keranjang Tebakan Baru (Lokal)</span>
                </h3>

                {totalCartCount === 0 ? (
                  <p className="text-center py-6 text-xs text-muted-foreground">Keranjang lokal kosong. Silakan tambah tebakan dari tab pencarian laga.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {Object.entries(cart).map(([matchId, preds]) => {
                        const match = matches.find(m => m.id === matchId);
                        if (!match) return null;
                        
                        return (
                          <div key={matchId} className="border border-border/40 bg-background/50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold">{match.team_a} vs {match.team_b}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-muted-foreground uppercase mr-1">{match.stage}</span>
                                {preds.length < 5 && (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() => addPredictionToCart(matchId)}
                                    className="h-5 text-[9px] px-2 text-primary border-primary/20 hover:bg-primary/10"
                                  >
                                    + Tambah Tebakan
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {preds.map((pred, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-card border border-border/30 p-2.5 rounded-lg text-xs gap-2 sm:gap-3">
                                  <span className="text-muted-foreground font-semibold shrink-0">Tebakan #{idx + 1}</span>
                                  
                                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 justify-end">
                                    {/* Team A Flag & Name */}
                                    <div className="flex items-center space-x-1.5 justify-end w-[35%] max-w-[120px]">
                                      <span className="font-semibold truncate text-right text-[10px] sm:text-xs">{match.team_a}</span>
                                      {getFlagUrl(match.team_a) ? (
                                        <img src={getFlagUrl(match.team_a)!} alt="" className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0" />
                                      ) : (
                                        <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                      )}
                                    </div>

                                    {/* Score Input Box */}
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={pred.score_a}
                                        onChange={(e) => updateCartScore(matchId, idx, "a", parseInt(e.target.value) || 0)}
                                        className="w-10 h-7 text-center rounded border border-input bg-background font-bold text-xs"
                                      />
                                      <span className="text-muted-foreground font-bold text-[10px]">-</span>
                                      <input
                                        type="number"
                                        value={pred.score_b}
                                        onChange={(e) => updateCartScore(matchId, idx, "b", parseInt(e.target.value) || 0)}
                                        className="w-10 h-7 text-center rounded border border-input bg-background font-bold text-xs"
                                      />
                                    </div>

                                    {/* Team B Flag & Name */}
                                    <div className="flex items-center space-x-1.5 justify-start w-[35%] max-w-[120px]">
                                      {getFlagUrl(match.team_b) ? (
                                        <img src={getFlagUrl(match.team_b)!} alt="" className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0" />
                                      ) : (
                                        <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                      )}
                                      <span className="font-semibold truncate text-left text-[10px] sm:text-xs">{match.team_b}</span>
                                    </div>

                                    {/* Delete Row Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeCartPrediction(matchId, idx)}
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cart Summary */}
                    <div className="border-t border-border pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Total: <strong>{totalCartCount} item tebakan</strong></div>
                        <div className="text-base font-black text-primary">Total Bayar: Rp {totalCartPrice.toLocaleString("id-ID")}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="bg-background border border-input text-xs rounded-lg px-3 py-1.5 text-foreground"
                        >
                          <option value="qris">QRIS (Otomatis)</option>
                          <option value="cash">Tunai (Admin)</option>
                        </select>

                        <Button 
                          onClick={handleCheckoutLocalCart} 
                          disabled={checkoutSubmitting}
                          size="sm"
                          className="text-xs font-bold"
                        >
                          {checkoutSubmitting ? "Proses..." : "Checkout & Bayar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Part 2: Database Pending Transactions */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-5">
                <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span>Tebakan Menunggu Pembayaran (Database)</span>
                </h3>

                {unpaidTransactions.length === 0 ? (
                  <p className="text-center py-6 text-xs text-muted-foreground">Tidak ada tagihan pembayaran tertunda di database.</p>
                ) : (
                  <div className="space-y-4">
                    {unpaidTransactions.map((tx) => (
                      <div key={tx.id} className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono text-[10px] text-muted-foreground uppercase">ID: #{tx.id.substring(0, 8)}</span>
                            <span className="block text-[9px] text-muted-foreground">{new Date(tx.created_at).toLocaleString("id-ID")}</span>
                          </div>
                          <span className="font-bold text-amber-500 text-sm">Rp {tx.amount.toLocaleString("id-ID")}</span>
                        </div>

                        {/* List predictions in this transaction */}
                        <div className="space-y-1.5 pl-2 border-l-2 border-border/60">
                          {tx.predictions?.map((pred: any) => (
                            <div key={pred.id} className="text-xs flex justify-between items-center text-muted-foreground">
                              <span>[{pred.matches?.stage}] {pred.matches?.team_a} vs {pred.matches?.team_b}</span>
                              <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                                Prediksi: {pred.predicted_score_a} - {pred.predicted_score_b}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Payment Actions */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/30 text-xs">
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Metode: <strong className="uppercase text-foreground">{tx.payment_method}</strong>
                          </span>
                          
                          <Button
                            size="sm"
                            className="h-7 text-[10px] font-bold"
                            onClick={() => handlePayPendingTx(tx.id)}
                          >
                            {tx.payment_method === "qris" ? "Bayar via QRIS (Simulasi)" : "Selesaikan Bayar Cash ke Admin"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: WITHDRAW / PENARIKAN DANA */}
          {activeSubTab === "withdraw" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Form Request WD */}
              <div className="md:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm h-fit">
                <h3 className="text-base font-bold flex items-center space-x-2 border-b border-border pb-2.5">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Ajukan Penarikan</span>
                </h3>

                <form onSubmit={handleRequestWithdrawal} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                      Jumlah Penarikan (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min={10000}
                      placeholder="Min. 10.000"
                      value={wdAmount}
                      onChange={(e) => setWdAmount(e.target.value)}
                      className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-[9px] text-muted-foreground mt-1 block">
                      Saldo tersedia: <strong>Rp {availableBalance.toLocaleString("id-ID")}</strong>
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                      Nama Bank / E-Wallet
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="BCA, Mandiri, OVO, GOPAY..."
                      value={wdBank}
                      onChange={(e) => setWdBank(e.target.value)}
                      className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                      Nomor Rekening / E-Wallet
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nomor rekening"
                      value={wdNumber}
                      onChange={(e) => setWdNumber(e.target.value)}
                      className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                      Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama pemilik"
                      value={wdName}
                      onChange={(e) => setWdName(e.target.value)}
                      className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full text-xs font-bold h-9" 
                    disabled={wdSubmitting || availableBalance < 10000}
                  >
                    {wdSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
                  </Button>
                </form>
              </div>

              {/* History Withdrawals list */}
              <div className="md:col-span-2 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                <h3 className="text-base font-bold flex items-center space-x-2 border-b border-border pb-2.5">
                  <History className="h-5 w-5 text-accent" />
                  <span>Riwayat Penarikan Dana</span>
                </h3>

                {withdrawals.length === 0 ? (
                  <p className="text-center py-12 text-xs text-muted-foreground">Belum ada riwayat penarikan dana.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {withdrawals.map((wd) => (
                      <div key={wd.id} className="border border-border/40 bg-background/50 rounded-xl p-4 space-y-3 flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-foreground">Rp {wd.amount.toLocaleString("id-ID")}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {wd.bank_name} - {wd.account_number} ({wd.account_name})
                          </div>
                          <div className="text-[9px] text-muted-foreground">
                            {new Date(wd.created_at).toLocaleString("id-ID")}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {/* Status Badge */}
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            wd.status === "approved" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                            wd.status === "rejected" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                            "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                          }`}>
                            {wd.status}
                          </span>

                          {/* Action Button: View receipt */}
                          {wd.status === "approved" && wd.receipt_url && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => setPreviewReceiptUrl(wd.receipt_url)}
                              className="h-6 text-[9px] space-x-1.5"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Bukti Transfer</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODAL: PREVIEW TRANSFER RECEIPT */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center">
                <Award className="h-4 w-4 mr-2 text-green-500" />
                Bukti Transfer Resmi (RT 12)
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewReceiptUrl(null)}
                className="h-8 w-8 text-muted-foreground hover:bg-muted/10 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-center bg-background/50 rounded-xl overflow-hidden max-h-[70vh] p-2 border border-border/40">
              {/* Check if receipt_url is image or plain url */}
              {previewReceiptUrl.startsWith("data:image") || previewReceiptUrl.includes("http") ? (
                <img 
                  src={previewReceiptUrl} 
                  alt="Bukti Transfer" 
                  className="max-h-[60vh] object-contain rounded"
                />
              ) : (
                <div className="py-20 text-center text-xs text-muted-foreground">
                  <p>Detail Bukti Transfer:</p>
                  <p className="font-mono bg-muted p-3 mt-2 rounded font-bold break-all">{previewReceiptUrl}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border/30">
              <Button 
                variant="secondary" 
                size="sm" 
                className="text-xs" 
                onClick={() => setPreviewReceiptUrl(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
