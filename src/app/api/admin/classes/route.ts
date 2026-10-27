import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, sanitizeString } from '@/lib/security';
import { getAllClasses, adminSaveClass } from '@/lib/storage';
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
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return NextResponse.json({ success: true, classes: data });
      }
    }

    // 2. Fallback to local in-memory store
    const classes = getAllClasses();
    return NextResponse.json({ success: true, classes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data kelas';
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

    if (!body.name || body.voter_quota === undefined) {
      return NextResponse.json(
        { success: false, error: 'Nama kelas dan kuota pemilih wajib diisi.' },
        { status: 400 }
      );
    }

    const quota = parseInt(String(body.voter_quota), 10);
    if (isNaN(quota) || quota < 1 || quota > 200) {
      return NextResponse.json(
        { success: false, error: 'Kuota pemilih harus berupa angka valid antara 1 dan 200.' },
        { status: 400 }
      );
    }

    const sanitizedClass = {
      ...body,
      id: sanitizeString(String(body.id || `cls-${Date.now()}`), 50),
      grade: String(body.grade || '10').trim(),
      major: sanitizeString(String(body.major || 'UMUM'), 20),
      name: sanitizeString(String(body.name), 50),
      voter_quota: quota,
    };

    const saved = adminSaveClass(sanitizedClass, admin.name);

    // Persist to Supabase PostgreSQL if configured
    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin.from('classes').upsert({
        id: saved.id,
        grade: saved.grade,
        major: saved.major,
        name: saved.name,
        voter_quota: saved.voter_quota,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, class: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan kelas';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}