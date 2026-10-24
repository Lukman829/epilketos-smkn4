import { NextRequest, NextResponse } from 'next/server';
import { castVote, hashToken, store } from '@/lib/storage';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getClientIp, rateLimit, isValidTokenFormat } from '@/lib/security';

const CANDIDATE_ID_REGEX = /^[a-zA-Z0-9\-_]{1,50}$/;

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Vote rate limiting: max 10 submissions per minute per IP to prevent automated ballot stuffing
    const rl = rateLimit(`vote:${clientIp}`, 10, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak permintaan pengiriman suara dari koneksi ini. Silakan tunggu ${rl.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { token, candidate_ketua_id, candidate_wakil_id } = body;

    // 1. Token validation
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token pemilihan tidak valid atau kosong.' },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    if (!isValidTokenFormat(cleanToken)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format token pemilihan tidak valid.',
        },
        { status: 400 }
      );
    }

    // 2. Candidate selections validation
    if (!candidate_ketua_id || typeof candidate_ketua_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Pilihan Calon Ketua OSIS belum ditentukan.' },
        { status: 400 }
      );
    }

    if (!candidate_wakil_id || typeof candidate_wakil_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Pilihan Calon Wakil Ketua OSIS belum ditentukan.' },
        { status: 400 }
      );
    }

    const cleanKetuaId = candidate_ketua_id.trim();
    const cleanWakilId = candidate_wakil_id.trim();

    if (!CANDIDATE_ID_REGEX.test(cleanKetuaId) || !CANDIDATE_ID_REGEX.test(cleanWakilId)) {
      return NextResponse.json(
        { success: false, error: 'Identifier kandidat tidak valid.' },
        { status: 400 }
      );
    }

    // 3. Fast-check election status
    if (store.settings.status === 'not_started') {
      return NextResponse.json(
        { success: false, error: 'Pemilihan belum dibuka oleh panitia pelaksana.' },
        { status: 400 }
      );
    }

    if (store.settings.status === 'closed') {
      return NextResponse.json(
        { success: false, error: 'Pemilihan telah resmi ditutup oleh panitia.' },
        { status: 400 }
      );
    }

    // 4. If Supabase is fully configured with service role, invoke atomic RPC
    if (isSupabaseConfigured && supabaseAdmin) {
      const hashed = hashToken(cleanToken);
      const { data, error } = await supabaseAdmin.rpc('cast_vote', {
        p_token_hash: hashed,
        p_candidate_ketua_id: cleanKetuaId,
        p_candidate_wakil_id: cleanWakilId,
      });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }

      if (!data?.success) {
        return NextResponse.json(
          { success: false, error: data?.error || 'Gagal memproses suara.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'SUARAMU TELAH TERCATAT.',
        timestamp: data.timestamp,
      });
    }

    // 5. Built-in storage engine atomic operation
    const result = castVote(cleanToken, cleanKetuaId, cleanWakilId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SUARAMU TELAH TERCATAT.',
      timestamp: result.timestamp,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Kesalahan server dalam memproses suara';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
