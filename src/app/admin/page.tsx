"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trophy, Users, DollarSign, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptPrint } from "@/components/ReceiptPrint";

// Import new sub-components
import TransactionsTab from "./components/TransactionsTab";
import OfflineCheckoutTab from "./components/OfflineCheckoutTab";
import ManageMatchesTab from "./components/ManageMatchesTab";
import ManageNobarTab from "./components/ManageNobarTab";
import UsersTab from "./components/UsersTab";
import WithdrawalsTab from "./components/WithdrawalsTab";

// Import types
import { Match, Profile, Transaction, Withdrawal } from "./types";

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
      nameLower.includes("estadio azteca")) {
    return { name: "Meksiko", code: "mx" };
  }
  if (nameLower.includes("bmo field") || 
      nameLower.includes("bc place")) {
    return { name: "Kanada", code: "ca" };
  }
  return { name: "Amerika Serikat", code: "us" };
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "checkout" | "matches" | "users" | "withdrawals" | "nobar">("transactions");

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [allPaidPredictions, setAllPaidPredictions] = useState<any[]>([]);
  
  // Filter & Search State
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [txMethodFilter, setTxMethodFilter] = useState("all");
  const [matchSearch, setMatchSearch] = useState("");
  const [matchStatusFilter, setMatchStatusFilter] = useState("all");
  const [matchStageFilter, setMatchStageFilter] = useState("all");

  // Nobar Scheduling Form State
  const [selectedNobarMatchId, setSelectedNobarMatchId] = useState("");
  const [nobarLocation, setNobarLocation] = useState("");
  const [nobarPreMinutes, setNobarPreMinutes] = useState("30");

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScoreA, setEditScoreA] = useState("0");
  const [editScoreB, setEditScoreB] = useState("0");
  const [editStatus, setEditStatus] = useState("scheduled");

  // Printable Receipt State
  const [receiptData, setReceiptData] = useState<{ transaction: any; predictions: any[] } | null>(null);

  // Real-time API Sync State
  const [syncingApi, setSyncingApi] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);

  const syncMatchesFromApi = async () => {
    setSyncingApi(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Sesi kedaluwarsa. Silakan masuk kembali.");
        return;
      }

      const res = await fetch("/api/admin/trigger-sync", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      const result = await res.json();
      if (res.ok && result.success) {
        alert(`Berhasil menyinkronkan ${result.count} pertandingan secara real-time!`);
        await fetchMatches();
      } else {
        alert("Gagal sinkronisasi: " + (result.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSyncingApi(false);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_user_id", session.user.id)
          .single();

        if (profile?.role !== "admin") {
          alert("Akses ditolak: Anda bukan administrator.");
          router.push("/");
          return;
        }

        setIsAdmin(true);
        loadAllData();
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setAuthChecking(false);
      }
    }

    checkAuth();
  }, []);

  async function loadAllData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchTransactions(),
        fetchMatches(),
        fetchUsers(),
        fetchWithdrawals(),
        fetchAllPaidPredictions()
      ]);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Fetching Functions
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        profiles (
          name,
          phone_number
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const txWithPreds = await Promise.all(data.map(async (tx: any) => {
        const { data: preds } = await supabase
          .from("predictions")
          .select(`
            *,
            matches (
              team_a,
              team_b,
              stage
            )
          `)
          .eq("transaction_id", tx.id);
        return { ...tx, predictions: preds || [] };
      }));
      setTransactions(txWithPreds);
    }
  };

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("match_time", { ascending: true });
    if (!error && data) setMatches(data);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setUsers(data);
  };

  const fetchWithdrawals = async () => {
    const { data, error } = await supabase
      .from("withdrawals")
      .select(`
        *,
        profiles (
          name,
          phone_number
        )
      `)
      .order("created_at", { ascending: false });
    if (!error && data) setWithdrawals(data);
  };

  const fetchAllPaidPredictions = async () => {
    const { data, error } = await supabase
      .from("predictions")
      .select(`
        id,
        user_id,
        match_id,
        predicted_score_a,
        predicted_score_b,
        transactions!inner (
          payment_status
        )
      `)
      .eq("transactions.payment_status", "paid");
    if (!error && data) setAllPaidPredictions(data);
  };

  const confirmCashTransaction = async (txId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: "paid" })
        .eq("id", txId);

      if (error) throw error;
      alert("Transaksi tunai dilunasi!");
      await loadAllData();
    } catch (err: any) {
      alert(err.message || "Gagal melunasi transaksi.");
    } finally {
      setLoading(false);
    }
  };

  const startEditingMatch = (match: Match) => {
    setEditingMatchId(match.id);
    setEditScoreA(String(match.score_a ?? 0));
    setEditScoreB(String(match.score_b ?? 0));
    setEditStatus(match.status);
  };

  const saveMatchUpdate = async (matchId: string) => {
    setLoading(true);
    try {
      const updatePayload: any = {
        score_a: editStatus === "scheduled" ? null : parseInt(editScoreA),
        score_b: editStatus === "scheduled" ? null : parseInt(editScoreB),
        status: editStatus
      };

      const { error } = await supabase
        .from("matches")
        .update(updatePayload)
        .eq("id", matchId);

      if (error) throw error;
      setEditingMatchId(null);
      await fetchMatches();
      alert("Pertandingan berhasil diperbarui!");
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui skor laga.");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleNobar = async () => {
    if (!selectedNobarMatchId) {
      alert("Pilih pertandingan terlebih dahulu.");
      return;
    }
    if (!nobarLocation.trim()) {
      alert("Masukkan lokasi nobar.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          is_nobar: true,
          nobar_location: nobarLocation.trim(),
          nobar_pre_minutes: parseInt(nobarPreMinutes) || 30
        })
        .eq("id", selectedNobarMatchId);

      if (error) throw error;
      alert("Jadwal nobar berhasil disimpan!");
      
      setSelectedNobarMatchId("");
      setNobarLocation("");
      await fetchMatches();
    } catch (err: any) {
      alert(err.message || "Gagal membuat jadwal nobar.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNobar = async (matchId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan jadwal Nobar untuk laga ini?")) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          is_nobar: false,
          nobar_location: null,
          nobar_pre_minutes: null
        })
        .eq("id", matchId);

      if (error) throw error;
      alert("Jadwal Nobar dibatalkan.");
      await fetchMatches();
    } catch (err: any) {
      alert(err.message || "Gagal membatalkan jadwal nobar.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (id: string, file: File) => {
    setReceiptUploading(true);
    try {
      let finalUrl = "";
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('withdrawals')
        .upload(fileName, file, { upsert: true });

      if (error) {
        console.warn("Storage upload failed, falling back to Base64:", error);
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
        finalUrl = base64;
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('withdrawals')
          .getPublicUrl(fileName);
        finalUrl = publicUrl;
      }

      const { error: dbErr } = await supabase
        .from("withdrawals")
        .update({
          status: "approved",
          receipt_url: finalUrl
        })
        .eq("id", id);

      if (dbErr) throw dbErr;
      
      await fetchWithdrawals();
      alert("Penarikan dana disetujui & bukti transfer berhasil diunggah!");
    } catch (err: any) {
      alert("Gagal menyetujui penarikan: " + err.message);
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    if (!confirm("Tolak pengajuan penarikan dana ini?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
      alert("Pengajuan penarikan dana ditolak.");
      await fetchWithdrawals();
    } catch (err: any) {
      alert("Gagal menolak penarikan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCashPayout = async (profileId: string, amount: number, file: File | null) => {
    setLoading(true);
    try {
      let finalUrl = "";
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `manual-${profileId}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('withdrawals')
          .upload(fileName, file, { upsert: true });

        if (error) {
          console.warn("Storage upload failed, falling back to Base64:", error);
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
          });
          finalUrl = base64;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('withdrawals')
            .getPublicUrl(fileName);
          finalUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from("withdrawals")
        .insert({
          user_id: profileId,
          amount,
          status: "approved",
          bank_name: "Cash / Tunai",
          account_number: "-",
          account_name: "Diserahkan Langsung",
          receipt_url: finalUrl || null
        });

      if (error) throw error;
      
      await Promise.all([
        fetchWithdrawals(),
        fetchAllPaidPredictions()
      ]);
      alert("Pembayaran tunai berhasil dicatat!");
    } catch (err: any) {
      alert("Gagal mencatat pembayaran: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMatchPoolStatsLocal = (matchId: string, actualScoreA: number | null, actualScoreB: number | null) => {
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

    return { prizePerWinner };
  };

  const getUserBalanceStats = (profileId: string) => {
    const userPaidPreds = allPaidPredictions.filter(p => p.user_id === profileId);
    let totalWins = 0;
    let winnings = 0;

    userPaidPreds.forEach(pred => {
      const match = matches.find(m => m.id === pred.match_id);
      if (match && match.status === "completed" && match.score_a !== null && match.score_b !== null) {
        const isCorrect = pred.predicted_score_a === match.score_a && pred.predicted_score_b === match.score_b;
        if (isCorrect) {
          totalWins++;
          const stats = getMatchPoolStatsLocal(match.id, match.score_a, match.score_b);
          winnings += stats.prizePerWinner;
        }
      }
    });

    const totalWdApproved = withdrawals
      .filter(w => w.user_id === profileId && w.status === "approved")
      .reduce((sum, w) => sum + w.amount, 0);

    const totalWdPending = withdrawals
      .filter(w => w.user_id === profileId && w.status === "pending")
      .reduce((sum, w) => sum + w.amount, 0);

    const available = Math.max(0, winnings - totalWdApproved - totalWdPending);

    return {
      winnings,
      totalWdApproved,
      totalWdPending,
      available
    };
  };

  const triggerPrintList = (tx: Transaction) => {
    const listPreds = tx.predictions?.map(p => ({
      match_id: p.match_id,
      team_a: p.matches?.team_a || "",
      team_b: p.matches?.team_b || "",
      predicted_score_a: p.predicted_score_a,
      predicted_score_b: p.predicted_score_b,
      stage: p.matches?.stage || ""
    })) || [];
    
    setReceiptData({ transaction: tx, predictions: listPreds });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter(t => {
    const matchSearchVal = 
      t.profiles?.name.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.profiles?.phone_number.includes(txSearch) ||
      t.id.toLowerCase().includes(txSearch.toLowerCase());
    
    const matchStatus = txStatusFilter === "all" || t.payment_status === txStatusFilter;
    const matchMethod = txMethodFilter === "all" || t.payment_method === txMethodFilter;
    
    return matchSearchVal && matchStatus && matchMethod;
  });

  // Filtered Matches
  const filteredMatches = matches.filter((match) => {
    const query = matchSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      match.team_a.toLowerCase().includes(query) ||
      match.team_b.toLowerCase().includes(query) ||
      match.stage.toLowerCase().includes(query) ||
      match.stadium.toLowerCase().includes(query);

    const matchesStatus =
      matchStatusFilter === "all" || match.status === matchStatusFilter;

    const matchesStage =
      matchStageFilter === "all" || match.stage === matchStageFilter;

    return matchesSearch && matchesStatus && matchesStage;
  });

  // Summary Metrics
  const totalWarga = users.length;
  const totalPaidTransactions = transactions.filter(t => t.payment_status === "paid");
  const totalRevenue = totalPaidTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCashRev = totalPaidTransactions.filter(t => t.payment_method === "cash").reduce((sum, t) => sum + t.amount, 0);
  const totalQrisRev = totalPaidTransactions.filter(t => t.payment_method === "qris").reduce((sum, t) => sum + t.amount, 0);

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-xs text-muted-foreground">Mengecek otentikasi administrator...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <div className="space-y-8 py-6 print:hidden">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Total Warga Terdaftar</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{totalWarga}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Total Pendapatan Lunas</span>
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-black text-green-500">Rp {totalRevenue.toLocaleString("id-ID")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Total Kas Tunai (Admin)</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500">Rp {totalCashRev.toLocaleString("id-ID")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Total Kas QRIS (Online)</span>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-500">Rp {totalQrisRev.toLocaleString("id-ID")}</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Dashboard Administrator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola data nobar, pencatatan tunai, dan cetak struk tebakan.</p>
        </div>

        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-xl">
          <Button
            variant={activeTab === "transactions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("transactions")}
            className={`text-xs rounded-lg py-2 transition-all ${
              activeTab === "transactions"
                ? "bg-primary text-white shadow font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daftar Transaksi & Audit
          </Button>
          <Button
            variant={activeTab === "checkout" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("checkout")}
            className={`text-xs rounded-lg py-2 transition-all ${
              activeTab === "checkout"
                ? "bg-primary text-white shadow font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Input Tebakan Tunai
          </Button>
          <Button
            variant={activeTab === "matches" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("matches")}
            className={`text-xs rounded-lg py-2 transition-all ${
              activeTab === "matches"
                ? "bg-primary text-white shadow font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Kelola Hasil Laga
          </Button>
          <Button
            variant={activeTab === "nobar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("nobar")}
            className={`text-xs rounded-lg py-2 transition-all ${
              activeTab === "nobar"
                ? "bg-primary text-white shadow font-bold"
                : "text-primary hover:bg-primary/10"
            }`}
          >
            Kelola Jadwal Nobar
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("users")}
            className={`text-xs rounded-lg py-2 transition-all ${
              activeTab === "users"
                ? "bg-primary text-white shadow font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Daftar Warga
          </Button>
          <Button
            variant={activeTab === "withdrawals" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("withdrawals")}
            className={`text-xs rounded-lg py-2 transition-all ${
              activeTab === "withdrawals"
                ? "bg-primary text-white shadow font-bold"
                : "text-rose-400 hover:bg-rose-500/10"
            }`}
          >
            Pencairan Dana
          </Button>
        </div>
      </div>

      {/* Loading overlay if fetching */}
      {loading && (
        <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
          Sedang sinkronisasi data...
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {activeTab === "transactions" && (
            <TransactionsTab
              filteredTransactions={filteredTransactions}
              txSearch={txSearch}
              setTxSearch={setTxSearch}
              txStatusFilter={txStatusFilter}
              setTxStatusFilter={setTxStatusFilter}
              txMethodFilter={txMethodFilter}
              setTxMethodFilter={setTxMethodFilter}
              confirmCashTransaction={confirmCashTransaction}
              triggerPrintList={triggerPrintList}
            />
          )}

          {activeTab === "checkout" && (
            <OfflineCheckoutTab
              matches={matches}
              users={users}
              supabase={supabase}
              setLoading={setLoading}
              setReceiptData={setReceiptData}
              loadAllData={loadAllData}
            />
          )}

          {activeTab === "matches" && (
            <ManageMatchesTab
              filteredMatches={filteredMatches}
              matches={matches}
              matchSearch={matchSearch}
              setMatchSearch={setMatchSearch}
              matchStatusFilter={matchStatusFilter}
              setMatchStatusFilter={setMatchStatusFilter}
              matchStageFilter={matchStageFilter}
              setMatchStageFilter={setMatchStageFilter}
              syncMatchesFromApi={syncMatchesFromApi}
              syncingApi={syncingApi}
              editingMatchId={editingMatchId}
              setEditingMatchId={setEditingMatchId}
              editScoreA={editScoreA}
              setEditScoreA={setEditScoreA}
              editScoreB={editScoreB}
              setEditScoreB={setEditScoreB}
              editStatus={editStatus}
              setEditStatus={setEditStatus}
              saveMatchUpdate={saveMatchUpdate}
              startEditingMatch={startEditingMatch}
              getFlagUrl={getFlagUrl}
              getStadiumCountry={getStadiumCountry}
            />
          )}

          {activeTab === "nobar" && (
            <ManageNobarTab
              matches={matches}
              selectedNobarMatchId={selectedNobarMatchId}
              setSelectedNobarMatchId={setSelectedNobarMatchId}
              nobarLocation={nobarLocation}
              setNobarLocation={setNobarLocation}
              nobarPreMinutes={nobarPreMinutes}
              setNobarPreMinutes={setNobarPreMinutes}
              handleScheduleNobar={handleScheduleNobar}
              handleCancelNobar={handleCancelNobar}
            />
          )}

          {activeTab === "users" && (
            <UsersTab users={users} />
          )}

          {activeTab === "withdrawals" && (
            <WithdrawalsTab
              withdrawals={withdrawals}
              users={users}
              getUserBalanceStats={getUserBalanceStats}
              handleApproveWithdrawal={handleApproveWithdrawal}
              handleRejectWithdrawal={handleRejectWithdrawal}
              handleManualCashPayout={handleManualCashPayout}
              receiptUploading={receiptUploading}
            />
          )}
        </div>
      )}

      </div>

      {/* Embedded hidden printable receipt ticket */}
      {receiptData && (
        <ReceiptPrint 
          transaction={receiptData.transaction} 
          predictions={receiptData.predictions} 
        />
      )}
    </>
  );
}
