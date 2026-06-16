"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match, getFlagUrl, getStadiumCountry } from "@/lib/match-utils";

interface UpcomingMatchesProps {
  matches: Match[];
  loading: boolean;
  profile: any;
  user: any;
  router: any;
  getMatchPredictionSummary: (matchId: string) => { scoreA: number; scoreB: number; count: number }[];
}

export function UpcomingMatches({
  matches,
  loading,
  profile,
  user,
  router,
  getMatchPredictionSummary,
}: UpcomingMatchesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const ITEMS_PER_PAGE = 9;

  const getUpcomingMatches = (): Match[] => {
    const now = Date.now();
    const query = searchQuery.toLowerCase().trim();
    const filtered = matches
      .filter((m) => m.status === "scheduled" && new Date(m.match_time).getTime() > now)
      .filter((m) => {
        if (!query) return true;
        return (
          m.team_a.toLowerCase().includes(query) ||
          m.team_b.toLowerCase().includes(query) ||
          m.stage.toLowerCase().includes(query) ||
          (m.stadium || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
    return filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  };

  const getUpcomingMatchesCount = (): number => {
    const now = Date.now();
    const query = searchQuery.toLowerCase().trim();
    return matches
      .filter((m) => m.status === "scheduled" && new Date(m.match_time).getTime() > now)
      .filter((m) => {
        if (!query) return true;
        return (
          m.team_a.toLowerCase().includes(query) ||
          m.team_b.toLowerCase().includes(query) ||
          m.stage.toLowerCase().includes(query) ||
          (m.stadium || "").toLowerCase().includes(query)
        );
      }).length;
  };

  const upcomingMatches = getUpcomingMatches();
  const upcomingMatchesCount = getUpcomingMatchesCount();
  const totalUpcomingPages = Math.ceil(upcomingMatchesCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-2.5">
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground shrink-0">
          Upcoming Matches
        </h2>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs flex-1 sm:flex-initial">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Cari negara, babak, stadion..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-8 pr-3 py-1 bg-muted/60 border border-border/40 rounded-lg text-xs placeholder-muted-foreground/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-7.5"
          />
        </div>

        <Link href="/bracket" className="text-xs text-primary font-bold hover:underline shrink-0">
          Bagan & Klasemen &rarr;
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

                {/* Prediction summary */}
                {(() => {
                  const summary = getMatchPredictionSummary(match.id);
                  if (summary.length === 0) return null;
                  return (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-border/30 text-[9px] text-muted-foreground mt-1">
                      <span className="font-bold mr-1">Tebakan:</span>
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

      {/* Pagination Controls */}
      {totalUpcomingPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/20 pt-4 mt-4 text-xs">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="h-8 text-[11px] font-bold text-foreground border-border/40 hover:bg-muted"
          >
            &larr; Sebelumnya
          </Button>
          <span className="text-muted-foreground font-medium">
            Halaman {currentPage} dari {totalUpcomingPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalUpcomingPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalUpcomingPages, prev + 1))}
            className="h-8 text-[11px] font-bold text-foreground border-border/40 hover:bg-muted"
          >
            Berikutnya &rarr;
          </Button>
        </div>
      )}
    </div>
  );
}
