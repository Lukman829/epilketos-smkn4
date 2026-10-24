'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  Plus,
  Ban,
  FileSpreadsheet,
  Printer,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ClassRecord } from '@/types/election';

interface TokenItem {
  id: string;
  preview: string;
  plain: string;
  class_id: string;
  class_name: string;
  status: 'active' | 'used' | 'revoked';
  created_at: string;
  used_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  replacement_token_id: string | null;
}

export default function AdminTokensPage() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateClassId, setGenerateClassId] = useState<string>('');
  const [generateCount, setGenerateCount] = useState<number>(36);

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokingToken, setRevokingToken] = useState<TokenItem | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [generateReplacement, setGenerateReplacement] = useState<boolean>(true);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const [tokRes, clsRes] = await Promise.all([
        fetch(`/api/admin/tokens?class_id=${selectedClass}&status=${selectedStatus}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/classes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const tokData = await tokRes.json();
      const clsData = await clsRes.json();

      if (tokData.success) {
        setTokens(tokData.tokens);
      }
      if (clsData.success) {
        setClasses(clsData.classes);
        if (clsData.classes.length > 0 && !generateClassId) {
          setGenerateClassId(clsData.classes[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedStatus]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const user = JSON.parse(sessionStorage.getItem('epilketos_admin_user') || '{}');

      const res = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-name': user.name || 'Admin Panitia',
        },
        body: JSON.stringify({
          class_id: generateClassId,
          count: generateCount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', text: data.message });
        setIsGenerateModalOpen(false);
        loadData();
      } else {
        setNotification({ type: 'error', text: data.error || 'Gagal menerbitkan batch token.' });
      }
    } catch {
      setNotification({ type: 'error', text: 'Terjadi gangguan koneksi.' });
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingToken) return;

    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const user = JSON.parse(sessionStorage.getItem('epilketos_admin_user') || '{}');

      const res = await fetch('/api/admin/tokens', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-name': user.name || 'Admin Panitia',
        },
        body: JSON.stringify({
          token_id: revokingToken.id,
          reason: revokeReason,
          generate_replacement: generateReplacement,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const repMsg = data.replacement_token
          ? ` Token pengganti: ${data.replacement_token}`
          : '';
        setNotification({
          type: 'success',
          text: `Token berhasil dibatalkan.${repMsg}`,
        });
        setIsRevokeModalOpen(false);
        setRevokingToken(null);
        setRevokeReason('');
        loadData();
      } else {
        setNotification({ type: 'error', text: data.error || 'Gagal membatalkan token.' });
      }
    } catch {
      setNotification({ type: 'error', text: 'Terjadi gangguan jaringan.' });
    }
  };

  const handleExportExcel = () => {
    if (tokens.length === 0) {
      alert('Tidak ada token untuk diekspor.');
      return;
    }

    const exportRows = tokens.map((t, idx) => ({
      No: idx + 1,
      'Kode Token': t.plain,
      'Kelas': t.class_name,
      'Status': t.status.toUpperCase(),
      'Tanggal Terbit': new Date(t.created_at).toLocaleDateString('id-ID'),
      'Waktu Terpakai': t.used_at ? new Date(t.used_at).toLocaleString('id-ID') : '-',
      'Alasan Dibatalkan': t.revoked_reason || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Token Pemilihan');
    XLSX.writeFile(wb, `Token_PILKETOS_SMKN4_${selectedClass}_${Date.now()}.xlsx`);
  };

  const filteredTokens = tokens.filter((t) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      t.plain.toLowerCase().includes(s) ||
      t.preview.toLowerCase().includes(s) ||
      t.class_name.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-blue-600" />
            <span>Manajemen Token Kriptografis</span>
          </h1>
          <p className="text-xs text-slate-500">
            Penerbitan acak, pencegahan duplikasi, pencabutan token, dan ekspor distribusi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-2 transition-colors border border-emerald-200"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh Excel</span>
          </button>

          <Link
            href="/admin/tokens/print"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors border border-slate-200"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Lembar Potong</span>
          </Link>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Batch</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)}>✕</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Semua Kelas ({classes.length} Rombel)</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif (Belum Digunakan)</option>
            <option value="used">Sudah Digunakan</option>
            <option value="revoked">Dibatalkan</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari token atau kelas..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Tokens Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Daftar Token ({filteredTokens.length} Token)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Hashed Storage SHA-256
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase">
                <th className="py-3 px-4">Kode Token</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Waktu Terbit</th>
                <th className="py-3 px-4">Waktu Digunakan</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTokens.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">
                      {t.plain}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{t.class_name}</td>
                  <td className="py-3 px-4">
                    {t.status === 'active' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        Aktif
                      </span>
                    )}
                    {t.status === 'used' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Digunakan
                      </span>
                    )}
                    {t.status === 'revoked' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        Dibatalkan
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(t.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {t.used_at ? new Date(t.used_at).toLocaleTimeString('id-ID') : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {t.status === 'active' && (
                      <button
                        onClick={() => {
                          setRevokingToken(t);
                          setIsRevokeModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Batalkan</span>
                      </button>
                    )}
                    {t.status === 'revoked' && (
                      <span className="text-[11px] text-slate-500 italic">
                        {t.revoked_reason || 'Dicabut'}
                      </span>
                    )}
                    {t.status === 'used' && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Sah
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Generator Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base">Generate Batch Token Kriptografis</h3>
              <button onClick={() => setIsGenerateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kelas Tujuan</label>
                <select
                  value={generateClassId}
                  onChange={(e) => {
                    setGenerateClassId(e.target.value);
                    const selected = classes.find((c) => c.id === e.target.value);
                    if (selected) setGenerateCount(selected.voter_quota);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Kuota: {cls.voter_quota} Siswa)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jumlah Token yang Diterbitkan</label>
                <input
                  type="number"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  min={1}
                  max={50}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-base"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Setiap token digenerate menggunakan random bytes kriptografis 16-karakter anti-kolisi.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Terbitkan Token</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Token Modal */}
      {isRevokeModalOpen && revokingToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-rose-600">Batalkan Token Pemilih</h3>
              <button onClick={() => setIsRevokeModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleRevoke} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500">Token Target:</span>
                <p className="font-mono font-bold text-slate-900 text-sm">{revokingToken.plain}</p>
                <p className="text-slate-500">{revokingToken.class_name}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Alasan Pembatalan Resmi</label>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Contoh: Kartu rusak, hilang, atau salah distribusi"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-rose-600"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="gen-rep"
                  checked={generateReplacement}
                  onChange={(e) => setGenerateReplacement(e.target.checked)}
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                />
                <label htmlFor="gen-rep" className="font-bold text-slate-700 cursor-pointer">
                  Terbitkan token pengganti baru seketika untuk kelas ini
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRevokeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Ban className="w-4 h-4" />
                  <span>Konfirmasi Pembatalan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
