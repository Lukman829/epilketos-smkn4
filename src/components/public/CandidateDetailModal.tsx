'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, CheckCircle, Award, Compass, Sparkles, ArrowRight } from 'lucide-react';
import { Candidate } from '@/types/election';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
}

export default function CandidateDetailModal({ candidate, onClose }: CandidateDetailModalProps) {
  if (!candidate) return null;

  const isKetua = candidate.type === 'ketua';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isKetua 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {isKetua ? 'Calon Ketua OSIS' : 'Calon Wakil Ketua OSIS'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              No. Urut {String(candidate.candidate_number).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto space-y-8">
          {/* Candidate Profile Header */}
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shadow-lg border-2 border-slate-100 flex-shrink-0">
              <img
                src={candidate.photo_url}
                alt={candidate.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-white font-mono font-bold text-xs">
                #{candidate.candidate_number}
              </div>
            </div>

            <div className="space-y-2 flex-grow">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {candidate.name}
              </h2>
              <p className="text-sm font-semibold text-blue-600">
                {candidate.grade_major}
              </p>
              <p className="text-sm italic text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                &ldquo;{candidate.tagline}&rdquo;
              </p>
            </div>
          </div>

          {/* Visi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Compass className="w-5 h-5 text-blue-600" />
              <span>Visi Kandidat</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-slate-700 text-sm leading-relaxed font-medium">
              {candidate.vision}
            </div>
          </div>

          {/* Misi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>Misi Unggulan</span>
            </div>
            <ul className="space-y-2.5">
              {candidate.missions.map((misi, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono font-bold text-xs flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{misi}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Program Unggulan */}
          {candidate.programs && candidate.programs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Program Kerja Prioritas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {candidate.programs.map((prog, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800 flex items-center gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>{prog}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Pilihan Anda dilindungi asas kerahasiaan pemilihan umum OSIS SMKN 4 Kota Serang.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
            <Link
              href="/vote"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg"
            >
              <span>Buka Bilik Suara</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
