'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { Candidate, ElectionSettings } from '@/types/election';
import { INITIAL_CANDIDATES, DEFAULT_ELECTION_SETTINGS } from '@/lib/constants';
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  Vote,
  Sparkles,
  HelpCircle,
  Home,
  RotateCcw,
  Monitor,
} from 'lucide-react';

type VoteStep = 'token' | 'select_ketua' | 'select_wakil' | 'summary' | 'success';

export default function VotePage() {
  const [step, setStep] = useState<VoteStep>('token');
  const [settings, setSettings] = useState<ElectionSettings>(DEFAULT_ELECTION_SETTINGS);
  const [ketuaCandidates, setKetuaCandidates] = useState<Candidate[]>(() =>
    INITIAL_CANDIDATES.filter((c) => c.type === 'ketua')
  );
  const [wakilCandidates, setWakilCandidates] = useState<Candidate[]>(() =>
    INITIAL_CANDIDATES.filter((c) => c.type === 'wakil')
  );

  // Voting inputs & state
  const [tokenInput, setTokenInput] = useState<string>('');
  const [verifiedToken, setVerifiedToken] = useState<string>('');
  const [voterClassName, setVoterClassName] = useState<string>('');
  const [selectedKetua, setSelectedKetua] = useState<Candidate | null>(null);
  const [selectedWakil, setSelectedWakil] = useState<Candidate | null>(null);

  // Status & error states
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTimestamp, setSuccessTimestamp] = useState<string | null>(null);

  // Kiosk / Booth Attendant Mode
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);
  const [kioskCountdown, setKioskCountdown] = useState<number>(5);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epilketos_kiosk_mode');
      const urlParams = new URLSearchParams(window.location.search);
      if (saved === '1' || urlParams.get('kiosk') === '1') {
        setIsKioskMode(true);
      }
    }
  }, []);

  const toggleKioskMode = () => {
    setIsKioskMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('epilketos_kiosk_mode', next ? '1' : '0');
      }
      return next;
    });
  };

  const handleResetKiosk = useCallback(() => {
    setStep('token');
    setTokenInput('');
    setVerifiedToken('');
    setVoterClassName('');
    setSelectedKetua(null);
    setSelectedWakil(null);
    setErrorMessage(null);
    setSuccessTimestamp(null);
    setKioskCountdown(5);
  }, []);

  // Countdown timer for automatic reset in kiosk mode
  useEffect(() => {
    if (step !== 'success' || !isKioskMode) return;

    setKioskCountdown(5);
    const timer = setInterval(() => {
      setKioskCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleResetKiosk();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, isKioskMode, handleResetKiosk]);

  // Load candidates and election settings
  useEffect(() => {
    async function init() {
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
        console.error('Failed to initialize vote portal', err);
      }
    }

    init();
  }, []);

  // Step 1: Validate Token
  const handleValidateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanToken = tokenInput.trim().toUpperCase();
    if (!cleanToken) {
      setErrorMessage('Silakan masukkan token pemilihan Anda.');
      return;
    }

    setIsValidatingToken(true);

    try {
      const res = await fetch('/api/tokens/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Token tidak valid.');
        return;
      }

      // Validated successfully
      setVerifiedToken(cleanToken);
      setVoterClassName(data.className || 'Peserta Didik');
      setStep('select_ketua');
    } catch {
      setErrorMessage('Koneksi terputus. Silakan periksa jaringan dan coba lagi.');
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Step 4 -> 5: Cast Vote Atomic Submission
  const handleConfirmVote = async () => {
    if (!verifiedToken || !selectedKetua || !selectedWakil) {
      setErrorMessage('Data pemilihan tidak lengkap. Silakan lengkapi pilihan Anda.');
      return;
    }

    setIsSubmittingVote(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verifiedToken,
          candidate_ketua_id: selectedKetua.id,
          candidate_wakil_id: selectedWakil.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Gagal menyimpan suara.');
        setIsSubmittingVote(false);
        return;
      }

      // Vote successfully confirmed by backend!
      setSuccessTimestamp(data.timestamp || new Date().toISOString());

      // Trigger celebratory confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Clear sensitive memory states to guarantee privacy & no reuse
      setVerifiedToken('');
      setTokenInput('');
      setSelectedKetua(null);
      setSelectedWakil(null);

      setStep('success');
    } catch {
      setErrorMessage('Terjadi gangguan jaringan saat merekam suara. Suara belum tercatat. Silakan coba kembali.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar status={settings?.status || 'ongoing'} />

      <main className="flex-grow py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Top Bar: Booth Attendant Controls / Kiosk Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <span className="text-slate-500 font-mono text-[11px]">
              Platform Pemilihan Suara Siswa SMKN 4 Kota Serang
            </span>

            <button
              type="button"
              onClick={toggleKioskMode}
              className={`self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
                isKioskMode
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
              title="Aktifkan untuk komputer/HP bilik suara: layar otomatis reset setelah suara pemilih sah tercatat"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{isKioskMode ? 'Mode Bilik Mandiri: Aktif' : 'Mode Bilik Mandiri'}</span>
            </button>
          </div>

          {/* Progress Stepper Bar (Hidden during success) */}
          {step !== 'success' && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className={step === 'token' ? 'text-blue-600 flex items-center gap-1.5' : verifiedToken ? 'text-emerald-600 flex items-center gap-1.5' : ''}>
                  1. Validasi Token
                </span>
                <span className="text-slate-200">➔</span>
                <span className={step === 'select_ketua' ? 'text-blue-600 flex items-center gap-1.5' : selectedKetua ? 'text-emerald-600 flex items-center gap-1.5' : ''}>
                  2. Pilih Ketua
                </span>
                <span className="text-slate-200">➔</span>
                <span className={step === 'select_wakil' ? 'text-blue-600 flex items-center gap-1.5' : selectedWakil ? 'text-emerald-600 flex items-center gap-1.5' : ''}>
                  3. Pilih Wakil
                </span>
                <span className="text-slate-200">➔</span>
                <span className={step === 'summary' ? 'text-blue-600' : ''}>
                  4. Konfirmasi
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span className="flex-grow">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* =========================================================================
              STEP 1: TOKEN INPUT
             ========================================================================= */}
          {step === 'token' && (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-8 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
                <KeyRound className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Bilik Suara Digital
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Masukkan kode token resmi yang tercetak pada kartu pemilih dari pengawas kelas Anda.
                </p>
              </div>

              <form onSubmit={handleValidateToken} className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                    Kode Token Pemilih
                  </label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => {
                      setTokenInput(e.target.value.toUpperCase());
                      setErrorMessage(null);
                    }}
                    placeholder="Contoh: PLK-XXXX-YYYY"
                    className="w-full text-center font-mono font-black text-xl sm:text-2xl tracking-wider py-4 px-5 rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none transition-colors uppercase bg-slate-50/50"
                    maxLength={16}
                    autoFocus
                  />
                </div>

                {/* Petunjuk Panitia */}
                <div className="text-left bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs text-slate-600 flex items-start gap-2.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Masukkan kode token resmi yang tertera pada lembar fisik kartu suara yang dibagikan oleh Panitia Pemilihan OSIS.</span>
                </div>

                <button
                  type="submit"
                  disabled={isValidatingToken || !tokenInput.trim()}
                  className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-base transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {isValidatingToken ? (
                    <span>Memverifikasi Token...</span>
                  ) : (
                    <>
                      <span>Lanjut Memilih</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Token hanya berlaku untuk satu kali pemungutan suara</span>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: SELECT KETUA OSIS (1 OF 3)
             ========================================================================= */}
          {step === 'select_ketua' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-mono font-bold uppercase">
                    Tahap 1 dari 2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                    Tentukan Calon Ketua OSIS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pilih tepat satu kandidat Ketua OSIS yang paling mewakili aspirasi Anda.
                  </p>
                </div>

                <div className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  Pemilih Terverifikasi: <span className="text-blue-600 font-bold">{voterClassName}</span>
                </div>
              </div>

              {/* 3 Ketua Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ketuaCandidates.map((candidate) => {
                  const isSelected = selectedKetua?.id === candidate.id;
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedKetua(candidate)}
                      className={`cursor-pointer rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-lg scale-[1.02]'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-2xl font-black text-slate-400">
                            #{candidate.candidate_number}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100">
                          <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">
                            {candidate.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">
                            {candidate.grade_major}
                          </p>
                          <p className="text-xs italic text-slate-600 mt-2 line-clamp-2">
                            &ldquo;{candidate.tagline}&rdquo;
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ Terpilih Sebagai Ketua' : 'Pilih Kandidat Ini'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep('token')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Ubah Token</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedKetua}
                  onClick={() => setStep('select_wakil')}
                  className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <span>Lanjut Pilih Calon Wakil</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 3: SELECT WAKIL KETUA OSIS (1 OF 6)
             ========================================================================= */}
          {step === 'select_wakil' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-bold uppercase">
                    Tahap 2 dari 2
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                    Tentukan Calon Wakil Ketua OSIS
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pilih tepat satu kandidat Wakil Ketua OSIS untuk melengkapi suara Anda.
                  </p>
                </div>

                {selectedKetua && (
                  <div className="text-xs font-semibold text-slate-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Ketua Terpilih: <strong>{selectedKetua.name}</strong></span>
                  </div>
                )}
              </div>

              {/* 6 Wakil Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {wakilCandidates.map((candidate) => {
                  const isSelected = selectedWakil?.id === candidate.id;
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedWakil(candidate)}
                      className={`cursor-pointer rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-lg scale-[1.02]'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-2xl font-black text-slate-400">
                            #{candidate.candidate_number}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100">
                          <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">
                            {candidate.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1">
                            {candidate.grade_major}
                          </p>
                          <p className="text-xs italic text-slate-600 mt-2 line-clamp-2">
                            &ldquo;{candidate.tagline}&rdquo;
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ Terpilih Sebagai Wakil' : 'Pilih Kandidat Ini'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep('select_ketua')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Pilihan Ketua</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedWakil}
                  onClick={() => setStep('summary')}
                  className="px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <span>Lihat Ringkasan Pilihan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 4: SUMMARY & CONFIRMATION
             ========================================================================= */}
          {step === 'summary' && selectedKetua && selectedWakil && (
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-8 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold uppercase">
                  Konfirmasi Akhir
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Periksa Ringkasan Pilihan Anda
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Pastikan kedua pilihan kandidat sudah sesuai dengan keyakinan Anda sebelum suara dikirim secara permanen ke database.
                </p>
              </div>

              {/* Cards Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Ketua Selected */}
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700">
                    Pilihan Calon Ketua OSIS:
                  </span>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedKetua.photo_url}
                      alt={selectedKetua.name}
                      className="w-14 h-14 rounded-xl object-cover border border-blue-300"
                    />
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-700">
                        No. Urut #{selectedKetua.candidate_number}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {selectedKetua.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {selectedKetua.grade_major}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('select_ketua')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                  >
                    Ganti Pilihan Ketua
                  </button>
                </div>

                {/* Wakil Selected */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">
                    Pilihan Calon Wakil Ketua OSIS:
                  </span>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedWakil.photo_url}
                      alt={selectedWakil.name}
                      className="w-14 h-14 rounded-xl object-cover border border-emerald-300"
                    />
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        No. Urut #{selectedWakil.candidate_number}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {selectedWakil.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {selectedWakil.grade_major}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('select_wakil')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline"
                  >
                    Ganti Pilihan Wakil
                  </button>
                </div>
              </div>

              {/* Integrity Warning */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
                <p className="font-bold">Ketentuan Integritas Suara:</p>
                <p>
                  Setelah tombol &ldquo;Kirim Suara Sah&rdquo; diklik, server akan mengunci token Anda dan memasukkan surat suara ke kotak suara digital. Suara yang telah masuk tidak dapat dibatalkan atau diubah.
                </p>
              </div>

              {/* Submit Action */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('select_wakil')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  Kembali Periksa
                </button>

                <button
                  type="button"
                  disabled={isSubmittingVote}
                  onClick={handleConfirmVote}
                  className="w-full sm:flex-grow py-4 px-8 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:bg-slate-400 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmittingVote ? (
                    <span>Sedang Memproses Suara...</span>
                  ) : (
                    <>
                      <Vote className="w-4 h-4 text-blue-400" />
                      <span>Kirim Suara Sah Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 5: SUCCESS CONFIRMATION ("SUARAMU TELAH TERCATAT.")
             ========================================================================= */}
          {step === 'success' && (
            <div className="p-8 sm:p-14 rounded-3xl bg-white border border-slate-200/90 shadow-2xl space-y-8 text-center max-w-xl mx-auto">
              {/* Elegant success emblem */}
              <div className="relative mx-auto w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                <div className="absolute inset-0 rounded-full border border-emerald-400/40 animate-ping pointer-events-none" />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600">
                  Konfirmasi Resmi Bilik Suara
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  HAK SUARA ANDA TELAH TERCATAT
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Terima kasih atas partisipasi Anda dalam Pemilihan Ketua dan Wakil Ketua OSIS SMKN 4 Kota Serang. Pilihan suara Anda telah tersimpan di kotak suara digital dan token pemilih telah ditandai digunakan.
                </p>
              </div>

              {/* Receipt metadata (Crucially, NO candidate choices revealed to preserve secret ballot!) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs font-mono text-slate-600">
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span>Status Suara:</span>
                  <span className="font-bold text-emerald-600">Sah & Terverifikasi</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-2">
                  <span>Waktu Rekam Server:</span>
                  <span>{successTimestamp ? new Date(successTimestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Tercatat'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Token:</span>
                  <span className="font-bold text-slate-700">Telah Digunakan (Used)</span>
                </div>
              </div>

              {/* Kiosk Mode Auto-Reset Banner */}
              {isKioskMode && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
                  <div className="flex items-center justify-center gap-2 font-bold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                    <span>Mode Bilik Mandiri Aktif</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Layar akan otomatis di-reset untuk pemilih berikutnya dalam{' '}
                    <strong className="font-mono text-sm text-blue-950 font-black">{kioskCountdown}</strong> detik...
                  </p>
                  <button
                    type="button"
                    onClick={handleResetKiosk}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    Reset Sekarang (Pemilih Berikutnya)
                  </button>
                </div>
              )}

              {/* Navigation CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetKiosk}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Pemilih Berikutnya (Reset Form)</span>
                </button>

                <Link
                  href="/"
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Kembali ke Beranda Utama</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}