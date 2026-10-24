import { NextRequest, NextResponse } from 'next/server';
import {
  getAllCandidates,
  adminSaveCandidate,
  adminDeleteCandidate,
} from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'Bearer epilketos-admin-authorized-token') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const candidates = getAllCandidates();
    return NextResponse.json({ success: true, candidates });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat kandidat';
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

    if (!body.name || !body.type || !body.vision) {
      return NextResponse.json(
        { success: false, error: 'Nama, jabatan (ketua/wakil), dan visi wajib diisi.' },
        { status: 400 }
      );
    }

    const saved = adminSaveCandidate(body, actor);
    return NextResponse.json({ success: true, candidate: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan kandidat';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'Bearer epilketos-admin-authorized-token') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const actor = req.headers.get('x-admin-name') || 'Admin Panitia';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID kandidat wajib disertakan.' }, { status: 400 });
    }

    const deleted = adminDeleteCandidate(id, actor);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus kandidat';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
