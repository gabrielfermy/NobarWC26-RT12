"use client";

import { MapPin, Shield, Tv } from "lucide-react";
import { Match, getFlagUrl } from "@/lib/match-utils";

interface NobarMatchesProps {
  matches: Match[];
  loading: boolean;
}

export function NobarMatches({ matches, loading }: NobarMatchesProps) {
  const nobarMatches = matches.filter((m) => m.is_nobar);

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-lg font-bold flex items-center space-x-2 text-foreground">
          <Tv className="h-5 w-5 text-primary" />
          <span>Jadwal Nonton Bareng (Nobar) RT 12</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Saksikan keseruan bersama warga RT 12 Pelem Kidul di Pos Ronda.
        </p>
      </div>

      {loading ? (
        <div className="flex h-32 flex-col items-center justify-center space-y-2 border border-border border-dashed rounded-xl">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground">Memuat jadwal nobar...</p>
        </div>
      ) : nobarMatches.length === 0 ? (
        <div className="text-center py-8 border border-border border-dashed rounded-xl text-muted-foreground text-xs">
          Belum ada jadwal Nonton Bareng yang diumumkan oleh admin.
        </div>
      ) : (
        <div className="space-y-4">
          {nobarMatches.map((match) => {
            const flagA = getFlagUrl(match.team_a);
            const flagB = getFlagUrl(match.team_b);
            const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            }).replace(/\./g, ':');

            return (
              <div key={match.id} className="rounded-xl border border-primary/20 bg-card p-4 space-y-4 shadow-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-primary/15 px-2 py-0.5 rounded text-primary font-bold text-[9px] uppercase tracking-wider">
                    {match.stage}
                  </span>
                  <span className="text-muted-foreground font-medium">{formattedDate} WIB</span>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-border/40">
                  <div className="flex items-center space-x-2.5 w-[42%]">
                    {flagA ? (
                      <img src={flagA} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                    ) : (
                      <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-bold text-xs sm:text-sm truncate">{match.team_a}</span>
                  </div>
                  <div className="font-mono text-xs font-black bg-muted px-2.5 py-0.5 rounded text-muted-foreground">VS</div>
                  <div className="flex items-center justify-end space-x-2.5 w-[42%] text-right">
                    <span className="font-bold text-xs sm:text-sm truncate">{match.team_b}</span>
                    {flagB ? (
                      <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                    ) : (
                      <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>

                <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-primary font-black uppercase tracking-wider block">Lokasi Nobar:</span>
                    <span className="text-xs font-bold text-foreground">{match.nobar_location || "Pos Ronda RT 12"}</span>
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
