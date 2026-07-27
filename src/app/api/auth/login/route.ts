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

const slugifyTenantId = (value: string) => (
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
);

const resolveTenantId = (row: Record<string, unknown>, username: string) => {
  const explicitTenantId = String(row.tenant_id || row.tenantId || '').trim();
  if (explicitTenantId && explicitTenantId !== 'default') return explicitTenantId;

  const seededUser = INITIAL_USERS.find(user => user.username.toLowerCase() === username);
  if (seededUser?.tenantId) return seededUser.tenantId;

  const usernameSlug = slugifyTenantId(username);
  return usernameSlug && usernameSlug !== 'admin' ? `media-${usernameSlug}` : 'gosball';
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const usernameNormalized = String(username).trim().toLowerCase();
    const passwordTrimmed = String(password).trim();

    // ── Try Supabase first ───────────────────────────────────────────────────
    let matchedUser: AppUser | null = null;

    try {
      const { data, error } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('username', usernameNormalized)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        // Plain-text password match (password_hash column stores raw password)
        if (data.password_hash === passwordTrimmed) {
          matchedUser = {
            id: data.id,
            username: data.username,
            fullName: data.full_name || '',
            role: data.role || 'Match Editor',
            status: 'active',
            avatarUrl: data.avatar_url || '',
            tenantId: resolveTenantId(data, usernameNormalized),
            createdAt: data.created_at,
          };
        }
      }
    } catch (dbError) {
      // Supabase unreachable — fall through to local fallback
      console.warn('Supabase login query failed, trying local fallback:', dbError);
    }

    // ── Fallback: match against INITIAL_USERS (for dev/offline) ─────────────
    if (!matchedUser) {
      const localUser = INITIAL_USERS.find(
        u =>
          u.username.toLowerCase() === usernameNormalized &&
          u.password === passwordTrimmed &&
          u.status === 'active'
      );
      if (localUser) {
        matchedUser = { ...localUser, password: undefined };
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: 'Username atau password salah, atau akun tidak aktif.' },
        { status: 401 }
      );
    }

    // Strip password from response
    const { ...safeUser } = matchedUser;

    return NextResponse.json({ success: true, data: safeUser });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Login error:', msg);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server saat proses login.' },
      { status: 500 }
    );
  }
}
