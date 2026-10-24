'use client';

import React from 'react';
import { Candidate } from '@/types/election';
import { Eye, ArrowUpRight, Sparkles } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  onOpenDetail: (candidate: Candidate) => void;
}

export default function CandidateCard({ candidate, onOpenDetail }: CandidateCardProps) {
  const isKetua = candidate.type === 'ketua';

  return (
    <div className="group relative rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top Banner Tag */}
      <div className="p-4 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isKetua
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isKetua ? 'Calon Ketua' : 'Calon Wakil'}
          </span>
        </div>
        <span className="font-mono text-xl font-black text-slate-300 group-hover:text-blue-600 transition-colors">
          #{String(candidate.candidate_number).padStart(2, '0')}
        </span>
      </div>

      {/* Portrait Photo with Depth */}
      <div className="relative mx-4 mt-3 rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-100">
        <img
          src={candidate.photo_url}
          alt={candidate.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Quick detail floating pill on hover */}
        <button
          onClick={() => onOpenDetail(candidate)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-xs font-semibold shadow hover:bg-white transition-all scale-95 group-hover:scale-100"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>Profil Lengkap</span>
        </button>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
            {candidate.name}
          </h3>
          <p className="text-xs font-semibold text-slate-500 line-clamp-1">
            {candidate.grade_major}
          </p>
          <p className="text-xs italic text-slate-600 line-clamp-2 pt-1 border-t border-slate-100">
            &ldquo;{candidate.tagline}&rdquo;
          </p>
        </div>

        {/* Key Programs Preview */}
        {candidate.programs && candidate.programs.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Program Prioritas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {candidate.programs.slice(0, 2).map((p, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium truncate max-w-full"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Card Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={() => onOpenDetail(candidate)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Pelajari Visi & Misi</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
