import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'Bearer epilketos-admin-authorized-token') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const logs = getAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat log audit';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
