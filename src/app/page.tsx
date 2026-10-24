'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import HeroOrb from '@/components/3d/HeroOrb';
import CinematicIntro from '@/components/public/CinematicIntro';
import CandidateCard from '@/components/public/CandidateCard';
import CandidateDetailModal from '@/components/public/CandidateDetailModal';
import SchoolLogo from '@/components/common/SchoolLogo';
import { Candidate, ElectionSettings } from '@/types/election';
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
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [ketuaCandidates, setKetuaCandidates] = useState<Candidate[]>([]);
  const [wakilCandidates, setWakilCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<'ketua' | 'wakil'>('ketua');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, candidatesRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/candidates'),
        ]);

        const settingsData = await settingsRes.json();
        const candidatesData = await candidatesRes.json();

        if (settingsData.success) {
          setSettings(settingsData.settings);
        }
        if (candidatesData.success) {
          setKetuaCandidates(candidatesData.ketua || []);
          setWakilCandidates(candidatesData.wakil || []);
        }
      } catch (err) {
        console.error('Failed loading election home data', err);
      } finally {
        setIsLoading(false);
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
            C. CANDIDATE EXPLORATION (3 KETUA & 6 WAKIL)
           ========================================================================= */}
        <section id="kandidat-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Eksplorasi Profil Kandidat</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Kenali Visi, Misi & Gagasan.
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Kandidat Ketua dan Calon Wakil bukan pasangan tetap. Pemilih memiliki kebebasan demokratis penuh untuk mengombinasikan satu calon ketua terbaik dengan satu calon wakil terbaik.
            </p>

            {/* Segmented Tab Switcher */}
            <div className="pt-4 flex items-center justify-center">
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-200">
                <button
                  onClick={() => setActiveTab('ketua')}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'ketua'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3 Calon Ketua OSIS
                </button>
                <button
                  onClick={() => setActiveTab('wakil')}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeTab === 'wakil'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6 Calon Wakil Ketua OSIS
                </button>
              </div>
            </div>
          </div>

          {/* Candidate Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeTab === 'ketua' ? ketuaCandidates : wakilCandidates).map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onOpenDetail={(c) => setSelectedCandidate(c)}
              />
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/kandidat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold transition-colors shadow-sm"
            >
              <span>Lihat Perbandingan Lengkap Seluruh Kandidat</span>
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
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-mono font-black text-lg flex items-center justify-center">
                  02
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Tentukan 1 Ketua & 1 Wakil
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pilih tepat satu calon Ketua OSIS dan satu calon Wakil Ketua OSIS secara bebas tanpa terikat pasangan. Periksa kembali ringkasan pilihan Anda.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 font-mono font-black text-lg flex items-center justify-center">
                  03
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Konfirmasi & Rekam Suara
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Konfirmasi pilihan Anda. Server memproses surat suara dan mengunci status token. Bukti keberhasilan resmi langsung ditampilkan di layar.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/vote"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-md"
              >
                <Vote className="w-4 h-4 text-blue-400" />
                <span>Masuk ke Bilik Suara Sekarang</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            E. SECURITY & INTEGRITY ARCHITECTURE
           ========================================================================= */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-8 sm:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-mono font-bold">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>ARSITEKTUR TEKNIS SISTEM</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Pemisahan Data Pemilih dan Pilihan Suara.
                </h2>

                <p className="text-slate-600 text-sm leading-relaxed">
                  E-PILKETOS memisahkan verifikasi token dari surat suara (ballot). Panitia dapat melihat statistik kehadiran per kelas, namun tidak memiliki akses teknis untuk mengaitkan identitas siswa atau nomor token dengan pilihan kandidat yang dipilih.
                </p>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Token terenkripsi satu kali pakai (One-Time Token Hash).</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Tabel surat suara tersimpan tanpa relasi (foreign key) ke identitas pemilih.</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Row Level Security (RLS) PostgreSQL melindungi akses data produksi.</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">Anti-Double Voting</h4>
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

      {/* Global Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
