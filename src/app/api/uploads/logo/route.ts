import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const ALLOWED_BUCKETS = new Set(['club-logos', 'competition-logos', 'brand-logos', 'media-ads']);

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

type StorageErrorLike = {
  message?: string;
  statusCode?: string;
  status?: number;
};

const isBucketNotFoundError = (error: StorageErrorLike | null) => {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('bucket not found') || error?.statusCode === '404' || error?.status === 404;
};

const isBucketAlreadyExistsError = (error: StorageErrorLike | null) => {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('already exists') || error?.statusCode === '409' || error?.status === 409;
};

const ensurePublicBucket = async (bucket: string) => {
  const { error } = await supabaseAdmin.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: bucket === 'media-ads' ? 1024 * 1024 * 80 : 1024 * 1024 * 5,
    allowedMimeTypes: bucket === 'media-ads'
      ? ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'video/quicktime']
      : ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  });

  if (error && !isBucketAlreadyExistsError(error)) {
    return error.message;
  }

  return null;
};

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
      return NextResponse.json({ success: false, error: 'Bucket upload tidak valid.' }, { status: 400 });
    }

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ success: false, error: 'File wajib diunggah.' }, { status: 400 });
    }

    if (bucket === 'media-ads') {
      if (!fileEntry.type.startsWith('image/') && !fileEntry.type.startsWith('video/')) {
        return NextResponse.json({ success: false, error: 'File media iklan harus berupa gambar atau video.' }, { status: 400 });
      }
    } else if (!fileEntry.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'File harus berupa gambar.' }, { status: 400 });
    }

    const fileExt = fileEntry.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    let uploadResult = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, fileEntry, {
        cacheControl: '3600',
        contentType: fileEntry.type,
        upsert: true,
      });

    if (uploadResult.error && isBucketNotFoundError(uploadResult.error)) {
      const bucketError = await ensurePublicBucket(bucket);

      if (bucketError) {
        return NextResponse.json(
          { success: false, error: `Bucket ${bucket} belum ada dan gagal dibuat otomatis: ${bucketError}` },
          { status: 400 }
        );
      }

      uploadResult = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, fileEntry, {
          cacheControl: '3600',
          contentType: fileEntry.type,
          upsert: true,
        });
    }

    if (uploadResult.error) {
      return NextResponse.json({ success: false, error: uploadResult.error.message }, { status: 400 });
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
