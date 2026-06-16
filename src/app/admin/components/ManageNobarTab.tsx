"use client";

import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Match } from "../types";

interface ManageNobarTabProps {
  matches: Match[];
  selectedNobarMatchId: string;
  setSelectedNobarMatchId: (val: string) => void;
  nobarLocation: string;
  setNobarLocation: (val: string) => void;
  nobarPreMinutes: string;
  setNobarPreMinutes: (val: string) => void;
  handleScheduleNobar: () => Promise<void>;
  handleCancelNobar: (matchId: string) => Promise<void>;
}

export default function ManageNobarTab({
  matches,
  selectedNobarMatchId,
  setSelectedNobarMatchId,
  nobarLocation,
  setNobarLocation,
  nobarPreMinutes,
  setNobarPreMinutes,
  handleScheduleNobar,
  handleCancelNobar,
}: ManageNobarTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Tambah Jadwal Nobar */}
      <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
        <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
          <Calendar className="h-5 w-5 text-primary" />
          <span>Jadwalkan Nobar Baru</span>
        </h3>

        <div className="space-y-4">
          {/* Pilih Pertandingan */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Pertandingan (Hanya Babak Gugur)
            </label>
            <select
              value={selectedNobarMatchId}
              onChange={(e) => setSelectedNobarMatchId(e.target.value)}
              className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="">-- Pilih Pertandingan --</option>
              {matches
                .filter((m) => !m.stage.includes("Fase Grup"))
                .map((m) => {
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
                    <option key={m.id} value={m.id}>
                      [{m.stage}] {m.team_a} vs {m.team_b} ({formattedDate} WIB)
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Lokasi Nobar */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Lokasi Nobar
            </label>
            <input
              type="text"
              placeholder="Contoh: Balai RT 12 / Pos Ronda"
              value={nobarLocation}
              onChange={(e) => setNobarLocation(e.target.value)}
              className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-xs placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          {/* Waktu Kumpul Pre-Match (Menit) */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Waktu Kumpul Pre-Match (Menit Sebelum Kick-off)
            </label>
            <select
              value={nobarPreMinutes}
              onChange={(e) => setNobarPreMinutes(e.target.value)}
              className="block w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="15">15 Menit Sebelum Laga</option>
              <option value="30">30 Menit Sebelum Laga</option>
              <option value="45">45 Menit Sebelum Laga</option>
              <option value="60">60 Menit Sebelum Laga</option>
              <option value="90">90 Menit Sebelum Laga</option>
              <option value="120">120 Menit Sebelum Laga</option>
            </select>
          </div>

          <Button onClick={handleScheduleNobar} className="w-full">
            Simpan Jadwal Nobar
          </Button>
        </div>
      </div>

      {/* Daftar Active Nobar Schedule */}
      <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
        <h3 className="text-lg font-bold flex items-center space-x-2 border-b border-border pb-3">
          <span>Daftar Jadwal Nobar Aktif</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3">Pertandingan</th>
                <th className="px-4 py-3">Kick-off</th>
                <th className="px-4 py-3 text-primary font-bold">Mulai Kumpul (Pre-Match)</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {matches.filter((m) => m.is_nobar).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    Belum ada pertandingan yang dijadwalkan Nobar.
                  </td>
                </tr>
              ) : (
                matches
                  .filter((m) => m.is_nobar)
                  .map((m) => {
                    const kickOffStr = new Date(m.match_time)
                      .toLocaleString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      .replace(/\./g, ":");

                    const preMins = m.nobar_pre_minutes || 30;
                    const gatheringTime = new Date(new Date(m.match_time).getTime() - preMins * 60000);
                    const gatheringStr = gatheringTime
                      .toLocaleString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      .replace(/\./g, ":");

                    return (
                      <tr key={m.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-foreground">
                            {m.team_a} vs {m.team_b}
                          </div>
                          <div className="text-muted-foreground text-[10px]">{m.stage}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{kickOffStr}</td>
                        <td className="px-4 py-3 text-primary font-black font-mono">
                          {gatheringStr}
                          <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">
                            ({preMins} menit sebelum kickoff)
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{m.nobar_location}</td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelNobar(m.id)}
                            className="h-7 text-[10px] text-destructive hover:bg-destructive/10 border-destructive/20"
                          >
                            Batalkan Nobar
                          </Button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
