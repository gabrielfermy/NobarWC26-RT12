"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, Flame, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";

// Utilities & Shared Types
import { Match, PublicPrediction } from "@/lib/match-utils";

// Refactored Modular Components
import { RecentMatches } from "./components/RecentMatches";
import { UpcomingMatches } from "./components/UpcomingMatches";
import { NobarMatches } from "./components/NobarMatches";
import { NearestMatchesPredictions } from "./components/NearestMatchesPredictions";
import { CommunityWall } from "./components/CommunityWall";

export default function Home() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictionsCart, setPredictionsCart] = useState<{ [matchId: string]: { score_a: number; score_b: number }[] }>({});
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash">("qris");
  const [activeTab, setActiveTab] = useState<"laga" | "nobar">("laga");
  
  // Real database profiles & predictions state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [publicPredictions, setPublicPredictions] = useState<PublicPrediction[]>([]);
  const [allPredictions, setAllPredictions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadMatches() {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .order("match_time", { ascending: true });

        if (error) throw error;
        setMatches(data || []);
      } catch (err) {
        console.error("Error loading matches:", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadPublicPredictions() {
      try {
        const { data, error } = await supabase
          .from("predictions")
          .select(`
            id,
            predicted_score_a,
            predicted_score_b,
            profiles (
              name
            ),
            matches (
              team_a,
              team_b
            ),
            transactions (
              payment_method
            )
          `)
          .order("created_at", { ascending: false })
          .limit(30);

        if (error) throw error;

        const mapped = (data || []).map((p: any) => ({
          id: p.id,
          name: p.profiles?.name || "Warga",
          match: `${p.matches?.team_a || "TBD"} vs ${p.matches?.team_b || "TBD"}`,
          score: `${p.predicted_score_a} - ${p.predicted_score_b}`,
          method: p.transactions?.payment_method || "cash"
        }));

        setPublicPredictions(mapped);
      } catch (err) {
        console.error("Error loading public predictions:", err);
      }
    }

    async function loadAllPredictions() {
      try {
        const { data, error } = await supabase
          .from("predictions")
          .select(`
            id,
            match_id,
            predicted_score_a,
            predicted_score_b,
            profiles (
              name
            ),
            transactions!inner (
              payment_status
            )
          `)
          .eq("transactions.payment_status", "paid");
        if (error) throw error;
        setAllPredictions(data || []);
      } catch (err) {
        console.error("Error loading all predictions:", err);
      }
    }

    loadMatches();
    loadPublicPredictions();
    loadAllPredictions();

    // Listen to user auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Live update WebSocket untuk skor di halaman utama
    const channel = supabase
      .channel("matches-home-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        (payload) => {
          setMatches((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === (payload.new as any).id);
            if (idx !== -1) {
              updated[idx] = payload.new as Match;
            } else if (payload.eventType === "INSERT") {
              updated.push(payload.new as Match);
            }
            return updated.sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
          });
        }
      )
      .subscribe();

    // Live update WebSocket untuk predictions
    const predChannel = supabase
      .channel("predictions-home-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions" },
        () => {
          loadPublicPredictions();
          loadAllPredictions();
        }
      )
      .subscribe();

    // Live update WebSocket untuk transactions
    const txChannel = supabase
      .channel("transactions-home-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          loadPublicPredictions();
          loadAllPredictions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(predChannel);
      supabase.removeChannel(txChannel);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const getMatchPredictionSummary = (matchId: string) => {
    const matchPreds = allPredictions.filter((p) => p.match_id === matchId);
    const groups: Record<string, { scoreA: number; scoreB: number; count: number }> = {};
    matchPreds.forEach((p) => {
      const key = `${p.predicted_score_a}-${p.predicted_score_b}`;
      if (!groups[key]) {
        groups[key] = {
          scoreA: p.predicted_score_a,
          scoreB: p.predicted_score_b,
          count: 0,
        };
      }
      groups[key].count += 1;
    });

    return Object.values(groups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const getNearestMatchesObj = (): Match[] => {
    const now = Date.now();
    const scheduled = matches
      .filter((m) => m.status === "scheduled" && new Date(m.match_time).getTime() > now)
      .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());

    if (scheduled.length === 0) return [];

    // Prioritaskan pertandingan terdekat yang sudah ada tebakan
    const withPreds = scheduled.filter((m) => {
      const preds = allPredictions.filter((p) => p.match_id === m.id);
      return preds.length > 0;
    });

    const withoutPreds = scheduled.filter((m) => {
      const preds = allPredictions.filter((p) => p.match_id === m.id);
      return preds.length === 0;
    });

    return [...withPreds, ...withoutPreds].slice(0, 3);
  };

  const nearestMatches = getNearestMatchesObj();

  return (
    <div className="space-y-6 py-4">
      {/* Redesigned Header: Match Orange Theme with Logo */}
      <div className="bg-gradient-to-r from-primary to-orange-600 rounded-2xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none transform scale-150">
          <img src="/logo.png" alt="" className="w-48 h-48 filter blur-[1px]" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Flame className="h-3.5 w-3.5 animate-pulse" />
              <span>Official Nobar Partner</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-tight">
              NOBAR RT 12 PELEM KIDUL - PIALA DUNIA 2026
            </h1>
            <p className="text-white/85 text-xs max-w-xl font-medium leading-relaxed">
              Ayo tebak skor jagoanmu! Hanya <strong>Rp10.000</strong> per tebakan. Maksimal 5 tebakan per laga. Terbuka, transparan, dan seru untuk semua warga!
            </p>
          </div>
          <div className="flex justify-center sm:justify-end shrink-0 self-center sm:self-auto">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="Nobar 2026 Logo" className="h-20 w-20 sm:h-24 sm:w-24 object-contain filter drop-shadow-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex space-x-1 bg-muted p-1 rounded-xl max-w-md mx-auto">
        <Button
          variant={activeTab === "laga" ? "default" : "ghost"}
          className={`flex-1 text-xs py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
            activeTab === "laga"
              ? "bg-primary text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("laga")}
        >
          <Calendar className="h-4 w-4" />
          <span>Jadwal Laga</span>
        </Button>
        <Button
          variant={activeTab === "nobar" ? "default" : "ghost"}
          className={`flex-1 text-xs py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all ${
            activeTab === "nobar"
              ? "bg-primary text-white shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("nobar")}
        >
          <Tv className="h-4 w-4" />
          <span>Jadwal Nobar RT 12</span>
        </Button>
      </div>

      {/* Grid Utama (Mobile First Stack, Desktop Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Jadwal & Form Input Tebakan */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "laga" ? (
            <>
              {/* Recent Match Results */}
              <RecentMatches
                matches={matches}
                loading={loading}
                getMatchPredictionSummary={getMatchPredictionSummary}
              />

              {/* Upcoming Matches */}
              <UpcomingMatches
                matches={matches}
                loading={loading}
                profile={profile}
                user={user}
                router={router}
                getMatchPredictionSummary={getMatchPredictionSummary}
              />
            </>
          ) : (
            /* Tab Jadwal Nobar */
            <NobarMatches matches={matches} loading={loading} />
          )}
        </div>

        {/* Community Wall Section & Sidebar Widgets */}
        <div className="space-y-6">
          {/* Nearest Match Predictions widget */}
          <NearestMatchesPredictions
            nearestMatches={nearestMatches}
            allPredictions={allPredictions}
          />

          {/* Community Wall chat widget */}
          <CommunityWall user={user} profile={profile} />
        </div>

      </div>
    </div>
  );
}
