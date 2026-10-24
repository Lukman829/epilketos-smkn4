-- Initial Seed for E-PILKETOS SMKN 4 KOTA SERANG

INSERT INTO election_settings (id, title, school_name, period_name, status, is_results_published, description)
VALUES (
    'default',
    'E-PILKETOS SMKN 4 KOTA SERANG',
    'SMKN 4 Kota Serang',
    'Masa Bakti 2026/2027',
    'ongoing',
    false,
    'Pemilihan resmi Ketua dan Wakil Ketua OSIS SMKN 4 Kota Serang secara digital, rahasia, jujur, dan adil.'
) ON CONFLICT (id) DO NOTHING;

-- Seed Candidates (3 Ketua, 6 Wakil)
INSERT INTO candidates (id, type, candidate_number, name, grade_major, tagline, photo_url, vision, missions, programs, is_active, display_order)
VALUES
-- Ketua
('k-01', 'ketua', 1, 'Muhammad Rizky Pratama', 'XI PPLG 1 (Pengembangan Perangkat Lunak & Gim)', 'Akselerasi Kolaborasi, Wujudkan OSIS Adaptif & Progresif', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', 'Mewujudkan OSIS SMKN 4 Kota Serang sebagai episentrum kreativitas, kepemimpinan berintegritas, dan inovasi teknologi bagi seluruh siswa.', ARRAY['Mengembangkan sistem aspirasi digital terpadu berbasis web yang responsif untuk seluruh peserta didik.', 'Meningkatkan sinergi antar-ekstrakurikuler demi mendongkrak prestasi akademik maupun non-akademik di tingkat provinsi dan nasional.', 'Menumbuhkan budaya literasi digital, wirausaha kreatif, dan kepedulian lingkungan di lingkungan sekolah.'], ARRAY['Serang Youth Tech & Art Showcase', 'Ruang Aspirasi Terbuka Siswa (RATS Digital)', 'Green School Eco-Innovation Project'], true, 1),

('k-02', 'ketua', 2, 'Annisa Putri Rahmawati', 'XI TJKT 2 (Teknik Jaringan Komputer & Telekomunikasi)', 'Harmoni Karya, Integritas Nyata untuk Siswa Mandiri', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', 'Membangun iklim organisasi sekolah yang inklusif, transparan, dan menjunjung tinggi nilai persaudaraan serta profesionalisme berbudaya industri.', ARRAY['Mengoptimalkan program mentoring teman sebaya lintas kejuruan guna memperkuat kecakapan vokasi.', 'Menjalin kemitraan kolaboratif dengan dunia industri dan alumni untuk memperluas wawasan karir siswa.', 'Mewujudkan kegiatan sekolah yang berkarakter kuat, religius, dan berdisiplin tinggi.'], ARRAY['Mentorship Vokasi Peer-to-Peer', 'Festival Kejuruan Terpadu SMKN 4', 'OSIS Peduli, Tanggap & Berbagi'], true, 2),

('k-03', 'ketua', 3, 'Dimas Arya Wicaksono', 'XI DKV 1 (Desain Komunikasi Visual)', 'Kreativitas Tanpa Batas, Dedikasi Nyata untuk Prestasi', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', 'Menjadikan OSIS SMKN 4 Kota Serang wadah eksplorasi bakat kreatif, berdaya saing kejuaraan, dan representasi suara siswa yang vokal serta berdampak.', ARRAY['Membangun identitas visual dan branding publikasi kegiatan sekolah yang modern dan bertaraf profesional.', 'Mengadakan kompetisi karya kreatif, inovasi vokasi, dan pekan olahraga antarkelas secara berkala.', 'Mempererat relasi antarsiswa, guru, dan organisasi kesiswaan melalui komunikasi yang terbuka dan transparan.'], ARRAY['Creative Media Hub SMKN 4', 'Piala Bergilir Kejuruan SMKN 4', 'Siniar Suara Siswa & Forum Diskusi Berkala'], true, 3),

-- Wakil
('w-01', 'wakil', 1, 'Fathir Al-Ghifari', 'X PPLG 1 (Pengembangan Perangkat Lunak & Gim)', 'Eksekusi Cepat, Solusi Tepat untuk Semua Siswa', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 'Mewujudkan kepengurusan OSIS yang tanggap dan berfokus pada efisiensi kerja tim serta pemberdayaan siswa.', ARRAY['Mendampingi Ketua OSIS dalam koordinasi harian seluruh divisi dan seksi bidang.', 'Menyusun basis data inventaris kegiatan ekskul secara digital dan transparan.', 'Mengawal aspirasi kelas 10 dan 11 agar selalu ditindaklanjuti secara berkesinambungan.'], ARRAY['Audit Kerja Berkala OSIS', 'Helpdesk Aspirasi Kelas'], true, 1),

('w-02', 'wakil', 2, 'Nabila Zahra Choirunissa', 'X TJKT 1 (Teknik Jaringan Komputer & Telekomunikasi)', 'Sinergi Empati, Gerak Terukur untuk Hasil Maksimal', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', 'Menjadi jembatan komunikasi yang harmonis antar angkatan dan memperkuat nilai kekeluargaan di sekolah.', ARRAY['Mendorong keikutsertaan aktif siswi dalam kepemimpinan dan keorganisasian sekolah.', 'Menyelenggarakan kegiatan keakraban siswa berkala yang mempererat tali silaturahmi.', 'Memastikan seluruh informasi kepanitiaan tersampaikan cepat ke perwakilan tiap kelas.'], ARRAY['Forum Perwakilan Kelas (FPK)', 'Pekan Harmoni Siswa'], true, 2),

('w-03', 'wakil', 3, 'Bagas Satria Yudha', 'X DKV 2 (Desain Komunikasi Visual)', 'Dedikasi Teruji, Siap Bekerja Nyata untuk Kemajuan', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80', 'Menghadirkan tata kelola kegiatan siswa yang tertib, atraktif, dan berdampak positif bagi iklim belajar sekolah.', ARRAY['Mengelola alur publikasi dan dokumentasi acara sekolah dengan standar kreatif tinggi.', 'Mengoptimalkan peran majalah dinding digital dan media sosial sekolah.', 'Mendukung program pengembangan minat bakat di luar jam pelajaran resmi.'], ARRAY['Dokumentasi Kreatif SMKN 4', 'Workshop Desain & Konten Positif'], true, 3),

('w-04', 'wakil', 4, 'Siti Nurhaliza', 'X MPLB 1 (Manajemen Perkantoran & Layanan Bisnis)', 'Tertib Administrasi, Andal dan Profesional Berorganisasi', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80', 'Menegakkan standar administrasi dan tata kelola OSIS yang rapi, akuntabel, dan tepat waktu.', ARRAY['Memodernisasi sistem surat-menyurat dan proposal kegiatan secara terstruktur.', 'Menjadi fasilitator koordinasi antara pembina OSIS dengan pengurus harian.', 'Meningkatkan budaya ketepatan waktu dalam pelaksanaan setiap agenda sekolah.'], ARRAY['Digital SOP Organisasi', 'Layanan Prima Kesiswaan'], true, 4),

('w-05', 'wakil', 5, 'Raditya Pratama', 'X TKRO 1 (Teknik Kendaraan Ringan Otomotif)', 'Solidaritas Tanpa Sekat, Kerja Keras Berbuah Prestasi', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', 'Membangun jiwa korsa dan rasa memiliki terhadap almamater SMKN 4 Kota Serang di semua jurusan teknik maupun bisnis.', ARRAY['Menumbuhkan kesadaran disiplin tata tertib dan keselamatan kerja (K3) di sekolah.', 'Mengaktifkan kegiatan bakti sosial dan aksi peduli lingkungan sekolah secara rutin.', 'Mendorong keterlibatan aktif siswa jurusan otomotif dan teknik dalam kegiatan kesiswaan.'], ARRAY['Aksi Peduli Lingkungan & Bengkel Bersih', 'Bela Diri & Kebugaran Siswa'], true, 5),

('w-06', 'wakil', 6, 'Zahra Amanda Putri', 'X BDP 2 (Bisnis Daring & Pemasaran)', 'Inspirasi Muda, Aksi Nyata Berdampak Nyata', 'https://images.unsplash.com/photo-1534751516642-a171ed296316?auto=format&fit=crop&w=800&q=80', 'Mengembangkan jiwa kepemimpinan wirausaha dan kemandirian finansial kreatif bagi organisasi siswa.', ARRAY['Mengembangkan unit usaha kreatif OSIS sebagai sarana belajar kewirausahaan siswa.', 'Mengadakan pelatihan literasi finansial sederhana bagi pengurus organisasi.', 'Membangun jejaring kolaborasi dengan sponsor kegiatan yang relevan dan edukatif.'], ARRAY['Bazar Siswa Berdaya', 'Pelatihan Mini Entrepreneurship'], true, 6)
ON CONFLICT (id) DO NOTHING;

-- Seed Classes
INSERT INTO classes (id, grade, major, name, voter_quota)
VALUES
('cls-10-pplg-1', '10', 'PPLG', 'X PPLG 1', 36),
('cls-10-pplg-2', '10', 'PPLG', 'X PPLG 2', 35),
('cls-10-tjkt-1', '10', 'TJKT', 'X TJKT 1', 36),
('cls-10-tjkt-2', '10', 'TJKT', 'X TJKT 2', 36),
('cls-10-dkv-1',  '10', 'DKV',  'X DKV 1',  34),
('cls-10-dkv-2',  '10', 'DKV',  'X DKV 2',  35),
('cls-10-tkro-1', '10', 'TKRO', 'X TKRO 1', 36),
('cls-10-tkro-2', '10', 'TKRO', 'X TKRO 2', 36),
('cls-10-mplb-1', '10', 'MPLB', 'X MPLB 1', 36),
('cls-10-bdp-1',  '10', 'BDP',  'X BDP 1',  35),
('cls-11-pplg-1', '11', 'PPLG', 'XI PPLG 1', 35),
('cls-11-pplg-2', '11', 'PPLG', 'XI PPLG 2', 34),
('cls-11-tjkt-1', '11', 'TJKT', 'XI TJKT 1', 36),
('cls-11-tjkt-2', '11', 'TJKT', 'XI TJKT 2', 36),
('cls-11-dkv-1',  '11', 'DKV',  'XI DKV 1',  35),
('cls-11-dkv-2',  '11', 'DKV',  'XI DKV 2',  34),
('cls-11-tkro-1', '11', 'TKRO', 'XI TKRO 1', 35),
('cls-11-tkro-2', '11', 'TKRO', 'XI TKRO 2', 36),
('cls-11-mplb-1', '11', 'MPLB', 'XI MPLB 1', 35),
('cls-11-bdp-1',  '11', 'BDP',  'XI BDP 1',  35)
ON CONFLICT (id) DO NOTHING;
