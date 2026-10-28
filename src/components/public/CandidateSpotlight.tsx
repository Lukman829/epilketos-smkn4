'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Candidate } from '@/types/election';
import {
  Compass,
  CheckCircle2,
  Sparkles,
  Award,
  Vote,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Quote,
  GraduationCap,
} from 'lucide-react';

interface CandidateSpotlightProps {
  ketuaCandidates: Candidate[];
  wakilCandidates: Candidate[];
}

export default function CandidateSpotlight({
  ketuaCandidates,
  wakilCandidates,
}: CandidateSpotlightProps) {
  const [activeTab, setActiveTab] = useState<'ketua' | 'wakil'>('ketua');
  const [selectedId, setSelectedId] = useState<string>(() => {
    return ketuaCandidates[0]?.id || '';
  });

  const currentList = useMemo(() => {
    return activeTab === 'ketua' ? ketuaCandidates : wakilCandidates;
  }, [activeTab, ketuaCandidates, wakilCandidates]);

  const activeCandidate = useMemo(() => {
    const found = currentList.find((c) => c.id === selectedId);
    return found || currentList[0] || null;
  }, [currentList, selectedId]);

  const currentIndex = useMemo(() => {
    if (!activeCandidate) return 0;
    const idx = currentList.findIndex((c) => c.id === activeCandidate.id);
    return idx >= 0 ? idx : 0;
  }, [currentList, activeCandidate]);

  const isKetuaTab = activeTab === 'ketua';

  const handleSelectTab = (tab: 'ketua' | 'wakil') => {
    setActiveTab(tab);
    const targetList = tab === 'ketua' ? ketuaCandidates : wakilCandidates;
    if (targetList.length > 0) {
      setSelectedId(targetList[0].id);
    }
  };

  const handlePrev = () => {
    if (currentList.length === 0) return;
    const prevIdx = (currentIndex - 1 + currentList.length) % currentList.length;
    setSelectedId(currentList[prevIdx].id);
  };

  const handleNext = () => {
    if (currentList.length === 0) return;
    const nextIdx = (currentIndex + 1) % currentList.length;
    setSelectedId(currentList[nextIdx].id);
  };

  if (!activeCandidate) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Control: Category Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-200">
          <button
            type="button"
            onClick={() => handleSelectTab('ketua')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isKetuaTab
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>👑 3 Calon Ketua OSIS</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('wakil')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              !isKetuaTab
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🤝 6 Calon Wakil Ketua OSIS</span>
          </button>
        </div>

        {/* Stepper Navigation in Header */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 mr-1">
            Kandidat {currentIndex + 1} dari {currentList.length}
          </span>
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Kandidat Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Kandidat Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Candidate Selector Grid (Clean, Proportional & Neat) */}
      <div
        className={`grid gap-2.5 ${
          isKetuaTab
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
        }`}
      >
        {currentList.map((c) => {
          const isSelected = c.id === activeCandidate.id;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                isSelected
                  ? isKetuaTab
                    ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500'
                    : 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                <img
                  src={c.photo_url}
                  alt={c.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono font-black text-[11px] ${
                      isSelected
                        ? isKetuaTab
                          ? 'text-blue-700'
                          : 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    #{String(c.candidate_number).padStart(2, '0')}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {c.name.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. The Grand Spotlight Stage (Neat, Balanced, Premium) */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-lg overflow-hidden">
        {/* Stage Top Bar */}
        <div className="px-6 sm:px-8 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] ${
                isKetuaTab
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isKetuaTab ? 'Calon Ketua OSIS' : 'Calon Wakil Ketua OSIS'}
            </span>
            <span className="font-mono font-black text-slate-500">
              Nomor Urut {String(activeCandidate.candidate_number).padStart(2, '0')}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            SMK Negeri 4 Kota Serang &bull; Masa Bakti 2026/2027
          </span>
        </div>

        {/* Stage Body Grid */}
        <div className="p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Portrait & Identity (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-100 border border-slate-200 shadow-sm">
              <img
                src={activeCandidate.photo_url}
                alt={activeCandidate.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white font-mono font-bold text-xs">
                #{activeCandidate.candidate_number}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {activeCandidate.name}
              </h3>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>{activeCandidate.grade_major}</span>
              </p>
            </div>

            {/* Slogan Manifesto */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                <Quote className="w-3 h-3 text-blue-600" />
                <span>Slogan</span>
              </span>
              <p className="text-xs font-medium text-slate-700 italic">
                &ldquo;{activeCandidate.tagline}&rdquo;
              </p>
            </div>

            <Link
              href="/vote"
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                isKetuaTab
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>Buka Bilik Suara untuk Memilih</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Right Column: Visi, Misi, & Program (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visi */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Visi Kandidat</span>
              </div>
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed text-slate-800 ${
                  isKetuaTab
                    ? 'bg-blue-50/50 border-blue-100'
                    : 'bg-emerald-50/50 border-emerald-100'
                }`}
              >
                {activeCandidate.vision}
              </div>
            </div>

            {/* Misi */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Misi Unggulan</span>
              </div>
              <div className="space-y-2">
                {activeCandidate.missions.map((misi, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs sm:text-sm text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{misi}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Program Prioritas (Clean Horizontal Stack) */}
            {activeCandidate.programs && activeCandidate.programs.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>3 Program Kerja Prioritas</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeCandidate.programs.map((prog, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-800 flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="leading-snug">{prog}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
