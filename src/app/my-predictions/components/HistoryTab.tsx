"use client";

import { Trophy, Flame, Shield, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prediction } from "../types";

interface HistoryTabProps {
  userPredictions: Prediction[];
  getFlagUrl: (teamName: string) => string | null;
  getMatchPoolStats: (
    matchId: string,
    actualScoreA: number | null,
    actualScoreB: number | null
  ) => { totalGuesses: number; winnersCount: number; prizePerWinner: number };
  setActiveSubTab: (tab: "history" | "new" | "cart" | "withdraw") => void;
}

export default function HistoryTab({
  userPredictions,
  getFlagUrl,
  getMatchPoolStats,
  setActiveSubTab,
}: HistoryTabProps) {
  return (
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

            const formattedDate = new Date(match.match_time)
              .toLocaleString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
              .replace(/\./g, ":");

            return (
              <div
                key={pred.id}
                className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm relative overflow-hidden"
              >
                {/* Winner/Status Banner */}
                {isPaid && isMatchCompleted && (
                  <div
                    className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      isWinner
                        ? "bg-green-500 text-black"
                        : "bg-red-500/25 text-red-500 border-l border-b border-red-500/20"
                    }`}
                  >
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
                      <img
                        src={flagA}
                        alt=""
                        className="w-6 h-4 object-cover rounded shadow-sm border border-border/40 shrink-0"
                      />
                    ) : (
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-semibold truncate text-foreground">{match.team_a}</span>
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
                    <span className="font-semibold truncate text-foreground">{match.team_b}</span>
                    {flagB ? (
                      <img
                        src={flagB}
                        alt=""
                        className="w-6 h-4 object-cover rounded shadow-sm border border-border/40 shrink-0"
                      />
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
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isPaid
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      }`}
                    >
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
  );
}
