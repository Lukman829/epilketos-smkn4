import * as XLSX from 'xlsx';

export interface TokenExportItem {
  id: string;
  plain: string;
  preview: string;
  class_name: string;
  status: string;
  created_at: string;
  used_at?: string | null;
  revoked_reason?: string | null;
}

export function exportClassTokensToExcel(params: {
  className: string;
  tokens: TokenExportItem[];
  voteUrl?: string;
  eventDate?: string;
  schoolName?: string;
  academicYear?: string;
}) {
  const {
    className,
    tokens,
    voteUrl = typeof window !== 'undefined' ? `${window.location.origin}/vote` : 'https://epilketos-smkn4.vercel.app/vote',
    eventDate = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    schoolName = 'SMK NEGERI 4 KOTA SERANG',
    academicYear = 'Masa Bakti 2026/2027',
  } = params;

  if (tokens.length === 0) {
    alert('Belum ada token untuk kelas ini yang dapat diekspor.');
    return;
  }

  const headerRows = [
    ['PEMILIHAN KETUA & WAKIL KETUA OSIS — ' + schoolName],
    ['DAFTAR RESMI DISTRIBUSI TOKEN BILIK SUARA DIGITAL (' + academicYear + ')'],
    [`Kelas: ${className}`, `Jumlah DPT: ${tokens.length} Siswa`, `Tanggal: ${eventDate}`, 'Status: RESMI & RAHASIA'],
    [`Tautan Bilik Suara: ${voteUrl}`],
    ['Catatan Keamanan: Setiap token bersifat rahasia dan hanya dapat digunakan untuk 1 (satu) kali pemberian suara sah.'],
    [], // Pemisah baris kosong
    [
      'No',
      'No. Urut / Nama Pemilih',
      'Kode Token Resmi (Lengkap Tanpa Sensor)',
      'Kelas',
      'Status Token',
      'Waktu Pencoblosan',
      'Tautan Bilik Suara Digital',
      'Keterangan & Petunjuk',
    ],
  ];

  const dataRows = tokens.map((t, idx) => {
    // Make sure token is fully uncensored
    const plainToken = (t.plain && !t.plain.includes('*')) ? t.plain : (t.preview || t.id);

    let statusLabel = 'AKTIF / SIAP COBLOS';
    if (t.status === 'used') statusLabel = 'SUDAH DIGUNAKAN';
    if (t.status === 'revoked') statusLabel = 'DIBATALKAN';

    const usedTime = t.used_at ? new Date(t.used_at).toLocaleString('id-ID') : '-';
    const note = t.status === 'used'
      ? 'Suara telah tercatat secara anonim'
      : t.status === 'revoked'
      ? `Dibatalkan: ${t.revoked_reason || 'Pencabutan panitia'}`
      : 'Buka bilik suara dan masukkan kode token ini';

    return [
      idx + 1,
      `Siswa Absen ${String(idx + 1).padStart(2, '0')}`,
      plainToken,
      t.class_name || className,
      statusLabel,
      usedTime,
      voteUrl,
      note,
    ];
  });

  const fullSheetData = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  // Lebar kolom rapi dan tidak terpotong
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 24 }, // No. Urut / Nama Pemilih
    { wch: 26 }, // Kode Token Resmi (Lengkap Tanpa Sensor)
    { wch: 18 }, // Kelas
    { wch: 20 }, // Status Token
    { wch: 22 }, // Waktu Pencoblosan
    { wch: 42 }, // Tautan Bilik Suara
    { wch: 38 }, // Keterangan & Petunjuk
  ];

  const wb = XLSX.utils.book_new();
  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, `Token_${safeClassName}`.slice(0, 31));

  const fileName = `Daftar_Token_PILKETOS_${safeClassName}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
