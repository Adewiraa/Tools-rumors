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

const mapUserFromSupabase = (row: any): AppUser => ({
  id: row.id,
  username: row.username,
  password: row.password_hash || '',
  fullName: row.full_name || '',
  role: row.role || 'Match Editor',
  status: row.status === 'inactive' ? 'inactive' : 'active',
  avatarUrl: row.avatar_url || '',
  tenantId: row.tenant_id || row.tenantId || 'gosball',
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
    const { username, password, fullName, role, status } = body;

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
    };

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .insert([newUserRow])
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
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
    const { id, username, password, fullName, role, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID user wajib disertakan.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (username !== undefined) updatePayload.username = String(username).trim().toLowerCase();
    if (password !== undefined && password !== '') updatePayload.password_hash = String(password).trim();
    if (fullName !== undefined) updatePayload.full_name = String(fullName).trim();
    if (role !== undefined) updatePayload.role = String(role);
    if (status !== undefined) updatePayload.status = String(status);

    const { data, error } = await supabaseAdmin
      .from('app_users')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
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
