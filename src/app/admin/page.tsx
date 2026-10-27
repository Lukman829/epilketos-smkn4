'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  RefreshCw,
  Search,
  ArrowUpDown,
  Send,
  AlertCircle,
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter & sorting states for Class Participation
  const [searchClass, setSearchClass] = useState('');
  const [filterGrade, setFilterGrade] = useState<'all' | '10' | '11'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [sortOrder, setSortOrder] = useState<'lowest' | 'highest' | 'name'>('lowest');

  const fetchOverview = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
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
        setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to load admin overview', err);
    } finally {
      setIsLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Auto-refresh interval (every 15s when active)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOverview();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchOverview]);

  // Aggregate Counters for Class Participation
  const countLow = useMemo(() => classStats.filter((c) => c.turnout_percentage < 50).length, [classStats]);
  const countMid = useMemo(() => classStats.filter((c) => c.turnout_percentage >= 50 && c.turnout_percentage < 80).length, [classStats]);
  const countHigh = useMemo(() => classStats.filter((c) => c.turnout_percentage >= 80).length, [classStats]);

  // Filtered and sorted classes list
  const filteredClasses = useMemo(() => {
    return classStats
      .filter((cls) => {
        if (searchClass && !cls.name.toLowerCase().includes(searchClass.toLowerCase())) {
          return false;
        }
        if (filterGrade === '10' && !cls.name.toUpperCase().startsWith('X ') && !cls.name.toUpperCase().startsWith('10')) {
          return false;
        }
        if (filterGrade === '11' && !cls.name.toUpperCase().startsWith('XI ') && !cls.name.toUpperCase().startsWith('11')) {
          return false;
        }
        if (filterStatus === 'low' && cls.turnout_percentage >= 50) return false;
        if (filterStatus === 'mid' && (cls.turnout_percentage < 50 || cls.turnout_percentage >= 80)) return false;
        if (filterStatus === 'high' && cls.turnout_percentage < 80) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'lowest') return a.turnout_percentage - b.turnout_percentage;
        if (sortOrder === 'highest') return b.turnout_percentage - a.turnout_percentage;
        return a.name.localeCompare(b.name);
      });
  }, [classStats, searchClass, filterGrade, filterStatus, sortOrder]);

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

      {/* LIVE PROGRESS MONITORING PER KELAS */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Progress Partisipasi Per Kelas</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                Real-Time TPS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pantau kehadiran pemilih per rombel tanpa membuka kerahasiaan pilihan siswa. Gunakan filter untuk jemput bola kelas yang masih rendah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto-Refresh Toggle */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Live Auto (15s)</span>
            </label>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchOverview(true)}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              title="Perbarui data partisipasi sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan'}</span>
            </button>

            {lastUpdated && (
              <span className="text-[11px] text-slate-400 font-mono">
                Update: {lastUpdated}
              </span>
            )}

            <Link
              href="/admin/classes"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-2"
            >
              <span>Kelola Rombel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setFilterStatus('all')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-[11px] font-medium opacity-80">Total Rombel</div>
            <div className="text-xl font-black">{classStats.length} Kelas</div>
          </div>

          <div
            onClick={() => setFilterStatus('low')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'low'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
              <span>Perlu Jemput Bola (&lt;50%)</span>
            </div>
            <div className="text-xl font-black">{countLow} Kelas</div>
          </div>

          <div
            onClick={() => setFilterStatus('mid')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'mid'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <div className="text-[11px] font-medium opacity-80">Sedang Berjalan (50-79%)</div>
            <div className="text-xl font-black">{countMid} Kelas</div>
          </div>

          <div
            onClick={() => setFilterStatus('high')}
            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
              filterStatus === 'high'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <div className="text-[11px] font-medium opacity-80">Selesai / Tinggi (≥80%)</div>
            <div className="text-xl font-black">{countHigh} Kelas</div>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-grow">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kelas (misal TKJ, 10)..."
                value={searchClass}
                onChange={(e) => setSearchClass(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Grade Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterGrade('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterGrade === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterGrade('10')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterGrade === '10' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas 10
              </button>
              <button
                type="button"
                onClick={() => setFilterGrade('11')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  filterGrade === '11' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelas 11
              </button>
            </div>
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Urutkan:</span>
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="lowest">Partisipasi Terendah Dahulu (Jemput Bola)</option>
              <option value="highest">Partisipasi Tertinggi Dahulu</option>
              <option value="name">Nama Kelas (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Class Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Tidak ada data kelas yang cocok dengan filter pencarian.
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const isLow = cls.turnout_percentage < 50;
              const isMid = cls.turnout_percentage >= 50 && cls.turnout_percentage < 80;
              const isHigh = cls.turnout_percentage >= 80;

              const cardBg = isLow
                ? 'bg-rose-50/50 border-rose-200'
                : isMid
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-emerald-50/50 border-emerald-200';

              const barBg = isLow ? 'bg-rose-500' : isMid ? 'bg-amber-500' : 'bg-emerald-500';
              const textPercent = isLow ? 'text-rose-700' : isMid ? 'text-amber-700' : 'text-emerald-700';

              const statusLabel = isLow ? 'Perlu Perhatian' : isMid ? 'Sedang Berjalan' : 'Tinggi';
              const statusTagBg = isLow
                ? 'bg-rose-100 text-rose-800'
                : isMid
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800';

              return (
                <div
                  key={cls.id}
                  className={`p-4 rounded-2xl border transition-all hover:shadow-md space-y-3 ${cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-slate-900">{cls.name}</span>
                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-full ${statusTagBg}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] text-slate-500 font-medium">Partisipasi</span>
                      <span className={`font-mono font-black ${textPercent}`}>
                        {cls.turnout_percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barBg}`}
                        style={{ width: `${cls.turnout_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-600 font-mono border-t border-slate-200/60 pt-2">
                    <span>
                      Masuk: <strong>{cls.voted_count}</strong> / {cls.quota}
                    </span>
                    <Link
                      href="/admin/announcements"
                      className="text-blue-600 hover:text-blue-800 font-sans font-bold flex items-center gap-0.5 text-[10px]"
                      title="Buka pengumuman dan distribusi token kelas ini"
                    >
                      <span>Token</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
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
