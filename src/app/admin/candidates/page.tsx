'use client';

import React, { useEffect, useState } from 'react';
import { Candidate } from '@/types/election';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Save,
  X,
} from 'lucide-react';

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCandidates = async () => {
    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const res = await fetch('/api/admin/candidates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.error('Failed fetching candidates', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleOpenAdd = () => {
    setEditingCandidate({
      id: `cand-${Date.now()}`,
      type: 'ketua',
      candidate_number: candidates.length + 1,
      name: '',
      grade_major: '',
      tagline: '',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      vision: '',
      missions: [''],
      programs: [''],
      is_active: true,
      display_order: candidates.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cand: Candidate) => {
    setEditingCandidate(JSON.parse(JSON.stringify(cand)));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;

    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const user = JSON.parse(sessionStorage.getItem('epilketos_admin_user') || '{}');

      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-name': user.name || 'Admin Panitia',
        },
        body: JSON.stringify(editingCandidate),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Data kandidat berhasil disimpan.' });
        setIsModalOpen(false);
        fetchCandidates();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Gagal menyimpan kandidat.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kandidat: "${name}"?`)) return;

    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const user = JSON.parse(sessionStorage.getItem('epilketos_admin_user') || '{}');

      const res = await fetch(`/api/admin/candidates?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-name': user.name || 'Admin Panitia',
        },
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Kandidat "${name}" berhasil dihapus.` });
        fetchCandidates();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal menghapus kandidat.' });
    }
  };

  const ketuaList = candidates.filter((c) => c.type === 'ketua');
  const wakilList = candidates.filter((c) => c.type === 'wakil');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Manajemen Kandidat OSIS</span>
          </h1>
          <p className="text-xs text-slate-500">
            Konfigurasi 3 Calon Ketua &amp; 6 Calon Wakil Ketua OSIS SMKN 4 Kota Serang
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kandidat Baru</span>
        </button>
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

      {/* Group 1: Calon Ketua OSIS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span>Calon Ketua OSIS ({ketuaList.length} Kandidat)</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Target standar: 3 Calon
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ketuaList.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-blue-600">
                    No. Urut #{c.candidate_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">{c.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{c.grade_major}</p>
                  <p className="text-xs italic text-slate-600 mt-1 line-clamp-2">&ldquo;{c.tagline}&rdquo;</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="flex-grow py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Data</span>
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                  title="Hapus Kandidat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Group 2: Calon Wakil Ketua OSIS */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600" />
            <span>Calon Wakil Ketua OSIS ({wakilList.length} Kandidat)</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Target standar: 6 Calon
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wakilList.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-emerald-600">
                    No. Urut #{c.candidate_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">{c.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{c.grade_major}</p>
                  <p className="text-xs italic text-slate-600 mt-1 line-clamp-2">&ldquo;{c.tagline}&rdquo;</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="flex-grow py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Edit Data</span>
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                  title="Hapus Kandidat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Modal — Clean Light Container */}
      {isModalOpen && editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="font-black text-lg text-slate-900">
                {editingCandidate.name ? `Edit: ${editingCandidate.name}` : 'Tambah Kandidat Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Posisi Jabatan</label>
                  <select
                    value={editingCandidate.type}
                    onChange={(e) =>
                      setEditingCandidate({
                        ...editingCandidate,
                        type: e.target.value as 'ketua' | 'wakil',
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="ketua">Calon Ketua OSIS</option>
                    <option value="wakil">Calon Wakil Ketua OSIS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor Urut</label>
                  <input
                    type="number"
                    value={editingCandidate.candidate_number}
                    onChange={(e) =>
                      setEditingCandidate({
                        ...editingCandidate,
                        candidate_number: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingCandidate.name}
                  onChange={(e) => setEditingCandidate({ ...editingCandidate, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kelas &amp; Jurusan</label>
                  <input
                    type="text"
                    value={editingCandidate.grade_major}
                    onChange={(e) =>
                      setEditingCandidate({ ...editingCandidate, grade_major: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                    placeholder="Contoh: XI PPLG 1"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">URL Foto Portrait</label>
                  <input
                    type="text"
                    value={editingCandidate.photo_url}
                    onChange={(e) =>
                      setEditingCandidate({ ...editingCandidate, photo_url: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tagline / Motto Kampanye</label>
                <input
                  type="text"
                  value={editingCandidate.tagline}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, tagline: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                  placeholder="Contoh: Akselerasi Kolaborasi, Wujudkan OSIS Progresif"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Visi Kandidat</label>
                <textarea
                  value={editingCandidate.vision}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, vision: e.target.value })
                  }
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Misi (Pisahkan dengan baris baru)</label>
                <textarea
                  value={editingCandidate.missions.join('\n')}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      missions: e.target.value.split('\n').filter((m) => m.trim()),
                    })
                  }
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Program Unggulan (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={editingCandidate.programs.join(', ')}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      programs: e.target.value.split(',').map((p) => p.trim()),
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600"
                  placeholder="Program A, Program B, Program C"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cand-active"
                  checked={editingCandidate.is_active}
                  onChange={(e) =>
                    setEditingCandidate({ ...editingCandidate, is_active: e.target.checked })
                  }
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                />
                <label htmlFor="cand-active" className="font-bold text-slate-700 cursor-pointer">
                  Aktifkan kandidat ini di surat suara
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kandidat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
