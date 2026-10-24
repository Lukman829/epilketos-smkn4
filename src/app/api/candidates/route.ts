import { NextResponse } from 'next/server';
import { getActiveCandidates } from '@/lib/storage';

export async function GET() {
  try {
    const candidates = getActiveCandidates();
    return NextResponse.json({
      success: true,
      ketua: candidates.ketua,
      wakil: candidates.wakil,
      total_ketua: candidates.ketua.length,
      total_wakil: candidates.wakil.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat kandidat';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
