import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_USERS } from '@/lib/types/auth';
import type { AppUser } from '@/lib/types/auth';

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

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : String(error)
);

const getUserWriteErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('tenant_id')) {
    return 'Database belum siap untuk multi-user. Jalankan supabase_multi_tenant_identity_migration.sql di Supabase SQL Editor, lalu buat ulang user.';
  }
  if (normalized.includes('duplicate') || normalized.includes('unique')) {
    return 'Username sudah dipakai. Gunakan username lain.';
  }
  return message;
};

const slugifyTenantId = (value: string) => (
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
);

const resolveTenantId = (row: any) => {
  const explicitTenantId = String(row.tenant_id || row.tenantId || '').trim();
  if (explicitTenantId && explicitTenantId !== 'default') return explicitTenantId;

  const username = String(row.username || '').toLowerCase();
  const seededUser = INITIAL_USERS.find(user => user.username.toLowerCase() === username);
  if (seededUser?.tenantId) return seededUser.tenantId;

  const usernameSlug = slugifyTenantId(username);
  return usernameSlug && usernameSlug !== 'admin' ? `media-${usernameSlug}` : 'gosball';
};

const mapUserFromSupabase = (row: any): AppUser => ({
  id: row.id,
  username: row.username,
  password: row.password_hash || '',
  fullName: row.full_name || '',
  role: row.role || 'Match Editor',
  status: row.status === 'inactive' ? 'inactive' : 'active',
  avatarUrl: row.avatar_url || '',
  tenantId: resolveTenantId(row),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase app_users GET warning:', error.message);
      return NextResponse.json({ success: true, data: INITIAL_USERS });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: INITIAL_USERS });
    }

    return NextResponse.json({
      success: true,
      data: data.map(mapUserFromSupabase),
    });
  } catch (error: unknown) {
    console.error('Users GET error:', error);
    return NextResponse.json({ success: true, data: INITIAL_USERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, fullName, role, status, tenantId } = body;

    if (!username || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'Username, password, nama lengkap, dan role wajib diisi.' },
        { status: 400 }
      );
    }

    const newUserRow = {
      username: String(username).trim().toLowerCase(),
      password_hash: String(password).trim(),
      full_name: String(fullName).trim(),
      role: String(role),
      status: status || 'active',
      tenant_id: String(tenantId || 'gosball').trim() || 'gosball',
    };

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .insert([newUserRow])
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: getUserWriteErrorMessage(error.message) }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: mapUserFromSupabase(data),
    });
  } catch (error: unknown) {
    console.error('Users POST error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, username, password, fullName, role, status, tenantId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID user wajib disertakan.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (username !== undefined) updatePayload.username = String(username).trim().toLowerCase();
    if (password !== undefined && password !== '') updatePayload.password_hash = String(password).trim();
    if (fullName !== undefined) updatePayload.full_name = String(fullName).trim();
    if (role !== undefined) updatePayload.role = String(role);
    if (status !== undefined) updatePayload.status = String(status);
    if (tenantId !== undefined) updatePayload.tenant_id = String(tenantId).trim() || 'gosball';

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: getUserWriteErrorMessage(error.message) }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: mapUserFromSupabase(data),
    });
  } catch (error: unknown) {
    console.error('Users PUT error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID user wajib disertakan.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    console.error('Users DELETE error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
