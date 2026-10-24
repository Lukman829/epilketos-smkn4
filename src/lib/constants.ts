import { Candidate, ClassRecord, ElectionSettings } from '@/types/election';

export const SCHOOL_INFO = {
  name: 'SMKN 4 KOTA SERANG',
  shortName: 'SMKN 4 Serang',
  appTitle: 'E-PILKETOS SMKN 4 KOTA SERANG',
  subtitle: 'Pemilihan Ketua & Wakil Ketua OSIS Masa Bakti 2026/2027',
  motto: 'Berakhlak Mulia, Unggul, dan Berdaya Saing Global',
  address: 'Jl. Raya Banten No. 1, Kasemen, Kota Serang, Banten 42191',
  period: '2026/2027',
};

export const SCHOOL_MAJORS = [
  { code: 'TKJ', name: 'Teknik Komputer dan Jaringan', rombelPerGrade: 2 },
  { code: 'TSM', name: 'Teknik Sepeda Motor', rombelPerGrade: 1 },
  { code: 'TKRO', name: 'Teknik Kendaraan Ringan Otomotif', rombelPerGrade: 2 },
  { code: 'TBSM', name: 'Teknik dan Bisnis Sepeda Motor', rombelPerGrade: 2 },
  { code: 'MPLB', name: 'Manajemen Perkantoran dan Layanan Bisnis', rombelPerGrade: 2 },
  { code: 'AK', name: 'Akuntansi', rombelPerGrade: 2 },
  { code: 'TEI', name: 'Teknik Elektronika Industri', rombelPerGrade: 2 },
  { code: 'TITL', name: 'Teknik Instalasi Tenaga Listrik', rombelPerGrade: 2 },
];

export const DEFAULT_ELECTION_SETTINGS: ElectionSettings = {
  id: 'default',
  title: 'E-PILKETOS SMKN 4 KOTA SERANG',
  school_name: 'SMKN 4 Kota Serang',
  period_name: 'Masa Bakti 2026/2027',
  status: 'ongoing',
  is_results_published: false,
  results_published_at: null,
  results_published_by: null,
  start_time: '2026-10-23T07:30:00.000Z',
  end_time: '2026-10-23T15:00:00.000Z',
  description: 'Pemilihan resmi Ketua dan Wakil Ketua OSIS SMKN 4 Kota Serang secara digital, rahasia, jujur, dan adil.',
};

export const INITIAL_CANDIDATES: Candidate[] = [
  // 3 Calon Ketua OSIS (Mewakili Kelas XI)
  {
    id: 'k-01',
    type: 'ketua',
    candidate_number: 1,
    name: 'Muhammad Rizky Pratama',
    grade_major: 'XI TKJ 1 (Teknik Komputer & Jaringan)',
    tagline: 'Akselerasi Kolaborasi, Wujudkan OSIS Adaptif & Progresif',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    vision: 'Mewujudkan OSIS SMKN 4 Kota Serang sebagai episentrum kreativitas, kepemimpinan berintegritas, dan inovasi teknologi bagi seluruh siswa.',
    missions: [
      'Mengembangkan sistem aspirasi digital terpadu berbasis web yang responsif untuk seluruh peserta didik.',
      'Meningkatkan sinergi antar-ekstrakurikuler demi mendongkrak prestasi akademik maupun non-akademik di tingkat provinsi dan nasional.',
      'Menumbuhkan budaya literasi digital, wirausaha kreatif, dan kepedulian lingkungan di lingkungan sekolah.'
    ],
    programs: [
      'Serang Youth Tech & Art Showcase',
      'Ruang Aspirasi Terbuka Siswa (RATS Digital)',
      'Green School Eco-Innovation Project'
    ],
    is_active: true,
    display_order: 1,
  },
  {
    id: 'k-02',
    type: 'ketua',
    candidate_number: 2,
    name: 'Annisa Putri Rahmawati',
    grade_major: 'XI TKRO 1 (Teknik Kendaraan Ringan Otomotif)',
    tagline: 'Harmoni Karya, Integritas Nyata untuk Siswa Mandiri',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    vision: 'Membangun iklim organisasi sekolah yang inklusif, transparan, dan menjunjung tinggi nilai persaudaraan serta profesionalisme berbudaya industri.',
    missions: [
      'Mengoptimalkan program mentoring teman sebaya lintas kejuruan guna memperkuat kecakapan vokasi.',
      'Menjalin kemitraan kolaboratif dengan dunia industri dan alumni untuk memperluas wawasan karir siswa.',
      'Mewujudkan kegiatan sekolah yang berkarakter kuat, religius, dan berdisiplin tinggi.'
    ],
    programs: [
      'Mentorship Vokasi Peer-to-Peer',
      'Festival Kejuruan Terpadu SMKN 4',
      'OSIS Peduli, Tanggap & Berbagi'
    ],
    is_active: true,
    display_order: 2,
  },
  {
    id: 'k-03',
    type: 'ketua',
    candidate_number: 3,
    name: 'Dimas Arya Wicaksono',
    grade_major: 'XI TEI 1 (Teknik Elektronika Industri)',
    tagline: 'Kreativitas Tanpa Batas, Dedikasi Nyata untuk Prestasi',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    vision: 'Menjadikan OSIS SMKN 4 Kota Serang wadah eksplorasi bakat kreatif, berdaya saing kejuaraan, dan representasi suara siswa yang vokal serta berdampak.',
    missions: [
      'Membangun identitas visual dan branding publikasi kegiatan sekolah yang modern dan bertaraf profesional.',
      'Mengadakan kompetisi karya kreatif, inovasi vokasi, dan pekan olahraga antarkelas secara berkala.',
      'Mempererat relasi antarsiswa, guru, dan organisasi kesiswaan melalui komunikasi yang terbuka dan transparan.'
    ],
    programs: [
      'Creative Media Hub SMKN 4',
      'Piala Bergilir Kejuruan SMKN 4',
      'Siniar Suara Siswa & Forum Diskusi Berkala'
    ],
    is_active: true,
    display_order: 3,
  },

  // 6 Calon Wakil Ketua OSIS (Mewakili Kelas X)
  {
    id: 'w-01',
    type: 'wakil',
    candidate_number: 1,
    name: 'Fathir Al-Ghifari',
    grade_major: 'X TKJ 1 (Teknik Komputer & Jaringan)',
    tagline: 'Eksekusi Cepat, Solusi Tepat untuk Semua Siswa',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    vision: 'Mewujudkan kepengurusan OSIS yang tanggap dan berfokus pada efisiensi kerja tim serta pemberdayaan siswa.',
    missions: [
      'Mendampingi Ketua OSIS dalam koordinasi harian seluruh divisi dan seksi bidang.',
      'Menyusun basis data inventaris kegiatan ekskul secara digital dan transparan.',
      'Mengawal aspirasi kelas 10 dan 11 agar selalu ditindaklanjuti secara berkesinambungan.'
    ],
    programs: ['Audit Kerja Berkala OSIS', 'Helpdesk Aspirasi Kelas'],
    is_active: true,
    display_order: 1,
  },
  {
    id: 'w-02',
    type: 'wakil',
    candidate_number: 2,
    name: 'Nabila Zahra Choirunissa',
    grade_major: 'X TBSM 1 (Teknik & Bisnis Sepeda Motor)',
    tagline: 'Sinergi Empati, Gerak Terukur untuk Hasil Maksimal',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    vision: 'Menjadi jembatan komunikasi yang harmonis antar angkatan dan memperkuat nilai kekeluargaan di sekolah.',
    missions: [
      'Mendorong keikutsertaan aktif siswi dalam kepemimpinan dan keorganisasian sekolah.',
      'Menyelenggarakan kegiatan keakraban siswa berkala yang mempererat tali silaturahmi.',
      'Memastikan seluruh informasi kepanitiaan tersampaikan cepat ke perwakilan tiap kelas.'
    ],
    programs: ['Forum Perwakilan Kelas (FPK)', 'Pekan Harmoni Siswa'],
    is_active: true,
    display_order: 2,
  },
  {
    id: 'w-03',
    type: 'wakil',
    candidate_number: 3,
    name: 'Bagas Satria Yudha',
    grade_major: 'X AK 1 (Akuntansi)',
    tagline: 'Dedikasi Teruji, Siap Bekerja Nyata untuk Kemajuan',
    photo_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80',
    vision: 'Menghadirkan tata kelola kegiatan siswa yang tertib, atraktif, dan berdampak positif bagi iklim belajar sekolah.',
    missions: [
      'Mengelola alur publikasi dan dokumentasi acara sekolah dengan standar kreatif tinggi.',
      'Mengoptimalkan peran majalah dinding digital dan media sosial sekolah.',
      'Mendukung program pengembangan minat bakat di luar jam pelajaran resmi.'
    ],
    programs: ['Dokumentasi Kreatif SMKN 4', 'Workshop Literasi Finansial & Karir'],
    is_active: true,
    display_order: 3,
  },
  {
    id: 'w-04',
    type: 'wakil',
    candidate_number: 4,
    name: 'Siti Nurhaliza',
    grade_major: 'X MPLB 1 (Manajemen Perkantoran & Layanan Bisnis)',
    tagline: 'Tertib Administrasi, Andal dan Profesional Berorganisasi',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    vision: 'Menegakkan standar administrasi dan tata kelola OSIS yang rapi, akuntabel, dan tepat waktu.',
    missions: [
      'Memodernisasi sistem surat-menyurat dan proposal kegiatan secara terstruktur.',
      'Menjadi fasilitator koordinasi antara pembina OSIS dengan pengurus harian.',
      'Meningkatkan budaya ketepatan waktu dalam pelaksanaan setiap agenda sekolah.'
    ],
    programs: ['Digital SOP Organisasi', 'Layanan Prima Kesiswaan'],
    is_active: true,
    display_order: 4,
  },
  {
    id: 'w-05',
    type: 'wakil',
    candidate_number: 5,
    name: 'Raditya Pratama',
    grade_major: 'X TITL 1 (Teknik Instalasi Tenaga Listrik)',
    tagline: 'Solidaritas Tanpa Sekat, Kerja Keras Berbuah Prestasi',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    vision: 'Membangun jiwa korsa dan rasa memiliki terhadap almamater SMKN 4 Kota Serang di semua jurusan teknik maupun bisnis.',
    missions: [
      'Menumbuhkan kesadaran disiplin tata tertib dan keselamatan kerja (K3) di sekolah.',
      'Mengaktifkan kegiatan bakti sosial dan aksi peduli lingkungan sekolah secara rutin.',
      'Mendorong keterlibatan aktif siswa jurusan teknik dalam kegiatan kesiswaan.'
    ],
    programs: ['Aksi Peduli Lingkungan & Bengkel Bersih', 'Bela Diri & Kebugaran Siswa'],
    is_active: true,
    display_order: 5,
  },
  {
    id: 'w-06',
    type: 'wakil',
    candidate_number: 6,
    name: 'Zahra Amanda Putri',
    grade_major: 'X TSM (Teknik Sepeda Motor)',
    tagline: 'Inspirasi Muda, Aksi Nyata Berdampak Nyata',
    photo_url: 'https://images.unsplash.com/photo-1534751516642-a171ed296316?auto=format&fit=crop&w=800&q=80',
    vision: 'Mengembangkan jiwa kepemimpinan wirausaha dan kemandirian keorganisasian bagi seluruh siswa.',
    missions: [
      'Mengembangkan unit usaha kreatif OSIS sebagai sarana belajar kewirausahaan siswa.',
      'Mengadakan pelatihan kepemimpinan siswa lintas jurusan kejuruan.',
      'Membangun jejaring kolaborasi antarsiswa yang kompak dan saling mendukung.'
    ],
    programs: ['Bazar Siswa Berdaya', 'Pelatihan Mini Entrepreneurship'],
    is_active: true,
    display_order: 6,
  },
];

export const INITIAL_CLASSES: ClassRecord[] = [
  // Kelas 10 (15 rombel x 36 siswa = 540 siswa)
  { id: 'cls-10-tkj-1', grade: '10', major: 'TKJ', name: 'X TKJ 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-tkj-2', grade: '10', major: 'TKJ', name: 'X TKJ 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-tsm', grade: '10', major: 'TSM', name: 'X TSM', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-tkro-1', grade: '10', major: 'TKRO', name: 'X TKRO 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-tkro-2', grade: '10', major: 'TKRO', name: 'X TKRO 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-tbsm-1', grade: '10', major: 'TBSM', name: 'X TBSM 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-tbsm-2', grade: '10', major: 'TBSM', name: 'X TBSM 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-mplb-1', grade: '10', major: 'MPLB', name: 'X MPLB 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-mplb-2', grade: '10', major: 'MPLB', name: 'X MPLB 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-ak-1', grade: '10', major: 'AK', name: 'X AK 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-ak-2', grade: '10', major: 'AK', name: 'X AK 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-tei-1', grade: '10', major: 'TEI', name: 'X TEI 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-tei-2', grade: '10', major: 'TEI', name: 'X TEI 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-titl-1', grade: '10', major: 'TITL', name: 'X TITL 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-10-titl-2', grade: '10', major: 'TITL', name: 'X TITL 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },

  // Kelas 11 (15 rombel x 36 siswa = 540 siswa)
  { id: 'cls-11-tkj-1', grade: '11', major: 'TKJ', name: 'XI TKJ 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-tkj-2', grade: '11', major: 'TKJ', name: 'XI TKJ 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-tsm', grade: '11', major: 'TSM', name: 'XI TSM', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-tkro-1', grade: '11', major: 'TKRO', name: 'XI TKRO 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-tkro-2', grade: '11', major: 'TKRO', name: 'XI TKRO 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-tbsm-1', grade: '11', major: 'TBSM', name: 'XI TBSM 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-tbsm-2', grade: '11', major: 'TBSM', name: 'XI TBSM 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-mplb-1', grade: '11', major: 'MPLB', name: 'XI MPLB 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-mplb-2', grade: '11', major: 'MPLB', name: 'XI MPLB 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-ak-1', grade: '11', major: 'AK', name: 'XI AK 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-ak-2', grade: '11', major: 'AK', name: 'XI AK 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-tei-1', grade: '11', major: 'TEI', name: 'XI TEI 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-tei-2', grade: '11', major: 'TEI', name: 'XI TEI 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-titl-1', grade: '11', major: 'TITL', name: 'XI TITL 1', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
  { id: 'cls-11-titl-2', grade: '11', major: 'TITL', name: 'XI TITL 2', voter_quota: 36, tokens_generated: 36, voted_count: 0 },
];
