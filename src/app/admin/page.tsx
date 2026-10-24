'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  CheckCircle2,
  Users,
  Vote,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileText,
  Sliders,
} from 'lucide-react';
import { AuditLog } from '@/types/election';

interface DashboardStats {
  total_eligible_voters: number;
  total_tokens_issued: number;
  total_tokens_used: number;
  total_tokens_unused: number;
  total_tokens_revoked: number;
  total_ballots_recorded: number;
  turnout_percentage: number;
  election_status: string;
  is_results_published: boolean;
  results_published_at: string | null;
}

interface ClassStat {
  id: string;
  name: string;
  quota: number;
  tokens_generated: number;
  voted_count: number;
  turnout_percentage: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [classStats, setClassStats] = useState<ClassStat[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const token = sessionStorage.getItem('epilketos_admin_token');
        const res = await fetch('/api/admin/overview', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setClassStats(data.class_stats || []);
          setAuditLogs(data.recent_audit_logs || []);
        }
      } catch (err) {
        console.error('Failed to load admin overview', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOverview();
  }, []);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ongoing':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PEMILIHAN SEDANG DIBUKA</span>
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono font-bold">
            PEMILIHAN DITUTUP
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono font-bold">
            BELUM DIBUKA
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome & Election Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ikhtisar Manajemen Pemilihan
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring langsung data pemungutan suara &amp; kontrol distribusi token
          </p>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(stats?.election_status)}
          <Link
            href="/admin/control"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Kontrol Status</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tokens Issued */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono uppercase font-bold">Token Diterbitkan</span>
            <KeyRound className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats?.total_tokens_issued || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Dari alokasi total {stats?.total_eligible_voters || 0} pemilih
          </p>
        </div>

        {/* Tokens Used & Ballots */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono uppercase font-bold">Suara Sah Masuk</span>
            <Vote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {stats?.total_ballots_recorded || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Tingkat Partisipasi: <strong className="text-slate-800">{stats?.turnout_percentage || 0}%</strong>
          </p>
        </div>

        {/* Tokens Unused */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono uppercase font-bold">Token Belum Dipakai</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats?.total_tokens_unused || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Siap digunakan di bilik suara
          </p>
        </div>

        {/* Tokens Revoked */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono uppercase font-bold">Token Dibatalkan</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">
            {stats?.total_tokens_revoked || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Alasan terekam di log audit
          </p>
        </div>
      </div>

      {/* Aggregate Class Participation Progress */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Tingkat Partisipasi Per Kelas
            </h2>
            <p className="text-xs text-slate-500">
              Agregat suara yang telah masuk tanpa membuka pilihan individual siswa
            </p>
          </div>
          <Link
            href="/admin/classes"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Kelola Kelas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
          {classStats.map((cls) => (
            <div
              key={cls.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-slate-900">{cls.name}</span>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {cls.turnout_percentage}%
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${cls.turnout_percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Masuk: {cls.voted_count}</span>
                <span>Kuota: {cls.quota}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Audit Activity Feed */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Riwayat Aktivitas Administratif Terbaru</span>
            </h2>
            <p className="text-xs text-slate-500">
              Audit log terproteksi untuk kepatuhan transparansi pemilihan
            </p>
          </div>
          <Link
            href="/admin/audit"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Seluruh Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {auditLogs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono font-bold text-[10px]">
                  {log.action}
                </span>
                <span className="text-slate-700 font-medium">
                  {JSON.stringify(log.details)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                <span>{log.actor}</span>
                <span>{new Date(log.created_at).toLocaleTimeString('id-ID')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
