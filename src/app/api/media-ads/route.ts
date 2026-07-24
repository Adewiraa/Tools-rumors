import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

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

type MediaAdBody = {
  id?: string;
  title?: string;
  label?: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  posterUrl?: string;
  mimeType?: string;
  fileName?: string;
  fit?: 'contain' | 'cover';
  placement?: 'result_package' | 'lineup_package' | 'all';
  status?: 'active' | 'inactive' | 'archived';
  competition?: string;
  clubId?: string;
  startsAt?: string;
  endsAt?: string;
  sortOrder?: number;
};

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : String(error)
);

const mapFromSupabase = (row: any) => ({
  id: row.id,
  title: row.title || '',
  label: row.label || '',
  mediaType: row.media_type || 'image',
  mediaUrl: row.media_url || '',
  posterUrl: row.poster_url || '',
  mimeType: row.mime_type || '',
  fileName: row.file_name || '',
  fit: row.fit || 'contain',
  placement: row.placement || 'result_package',
  status: row.status || 'active',
  competition: row.competition || '',
  clubId: row.club_id || '',
  startsAt: row.starts_at || '',
  endsAt: row.ends_at || '',
  sortOrder: Number(row.sort_order || 0),
  createdAt: row.created_at || '',
  updatedAt: row.updated_at || '',
});

const toNullableText = (value: unknown) => {
  const text = String(value || '').trim();
  return text || null;
};

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('media_ads')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message.includes('media_ads')
          ? 'Tabel media_ads belum ada. Jalankan supabase_media_ads_migration.sql di Supabase SQL Editor.'
          : error.message,
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: (data || []).map(mapFromSupabase) });
  } catch (error: unknown) {
    console.error('Media ads GET error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as MediaAdBody;
    const title = String(body.title || '').trim();
    const mediaUrl = String(body.mediaUrl || '').trim();

    if (!title) {
      return NextResponse.json({ success: false, error: 'Nama iklan wajib diisi.' }, { status: 400 });
    }

    if (!mediaUrl) {
      return NextResponse.json({ success: false, error: 'File media iklan wajib diupload.' }, { status: 400 });
    }

    const payload = {
      ...(body.id ? { id: body.id } : {}),
      title,
      label: String(body.label || '').trim(),
      media_type: body.mediaType === 'video' ? 'video' : 'image',
      media_url: mediaUrl,
      poster_url: toNullableText(body.posterUrl),
      mime_type: toNullableText(body.mimeType),
      file_name: toNullableText(body.fileName),
      fit: body.fit === 'cover' ? 'cover' : 'contain',
      placement: ['result_package', 'lineup_package', 'all'].includes(String(body.placement))
        ? body.placement
        : 'result_package',
      status: ['active', 'inactive', 'archived'].includes(String(body.status))
        ? body.status
        : 'active',
      competition: toNullableText(body.competition),
      club_id: toNullableText(body.clubId),
      starts_at: toNullableText(body.startsAt),
      ends_at: toNullableText(body.endsAt),
      sort_order: Number(body.sortOrder || 0),
    };

    const { data, error } = await supabaseAdmin
      .from('media_ads')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: mapFromSupabase(data) });
  } catch (error: unknown) {
    console.error('Media ads POST error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID iklan wajib dikirim.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('media_ads')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Media ads DELETE error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
