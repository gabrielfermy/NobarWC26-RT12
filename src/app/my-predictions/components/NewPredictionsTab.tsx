"use client";

import { Search, MapPin, Shield, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "../types";

interface NewPredictionsTabProps {
  matches: Match[];
  allPaidPredictions: any[];
  cart: { [matchId: string]: { score_a: number; score_b: number }[] };
  addPredictionToCart: (matchId: string) => void;
  getFlagUrl: (teamName: string) => string | null;
  matchQuery: string;
  setMatchQuery: (val: string) => void;
  statusFilter: "all" | "scheduled" | "completed";
  setStatusFilter: (val: "all" | "scheduled" | "completed") => void;
  totalCartCount: number;
  totalCartPrice: number;
  paymentMethod: "qris" | "cash";
  setPaymentMethod: (val: "qris" | "cash") => void;
  updateCartScore: (matchId: string, idx: number, key: "a" | "b", val: number) => void;
  removeCartPrediction: (matchId: string, idx: number) => void;
  handleCheckoutLocalCart: () => Promise<void>;
  checkoutSubmitting: boolean;
}

export default function NewPredictionsTab({
  matches,
  allPaidPredictions,
  cart,
  addPredictionToCart,
  getFlagUrl,
  matchQuery,
  setMatchQuery,
  statusFilter,
  setStatusFilter,
  totalCartCount,
  totalCartPrice,
  paymentMethod,
  setPaymentMethod,
  updateCartScore,
  removeCartPrediction,
  handleCheckoutLocalCart,
  checkoutSubmitting,
}: NewPredictionsTabProps) {
  // Filter matches based on search query and status
  const filteredUpcomingMatches = matches.filter((match) => {
    const query = matchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      match.team_a.toLowerCase().includes(query) ||
      match.team_b.toLowerCase().includes(query) ||
      match.stage.toLowerCase().includes(query) ||
      match.stadium.toLowerCase().includes(query);

    let matchesStatus = true;
    if (statusFilter === "scheduled") {
      matchesStatus = match.status === "scheduled";
    } else if (statusFilter === "completed") {
      matchesStatus = match.status === "completed";
    }

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center space-x-2 text-foreground">
        <Search className="h-5 w-5 text-primary" />
        <span>Cari Laga & Ajukan Tebakan</span>
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Kolom Kiri: Catalog Matches */}
        <div className="xl:col-span-3 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card border border-border p-3 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Cari berdasarkan negara, babak, stadion..."
                value={matchQuery}
                onChange={(e) => setMatchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-xs placeholder-muted-foreground/50 text-foreground"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "scheduled" ? "default" : "outline"}
                size="sm"
                className="text-xs text-foreground"
                onClick={() => setStatusFilter("scheduled")}
              >
                Akan Datang
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                className="text-xs text-foreground"
                onClick={() => setStatusFilter("completed")}
              >
                Selesai
              </Button>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                className="text-xs text-foreground"
                onClick={() => setStatusFilter("all")}
              >
                Semua
              </Button>
            </div>
          </div>

          {/* Match Cards in Grid */}
          {filteredUpcomingMatches.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
              Pertandingan tidak ditemukan atau tidak sesuai filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUpcomingMatches.map((match) => {
                const isBettingClosed =
                  match.status !== "scheduled" || new Date(match.match_time).getTime() < Date.now();
                const flagA = getFlagUrl(match.team_a);
                const flagB = getFlagUrl(match.team_b);
                const formattedDate = new Date(match.match_time)
                  .toLocaleString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  .replace(/\./g, ":");

                // Count paid predictions for this match (pool size simulation info)
                const matchPaidPreds = allPaidPredictions.filter((p) => p.match_id === match.id);
                const currentCartCount = cart[match.id]?.length || 0;

                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/20 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
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
                            <img
                              src={flagA}
                              alt=""
                              className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0"
                            />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-semibold truncate text-foreground">{match.team_a}</span>
                        </div>

                        {/* Central divider */}
                        <div className="text-[10px] font-bold text-muted-foreground bg-muted px-3 py-1 rounded">
                          {match.status === "completed" ? `${match.score_a} - ${match.score_b}` : "VS"}
                        </div>

                        {/* Team B */}
                        <div className="flex items-center justify-end space-x-3 w-[40%] text-right">
                          <span className="font-semibold truncate text-foreground">{match.team_b}</span>
                          {flagB ? (
                            <img
                              src={flagB}
                              alt=""
                              className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0"
                            />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-2.5">
                        <div className="flex items-center max-w-[50%]">
                          <MapPin className="h-3 w-3 mr-1 text-primary shrink-0" />
                          <span className="truncate">{match.stadium}</span>
                        </div>

                        <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                          {matchPaidPreds.length} Tebakan (Pool: Rp{" "}
                          {(matchPaidPreds.length * 10000).toLocaleString("id-ID")})
                        </span>
                      </div>
                    </div>

                    {/* Add guessing interface */}
                    {!isBettingClosed && (
                      <div className="flex justify-end pt-3 border-t border-border/30 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPredictionToCart(match.id)}
                          disabled={currentCartCount >= 5}
                          className="h-7 w-full text-[10px] text-primary border-primary/20 hover:bg-primary/10 font-bold"
                        >
                          + Tambah Tebakan (Rp10.000)
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Sticky Mini Cart */}
        <div className="xl:col-span-1 sticky top-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/40 pb-2.5">
              <span className="flex items-center">
                <ShoppingCart className="h-4 w-4 mr-1.5 text-accent" />
                Ringkasan Tebakan
              </span>
              {totalCartCount > 0 && (
                <span className="bg-accent/25 text-accent text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {totalCartCount}
                </span>
              )}
            </h3>

            {totalCartCount === 0 ? (
              <div className="text-center py-10 text-[11px] text-muted-foreground border border-dashed border-border/40 rounded-lg space-y-1">
                <p className="font-semibold text-foreground">Keranjang Kosong</p>
                <p className="text-[10px] text-muted-foreground/70">
                  Tambahkan tebakan dari daftar laga di samping kiri.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {Object.entries(cart).map(([matchId, preds]) => {
                    const match = matches.find((m) => m.id === matchId);
                    if (!match) return null;
                    return (
                      <div
                        key={matchId}
                        className="border border-border/20 bg-background/40 rounded-lg p-2.5 space-y-2 text-xs"
                      >
                        <div className="font-bold text-[10px] truncate text-foreground">
                          {match.team_a} vs {match.team_b}
                        </div>
                        <div className="space-y-1.5">
                          {preds.map((pred, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-card/60 border border-border/10 p-1.5 rounded text-[10px] gap-2"
                            >
                              <span className="text-muted-foreground font-semibold">#{idx + 1}</span>
                              <div className="flex items-center space-x-1 justify-end flex-1">
                                <input
                                  type="number"
                                  value={pred.score_a}
                                  onChange={(e) =>
                                    updateCartScore(matchId, idx, "a", parseInt(e.target.value) || 0)
                                  }
                                  className="w-8 h-6 text-center rounded border border-input bg-background font-bold text-[10px] text-foreground"
                                />
                                <span className="text-muted-foreground font-bold text-[9px]">-</span>
                                <input
                                  type="number"
                                  value={pred.score_b}
                                  onChange={(e) =>
                                    updateCartScore(matchId, idx, "b", parseInt(e.target.value) || 0)
                                  }
                                  className="w-8 h-6 text-center rounded border border-input bg-background font-bold text-[10px] text-foreground"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCartPrediction(matchId, idx)}
                                  className="h-5 w-5 text-destructive hover:bg-destructive/10 shrink-0 ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border/40 pt-3.5 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-semibold">Total Bayar:</span>
                    <span className="text-sm font-black text-primary">
                      Rp {totalCartPrice.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-background border border-input text-[11px] rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
                    >
                      <option value="qris">QRIS (Otomatis)</option>
                      <option value="cash">Tunai (Admin)</option>
                    </select>
                  </div>

                  <Button
                    onClick={handleCheckoutLocalCart}
                    disabled={checkoutSubmitting}
                    className="w-full text-[11px] font-bold h-9 bg-primary text-white hover:bg-primary/95"
                  >
                    {checkoutSubmitting ? "Proses..." : "Checkout & Bayar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
