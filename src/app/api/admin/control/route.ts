import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/security';
import {
  adminToggleElectionStatus,
  adminPublishResults,
} from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
    const { action, status, is_published } = body;

    if (action === 'set_status') {
      if (!['not_started', 'ongoing', 'closed'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Status pemilihan tidak valid.' },
          { status: 400 }
        );
      }

      // 1. Persist to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        await supabase.rpc('admin_toggle_status', {
          p_status: status,
          p_updated_by: admin.name,
        });
      }

      const updated = adminToggleElectionStatus(status, admin.name);
      return NextResponse.json({
        success: true,
        settings: updated,
        message: `Status pemilihan berhasil diubah menjadi: ${status}.`,
      });
    }

    if (action === 'publish_results') {
      const isPub = Boolean(is_published);

      // 1. Persist to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        await supabase.rpc('admin_publish_results', {
          p_is_published: isPub,
          p_published_by: admin.name,
        });
      }

      const updated = adminPublishResults(isPub, admin.name);
      return NextResponse.json({
        success: true,
        settings: updated,
        message: isPub
          ? 'Hasil pemilihan berhasil dipublikasikan secara resmi ke publik.'
          : 'Publikasi hasil pemilihan resmi telah ditarik kembali.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Aksi kontrol tidak dikenali.' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses kontrol pemilihan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
