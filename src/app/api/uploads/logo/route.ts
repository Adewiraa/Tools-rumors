import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const ALLOWED_BUCKETS = new Set(['club-logos', 'competition-logos']);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Server upload belum dikonfigurasi. Pastikan SUPABASE_SERVICE_ROLE_KEY tersedia di environment.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const bucket = String(formData.get('bucket') || '');
    const folder = slugify(String(formData.get('folder') || 'logo')) || 'logo';

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ success: false, error: 'Bucket logo tidak valid.' }, { status: 400 });
    }

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ success: false, error: 'File logo wajib diunggah.' }, { status: 400 });
    }

    if (!fileEntry.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'File harus berupa gambar.' }, { status: 400 });
    }

    const fileExt = fileEntry.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, fileEntry, {
        cacheControl: '3600',
        contentType: fileEntry.type,
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        path: filePath,
        publicUrl: data.publicUrl,
      },
    });
  } catch (error) {
    console.error('Logo upload API error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
