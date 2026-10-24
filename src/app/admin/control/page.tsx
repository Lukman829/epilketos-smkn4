'use client';

import React, { useEffect, useState } from 'react';
import { ElectionSettings } from '@/types/election';
import {
  Sliders,
  Play,
  Square,
  Lock,
  Globe,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function AdminControlPage() {
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionConfirm, setActionConfirm] = useState<{
    action: 'set_status' | 'publish_results';
    targetStatus?: 'not_started' | 'ongoing' | 'closed';
    isPublished?: boolean;
    title: string;
    description: string;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const executeControlAction = async () => {
    if (!actionConfirm) return;

    try {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const user = JSON.parse(sessionStorage.getItem('epilketos_admin_user') || '{}');

      const bodyPayload =
        actionConfirm.action === 'set_status'
          ? { action: 'set_status', status: actionConfirm.targetStatus }
          : { action: 'publish_results', is_published: actionConfirm.isPublished };

      const res = await fetch('/api/admin/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-admin-name': user.name || 'Admin Panitia',
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setActionConfirm(null);
        fetchSettings();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Gagal mengubah pengaturan.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Terjadi gangguan jaringan.' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>Kontrol Pemilihan &amp; Publikasi Hasil</span>
          </h1>
          <p className="text-xs text-slate-500">
            Kendali manual atas pembukaan bilik suara, penutupan voting, dan pengumuman resmi
          </p>
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

      {/* Grid of Control Panels — Pure White Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel 1: Status Pemilihan */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Pengaturan Bilik Suara
            </span>
            <h2 className="text-xl font-black text-slate-900">Status Sesi Pemungutan Suara</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mengontrol apakah token dapat digunakan oleh siswa di portal `/vote`.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600">Status Saat Ini:</span>
            <span
              className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                settings?.status === 'ongoing'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : settings?.status === 'closed'
                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {settings?.status === 'ongoing'
                ? 'DIBUKA (ONGOING)'
                : settings?.status === 'closed'
                ? 'DITUTUP (CLOSED)'
                : 'BELUM DIBUKA'}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() =>
                setActionConfirm({
                  action: 'set_status',
                  targetStatus: 'ongoing',
                  title: 'Buka Sesi Pemilihan Sekarang?',
                  description:
                    'Bilik suara akan langsung dapat diakses oleh seluruh siswa menggunakan token yang valid.',
                })
              }
              disabled={settings?.status === 'ongoing'}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Play className="w-4 h-4" />
              <span>Buka Pemilihan (Mulai Voting)</span>
            </button>

            <button
              onClick={() =>
                setActionConfirm({
                  action: 'set_status',
                  targetStatus: 'closed',
                  title: 'Tutup Sesi Pemilihan?',
                  description:
                    'Pemungutan suara akan dihentikan. Seluruh token yang belum terpakai tidak akan dapat mengirim suara baru.',
                })
              }
              disabled={settings?.status === 'closed'}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Square className="w-4 h-4" />
              <span>Tutup Pemilihan Resmi</span>
            </button>

            <button
              onClick={() =>
                setActionConfirm({
                  action: 'set_status',
                  targetStatus: 'not_started',
                  title: 'Kembalikan ke Status Belum Dibuka?',
                  description:
                    'Bilik suara akan menampilkan pengumuman bahwa pemilihan belum dimulai.',
                })
              }
              disabled={settings?.status === 'not_started'}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Set ke Belum Dibuka</span>
            </button>
          </div>
        </div>

        {/* Panel 2: Publikasi Hasil */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Pengaturan Publikasi
            </span>
            <h2 className="text-xl font-black text-slate-900">Status Pengumuman Hasil Resmi</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mengontrol apakah grafik dan angka perolehan suara dapat dilihat oleh pengunjung umum di halaman `/hasil`.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600">Status Publikasi:</span>
            <span
              className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                settings?.is_results_published
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {settings?.is_results_published ? 'DIPUBLIKASIKAN KE PUBLIK' : 'DRAF / RAHASIA'}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() =>
                setActionConfirm({
                  action: 'publish_results',
                  isPublished: true,
                  title: 'Publikasikan Hasil Pemilihan Secara Resmi?',
                  description:
                    'Hasil penghitungan suara akan langsung terbuka untuk seluruh publik dan dapat dilihat oleh siswa, guru, dan masyarakat luas.',
                })
              }
              disabled={settings?.is_results_published}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Globe className="w-4 h-4" />
              <span>Publikasikan Hasil Resmi</span>
            </button>

            <button
              onClick={() =>
                setActionConfirm({
                  action: 'publish_results',
                  isPublished: false,
                  title: 'Tarik Publikasi Hasil?',
                  description:
                    'Halaman hasil publik akan kembali dikunci dan hanya menampilkan pemberitahuan bahwa hasil akan diumumkan panitia.',
                })
              }
              disabled={!settings?.is_results_published}
              className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Tarik Publikasi (Sembunyikan Hasil)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {actionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="font-black text-lg text-slate-900">{actionConfirm.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {actionConfirm.description}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Tindakan ini akan dicatat ke dalam audit log sistem dengan identitas akun Anda.
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActionConfirm(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={executeControlAction}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                Konfirmasi Tindakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
