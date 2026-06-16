"use client";

import { AlertCircle, Shield } from "lucide-react";
import { TeamStanding } from "../types";

interface GroupStandingsTabProps {
  standings: Record<string, TeamStanding[]>;
  getFlagUrl: (teamName: string) => string | null;
  setSelectedGroup: (groupName: string | null) => void;
}

export default function GroupStandingsTab({
  standings,
  getFlagUrl,
  setSelectedGroup,
}: GroupStandingsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.keys(standings).length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-foreground">Belum ada data pertandingan fase grup yang tersinkron.</p>
        </div>
      ) : (
        Object.entries(standings).map(([groupName, teams]) => (
          <div
            key={groupName}
            className="rounded-xl border border-border bg-card/45 backdrop-blur-sm shadow-sm overflow-hidden hover:border-primary/30 hover:bg-card/75 transition-all cursor-pointer group"
            onClick={() => setSelectedGroup(groupName)}
          >
            {/* Header Grup */}
            <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex justify-between items-center">
              <span className="font-bold text-xs tracking-wider uppercase text-foreground group-hover:text-primary transition-colors">
                {groupName}
              </span>
              <span className="text-[9px] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 font-medium">
                Detail Jadwal &rarr;
              </span>
            </div>

            {/* Tabel Klasemen */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="text-[9px] text-muted-foreground font-semibold uppercase border-b border-border/40 bg-muted/10">
                    <th className="pl-3 pr-2 py-2 w-8 text-center">Pos</th>
                    <th className="px-2 py-2">Tim</th>
                    <th className="px-2 py-2 text-center w-6">M</th>
                    <th className="px-1 py-2 text-center w-5">Mn</th>
                    <th className="px-1 py-2 text-center w-5">S</th>
                    <th className="px-1 py-2 text-center w-5">Kl</th>
                    <th className="px-2 py-2 text-center w-10">Gol</th>
                    <th className="px-2 py-2 text-center w-8">SG</th>
                    <th className="pr-3 pl-2 py-2 text-center w-8">Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, idx) => {
                    const flagUrl = getFlagUrl(team.name);
                    const isQualifyingZone = idx < 2; // Peringkat 1 & 2 lolos grup
                    return (
                      <tr
                        key={team.name}
                        className={`border-b border-border/30 last:border-0 hover:bg-muted/15 transition-colors relative ${
                          isQualifyingZone ? "bg-primary/5" : ""
                        }`}
                      >
                        {/* Posisi dengan bar penanda lolos */}
                        <td className="pl-3 pr-2 py-2 text-center font-medium relative">
                          {isQualifyingZone && (
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                          )}
                          <span className={isQualifyingZone ? "text-primary font-bold" : "text-muted-foreground"}>
                            {idx + 1}
                          </span>
                        </td>

                        {/* Nama Tim + Bendera */}
                        <td className="px-2 py-2 font-semibold flex items-center space-x-2 truncate max-w-[120px] text-foreground">
                          {flagUrl ? (
                            <img
                              src={flagUrl}
                              alt=""
                              className="w-4 h-3 object-cover rounded shadow-sm border border-border/20 shrink-0"
                            />
                          ) : (
                            <Shield className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                          )}
                          <span className="truncate">{team.name}</span>
                        </td>

                        {/* Main (Played) */}
                        <td className="px-2 py-2 text-center font-medium text-foreground/80">{team.played}</td>

                        {/* Menang (Won) */}
                        <td className="px-1 py-2 text-center text-muted-foreground">{team.won}</td>

                        {/* Seri (Drawn) */}
                        <td className="px-1 py-2 text-center text-muted-foreground">{team.drawn}</td>

                        {/* Kalah (Lost) */}
                        <td className="px-1 py-2 text-center text-muted-foreground">{team.lost}</td>

                        {/* Gol (GF:GA) */}
                        <td className="px-2 py-2 text-center font-mono text-muted-foreground">
                          {team.goalsFor}:{team.goalsAgainst}
                        </td>

                        {/* Selisih Gol (GD) */}
                        <td
                          className={`px-2 py-2 text-center font-mono font-medium ${
                            team.goalDifference > 0
                              ? "text-green-500"
                              : team.goalDifference < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </td>

                        {/* Poin */}
                        <td className="pr-3 pl-2 py-2 text-center font-bold text-foreground text-[12px]">
                          {team.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
