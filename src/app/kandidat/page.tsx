'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import CandidateCard from '@/components/public/CandidateCard';
import CandidateDetailModal from '@/components/public/CandidateDetailModal';
import { Candidate, ElectionSettings } from '@/types/election';
import { INITIAL_CANDIDATES, DEFAULT_ELECTION_SETTINGS } from '@/lib/constants';
import { Users, Vote, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function CandidatesPage() {
  // Pre-seed with official candidates so SSR/SSG prerender never emits an empty '0 kandidat' shell
  const [ketuaCandidates, setKetuaCandidates] = useState<Candidate[]>(() =>
    INITIAL_CANDIDATES.filter((c) => c.type === 'ketua')
  );
  const [wakilCandidates, setWakilCandidates] = useState<Candidate[]>(() =>
    INITIAL_CANDIDATES.filter((c) => c.type === 'wakil')
  );
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'ketua' | 'wakil'>('all');
  const [settings, setSettings] = useState<ElectionSettings>(DEFAULT_ELECTION_SETTINGS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const syncCandidates = async () => {
    setIsSyncing(true);
    setFetchError(null);
    try {
      const [candRes, setRes] = await Promise.all([
        fetch('/api/candidates'),
        fetch('/api/settings'),
      ]);

      const candData = await candRes.json();
      const setData = await setRes.json();

      if (candData.success && Array.isArray(candData.ketua) && candData.ketua.length > 0) {
        setKetuaCandidates(candData.ketua);
        setWakilCandidates(candData.wakil || []);
      }
      if (setData.success && setData.settings) {
        setSettings(setData.settings);
      }
    } catch (err) {
      console.warn('Syncing candidates with backend failed; using preloaded data:', err);
      setFetchError('Koneksi sinkronisasi latar belakang terganggu.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncCandidates();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar status={settings.status || 'ongoing'} />

      <main className="flex-grow py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Page Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>KANDIDAT RESMI OSIS 2026/2027</span>
              {isSyncing && (
                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin ml-1" />
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Kandidat Ketua &amp; Wakil Ketua OSIS
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Pelajari rekam jejak, visi, misi, dan program unggulan dari 3 Calon Ketua OSIS dan 6 Calon Wakil Ketua OSIS SMKN 4 Kota Serang sebelum menggunakan hak pilih Anda di bilik suara.
            </p>

            {fetchError && (
              <div className="inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                <span>{fetchError} (Menampilkan data terverifikasi)</span>
                <button
                  onClick={syncCandidates}
                  className="font-bold underline hover:text-amber-900 ml-1"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Filter Toggle */}
            <div className="pt-2 flex items-center justify-center">
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-200">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    filterType === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({ketuaCandidates.length + wakilCandidates.length})
                </button>
                <button
                  onClick={() => setFilterType('ketua')}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    filterType === 'ketua'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Calon Ketua ({ketuaCandidates.length})
                </button>
                <button
                  onClick={() => setFilterType('wakil')}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    filterType === 'wakil'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Calon Wakil ({wakilCandidates.length})
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Calon Ketua OSIS */}
          {(filterType === 'all' || filterType === 'ketua') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span>Kelompok Calon Ketua OSIS</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Pilih 1 dari 3 kandidat ketua di bilik suara.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold border border-blue-200">
                  {ketuaCandidates.length} Kandidat
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ketuaCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onOpenDetail={(c) => setSelectedCandidate(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Calon Wakil Ketua OSIS */}
          {(filterType === 'all' || filterType === 'wakil') && (
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600" />
                    <span>Kelompok Calon Wakil Ketua OSIS</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Pilih 1 dari 6 kandidat wakil di bilik suara (kombinasi bebas).
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
                  {wakilCandidates.length} Kandidat
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {wakilCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onOpenDetail={(c) => setSelectedCandidate(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bottom Banner CTA */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-black">Sudah Memiliki Pilihan Terbaik?</h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Siapkan token pemilihan Anda dan masuk ke bilik suara digital untuk menggunakan hak suara secara langsung dan rahasia.
              </p>
            </div>
            <Link
              href="/vote"
              className="px-8 py-3.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 flex-shrink-0"
            >
              <Vote className="w-4 h-4" />
              <span>Buka Bilik Suara</span>
            </Link>
          </div>
        </div>
      </main>

      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />

      <Footer />
    </div>
  );
}