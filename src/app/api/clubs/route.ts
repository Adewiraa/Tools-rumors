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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { club } = body;

    if (!club) {
      return NextResponse.json({ success: false, error: 'Missing club data' }, { status: 400 });
    }

    const supabasePayload = {
      id: club.id,
      name: club.name,
      short_name: club.shortName,
      slug: club.code?.toLowerCase(),
      country: club.country || 'Indonesia',
      city: club.city,
      stadium: club.stadium,
      coach: club.coach,
      primary_color: club.homeColor,
      secondary_color: club.awayColor,
      home_color: club.homeColor,
      away_color: club.awayColor,
      third_color: club.thirdColor,
      logo_public_url: club.logoUrl,
    };

    const { error } = await supabaseAdmin
      .from('clubs')
      .upsert(supabasePayload, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Club API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = await getDeleteId(request);

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('clubs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Club DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
