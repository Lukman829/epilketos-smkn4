import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'E-PILKETOS SMKN 4 KOTA SERANG — Digital Election Platform',
  description:
    'Platform pemilihan Ketua dan Wakil Ketua OSIS SMKN 4 Kota Serang dengan pengalaman 3D interaktif, rahasia, jujur, adil, dan transparan.',
  keywords: [
    'E-PILKETOS',
    'SMKN 4 Kota Serang',
    'Pemilihan OSIS',
    'E-Voting Sekolah',
    'Digital Democracy',
  ],
  authors: [{ name: 'Panitia E-PILKETOS SMKN 4 Kota Serang' }],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo-smkn4.png', type: 'image/png' },
    ],
    apple: '/logo-smkn4.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
