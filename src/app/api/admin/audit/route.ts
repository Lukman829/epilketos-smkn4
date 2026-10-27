import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/security';
import { getAuditLogs } from '@/lib/storage';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    // 1. Fetch from Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc('admin_get_audit_logs', { p_limit: 100 });
      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ success: true, logs: data });
      }
    }

    // 2. Fallback to local in-memory store
    const logs = getAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat log audit';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}