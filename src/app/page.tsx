'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import HeroOrb from '@/components/3d/HeroOrb';
import CinematicIntro from '@/components/public/CinematicIntro';
import CandidateSpotlight from '@/components/public/CandidateSpotlight';
import SchoolLogo from '@/components/common/SchoolLogo';
import { Candidate, ElectionSettings } from '@/types/election';
import { INITIAL_CANDIDATES, DEFAULT_ELECTION_SETTINGS } from '@/lib/constants';
import {
  Vote,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const [settings, setSettings] = useState<ElectionSettings>(DEFAULT_ELECTION_SETTINGS);
  const [ketuaCandidates, setKetuaCandidates] = useState<Candidate[]>(() =>
    INITIAL_CANDIDATES.filter((c) => c.type === 'ketua')
  );
  const [wakilCandidates, setWakilCandidates] = useState<Candidate[]>(() =>
    INITIAL_CANDIDATES.filter((c) => c.type === 'wakil')
  );

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, candidatesRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/candidates'),
        ]);

        const settingsData = await settingsRes.json();
        const candidatesData = await candidatesRes.json();

        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings);
        }
        if (candidatesData.success && Array.isArray(candidatesData.ketua) && candidatesData.ketua.length > 0) {
          setKetuaCandidates(candidatesData.ketua);
          setWakilCandidates(candidatesData.wakil || []);
        }
      } catch (err) {
        console.warn('Syncing election home data with backend:', err);
      }
    }

    loadData();
  }, []);

  const getStatusText = () => {
    if (!settings) return 'Memuat status...';
    switch (settings.status) {
      case 'ongoing':
        return 'Pemungutan Suara Sedang Berlangsung';
      case 'closed':
        return 'Pemungutan Suara Telah Ditutup';
      case 'not_started':
      default:
        return 'Pemungutan Suara Belum Dibuka';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1-2s Gentle Light Cinematic Intro */}
      <CinematicIntro />

      {/* Global Navbar */}
      <Navbar status={settings?.status || 'ongoing'} />

      <main className="flex-grow">
        {/* =========================================================================
            A. HERO SECTION: "SUARA KITA. MASA DEPAN KITA."
           ========================================================================= */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-8 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Hero Typography & CTAs */}
              <div className="lg:col-span-7 space-y-8 text-center lg:text-left z-10">
                {/* Official Pill */}
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
                  <SchoolLogo className="w-4 h-4 object-contain" size={16} />
                  <span className="font-mono text-blue-600 font-bold uppercase tracking-wider">
                    E-PILKETOS 2026
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>SMKN 4 Kota Serang</span>
                </div>

                {/* Oversized Clean Editorial Headline */}
                <div className="space-y-2">
                  <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black tracking-tight text-slate-900 leading-[1.08] font-sans">
                    SUARA KITA.
                    <br />
                    <span className="text-blue-600">MASA DEPAN KITA.</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-slate-600 font-normal max-w-xl mx-auto lg:mx-0 leading-relaxed pt-2">
                    Pemilihan Ketua dan Wakil Ketua OSIS SMKN 4 Kota Serang secara digital yang langsung, umum, bebas, rahasia, jujur, dan adil.
                  </p>
                </div>

                {/* CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/vote"
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all shadow-md shadow-blue-600/20 hover:-translate-y-0.5 flex items-center justify-center gap-3 group"
                  >
                    <Vote className="w-5 h-5 text-white" />
                    <span>Mulai Memilih</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <a
                    href="#kandidat-section"
                    className="w-full sm:w-auto px-7 py-4 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-base transition-all shadow-sm hover:shadow hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>Kenali Kandidat</span>
                  </a>
                </div>

                {/* Micro Key Integrity Badges */}
                <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">3</span>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Calon Ketua OSIS
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">6</span>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Calon Wakil Ketua OSIS
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-xl sm:text-2xl font-black text-blue-600">1x</span>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Token Sekali Pakai
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean 3D Metallic/Silver Orb */}
              <div className="lg:col-span-5 h-[380px] sm:h-[480px] lg:h-[520px] relative flex items-center justify-center">
                <HeroOrb />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            B. ELECTION OVERVIEW — CLEAN PURE WHITE CARD
           ========================================================================= */}
        <section className="py-12 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-[#F8FAFC] border border-slate-200 p-8 sm:p-12 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700">
                    <Clock className="w-3.5 h-3.5" />
                    <span>STATUS RESMI PEMILIHAN</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {getStatusText()}
                  </h2>

                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                    {settings?.description ||
                      'Pemilihan Ketua dan Wakil Ketua OSIS dilaksanakan secara digital. Setiap siswa kelas 10 dan 11 berhak menentukan 1 Calon Ketua dan 1 Calon Wakil secara independen menggunakan token resmi dari wali kelas.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-600 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Periode: {settings?.period_name || '2026/2027'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Metode: Bilik Suara Mandiri</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                  <Link
                    href="/vote"
                    className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    <Vote className="w-4 h-4" />
                    <span>Masukkan Token Pemilih</span>
                  </Link>

                  <Link
                    href="/hasil"
                    className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-center text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Cek Publikasi Hasil</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            C. CANDIDATE SPOTLIGHT SHOWCASE (3 KETUA & 6 WAKIL)
           ========================================================================= */}
        <section id="kandidat-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spotlight Kandidat Resmi OSIS</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Kenali Visi, Misi &amp; Gagasan.
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Jelajahi gagasan calon ketua dan calon wakil ketua OSIS. Pilih nama kandidat pada daftar untuk melihat profil gagasan secara langsung.
            </p>
          </div>

          {/* Spotlight Interactive Showcase (Option 1) */}
          <CandidateSpotlight
            ketuaCandidates={ketuaCandidates}
            wakilCandidates={wakilCandidates}
          />

          <div className="mt-14 text-center">
            <Link
              href="/kandidat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold transition-colors shadow-sm"
            >
              <span>Lihat Halaman Seluruh Profil Lengkap Kandidat</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </section>

        {/* =========================================================================
            D. VOTING GUIDE — 3 SIMPLE STEPS
           ========================================================================= */}
        <section className="py-20 bg-slate-100/60 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-blue-600">
                Panduan Siswa
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Tata Cara Memberikan Suara
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Proses pemilihan dirancang intuitif, cepat, dan sepenuhnya aman dalam hitungan detik.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-mono font-black text-lg flex items-center justify-center">
                  01
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Dapatkan & Masukkan Token
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Terima kartu token acak unik dari pengawas pemilihan kelas Anda. Masukkan kode token (contoh: PLK-XXXX-YYYY) pada bilik suara digital.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-mono font-black text-lg flex items-center justify-center">
                  02
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Tentukan Pilihan Mandiri
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pilih 1 (satu) Calon Ketua OSIS dan 1 (satu) Calon Wakil Ketua OSIS pilihan Anda secara terpisah dan bebas rahasia.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-mono font-black text-lg flex items-center justify-center">
                  03
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Konfirmasi & Bukti Sah
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tinjau kembali pilihan Anda pada layar verifikasi akhir, lalu kirim suara sah hingga kode verifikasi digital ditampilkan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            E. SECURITY PILLARS
           ========================================================================= */}
        <section className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-8 sm:p-14 space-y-10">
              <div className="max-w-2xl space-y-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
                  Transparansi & Keamanan
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Arsitektur Keamanan LUBER JURDIL
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Integritas pemilihan dijamin melalui pemisahan data kriptografi tanpa kompromi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">Token Ter-Hash</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Setiap token langsung berstatus hangus (used) seketika setelah pilihan dikonfirmasi.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">Transaksi Atomik</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pilihan Ketua dan Wakil disimpan dalam satu transaksi tak terpisahkan.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <ShieldCheck className="w-5 h-5 text-slate-700" />
                  <h4 className="font-extrabold text-sm text-slate-900">Audit Trail Lengkap</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aktivitas administratif panitia tercatat rapi tanpa membuka data pilihan siswa.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">Publikasi Transparan</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Grafik perolehan resmi diterbitkan serentak setelah masa voting berakhir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
