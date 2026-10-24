import { NextRequest, NextResponse } from 'next/server';
import {
  signAdminToken,
  constantTimeCompare,
  rateLimit,
  getClientIp,
} from '@/lib/security';
import { recordAuditLog } from '@/lib/storage';

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
    const clientIp = getClientIp(req);

    // Brute-force protection: max 5 login attempts per 5 minutes per IP
    const rl = rateLimit(`login:${clientIp}`, 5, 5 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan masuk yang gagal. Akses diblokir sementara selama ${rl.retryAfterSeconds} detik demi keamanan.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Constant-time search across authorized accounts to prevent timing analysis
    const admin = VALID_ADMINS.find(
      (a) =>
        constantTimeCompare(a.username, cleanUsername) &&
        constantTimeCompare(a.password, cleanPassword)
    );

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Kredensial akun panitia tidak cocok.' },
        { status: 401 }
      );
    }

    // Sign cryptographic session token (HMAC-SHA256, 8-hour expiry)
    const token = signAdminToken({
      username: admin.username,
      name: admin.name,
      role: admin.role,
    });

    // Record audit log for successful admin login
    recordAuditLog(
      'ADMIN_LOGIN_SUCCESS',
      admin.name,
      {
        username: admin.username,
        role: admin.role,
        ip: clientIp,
        timestamp: new Date().toISOString(),
      }
    );

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set('epilketos_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 3600, // 8 hours
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses autentikasi admin';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
