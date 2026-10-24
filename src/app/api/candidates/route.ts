import { NextRequest, NextResponse } from 'next/server';
import { getActiveCandidates } from '@/lib/storage';
import { getClientIp, rateLimit } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: max 60 requests per minute per IP
    const rl = rateLimit(`candidates:${clientIp}`, 60, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak permintaan kandidat. Silakan tunggu ${rl.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const candidates = getActiveCandidates();
    return NextResponse.json({
      success: true,
      ketua: candidates.ketua,
      wakil: candidates.wakil,
      total_ketua: candidates.ketua.length,
      total_wakil: candidates.wakil.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat kandidat';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
