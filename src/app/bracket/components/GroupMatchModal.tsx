"use client";

import { Trophy, Calendar, MapPin, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "../types";

interface GroupMatchModalProps {
  selectedGroup: string;
  setSelectedGroup: (groupName: string | null) => void;
  matches: Match[];
  getFlagUrl: (teamName: string) => string | null;
}

export default function GroupMatchModal({
  selectedGroup,
  setSelectedGroup,
  matches,
  getFlagUrl,
}: GroupMatchModalProps) {
  const groupMatches = matches.filter((m) => m.stage === `Fase Grup - ${selectedGroup}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
          <div>
            <h3 className="text-lg font-black text-foreground flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-primary" />
              Jadwal & Hasil Pertandingan - {selectedGroup}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daftar semua laga penyisihan grup.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedGroup(null)}
            className="h-8 w-8 text-muted-foreground hover:bg-muted/10 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2">
          {groupMatches.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              Tidak ada pertandingan untuk grup ini.
            </div>
          ) : (
            groupMatches.map((m) => {
              const flagA = getFlagUrl(m.team_a);
              const flagB = getFlagUrl(m.team_b);
              const isCompleted = m.status === "completed";
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
                <div
                  key={m.id}
                  className="rounded-xl border border-border/85 bg-background/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="flex flex-col space-y-1">
                    <span className="text-[10px] text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-primary" />
                      {formattedDate}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-muted-foreground/60" />
                      {m.stadium}
                    </span>
                  </div>

                  {/* Teams & Scores */}
                  <div className="flex items-center space-x-4 flex-1 justify-center w-full sm:w-auto">
                    <div className="flex items-center space-x-2 w-[35%] justify-end text-right">
                      <span className="font-semibold text-xs truncate text-foreground">{m.team_a}</span>
                      {flagA ? (
                        <img
                          src={flagA}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0"
                        />
                      ) : (
                        <Shield className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      )}
                    </div>

                    <div className="font-mono font-black text-xs bg-muted border border-border px-2.5 py-1 rounded text-center shrink-0">
                      {isCompleted ? `${m.score_a} - ${m.score_b}` : "VS"}
                    </div>

                    <div className="flex items-center space-x-2 w-[35%] justify-start text-left">
                      {flagB ? (
                        <img
                          src={flagB}
                          alt=""
                          className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0"
                        />
                      ) : (
                        <Shield className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      )}
                      <span className="font-semibold text-xs truncate text-foreground">{m.team_b}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right w-full sm:w-auto mt-2 sm:mt-0">
                    <span
                      className={`inline-block text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        isCompleted
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : m.status === "live"
                          ? "bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse"
                          : "bg-zinc-500/10 text-muted-foreground border border-border/60"
                      }`}
                    >
                      {m.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-border shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs text-foreground"
            onClick={() => setSelectedGroup(null)}
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
