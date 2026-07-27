import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_APP_SETTINGS, normalizeAppSettings } from '@/logic/utils';

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
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId') || 'gosball';

  let appName = DEFAULT_APP_SETTINGS.appName;
  let appLogoSrc = DEFAULT_APP_SETTINGS.appLogoSrc;

  try {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('app_name, app_logo_url')
      .eq('id', tenantId)
      .maybeSingle();

    if (data) {
      const normalized = normalizeAppSettings({
        appName: data.app_name || undefined,
        appLogoSrc: data.app_logo_url || undefined,
      });
      appName = normalized.appName;
      appLogoSrc = normalized.appLogoSrc;
    }
  } catch (e) {
    console.warn('Dynamic manifest fetch settings error:', e);
  }

  const iconUrl = appLogoSrc || '/icons/gosball-512.png';

  const manifest = {
    name: appName || 'Gosball',
    short_name: appName || 'Gosball',
    description: 'Dashboard operasional admin dan editor media sepak bola Indonesia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#0A0A0A',
    orientation: 'any',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
