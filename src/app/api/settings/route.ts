import { NextRequest, NextResponse } from 'next/server';
import { getPublicElectionSettings } from '@/lib/storage';
import { getClientIp, rateLimit } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: max 60 requests per minute per IP
    const rl = rateLimit(`settings:${clientIp}`, 60, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak permintaan pengaturan. Silakan tunggu ${rl.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const settings = getPublicElectionSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat pengaturan pemilihan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
