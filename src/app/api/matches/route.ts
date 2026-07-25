import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role — bypass RLS untuk write operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

const toStringArray = (value: any) => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
);

const toLineupForeignEntries = (value: any) => (
  Array.isArray(value)
    ? value
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          id: String(item.id || `asing-${Date.now()}`),
          name: String(item.name || ''),
          no: Number(item.no) || 0,
          pos: String(item.pos || 'FW'),
        }))
        .filter(item => item.name)
    : []
);

const getDeleteId = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const queryId = searchParams.get('id');
  if (queryId) return queryId;

  const rawBody = await request.text();
  if (!rawBody.trim()) return '';

  try {
    const body = JSON.parse(rawBody);
    return typeof body.id === 'string' ? body.id : '';
  } catch {
    return '';
  }
};

// GET /api/matches — ambil semua matches, urut kickoff terbaru
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('matches')
      .select('*')
      .order('kickoff', { ascending: false });

    if (error) throw error;

    // Map snake_case DB → camelCase interface
    const matches = (data || []).map((m: any) => ({
      id:                   m.id,
      homeClubId:           m.home_club_id || '',
      homeClubName:         m.home_club_name || '',
      homeLogo:             m.home_logo || '',
      awayClubId:           m.away_club_id || '',
      awayClubName:         m.away_club_name || '',
      awayLogo:             m.away_logo || '',
      competition:          m.competition || '',
      season:               m.season || '',
      kickoff:              m.kickoff,
      venue:                m.venue || '',
      status:               m.status || 'Scheduled',
      homeScore:            m.home_score ?? undefined,
      awayScore:            m.away_score ?? undefined,
      halfTimeHomeScore:    m.half_time_home_score ?? undefined,
      halfTimeAwayScore:    m.half_time_away_score ?? undefined,
      lineupStatus:         m.lineup_status || 'Draft',
      publicationStatus:    m.publication_status || 'Draft',
      homeFormation:        m.home_formation || '4-3-3',
      awayFormation:        m.away_formation || '4-2-3-1',
      homeStarters:         toStringArray(m.home_starters),
      homeSubs:             toStringArray(m.home_subs),
      awayStarters:         toStringArray(m.away_starters),
      awaySubs:             toStringArray(m.away_subs),
      homeCaptain:          m.home_captain || '',
      awayCaptain:          m.away_captain || '',
      homeAsing:            toLineupForeignEntries(m.home_asing),
      awayAsing:            toLineupForeignEntries(m.away_asing),
      timeline:             m.timeline || [],
      matchMedia:           m.match_media || undefined,
      editor:               m.editor || 'Admin',
      lastUpdated:          m.last_updated || '',
    }));

    return NextResponse.json({ success: true, data: matches });
  } catch (err: any) {
    console.error('Matches GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/matches — upsert satu match (create atau update)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { match } = body;

    if (!match?.id) {
      return NextResponse.json({ success: false, error: 'Missing match data' }, { status: 400 });
    }

    // Map camelCase → snake_case
    const payload: Record<string, any> = {
      id:                   match.id,
      home_club_id:         match.homeClubId || null,
      home_club_name:       match.homeClubName || '',
      home_logo:            match.homeLogo || '',
      away_club_id:         match.awayClubId || null,
      away_club_name:       match.awayClubName || '',
      away_logo:            match.awayLogo || '',
      competition:          match.competition || '',
      season:               match.season || '',
      kickoff:              match.kickoff,
      venue:                match.venue || '',
      status:               match.status || 'Scheduled',
      lineup_status:        match.lineupStatus || 'Draft',
      publication_status:   match.publicationStatus || 'Draft',
      home_formation:       match.homeFormation || '4-3-3',
      away_formation:       match.awayFormation || '4-2-3-1',
      home_starters:        Array.isArray(match.homeStarters) ? match.homeStarters : [],
      home_subs:            Array.isArray(match.homeSubs) ? match.homeSubs : [],
      away_starters:        Array.isArray(match.awayStarters) ? match.awayStarters : [],
      away_subs:            Array.isArray(match.awaySubs) ? match.awaySubs : [],
      home_captain:         match.homeCaptain || '',
      away_captain:         match.awayCaptain || '',
      home_asing:           Array.isArray(match.homeAsing) ? match.homeAsing : [],
      away_asing:           Array.isArray(match.awayAsing) ? match.awayAsing : [],
      timeline:             Array.isArray(match.timeline) ? match.timeline : [],
      match_media:          match.matchMedia && typeof match.matchMedia === 'object' ? match.matchMedia : null,
      editor:               match.editor || 'Admin',
      last_updated:         new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
    };

    // Sertakan skor jika ada
    if (match.homeScore !== undefined) payload.home_score = match.homeScore;
    if (match.awayScore !== undefined) payload.away_score = match.awayScore;
    if (match.halfTimeHomeScore !== undefined) payload.half_time_home_score = match.halfTimeHomeScore;
    if (match.halfTimeAwayScore !== undefined) payload.half_time_away_score = match.halfTimeAwayScore;

    let result = await supabaseAdmin
      .from('matches')
      .upsert(payload, { onConflict: 'id' });

    if (result.error) {
      console.warn('Supabase upsert warning:', result.error.message);
      // Fallback 1: Remove potentially missing JSON/Media columns
      const retryPayload = { ...payload };
      delete retryPayload.match_media;
      delete retryPayload.timeline;

      const retryResult = await supabaseAdmin
        .from('matches')
        .upsert(retryPayload, { onConflict: 'id' });

      if (retryResult.error) {
        console.warn('Supabase retry 1 warning:', retryResult.error.message);
        // Fallback 2: Remove HT score columns if DB schema doesn't have them yet
        delete retryPayload.half_time_home_score;
        delete retryPayload.half_time_away_score;

        const retryResult2 = await supabaseAdmin
          .from('matches')
          .upsert(retryPayload, { onConflict: 'id' });

        if (retryResult2.error) throw retryResult2.error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Matches POST error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Gagal menyimpan pertandingan.' }, { status: 500 });
  }
}

// DELETE /api/matches — hapus satu match by id
export async function DELETE(request: Request) {
  try {
    const id = await getDeleteId(request);

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Matches DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
