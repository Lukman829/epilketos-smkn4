import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
  ShadingType,
  ImageRun,
} from 'docx';
import { TokenExportItem } from './excelExport';
import { SCHOOL_LOGO_DATA_URI } from './schoolLogoData';

export interface ClassDocxExportParams {
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
}

function getLogoBytes(): Uint8Array | null {
  try {
    if (!SCHOOL_LOGO_DATA_URI) return null;
    const base64 = SCHOOL_LOGO_DATA_URI.split(',')[1];
    if (!base64) return null;
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64');
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

export function generateClassDocx(params: ClassDocxExportParams): any {
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

  const logoBytes = getLogoBytes();
  const safeTeacher = homeroomTeacher.trim() ? homeroomTeacher.trim() : '...........................................';

  // Build Kop Surat row
  const kopChildren: any[] = [];
  if (logoBytes) {
    kopChildren.push(
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: logoBytes,
                transformation: { width: 75, height: 75 },
                type: 'jpg',
              }),
            ],
          }),
        ],
      })
    );
  }

  kopChildren.push(
    new TableCell({
      width: { size: logoBytes ? 84 : 100, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 40 },
          children: [
            new TextRun({
              text: 'PEMERINTAH DAERAH PROVINSI BANTEN',
              bold: true,
              size: 20,
              font: 'Arial',
              color: '334155',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 40 },
          children: [
            new TextRun({
              text: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
              bold: true,
              size: 22,
              font: 'Arial',
              color: '1E293B',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 60 },
          children: [
            new TextRun({
              text: schoolName,
              bold: true,
              size: 28,
              font: 'Arial',
              color: '1E3A8A',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 40 },
          children: [
            new TextRun({
              text: 'Jl. Raya Taktakan KM 03, Panggungjati, Kec. Taktakan, Kota Serang, Banten 42162',
              size: 15,
              font: 'Arial',
              color: '64748B',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { line: 240, after: 60 },
          children: [
            new TextRun({
              text: `KOMISI PEMILIHAN KETUA & WAKIL KETUA OSIS — ${academicYear.toUpperCase()}`,
              bold: true,
              size: 16,
              font: 'Arial',
              color: '2563EB',
            }),
          ],
        }),
      ],
    })
  );

  // Table rows for students
  const studentRows = [
    // Header Row
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: '1E293B' },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'No', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: '1E293B' },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'No. Absen', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 42, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: '1E293B' },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Kode Token Pemilihan (Lengkap)', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 32, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: '1E293B' },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Tautan Bilik Suara', bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })],
            }),
          ],
        }),
      ],
    }),
  ];

  tokens.forEach((t, idx) => {
    const plainToken = (t.plain && !t.plain.includes('*')) ? t.plain : (t.preview || t.id);
    const isEven = idx % 2 === 1;
    const bgFill = isEven ? 'F8FAFC' : 'FFFFFF';

    studentRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 8, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: bgFill },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(idx + 1), size: 17, font: 'Arial', color: '475569' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: bgFill },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Absen ${String(idx + 1).padStart(2, '0')}`,
                    bold: true,
                    size: 17,
                    font: 'Arial',
                    color: '1E293B',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 42, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: bgFill },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: plainToken,
                    bold: true,
                    font: 'Consolas',
                    size: 20,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: bgFill },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: voteUrl.replace(/^https?:\/\//, ''),
                    size: 15,
                    font: 'Arial',
                    color: '2563EB',
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  });

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: [
          // 1. Kop Surat Resmi
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.DOUBLE, size: 12, color: '000000' },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [new TableRow({ children: kopChildren })],
          }),

          new Paragraph({ spacing: { before: 200 } }),

          // 2. Judul Dokumen
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'SURAT PEMBERITAHUAN & DISTRIBUSI TOKEN SISWA',
                bold: true,
                size: 23,
                font: 'Arial',
                underline: {},
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: 'Nomor: 04/PAN-PILKETOS/SMKN4/X/2026',
                size: 17,
                font: 'Arial',
                color: '475569',
              }),
            ],
          }),

          // 3. Metadata Surat
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        spacing: { line: 240 },
                        children: [
                          new TextRun({ text: 'Lampiran: ', bold: true, size: 17, font: 'Arial' }),
                          new TextRun({ text: '1 (satu) Berkas Lembar Token Siswa', size: 17, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { line: 240 },
                        children: [
                          new TextRun({ text: 'Perihal: ', bold: true, size: 17, font: 'Arial' }),
                          new TextRun({ text: 'Distribusi Token Bilik Suara Digital', size: 17, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        spacing: { line: 240 },
                        children: [
                          new TextRun({ text: 'Alokasi DPT: ', bold: true, size: 17, font: 'Arial' }),
                          new TextRun({ text: `${tokens.length} Siswa Terdaftar (Kuota: ${voterQuota})`, size: 17, font: 'Arial' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { line: 240 },
                        children: [
                          new TextRun({ text: `Kota Serang, ${electionDate.split(',')[1]?.trim() || '26 Oktober 2026'}`, size: 17, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { line: 240 },
                        children: [
                          new TextRun({ text: 'Kepada Yth. Wali Kelas & Siswa/i:', bold: true, size: 17, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { line: 240 },
                        children: [
                          new TextRun({ text: className, bold: true, size: 22, color: '1E3A8A', font: 'Arial' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 180 } }),

          // 4. Jadwal & Tata Cara
          new Paragraph({
            spacing: { line: 260, after: 100 },
            children: [
              new TextRun({
                text: 'Dengan hormat, sehubungan dengan pelaksanaan Pemilihan Ketua dan Wakil Ketua OSIS secara digital melalui portal E-PILKETOS SMKN 4, berikut panduan pelaksanaan bagi siswa:',
                size: 17,
                font: 'Arial',
                color: '334155',
              }),
            ],
          }),

          new Paragraph({
            bullet: { level: 0 },
            spacing: { line: 240, after: 40 },
            children: [
              new TextRun({ text: 'Waktu Pelaksanaan: ', bold: true, size: 17, font: 'Arial' }),
              new TextRun({ text: `${electionDate}, Pukul ${electionTime}`, size: 17, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { line: 240, after: 40 },
            children: [
              new TextRun({ text: 'Akses Portal: ', bold: true, size: 17, font: 'Arial' }),
              new TextRun({ text: voteUrl, bold: true, color: '1E3A8A', size: 17, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { line: 240, after: 40 },
            children: [
              new TextRun({ text: 'Kode Token: ', bold: true, size: 17, font: 'Arial' }),
              new TextRun({ text: 'Lihat baris nomor absen masing-masing pada tabel di bawah. Satu token berlaku 1 (satu) kali pakai.', size: 17, font: 'Arial' }),
            ],
          }),
          new Paragraph({
            bullet: { level: 0 },
            spacing: { line: 240, after: 120 },
            children: [
              new TextRun({ text: 'Pemberian Suara: ', bold: true, size: 17, font: 'Arial' }),
              new TextRun({ text: 'Pilih 1 Calon Ketua dan 1 Calon Wakil secara independen, kemudian konfirmasi hingga bukti resmi tampil.', size: 17, font: 'Arial' }),
            ],
          }),

          new Paragraph({ spacing: { before: 180 } }),

          // 5. Tabel Token Siswa
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            rows: studentRows,
          }),

          new Paragraph({ spacing: { before: 200 } }),

          // 6. Catatan Aturan
          new Paragraph({
            spacing: { line: 240, after: 200 },
            children: [
              new TextRun({
                text: '*Ketentuan: Kode token pemilihan bersifat rahasia dan langsung kedaluwarsa setelah suara terkirim. Surat suara disimpan tanpa relasi ke identitas pribadi pemilih sesuai ketentuan asas LUBERJURDIL.',
                italics: true,
                size: 15,
                color: '64748B',
                font: 'Arial',
              }),
            ],
          }),

          // 7. Tanda Tangan Pengesahan
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { line: 240 },
                        children: [
                          new TextRun({ text: 'Mengetahui,\n', size: 17, font: 'Arial' }),
                          new TextRun({ text: 'Pembina OSIS SMKN 4 Kota Serang', bold: true, size: 17, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({ spacing: { before: 900 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: '(                                                      )', bold: true, size: 17, font: 'Arial' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { line: 240 },
                        children: [
                          new TextRun({ text: 'Panitia Pelaksana,\n', size: 17, font: 'Arial' }),
                          new TextRun({ text: 'Ketua Komisi Pemilihan OSIS', bold: true, size: 17, font: 'Arial' }),
                        ],
                      }),
                      new Paragraph({ spacing: { before: 900 } }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: '(                                                      )', bold: true, size: 17, font: 'Arial' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });
}

export async function exportClassTokensToDocx(params: ClassDocxExportParams): Promise<void> {
  const doc = generateClassDocx(params);
  const blob = await Packer.toBlob(doc);
  const safeClassName = params.className.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `SURAT_RESMI_DISTRIBUSI_TOKEN_${safeClassName}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
