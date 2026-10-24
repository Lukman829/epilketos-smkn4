import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/security';
import {
  getPublicElectionSettings,
  getAllTokens,
  getAllClasses,
  getAuditLogs,
  store,
} from '@/lib/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Sesi tidak sah atau telah berakhir.' },
        { status: 401 }
      );
    }

    // 1. Fetch live metrics from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { data: supaRes } = await supabase.rpc('get_election_results', { p_is_admin: true });
      const { data: supaClasses } = await supabase
        .from('classes')
        .select('*')
        .in('major', ['TKJ', 'TSM', 'TKRO', 'TBSM', 'MPLB', 'AK', 'TEI', 'TITL'])
        .order('name');
      const { data: supaAudit } = await supabase.rpc('admin_get_audit_logs', { p_limit: 15 });

      if (supaRes && Array.isArray(supaClasses)) {
        const classStats = supaClasses.map((c: any) => ({
          id: c.id,
          name: c.name,
          quota: c.voter_quota,
          tokens_generated: c.tokens_generated || 0,
          voted_count: c.voted_count || 0,
          turnout_percentage: c.voter_quota > 0 ? Math.round(((c.voted_count || 0) / c.voter_quota) * 100) : 0,
        }));

        return NextResponse.json({
          success: true,
          stats: {
            total_eligible_voters: supaRes.total_eligible_voters,
            total_tokens_issued: supaRes.total_tokens_issued,
            total_tokens_used: supaRes.total_tokens_used,
            total_tokens_unused: Math.max(0, supaRes.total_tokens_issued - supaRes.total_tokens_used),
            total_tokens_revoked: 0,
            total_ballots_recorded: supaRes.total_ballots,
            turnout_percentage: supaRes.turnout_percentage,
            election_status: supaRes.settings?.status || 'ongoing',
            is_results_published: supaRes.is_published,
            results_published_at: supaRes.published_at,
          },
          class_stats: classStats,
          recent_audit_logs: Array.isArray(supaAudit) ? supaAudit : getAuditLogs().slice(0, 15),
        });
      }
    }

    // 2. Fallback to in-memory store
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
