import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/security';
import { getAuditLogs } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    const logs = getAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat log audit';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
