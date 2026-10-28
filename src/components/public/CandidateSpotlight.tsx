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

  // Ensure active candidate is always valid
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
    <div className="space-y-8">
      {/* 1. Category Switcher Pills */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => handleSelectTab('ketua')}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              isKetuaTab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Calon Ketua OSIS</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isKetuaTab ? 'bg-blue-500 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {ketuaCandidates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTab('wakil')}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              !isKetuaTab
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Calon Wakil Ketua OSIS</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                !isKetuaTab ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
              }`}
            >
              {wakilCandidates.length}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-500 font-mono">
          *Ketua dan Wakil dipilih secara mandiri
        </p>
      </div>

      {/* 2. Interactive Candidate Thumbnail Selector Row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 px-1 no-scrollbar">
        {currentList.map((c) => {
          const isSelected = c.id === activeCandidate.id;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all text-left flex-shrink-0 cursor-pointer ${
                isSelected
                  ? isKetuaTab
                    ? 'bg-white border-blue-600 shadow-lg shadow-blue-500/10 ring-2 ring-blue-600/20 -translate-y-0.5'
                    : 'bg-white border-emerald-600 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-600/20 -translate-y-0.5'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                <img
                  src={c.photo_url}
                  alt={c.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
                <span
                  className={`absolute bottom-0 right-0 px-1 text-[9px] font-mono font-black rounded-tl ${
                    isKetuaTab ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  #{c.candidate_number}
                </span>
              </div>
              <div className="space-y-0.5 pr-1">
                <div className="text-xs font-black text-slate-900 leading-tight">
                  {c.name.split(' ').slice(0, 2).join(' ')}
                </div>
                <div className="text-[10px] font-mono text-slate-500 font-semibold truncate max-w-[120px]">
                  {c.grade_major.split(' ')[0]} {c.grade_major.split(' ')[1] || ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. The Grand Spotlight Stage (Apple Event Style) */}
      <div className="relative rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden">
        {/* Subtle Number Watermark */}
        <div className="absolute right-6 top-0 font-mono font-black text-8xl sm:text-9xl text-slate-100 select-none pointer-events-none -z-0">
          #{String(activeCandidate.candidate_number).padStart(2, '0')}
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 p-6 sm:p-10 lg:p-12 items-start">
          {/* Left Column: Portrait Showcase */}
          <div className="lg:col-span-5 space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Cinematic Portrait Card */}
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 shadow-xl border-4 border-white ring-1 ring-slate-200/80 group">
              <img
                src={activeCandidate.photo_url}
                alt={activeCandidate.name}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

              {/* Number Badge Top Left */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider text-white shadow-md backdrop-blur-md ${
                    isKetuaTab ? 'bg-blue-600/95' : 'bg-emerald-600/95'
                  }`}
                >
                  No. Urut #{String(activeCandidate.candidate_number).padStart(2, '0')}
                </span>
              </div>

              {/* Identity Overlay Bottom */}
              <div className="absolute bottom-4 left-4 right-4 text-left text-white space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                  {isKetuaTab ? 'Calon Ketua OSIS' : 'Calon Wakil Ketua OSIS'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  {activeCandidate.name}
                </h3>
                <p className="text-xs text-slate-200 font-semibold font-mono">
                  {activeCandidate.grade_major}
                </p>
              </div>
            </div>

            {/* Slogan / Tagline Banner */}
            <div className="w-full max-w-[340px] sm:max-w-[380px] p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                <Quote className="w-3 h-3 text-blue-600" />
                <span>Slogan / Tagline</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 italic leading-snug">
                &ldquo;{activeCandidate.tagline}&rdquo;
              </p>
            </div>

            {/* Direct CTA Button */}
            <div className="w-full max-w-[340px] sm:max-w-[380px] pt-1">
              <Link
                href="/vote"
                className={`w-full py-3.5 px-6 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-0.5 ${
                  isKetuaTab
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <Vote className="w-4 h-4" />
                <span>Pilih di Bilik Suara</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visi, Misi, & Program Kerja Unggulan */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Visi */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wider">
                <div
                  className={`p-1.5 rounded-lg ${
                    isKetuaTab ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </div>
                <span>Visi Utama</span>
              </div>
              <div
                className={`p-5 rounded-2xl border text-slate-800 text-xs sm:text-sm leading-relaxed font-semibold ${
                  isKetuaTab
                    ? 'bg-blue-50/40 border-blue-100'
                    : 'bg-emerald-50/40 border-emerald-100'
                }`}
              >
                {activeCandidate.vision}
              </div>
            </div>

            {/* Misi */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wider">
                <div
                  className={`p-1.5 rounded-lg ${
                    isKetuaTab ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span>Misi Strategis</span>
              </div>
              <div className="space-y-2">
                {activeCandidate.missions.map((misi, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed"
                  >
                    <span
                      className={`w-6 h-6 rounded-xl flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5 ${
                        isKetuaTab
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span>{misi}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Program Kerja Prioritas */}
            {activeCandidate.programs && activeCandidate.programs.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-black text-sm uppercase tracking-wider">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Program Kerja Prioritas</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activeCandidate.programs.map((prog, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs font-bold text-slate-800 flex items-center gap-2.5 hover:border-amber-300 transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="leading-snug">{prog}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Candidate Stepper Navigation */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <span className="text-xs font-mono font-bold text-slate-400">
                {currentIndex + 1} dari {currentList.length} Kandidat
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
