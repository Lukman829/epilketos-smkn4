import { NextRequest, NextResponse } from 'next/server';
import { getPublicElectionSettings } from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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

    // 1. Fetch from Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('election_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          settings: {
            title: data.title,
            school_name: data.school_name,
            period_name: data.period_name,
            status: data.status,
            is_results_published: data.is_results_published,
            start_time: data.start_time,
            end_time: data.end_time,
            description: data.description,
          },
        });
      }
    }

    // 2. Fallback to local storage
    const settings = getPublicElectionSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat pengaturan pemilihan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
