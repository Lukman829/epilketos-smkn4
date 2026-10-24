import { NextRequest, NextResponse } from 'next/server';
import {
  getAllTokens,
  adminGenerateBatchTokens,
  adminRevokeToken,
} from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'Bearer epilketos-admin-authorized-token') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id');
    const status = searchParams.get('status');

    let tokens = getAllTokens();

    if (classId && classId !== 'all') {
      tokens = tokens.filter((t) => t.class_id === classId);
    }

    if (status && status !== 'all') {
      tokens = tokens.filter((t) => t.status === status);
    }

    return NextResponse.json({
      success: true,
      total: tokens.length,
      tokens: tokens.map((t) => ({
        id: t.id,
        preview: t.token_preview,
        plain: t.plain_token || t.token_preview,
        class_id: t.class_id,
        class_name: t.class_name,
        status: t.status,
        created_at: t.created_at,
        used_at: t.used_at,
        revoked_at: t.revoked_at,
        revoked_reason: t.revoked_reason,
        replacement_token_id: t.replacement_token_id,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat token';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'Bearer epilketos-admin-authorized-token') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const body = await req.json();
    const actor = req.headers.get('x-admin-name') || 'Admin Panitia';

    const { class_id, count } = body;

    if (!class_id || !count || count <= 0) {
      return NextResponse.json(
        { success: false, error: 'Kelas dan jumlah token (minimal 1) wajib ditentukan.' },
        { status: 400 }
      );
    }

    const result = adminGenerateBatchTokens(class_id, Number(count), actor);

    return NextResponse.json({
      success: true,
      batch: result.batch,
      generated: result.generatedTokens,
      count: result.generatedTokens.length,
      message: `${result.generatedTokens.length} token acak kriptografis berhasil dibuat untuk ${result.batch.class_name}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membuat batch token';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'Bearer epilketos-admin-authorized-token') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const body = await req.json();
    const actor = req.headers.get('x-admin-name') || 'Admin Panitia';

    const { token_id, reason, generate_replacement } = body;

    if (!token_id || !reason) {
      return NextResponse.json(
        { success: false, error: 'ID token dan alasan pembatalan wajib diisi.' },
        { status: 400 }
      );
    }

    const result = adminRevokeToken(token_id, reason, Boolean(generate_replacement), actor);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Token berhasil dibatalkan.',
      replacement_token: result.replacementToken,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal membatalkan token';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
