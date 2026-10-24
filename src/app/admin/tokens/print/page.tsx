'use client';

import React, { useEffect, useState } from 'react';
import { Printer, ArrowLeft, Scissors } from 'lucide-react';
import Link from 'next/link';
import SchoolLogo from '@/components/common/SchoolLogo';

interface TokenItem {
  id: string;
  plain: string;
  class_name: string;
  status: string;
}

export default function PrintTokensPage() {
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classList, setClassList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTokens() {
      try {
        const token = sessionStorage.getItem('epilketos_admin_token');
        const res = await fetch('/api/admin/tokens?status=active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setTokens(data.tokens);
          const classes = Array.from(new Set(data.tokens.map((t: TokenItem) => t.class_name))) as string[];
          setClassList(classes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTokens();
  }, []);

  const displayedTokens = selectedClass === 'all'
    ? tokens
    : tokens.filter((t) => t.class_name === selectedClass);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 sm:p-10 font-sans">
      {/* Control Toolbar (Hidden in print) */}
      <div className="no-print max-w-5xl mx-auto mb-8 p-4 rounded-2xl bg-slate-100 border border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tokens"
            className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700" />
          </Link>
          <div>
            <h1 className="font-bold text-sm text-slate-900">
              Cetak Lembar Potong Kartu Token ({displayedTokens.length} Kartu Siap Cetak)
            </h1>
            <p className="text-xs text-slate-500">
              Format siap potong (3 kolom) untuk distribusi ke wali kelas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
          >
            <option value="all">Semua Kelas ({tokens.length} Token)</option>
            {classList.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar (Print / PDF)</span>
          </button>
        </div>
      </div>

      {/* Grid of Cuttable Token Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {displayedTokens.map((t, idx) => (
          <div
            key={t.id}
            className="token-card-print relative p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col justify-between space-y-3"
          >
            {/* Cut indicator icon */}
            <div className="absolute -top-2.5 right-4 bg-white px-1 text-slate-400 flex items-center gap-1 text-[10px]">
              <Scissors className="w-3 h-3 text-slate-400" />
              <span>Gunting</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <SchoolLogo className="w-6 h-6 object-contain" size={24} />
                <div>
                  <h4 className="font-extrabold text-[11px] leading-tight text-slate-900">
                    E-PILKETOS SMKN 4
                  </h4>
                  <p className="text-[9px] text-slate-500">KOTA SERANG 2026/2027</p>
                </div>
              </div>
              <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                {t.class_name}
              </span>
            </div>

            {/* Token Code Display */}
            <div className="text-center py-2 bg-white rounded-lg border border-slate-200 shadow-inner">
              <span className="text-[9px] font-mono uppercase text-slate-400 block font-bold">
                KODE TOKEN PEMILIHAN RESMI:
              </span>
              <span className="font-mono font-black text-lg sm:text-xl text-slate-900 tracking-wider">
                {t.plain}
              </span>
            </div>

            {/* Instructions */}
            <div className="text-[9px] text-slate-500 space-y-0.5 border-t border-slate-200 pt-1.5">
              <p>&bull; Kunjungi portal resmi: <strong>pilketos.smkn4serang.sch.id</strong></p>
              <p>&bull; Pilih 1 Calon Ketua & 1 Calon Wakil secara independen.</p>
              <p>&bull; Token sekali pakai. Jangan berikan kode ini kepada orang lain.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
