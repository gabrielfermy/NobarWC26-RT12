"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Trophy, Users, DollarSign, Calendar, Printer, Search, CheckCircle, 
  Clock, Plus, Trash2, Edit3, Shield, MapPin, Play, Check, CreditCard, Upload, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptPrint } from "@/components/ReceiptPrint";

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

interface Profile {
  id: string;
  name: string;
  phone_number: string;
  role: string;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  transaction_reference: string | null;
  created_at: string;
  profiles: {
    name: string;
    phone_number: string;
  };
  predictions?: any[];
}

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
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedWdId, setSelectedWdId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [allPaidPredictions, setAllPaidPredictions] = useState<any[]>([]);
  const [selectedWdUserId, setSelectedWdUserId] = useState<string | null>(null);
  const [manualWdAmount, setManualWdAmount] = useState("");
  const [wdTabSub, setWdTabSub] = useState<"requests" | "cashouts">("requests");
  
  // Filter & Search State
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [txMethodFilter, setTxMethodFilter] = useState("all");

  // Offline Checkout State
  const [waNumber, setWaNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [predScoreA, setPredScoreA] = useState("0");
  const [predScoreB, setPredScoreB] = useState("0");
  const [offlinePredictions, setOfflinePredictions] = useState<any[]>([]);

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
      // Load predictions for each transaction
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

  // WhatsApp Auto-Lookup
  useEffect(() => {
    if (waNumber.length >= 9) {
      const cleanPhone = waNumber.trim().replace(/[-+ ]/g, "");
      const matchProfile = users.find(u => u.phone_number === cleanPhone);
      if (matchProfile) {
        setFullName(matchProfile.name);
        setIsExistingUser(true);
      } else {
        setIsExistingUser(false);
      }
    } else {
      setIsExistingUser(false);
    }
  }, [waNumber, users]);

  // Handle Offline Prediction Basket
  const addOfflinePrediction = () => {
    if (!selectedMatchId) {
      alert("Pilih pertandingan terlebih dahulu.");
      return;
    }
    const match = matches.find(m => m.id === selectedMatchId);
    if (!match) return;

    // Hitung berapa tebakan untuk laga ini di basket saat ini
    const countForMatch = offlinePredictions.filter(p => p.matchId === selectedMatchId).length;
    if (countForMatch >= 5) {
      alert("Maksimal 5 tebakan per pertandingan untuk warga.");
      return;
    }

    setOfflinePredictions([
      ...offlinePredictions,
      {
        matchId: selectedMatchId,
        team_a: match.team_a,
        team_b: match.team_b,
        stage: match.stage,
        score_a: parseInt(predScoreA) || 0,
        score_b: parseInt(predScoreB) || 0
      }
    ]);
  };

  const removeOfflinePrediction = (idx: number) => {
    const updated = [...offlinePredictions];
    updated.splice(idx, 1);
    setOfflinePredictions(updated);
  };

  // Submit Offline Checkout
  const handleOfflineCheckout = async () => {
    if (!fullName.trim() || !waNumber.trim()) {
      alert("Nama dan Nomor WhatsApp wajib diisi.");
      return;
    }
    if (offlinePredictions.length === 0) {
      alert("Keranjang tebakan kosong.");
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = waNumber.trim().replace(/[-+ ]/g, "");
      let userId: string;

      // 1. Dapatkan / Buat Profil
      const matchProfile = users.find(u => u.phone_number === cleanPhone);
      if (matchProfile) {
        userId = matchProfile.id;
      } else {
        // Buat profil offline baru (auth_user_id null)
        const { data: newProfile, error: profileErr } = await supabase
          .from("profiles")
          .insert({
            name: fullName.trim(),
            phone_number: cleanPhone,
            role: "user"
          })
          .select()
          .single();
        if (profileErr) throw profileErr;
        userId = newProfile.id;
      }

      // 2. Buat Transaksi
      const amount = offlinePredictions.length * 10000;
      const { data: newTx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          amount,
          payment_status: "paid",
          payment_method: "cash",
          transaction_reference: `OFFLINE-BY-ADMIN`
        })
        .select()
        .single();
      if (txErr) throw txErr;

      // 3. Masukkan Prediksi
      const predictionsPayload = offlinePredictions.map(p => ({
        user_id: userId,
        match_id: p.matchId,
        predicted_score_a: p.score_a,
        predicted_score_b: p.score_b,
        transaction_id: newTx.id
      }));

      const { error: predErr } = await supabase
        .from("predictions")
        .insert(predictionsPayload);
      if (predErr) throw predErr;

      alert("Transaksi tunai sukses terdaftar!");
      
      // Load print receipt
      const receiptTx = {
        id: newTx.id,
        amount,
        payment_status: "paid",
        payment_method: "cash",
        created_at: newTx.created_at,
        profiles: { name: fullName, phone_number: cleanPhone }
      };
      const receiptPreds = offlinePredictions.map(p => ({
        match_id: p.matchId,
        team_a: p.team_a,
        team_b: p.team_b,
        predicted_score_a: p.score_a,
        predicted_score_b: p.score_b,
        stage: p.stage
      }));

      // Set & triggers print
      setReceiptData({ transaction: receiptTx, predictions: receiptPreds });
      setTimeout(() => {
        window.print();
      }, 500);

      // Reset Form
      setWaNumber("");
      setFullName("");
      setOfflinePredictions([]);
      loadAllData();

    } catch (err: any) {
      console.error("Offline checkout failed:", err);
      alert(err.message || "Gagal memproses transaksi offline.");
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
      
      setSelectedNobarMatchId("");
      setNobarLocation("");
      setNobarPreMinutes("30");
      await fetchMatches();
      alert("Jadwal nobar berhasil disimpan!");
    } catch (err: any) {
      alert("Gagal menyimpan jadwal nobar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNobar = async (matchId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan nobar untuk pertandingan ini?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("matches")
        .update({
          is_nobar: false,
          nobar_location: null,
          nobar_pre_minutes: 30
        })
        .eq("id", matchId);

      if (error) throw error;
      await fetchMatches();
      alert("Nobar berhasil dibatalkan.");
    } catch (err: any) {
      alert("Gagal membatalkan nobar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirm cash transaction
  const confirmCashTransaction = async (txId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ payment_status: "paid" })
        .eq("id", txId);
      if (error) throw error;
      await fetchTransactions();
      alert("Status transaksi berhasil diubah menjadi PAID.");
    } catch (err: any) {
      alert(err.message || "Gagal konfirmasi transaksi.");
    } finally {
      setLoading(false);
    }
  };

  // Reject withdrawal
  const handleRejectWithdrawal = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menolak penarikan dana ini?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
      await fetchWithdrawals();
      alert("Permohonan penarikan dana ditolak.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve withdrawal with transfer proof
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
        // Fallback: convert file to Base64 and save directly to DB
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
      
      setSelectedWdId(null);
      setReceiptFile(null);
      await fetchWithdrawals();
      alert("Penarikan dana disetujui & bukti transfer berhasil diunggah!");
    } catch (err: any) {
      alert("Gagal menyetujui penarikan: " + err.message);
    } finally {
      setReceiptUploading(false);
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

      // Insert an approved manual withdrawal
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
      
      setSelectedWdUserId(null);
      setManualWdAmount("");
      setReceiptFile(null);
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

  // Print Receipt directly from list
  const triggerPrintList = (tx: Transaction) => {
    const listPreds = tx.predictions?.map(p => ({
      match_id: p.match_id,
      team_a: p.matches.team_a,
      team_b: p.matches.team_b,
      predicted_score_a: p.predicted_score_a,
      predicted_score_b: p.predicted_score_b,
      stage: p.matches.stage
    })) || [];
    
    setReceiptData({ transaction: tx, predictions: listPreds });
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter(t => {
    const matchSearch = 
      t.profiles?.name.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.profiles?.phone_number.includes(txSearch) ||
      t.id.toLowerCase().includes(txSearch.toLowerCase());
    
    const matchStatus = txStatusFilter === "all" || t.payment_status === txStatusFilter;
    const matchMethod = txMethodFilter === "all" || t.payment_method === txMethodFilter;
    
    return matchSearch && matchStatus && matchMethod;
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
    <div className="space-y-8 py-6 print:hidden">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Total Warga Terdaftar</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black">{totalWarga}</p>
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
          <h1 className="text-2xl font-black">Dashboard Administrator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola data nobar, pencatatan tunai, dan cetak struk tebakan.</p>
        </div>

        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === "transactions" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("transactions")}
            className="text-xs"
          >
            Daftar Transaksi & Audit
          </Button>
          <Button
            variant={activeTab === "checkout" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("checkout")}
            className="text-xs"
          >
            Input Tebakan Tunai
          </Button>
          <Button
            variant={activeTab === "matches" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("matches")}
            className="text-xs"
          >
            Kelola Hasil Laga
          </Button>
          <Button
            variant={activeTab === "nobar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("nobar")}
            className="text-xs text-primary hover:text-primary-foreground"
          >
            Kelola Jadwal Nobar
          </Button>
          <Button
            variant={activeTab === "users" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("users")}
            className="text-xs"
          >
            Daftar Warga
          </Button>
          <Button
            variant={activeTab === "withdrawals" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("withdrawals")}
            className="text-xs text-rose-400 hover:text-rose-300"
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
          
          {/* TAB 1: DAFTAR TRANSAKSI & AUDIT */}
          {activeTab === "transactions" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Cari transaksi berdasarkan nama, No. WA, atau TXID..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-card border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>
                {/* Filters */}
                <div className="flex gap-2">
                  <select
                    value={txStatusFilter}
                    onChange={(e) => setTxStatusFilter(e.target.value)}
                    className="bg-card border border-input text-xs rounded-lg px-3 py-2"
                  >
                    <option value="all">Semua Status</option>
                    <option value="paid">Paid (Lunas)</option>
                    <option value="pending">Pending</option>
                  </select>

                  <select
                    value={txMethodFilter}
                    onChange={(e) => setTxMethodFilter(e.target.value)}
                    className="bg-card border border-input text-xs rounded-lg px-3 py-2"
                  >
                    <option value="all">Semua Metode</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="qris">QRIS (Online)</option>
                  </select>
                </div>
              </div>

              {/* Transaction Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                        <th className="px-4 py-3">Tanggal / ID</th>
                        <th className="px-4 py-3">Nama & WhatsApp</th>
                        <th className="px-4 py-3">Jumlah Tebakan</th>
                        <th className="px-4 py-3">Metode & Ref</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-muted-foreground">
                            Transaksi tidak ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                            {/* Date & ID */}
                            <td className="px-4 py-3 space-y-0.5">
                              <span className="font-semibold text-foreground">
                                {new Date(tx.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span className="block text-[9px] text-muted-foreground uppercase font-mono">
                                #{tx.id.substring(0, 8)}
                              </span>
                            </td>
                            {/* Name & Phone */}
                            <td className="px-4 py-3">
                              <div className="font-bold text-foreground">{tx.profiles?.name || "-"}</div>
                              <div className="text-muted-foreground text-[10px]">{tx.profiles?.phone_number || "-"}</div>
                            </td>
                            {/* Predictions count & preview */}
                            <td className="px-4 py-3">
                              <span className="font-semibold">{tx.predictions?.length || 0} Tebakan</span>
                              <div className="text-[9px] text-muted-foreground max-w-[200px] truncate">
                                {tx.predictions?.map(p => `${p.matches.team_a} vs ${p.matches.team_b} (${p.predicted_score_a}-${p.predicted_score_b})`).join(", ")}
                              </div>
                            </td>
                            {/* Method */}
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${tx.payment_method === "cash" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"}`}>
                                {tx.payment_method}
                              </span>
                              <span className="block text-[9px] text-muted-foreground truncate max-w-[120px]">
                                {tx.transaction_reference || "-"}
                              </span>
                            </td>
                            {/* Status */}
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${tx.payment_status === "paid" ? "bg-green-500/15 text-green-500" : "bg-yellow-500/15 text-yellow-500"}`}>
                                {tx.payment_status === "paid" ? (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Lunas</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3" />
                                    <span>Pending</span>
                                  </>
                                )}
                              </span>
                            </td>
                            {/* Amount */}
                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                              Rp {tx.amount.toLocaleString("id-ID")}
                            </td>
                            {/* Actions */}
                            <td className="px-4 py-3 text-center space-x-1">
                              {tx.payment_status === "pending" && tx.payment_method === "cash" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => confirmCashTransaction(tx.id)}
                                  className="h-7 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/25 border-green-500/20"
                                >
                                  Lunas
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => triggerPrintList(tx)}
                                className="h-7 text-[10px] space-x-1"
                              >
                                <Printer className="h-3 w-3" />
                                <span>Struk</span>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INPUT TEBAKAN TUNAI (OFFLINE CHECKOUT) */}
          {activeTab === "checkout" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Input Data Warga & Tambah Tebakan */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
                  <Plus className="h-5 w-5 text-primary" />
                  <span>Form Input Prediksi Tunai Offline</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Nomor WhatsApp Warga
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0812xxxxxxxx"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex justify-between">
                      <span>Nama Lengkap Warga</span>
                      {isExistingUser && (
                        <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-1.5 rounded uppercase">
                          Warga Terdaftar
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isExistingUser}
                      className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="border-t border-border/50 pt-6 space-y-4">
                  <h4 className="font-bold text-sm">Pilih & Masukkan Skor Tebakan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    
                    {/* Pilih Pertandingan */}
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                        Pertandingan
                      </label>
                      <select
                        value={selectedMatchId}
                        onChange={(e) => setSelectedMatchId(e.target.value)}
                        className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Pilih Pertandingan --</option>
                        {matches
                          .filter(m => m.status === "scheduled")
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              [{m.stage}] {m.team_a} vs {m.team_b}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Input Skor */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={predScoreA}
                          onChange={(e) => setPredScoreA(e.target.value)}
                          className="w-full text-center py-1.5 border border-input bg-background rounded text-sm font-bold"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-bold">-</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={predScoreB}
                          onChange={(e) => setPredScoreB(e.target.value)}
                          className="w-full text-center py-1.5 border border-input bg-background rounded text-sm font-bold"
                        />
                      </div>
                      <Button size="sm" onClick={addOfflinePrediction} className="shrink-0 h-9">
                        Tambah
                      </Button>
                    </div>

                  </div>
                </div>
              </div>

              {/* Keranjang Checkout Tunai */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
                  <span>Keranjang Tebakan Tunai</span>
                </h3>

                {offlinePredictions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    Keranjang kosong. Tambahkan prediksi di sebelah kiri.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {offlinePredictions.map((pred, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-background/50 p-2.5 rounded-lg border border-border/30 text-xs">
                          <div>
                            <div className="font-bold">{pred.team_a} vs {pred.team_b}</div>
                            <div className="text-muted-foreground text-[10px]">{pred.stage}</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm">
                              {pred.score_a} - {pred.score_b}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOfflinePrediction(idx)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Nama Warga:</span>
                        <span className="font-bold text-foreground">{fullName || "-"}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Total Tebakan:</span>
                        <span>{offlinePredictions.length} Item</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-border/40">
                        <span>Total Tunai Diterima:</span>
                        <span className="text-primary text-base">Rp {(offlinePredictions.length * 10000).toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <Button onClick={handleOfflineCheckout} className="w-full mt-2">
                      Bayar Tunai & Cetak Struk
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KELOLA HASIL LAGA (SKOR PERTANDINGAN) */}
          {activeTab === "matches" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <h3 className="text-lg font-bold flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Kelola Skor Akhir & Status Pertandingan</span>
                </h3>
                <Button 
                  size="sm" 
                  onClick={syncMatchesFromApi} 
                  disabled={syncingApi}
                  className="text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/35 transition-all"
                >
                  {syncingApi ? "Menyinkronkan..." : "Tarik Hasil Terbaru dari API"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((match) => {
                  const isEditing = editingMatchId === match.id;
                  const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).replace(/\./g, ':');

                  const flagA = getFlagUrl(match.team_a);
                  const flagB = getFlagUrl(match.team_b);
                  const stadiumCountry = getStadiumCountry(match.stadium);
                  const stadiumFlag = getFlagUrl(stadiumCountry.name);

                  return (
                    <div 
                      key={match.id} 
                      className={`rounded-xl border p-4 space-y-3 shadow-sm transition-all ${
                        isEditing 
                          ? "border-primary bg-primary/5 shadow-primary/5" 
                          : "border-border bg-card/50 hover:border-primary/20"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-secondary/20 px-2 py-0.5 rounded text-secondary font-medium uppercase">
                          {match.stage}
                        </span>
                        <span className="text-muted-foreground">{formattedDate}</span>
                      </div>

                      {/* Line Up Info & Editing Inputs */}
                      <div className="flex items-center justify-between py-1 text-xs">
                        <div className="flex items-center space-x-2 max-w-[38%] truncate">
                          {flagA ? (
                            <img src={flagA} alt="" className="w-6 h-4 object-cover rounded border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-semibold truncate">{match.team_a}</span>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={editScoreA}
                              onChange={(e) => setEditScoreA(e.target.value)}
                              className="w-10 text-center py-1 border border-input rounded bg-background font-bold text-sm"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                              type="number"
                              value={editScoreB}
                              onChange={(e) => setEditScoreB(e.target.value)}
                              className="w-10 text-center py-1 border border-input rounded bg-background font-bold text-sm"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {match.status === "scheduled" ? (
                              <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">VS</span>
                            ) : (
                              <span className="font-mono text-sm font-black bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20 text-primary">
                                {match.score_a} - {match.score_b}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-end space-x-2 max-w-[38%] truncate text-right">
                          <span className="font-semibold truncate">{match.team_b}</span>
                          {flagB ? (
                            <img src={flagB} alt="" className="w-6 h-4 object-cover rounded border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Stadium */}
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-2.5">
                        <div className="flex items-center max-w-[75%]">
                          <MapPin className="h-3 w-3 mr-1 text-primary shrink-0" />
                          <span className="truncate mr-1.5">{match.stadium}</span>
                          {stadiumCountry && (
                            <span className="inline-flex items-center space-x-1 bg-muted px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0">
                              {stadiumFlag && (
                                <img src={stadiumFlag} alt="" className="w-4.5 h-3 object-cover rounded-sm border border-border/20" />
                              )}
                              <span>{stadiumCountry.name}</span>
                            </span>
                          )}
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          {match.is_nobar && (
                            <span className="bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                              NOBAR
                            </span>
                          )}
                          <span className="capitalize font-bold text-[9px]">
                            {match.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>



                      {/* Edit Actions */}
                      <div className="flex justify-end pt-1 border-t border-border/30">
                        {isEditing ? (
                          <div className="flex flex-col md:flex-row items-center gap-2 w-full justify-between">
                            <div className="flex items-center space-x-2">
                              <label className="text-[9px] text-muted-foreground uppercase font-bold">Status:</label>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="bg-background border border-input text-[10px] rounded px-1.5 py-1 text-foreground"
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="ongoing">Ongoing (Live)</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            <div className="space-x-1 self-end">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setEditingMatchId(null)}
                                className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                              >
                                Batal
                              </Button>
                              <Button
                                size="xs"
                                onClick={() => saveMatchUpdate(match.id)}
                                className="h-6 text-[10px]"
                              >
                                Simpan
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingMatch(match)}
                            className="h-7 text-[10px] text-primary hover:bg-primary/10"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Ubah Hasil
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3.5: KELOLA JADWAL NOBAR */}
          {activeTab === "nobar" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Tambah Jadwal Nobar */}
              <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Jadwalkan Nobar Baru</span>
                </h3>

                <div className="space-y-4">
                  {/* Pilih Pertandingan */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Pertandingan (Hanya Babak Gugur)
                    </label>
                    <select
                      value={selectedNobarMatchId}
                      onChange={(e) => setSelectedNobarMatchId(e.target.value)}
                      className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="">-- Pilih Pertandingan --</option>
                      {matches
                        .filter(m => !m.stage.includes("Fase Grup"))
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            [{m.stage}] {m.team_a} vs {m.team_b}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Lokasi Nobar */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Lokasi Nobar
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Balai RT 12 / Pos Ronda"
                      value={nobarLocation}
                      onChange={(e) => setNobarLocation(e.target.value)}
                      className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-xs placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>

                  {/* Waktu Kumpul Pre-Match (Menit) */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                      Waktu Kumpul Pre-Match (Menit Sebelum Kick-off)
                    </label>
                    <select
                      value={nobarPreMinutes}
                      onChange={(e) => setNobarPreMinutes(e.target.value)}
                      className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="15">15 Menit Sebelum Laga</option>
                      <option value="30">30 Menit Sebelum Laga</option>
                      <option value="45">45 Menit Sebelum Laga</option>
                      <option value="60">60 Menit Sebelum Laga</option>
                      <option value="90">90 Menit Sebelum Laga</option>
                      <option value="120">120 Menit Sebelum Laga</option>
                    </select>
                  </div>

                  <Button onClick={handleScheduleNobar} className="w-full">
                    Simpan Jadwal Nobar
                  </Button>
                </div>
              </div>

              {/* Daftar Active Nobar Schedule */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
                  <span>Daftar Jadwal Nobar Aktif</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                        <th className="px-4 py-3">Pertandingan</th>
                        <th className="px-4 py-3">Kick-off</th>
                        <th className="px-4 py-3 text-primary font-bold">Mulai Kumpul (Pre-Match)</th>
                        <th className="px-4 py-3">Lokasi</th>
                        <th className="px-4 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.filter(m => m.is_nobar).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-muted-foreground">
                            Belum ada pertandingan yang dijadwalkan Nobar.
                          </td>
                        </tr>
                      ) : (
                        matches
                          .filter(m => m.is_nobar)
                          .map((m) => {
                            const kickOffStr = new Date(m.match_time).toLocaleString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).replace(/\./g, ':');

                            const preMins = m.nobar_pre_minutes || 30;
                            const gatheringTime = new Date(new Date(m.match_time).getTime() - preMins * 60000);
                            const gatheringStr = gatheringTime.toLocaleString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).replace(/\./g, ':');

                            return (
                              <tr key={m.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-foreground">{m.team_a} vs {m.team_b}</div>
                                  <div className="text-muted-foreground text-[10px]">{m.stage}</div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {kickOffStr}
                                </td>
                                <td className="px-4 py-3 text-primary font-black font-mono">
                                  {gatheringStr}
                                  <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">
                                    ({preMins} menit sebelum kickoff)
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-foreground">
                                  {m.nobar_location}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelNobar(m.id)}
                                    className="h-7 text-[10px] text-destructive hover:bg-destructive/10 border-destructive/20"
                                  >
                                    Batalkan Nobar
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DAFTAR WARGA */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
                <Users className="h-5 w-5 text-primary" />
                <span>Daftar Warga Terdaftar</span>
              </h3>

              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Nomor WhatsApp</th>
                      <th className="px-4 py-3">Tipe Akun (Role)</th>
                      <th className="px-4 py-3">Terdaftar Sejak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">{user.name}</td>
                        <td className="px-4 py-3">{user.phone_number}</td>
                        <td className="px-4 py-3 capitalize">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${user.role === "admin" ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: KELOLA PENARIKAN DANA */}
          {activeTab === "withdrawals" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
                <h3 className="text-lg font-bold flex items-center space-x-2 text-rose-400">
                  <CreditCard className="h-5 w-5 text-rose-400" />
                  <span>Persetujuan & Kelola Kemenangan Warga</span>
                </h3>

                {/* Sub-tab selection */}
                <div className="flex bg-muted p-0.5 rounded-lg border border-border shrink-0">
                  <Button
                    variant={wdTabSub === "requests" ? "secondary" : "ghost"}
                    size="xs"
                    onClick={() => setWdTabSub("requests")}
                    className="text-xs"
                  >
                    Pengajuan Online
                  </Button>
                  <Button
                    variant={wdTabSub === "cashouts" ? "secondary" : "ghost"}
                    size="xs"
                    onClick={() => setWdTabSub("cashouts")}
                    className="text-xs"
                  >
                    Antrean Bayar Tunai (Booth)
                  </Button>
                </div>
              </div>

              {/* VIEW 1: ONLINE REQUESTS */}
              {wdTabSub === "requests" && (
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                          <th className="px-4 py-3">Tanggal</th>
                          <th className="px-4 py-3">Nama & WhatsApp</th>
                          <th className="px-4 py-3">Tujuan Bank/Wallet</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Jumlah</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-muted-foreground">
                              Belum ada pengajuan penarikan dana online.
                            </td>
                          </tr>
                        ) : (
                          withdrawals.map((wd) => (
                            <tr key={wd.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                              {/* Date */}
                              <td className="px-4 py-3 text-muted-foreground">
                                {new Date(wd.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              {/* User Profile */}
                              <td className="px-4 py-3">
                                <div className="font-bold text-foreground">{wd.profiles?.name || "-"}</div>
                                <div className="text-muted-foreground text-[10px]">{wd.profiles?.phone_number || "-"}</div>
                              </td>
                              {/* Bank Details */}
                              <td className="px-4 py-3">
                                <div className="font-semibold text-foreground">{wd.bank_name}</div>
                                <div className="text-muted-foreground text-[10px]">
                                  Rec: {wd.account_number} ({wd.account_name})
                                </div>
                              </td>
                              {/* Status */}
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  wd.status === "approved" ? "bg-green-500/15 text-green-500" :
                                  wd.status === "rejected" ? "bg-red-500/15 text-red-500" :
                                  "bg-yellow-500/15 text-yellow-500"
                                }`}>
                                  {wd.status}
                                </span>
                              </td>
                              {/* Amount */}
                              <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                Rp {wd.amount.toLocaleString("id-ID")}
                              </td>
                              {/* Actions */}
                              <td className="px-4 py-3 text-center space-x-1">
                                {wd.status === "pending" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedWdId(wd.id)}
                                      className="h-7 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/25 border-green-500/20"
                                    >
                                      Setujui
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRejectWithdrawal(wd.id)}
                                      className="h-7 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/25 border-red-500/20"
                                    >
                                      Tolak
                                    </Button>
                                  </>
                                )}
                                {wd.status === "approved" && wd.receipt_url && (
                                  <a 
                                    href={wd.receipt_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1 bg-muted hover:bg-muted/80 text-foreground border border-border px-2 py-1 rounded text-[10px] font-semibold"
                                  >
                                    <Printer className="h-3 w-3" />
                                    <span>Lihat Bukti</span>
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: MANUAL CASH PAYOUTS QUEUE */}
              {wdTabSub === "cashouts" && (
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                          <th className="px-4 py-3">Nama Warga</th>
                          <th className="px-4 py-3">No. WhatsApp</th>
                          <th className="px-4 py-3 text-center">Akun Online?</th>
                          <th className="px-4 py-3 text-right">Total Kemenangan</th>
                          <th className="px-4 py-3 text-right">Telah Dibayar</th>
                          <th className="px-4 py-3 text-right text-primary">Sisa Saldo</th>
                          <th className="px-4 py-3 text-center">Aksi Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .map((u) => {
                            const balance = getUserBalanceStats(u.id);
                            return { user: u, balance };
                          })
                          .filter((item) => item.balance.available > 0)
                          .length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                Tidak ada warga (online/offline) dengan sisa saldo kemenangan saat ini.
                              </td>
                            </tr>
                          ) : (
                            users
                              .map((u) => {
                                const balance = getUserBalanceStats(u.id);
                                return { user: u, balance };
                              })
                              .filter((item) => item.balance.available > 0)
                              .map((item) => (
                                <tr key={item.user.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                                  <td className="px-4 py-3 font-bold text-foreground">
                                    {item.user.name}
                                  </td>
                                  <td className="px-4 py-3">
                                    {item.user.phone_number}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {item.user.auth_user_id ? (
                                      <span className="bg-blue-500/10 text-blue-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Ya</span>
                                    ) : (
                                      <span className="bg-zinc-500/10 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Tidak (Offline)</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono">
                                    Rp {item.balance.winnings.toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                    Rp {item.balance.totalWdApproved.toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                                    Rp {item.balance.available.toLocaleString("id-ID")}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Button
                                      size="sm"
                                      className="h-7 text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                                      onClick={() => {
                                        setSelectedWdUserId(item.user.id);
                                        setManualWdAmount(String(item.balance.available));
                                      }}
                                    >
                                      Bayar Cash
                                    </Button>
                                  </td>
                                </tr>
                              ))
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Manual Cash Payout Dialog */}
              {selectedWdUserId && (() => {
                const userProfile = users.find(u => u.id === selectedWdUserId);
                const stats = getUserBalanceStats(selectedWdUserId);
                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 space-y-4 shadow-2xl relative">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <h4 className="text-sm font-bold text-foreground">Catat Payout Tunai Offline</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedWdUserId(null); setManualWdAmount(""); setReceiptFile(null); }}
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3.5">
                        <div className="text-xs space-y-1 bg-muted p-2.5 rounded-lg border border-border/40">
                          <div>Penerima: <strong>{userProfile?.name}</strong> (+{userProfile?.phone_number})</div>
                          <div>Maks. Payout: <strong className="text-primary">Rp {stats.available.toLocaleString("id-ID")}</strong></div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                            Jumlah Pembayaran Tunai (Rp)
                          </label>
                          <input
                            type="number"
                            required
                            max={stats.available}
                            value={manualWdAmount}
                            onChange={(e) => setManualWdAmount(e.target.value)}
                            className="block w-full px-3 py-1.5 bg-background border border-input rounded-lg text-xs font-bold text-foreground"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                            Foto Kwitansi / Penyerahan (Opsional)
                          </label>
                          <div className="border border-dashed border-border rounded-lg p-4 text-center space-y-1 relative">
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-[11px] font-semibold">
                              {receiptFile ? receiptFile.name : "Unggah foto tanda tangan kwitansi / penyerahan uang"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2 border-t border-border/30 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs" 
                          onClick={() => { setSelectedWdUserId(null); setManualWdAmount(""); setReceiptFile(null); }}
                        >
                          Batal
                        </Button>
                        <Button 
                          size="sm" 
                          className="text-xs font-bold"
                          onClick={() => handleManualCashPayout(selectedWdUserId, parseInt(manualWdAmount) || 0, receiptFile)}
                          disabled={!manualWdAmount || parseInt(manualWdAmount) <= 0 || parseInt(manualWdAmount) > stats.available}
                        >
                          Konfirmasi Bayar Cash
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Upload Proof Dialog */}
              {selectedWdId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 space-y-4 shadow-2xl relative">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <h4 className="text-sm font-bold text-foreground">Unggah Bukti Transfer Penarikan</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedWdId(null); setReceiptFile(null); }}
                        className="h-7 w-7 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3.5">
                      <p className="text-xs text-muted-foreground">
                        Pencairan dana akan ditandai sebagai **APPROVED** setelah Anda mengunggah gambar/foto bukti transfer.
                      </p>

                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-2 relative">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground/60" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="text-xs font-semibold text-foreground">
                          {receiptFile ? receiptFile.name : "Klik atau seret file gambar bukti transfer ke sini"}
                        </div>
                        <p className="text-[10px] text-muted-foreground">Mendukung file PNG, JPG, JPEG maks 2MB</p>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-border/30 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs" 
                        onClick={() => { setSelectedWdId(null); setReceiptFile(null); }}
                        disabled={receiptUploading}
                      >
                        Batal
                      </Button>
                      <Button 
                        size="sm" 
                        className="text-xs font-bold"
                        onClick={() => receiptFile && handleApproveWithdrawal(selectedWdId, receiptFile)}
                        disabled={!receiptFile || receiptUploading}
                      >
                        {receiptUploading ? "Mengunggah..." : "Setujui & Selesaikan"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Embedded hidden printable receipt ticket */}
      {receiptData && (
        <ReceiptPrint 
          transaction={receiptData.transaction} 
          predictions={receiptData.predictions} 
        />
      )}

    </div>
  );
}
