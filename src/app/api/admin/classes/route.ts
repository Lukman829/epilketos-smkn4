import { NextRequest, NextResponse } from 'next/server';
import { getAllClasses, adminSaveClass } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'Bearer epilketos-admin-authorized-token') {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const classes = getAllClasses();
    return NextResponse.json({ success: true, classes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data kelas';
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

    if (!body.name || body.voter_quota === undefined) {
      return NextResponse.json(
        { success: false, error: 'Nama kelas dan kuota pemilih wajib diisi.' },
        { status: 400 }
      );
    }

    const saved = adminSaveClass(body, actor);
    return NextResponse.json({ success: true, class: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan kelas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
