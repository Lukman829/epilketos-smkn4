import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, sanitizeString } from '@/lib/security';
import {
  getAllCandidates,
  adminSaveCandidate,
  adminDeleteCandidate,
} from '@/lib/storage';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    // 1. Fetch from Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('candidates')
        .select('*')
        .order('type', { ascending: true })
        .order('candidate_number', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ success: true, candidates: data });
      }
    }

    // 2. Fallback to local in-memory store
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
      id: sanitizeString(String(body.id || `cand-${Date.now()}`), 50),
      name: sanitizeString(String(body.name), 100),
      grade_major: sanitizeString(String(body.grade_major || ''), 100),
      tagline: sanitizeString(String(body.tagline || ''), 200),
      photo_url: String(body.photo_url || '').trim().slice(0, 500),
      vision: sanitizeString(String(body.vision), 500),
      missions: Array.isArray(body.missions)
        ? body.missions.map((m: unknown) => sanitizeString(String(m), 300)).filter(Boolean)
        : [],
      programs: Array.isArray(body.programs)
        ? body.programs.map((p: unknown) => sanitizeString(String(p), 200)).filter(Boolean)
        : [],
      candidate_number: parseInt(String(body.candidate_number || 1), 10) || 1,
      display_order: parseInt(String(body.display_order || 1), 10) || 1,
      is_active: body.is_active !== false,
    };

    const saved = adminSaveCandidate(sanitizedCandidate, admin.name);

    // Persist to Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin.from('candidates').upsert({
        id: saved.id,
        type: saved.type,
        candidate_number: saved.candidate_number,
        name: saved.name,
        grade_major: saved.grade_major,
        tagline: saved.tagline,
        photo_url: saved.photo_url,
        vision: saved.vision,
        missions: saved.missions,
        programs: saved.programs,
        is_active: saved.is_active,
        display_order: saved.display_order,
        updated_at: new Date().toISOString(),
      });
    }

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

    const cleanId = sanitizeString(id, 50);
    const deleted = adminDeleteCandidate(cleanId, admin.name);

    // Delete from Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin.from('candidates').delete().eq('id', cleanId);
    }

    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus kandidat';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}