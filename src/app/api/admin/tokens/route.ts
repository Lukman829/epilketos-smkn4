import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, sanitizeString } from '@/lib/security';
import {
  getAllTokens,
  adminGenerateBatchTokens,
  adminRevokeToken,
} from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id') || 'all';
    const status = searchParams.get('status') || 'all';

    // 1. Fetch from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('admin_get_tokens', {
        p_class_id: classId,
        p_status: status,
      });

      if (!error && Array.isArray(data)) {
        return NextResponse.json({
          success: true,
          total: data.length,
          tokens: data,
        });
      }
    }

    // 2. Fallback to local in-memory store
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
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { class_id, count } = body;

    const tokenCount = parseInt(String(count), 10);
    if (!class_id || isNaN(tokenCount) || tokenCount <= 0 || tokenCount > 100) {
      return NextResponse.json(
        { success: false, error: 'Kelas dan jumlah token (antara 1 hingga 100) wajib ditentukan.' },
        { status: 400 }
      );
    }

    const result = adminGenerateBatchTokens(class_id, tokenCount, admin.name);

    // Persist to Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabase) {
      const supaTokens = result.fullTokens.map((t) => ({
        id: t.id,
        token_hash: t.token_hash,
        token_preview: t.token_preview,
        plain_token: t.plain_token,
        class_id: t.class_id,
        batch_id: t.batch_id,
      }));

      await supabase.rpc('admin_generate_batch_tokens', {
        p_batch_id: result.batch.id,
        p_batch_name: result.batch.batch_name,
        p_class_id: result.batch.class_id,
        p_total_tokens: result.generatedTokens.length,
        p_created_by: admin.name,
        p_tokens: supaTokens,
      });
    }

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
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { token_id, reason, generate_replacement } = body;

    if (!token_id || !reason) {
      return NextResponse.json(
        { success: false, error: 'ID token dan alasan pembatalan wajib diisi.' },
        { status: 400 }
      );
    }

    const sanitizedReason = sanitizeString(String(reason), 200);
    const result = adminRevokeToken(token_id, sanitizedReason, Boolean(generate_replacement), admin.name);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Persist revocation to Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabase) {
      const replacementPayload = result.replacementRecord
        ? {
            id: result.replacementRecord.id,
            token_hash: result.replacementRecord.token_hash,
            token_preview: result.replacementRecord.token_preview,
            plain_token: result.replacementRecord.plain_token,
            class_id: result.replacementRecord.class_id,
            batch_id: result.replacementRecord.batch_id,
          }
        : null;

      await supabase.rpc('admin_revoke_token', {
        p_token_id: token_id,
        p_reason: sanitizedReason,
        p_replacement: replacementPayload,
        p_revoked_by: admin.name,
      });
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
