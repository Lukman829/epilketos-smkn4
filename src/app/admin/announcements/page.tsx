'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Megaphone,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  Send,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  FileText,
  KeyRound,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ClassRecord } from '@/types/election';
import { exportClassTokensToExcel, TokenExportItem } from '@/lib/excelExport';

export default function AdminAnnouncementsPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [tokens, setTokens] = useState<TokenExportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form states (Require Nama Kelas & Jumlah Siswa)
  const [voterCount, setVoterCount] = useState<number>(36);
  const [homeroomTeacher, setHomeroomTeacher] = useState<string>('');
  const [electionDate, setElectionDate] = useState<string>('Senin, 26 Oktober 2026');
  const [electionTime, setElectionTime] = useState<string>('08:00 - 14:00 WIB');
  const [electionVenue, setElectionVenue] = useState<string>(
    'Bilik Suara Digital (Lab Komputer / Smartphone Masing-Masing)'
  );
  const [specialNotes, setSpecialNotes] = useState<string>(
    '1. Setiap token hanya dapat digunakan untuk 1 (satu) kali pemberian suara sah.\n2. Token bersifat pribadi dan rahasia, dilarang membagikan kode token kepada orang lain.\n3. Pemilihan dapat diakses melalui smartphone atau komputer yang terhubung ke internet.'
  );

  // Tab state: 'excel' | 'letter' | 'broadcast'
  const [activeTab, setActiveTab] = useState<'excel' | 'letter' | 'broadcast'>('excel');
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
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

  // Handle Generate Batch Tokens
  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId) {
      setNotification({ type: 'error', text: 'Nama kelas wajib dipilih.' });
      return;
    }

    if (!voterCount || voterCount < 1 || voterCount > 100) {
      setNotification({
        type: 'error',
        text: 'Jumlah siswa wajib diisi antara 1 hingga 100 siswa.',
      });
      return;
    }

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
          class_id: selectedClassId,
          count: voterCount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          text: `Berhasil menerbitkan ${data.count} token pemilihan untuk ${currentClass?.name}. Berkas pengumuman dan ekspor Excel telah aktif.`,
        });

        // Refetch tokens
        const tokRes = await fetch(`/api/admin/tokens?class_id=${selectedClassId}&status=all`, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });
        const tokData = await tokRes.json();
        if (tokData.success) {
          setTokens(tokData.tokens);
          setActiveTab('excel');
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

  // Broadcast Message Template
  const broadcastText = useMemo(() => {
    const className = currentClass ? currentClass.name : 'Kelas';
    const teacherSalutation = homeroomTeacher.trim()
      ? `Bapak/Ibu ${homeroomTeacher.trim()}`
      : 'Bapak/Ibu Wali Kelas';

    return (
`PEMBERITAHUAN PELAKSANAAN PEMILIHAN KETUA DAN WAKIL KETUA OSIS
SMK NEGERI 4 KOTA SERANG
Masa Bakti 2026/2027

Yth. ${teacherSalutation} dan Seluruh Peserta Didik Kelas ${className},

Sehubungan dengan pelaksanaan Pemilihan Ketua dan Wakil Ketua OSIS SMK Negeri 4 Kota Serang secara digital, berikut kami sampaikan jadwal dan ketentuan pelaksanaan:

• Hari, Tanggal: ${electionDate}
• Waktu Pelaksanaan: ${electionTime}
• Lokasi / Akses: ${electionVenue}
• Alamat Bilik Suara Digital:
${voteUrl}

TATA CARA PENGGUNAAN HAK SUARA:
1. Akses alamat bilik suara: ${voteUrl}
2. Masukkan Kode Token Pemilihan resmi yang tertera pada daftar distribusi kelas.
3. Tentukan pilihan 1 Calon Ketua dan 1 Calon Wakil Ketua OSIS.
4. Periksa ringkasan pilihan dan selesaikan pengiriman suara.

KETENTUAN:
${specialNotes}

Demikian pemberitahuan ini disampaikan. Diharapkan seluruh peserta didik dapat menggunakan hak pilihnya secara tertib dan bertanggung jawab.

Komisi Pemilihan OSIS SMKN 4 Kota Serang`
    );
  }, [currentClass, homeroomTeacher, electionDate, electionTime, electionVenue, voteUrl, specialNotes]);

  // Copy Broadcast Text
  const handleCopyBroadcast = () => {
    navigator.clipboard.writeText(broadcastText);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  // Open Direct WhatsApp Share
  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(broadcastText);
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
  const hasTokens = tokens.length > 0;

  return (
    <div className="space-y-8 print:p-0 print:m-0 print:space-y-0">
      {/* Screen Header (Hidden on Print) */}
      <div className="print:hidden p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-blue-600" />
          <span>Pengumuman &amp; Distribusi Token Pemilihan</span>
        </h1>
        <p className="text-xs text-slate-500">
          Formulir penerbitan batch token per kelas, pembuatan dokumen resmi, dan pengunduhan berkas Excel distribusi.
        </p>
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
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs underline hover:no-underline">
            Tutup
          </button>
        </div>
      )}

      {/* SECTION 1: FORMULIR PENERBITAN BATCH TOKEN KELAS (UPFRONT & PROMINENT) */}
      <div className="print:hidden p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <span>Formulir Penerbitan Batch Token Kelas</span>
              </h2>
              <p className="text-xs text-slate-500">
                Lengkapi kolom wajib di bawah ini. Token pemilihan akan diterbitkan dan berkas Excel pengumuman otomatis siap diunduh.
              </p>
            </div>

            {hasTokens && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{tokens.length} Token Telah Diterbitkan</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleGenerateBatch} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Field 1: Nama Kelas */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-900 flex items-center justify-between">
                <span>Nama Kelas <span className="text-rose-600 font-bold">* (Wajib)</span></span>
                <span className="text-[11px] font-normal text-slate-400">Pilih dari 30 Rombel</span>
              </label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="">-- Pilih Nama Kelas --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.voter_quota} Siswa)
                  </option>
                ))}
              </select>
            </div>

            {/* Required Field 2: Jumlah Siswa */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-900 flex items-center justify-between">
                <span>Jumlah Siswa (DPT) <span className="text-rose-600 font-bold">* (Wajib)</span></span>
                <span className="text-[11px] font-normal text-slate-400">Standar 36 Siswa</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={voterCount}
                onChange={(e) => setVoterCount(parseInt(e.target.value) || 0)}
                placeholder="Masukkan jumlah siswa..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Supporting Field: Wali Kelas */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Wali Kelas / Guru Pendamping (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Bpk. Rahmat Santoso, S.Pd."
                value={homeroomTeacher}
                onChange={(e) => setHomeroomTeacher(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Supporting Field: Hari & Tanggal */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Hari, Tanggal Pemilihan</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={electionDate}
                  onChange={(e) => setElectionDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Supporting Field: Waktu Pelaksanaan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Waktu Pelaksanaan</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={electionTime}
                  onChange={(e) => setElectionTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Supporting Field: Lokasi / Akses */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Lokasi / Akses Pemilihan</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={electionVenue}
                  onChange={(e) => setElectionVenue(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {hasTokens
                ? `${tokens.length} token aktif siap diekspor dalam template dokumen resmi.`
                : 'Setelah formulir diisi dan diserahkan, token akan otomatis dihasilkan.'}
            </p>

            <button
              type="submit"
              disabled={isGenerating || !selectedClassId || !voterCount}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {isGenerating
                  ? 'Sedang Menerbitkan...'
                  : hasTokens
                  ? `Terbitkan Tambahan (${voterCount} Token Baru)`
                  : `Terbitkan Token (${voterCount} Token Siswa)`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: TEMPLATE PENGUMUMAN & EKSPOR EXCEL (AKTIF SETELAH TOKEN TERSEDIA) */}
      <div className="print:hidden space-y-4">
        {!hasTokens ? (
          /* Empty State: Prompting to fill form */
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <KeyRound className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-800">
              Token Belum Diterbitkan untuk Kelas Ini
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Silakan lengkapi <strong>Nama Kelas</strong> dan <strong>Jumlah Siswa</strong> pada formulir di atas, kemudian tekan tombol <strong>&ldquo;Terbitkan Token&rdquo;</strong>. Setelah itu, berkas pengumuman resmi dan tautan unduh Excel distribusi kelas akan otomatis aktif di bagian ini.
            </p>
          </div>
        ) : (
          /* Active State: Ready for Export & Document Previews */
          <div className="space-y-4">
            {/* Top Action Bar with Prominent Excel Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 w-fit">
                <button
                  onClick={() => setActiveTab('excel')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                    activeTab === 'excel'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Berkas Excel Distribusi ({tokens.length})</span>
                </button>

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
                  onClick={() => setActiveTab('broadcast')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                    activeTab === 'broadcast'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Teks Pemberitahuan</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportExcel}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh Dokumen Excel {currentClass?.name} (.xlsx)</span>
                </button>

                <button
                  onClick={handlePrintLetter}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Resmi</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: EXCEL DISTRIBUTION PREVIEW */}
            {activeTab === 'excel' && (
              <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-emerald-700 text-white text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Lembar Kerja Distribusi: Token_{currentClass?.name.replace(/[^a-zA-Z0-9_-]/g, '_')}</span>
                  </span>
                  <span className="text-emerald-200 text-[11px] font-mono">
                    Format Resmi 1 Berkas per Kelas
                  </span>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Top Titles in Excel */}
                  <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      PEMILIHAN KETUA DAN WAKIL KETUA OSIS — SMK NEGERI 4 KOTA SERANG
                    </p>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      DAFTAR DISTRIBUSI TOKEN PEMILIHAN OSIS (MASA BAKTI 2026/2027)
                    </p>
                  </div>

                  {/* Section A: Informasi Kelas & Pelaksanaan (Sebelum Tabel) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-blue-700 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      <span>INFORMASI KELAS DAN JADWAL PELAKSANAAN</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px]">
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-sans">Nama Kelas:</span>
                        <span className="font-bold text-slate-900">{currentClass?.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-sans">Wali Kelas / Pendamping:</span>
                        <span className="font-bold text-slate-900">{homeroomTeacher || '...........................................'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-sans">Alokasi DPT:</span>
                        <span className="font-bold text-slate-900">{tokens.length} Siswa</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-sans">Hari, Tanggal Pemilihan:</span>
                        <span className="font-bold text-slate-900">{electionDate}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-sans">Tautan Bilik Suara:</span>
                        <span className="font-bold text-blue-700 underline">{voteUrl}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-1">
                        <span className="text-slate-500 font-sans">Waktu Pelaksanaan:</span>
                        <span className="font-bold text-slate-900">{electionTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section B: Panduan & Tata Cara Vote (Sebelum Tabel) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-slate-700" />
                      <span>PANDUAN DAN TATA CARA PEMILIHAN (HAK SUARA SISWA)</span>
                    </p>
                    <div className="space-y-1.5 text-[11px] text-slate-700 font-medium">
                      <p>• <strong>Langkah 1:</strong> Akses portal bilik suara digital melalui peramban pada tautan: <strong className="text-blue-700 underline">{voteUrl}</strong></p>
                      <p>• <strong>Langkah 2:</strong> Periksa kode token pemilihan resmi pada baris nomor absen Anda di bawah.</p>
                      <p>• <strong>Langkah 3:</strong> Tentukan pilihan 1 (satu) Calon Ketua dan 1 (satu) Calon Wakil Ketua OSIS berdasarkan pertimbangan pribadi.</p>
                      <p>• <strong>Langkah 4:</strong> Tinjau kembali ringkasan pilihan dan tekan tombol konfirmasi hingga pemberitahuan berhasil ditampilkan.</p>
                      <p className="pt-1 text-[10px] text-slate-500 font-semibold italic">
                        * Ketentuan: Kode token bersifat rahasia dan hanya berlaku untuk 1 (satu) kali penggunaan.
                      </p>
                    </div>
                  </div>

                  {/* Section C: Tabel Absen dan Token Siswa (Tanpa Sensor) */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        DAFTAR NOMOR ABSEN DAN KODE TOKEN PEMILIHAN
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

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">No</th>
                            <th className="py-2.5 px-3 w-28">No. Absen</th>
                            <th className="py-2.5 px-3">Kode Token Pemilihan (Lengkap)</th>
                            <th className="py-2.5 px-3">Tautan Bilik Suara</th>
                            <th className="py-2.5 px-3 w-16 text-right">Salin</th>
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
                                <td className="py-2 px-3">
                                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 font-mono font-black text-emerald-900 tracking-wider text-[11px]">
                                    {plainToken}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-[11px] text-blue-700 font-mono underline break-all">
                                  {voteUrl}
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
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: OFFICIAL LETTER A4 */}
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
                    KOMISI PEMILIHAN KETUA &amp; WAKIL KETUA OSIS — MASA BAKTI 2026/2027
                  </p>
                </div>

                {/* Letter Meta */}
                <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-700 gap-2">
                  <div>
                    <p><span className="font-bold">Nomor:</span> 04/PAN-PILKETOS/SMKN4/X/2026</p>
                    <p><span className="font-bold">Lampiran:</span> 1 (satu) Berkas Lembar Token Siswa</p>
                    <p><span className="font-bold">Perihal:</span> Pemberitahuan &amp; Distribusi Token Bilik Suara Digital</p>
                  </div>
                  <div className="sm:text-right">
                    <p>Kota Serang, {electionDate.split(',')[1]?.trim() || '26 Oktober 2026'}</p>
                    <p className="font-bold text-slate-900">Kepada Yth.</p>
                    <p>Bapak/Ibu Wali Kelas &amp; Seluruh Siswa/i</p>
                    <p className="font-black text-blue-600">{currentClass?.name || 'Kelas'}</p>
                  </div>
                </div>

                {/* Letter Body */}
                <div className="text-xs leading-relaxed space-y-4 text-justify text-slate-700">
                  <p>
                    Dengan hormat, sehubungan dengan pelaksanaan Pemilihan Ketua dan Wakil Ketua OSIS SMK Negeri 4 Kota Serang Masa Bakti 2026/2027 secara daring melalui platform E-PILKETOS SMKN 4, kami panitia pelaksana menyampaikan informasi pelaksanaan sebagai berikut:
                  </p>

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
                      <span className="col-span-2 text-slate-900">: {tokens.length} Pemilih Terdaftar</span>
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
                    <li>Masukkan <strong>Kode Token Pemilihan Resmi</strong> yang tertera pada lembar distribusi masing-masing siswa.</li>
                    <li>Tentukan pilihan 1 (satu) Calon Ketua OSIS dan 1 (satu) Calon Wakil Ketua OSIS berdasarkan pertimbangan pribadi.</li>
                    <li>Konfirmasi pilihan Anda pada layar verifikasi dan tekan tombol <strong>Kirim Suara Sah</strong>.</li>
                  </ol>

                  <p className="italic text-[11px] text-slate-500">
                    *Catatan: Kode token bersifat rahasia dan langsung kedaluwarsa setelah suara sah tercatat. Surat suara disimpan secara anonim tanpa identitas pemilih demi menjamin kerahasiaan penuh asas LUBERJURDIL.
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

            {/* TAB CONTENT: BROADCAST TEXT */}
            {activeTab === 'broadcast' && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Format Teks Siaran Pemberitahuan</h3>
                    <p className="text-xs text-slate-500">
                      Teks resmi untuk dibagikan ke grup wali kelas dan peserta didik
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyBroadcast}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                    >
                      {copiedBroadcast ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedBroadcast ? 'Tersalin' : 'Salin Teks'}</span>
                    </button>

                    <button
                      onClick={handleShareWhatsApp}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim ke WhatsApp</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {broadcastText}
                </div>
              </div>
            )}
          </div>
        )}
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
            KOMISI PEMILIHAN KETUA &amp; WAKIL KETUA OSIS — MASA BAKTI 2026/2027
          </p>
        </div>

        <div className="flex justify-between text-xs">
          <div>
            <p><strong>Nomor:</strong> 04/PAN-PILKETOS/SMKN4/X/2026</p>
            <p><strong>Perihal:</strong> Pengumuman Resmi &amp; Daftar Distribusi Token Bilik Suara</p>
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
