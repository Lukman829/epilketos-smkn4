import { NextRequest, NextResponse } from 'next/server';
import { getElectionResults } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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

    // 1. Fetch live results from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('get_election_results', {
        p_is_admin: isAdmin,
      });

      if (!error && data) {
        return NextResponse.json({
          success: true,
          results: data,
        });
      }
    }

    // 2. Fallback to local storage engine
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
