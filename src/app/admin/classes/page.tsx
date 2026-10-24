'use client';

import React, { useEffect, useState } from 'react';
import { ClassRecord } from '@/types/election';
import { School, Plus, Edit2, CheckCircle2, FileSpreadsheet, Save, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchClasses = async () => {
    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const res = await fetch('/api/admin/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error('Failed fetching classes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const totalQuota = classes.reduce((sum, c) => sum + c.voter_quota, 0);
  const totalTokens = classes.reduce((sum, c) => sum + c.tokens_generated, 0);
  const totalVoted = classes.reduce((sum, c) => sum + c.voted_count, 0);

  const handleOpenAdd = () => {
    setEditingClass({
      id: `cls-${Date.now()}`,
      grade: '10',
      major: 'PPLG',
      name: '',
      voter_quota: 36,
      tokens_generated: 0,
      voted_count: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRecord) => {
    setEditingClass({ ...cls });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const user = JSON.parse(sessionStorage.getItem('epilketos_admin_user') || '{}');

      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-name': user.name || 'Admin Panitia',
        },
        body: JSON.stringify(editingClass),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Kelas ${editingClass.name} berhasil disimpan.` });
        setIsModalOpen(false);
        fetchClasses();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Gagal menyimpan kelas.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          alert('File tidak berisi baris data yang valid.');
          return;
        }

        const token = sessionStorage.getItem('epilketos_admin_token');
        const user = JSON.parse(sessionStorage.getItem('epilketos_admin_user') || '{}');

        let importedCount = 0;
        for (const row of data) {
          const className = row['Nama Kelas'] || row['Kelas'] || row['name'];
          const quota = Number(row['Kuota'] || row['Jumlah Siswa'] || row['voter_quota'] || 36);

          if (className) {
            const grade = className.toUpperCase().startsWith('XI') ? '11' : '10';
            const major = className.split(' ')[1] || 'UMUM';

            await fetch('/api/admin/classes', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'x-admin-name': user.name || 'Admin Panitia',
              },
              body: JSON.stringify({
                id: `cls-${className.toLowerCase().replace(/\s+/g, '-')}`,
                grade,
                major,
                name: className,
                voter_quota: quota,
                tokens_generated: quota,
                voted_count: 0,
              }),
            });
            importedCount++;
          }
        }

        setStatusMessage({
          type: 'success',
          text: `Berhasil mengimpor ${importedCount} kelas dari spreadsheet.`,
        });
        fetchClasses();
      } catch (err) {
        console.error(err);
        setStatusMessage({ type: 'error', text: 'Format file tidak didukung.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <School className="w-6 h-6 text-blue-600" />
            <span>Manajemen Rombel &amp; Kuota Pemilih</span>
          </h1>
          <p className="text-xs text-slate-500">
            Daftar kelas 10 dan 11 SMKN 4 Kota Serang tanpa daftar pemilih bernama
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors border border-slate-200">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Impor Spreadsheet</span>
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      {/* Aggregate Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-mono uppercase text-slate-500 font-bold">Total Kuota Ditetapkan</span>
          <p className="text-3xl font-black text-slate-900">{totalQuota} Siswa</p>
          <p className="text-[11px] text-slate-500">Jumlah pemilih sah kelas 10 &amp; 11</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-mono uppercase text-slate-500 font-bold">Alokasi Token Diterbitkan</span>
          <p className="text-3xl font-black text-blue-600">{totalTokens} Token</p>
          <p className="text-[11px] text-slate-500">
            {totalTokens === totalQuota ? (
              <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai 100% dengan kuota
              </span>
            ) : (
              <span className="text-amber-600">Selisih {Math.abs(totalQuota - totalTokens)} token</span>
            )}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-mono uppercase text-slate-500 font-bold">Total Suara Masuk</span>
          <p className="text-3xl font-black text-emerald-600">{totalVoted} Suara</p>
          <p className="text-[11px] text-slate-500">
            Partisipasi: {totalQuota > 0 ? Math.round((totalVoted / totalQuota) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Classes Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Daftar Rombongan Belajar ({classes.length} Kelas)</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase">
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4">Tingkat</th>
                <th className="py-3 px-4">Jurusan</th>
                <th className="py-3 px-4">Kuota Pemilih</th>
                <th className="py-3 px-4">Token Diterbitkan</th>
                <th className="py-3 px-4">Suara Masuk</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-slate-900 font-mono">{cls.name}</td>
                  <td className="py-3 px-4">Kelas {cls.grade}</td>
                  <td className="py-3 px-4 font-mono">{cls.major}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{cls.voter_quota} Siswa</td>
                  <td className="py-3 px-4 font-mono text-blue-600 font-bold">{cls.tokens_generated}</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-bold">
                    {cls.voted_count} ({cls.voter_quota > 0 ? Math.round((cls.voted_count / cls.voter_quota) * 100) : 0}%)
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Kuota</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Class Modal */}
      {isModalOpen && editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingClass.name ? `Edit Kelas: ${editingClass.name}` : 'Tambah Kelas Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Kelas</label>
                <input
                  type="text"
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  placeholder="Contoh: X PPLG 1"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tingkat</label>
                  <select
                    value={editingClass.grade}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, grade: e.target.value as '10' | '11' })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="10">Kelas 10</option>
                    <option value="11">Kelas 11</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jurusan</label>
                  <input
                    type="text"
                    value={editingClass.major}
                    onChange={(e) => setEditingClass({ ...editingClass, major: e.target.value })}
                    placeholder="PPLG, TJKT, DKV"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kuota Jumlah Pemilih</label>
                <input
                  type="number"
                  value={editingClass.voter_quota}
                  onChange={(e) =>
                    setEditingClass({ ...editingClass, voter_quota: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 font-mono text-base"
                  required
                  min={1}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kelas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
