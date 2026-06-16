"use client";

import { Calendar, Search, Shield, MapPin, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "../types";

interface ManageMatchesTabProps {
  filteredMatches: Match[];
  matches: Match[];
  matchSearch: string;
  setMatchSearch: (val: string) => void;
  matchStatusFilter: string;
  setMatchStatusFilter: (val: string) => void;
  matchStageFilter: string;
  setMatchStageFilter: (val: string) => void;
  syncMatchesFromApi: () => Promise<void>;
  syncingApi: boolean;
  editingMatchId: string | null;
  setEditingMatchId: (val: string | null) => void;
  editScoreA: string;
  setEditScoreA: (val: string) => void;
  editScoreB: string;
  setEditScoreB: (val: string) => void;
  editStatus: string;
  setEditStatus: (val: string) => void;
  saveMatchUpdate: (matchId: string) => Promise<void>;
  startEditingMatch: (match: Match) => void;
  getFlagUrl: (teamName: string) => string | null;
  getStadiumCountry: (stadiumName: string) => { name: string; code: string } | null;
}

export default function ManageMatchesTab({
  filteredMatches,
  matches,
  matchSearch,
  setMatchSearch,
  matchStatusFilter,
  setMatchStatusFilter,
  matchStageFilter,
  setMatchStageFilter,
  syncMatchesFromApi,
  syncingApi,
  editingMatchId,
  setEditingMatchId,
  editScoreA,
  setEditScoreA,
  editScoreB,
  setEditScoreB,
  editStatus,
  setEditStatus,
  saveMatchUpdate,
  startEditingMatch,
  getFlagUrl,
  getStadiumCountry,
}: ManageMatchesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <h3 className="text-lg font-bold flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span>Kelola Skor Akhir & Status Pertandingan</span>
        </h3>
        <Button
          size="sm"
          onClick={syncMatchesFromApi}
          disabled={syncingApi}
          className="text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/35 transition-all"
        >
          {syncingApi ? "Menyinkronkan..." : "Tarik Hasil Terbaru dari API"}
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-card/40 p-4 rounded-xl border border-border/40">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Cari tim, babak, atau stadion..."
            value={matchSearch}
            onChange={(e) => setMatchSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={matchStatusFilter}
            onChange={(e) => setMatchStatusFilter(e.target.value)}
            className="bg-background border border-input text-xs rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing (Live)</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={matchStageFilter}
            onChange={(e) => setMatchStageFilter(e.target.value)}
            className="bg-background border border-input text-xs rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Babak</option>
            {Array.from(new Set(matches.map((m) => m.stage)))
              .filter(Boolean)
              .map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            Tidak ada pertandingan yang cocok dengan filter.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isEditing = editingMatchId === match.id;
            const formattedDate = new Date(match.match_time)
              .toLocaleString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
              .replace(/\./g, ":");

            const flagA = getFlagUrl(match.team_a);
            const flagB = getFlagUrl(match.team_b);
            const stadiumCountry = getStadiumCountry(match.stadium);
            const stadiumFlag = stadiumCountry ? getFlagUrl(stadiumCountry.name) : null;

            return (
              <div
                key={match.id}
                className={`rounded-xl border p-4 space-y-3 shadow-sm transition-all ${
                  isEditing
                    ? "border-primary bg-primary/5 shadow-primary/5"
                    : "border-border bg-card/50 hover:border-primary/20"
                }`}
              >
                <div className="flex justify-between items-center text-[10px]">
                  <span className="bg-secondary/20 px-2 py-0.5 rounded text-secondary font-medium uppercase">
                    {match.stage}
                  </span>
                  <span className="text-muted-foreground">{formattedDate}</span>
                </div>

                {/* Line Up Info & Editing Inputs */}
                <div className="flex items-center justify-between py-1 text-xs">
                  <div className="flex items-center space-x-2 max-w-[38%] truncate">
                    {flagA ? (
                      <img src={flagA} alt="" className="w-6 h-4 object-cover rounded border border-border/40 shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-semibold truncate text-foreground">{match.team_a}</span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editScoreA}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                          setEditScoreA(val.toString());
                        }}
                        className="w-10 text-center py-1 border border-input rounded bg-background font-bold text-sm text-foreground"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editScoreB}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                          setEditScoreB(val.toString());
                        }}
                        className="w-10 text-center py-1 border border-input rounded bg-background font-bold text-sm text-foreground"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {match.status === "scheduled" ? (
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">VS</span>
                      ) : (
                        <span className="font-mono text-sm font-black bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20 text-primary">
                          {match.score_a} - {match.score_b}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2 max-w-[38%] truncate text-right">
                    <span className="font-semibold truncate text-foreground">{match.team_b}</span>
                    {flagB ? (
                      <img src={flagB} alt="" className="w-6 h-4 object-cover rounded border border-border/40 shrink-0" />
                    ) : (
                      <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>

                {/* Stadium */}
                <div className="text-[10px] text-muted-foreground flex items-center justify-between border-t border-border/30 pt-2.5">
                  <div className="flex items-center max-w-[75%]">
                    <MapPin className="h-3 w-3 mr-1 text-primary shrink-0" />
                    <span className="truncate mr-1.5">{match.stadium}</span>
                    {stadiumCountry && (
                      <span className="inline-flex items-center space-x-1 bg-muted px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 text-foreground">
                        {stadiumFlag && (
                          <img src={stadiumFlag} alt="" className="w-4.5 h-3 object-cover rounded-sm border border-border/20" />
                        )}
                        <span>{stadiumCountry.name}</span>
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-2 text-foreground">
                    {match.is_nobar && (
                      <span className="bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                        NOBAR
                      </span>
                    )}
                    <span className="capitalize font-bold text-[9px]">
                      {match.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Edit Actions */}
                <div className="flex justify-end pt-1 border-t border-border/30">
                  {isEditing ? (
                    <div className="flex flex-col md:flex-row items-center gap-2 w-full justify-between">
                      <div className="flex items-center space-x-2">
                        <label className="text-[9px] text-muted-foreground uppercase font-bold">Status:</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="bg-background border border-input text-[10px] rounded px-1.5 py-1 text-foreground"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="ongoing">Ongoing (Live)</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="space-x-1 self-end">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setEditingMatchId(null)}
                          className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                        >
                          Batal
                        </Button>
                        <Button
                          size="xs"
                          onClick={() => saveMatchUpdate(match.id)}
                          className="h-6 text-[10px]"
                        >
                          Simpan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingMatch(match)}
                      className="h-7 text-[10px] text-primary hover:bg-primary/10"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Ubah Hasil
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
