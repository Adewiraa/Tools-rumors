import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side only — uses service_role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
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

// GET /api/competitions — ambil semua kompetisi
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('competitions')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/competitions — upsert kompetisi atau kelola relasi club_competitions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, competition, clubId, competitionIds, season } = body;

    // --- Upsert satu kompetisi ---
    if (action === 'upsert' || (!action && competition)) {
      if (!competition) {
        return NextResponse.json({ success: false, error: 'Missing competition data' }, { status: 400 });
      }

      const payload = {
        id: competition.id,
        name: competition.name,
        short_name: competition.shortName || competition.short_name || '',
        slug: competition.slug || competition.name.toLowerCase().replace(/\s+/g, '-'),
        type: competition.type || 'league',
        country: competition.country || 'Indonesia',
        logo_url: competition.logoUrl || competition.logo_url || '',
        season: competition.season || '',
        is_active: competition.isActive !== undefined ? competition.isActive : competition.is_active !== undefined ? competition.is_active : true,
      };

      const { error } = await supabaseAdmin
        .from('competitions')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // --- Simpan relasi club <-> competitions ---
    if (action === 'save_club_competitions') {
      if (!clubId || !Array.isArray(competitionIds)) {
        return NextResponse.json({ success: false, error: 'Missing clubId or competitionIds' }, { status: 400 });
      }

      // Hapus relasi lama untuk club ini pada season yang sama
      const deleteQuery = supabaseAdmin
        .from('club_competitions')
        .delete()
        .eq('club_id', clubId);

      if (season) {
        deleteQuery.eq('season', season);
      }

      const { error: deleteError } = await deleteQuery;
      if (deleteError) {
        return NextResponse.json({ success: false, error: deleteError.message }, { status: 400 });
      }

      // Insert relasi baru
      if (competitionIds.length > 0) {
        const rows = competitionIds.map((cid: string) => ({
          club_id: clubId,
          competition_id: cid,
          season: season || null,
        }));

        const { error: insertError } = await supabaseAdmin
          .from('club_competitions')
          .insert(rows);

        if (insertError) {
          return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
        }
      }

      return NextResponse.json({ success: true });
    }

    // --- Ambil kompetisi milik satu club ---
    if (action === 'get_by_club') {
      if (!clubId) {
        return NextResponse.json({ success: false, error: 'Missing clubId' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('club_competitions')
        .select(`
          competition_id,
          season,
          competitions (
            id, name, short_name, slug, type, country, logo_url, season, is_active
          )
        `)
        .eq('club_id', clubId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Competitions API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/competitions — hapus kompetisi by id
export async function DELETE(request: Request) {
  try {
    const id = await getDeleteId(request);

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('competitions')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
