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
      editor:               match.editor || 'Admin',
      last_updated:         new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
    };

    // Sertakan skor jika ada
    if (match.homeScore !== undefined) payload.home_score = match.homeScore;
    if (match.awayScore !== undefined) payload.away_score = match.awayScore;
    if (match.halfTimeHomeScore !== undefined) payload.half_time_home_score = match.halfTimeHomeScore;
    if (match.halfTimeAwayScore !== undefined) payload.half_time_away_score = match.halfTimeAwayScore;

    const { error } = await supabaseAdmin
      .from('matches')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Matches POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/matches — hapus satu match by id
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

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
