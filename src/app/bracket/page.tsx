"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Users, Calendar, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

// Kamus Kode Negara ISO2 untuk Bendera (FlagCDN)
// Mendukung kunci dalam Bahasa Indonesia maupun Bahasa Inggris untuk ketahanan maksimal
const countryCodes: Record<string, string> = {
  "Meksiko": "mx", "Mexico": "mx",
  "Amerika Serikat": "us", "United States": "us",
  "Kanada": "ca", "Canada": "ca",
  "Afrika Selatan": "za", "South Africa": "za",
  "Korea Selatan": "kr", "South Korea": "kr",
  "Republik Ceko": "cz", "Czech Republic": "cz",
  "Bosnia & Herzegovina": "ba", "Bosnia and Herzegovina": "ba",
  "Arab Saudi": "sa", "Saudi Arabia": "sa",
  "Prancis": "fr", "France": "fr",
  "Australia": "au",
  "Brasil": "br", "Brazil": "br",
  "Kamerun": "cm", "Cameroon": "cm",
  "Jerman": "de", "Germany": "de",
  "Jepang": "jp", "Japan": "jp",
  "Spanyol": "es", "Spain": "es",
  "Kosta Rika": "cr", "Costa Rica": "cr",
  "Inggris": "gb", "England": "gb",
  "Iran": "ir",
  "Argentina": "ar",
  "Belanda": "nl", "Netherlands": "nl",
  "Italia": "it", "Italy": "it",
  "Belgia": "be", "Belgium": "be",
  "Kroasia": "hr", "Croatia": "hr",
  "Portugal": "pt",
  "Uruguay": "uy",
  "Kolombia": "co", "Colombia": "co",
  "Maroko": "ma", "Morocco": "ma",
  "Swiss": "ch", "Switzerland": "ch",
  "Polandia": "pl", "Poland": "pl",
  "Senegal": "sn",
  "Denmark": "dk",
  "Tunisia": "tn",
  "Ekuador": "ec", "Ecuador": "ec",
  "Wales": "gb-wls",
  "Ukraina": "ua", "Ukraine": "ua",
  "Turki": "tr", "Turkey": "tr",
  "Swedia": "se", "Sweden": "se",
  "Austria": "at",
  "Hongaria": "hu", "Hungary": "hu",
  "Skotlandia": "gb-sct", "Scotland": "gb-sct",
  "Selandia Baru": "nz", "New Zealand": "nz",
  "Peru": "pe",
  "Cile": "cl", "Chile": "cl",
  "Mesir": "eg", "Egypt": "eg",
  "Nigeria": "ng",
  "Aljazair": "dz", "Algeria": "dz",
  "Ghana": "gh",
  "Irak": "iq", "Iraq": "iq",
  "Norwegia": "no", "Norway": "no",
  "Qatar": "qa",
  "Pantai Gading": "ci", "Ivory Coast": "ci",
  "Haiti": "ht",
  "Paraguay": "py",
  "Curaçao": "cw", "Curacao": "cw",
  "Tanjung Verde": "cv", "Cape Verde": "cv",
  "Yordania": "jo", "Jordan": "jo",
  "Kongo Demokratik": "cd", "Democratic Republic of the Congo": "cd", "Congo DR": "cd", "DR Congo": "cd", "Democratic Republic of...": "cd", "Democratic Re...": "cd",
  "Uzbekistan": "uz",
  "Panama": "pa",
  "Tiongkok": "cn", "China": "cn",
  "Jamaika": "jm", "Jamaica": "jm",
  "Honduras": "hn",
  "El Salvador": "sv",
  "Venezuela": "ve",
  "Bolivia": "bo",
  "Mali": "ml",
  "Oman": "om",
  "Uni Emirat Arab": "ae", "United Arab Emirates": "ae", "UAE": "ae",
  "Bahrain": "bh",
  "Suriah": "sy", "Syria": "sy",
  "Palestina": "ps", "Palestine": "ps",
  "Kirgistan": "kg", "Kyrgyzstan": "kg",
  "Tajikistan": "tj",
  "India": "in"
};

const getFlagUrl = (teamName: string) => {
  const code = countryCodes[teamName];
  if (!code) return null;
  return `https://flagcdn.com/w80/${code}.png`;
};

interface Match {
  id: string;
  team_a: string;
  team_b: string;
  match_time: string;
  stage: string;
  score_a: number | null;
  score_b: number | null;
  status: string;
  stadium: string;
}

interface TeamStanding {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export default function BracketPage() {
  const [activeTab, setActiveTab] = useState<"group" | "knockout">("group"); // Default awal ke Fase Grup
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .order("match_time", { ascending: true });

        if (error) throw error;
        const fetchedMatches = data || [];
        setMatches(fetchedMatches);

        // Deteksi secara dinamis apakah Babak 32 Besar (Fase Knockout) sudah dimulai
        const r32Matches = fetchedMatches.filter((m) => m.stage === "Babak 32 Besar");
        if (r32Matches.length > 0) {
          const earliestR32Time = Math.min(...r32Matches.map((m) => new Date(m.match_time).getTime()));
          if (Date.now() >= earliestR32Time) {
            setActiveTab("knockout");
          } else {
            setActiveTab("group");
          }
        } else {
          setActiveTab("group");
        }
      } catch (err) {
        console.error("Error loading matches:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();

    // Berlangganan ke perubahan tabel matches secara real-time via WebSocket
    const channel = supabase
      .channel("matches-realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          console.log("Real-time update received:", payload);
          setMatches((prevMatches) => {
            const updated = [...prevMatches];
            const index = updated.findIndex((m) => m.id === (payload.new as any).id);
            if (index !== -1) {
              updated[index] = payload.new as Match;
            } else if (payload.eventType === "INSERT") {
              updated.push(payload.new as Match);
            }
            // Tetap urutkan berdasarkan waktu
            return updated.sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Kalkulasi Klasemen Grup ---
  const calculateStandings = (): Record<string, TeamStanding[]> => {
    const groups: Record<string, Record<string, TeamStanding>> = {};

    matches.forEach((match) => {
      if (!match.stage.startsWith("Fase Grup")) return;
      const groupName = match.stage.split(" - ")[1] || "Grup Tidak Diketahui";

      if (!groups[groupName]) groups[groupName] = {};

      const initTeam = (name: string): TeamStanding => ({
        name, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0
      });

      if (!groups[groupName][match.team_a]) groups[groupName][match.team_a] = initTeam(match.team_a);
      if (!groups[groupName][match.team_b]) groups[groupName][match.team_b] = initTeam(match.team_b);

      const teamA = groups[groupName][match.team_a];
      const teamB = groups[groupName][match.team_b];

      if (match.status === "completed" && match.score_a !== null && match.score_b !== null) {
        teamA.played += 1;
        teamB.played += 1;
        teamA.goalsFor += match.score_a;
        teamA.goalsAgainst += match.score_b;
        teamB.goalsFor += match.score_b;
        teamB.goalsAgainst += match.score_a;

        if (match.score_a > match.score_b) {
          teamA.won += 1; teamA.points += 3; teamB.lost += 1;
        } else if (match.score_a < match.score_b) {
          teamB.won += 1; teamB.points += 3; teamA.lost += 1;
        } else {
          teamA.drawn += 1; teamA.points += 1; teamB.drawn += 1; teamB.points += 1;
        }
        teamA.goalDifference = teamA.goalsFor - teamA.goalsAgainst;
        teamB.goalDifference = teamB.goalsFor - teamB.goalsAgainst;
      }
    });

    const sortedGroups: Record<string, TeamStanding[]> = {};
    Object.keys(groups).sort().forEach((groupKey) => {
      sortedGroups[groupKey] = Object.values(groups[groupKey]).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
    });

    return sortedGroups;
  };

  const standings = calculateStandings();

  // --- Filter & Pengurutan Fase Gugur ---
  const knockoutMatches = matches.filter((m) => !m.stage.startsWith("Fase Grup"));

  // Urutkan berdasarkan ID (terakhirnya integer: match 81 - 112) agar tersusun simetris
  const sortKnockout = (list: Match[]) => {
    return [...list].sort((a, b) => a.id.localeCompare(b.id));
  };

  const stages = {
    r32: sortKnockout(knockoutMatches.filter((m) => m.stage === "Babak 32 Besar")),
    r16: sortKnockout(knockoutMatches.filter((m) => m.stage === "Babak 16 Besar")),
    qf: sortKnockout(knockoutMatches.filter((m) => m.stage === "Perempat Final")),
    sf: sortKnockout(knockoutMatches.filter((m) => m.stage === "Semifinal")),
    final: sortKnockout(knockoutMatches.filter((m) => m.stage === "Final")),
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground font-medium">Memuat data klasemen & bagan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Skema & Klasemen Turnamen</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau statistik fase grup dan bagan fase gugur Piala Dunia 2026 secara dinamis.
          </p>
        </div>
        
        {/* Toggle Tab */}
        <div className="inline-flex rounded-lg bg-muted p-1">
          <Button
            variant={activeTab === "group" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => setActiveTab("group")}
          >
            <Users className="h-4 w-4 mr-2" />
            Klasemen Fase Grup
          </Button>
          <Button
            variant={activeTab === "knockout" ? "secondary" : "ghost"}
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => setActiveTab("knockout")}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Bagan Fase Gugur
          </Button>
        </div>
      </div>

      {/* --- TAB KLASEMEN GRUP --- */}
      {activeTab === "group" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(standings).length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm">Belum ada data pertandingan fase grup yang tersinkron.</p>
            </div>
          ) : (
            Object.entries(standings).map(([groupName, teams]) => (
              <div key={groupName} className="rounded-xl border border-border bg-card/45 backdrop-blur-sm shadow-sm overflow-hidden hover:border-primary/30 transition-all">
                {/* Header Grup */}
                <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex justify-between items-center">
                  <span className="font-bold text-xs tracking-wider uppercase text-foreground">{groupName}</span>
                  <span className="text-[9px] bg-green-500/10 border border-green-500/20 text-green-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">Live</span>
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
                            <td className="px-2 py-2 font-semibold flex items-center space-x-2 truncate max-w-[120px]">
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
                            <td className={`px-2 py-2 text-center font-mono font-medium ${
                              team.goalDifference > 0 
                                ? "text-green-500" 
                                : team.goalDifference < 0 
                                ? "text-destructive" 
                                : "text-muted-foreground"
                            }`}>
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
      )}

      {/* --- TAB BAGAN FASE GUGUR (TREE CONNECTED VIEW WITH FIXED SLOT HEIGHTS) --- */}
      {activeTab === "knockout" && (
        <div className="relative overflow-x-auto pb-8 pt-4">
          {/* Kontainer Utama Bracket dengan grid kolom untuk 5 Babak */}
          <div className="flex gap-16 min-w-[1400px] px-4 select-none relative h-[1700px] items-end">
            
            {/* 1. Babak 32 Besar (16 slots of 100px) */}
            <div className="flex flex-col justify-end w-[240px] shrink-0 h-[1600px]">
              <h3 className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">Round of 32</h3>
              {Array.from({ length: 16 }).map((_, idx) => {
                const match = stages.r32[idx];
                return (
                  <div key={idx} className="relative flex items-center justify-center h-[96px] w-full">
                    {match ? <MatchCard match={match} /> : <EmptyPlaceholderCard text="Babak 32 Besar" />}
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
              <h3 className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">Round of 16</h3>
              {Array.from({ length: 8 }).map((_, idx) => {
                const match = stages.r16[idx];
                return (
                  <div key={idx} className="relative flex items-center justify-center h-[192px] w-full">
                    {/* Garis input kiri */}
                    <div className="absolute left-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                    {match ? <MatchCard match={match} /> : <EmptyPlaceholderCard text="Babak 16 Besar" />}
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
              <h3 className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">Quarter-finals</h3>
              {Array.from({ length: 4 }).map((_, idx) => {
                const match = stages.qf[idx];
                return (
                  <div key={idx} className="relative flex items-center justify-center h-[384px] w-full">
                    {/* Garis input kiri */}
                    <div className="absolute left-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                    {match ? <MatchCard match={match} /> : <EmptyPlaceholderCard text="Perempat Final" />}
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
              <h3 className="text-center font-bold text-xs uppercase tracking-widest text-muted-foreground border-b border-border/40 pb-2 mb-2">Semifinals</h3>
              {Array.from({ length: 2 }).map((_, idx) => {
                const match = stages.sf[idx];
                return (
                  <div key={idx} className="relative flex items-center justify-center h-[768px] w-full">
                    {/* Garis input kiri */}
                    <div className="absolute left-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                    {match ? <MatchCard match={match} /> : <EmptyPlaceholderCard text="Semifinal" />}
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
              <h3 className="text-center font-bold text-xs uppercase tracking-widest text-primary border-b border-primary/40 pb-2 mb-2 absolute top-2 left-0 right-0">Final</h3>
              {(() => {
                const match = stages.final[0];
                return (
                  <div className="relative flex items-center justify-center h-[1536px] w-full">
                    {/* Garis input kiri */}
                    <div className="absolute left-[-32px] w-[32px] h-[2px] bg-zinc-600" />
                    {match ? (
                      <div className="w-full relative">
                        <MatchCard match={match} highlight />
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
      )}
    </div>
  );
}

// Komponen Kartu Pertandingan di dalam Bagan
function MatchCard({ match, highlight = false }: { match: Match; highlight?: boolean }) {
  const isWinnerA = match.status === "completed" && match.score_a !== null && match.score_b !== null && match.score_a > match.score_b;
  const isWinnerB = match.status === "completed" && match.score_a !== null && match.score_b !== null && match.score_b > match.score_a;

  const flagA = getFlagUrl(match.team_a);
  const flagB = getFlagUrl(match.team_b);

  const formattedDate = match.match_time
    ? new Date(match.match_time).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).replace(/\./g, ':')
    : "Jadwal Belum Ditentukan";

  return (
    <div className={`w-full rounded-xl border bg-card/90 border-border/80 p-3 flex flex-col justify-between h-[85px] shadow-sm transition-all hover:scale-[1.01] hover:border-primary/40 relative ${
      highlight ? "border-primary shadow-primary/5 bg-[#17281f]" : ""
    }`}>
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
              <img src={flagA} alt="" className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0" />
            ) : (
              <Shield className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            )}
            <span className={`text-[11px] truncate ${isWinnerA ? "font-bold text-foreground" : "text-muted-foreground"}`}>
              {match.team_a}
            </span>
          </div>
          {match.status !== "scheduled" && (
            <span className={`font-mono text-xs font-black ${isWinnerA ? "text-primary" : "text-muted-foreground"}`}>
              {match.score_a}
            </span>
          )}
        </div>

        {/* Tim B */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate pr-2">
            {flagB ? (
              <img src={flagB} alt="" className="w-5 h-3.5 object-cover rounded border border-border/20 shrink-0" />
            ) : (
              <Shield className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            )}
            <span className={`text-[11px] truncate ${isWinnerB ? "font-bold text-foreground" : "text-muted-foreground"}`}>
              {match.team_b}
            </span>
          </div>
          {match.status !== "scheduled" && (
            <span className={`font-mono text-xs font-black ${isWinnerB ? "text-primary" : "text-muted-foreground"}`}>
              {match.score_b}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Kartu Placeholder Kosong saat Laga belum dibuat
function EmptyPlaceholderCard({ text }: { text: string }) {
  return (
    <div className="w-full rounded-xl border border-border/30 bg-card/30 p-3 flex flex-col justify-center h-[85px] border-dashed text-center">
      <Shield className="w-6 h-6 text-muted-foreground/20 mx-auto mb-1" />
      <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wide">{text}</span>
    </div>
  );
}
