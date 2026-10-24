import { NextRequest, NextResponse } from 'next/server';
import { validateTokenStatus, hashToken } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getClientIp, rateLimit, isValidTokenFormat } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: max 20 token validations per minute per IP
    const rl = rateLimit(`token-validate:${clientIp}`, 20, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan validasi token. Silakan tunggu ${rl.retryAfterSeconds} detik.`,
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

    const cleanToken = token.trim();

    // Enforce strict token format (8-30 chars, alphanumeric & hyphens only)
    if (!isValidTokenFormat(cleanToken)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format token tidak valid. Pastikan token terdiri dari huruf, angka, dan tanda hubung tanpa spasi.',
        },
        { status: 400 }
      );
    }

    // 1. Validate against Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabase) {
      const hashed = hashToken(cleanToken);
      const { data, error } = await supabase.rpc('validate_token', {
        p_token_hash: hashed,
      });

      if (!error && data) {
        if (!data.valid) {
          return NextResponse.json(
            {
              success: false,
              error: data.error,
              status: data.status,
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          valid: true,
          className: data.className || 'Siswa SMKN 4',
          message: 'Token valid. Silakan tentukan pilihan Anda dengan cermat.',
        });
      }
    }

    // 2. Fallback to local storage engine
    const result = validateTokenStatus(cleanToken);

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
