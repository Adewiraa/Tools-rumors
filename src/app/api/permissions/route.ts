import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { INITIAL_ROLE_PERMISSIONS } from '@/lib/types/auth';
import type { RolePermission, UserRole, ActiveMenu } from '@/lib/types/auth';

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

const mapPermissionFromSupabase = (row: any): RolePermission => ({
  role: row.role as UserRole,
  allowedMenus: normalizeAllowedMenus(row.role, Array.isArray(row.allowed_menus) ? row.allowed_menus : []),
  updatedAt: row.updated_at,
});

const normalizeAllowedMenus = (role: string, menus: string[]): ActiveMenu[] => {
  const next = new Set(menus);
  if ((role === 'Super Admin' || role === 'Admin Data') && (next.has('clubs') || next.has('players') || next.has('competitions'))) {
    next.add('media-ads');
  }
  return Array.from(next) as ActiveMenu[];
};

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select('*');

    if (error) {
      console.warn('Supabase role_permissions GET warning:', error.message);
      return NextResponse.json({ success: true, data: INITIAL_ROLE_PERMISSIONS });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: INITIAL_ROLE_PERMISSIONS });
    }

    return NextResponse.json({
      success: true,
      data: data.map(mapPermissionFromSupabase),
    });
  } catch (error: unknown) {
    console.error('Permissions GET error:', error);
    return NextResponse.json({ success: true, data: INITIAL_ROLE_PERMISSIONS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const permissions = body?.permissions as RolePermission[];

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'Format data permissions harus berupa array.' },
        { status: 400 }
      );
    }

    const payload = permissions.map(p => ({
      role: p.role,
      allowed_menus: p.allowedMenus,
    }));

    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .upsert(payload, { onConflict: 'role' })
      .select('*');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: data ? data.map(mapPermissionFromSupabase) : permissions,
    });
  } catch (error: unknown) {
    console.error('Permissions POST error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
