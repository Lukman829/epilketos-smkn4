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
    alert('Belum ada token untuk kelas ini yang dapat diekspor. Silakan lakukan batch generate terlebih dahulu.');
    return;
  }

  const teacherNameDisplay = homeroomTeacher.trim() ? homeroomTeacher.trim() : '...........................................';

  const aoaData: (string | number)[][] = [
    // 1. Header Judul Resmi
    [`PEMILIHAN KETUA & WAKIL KETUA OSIS — ${schoolName}`],
    [`LEMBAR RESMI DISTRIBUSI TOKEN BILIK SUARA DIGITAL (${academicYear})`],
    [],
    // 2. Blok Identitas Kelas & Pelaksanaan
    ['INFORMASI KELAS & JADWAL PELAKSANAAN:'],
    ['Nama Kelas:', className, '', 'Wali Kelas / Pendamping:', teacherNameDisplay],
    ['Alokasi DPT:', `${tokens.length} Siswa (Kuota: ${voterQuota})`, '', 'Hari, Tanggal Pemilihan:', electionDate],
    ['Tautan Bilik Suara:', voteUrl, '', 'Waktu Pelaksanaan:', electionTime],
    ['Lokasi / Akses:', electionVenue, '', 'Status Dokumen:', 'RESMI & RAHASIA'],
    [],
    // 3. Blok Panduan & Tata Cara Memilih (Dibaca Wali Kelas & Siswa sebelum tabel)
    ['PANDUAN & TATA CARA MEMILIH DI BILIK SUARA DIGITAL (WAJIB DIBACA SISWA):'],
    ['Langkah 1:', `Buka peramban (browser) di smartphone atau komputer, lalu akses: ${voteUrl}`],
    ['Langkah 2:', 'Cari nomor absen Anda pada tabel di bawah, lalu salin/ketik Kode Token Pemilihan resmi yang tertera.'],
    ['Langkah 3:', 'Tentukan pilihan 1 (satu) Calon Ketua OSIS dan 1 (satu) Calon Wakil Ketua OSIS berdasarkan nurani Anda.'],
    ['Langkah 4:', 'Tinjau kembali ringkasan pilihan Anda, lalu tekan tombol "Kirim Suara Sah" sampai muncul konfirmasi.'],
    ['PERINGATAN KERAHASIAAN:', 'Setiap token hanya berlaku untuk 1 KALI vote. Kode token bersifat RAHASIA dan tidak boleh diberikan kepada siapa pun!'],
    [],
    // 4. Baris Header Tabel
    [
      'No',
      'No. Absen',
      'Kode Token Pemilihan (Lengkap Tanpa Sensor)',
      'Tautan Bilik Suara',
    ],
  ];

  // 5. Baris Data Token & Absen Siswa
  tokens.forEach((t, idx) => {
    // Pastikan token lengkap tanpa disensor
    const plainToken = (t.plain && !t.plain.includes('*')) ? t.plain : (t.preview || t.id);

    aoaData.push([
      idx + 1,
      `Absen ${String(idx + 1).padStart(2, '0')}`,
      plainToken,
      voteUrl,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  // Lebar kolom rapi dan proporsional (tidak ada teks terpotong)
  ws['!cols'] = [
    { wch: 8 },  // No
    { wch: 16 }, // No. Absen
    { wch: 30 }, // Kode Token Pemilihan (Lengkap Tanpa Sensor)
    { wch: 45 }, // Tautan Bilik Suara
  ];

  const wb = XLSX.utils.book_new();
  const safeClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, `Token_${safeClassName}`.slice(0, 31));

  // Nama file profesional 1 file per kelas
  const fileName = `DISTRIBUSI_TOKEN_PILKETOS_${safeClassName}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
