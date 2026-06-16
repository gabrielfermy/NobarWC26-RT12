"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Medal, Users, Search, Play, Award, CheckCircle } from "lucide-react";

interface Match {
  id: string;
  team_a: string;
  team_b: string;
  status: string;
  score_a: number | null;
  score_b: number | null;
}

interface Profile {
  id: string;
  name: string;
  phone_number: string;
  role: string;
}

interface LeaderboardEntry {
  profileId: string;
  name: string;
  phone_number: string;
  totalGuesses: number;
  totalWins: number;
  totalWinnings: number;
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    async function calculateLeaderboard() {
      setLoading(true);
      try {
        // 1. Ambil data matches, profiles, predictions, transactions
        const [
          { data: matchesData },
          { data: profilesData },
          { data: allPredictions }
        ] = await Promise.all([
          supabase.from("matches").select("*"),
          supabase.from("profiles").select("*"),
          supabase.from("predictions").select(`
            *,
            transactions!inner (
              payment_status
            )
          `).eq("transactions.payment_status", "paid")
        ]);

        const matches = (matchesData || []) as Match[];
        const profiles = (profilesData || []) as Profile[];
        const predictions = allPredictions || [];

        // 2. Hitung statistik pool per pertandingan secara lokal
        const matchPoolStats: Record<string, { totalPaidGuesses: number; winnersCount: number; prizePerWinner: number }> = {};
        
        matches.forEach((match) => {
          const matchPredictions = predictions.filter(p => p.match_id === match.id);
          const totalPaidGuesses = matchPredictions.length;
          const grossPool = totalPaidGuesses * 10000;

          let winnersCount = 0;
          let prizePerWinner = 0;

          if (match.status === "completed" && match.score_a !== null && match.score_b !== null) {
            const winners = matchPredictions.filter(
              p => p.predicted_score_a === match.score_a && p.predicted_score_b === match.score_b
            );
            winnersCount = winners.length;
            if (winnersCount > 0) {
              const potentialShare = grossPool / winnersCount;
              if (potentialShare > 20000) {
                prizePerWinner = potentialShare * 0.90; // Potong fee RT 10%
              } else {
                prizePerWinner = potentialShare;
              }
            }
          }

          matchPoolStats[match.id] = {
            totalPaidGuesses,
            winnersCount,
            prizePerWinner
          };
        });

        // 3. Bangun data leaderboard per profil warga (kecuali admin)
        const leaderboardData: LeaderboardEntry[] = profiles
          .filter((profile) => profile.role !== "admin")
          .map((profile) => {
          const userPredictions = predictions.filter(p => p.user_id === profile.id);
          let totalWins = 0;
          let totalWinnings = 0;

          userPredictions.forEach((pred) => {
            const match = matches.find(m => m.id === pred.match_id);
            if (match && match.status === "completed" && match.score_a !== null && match.score_b !== null) {
              const isCorrect = pred.predicted_score_a === match.score_a && pred.predicted_score_b === match.score_b;
              if (isCorrect) {
                totalWins++;
                const stats = matchPoolStats[match.id];
                if (stats) {
                  totalWinnings += stats.prizePerWinner;
                }
              }
            }
          });

          return {
            profileId: profile.id,
            name: profile.name,
            phone_number: profile.phone_number,
            totalGuesses: userPredictions.length,
            totalWins,
            totalWinnings
          };
        });

        // 4. Urutkan berdasarkan total kemenangan (wins) lalu total pendapatan (winnings)
        const sortedLeaderboard = leaderboardData.sort((a, b) => {
          if (b.totalWins !== a.totalWins) {
            return b.totalWins - a.totalWins;
          }
          if (b.totalWinnings !== a.totalWinnings) {
            return b.totalWinnings - a.totalWinnings;
          }
          return b.totalGuesses - a.totalGuesses;
        });

        setLeaderboard(sortedLeaderboard);
      } catch (err) {
        console.error("Gagal menghitung leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    calculateLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter((entry) =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-6 md:p-8 text-white border border-purple-500/20 shadow-lg shadow-purple-500/5">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-purple-300 border border-purple-500/30 backdrop-blur-sm">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>Leaderboard Warga RT 12</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Papan Peringkat Tebakan Terbaik</h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
            Siapakah warga RT 12 Pelem Kidul dengan tebakan skor paling akurat? Pantau peringkat kemenangan dan total koin yang diraih secara live di sini!
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <Trophy className="w-full h-full p-6 text-white" />
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Cari nama warga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-card border border-input rounded-xl text-sm placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-3 border border-border border-dashed rounded-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Menghitung peringkat warga...</p>
        </div>
      ) : filteredLeaderboard.length === 0 ? (
        <div className="text-center py-16 border border-border border-dashed rounded-xl text-muted-foreground space-y-3">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/45" />
          <p className="text-sm font-semibold">Tidak ada data warga ditemukan.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-muted/40 font-semibold border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3 text-center w-16">Peringkat</th>
                  <th className="px-4 py-3">Nama Warga</th>
                  <th className="px-4 py-3 text-center">Total Tebakan</th>
                  <th className="px-4 py-3 text-center">Tebakan Tepat (Wins)</th>
                  <th className="px-4 py-3 text-right">Total Kemenangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLeaderboard.map((entry, index) => {
                  const isTopThree = index < 3;
                  const medalColors = [
                    "text-amber-400 bg-amber-500/10 border-amber-500/20", // Emas
                    "text-slate-300 bg-slate-500/10 border-slate-500/20", // Perak
                    "text-amber-700 bg-amber-800/10 border-amber-800/20"  // Perunggu
                  ];

                  return (
                    <tr key={entry.profileId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5 text-center">
                        {isTopThree ? (
                          <div className={`mx-auto flex items-center justify-center w-7 h-7 rounded-full border font-bold text-xs ${medalColors[index]}`}>
                            {index + 1}
                          </div>
                        ) : (
                          <span className="font-mono text-muted-foreground font-semibold">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-foreground">
                        <div className="flex items-center space-x-2">
                          <span>{entry.name}</span>
                          {entry.totalWins > 0 && index === 0 && (
                            <Medal className="h-4.5 w-4.5 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-muted-foreground font-semibold">
                        {entry.totalGuesses} tebakan
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-0.5" />
                          {entry.totalWins} Kali
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-primary text-sm">
                        Rp {entry.totalWinnings.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
