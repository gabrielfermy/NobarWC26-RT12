"use client";

import { Calendar, Shield } from "lucide-react";
import { Match } from "../types";

interface KnockoutBracketTabProps {
  stages: {
    r32: Match[];
    r16: Match[];
    qf: Match[];
    sf: Match[];
    final: Match[];
  };
  getFlagUrl: (teamName: string) => string | null;
}

export default function KnockoutBracketTab({ stages, getFlagUrl }: KnockoutBracketTabProps) {
  return (
    <div className="relative overflow-x-auto pb-8 pt-4">
      {/* Kontainer Utama Bracket dengan grid kolom untuk 5 Babak */}
      <div className="flex gap-16 min-w-[1400px] px-4 select-none relative h-[1700px] items-end">
        {/* 1. Babak 32 Besar (16 slots of 100px) */}
        <div className="flex flex-col justify-end w-[240px] shrink-0 h-[1600px]">
          <h3 className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">
            Round of 32
          </h3>
          {Array.from({ length: 16 }).map((_, idx) => {
            const match = stages.r32[idx];
            return (
              <div key={idx} className="relative flex items-center justify-center h-[96px] w-full">
                {match ? (
                  <MatchCard match={match} getFlagUrl={getFlagUrl} />
                ) : (
                  <EmptyPlaceholderCard text="Babak 32 Besar" />
                )}
                {/* Garis konektor ke kanan */}
                <div className="absolute right-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                {/* Garis vertikal */}
                {idx % 2 === 0 ? (
                  <div className="absolute right-[-32px] w-[2px] h-[96px] top-[48px] bg-zinc-600" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 2. Babak 16 Besar (8 slots of 200px) */}
        <div className="flex flex-col justify-end w-[240px] shrink-0 h-[1600px]">
          <h3 className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">
            Round of 16
          </h3>
          {Array.from({ length: 8 }).map((_, idx) => {
            const match = stages.r16[idx];
            return (
              <div key={idx} className="relative flex items-center justify-center h-[192px] w-full">
                {/* Garis input kiri */}
                <div className="absolute left-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                {match ? (
                  <MatchCard match={match} getFlagUrl={getFlagUrl} />
                ) : (
                  <EmptyPlaceholderCard text="Babak 16 Besar" />
                )}
                {/* Garis konektor ke kanan */}
                <div className="absolute right-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                {/* Garis vertikal */}
                {idx % 2 === 0 ? (
                  <div className="absolute right-[-32px] w-[2px] h-[192px] top-[96px] bg-zinc-600" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 3. Perempat Final (4 slots of 400px) */}
        <div className="flex flex-col justify-end w-[240px] shrink-0 h-[1600px]">
          <h3 className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">
            Quarter-finals
          </h3>
          {Array.from({ length: 4 }).map((_, idx) => {
            const match = stages.qf[idx];
            return (
              <div key={idx} className="relative flex items-center justify-center h-[384px] w-full">
                {/* Garis input kiri */}
                <div className="absolute left-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                {match ? (
                  <MatchCard match={match} getFlagUrl={getFlagUrl} />
                ) : (
                  <EmptyPlaceholderCard text="Perempat Final" />
                )}
                {/* Garis konektor ke kanan */}
                <div className="absolute right-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                {/* Garis vertikal */}
                {idx % 2 === 0 ? (
                  <div className="absolute right-[-32px] w-[2px] h-[384px] top-[192px] bg-zinc-600" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 4. Semifinal (2 slots of 800px) */}
        <div className="flex flex-col justify-end w-[240px] shrink-0 h-[1600px]">
          <h3 className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">
            Semifinals
          </h3>
          {Array.from({ length: 2 }).map((_, idx) => {
            const match = stages.sf[idx];
            return (
              <div key={idx} className="relative flex items-center justify-center h-[768px] w-full">
                {/* Garis input kiri */}
                <div className="absolute left-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                {match ? (
                  <MatchCard match={match} getFlagUrl={getFlagUrl} />
                ) : (
                  <EmptyPlaceholderCard text="Semifinal" />
                )}
                {/* Garis konektor ke kanan */}
                <div className="absolute right-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                {/* Garis vertikal */}
                {idx % 2 === 0 ? (
                  <div className="absolute right-[-32px] w-[2px] h-[768px] top-[384px] bg-zinc-600" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 5. Final (1 slot of 1600px) */}
        <div className="flex flex-col justify-end w-[240px] shrink-0 h-[1600px] relative">
          <h3 className="text-center font-bold text-xs uppercase tracking-widest text-primary border-b border-primary/40 pb-2 mb-2 absolute top-2 left-0 right-0">
            Final
          </h3>
          {(() => {
            const match = stages.final[0];
            return (
              <div className="relative flex items-center justify-center h-[1536px] w-full">
                {/* Garis input kiri */}
                <div className="absolute left-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                {match ? (
                  <div className="w-full relative">
                    <MatchCard match={match} getFlagUrl={getFlagUrl} highlight />
                    {match.status === "completed" && (
                      <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-center bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase animate-bounce w-[180px]">
                        🏆 JUARA: {match.score_a! > match.score_b! ? match.team_a : match.team_b}
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyPlaceholderCard text="Final Match" />
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  getFlagUrl,
  highlight = false,
}: {
  match: Match;
  getFlagUrl: (teamName: string) => string | null;
  highlight?: boolean;
}) {
  const isWinnerA =
    match.status === "completed" &&
    match.score_a !== null &&
    match.score_b !== null &&
    match.score_a > match.score_b;
  const isWinnerB =
    match.status === "completed" &&
    match.score_a !== null &&
    match.score_b !== null &&
    match.score_b > match.score_a;

  const flagA = getFlagUrl(match.team_a);
  const flagB = getFlagUrl(match.team_b);

  const formattedDate = match.match_time
    ? new Date(match.match_time)
        .toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(/\./g, ":")
    : "Jadwal Belum Ditentukan";

  return (
    <div
      className={`w-full rounded-xl border bg-card/90 border-border/80 p-3 flex flex-col justify-between h-[85px] shadow-sm transition-all hover:scale-[1.01] hover:border-primary/40 relative ${
        highlight ? "border-primary shadow-primary/5 bg-[#17281f]" : ""
      }`}
    >
      {/* Tanggal / Waktu di Bagian Atas */}
      <div className="text-[9px] text-muted-foreground font-medium truncate flex items-center">
        <Calendar className="h-2.5 w-2.5 mr-1 text-muted-foreground/60 shrink-0" />
        {formattedDate}
      </div>

      {/* Baris Tim & Skor */}
      <div className="space-y-1">
        {/* Tim A */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate pr-2">
            {flagA ? (
              <img
                src={flagA}
                alt=""
                className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0"
              />
            ) : (
              <Shield className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            )}
            <span
              className={`text-[11px] truncate ${
                isWinnerA ? "font-bold text-foreground" : "text-muted-foreground"
              }`}
            >
              {match.team_a}
            </span>
          </div>
          {match.status !== "scheduled" && (
            <span
              className={`font-mono text-xs font-black ${
                isWinnerA ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {match.score_a}
            </span>
          )}
        </div>

        {/* Tim B */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate pr-2">
            {flagB ? (
              <img
                src={flagB}
                alt=""
                className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0"
              />
            ) : (
              <Shield className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            )}
            <span
              className={`text-[11px] truncate ${
                isWinnerB ? "font-bold text-foreground" : "text-muted-foreground"
              }`}
            >
              {match.team_b}
            </span>
          </div>
          {match.status !== "scheduled" && (
            <span
              className={`font-mono text-xs font-black ${
                isWinnerB ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {match.score_b}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyPlaceholderCard({ text }: { text: string }) {
  return (
    <div className="w-full rounded-xl border border-border/30 bg-card/30 p-3 flex flex-col justify-center h-[85px] border-dashed text-center">
      <Shield className="w-6 h-6 text-muted-foreground/20 mx-auto mb-1" />
      <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wide">{text}</span>
    </div>
  );
}
