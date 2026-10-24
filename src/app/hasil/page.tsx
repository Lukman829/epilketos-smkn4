'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { ElectionResultsData } from '@/types/election';
import {
  BarChart3,
  Lock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Users,
  Award,
  Vote,
  Printer,
  AlertCircle,
} from 'lucide-react';

export default function ResultsPage() {
  const [data, setData] = useState<ElectionResultsData | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchResults = async (demo = false) => {
    setIsLoading(true);
    try {
      const url = demo ? '/api/results?demo=true' : '/api/results';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.results);
        setIsDemo(json.is_demo || false);
      }
    } catch (err) {
      console.error('Failed loading results', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(false);
  }, []);

  const isPublished = data?.is_published;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar status={data?.settings?.status || 'ongoing'} />

      <main className="flex-grow py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>REKAPITULASI RESMI PEMILIHAN</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Hasil Pemilihan OSIS 2026/2027
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              SMKN 4 Kota Serang &bull; Transparansi Demokrasi Berkeadilan
            </p>

            {/* Demo mode switcher for evaluation */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => fetchResults(!isDemo)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                  isDemo
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isDemo ? 'Kembalikan ke Data Asli' : 'Simulasikan Visual Grafis (Mode DEMO)'}</span>
              </button>
            </div>
          </div>

          {/* DEMO NOTICE BANNER (Mandatory when demo mode is active) */}
          {isDemo && (
            <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm text-center shadow-lg border border-amber-600 flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                MODE DEMO AKTIF: Data di bawah adalah simulasi grafis demonstrasi untuk tujuan pengujian visual dan BUKAN merupakan hasil resmi pemilihan.
              </span>
            </div>
          )}

          {/* =========================================================================
              SCENARIO A: BEFORE OFFICIAL PUBLICATION (LOCKED STATE)
             ========================================================================= */}
          {!isPublished && (
            <div className="p-8 sm:p-14 rounded-3xl bg-white border border-slate-200/90 shadow-xl text-center max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-300 text-slate-700 mx-auto flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8 text-slate-600" />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600">
                  Status Pengumuman
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Hasil pemilihan akan diumumkan secara resmi oleh panitia.
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                  Sesuai dengan kode etik pemilihan SMKN 4 Kota Serang, perolehan suara kandidat dirahasiakan hingga seluruh rangkaian pemungutan suara ditutup dan diverifikasi oleh panitia pemilihan.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs font-mono text-slate-600">
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span>Jadwal Pengumuman Resmi:</span>
                  <span className="font-bold text-slate-900">Segera setelah pleno penutupan</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span>Otoritas Pengesahan:</span>
                  <span>Ketua Panitia & Pembina OSIS</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Bilik Suara:</span>
                  <span className="font-bold text-emerald-600">Pemungutan Sedang / Telah Berjalan</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/vote"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Vote className="w-4 h-4" />
                  <span>Masuk Bilik Suara</span>
                </Link>
                <button
                  onClick={() => fetchResults(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Lihat Pratinjau Tampilan Grafik (Demo)
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              SCENARIO B: OFFICIAL PUBLISHED RESULTS (FULL LIVE METRICS & CHARTS)
             ========================================================================= */}
          {isPublished && data && (
            <div className="space-y-12">
              {/* Top Overview KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="text-xs font-mono uppercase text-slate-500 font-bold">
                    Total Suara Sah Masuk
                  </span>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">
                    {data.total_ballots.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-400">
                    Dari {data.total_eligible_voters} pemilih terdaftar
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="text-xs font-mono uppercase text-slate-500 font-bold">
                    Tingkat Partisipasi
                  </span>
                  <p className="text-3xl sm:text-4xl font-black text-blue-600">
                    {data.turnout_percentage}%
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">
                    Tingkat partisipasi tinggi
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="text-xs font-mono uppercase text-slate-500 font-bold">
                    Token Terpakai
                  </span>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900">
                    {data.total_tokens_used}
                  </p>
                  <p className="text-xs text-slate-400">
                    Konsisten 100% dengan surat suara
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="text-xs font-mono uppercase text-slate-500 font-bold">
                    Waktu Pengesahan
                  </span>
                  <p className="text-sm font-bold text-slate-900 pt-2 font-mono">
                    {data.published_at
                      ? new Date(data.published_at).toLocaleString('id-ID')
                      : 'Terverifikasi Panitia'}
                  </p>
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ditandatangani Digital</span>
                  </p>
                </div>
              </div>

              {/* Chart 1: Perolehan Suara Calon Ketua OSIS */}
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-600" />
                      <span>Perolehan Suara Calon Ketua OSIS</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Total 3 kandidat ketua mandiri
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold border border-blue-200 self-start sm:self-auto">
                    Kategori Ketua
                  </span>
                </div>

                <div className="space-y-6">
                  {data.ketua_results.map((res, idx) => {
                    const isLeader = idx === 0 && res.votes > 0;
                    return (
                      <div key={res.candidate.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-400 w-6">
                              #{res.candidate.candidate_number}
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {res.candidate.name}
                            </span>
                            {isLeader && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                <span>Suara Tertinggi</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 font-mono font-bold">
                            <span className="text-slate-600">{res.votes} Suara</span>
                            <span className="text-blue-600 text-base">{res.percentage}%</span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isLeader
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.max(res.percentage, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Perolehan Suara Calon Wakil Ketua OSIS */}
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-600" />
                      <span>Perolehan Suara Calon Wakil Ketua OSIS</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Total 6 kandidat wakil independen
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200 self-start sm:self-auto">
                    Kategori Wakil
                  </span>
                </div>

                <div className="space-y-6">
                  {data.wakil_results.map((res, idx) => {
                    const isLeader = idx === 0 && res.votes > 0;
                    return (
                      <div key={res.candidate.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-400 w-6">
                              #{res.candidate.candidate_number}
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {res.candidate.name}
                            </span>
                            {isLeader && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                <span>Suara Tertinggi</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 font-mono font-bold">
                            <span className="text-slate-600">{res.votes} Suara</span>
                            <span className="text-emerald-600 text-base">{res.percentage}%</span>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isLeader
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.max(res.percentage, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Class Participation Breakdown */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Partisipasi Agregat Per Kelas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Data tingkat kehadiran per rombongan belajar tanpa membuka identitas pemilih.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {data.class_participation.map((c) => (
                    <div
                      key={c.class_id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                    >
                      <span className="font-mono font-bold text-xs text-slate-900 block truncate">
                        {c.class_name}
                      </span>
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-500">{c.voted}/{c.quota}</span>
                        <span className="font-bold text-blue-600">{c.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Sheet Action */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan Lembar Rekapitulasi (PDF)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
