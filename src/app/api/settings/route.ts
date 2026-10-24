import { NextResponse } from 'next/server';
import { getPublicElectionSettings } from '@/lib/storage';

export async function GET() {
  try {
    const settings = getPublicElectionSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat pengaturan pemilihan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
