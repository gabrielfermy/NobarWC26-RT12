"use client";

import { Shield } from "lucide-react";
import { Match, getFlagUrl } from "@/lib/match-utils";

interface NearestMatchesPredictionsProps {
  nearestMatches: Match[];
  allPredictions: any[];
}

export function NearestMatchesPredictions({ nearestMatches, allPredictions }: NearestMatchesPredictionsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm flex flex-col">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
          Tebakan Laga Terdekat
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Daftar tebakan warga untuk 3 pertandingan terdekat.
        </p>
      </div>

      <div className="space-y-4.5">
        {nearestMatches.map((match) => {
          const matchPreds = allPredictions.filter((p) => p.match_id === match.id);
          const flagA = getFlagUrl(match.team_a);
          const flagB = getFlagUrl(match.team_b);

          return (
            <div key={match.id} className="space-y-2.5 border-b border-border/30 last:border-0 pb-3 last:pb-0">
              {/* Match Header Info */}
              <div className="bg-secondary/10 border border-border/40 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 w-[40%]">
                  {flagA ? (
                    <img
                      src={flagA}
                      alt=""
                      className="w-5.5 h-3.5 object-cover rounded shadow-xs border border-border/20 shrink-0"
                    />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-bold text-[11px] truncate text-foreground">{match.team_a}</span>
                </div>

                <div className="text-center shrink-0 px-1">
                  <span className="text-[8px] font-black text-muted-foreground bg-muted px-1 py-0.5 rounded uppercase tracking-wider">
                    {match.stage}
                  </span>
                  <span className="block text-[8px] text-muted-foreground mt-0.5 font-semibold">
                    {new Date(match.match_time).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-2 w-[40%] text-right">
                  <span className="font-bold text-[11px] truncate text-foreground">{match.team_b}</span>
                  {flagB ? (
                    <img
                      src={flagB}
                      alt=""
                      className="w-5.5 h-3.5 object-cover rounded shadow-xs border border-border/20 shrink-0"
                    />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>

              {/* Guesses List */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {matchPreds.length === 0 ? (
                  <div className="text-center py-3 text-muted-foreground text-[10px] border border-dashed border-border/40 rounded-lg">
                    Belum ada tebakan.
                  </div>
                ) : (
                  matchPreds.map((pred) => (
                    <div
                      key={pred.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30"
                    >
                      <div className="flex items-center space-x-2 max-w-[70%]">
                        <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[8px] shrink-0">
                          {pred.profiles?.name ? pred.profiles.name.substring(0, 1).toUpperCase() : "?"}
                        </div>
                        <span className="text-[11px] font-bold text-foreground truncate">
                          {pred.profiles?.name || "Warga"}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-black bg-muted px-1.5 py-0.5 rounded border border-border/20 text-foreground shrink-0">
                        {pred.predicted_score_a} - {pred.predicted_score_b}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
