import { NextRequest, NextResponse } from 'next/server';
import { getElectionResults } from '@/lib/storage';
import { getAdminFromRequest, getClientIp, rateLimit } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: max 60 requests per minute per IP to prevent DoS / automated scraping
    const rl = rateLimit(`results:${clientIp}`, 60, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak permintaan hasil pemilihan. Silakan tunggu ${rl.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

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
