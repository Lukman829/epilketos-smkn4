'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  School,
  KeyRound,
  Sliders,
  FileText,
  LogOut,
  Shield,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ name: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoginPage) {
      const token = sessionStorage.getItem('epilketos_admin_token');
      const user = sessionStorage.getItem('epilketos_admin_user');
      if (!token || !user) {
        router.push('/admin/login');
        return;
      }
      try {
        setAdminUser(JSON.parse(user));
      } catch {
        router.push('/admin/login');
      }
    }
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('epilketos_admin_token');
    sessionStorage.removeItem('epilketos_admin_user');
    router.push('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const menuItems = [
    { label: 'Ikhtisar Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Kelola Kandidat', href: '/admin/candidates', icon: Users },
    { label: 'Kelola Kelas & Kuota', href: '/admin/classes', icon: School },
    { label: 'Manajemen Token', href: '/admin/tokens', icon: KeyRound },
    { label: 'Kontrol Pemilihan', href: '/admin/control', icon: Sliders },
    { label: 'Log Audit Keamanan', href: '/admin/audit', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-mono font-bold text-xs text-white">
            4SK
          </div>
          <span className="font-bold text-sm text-slate-900">PANITIA PILKETOS</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-600 hover:text-slate-900"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Admin Sidebar — Clean Pure White */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between flex-shrink-0 z-30 shadow-sm`}
      >
        <div className="space-y-8">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-mono font-black text-sm shadow">
              4SK
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">
                PANITIA PILKETOS
              </h2>
              <p className="text-[10px] font-mono text-slate-500 uppercase">
                SMKN 4 KOTA SERANG
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & actions */}
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-blue-600 font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">
                {adminUser?.name || 'Administrator'}
              </p>
              <p className="text-[10px] font-mono text-slate-500 uppercase truncate">
                {adminUser?.role === 'ketua_panitia' ? 'Ketua Panitia' : 'Admin Utama'}
              </p>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs transition-colors"
            >
              <span>Buka Website Publik</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Sesi Admin</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-8 lg:p-10 overflow-y-auto bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto space-y-8">{children}</div>
      </main>
    </div>
  );
}
