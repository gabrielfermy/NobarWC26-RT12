"use client";

import { Shield, MapPin } from "lucide-react";
import { Match, getFlagUrl, getStadiumCountry } from "@/lib/match-utils";

interface RecentMatchesProps {
  matches: Match[];
  loading: boolean;
  getMatchPredictionSummary: (matchId: string) => { scoreA: number; scoreB: number; count: number }[];
}

export function RecentMatches({ matches, loading, getMatchPredictionSummary }: RecentMatchesProps) {
  const getRecentMatches = (): Match[] => {
    const now = Date.now();
    return matches
      .filter((m) => m.status !== "scheduled" || new Date(m.match_time).getTime() <= now)
      .sort((a, b) => new Date(b.match_time).getTime() - new Date(a.match_time).getTime())
      .slice(0, 3);
  };

  const recentMatches = getRecentMatches();

  return (
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

                {/* Prediction summary */}
                {(() => {
                  const summary = getMatchPredictionSummary(match.id);
                  if (summary.length === 0) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/30 text-[9px] text-muted-foreground">
                      <span className="font-bold mr-1">Tebakan Terbanyak:</span>
                      {summary.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center bg-muted px-1.5 py-0.5 rounded font-mono text-[9px] border border-border/10 text-foreground">
                          {item.scoreA}-{item.scoreB}
                          <span className="inline-flex items-center ml-1 text-primary font-bold">
                            👤 {item.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
