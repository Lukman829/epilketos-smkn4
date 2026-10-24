import { NextRequest, NextResponse } from 'next/server';
import { validateTokenStatus } from '@/lib/storage';

// In-memory rate limiting map (IP -> attempts, reset every minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (record.count >= 20) {
    return false; // Exceeded 20 attempts/minute
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'local';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Terlalu banyak percobaan validasi. Silakan tunggu 1 menit.',
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token pemilihan wajib diisi.' },
        { status: 400 }
      );
    }

    const result = validateTokenStatus(token);

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          status: result.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      className: result.className,
      message: 'Token valid. Silakan tentukan pilihan Anda dengan cermat.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memvalidasi token';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
