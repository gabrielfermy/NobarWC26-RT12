"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Match, TeamStanding } from "./types";
import GroupStandingsTab from "./components/GroupStandingsTab";
import KnockoutBracketTab from "./components/KnockoutBracketTab";
import GroupMatchModal from "./components/GroupMatchModal";

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
  "Turki": "tr", "Turkey": "tr", "Türkiye": "tr", "Turkiye": "tr",
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

export default function BracketPage() {
  const [activeTab, setActiveTab] = useState<"group" | "knockout">("group"); // Default awal ke Fase Grup
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

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
        <div className="inline-flex rounded-xl bg-muted p-1">
          <Button
            variant={activeTab === "group" ? "default" : "ghost"}
            size="sm"
            className={`text-xs sm:text-sm rounded-lg py-2 transition-all ${
              activeTab === "group"
                ? "bg-primary text-white shadow font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("group")}
          >
            <Users className="h-4 w-4 mr-2" />
            Klasemen Fase Grup
          </Button>
          <Button
            variant={activeTab === "knockout" ? "default" : "ghost"}
            size="sm"
            className={`text-xs sm:text-sm rounded-lg py-2 transition-all ${
              activeTab === "knockout"
                ? "bg-primary text-white shadow font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("knockout")}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Bagan Fase Gugur
          </Button>
        </div>
      </div>

      {/* --- TAB KLASEMEN GRUP --- */}
      {activeTab === "group" && (
        <GroupStandingsTab
          standings={standings}
          getFlagUrl={getFlagUrl}
          setSelectedGroup={setSelectedGroup}
        />
      )}

      {/* --- TAB BAGAN FASE GUGUR --- */}
      {activeTab === "knockout" && (
        <KnockoutBracketTab
          stages={stages}
          getFlagUrl={getFlagUrl}
        />
      )}

      {/* MODAL: GROUP MATCH HISTORY */}
      {selectedGroup && (
        <GroupMatchModal
          selectedGroup={selectedGroup}
          setSelectedGroup={setSelectedGroup}
          matches={matches}
          getFlagUrl={getFlagUrl}
        />
      )}
    </div>
  );
}
