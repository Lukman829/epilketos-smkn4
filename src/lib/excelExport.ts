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
    electionVenue = 'Bilik Suara Digital (Lab Komputer / Smartphone Masing-Masing)',
    voteUrl = typeof window !== 'undefined' ? `${window.location.origin}/vote` : 'https://epilketos-smkn4.vercel.app/vote',
    schoolName = 'SMK NEGERI 4 KOTA SERANG',
    academicYear = 'Masa Bakti 2026/2027',
  } = params;

  if (tokens.length === 0) {
    alert('Belum ada token untuk kelas ini yang dapat diekspor. Silakan terbitkan token terlebih dahulu.');
    return;
  }

  const teacherNameDisplay = homeroomTeacher.trim() ? homeroomTeacher.trim() : '...........................................';

  const aoaData: (string | number)[][] = [
    // 1. Header Judul Resmi
    [`PEMILIHAN KETUA DAN WAKIL KETUA OSIS — ${schoolName}`],
    [`DAFTAR DISTRIBUSI TOKEN PEMILIHAN OSIS (${academicYear})`],
    [],
    // 2. Blok Identitas Kelas & Pelaksanaan
    ['INFORMASI KELAS DAN JADWAL PELAKSANAAN:'],
    ['Nama Kelas:', className, '', 'Wali Kelas / Pendamping:', teacherNameDisplay],
    ['Jumlah DPT:', `${tokens.length} Siswa (Kuota: ${voterQuota})`, '', 'Hari, Tanggal Pemilihan:', electionDate],
    ['Tautan Bilik Suara:', voteUrl, '', 'Waktu Pelaksanaan:', electionTime],
    ['Lokasi / Akses:', electionVenue, '', 'Status Dokumen:', 'RESMI DAN RAHASIA'],
    [],
    // 3. Blok Panduan & Tata Cara Memilih (Dibaca Wali Kelas & Siswa sebelum tabel)
    ['PANDUAN DAN TATA CARA PEMILIHAN (HAK SUARA SISWA):'],
    ['Langkah 1:', `Akses portal bilik suara digital melalui peramban pada tautan: ${voteUrl}`],
    ['Langkah 2:', 'Periksa kode token pemilihan resmi pada baris nomor absen Anda di bawah.'],
    ['Langkah 3:', 'Tentukan pilihan 1 (satu) Calon Ketua dan 1 (satu) Calon Wakil Ketua OSIS berdasarkan pertimbangan pribadi.'],
    ['Langkah 4:', 'Tinjau kembali ringkasan pilihan dan tekan tombol konfirmasi hingga pemberitahuan berhasil ditampilkan.'],
    ['KETENTUAN KERAHASIAAN:', 'Setiap kode token bersifat rahasia dan hanya berlaku untuk 1 (satu) kali penggunaan.'],
    [],
    // 4. Baris Header Tabel
    [
      'No',
      'No. Absen',
      'Kode Token Pemilihan (Lengkap)',
      'Tautan Bilik Suara',
    ],
  ];

  // 5. Baris Data Token & Absen Siswa
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

  // Lebar kolom rapi dan proporsional
  ws['!cols'] = [
    { wch: 8 },  // No
    { wch: 16 }, // No. Absen
    { wch: 32 }, // Kode Token Pemilihan (Lengkap)
    { wch: 45 }, // Tautan Bilik Suara
  ];

  const wb = XLSX.utils.book_new();
  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, `Token_${safeClassName}`.slice(0, 31));

  // Nama file resmi per kelas
  const fileName = `DISTRIBUSI_TOKEN_PILKETOS_${safeClassName}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
