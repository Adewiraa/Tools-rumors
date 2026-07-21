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

// GET /api/rumors — ambil semua rumors, urut terbaru
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('rumors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rumors = (data || []).map((r: any) => ({
      id: r.id,
      headline: r.headline || '',
      player: r.player || '',
      fromClub: r.from_club || '',
      destinationClub: r.destination_club || '',
      type: r.type || 'rumor',
      reliabilityTier: r.reliability_tier || 'C',
      sourceName: r.source_name || '',
      sourceUrl: r.source_url || '',
      publicationStatus: r.publication_status || 'Draft',
      transferStatus: r.transfer_status || 'Rumor',
      probability: Number(r.probability) || 50,
      shortSummary: r.short_summary || '',
      articleBody: r.article_body || '',
      author: r.author || 'Rumor Editor',
      publishDate: r.publish_date || '',
      playerImageUrl: r.player_image_url || '',
      playerImagePositionX: r.player_image_position_x ?? 50,
      playerImagePositionY: r.player_image_position_y ?? 20,
      playerImageZoom: r.player_image_zoom ?? 100,
      graphicCaption: r.graphic_caption || '',
    }));

    return NextResponse.json({ success: true, data: rumors });
  } catch (err: any) {
    console.error('Rumors GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/rumors — upsert satu rumor (create atau update)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rumor } = body;

    if (!rumor?.id) {
      return NextResponse.json({ success: false, error: 'Missing rumor data' }, { status: 400 });
    }

    const payload: Record<string, any> = {
      id: rumor.id,
      headline: rumor.headline || '',
      player: rumor.player || '',
      from_club: rumor.fromClub || '',
      destination_club: rumor.destinationClub || '',
      type: rumor.type || 'rumor',
      reliability_tier: rumor.reliabilityTier || 'C',
      source_name: rumor.sourceName || '',
      source_url: rumor.sourceUrl || '',
      publication_status: rumor.publicationStatus || 'Draft',
      transfer_status: rumor.transferStatus || 'Rumor',
      probability: Number(rumor.probability) || 50,
      short_summary: rumor.shortSummary || '',
      article_body: rumor.articleBody || '',
      author: rumor.author || 'Rumor Editor',
      publish_date: rumor.publishDate || null,
      player_image_url: rumor.playerImageUrl || '',
      player_image_position_x: rumor.playerImagePositionX ?? 50,
      player_image_position_y: rumor.playerImagePositionY ?? 20,
      player_image_zoom: rumor.playerImageZoom ?? 100,
      graphic_caption: rumor.graphicCaption || '',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('rumors')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Rumors POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/rumors — hapus satu rumor by id
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('rumors')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Rumors DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
