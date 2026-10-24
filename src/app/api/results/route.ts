import { NextRequest, NextResponse } from 'next/server';
import { getElectionResults } from '@/lib/storage';
import { getAdminFromRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    const isAdmin = admin !== null;

    const results = getElectionResults(isAdmin);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat rekapitulasi hasil';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
