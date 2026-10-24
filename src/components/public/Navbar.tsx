'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Shield, Vote } from 'lucide-react';
import { ElectionStatus } from '@/types/election';

interface NavbarProps {
  status?: ElectionStatus;
}

export default function Navbar({ status = 'ongoing' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const getStatusBadge = () => {
    switch (status) {
      case 'ongoing':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pemungutan Suara Aktif</span>
          </div>
        );
      case 'closed':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Pemungutan Suara Ditutup</span>
          </div>
        );
      case 'not_started':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Belum Dibuka</span>
          </div>
        );
    }
  };

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Kandidat', href: '/kandidat' },
    { label: 'Bilik Suara', href: '/vote' },
    { label: 'Hasil Resmi', href: '/hasil' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & School Seal */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-blue-900 p-0.5 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center text-white font-mono font-bold text-sm tracking-wider">
              <span className="text-blue-400">4</span>SK
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white font-bold">
              ★
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg">
                E-PILKETOS
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-100 text-blue-700 uppercase">
                Official
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
              SMKN 4 KOTA SERANG
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-tight transition-colors relative py-1 ${
                  isActive
                    ? 'text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {getStatusBadge()}

          <Link
            href="/vote"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-blue-600 font-medium text-sm transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
          >
            <Vote className="w-4 h-4 text-blue-400" />
            <span>Mulai Memilih</span>
          </Link>

          <Link
            href="/admin/login"
            title="Portal Akses Panitia & Pengawas"
            className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Shield className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {getStatusBadge()}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/vote"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-medium text-sm shadow"
            >
              <Vote className="w-4 h-4 text-blue-400" />
              <span>Masuk Bilik Suara</span>
            </Link>
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Portal Admin & Panitia</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
