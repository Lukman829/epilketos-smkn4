import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, sanitizeString } from '@/lib/security';
import {
  getAllCandidates,
  adminSaveCandidate,
  adminDeleteCandidate,
} from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
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
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.name || !body.type || !body.vision) {
      return NextResponse.json(
        { success: false, error: 'Nama, jabatan (ketua/wakil), dan visi wajib diisi.' },
        { status: 400 }
      );
    }

    if (body.type !== 'ketua' && body.type !== 'wakil') {
      return NextResponse.json(
        { success: false, error: 'Tipe kandidat harus berupa "ketua" atau "wakil".' },
        { status: 400 }
      );
    }

    // Sanitize user-provided text to prevent stored XSS
    const sanitizedCandidate = {
      ...body,
      name: sanitizeString(String(body.name), 100),
      grade_major: sanitizeString(String(body.grade_major || ''), 100),
      tagline: sanitizeString(String(body.tagline || ''), 200),
      vision: sanitizeString(String(body.vision), 500),
      missions: Array.isArray(body.missions)
        ? body.missions.map((m: unknown) => sanitizeString(String(m), 300))
        : [],
      programs: Array.isArray(body.programs)
        ? body.programs.map((p: unknown) => sanitizeString(String(p), 200))
        : [],
    };

    const saved = adminSaveCandidate(sanitizedCandidate, admin.name);
    return NextResponse.json({ success: true, candidate: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan kandidat';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID kandidat wajib disertakan.' }, { status: 400 });
    }

    const deleted = adminDeleteCandidate(id, admin.name);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus kandidat';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
