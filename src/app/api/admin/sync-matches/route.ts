import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Kamus terjemahan nama negara/tim ke Bahasa Indonesia yang komprehensif
const teamTranslations: Record<string, string> = {
  "Mexico": "Meksiko",
  "South Africa": "Afrika Selatan",
  "South Korea": "Korea Selatan",
  "Czech Republic": "Republik Ceko",
  "Canada": "Kanada",
  "Bosnia and Herzegovina": "Bosnia & Herzegovina",
  "United States": "Amerika Serikat",
  "Saudi Arabia": "Arab Saudi",
  "France": "Prancis",
  "Australia": "Australia",
  "Brazil": "Brasil",
  "Cameroon": "Kamerun",
  "Germany": "Jerman",
  "Japan": "Jepang",
  "Spain": "Spanyol",
  "Costa Rica": "Kosta Rika",
  "England": "Inggris",
  "Iran": "Iran",
  "Argentina": "Argentina",
  "Netherlands": "Belanda",
  "Italy": "Italia",
  "Belgium": "Belgia",
  "Croatia": "Kroasia",
  "Portugal": "Portugal",
  "Uruguay": "Uruguay",
  "Colombia": "Kolombia",
  "Morocco": "Maroko",
  "Switzerland": "Swiss",
  "Poland": "Polandia",
  "Senegal": "Senegal",
  "Denmark": "Denmark",
  "Tunisia": "Tunisia",
  "Ecuador": "Ekuador",
  "Wales": "Wales",
  "Ukraine": "Ukraina",
  "Turkey": "Turki",
  "Sweden": "Swedia",
  "Austria": "Austria",
  "Hungary": "Hongaria",
  "Scotland": "Skotlandia",
  "New Zealand": "Selandia Baru",
  "Peru": "Peru",
  "Chile": "Cile",
  "Egypt": "Mesir",
  "Nigeria": "Nigeria",
  "Algeria": "Aljazair",
  "Ghana": "Ghana",
  "Iraq": "Irak",
  "Norway": "Norwegia",
  "Qatar": "Qatar",
  "Ivory Coast": "Pantai Gading",
  "Haiti": "Haiti",
  "Paraguay": "Paraguay",
  "Curaçao": "Curaçao",
  "Curacao": "Curaçao",
  "Cape Verde": "Tanjung Verde",
  "Jordan": "Yordania",
  "Democratic Republic of the Congo": "Kongo Demokratik",
  "Congo DR": "Kongo Demokratik",
  "DR Congo": "Kongo Demokratik",
  "Democratic Republic of...": "Kongo Demokratik",
  "Uzbekistan": "Uzbekistan",
  "Panama": "Panama",
  "China": "Tiongkok",
  "Jamaica": "Jamaika",
  "Honduras": "Honduras",
  "El Salvador": "El Salvador",
  "Venezuela": "Venezuela",
  "Bolivia": "Bolivia",
  "Mali": "Mali",
  "Oman": "Oman",
  "United Arab Emirates": "Uni Emirat Arab",
  "UAE": "Uni Emirat Arab",
  "Bahrain": "Bahrain",
  "Syria": "Suriah",
  "Palestine": "Palestina",
  "Kyrgyzstan": "Kirgistan",
  "Tajikistan": "Tajikistan",
  "India": "India"
};

const translateTeam = (name: string): string => {
  return teamTranslations[name] || name;
};

// Menerjemahkan label placeholder (misal: "Winner Match 86" -> "Pemenang Laga 86")
const translateLabel = (label: string): string => {
  if (!label || label === 'null') return '';
  return label
    .replace(/Winner Match (\d+)/gi, 'Pemenang Laga $1')
    .replace(/Runner-up Group ([A-L])/gi, 'Runner-up Grup $1')
    .replace(/Winner Group ([A-L])/gi, 'Juara Grup $1');
};

// Map status dari API eksternal ke ENUM database kita
const mapStatus = (timeElapsed: string, finished: string): string => {
  if (finished === 'TRUE' || finished === 'true' || timeElapsed === 'fulltime') {
    return 'completed';
  }
  
  const normalized = timeElapsed.toLowerCase().replace(/[^a-z0-9]/g, '');
  switch (normalized) {
    case 'notstarted':
      return 'scheduled';
    case 'firsthalf':
      return 'first_half';
    case 'halftime':
      return 'half_time';
    case 'secondhalf':
      return 'second_half';
    case 'overtime':
      return 'overtime';
    case 'penalties':
      return 'penalties';
    default:
      return 'scheduled';
  }
};

// Map nama babak (stage) ke Bahasa Indonesia yang bersih
const mapStage = (type: string, groupName: string): string => {
  const norm = type.toLowerCase();
  if (norm === 'group') {
    return `Fase Grup - ${groupName}`;
  }
  switch (norm) {
    case 'r32':
      return 'Babak 32 Besar';
    case 'r16':
      return 'Babak 16 Besar';
    case 'qf':
      return 'Perempat Final';
    case 'sf':
      return 'Semifinal';
    case 'final':
      return 'Final';
    case 'third':
      return 'Perebutan Tempat Ketiga';
    default:
      return `Fase ${type}`;
  }
};

export async function POST(request: NextRequest) {
  try {
    // 1. Otorisasi token rahasia
    const authHeader = request.headers.get('Authorization');
    const secretKey = process.env.SYNC_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: 'Server configuration error: SYNC_SECRET_KEY is not set' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid sync token' },
        { status: 401 }
      );
    }

    // 2. Fetch data secara paralel dari API worldcup26.ir
    console.log('Fetching World Cup data from external API...');
    const [gamesRes, teamsRes, stadiumsRes] = await Promise.all([
      fetch('https://worldcup26.ir/get/games', { cache: 'no-store' }),
      fetch('https://worldcup26.ir/get/teams', { cache: 'no-store' }),
      fetch('https://worldcup26.ir/get/stadiums', { cache: 'no-store' }),
    ]);

    if (!gamesRes.ok || !teamsRes.ok || !stadiumsRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from third-party API' },
        { status: 502 }
      );
    }

    const rawGamesObj = await gamesRes.json();
    const rawTeamsObj = await teamsRes.json();
    const rawStadiumsObj = await stadiumsRes.json();

    const rawGames = rawGamesObj.games || [];
    const rawTeams = rawTeamsObj.teams || [];
    const rawStadiums = rawStadiumsObj.stadiums || [];

    // 3. Buat map lookup untuk mempermudah pencarian nama tim dan stadion berdasarkan ID
    const teamsMap = new Map<string, { name: string; group: string }>();
    rawTeams.forEach((t: any) => {
      teamsMap.set(String(t.id), {
        name: translateTeam(t.name_en),
        group: t.groups || '',
      });
    });

    const stadiumsMap = new Map<string, string>();
    rawStadiums.forEach((s: any) => {
      const stadiumName = s.name_en || s.name || 'Stadium';
      const city = s.city_en ? `, ${s.city_en}` : '';
      stadiumsMap.set(String(s.id), `${stadiumName}${city}`);
    });

    // 4. Transformasi data games eksternal ke struktur tabel matches Supabase kita
    const formattedMatches = rawGames.map((game: any) => {
      const homeTeam = teamsMap.get(String(game.home_team_id));
      const awayTeam = teamsMap.get(String(game.away_team_id));
      const stadiumName = stadiumsMap.get(String(game.stadium_id)) || 'Stadion Piala Dunia 2026';

      // Jika ID tim adalah 0, gunakan label placeholder yang diterjemahkan (misal: "Pemenang Laga 86")
      let teamA = '';
      if (String(game.home_team_id) === '0' || !game.home_team_id) {
        teamA = translateLabel(game.home_team_label) || 'Tim A';
      } else {
        teamA = homeTeam ? homeTeam.name : `Tim ${game.home_team_id}`;
      }

      let teamB = '';
      if (String(game.away_team_id) === '0' || !game.away_team_id) {
        teamB = translateLabel(game.away_team_label) || 'Tim B';
      } else {
        teamB = awayTeam ? awayTeam.name : `Tim ${game.away_team_id}`;
      }

      const groupName = homeTeam?.group ? `Grup ${homeTeam.group}` : (game.group || '');
      const stageName = mapStage(game.type || 'group', groupName);

      // Stadium timezone offsets in UTC (active during World Cup 2026 DST)
      const stadiumTimezoneOffsets: Record<string, string> = {
        "1": "-06:00", // Estadio Azteca (Mexico City, Mexico) - CST (UTC-6)
        "2": "-06:00", // Estadio Akron (Guadalajara, Mexico) - CST (UTC-6)
        "3": "-06:00", // Estadio BBVA (Monterrey, Mexico) - CST (UTC-6)
        "4": "-05:00", // AT&T Stadium (Dallas, USA) - CDT (UTC-5)
        "5": "-05:00", // NRG Stadium (Houston, USA) - CDT (UTC-5)
        "6": "-05:00", // GEHA Field at Arrowhead Stadium (Kansas City, USA) - CDT (UTC-5)
        "7": "-04:00", // Mercedes-Benz Stadium (Atlanta, USA) - EDT (UTC-4)
        "8": "-04:00", // Hard Rock Stadium (Miami, USA) - EDT (UTC-4)
        "9": "-04:00", // Gillette Stadium (Boston, USA) - EDT (UTC-4)
        "10": "-04:00", // Lincoln Financial Field (Philadelphia, USA) - EDT (UTC-4)
        "11": "-04:00", // MetLife Stadium (New York/New Jersey, USA) - EDT (UTC-4)
        "12": "-04:00", // BMO Field (Toronto, Canada) - EDT (UTC-4)
        "13": "-07:00", // BC Place (Vancouver, Canada) - PDT (UTC-7)
        "14": "-07:00", // Lumen Field (Seattle, USA) - PDT (UTC-7)
        "15": "-07:00", // Levi's Stadium (San Francisco Bay Area, USA) - PDT (UTC-7)
        "16": "-07:00", // SoFi Stadium (Los Angeles, USA) - PDT (UTC-7)
      };

      // Parsing format tanggal local_date "MM/DD/YYYY HH:MM" ke ISO format
      let matchTimeISO = new Date().toISOString();
      if (game.local_date) {
        const [datePart, timePart] = game.local_date.split(' ');
        const [month, day, year] = datePart.split('/');
        const offset = stadiumTimezoneOffsets[String(game.stadium_id)] || '-04:00';
        matchTimeISO = new Date(`${year}-${month}-${day}T${timePart}:00.000${offset}`).toISOString();
      }

      // Skor parse
      const scoreA = game.home_score !== null && game.home_score !== undefined ? parseInt(game.home_score, 10) : null;
      const scoreB = game.away_score !== null && game.away_score !== undefined ? parseInt(game.away_score, 10) : null;

      // Status mapping
      const statusMapped = mapStatus(game.time_elapsed || 'notstarted', game.finished || 'FALSE');

      // UUID berbasis ID integer
      const idPadding = String(game.id).padStart(12, '0');
      const gameUuid = `00000000-0000-0000-0000-${idPadding}`;

      return {
        id: gameUuid,
        team_a: teamA,
        team_b: teamB,
        match_time: matchTimeISO,
        stage: stageName,
        score_a: statusMapped === 'scheduled' ? null : scoreA,
        score_b: statusMapped === 'scheduled' ? null : scoreB,
        status: statusMapped,
        stadium: stadiumName,
      };
    });

    // 5. Upsert hasil pemetaan ke database Supabase
    console.log(`Upserting ${formattedMatches.length} matches to Supabase...`);
    const { data, error } = await supabaseAdmin
      .from('matches')
      .upsert(formattedMatches, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Database sync upsert error:', error);
      return NextResponse.json(
        { error: 'Database upsert failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Matches successfully synced from worldcup26.ir',
      count: data?.length || 0,
      data: data?.slice(0, 5),
    });
  } catch (err: any) {
    console.error('Error syncing matches:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
