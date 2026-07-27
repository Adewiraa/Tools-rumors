import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_APP_SETTINGS } from '@/logic/utils';

export const runtime = 'nodejs';
export const revalidate = 0;

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

export async function GET(request: Request) {
  try {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('app_logo_url')
      .eq('id', 'gosball')
      .maybeSingle();

    if (data?.app_logo_url) {
      const logoUrl = data.app_logo_url;
      if (logoUrl.startsWith('http')) {
        return NextResponse.redirect(logoUrl, {
          status: 307,
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        });
      }
    }
  } catch (e) {
    console.warn('Dynamic icon route fetch error:', e);
  }

  return NextResponse.redirect(DEFAULT_APP_SETTINGS.appLogoSrc || '/icons/gosball-512.png', {
    status: 307,
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
}
