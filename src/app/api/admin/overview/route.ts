import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/security';
import {
  getPublicElectionSettings,
  getAllTokens,
  getAllClasses,
  getAuditLogs,
  store,
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

    const settings = getPublicElectionSettings();
    const tokens = getAllTokens();
    const classes = getAllClasses();
    const auditLogs = getAuditLogs().slice(0, 15);

    const totalEligible = classes.reduce((sum, c) => sum + c.voter_quota, 0);
    const totalIssued = tokens.filter((t) => t.status !== 'revoked').length;
    const totalUsed = tokens.filter((t) => t.status === 'used').length;
    const totalUnused = tokens.filter((t) => t.status === 'active').length;
    const totalRevoked = tokens.filter((t) => t.status === 'revoked').length;
    const totalBallots = store.ballots.length;

    const classStats = classes.map((c) => ({
      id: c.id,
      name: c.name,
      quota: c.voter_quota,
      tokens_generated: c.tokens_generated,
      voted_count: c.voted_count,
      turnout_percentage: c.voter_quota > 0 ? Math.round((c.voted_count / c.voter_quota) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        total_eligible_voters: totalEligible,
        total_tokens_issued: totalIssued,
        total_tokens_used: totalUsed,
        total_tokens_unused: totalUnused,
        total_tokens_revoked: totalRevoked,
        total_ballots_recorded: totalBallots,
        turnout_percentage: totalEligible > 0 ? Math.round((totalBallots / totalEligible) * 1000) / 10 : 0,
        election_status: settings.status,
        is_results_published: settings.is_results_published,
        results_published_at: settings.results_published_at,
      },
      class_stats: classStats,
      recent_audit_logs: auditLogs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat ikhtisar admin';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
