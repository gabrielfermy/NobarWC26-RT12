"use client";

import { ShoppingCart, Clock, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "../types";

interface CartTabProps {
  cart: { [matchId: string]: { score_a: number; score_b: number }[] };
  matches: Match[];
  addPredictionToCart: (matchId: string) => void;
  updateCartScore: (matchId: string, idx: number, key: "a" | "b", val: number) => void;
  removeCartPrediction: (matchId: string, idx: number) => void;
  getFlagUrl: (teamName: string) => string | null;
  totalCartCount: number;
  totalCartPrice: number;
  paymentMethod: "qris" | "cash";
  setPaymentMethod: (val: "qris" | "cash") => void;
  handleCheckoutLocalCart: () => Promise<void>;
  checkoutSubmitting: boolean;
  unpaidTransactions: any[];
  handlePayPendingTx: (txId: string) => Promise<void>;
}

export default function CartTab({
  cart,
  matches,
  addPredictionToCart,
  updateCartScore,
  removeCartPrediction,
  getFlagUrl,
  totalCartCount,
  totalCartPrice,
  paymentMethod,
  setPaymentMethod,
  handleCheckoutLocalCart,
  checkoutSubmitting,
  unpaidTransactions,
  handlePayPendingTx,
}: CartTabProps) {
  return (
    <div className="space-y-6">
      {/* Part 1: Local Cart Checkout */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
          <ShoppingCart className="h-5 w-5 text-accent" />
          <span>Keranjang Tebakan Baru (Lokal)</span>
        </h3>

        {totalCartCount === 0 ? (
          <p className="text-center py-6 text-xs text-muted-foreground text-foreground">
            Keranjang lokal kosong. Silakan tambah tebakan dari tab pencarian laga.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {Object.entries(cart).map(([matchId, preds]) => {
                const match = matches.find((m) => m.id === matchId);
                if (!match) return null;

                return (
                  <div key={matchId} className="border border-border/40 bg-background/50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-foreground">
                        {match.team_a} vs {match.team_b}
                      </span>
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
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-card border border-border/30 p-2.5 rounded-lg text-xs gap-2 sm:gap-3"
                        >
                          <span className="text-muted-foreground font-semibold shrink-0">Tebakan #{idx + 1}</span>

                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 justify-end">
                            {/* Team A Flag & Name */}
                            <div className="flex items-center space-x-1.5 justify-end w-[35%] max-w-[120px]">
                              <span className="font-semibold truncate text-right text-[10px] sm:text-xs text-foreground">
                                {match.team_a}
                              </span>
                              {getFlagUrl(match.team_a) ? (
                                <img
                                  src={getFlagUrl(match.team_a)!}
                                  alt=""
                                  className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0"
                                />
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
                                className="w-10 h-7 text-center rounded border border-input bg-background font-bold text-xs text-foreground"
                              />
                              <span className="text-muted-foreground font-bold text-[10px]">-</span>
                              <input
                                type="number"
                                value={pred.score_b}
                                onChange={(e) => updateCartScore(matchId, idx, "b", parseInt(e.target.value) || 0)}
                                className="w-10 h-7 text-center rounded border border-input bg-background font-bold text-xs text-foreground"
                              />
                            </div>

                            {/* Team B Flag & Name */}
                            <div className="flex items-center space-x-1.5 justify-start w-[35%] max-w-[120px]">
                              {getFlagUrl(match.team_b) ? (
                                <img
                                  src={getFlagUrl(match.team_b)!}
                                  alt=""
                                  className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0"
                                />
                              ) : (
                                <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                              <span className="font-semibold truncate text-left text-[10px] sm:text-xs text-foreground">
                                {match.team_b}
                              </span>
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
                <div className="text-xs text-muted-foreground">
                  Total: <strong>{totalCartCount} item tebakan</strong>
                </div>
                <div className="text-base font-black text-primary">
                  Total Bayar: Rp {totalCartPrice.toLocaleString("id-ID")}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="bg-background border border-input text-xs rounded-lg px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-8"
                >
                  <option value="qris">QRIS (Otomatis)</option>
                  <option value="cash">Tunai (Admin)</option>
                </select>

                <Button
                  onClick={handleCheckoutLocalCart}
                  disabled={checkoutSubmitting}
                  size="sm"
                  className="text-xs font-bold text-foreground"
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
          <p className="text-center py-6 text-xs text-muted-foreground text-foreground">
            Tidak ada tagihan pembayaran tertunda di database.
          </p>
        ) : (
          <div className="space-y-4">
            {unpaidTransactions.map((tx) => (
              <div key={tx.id} className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase">
                      ID: #{tx.id.substring(0, 8)}
                    </span>
                    <span className="block text-[9px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <span className="font-bold text-amber-500 text-sm">Rp {tx.amount.toLocaleString("id-ID")}</span>
                </div>

                {/* List predictions in this transaction */}
                <div className="space-y-1.5 pl-2 border-l-2 border-border/60">
                  {tx.predictions?.map((pred: any) => (
                    <div key={pred.id} className="text-xs flex justify-between items-center text-muted-foreground">
                      <span>
                        [{pred.matches?.stage}] {pred.matches?.team_a} vs {pred.matches?.team_b}
                      </span>
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

                  <Button size="sm" className="h-7 text-[10px] font-bold text-foreground" onClick={() => handlePayPendingTx(tx.id)}>
                    {tx.payment_method === "qris" ? "Bayar via QRIS (Simulasi)" : "Selesaikan Bayar Cash ke Admin"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
