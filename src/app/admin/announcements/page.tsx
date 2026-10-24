'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Megaphone,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  Send,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  FileText,
  KeyRound,
  Search,
  ExternalLink,
} from 'lucide-react';
import { ClassRecord } from '@/types/election';
import { exportClassTokensToExcel, TokenExportItem } from '@/lib/excelExport';

export default function AdminAnnouncementsPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [tokens, setTokens] = useState<TokenExportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form states
  const [voterCount, setVoterCount] = useState<number>(36);
  const [homeroomTeacher, setHomeroomTeacher] = useState<string>('');
  const [electionDate, setElectionDate] = useState<string>('Senin, 26 Oktober 2026');
  const [electionTime, setElectionTime] = useState<string>('08:00 - 14:00 WIB');
  const [electionVenue, setElectionVenue] = useState<string>(
    'Bilik Suara Digital (Lab Komputer / Smartphone Masing-Masing)'
  );
  const [specialNotes, setSpecialNotes] = useState<string>(
    '1. Setiap token hanya dapat digunakan untuk 1 (satu) kali pemberian suara sah.\n2. Token bersifat pribadi dan rahasia, dilarang membagikan kode token kepada orang lain.\n3. Pemilihan dapat diakses dari smartphone, tablet, atau komputer yang terhubung ke internet.'
  );

  // Tab state: 'letter' | 'whatsapp' | 'tokens'
  const [activeTab, setActiveTab] = useState<'letter' | 'whatsapp' | 'tokens'>('letter');
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [tokenSearch, setTokenSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const voteUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/vote`;
    }
    return 'https://epilketos-smkn4.vercel.app/vote';
  }, []);

  const currentClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Load Classes
  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const adminToken = sessionStorage.getItem('epilketos_admin_token');
        const res = await fetch('/api/admin/classes', {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });
        const data = await res.json();
        if (data.success && data.classes.length > 0) {
          setClasses(data.classes);
          setSelectedClassId(data.classes[0].id);
          setVoterCount(data.classes[0].voter_quota || 36);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  // Fetch Tokens when class changes
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchTokens = async () => {
      try {
        const adminToken = sessionStorage.getItem('epilketos_admin_token');
        const res = await fetch(`/api/admin/tokens?class_id=${selectedClassId}&status=all`, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setTokens(data.tokens);
        }
      } catch (err) {
        console.error('Failed to fetch tokens for class:', err);
      }
    };

    const cls = classes.find((c) => c.id === selectedClassId);
    if (cls) {
      setVoterCount(cls.voter_quota || 36);
    }
    fetchTokens();
  }, [selectedClassId, classes]);

  // Generate Batch Tokens for selected class
  const handleGenerateBatch = async () => {
    if (!currentClass) return;
    setIsGenerating(true);
    setNotification(null);

    try {
      const adminToken = sessionStorage.getItem('epilketos_admin_token');
      const user = JSON.parse(sessionStorage.getItem('epilketos_admin_user') || '{}');

      const res = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-name': user.name || 'Admin Panitia',
        },
        body: JSON.stringify({
          class_id: currentClass.id,
          count: voterCount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          text: `Berhasil menerbitkan ${data.count} token baru untuk ${currentClass.name}!`,
        });

        // Refetch tokens
        const tokRes = await fetch(`/api/admin/tokens?class_id=${currentClass.id}&status=all`, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });
        const tokData = await tokRes.json();
        if (tokData.success) {
          setTokens(tokData.tokens);
        }
      } else {
        setNotification({
          type: 'error',
          text: data.error || 'Gagal menerbitkan batch token.',
        });
      }
    } catch {
      setNotification({
        type: 'error',
        text: 'Terjadi gangguan jaringan saat menghubungi server.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // WhatsApp Broadcast Template Text
  const waBroadcastText = useMemo(() => {
    const className = currentClass ? currentClass.name : 'Kelas';
    const teacherSalutation = homeroomTeacher ? `Bapak/Ibu ${homeroomTeacher}` : 'Bapak/Ibu Wali Kelas';

    return (
`📢 *PENGUMUMAN RESMI E-PILKETOS SMKN 4 KOTA SERANG*
*Masa Bakti 2026/2027*

Yth. ${teacherSalutation} & Seluruh Siswa/i *${className}*,

Sehubungan dengan dilaksanakannya Pemilihan Ketua dan Wakil Ketua OSIS SMK Negeri 4 Kota Serang secara digital, rahasia, jujur, dan adil, berikut kami sampaikan rincian pelaksanaannya:

🗓️ *Hari, Tanggal:* ${electionDate}
⏰ *Waktu:* ${electionTime}
📍 *Metode:* ${electionVenue}
🌐 *Tautan Bilik Suara:*
${voteUrl}

════════════════════════════
📋 *TATA CARA MEMILIH:*
1️⃣ Buka tautan bilik suara: ${voteUrl}
2️⃣ Masukkan *Kode Token Resmi* masing-masing siswa (cek daftar token terlampir).
3️⃣ Tentukan pilihan 1 Calon Ketua & 1 Calon Wakil Ketua OSIS.
4️⃣ Periksa kembali pilihan Anda, lalu tekan *Kirim Suara*.

⚠️ *CATATAN PENTING:*
${specialNotes}

Mari gunakan hak suara kita secara bijak untuk masa depan SMKN 4 Kota Serang yang lebih hebat dan berprestasi! 🚀✨

_Komisi Pemilihan OSIS SMKN 4 Kota Serang_`
    );
  }, [currentClass, homeroomTeacher, electionDate, electionTime, electionVenue, voteUrl, specialNotes]);

  // Copy WhatsApp Broadcast Text
  const handleCopyWA = () => {
    navigator.clipboard.writeText(waBroadcastText);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Open Direct WhatsApp Share
  const handleShareWA = () => {
    const encoded = encodeURIComponent(waBroadcastText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!currentClass) return;
    exportClassTokensToExcel({
      className: currentClass.name,
      tokens,
      voterQuota: voterCount,
      homeroomTeacher,
      electionDate,
      electionTime,
      electionVenue,
      voteUrl,
      specialNotes,
    });
  };

  // Print Announcement Letter
  const handlePrintLetter = () => {
    window.print();
  };

  // Filtered tokens for search
  const filteredTokens = useMemo(() => {
    if (!tokenSearch) return tokens;
    const q = tokenSearch.toLowerCase();
    return tokens.filter((t) => {
      const p = (t.plain || '').toLowerCase();
      const pv = (t.preview || '').toLowerCase();
      return p.includes(q) || pv.includes(q);
    });
  }, [tokens, tokenSearch]);

  const activeTokenCount = tokens.filter((t) => t.status === 'active').length;
  const usedTokenCount = tokens.filter((t) => t.status === 'used').length;

  return (
    <div className="space-y-8 print:p-0 print:m-0 print:space-y-0">
      {/* Screen Header (Hidden on Print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Submenu Khusus Pengumuman & Distribusi</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            <span>Pengumuman & Distribusi Token Kelas</span>
          </h1>
          <p className="text-xs text-slate-500">
            Formulir batch token per kelas, template surat resmi A4, siaran pesan WhatsApp, dan ekspor Excel rapi tanpa sensor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={tokens.length === 0}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-2 transition-colors border border-emerald-200 disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh Excel Rapi</span>
          </button>

          <button
            onClick={handlePrintLetter}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`print:hidden p-4 rounded-2xl flex items-center justify-between text-sm font-semibold border ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs underline hover:no-underline">
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Form Left, Announcement Preview Right (Hidden on Print) */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Settings & Batch Generator (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Formulir Pengumuman Kelas</span>
            </h2>

            {/* Class Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pilih Kelas Sasaran (8 Jurusan SMKN 4)</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.voter_quota} Siswa)
                  </option>
                ))}
              </select>
            </div>

            {/* Voter Quota */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Jumlah Siswa / Kuota DPT</label>
              <input
                type="number"
                min={1}
                max={100}
                value={voterCount}
                onChange={(e) => setVoterCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Standar rombel SMKN 4 Kota Serang berisi 36 siswa per kelas.
              </p>
            </div>

            {/* Homeroom Teacher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Wali Kelas / Narahubung (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Bpk. Rahmat Santoso, S.Pd."
                value={homeroomTeacher}
                onChange={(e) => setHomeroomTeacher(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Election Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Hari & Tanggal Pemilihan</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={electionDate}
                  onChange={(e) => setElectionDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Election Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Waktu Pencoblosan</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={electionTime}
                  onChange={(e) => setElectionTime(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Election Venue */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Lokasi / Akses Pemilihan</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={electionVenue}
                  onChange={(e) => setElectionVenue(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Special Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Catatan & Instruksi Khusus Panitia</label>
              <textarea
                rows={3}
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* Token Batch Generation Action */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status Token Kelas Ini:</span>
                <span
                  className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                    tokens.length > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {tokens.length > 0 ? `${tokens.length} Token Diterbitkan` : 'Belum Ada Token'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleGenerateBatch}
                disabled={isGenerating}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGenerating
                    ? 'Menerbitkan Token...'
                    : tokens.length > 0
                    ? `Terbitkan Ulang / Tambah ${voterCount} Token`
                    : `⚡ Generate Batch ${voterCount} Token ${currentClass?.name || ''}`}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Statistik Distribusi {currentClass?.name}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <p className="text-xl font-black text-blue-600">{activeTokenCount}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Siap Coblos</p>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <p className="text-xl font-black text-emerald-600">{usedTokenCount}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telah Mencoblos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Announcement Preview & Token List (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs Selector */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 w-fit">
            <button
              onClick={() => setActiveTab('letter')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'letter'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Surat Resmi (A4)</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Format WhatsApp</span>
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                activeTab === 'tokens'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Format Excel & Token Kelas ({tokens.length})</span>
            </button>
          </div>

          {/* TAB 1: Official Letterhead Preview (A4) */}
          {activeTab === 'letter' && (
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 text-slate-900">
              {/* Kop Surat SMKN 4 Kota Serang */}
              <div className="text-center space-y-1 pb-4 border-b-4 border-double border-slate-900">
                <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                  PEMERINTAH DAERAH PROVINSI BANTEN
                </p>
                <p className="text-sm font-black uppercase tracking-wider text-slate-700">
                  DINAS PENDIDIKAN DAN KEBUDAYAAN
                </p>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  SMK NEGERI 4 KOTA SERANG
                </h2>
                <p className="text-[11px] font-medium text-slate-500">
                  Jl. Raya Taktakan KM 03, Panggungjati, Kec. Taktakan, Kota Serang, Banten 42162
                </p>
                <p className="text-[11px] font-bold text-blue-700">
                  KOMISI PEMILIHAN KETUA & WAKIL KETUA OSIS — MASA BAKTI 2026/2027
                </p>
              </div>

              {/* Letter Meta */}
              <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-700 gap-2">
                <div>
                  <p><span className="font-bold">Nomor:</span> 04/PAN-PILKETOS/SMKN4/X/2026</p>
                  <p><span className="font-bold">Lampiran:</span> 1 (satu) Berkas Lembar Token Siswa</p>
                  <p><span className="font-bold">Perihal:</span> Pemberitahuan & Distribusi Token Bilik Suara Digital</p>
                </div>
                <div className="sm:text-right">
                  <p>Kota Serang, {electionDate.split(',')[1]?.trim() || '26 Oktober 2026'}</p>
                  <p className="font-bold text-slate-900">Kepada Yth.</p>
                  <p>Bapak/Ibu Wali Kelas & Seluruh Siswa/i</p>
                  <p className="font-black text-blue-600">{currentClass?.name || 'Kelas'}</p>
                </div>
              </div>

              {/* Letter Body */}
              <div className="text-xs leading-relaxed space-y-4 text-justify text-slate-700">
                <p>
                  Dengan hormat, sehubungan dengan pelaksanaan agenda tahunan demokrasi sekolah Pemilihan Ketua dan
                  Wakil Ketua OSIS SMK Negeri 4 Kota Serang Masa Bakti 2026/2027 yang diselenggarakan secara daring
                  melalui platform <strong>E-PILKETOS SMKN 4</strong>, kami panitia pelaksana menyampaikan informasi
                  pelaksanaan sebagai berikut:
                </p>

                {/* Details Table */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Hari, Tanggal</span>
                    <span className="col-span-2 text-slate-900">: {electionDate}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Waktu Pelaksanaan</span>
                    <span className="col-span-2 text-slate-900">: {electionTime}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Alokasi DPT Kelas</span>
                    <span className="col-span-2 text-slate-900">: {tokens.length || voterCount} Pemilih Terdaftar</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-600">Tautan Bilik Suara</span>
                    <span className="col-span-2 text-blue-700 font-bold underline break-all">
                      : {voteUrl}
                    </span>
                  </div>
                </div>

                <p className="font-bold text-slate-900">Tata Cara Pemberian Hak Suara Digital:</p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                  <li>Buka tautan bilik suara resmi pada peramban web: <strong className="text-blue-700">{voteUrl}</strong>.</li>
                  <li>Masukkan <strong>Kode Token Kriptografis Unik</strong> yang tertera pada lembar distribusi masing-masing siswa.</li>
                  <li>Tentukan pilihan 1 (satu) Calon Ketua OSIS dan 1 (satu) Calon Wakil Ketua OSIS berdasarkan visi, misi, dan program kerja.</li>
                  <li>Konfirmasi pilihan Anda pada layar verifikasi dan tekan tombol <strong>Kirim Suara</strong>.</li>
                </ol>

                <p className="italic text-[11px] text-slate-500">
                  *Catatan: Kode token bersifat rahasia dan langsung kedaluwarsa seketika setelah suara sah tercatat.
                  Surat suara disimpan secara anonim tanpa identitas pemilih demi menjamin kerahasiaan penuh asas LUBERJURDIL.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-800">
                <div className="space-y-12">
                  <p>Mengetahui,<br /><span className="font-bold">Pembina OSIS SMKN 4</span></p>
                  <p className="font-bold underline">H. Ahmad Fauzi, M.Pd.</p>
                </div>
                <div className="space-y-12">
                  <p>Hormat kami,<br /><span className="font-bold">Ketua Panitia Pelaksana</span></p>
                  <p className="font-bold underline">Bagas Pratama Putra</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WhatsApp Broadcast Template */}
          {activeTab === 'whatsapp' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Template Siaran WhatsApp Grup Kelas</h3>
                  <p className="text-xs text-slate-500">
                    Format pesan siap dikirim ke grup WhatsApp wali kelas dan siswa
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyWA}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                  >
                    {copiedWA ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedWA ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>

                  <button
                    onClick={handleShareWA}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim ke WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Message Preview Box */}
              <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-slate-300 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {waBroadcastText}
              </div>
            </div>
          )}

          {/* TAB 3: Excel Distribution & Uncensored Token List */}
          {activeTab === 'tokens' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              {/* Header Box & Download Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Distribusi 1 File Excel per Kelas</span>
                  </div>
                  <h3 className="text-base font-black text-emerald-950">
                    File Excel Distribusi: {currentClass?.name}
                  </h3>
                  <p className="text-xs text-emerald-800/80">
                    Format file Excel telah dilengkapi informasi kelas, tata cara vote, dan tabel nomor absen beserta token lengkap tanpa sensor.
                  </p>
                </div>

                <button
                  onClick={handleExportExcel}
                  disabled={tokens.length === 0}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex-shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>📥 Unduh File Excel {currentClass?.name} (.xlsx)</span>
                </button>
              </div>

              {/* LIVE EXCEL PREVIEW BOX (Sebelum Tabel: Nama Kelas, Jadwal & Tata Cara Vote) */}
              <div className="rounded-2xl border-2 border-emerald-300/80 bg-white overflow-hidden shadow-xs">
                {/* Excel Tab Bar Simulation */}
                <div className="px-4 py-2 bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Lembar Kerja: Token_{currentClass?.name.replace(/[^a-zA-Z0-9_-]/g, '_')}</span>
                  </span>
                  <span className="text-emerald-200 text-[10px] font-mono">Pratinjau Struktur File Excel</span>
                </div>

                <div className="p-6 space-y-5 bg-gradient-to-b from-emerald-50/30 to-white">
                  {/* Top Titles in Excel */}
                  <div className="text-center space-y-0.5 pb-3 border-b border-emerald-200/60">
                    <p className="text-sm font-black text-slate-900 tracking-tight">
                      PEMILIHAN KETUA & WAKIL KETUA OSIS — SMK NEGERI 4 KOTA SERANG
                    </p>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      LEMBAR RESMI DISTRIBUSI TOKEN BILIK SUARA DIGITAL (MASA BAKTI 2026/2027)
                    </p>
                  </div>

                  {/* Section A: Informasi Kelas & Pelaksanaan (Sebelum Tabel) */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-xs">
                    <p className="font-black text-slate-900 uppercase tracking-wider text-[11px] text-blue-700 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      <span>1. INFORMASI KELAS & JADWAL PELAKSANAAN:</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px]">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-sans">Nama Kelas:</span>
                        <span className="font-bold text-slate-900">{currentClass?.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-sans">Wali Kelas / Pendamping:</span>
                        <span className="font-bold text-slate-900">{homeroomTeacher || '...........................................'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-sans">Alokasi DPT:</span>
                        <span className="font-bold text-slate-900">{tokens.length || voterCount} Siswa</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-sans">Hari, Tanggal Pemilihan:</span>
                        <span className="font-bold text-slate-900">{electionDate}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-sans">Tautan Bilik Suara:</span>
                        <span className="font-bold text-blue-700 underline">{voteUrl}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-sans">Waktu Pelaksanaan:</span>
                        <span className="font-bold text-slate-900">{electionTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Panduan & Tata Cara Vote (Sebelum Tabel) */}
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
                    <p className="font-black text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span>2. PANDUAN & TATA CARA MEMILIH (WAJIB DIBACA WALI KELAS & SISWA):</span>
                    </p>
                    <div className="space-y-1.5 text-[11px] text-amber-900/90 font-medium">
                      <p>• <strong>Langkah 1:</strong> Buka peramban (browser) di smartphone atau komputer, lalu akses tautan bilik suara: <strong className="text-blue-700 underline">{voteUrl}</strong></p>
                      <p>• <strong>Langkah 2:</strong> Cari nomor absen Anda pada tabel di bawah, lalu salin/ketik <strong>Kode Token Pemilihan</strong> resmi yang tertera.</p>
                      <p>• <strong>Langkah 3:</strong> Tentukan pilihan 1 (satu) Calon Ketua OSIS dan 1 (satu) Calon Wakil Ketua OSIS berdasarkan nurani Anda.</p>
                      <p>• <strong>Langkah 4:</strong> Tinjau kembali ringkasan pilihan Anda, lalu tekan tombol <strong>"Kirim Suara Sah"</strong> hingga muncul konfirmasi "SUARAMU TELAH TERCATAT".</p>
                      <p className="pt-1 text-[10px] text-amber-950 font-bold italic">
                        * Peringatan: Setiap token hanya berlaku untuk 1 KALI vote. Bersifat RAHASIA dan tidak boleh diberikan kepada siapa pun!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section C: Tabel Absen dan Token Siswa (Tanpa Sensor) */}
                <div className="p-6 pt-0 space-y-4 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      3. TABEL DAFTAR NOMOR ABSEN & KODE TOKEN RESMI (LENGKAP TANPA SENSOR)
                    </h4>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari kode token atau absen..."
                        value={tokenSearch}
                        onChange={(e) => setTokenSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {tokens.length === 0 ? (
                    <div className="p-12 text-center space-y-3 rounded-2xl bg-slate-50 border border-slate-200/60">
                      <KeyRound className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">Belum Ada Token untuk Kelas Ini</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Gunakan formulir di sebelah kiri untuk menerbitkan batch token untuk {currentClass?.name}.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                            <th className="py-2.5 px-3">No. Absen</th>
                            <th className="py-2.5 px-3">Nama Siswa / DPT</th>
                            <th className="py-2.5 px-3">Kode Token Resmi (Lengkap)</th>
                            <th className="py-2.5 px-3">Status Hak Suara</th>
                            <th className="py-2.5 px-3">Waktu Coblos</th>
                            <th className="py-2.5 px-3 text-center">Paraf / Ceklis</th>
                            <th className="py-2.5 px-3 text-right">Salin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredTokens.map((t, idx) => {
                            const plainToken = t.plain || t.preview;
                            return (
                              <tr key={t.id} className="hover:bg-emerald-50/40 transition-colors">
                                <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-900 font-mono text-[11px]">
                                  Absen {String(idx + 1).padStart(2, '0')}
                                </td>
                                <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                                  ........................................
                                </td>
                                <td className="py-2 px-3">
                                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 font-mono font-black text-emerald-900 tracking-wider text-[11px]">
                                    {plainToken}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      t.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : t.status === 'used'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {t.status === 'active'
                                      ? 'Siap Coblos'
                                      : t.status === 'used'
                                      ? 'Sudah Memilih'
                                      : 'Dibatalkan'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-[11px] text-slate-500 font-mono">
                                  {t.used_at ? new Date(t.used_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </td>
                                <td className="py-2 px-3 text-center text-[11px] font-mono text-slate-400">
                                  {t.status === 'used' ? (
                                    <span className="text-emerald-600 font-bold">[ SUDAH ]</span>
                                  ) : (
                                    '[       ]'
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(plainToken);
                                      setCopiedTokenId(t.id);
                                      setTimeout(() => setCopiedTokenId(null), 1500);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 transition-colors"
                                    title="Salin Token"
                                  >
                                    {copiedTokenId === t.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRINT-ONLY VIEW (Hidden on screen, Visible on Print Paper A4) */}
      <div className="hidden print:block p-8 space-y-6 text-black bg-white">
        <div className="text-center space-y-1 pb-4 border-b-4 border-double border-black">
          <p className="text-[11px] font-bold uppercase tracking-wider">
            PEMERINTAH DAERAH PROVINSI BANTEN — DINAS PENDIDIKAN DAN KEBUDAYAAN
          </p>
          <h1 className="text-xl font-black uppercase tracking-tight">
            SMK NEGERI 4 KOTA SERANG
          </h1>
          <p className="text-[10px]">
            Jl. Raya Taktakan KM 03 Serang, Banten 42162 | Website: smkn4kotaserang.sch.id
          </p>
          <p className="text-[11px] font-black uppercase tracking-wider">
            KOMISI PEMILIHAN KETUA & WAKIL KETUA OSIS — MASA BAKTI 2026/2027
          </p>
        </div>

        <div className="flex justify-between text-xs">
          <div>
            <p><strong>Nomor:</strong> 04/PAN-PILKETOS/SMKN4/X/2026</p>
            <p><strong>Perihal:</strong> Pengumuman Resmi & Daftar Distribusi Token Bilik Suara</p>
          </div>
          <div className="text-right">
            <p>Kota Serang, {electionDate.split(',')[1]?.trim() || '26 Oktober 2026'}</p>
            <p><strong>Kelas:</strong> {currentClass?.name}</p>
          </div>
        </div>

        <div className="text-xs space-y-2 text-justify">
          <p>
            Diberitahukan kepada seluruh siswa/i kelas <strong>{currentClass?.name}</strong>, bahwa Pemilihan Ketua dan Wakil Ketua OSIS SMKN 4 Kota Serang akan dilaksanakan pada:
          </p>
          <ul className="list-disc pl-6 space-y-1 font-semibold">
            <li>Hari, Tanggal: {electionDate}</li>
            <li>Waktu Pencoblosan: {electionTime}</li>
            <li>Tempat / Lokasi: {electionVenue}</li>
            <li>Tautan Bilik Suara Digital: {voteUrl}</li>
          </ul>
        </div>

        {/* Tokens Grid for Physical Distribution Slip */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider border-b border-black pb-1">
            Lampiran: Daftar Token Pemilihan Resmi Siswa Kelas {currentClass?.name}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {tokens.map((t, idx) => (
              <div key={t.id} className="p-2 border border-black rounded text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>Absen {idx + 1}</span>
                  <span>{currentClass?.name}</span>
                </div>
                <div className="font-mono font-black text-center text-xs py-1 bg-slate-100 border border-slate-300">
                  {t.plain || t.preview}
                </div>
                <p className="text-[8px] text-center text-slate-600">Gunakan di {voteUrl}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
