import { NextRequest, NextResponse } from 'next/server';
import { getElectionResults } from '@/lib/storage';
import { getAdminFromRequest } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const isDemoMode = searchParams.get('demo') === 'true';
    const admin = getAdminFromRequest(req);
    const isAdmin = admin !== null;

    const results = getElectionResults(isAdmin);

    // If demo mode is explicitly requested, generate realistic demonstration figures
    // while explicitly marking them with is_demo = true!
    if (isDemoMode) {
      return NextResponse.json({
        success: true,
        is_demo: true,
        demo_notice: 'PERHATIAN: Ini adalah simulasi visual grafis (Mode DEMO) dan BUKAN hasil resmi.',
        results: {
          ...results,
          is_published: true,
          published_at: new Date().toISOString(),
          total_ballots: 684,
          turnout_percentage: 95.8,
          ketua_results: results.ketua_results.map((c, i) => {
            const demoVotes = [285, 230, 169][i] || 100;
            return {
              ...c,
              votes: demoVotes,
              percentage: Math.round((demoVotes / 684) * 1000) / 10,
            };
          }),
          wakil_results: results.wakil_results.map((w, i) => {
            const demoVotes = [174, 152, 118, 98, 82, 60][i] || 50;
            return {
              ...w,
              votes: demoVotes,
              percentage: Math.round((demoVotes / 684) * 1000) / 10,
            };
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      is_demo: false,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat rekapitulasi hasil';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
