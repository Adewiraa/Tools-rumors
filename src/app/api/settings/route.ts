import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_APP_SETTINGS, DEFAULT_MEDIA_TENANTS, normalizeAppSettings } from '@/logic/utils';

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

type AppSettingsRow = {
  app_name?: string | null;
  app_handle?: string | null;
  app_logo_url?: string | null;
  app_subtitle?: string | null;
};

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : String(error)
);

const mapFromSupabase = (settings: AppSettingsRow, tenantId: string) => normalizeAppSettings({
  tenantId,
  appName: settings?.app_name || undefined,
  appHandle: settings?.app_handle || undefined,
  appLogoSrc: settings?.app_logo_url || undefined,
  appSubtitle: settings?.app_subtitle || undefined,
});

function getTenantFallbackSettings(tenantId: string) {
  const matched = DEFAULT_MEDIA_TENANTS.find(t => t.id === tenantId);
  if (matched) {
    return normalizeAppSettings({
      tenantId: matched.id,
      appName: matched.name,
      appHandle: matched.handle,
      appLogoSrc: matched.logoSrc,
      appSubtitle: matched.subtitle,
    });
  }
  return { ...DEFAULT_APP_SETTINGS, tenantId };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'gosball';

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('app_name, app_handle, app_logo_url, app_subtitle')
      .eq('id', tenantId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: data ? mapFromSupabase(data, tenantId) : getTenantFallbackSettings(tenantId),
    });
  } catch (error: unknown) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawSettings = body?.settings || body;
    const tenantId = rawSettings?.tenantId || body?.tenantId || 'default';
    const settings = normalizeAppSettings({ ...rawSettings, tenantId });

    const { error } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        id: tenantId,
        app_name: settings.appName,
        app_handle: settings.appHandle,
        app_logo_url: settings.appLogoSrc,
        app_subtitle: settings.appSubtitle,
      }, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
