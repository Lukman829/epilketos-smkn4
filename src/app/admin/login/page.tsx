'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, User, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Autentikasi gagal.');
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('epilketos_admin_token', data.token);
      sessionStorage.setItem('epilketos_admin_user', JSON.stringify(data.admin));

      router.push('/admin');
    } catch {
      setErrorMessage('Terjadi gangguan jaringan saat menghubungi server.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'ketua' | 'utama') => {
    if (role === 'ketua') {
      setUsername('ketua.panitia');
      setPassword('SerangUnggul2026!');
    } else {
      setUsername('admin.utama');
      setPassword('PilketoSMKN4_Secure!');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Publik</span>
        </Link>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Portal Administrasi
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Hanya untuk Ketua Panitia dan Admin Utama resmi SMKN 4 Kota Serang.
          </p>
        </div>

        {/* Login Form Card — Pure White with Crisp Border */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Username Panitia
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ketua.panitia atau admin.utama"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:outline-none text-sm text-slate-900 placeholder-slate-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 uppercase">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white focus:outline-none text-sm text-slate-900 placeholder-slate-400 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Memproses Masuk...</span>
              ) : (
                <>
                  <span>Masuk Panel Panitia</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper for Instant Testing */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block text-center font-bold">
              Autofill Cepat Akun Uji:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('ketua')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 text-center transition-colors truncate"
              >
                Ketua Panitia
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('utama')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 text-center transition-colors truncate"
              >
                Admin Utama
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-500">
          Sistem Pemilihan Terproteksi &bull; Log aktivitas otentikasi dicatat pada audit trail keamanan.
        </p>
      </div>
    </div>
  );
}
