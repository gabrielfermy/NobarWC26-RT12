"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, MapPin, Tv, Shield, Play } from "lucide-react";

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
  is_nobar?: boolean;
  nobar_location?: string;
}

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

const getStadiumCountry = (stadiumName: string) => {
  const nameLower = (stadiumName || "").toLowerCase();
  if (nameLower.includes("estadio bbva") || 
      nameLower.includes("estadio banorte") || 
      nameLower.includes("estadio akron") || 
      nameLower.includes("estadio azteca") || 
      nameLower.includes("mexico") || 
      nameLower.includes("meksiko")) {
    return { name: "Meksiko", code: "mx" };
  }
  if (nameLower.includes("bmo field") || 
      nameLower.includes("bc place") || 
      nameLower.includes("canada") || 
      nameLower.includes("kanada")) {
    return { name: "Kanada", code: "ca" };
  }
  return { name: "Amerika Serikat", code: "us" };
};

export default function NobarPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNobarMatches() {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .eq("is_nobar", true)
          .order("match_time", { ascending: true });

        if (error) throw error;
        setMatches(data || []);
      } catch (err) {
        console.error("Error loading nobar matches:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNobarMatches();
  }, []);

  const upcomingNobar = matches.filter(m => m.status !== "completed");
  const pastNobar = matches.filter(m => m.status === "completed");

  return (
    <div className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-650 via-primary to-orange-600 p-6 md:p-8 text-white shadow-lg shadow-primary/10">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Tv className="h-4 w-4 text-white animate-pulse" />
            <span>Nonton Bareng RT 12</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Jadwal Nonton Bareng (Nobar)</h1>
          <p className="text-xs md:text-sm text-white/95 leading-relaxed font-medium">
            Ayo dukung bersama di pos ronda dan spot kumpul RT 12 Pelem Kidul! Saksikan keseruan perebutan juara Piala Dunia 2026 bersama warga lainnya.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
          <Tv className="w-full h-full p-6 text-white" />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center space-y-3 border border-border border-dashed rounded-xl">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Memuat jadwal nobar...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 border border-border border-dashed rounded-xl text-muted-foreground space-y-3">
          <Tv className="h-12 w-12 mx-auto text-muted-foreground/45" />
          <p className="text-sm font-semibold">Belum ada jadwal Nonton Bareng (Nobar) yang direncanakan.</p>
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto">Admin akan mengumumkan dan memperbarui nobar setelah jadwal babak gugur 32 Besar dikonfirmasi.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Upcoming Nobar */}
          {upcomingNobar.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center space-x-2 text-foreground border-l-4 border-primary pl-3">
                <Play className="h-5 w-5 text-primary fill-primary" />
                <span>Nobar Mendatang</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingNobar.map((match) => {
                  const flagA = getFlagUrl(match.team_a);
                  const flagB = getFlagUrl(match.team_b);
                  const stadiumCountry = getStadiumCountry(match.stadium);
                  const stadiumFlag = getFlagUrl(stadiumCountry.name);
                  const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).replace(/\./g, ':');

                  return (
                    <div key={match.id} className="rounded-xl border border-primary/20 bg-card/60 p-5 space-y-4 shadow-sm hover:border-primary/45 transition-all backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                        {match.stage}
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground font-semibold">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{formattedDate} WIB</span>
                      </div>

                      {/* Teams display */}
                      <div className="flex items-center justify-between py-2 border-y border-border/40">
                        <div className="flex items-center space-x-2.5 w-[42%]">
                          {flagA ? (
                            <img src={flagA} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-bold text-xs sm:text-sm truncate">{match.team_a}</span>
                        </div>
                        <div className="font-mono text-xs font-black text-muted-foreground bg-muted px-2 py-0.5 rounded">VS</div>
                        <div className="flex items-center justify-end space-x-2.5 w-[42%] text-right">
                          <span className="font-bold text-xs sm:text-sm truncate">{match.team_b}</span>
                          {flagB ? (
                            <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Nobar Location */}
                      <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Lokasi Nobar:</span>
                          <span className="text-xs font-bold text-foreground">{match.nobar_location || "Pos Ronda RT 12"}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center space-x-1 mt-0.5">
                            <span>Stadion Asli: {match.stadium}</span>
                            {stadiumCountry && (
                              <span className="inline-flex items-center space-x-0.5 bg-muted px-1 rounded text-[8px] font-bold">
                                {stadiumFlag && (
                                  <img src={stadiumFlag} alt="" className="w-3.5 h-2 object-cover rounded-xs border border-border/20" />
                                )}
                                <span>{stadiumCountry.name}</span>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Nobar */}
          {pastNobar.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h2 className="text-xl font-bold flex items-center space-x-2 text-muted-foreground border-l-4 border-muted-foreground pl-3">
                <Tv className="h-5 w-5 text-muted-foreground" />
                <span>Dokumentasi Nobar Selesai</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
                {pastNobar.map((match) => {
                  const flagA = getFlagUrl(match.team_a);
                  const flagB = getFlagUrl(match.team_b);
                  const stadiumCountry = getStadiumCountry(match.stadium);
                  const stadiumFlag = getFlagUrl(stadiumCountry.name);
                  const formattedDate = new Date(match.match_time).toLocaleString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).replace(/\./g, ':');

                  return (
                    <div key={match.id} className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm backdrop-blur-sm relative">
                      <div className="absolute top-0 right-0 bg-muted-foreground/35 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                        {match.stage}
                      </div>

                      <div className="flex items-center space-x-2 text-xs text-muted-foreground font-semibold">
                        <Calendar className="h-4 w-4" />
                        <span>{formattedDate} WIB</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-y border-border/40">
                        <div className="flex items-center space-x-2.5 w-[38%]">
                          {flagA ? (
                            <img src={flagA} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-bold text-xs sm:text-sm truncate">{match.team_a}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-muted/65 px-3 py-1 rounded font-mono text-sm font-black text-foreground">
                          <span>{match.score_a}</span>
                          <span className="text-muted-foreground/60">-</span>
                          <span>{match.score_b}</span>
                        </div>
                        <div className="flex items-center justify-end space-x-2.5 w-[38%] text-right">
                          <span className="font-bold text-xs sm:text-sm truncate">{match.team_b}</span>
                          {flagB ? (
                            <img src={flagB} alt="" className="w-7 h-4.5 object-cover rounded shadow-sm border border-border/40 shrink-0" />
                          ) : (
                            <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30 flex flex-col space-y-1 text-[11px] text-muted-foreground">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <div>
                            <span>Nobar diadakan di <strong>{match.nobar_location || "Pos Ronda RT 12"}</strong></span>
                          </div>
                        </div>
                        <div className="text-[10px] pl-5 text-muted-foreground/85 flex items-center space-x-1">
                          <span>Stadion Asli: {match.stadium}</span>
                          {stadiumCountry && (
                            <span className="inline-flex items-center space-x-0.5 bg-muted/60 px-1 rounded text-[8px] font-bold">
                              {stadiumFlag && (
                                <img src={stadiumFlag} alt="" className="w-3.5 h-2 object-cover rounded-xs border border-border/20" />
                              )}
                              <span>{stadiumCountry.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
