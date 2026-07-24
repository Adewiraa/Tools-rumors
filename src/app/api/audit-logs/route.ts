import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AuditLog } from '@/lib/mockData';

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

const toJakartaTimestamp = () => (
  new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
);

const mapAuditLogFromSupabase = (row: any): AuditLog => ({
  id: String(row.id || ''),
  timestamp: String(row.timestamp || toJakartaTimestamp()),
  user: String(row.user_name || row.user || 'Sistem'),
  action: String(row.action || ''),
  module: String(row.module || ''),
  details: String(row.details || ''),
});

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapAuditLogFromSupabase),
    });
  } catch (error: unknown) {
    console.error('Audit logs GET error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const log = body?.log || body || {};
    const action = String(log.action || '').trim();
    const module = String(log.module || '').trim();
    const details = String(log.details || '').trim();

    if (!action || !module || !details) {
      return NextResponse.json(
        { success: false, error: 'Action, module, dan details audit log wajib diisi.' },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';
    const payload = {
      id: String(log.id || `log-${Date.now()}`),
      timestamp: String(log.timestamp || toJakartaTimestamp()),
      user_name: String(log.user || 'Sistem').trim(),
      action,
      module,
      details,
      ip_address: ipAddress,
      user_agent: request.headers.get('user-agent') || '',
    };

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert([payload])
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mapAuditLogFromSupabase(data),
    });
  } catch (error: unknown) {
    console.error('Audit logs POST error:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
