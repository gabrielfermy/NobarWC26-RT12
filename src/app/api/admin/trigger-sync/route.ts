import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Kamus terjemahan nama negara/tim ke Bahasa Indonesia yang komprehensif
const teamTranslations: Record<string, string> = {
  "Mexico": "Meksiko",
  "South Africa": "Afrika Selatan",
  "South Korea": "Korea Selatan",
  "Czechia": "Republik Ceko",
  "Czech Republic": "Republik Ceko",
  "Canada": "Kanada",
  "Bosnia-Herzegovina": "Bosnia & Herzegovina",
  "Bosnia and Herzegovina": "Bosnia & Herzegovina",
  "United States": "Amerika Serikat",
  "USA": "Amerika Serikat",
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

export async function POST(request: NextRequest) {
  try {
    // 1. Dapatkan Bearer token dari request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // 2. Dapatkan identitas user dari Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 3. Verifikasi role admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 4. Fetch data dari ESPN API Scoreboard (dates range 2026-06-11 s/d 2026-07-19)
    console.log('Fetching World Cup data from ESPN API via trigger sync...');
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=200&dates=20260611-20260719';
    const response = await fetch(url, { cache: 'no-store' });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from ESPN API: ${response.statusText}` },
        { status: 502 }
      );
    }

    const rawData = await response.json();
    const rawEvents = rawData.events || [];

    // Ambil data pertandingan yang sudah ada di database untuk mempertahankan nobar fields
    const { data: existingMatches } = await supabaseAdmin
      .from('matches')
      .select('id, is_nobar, nobar_location, nobar_pre_minutes');

    const existingMap = new Map<string, any>();
    existingMatches?.forEach(m => {
      existingMap.set(m.id, {
        is_nobar: m.is_nobar,
        nobar_location: m.nobar_location,
        nobar_pre_minutes: m.nobar_pre_minutes
      });
    });

    // 5. Transformasi data dari ESPN
    const formattedMatches = rawEvents.map((event: any) => {
      const competition = event.competitions?.[0];
      if (!competition) return null;

      const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'home');
      const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'away');
      if (!homeCompetitor || !awayCompetitor) return null;

      const teamAName = translateTeam(homeCompetitor.team?.displayName || 'Tim A');
      const teamBName = translateTeam(awayCompetitor.team?.displayName || 'Tim B');

      const stadiumName = competition.venue?.fullName || 'Stadion Piala Dunia 2026';
      
      // Tentukan babak (stage) secara dinamis
      let stageName = 'Fase Grup';
      const altNote = competition.altGameNote || '';
      if (altNote.includes('Group')) {
        const match = altNote.match(/Group\s+([A-L])/i);
        stageName = match ? `Fase Grup - Grup ${match[1].toUpperCase()}` : 'Fase Grup';
      } else {
        const slug = event.season?.slug || '';
        if (slug.includes('round-of-32') || altNote.includes('Round of 32')) {
          stageName = 'Babak 32 Besar';
        } else if (slug.includes('round-of-16') || altNote.includes('Round of 16') || altNote.includes('Rd of 16')) {
          stageName = 'Babak 16 Besar';
        } else if (slug.includes('quarterfinal') || altNote.includes('Quarterfinals')) {
          stageName = 'Perempat Final';
        } else if (slug.includes('semifinal') || altNote.includes('Semifinals')) {
          stageName = 'Semifinal';
        } else if (slug.includes('third') || altNote.includes('3rd-Place Match')) {
          stageName = 'Perebutan Tempat Ketiga';
        } else if (slug.includes('final') || altNote.includes('Final')) {
          stageName = 'Final';
        } else {
          stageName = event.season?.displayName || 'Babak Gugur';
        }
      }

      const isCompleted = competition.status?.type?.completed === true;
      const isLive = competition.status?.type?.state === 'in';
      const statusMapped = isCompleted ? 'completed' : (isLive ? 'ongoing' : 'scheduled');

      const scoreA = (isCompleted || isLive) && homeCompetitor.score !== undefined ? parseInt(homeCompetitor.score, 10) : null;
      const scoreB = (isCompleted || isLive) && awayCompetitor.score !== undefined ? parseInt(awayCompetitor.score, 10) : null;

      const idPadding = String(event.id).padStart(12, '0');
      const gameUuid = `00000000-0000-0000-0000-${idPadding}`;

      const existing = existingMap.get(gameUuid);

      return {
        id: gameUuid,
        team_a: teamAName,
        team_b: teamBName,
        match_time: event.date,
        stage: stageName,
        score_a: scoreA,
        score_b: scoreB,
        status: statusMapped,
        stadium: stadiumName,
        is_nobar: existing ? existing.is_nobar : false,
        nobar_location: existing ? existing.nobar_location : null,
        nobar_pre_minutes: existing ? existing.nobar_pre_minutes : 30
      };
    }).filter(Boolean);

    // 6. Upsert ke database Supabase
    const { data, error } = await supabaseAdmin
      .from('matches')
      .upsert(formattedMatches, { onConflict: 'id' })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Matches successfully synced from ESPN API via trigger',
      count: data?.length || 0
    });

  } catch (err: any) {
    console.error('Trigger sync error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
