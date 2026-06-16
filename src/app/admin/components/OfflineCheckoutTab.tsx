"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match, Profile } from "../types";

interface OfflineCheckoutTabProps {
  matches: Match[];
  users: Profile[];
  supabase: any;
  setLoading: (val: boolean) => void;
  setReceiptData: (val: { transaction: any; predictions: any[] } | null) => void;
  loadAllData: () => Promise<void>;
  getFlagUrl?: (teamName: string) => string | null;
}

export default function OfflineCheckoutTab({
  matches,
  users,
  supabase,
  setLoading,
  setReceiptData,
  loadAllData,
  getFlagUrl,
}: OfflineCheckoutTabProps) {
  const [waNumber, setWaNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [predScoreA, setPredScoreA] = useState("0");
  const [predScoreB, setPredScoreB] = useState("0");
  const [offlinePredictions, setOfflinePredictions] = useState<any[]>([]);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  // WhatsApp Auto-Lookup
  useEffect(() => {
    if (waNumber.length >= 9) {
      const cleanPhone = waNumber.trim().replace(/[-+ ]/g, "");
      const matchProfile = users.find((u) => u.phone_number === cleanPhone);
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
    const match = matches.find((m) => m.id === selectedMatchId);
    if (!match) return;

    const parsedScoreA = Math.max(0, Math.min(10, parseInt(predScoreA) || 0));
    const parsedScoreB = Math.max(0, Math.min(10, parseInt(predScoreB) || 0));

    // Cek duplikasi skor di dalam keranjang saat ini
    const isDuplicateBasket = offlinePredictions.some(
      (p) =>
        p.matchId === selectedMatchId &&
        p.score_a === parsedScoreA &&
        p.score_b === parsedScoreB
    );
    if (isDuplicateBasket) {
      alert(
        `Gagal: Tebakan skor ${parsedScoreA} - ${parsedScoreB} untuk laga ini sudah ada di dalam keranjang.`
      );
      return;
    }

    // Hitung berapa tebakan untuk laga ini di basket saat ini
    const countForMatch = offlinePredictions.filter((p) => p.matchId === selectedMatchId).length;
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
        score_a: parsedScoreA,
        score_b: parsedScoreB,
      },
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
      const matchProfile = users.find((u) => u.phone_number === cleanPhone);
      if (matchProfile) {
        userId = matchProfile.id;
      } else {
        // Buat profil offline baru (auth_user_id null)
        const { data: newProfile, error: profileErr } = await supabase
          .from("profiles")
          .insert({
            name: fullName.trim(),
            phone_number: cleanPhone,
            role: "user",
          })
          .select()
          .single();
        if (profileErr) throw profileErr;
        userId = newProfile.id;
      }

      // 1.5 Cek duplikasi tebakan dengan database untuk warga ini
      for (const p of offlinePredictions) {
        const { data: existingPreds, error: checkErr } = await supabase
          .from("predictions")
          .select(`
            id,
            predicted_score_a,
            predicted_score_b,
            transactions (
              payment_status
            )
          `)
          .eq("user_id", userId)
          .eq("match_id", p.matchId);

        if (!checkErr && existingPreds) {
          const isDuplicateDb = existingPreds.some(
            (dbPred: any) =>
              dbPred.predicted_score_a === p.score_a &&
              dbPred.predicted_score_b === p.score_b &&
              dbPred.transactions?.payment_status !== "failed"
          );
          if (isDuplicateDb) {
            alert(
              `Gagal: Warga "${fullName}" sudah pernah mendaftarkan tebakan skor ${p.score_a} - ${p.score_b} untuk laga ${p.team_a} vs ${p.team_b} sebelumnya.`
            );
            setLoading(false);
            return;
          }
        }
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
          transaction_reference: `OFFLINE-BY-ADMIN`,
        })
        .select()
        .single();
      if (txErr) throw txErr;

      // 3. Masukkan Prediksi
      const predictionsPayload = offlinePredictions.map((p) => ({
        user_id: userId,
        match_id: p.matchId,
        predicted_score_a: p.score_a,
        predicted_score_b: p.score_b,
        transaction_id: newTx.id,
      }));

      const { error: predErr } = await supabase.from("predictions").insert(predictionsPayload);
      if (predErr) throw predErr;

      alert("Transaksi tunai sukses terdaftar!");

      // Load print receipt
      const receiptTx = {
        id: newTx.id,
        amount,
        payment_status: "paid",
        payment_method: "cash",
        created_at: newTx.created_at,
        profiles: { name: fullName, phone_number: cleanPhone },
      };
      const receiptPreds = offlinePredictions.map((p) => ({
        match_id: p.matchId,
        team_a: p.team_a,
        team_b: p.team_b,
        predicted_score_a: p.score_a,
        predicted_score_b: p.score_b,
        stage: p.stage,
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
      await loadAllData();
    } catch (err: any) {
      console.error("Offline checkout failed:", err);
      alert(err.message || "Gagal memproses transaksi offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <div className="space-y-4">
            {/* Pilih Pertandingan */}
            <div>
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
                  .filter((m) => m.status === "scheduled")
                  .map((m) => {
                    const formattedDate = new Date(m.match_time)
                      .toLocaleString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      .replace(/\./g, ":");
                    return (
                      <option key={m.id} value={m.id}>
                        [{m.stage}] {m.team_a} vs {m.team_b} ({formattedDate} WIB)
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Input Skor Visual dengan Bendera & Nama Tim */}
            {selectedMatch && (
              <div className="bg-background/40 border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Team A Info */}
                <div className="flex items-center space-x-3 w-full sm:w-[40%] justify-end text-right">
                  <span className="font-bold text-sm text-foreground">{selectedMatch.team_a}</span>
                  {getFlagUrl && getFlagUrl(selectedMatch.team_a) ? (
                    <img
                      src={getFlagUrl(selectedMatch.team_a)!}
                      alt=""
                      className="w-8 h-5 object-cover rounded shadow border border-border/10 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-5 bg-muted rounded border border-border flex items-center justify-center shrink-0" />
                  )}
                </div>

                {/* Score Input Fields */}
                <div className="flex items-center space-x-2 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={predScoreA}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                      setPredScoreA(val.toString());
                    }}
                    className="w-12 h-9 text-center bg-background border border-input rounded-lg text-sm font-black text-foreground focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-muted-foreground font-black">-</span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={predScoreB}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                      setPredScoreB(val.toString());
                    }}
                    className="w-12 h-9 text-center bg-background border border-input rounded-lg text-sm font-black text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Team B Info */}
                <div className="flex items-center space-x-3 w-full sm:w-[40%] justify-start text-left">
                  {getFlagUrl && getFlagUrl(selectedMatch.team_b) ? (
                    <img
                      src={getFlagUrl(selectedMatch.team_b)!}
                      alt=""
                      className="w-8 h-5 object-cover rounded shadow border border-border/10 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-5 bg-muted rounded border border-border flex items-center justify-center shrink-0" />
                  )}
                  <span className="font-bold text-sm text-foreground">{selectedMatch.team_b}</span>
                </div>

                {/* Add to Cart button */}
                <div className="w-full sm:w-auto flex justify-center pt-2 sm:pt-0">
                  <Button onClick={addOfflinePrediction} className="w-full sm:w-auto font-bold h-9">
                    Tambah
                  </Button>
                </div>
              </div>
            )}
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
              {offlinePredictions.map((pred, idx) => {
                const flagA = getFlagUrl ? getFlagUrl(pred.team_a) : null;
                const flagB = getFlagUrl ? getFlagUrl(pred.team_b) : null;

                return (
                  <div
                    key={idx}
                    className="flex flex-col bg-background/50 p-2.5 rounded-lg border border-border/30 text-xs gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      {/* Team A & Flag */}
                      <div className="flex items-center space-x-1.5 w-[38%] justify-end text-right">
                        <span className="font-bold truncate text-[10px] sm:text-xs text-foreground">
                          {pred.team_a}
                        </span>
                        {flagA ? (
                          <img src={flagA} alt="" className="w-5 h-3.5 object-cover rounded shadow-xs border border-border/10 shrink-0" />
                        ) : (
                          <div className="w-5 h-3.5 bg-muted rounded border border-border shrink-0" />
                        )}
                      </div>

                      {/* Scores & VS */}
                      <div className="flex items-center space-x-1 justify-center shrink-0">
                        <span className="font-mono font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">
                          {pred.score_a}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-semibold">vs</span>
                        <span className="font-mono font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">
                          {pred.score_b}
                        </span>
                      </div>

                      {/* Team B & Flag */}
                      <div className="flex items-center space-x-1.5 w-[38%] justify-start text-left">
                        {flagB ? (
                          <img src={flagB} alt="" className="w-5 h-3.5 object-cover rounded shadow-xs border border-border/10 shrink-0" />
                        ) : (
                          <div className="w-5 h-3.5 bg-muted rounded border border-border shrink-0" />
                        )}
                        <span className="font-bold truncate text-[10px] sm:text-xs text-foreground">
                          {pred.team_b}
                        </span>
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOfflinePrediction(idx)}
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0 ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="text-muted-foreground text-[8px] font-semibold text-center uppercase tracking-wide border-t border-border/20 pt-1">
                      {pred.stage}
                    </div>
                  </div>
                );
              })}
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
                <span className="text-primary text-base">
                  Rp {(offlinePredictions.length * 10000).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <Button onClick={handleOfflineCheckout} className="w-full mt-2">
              Bayar Tunai & Cetak Struk
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
