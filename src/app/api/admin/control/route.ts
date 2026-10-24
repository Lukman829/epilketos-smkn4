import { NextRequest, NextResponse } from 'next/server';
import {
  adminToggleElectionStatus,
  adminPublishResults,
  getPublicElectionSettings,
} from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'Bearer epilketos-admin-authorized-token') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const body = await req.json();
    const actor = req.headers.get('x-admin-name') || 'Admin Panitia';
    const { action, status, is_published } = body;

    if (action === 'set_status') {
      if (!['not_started', 'ongoing', 'closed'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Status pemilihan tidak valid.' },
          { status: 400 }
        );
      }

      const updated = adminToggleElectionStatus(status, actor);
      return NextResponse.json({
        success: true,
        settings: updated,
        message: `Status pemilihan berhasil diubah menjadi: ${status}.`,
      });
    }

    if (action === 'publish_results') {
      const updated = adminPublishResults(Boolean(is_published), actor);
      return NextResponse.json({
        success: true,
        settings: updated,
        message: is_published
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
