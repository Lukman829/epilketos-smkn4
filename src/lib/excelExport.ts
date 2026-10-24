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

export interface ClassExcelExportParams {
  className: string;
  tokens: TokenExportItem[];
  voterQuota?: number;
  homeroomTeacher?: string;
  electionDate?: string;
  electionTime?: string;
  electionVenue?: string;
  voteUrl?: string;
  schoolName?: string;
  academicYear?: string;
  specialNotes?: string;
}

export function exportClassTokensToExcel(params: ClassExcelExportParams) {
  const {
    className,
    tokens,
    voterQuota = tokens.length || 36,
    homeroomTeacher = '...........................................',
    electionDate = 'Senin, 26 Oktober 2026',
    electionTime = '08:00 - 14:00 WIB',
    voteUrl = typeof window !== 'undefined' ? `${window.location.origin}/vote` : 'https://epilketos-smkn4.vercel.app/vote',
    schoolName = 'SMK NEGERI 4 KOTA SERANG',
    academicYear = 'Masa Bakti 2026/2027',
  } = params;

  if (tokens.length === 0) {
    alert('Belum ada token untuk kelas ini yang dapat diekspor. Silakan terbitkan token terlebih dahulu.');
    return;
  }

  const teacherNameDisplay = homeroomTeacher.trim() ? homeroomTeacher.trim() : '...........................................';

  // Format array of arrays
  const aoaData: (string | number)[][] = [
    // R1: Judul Utama (Merged A1:D1)
    [`PEMILIHAN KETUA & WAKIL KETUA OSIS — ${schoolName}`],
    // R2: Subjudul Dokumen (Merged A2:D2)
    [`DAFTAR DISTRIBUSI TOKEN PEMILIHAN DIGITAL (${academicYear.toUpperCase()})`],
    // R3: Baris kosong
    [],
    // R4: Banner Informasi Kelas (Merged A4:D4)
    ['INFORMASI KELAS & JADWAL PELAKSANAAN'],
    // R5: Meta 1
    ['Nama Kelas:', className, 'Wali Kelas / Pendamping:', teacherNameDisplay],
    // R6: Meta 2
    ['Alokasi DPT:', `${tokens.length} Siswa (Kuota: ${voterQuota})`, 'Hari, Tanggal Pemilihan:', electionDate],
    // R7: Meta 3
    ['Waktu Pelaksanaan:', electionTime, 'Tautan Bilik Suara:', voteUrl],
    // R8: Baris kosong
    [],
    // R9: Banner Panduan (Merged A9:D9)
    ['PANDUAN & TATA CARA PEMILIHAN SISWA (1 TOKEN BERLAKU 1 KALI PAKAI)'],
    // R10: Petunjuk 1 (Merged A10:D10)
    [`1. Akses portal bilik suara resmi melalui peramban: ${voteUrl}`],
    // R11: Petunjuk 2 (Merged A11:D11)
    ['2. Periksa baris nomor absen masing-masing pada tabel di bawah untuk melihat Kode Token Pemilihan Resmi.'],
    // R12: Petunjuk 3 (Merged A12:D12)
    ['3. Tentukan pilihan 1 (satu) Calon Ketua dan 1 (satu) Calon Wakil Ketua OSIS secara independen.'],
    // R13: Petunjuk 4 (Merged A13:D13)
    ['4. Tinjau kembali pilihan dan tekan tombol Kirim Suara Sah hingga bukti konfirmasi berhasil ditampilkan.'],
    // R14: Ketentuan (Merged A14:D14)
    ['*Ketentuan: Satu kode token hanya berlaku 1 kali pakai dan langsung kedaluwarsa setelah suara terkirim.'],
    // R15: Baris kosong
    [],
    // R16: Header Tabel Data (Index 15)
    [
      'No',
      'No. Absen',
      'Kode Token Pemilihan (Lengkap)',
      'Tautan Bilik Suara',
    ],
  ];

  // R17 dst: Data Siswa
  tokens.forEach((t, idx) => {
    const plainToken = (t.plain && !t.plain.includes('*')) ? t.plain : (t.preview || t.id);

    aoaData.push([
      idx + 1,
      `Absen ${String(idx + 1).padStart(2, '0')}`,
      plainToken,
      voteUrl,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  // Merge banner & guidance rows across columns A to D (col 0 to 3)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // R1: Judul Utama
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // R2: Subjudul
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // R4: Banner Info
    { s: { r: 8, c: 0 }, e: { r: 8, c: 3 } }, // R9: Banner Panduan
    { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } }, // R10: Petunjuk 1
    { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } }, // R11: Petunjuk 2
    { s: { r: 11, c: 0 }, e: { r: 11, c: 3 } }, // R12: Petunjuk 3
    { s: { r: 12, c: 0 }, e: { r: 12, c: 3 } }, // R13: Petunjuk 4
    { s: { r: 13, c: 0 }, e: { r: 13, c: 3 } }, // R14: Ketentuan
  ];

  // Lebar kolom rapi dan proporsional
  ws['!cols'] = [
    { wch: 8 },  // Kolom A: No
    { wch: 18 }, // Kolom B: No. Absen / Nama Kelas / Value
    { wch: 34 }, // Kolom C: Kode Token Pemilihan / Label Kanan
    { wch: 48 }, // Kolom D: Tautan Bilik Suara / Value Kanan
  ];

  const wb = XLSX.utils.book_new();
  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, `Token_${safeClassName}`.slice(0, 31));

  // Nama file resmi per kelas
  const fileName = `DISTRIBUSI_TOKEN_PILKETOS_${safeClassName}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
