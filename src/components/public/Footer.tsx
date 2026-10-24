'use client';

import React from 'react';
import Link from 'next/link';
import { SCHOOL_INFO } from '@/lib/constants';
import { Shield, Sparkles, MapPin, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & School Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-mono font-bold text-sm">
                <span className="text-blue-400">4</span>SK
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 tracking-tight text-base">
                  {SCHOOL_INFO.appTitle}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {SCHOOL_INFO.subtitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Platform pemilihan umum digital resmi Organisasi Siswa Intra Sekolah (OSIS) SMKN 4 Kota Serang. Menjunjung tinggi integritas demokrasi sekolah dengan standar kerahasiaan suara mutlak dan transparansi rekapitulasi data.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{SCHOOL_INFO.address}</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Navigasi Cepat
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link href="/kandidat" className="hover:text-blue-600 transition-colors">
                  Eksplorasi Kandidat (3 Ketua & 6 Wakil)
                </Link>
              </li>
              <li>
                <Link href="/vote" className="hover:text-blue-600 transition-colors">
                  Bilik Suara Digital
                </Link>
              </li>
              <li>
                <Link href="/hasil" className="hover:text-blue-600 transition-colors">
                  Publikasi Hasil Resmi
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Panitia Access */}
          <div className="space-y-3">
            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Integritas & Panitia
            </h5>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-600">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kerahasiaan Suara Terjamin</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Token Kriptografis Sekali Pakai</span>
              </li>
              <li className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-600" />
                  <span>Portal Masuk Panitia</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            &copy; 2026 OSIS &amp; Panitia E-PILKETOS SMKN 4 Kota Serang. Seluruh hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-1">
            <span>Didedikasikan untuk Demokrasi Digital Siswa Mandiri</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
