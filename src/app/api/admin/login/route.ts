import { NextRequest, NextResponse } from 'next/server';

const VALID_ADMINS = [
  {
    username: process.env.ADMIN_KETUA_USERNAME || 'ketua.panitia',
    password: process.env.ADMIN_KETUA_PASSWORD || 'SerangUnggul2026!',
    name: 'Ketua Panitia E-PILKETOS',
    role: 'ketua_panitia',
  },
  {
    username: process.env.ADMIN_UTAMA_USERNAME || 'admin.utama',
    password: process.env.ADMIN_UTAMA_PASSWORD || 'PilketoSMKN4_Secure!',
    name: 'Admin Utama Sistem',
    role: 'admin_utama',
  },
];

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const admin = VALID_ADMINS.find(
      (a) => a.username === username.trim() && a.password === password.trim()
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Kredensial akun panitia tidak cocok.' },
        { status: 401 }
      );
    }

    // In production, we'd sign a JWT or use Supabase Auth session.
    // For our clean server session, return authorized bearer token & profile:
    return NextResponse.json({
      success: true,
      token: 'epilketos-admin-authorized-token',
      admin: {
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses autentikasi admin';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
