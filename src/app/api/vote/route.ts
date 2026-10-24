import { NextRequest, NextResponse } from 'next/server';
import { castVote, hashToken } from '@/lib/storage';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, candidate_ketua_id, candidate_wakil_id } = body;

    // Basic payload validations
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token pemilihan tidak valid atau kosong.' },
        { status: 400 }
      );
    }

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

    // If Supabase is fully configured with service role, invoke atomic RPC
    if (isSupabaseConfigured && supabaseAdmin) {
      const hashed = hashToken(token);
      const { data, error } = await supabaseAdmin.rpc('cast_vote', {
        p_token_hash: hashed,
        p_candidate_ketua_id: candidate_ketua_id,
        p_candidate_wakil_id: candidate_wakil_id,
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

    // Built-in storage engine atomic operation
    const result = castVote(token, candidate_ketua_id, candidate_wakil_id);

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
