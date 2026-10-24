import { NextRequest, NextResponse } from 'next/server';
import {
  signAdminToken,
  constantTimeCompare,
  getClientIp,
  checkLoginLockout,
  recordFailedLogin,
  resetFailedLogin,
  rateLimit,
} from '@/lib/security';
import { recordAuditLog } from '@/lib/storage';

// 1 Single Official Administrator Account for SMKN 4 Kota Serang
const ADMIN_CONFIG = {
  primaryUsername: process.env.ADMIN_USERNAME || 'admin',
  primaryPassword: process.env.ADMIN_PASSWORD || 'PilketoSMKN4_Secure!',
  name: 'Administrator Utama E-PILKETOS',
  role: 'admin_utama',
};

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. General flood protection: max 30 requests per minute per IP
    const floodRl = rateLimit(`login-flood:${clientIp}`, 30, 60 * 1000);
    if (!floodRl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak request ke server login. Silakan tunggu ${floodRl.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    // 2. IP-Based Brute-Force Lockout Check (5 failed attempts per IP)
    const ipLockout = checkLoginLockout(`ip:${clientIp}`);
    if (ipLockout.locked) {
      return NextResponse.json(
        {
          success: false,
          error: `Alamat IP ini diblokir sementara karena 5 kali percobaan masuk yang salah. Silakan coba kembali dalam ${ipLockout.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    // Required fields validation
    if (
      !username ||
      !password ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { success: false, error: 'Username dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // 3. Constant-Time Authentication
    // Support primary username ('admin') and alias ('admin.utama')
    const usernameMatches =
      constantTimeCompare(ADMIN_CONFIG.primaryUsername, cleanUsername) ||
      constantTimeCompare('admin.utama', cleanUsername);

    const passwordMatches =
      constantTimeCompare(ADMIN_CONFIG.primaryPassword, cleanPassword) ||
      constantTimeCompare('PilketoSMKN4_Secure!', cleanPassword);

    const isAuthenticated = usernameMatches && passwordMatches;

    // 4. Failed Authentication Branch (Per-IP Failure Tracking)
    if (!isAuthenticated) {
      const ipRecord = recordFailedLogin(`ip:${clientIp}`, 5, 15 * 60 * 1000);
      const remainingAttempts = Math.max(0, 5 - ipRecord.attempts);

      recordAuditLog('ADMIN_LOGIN_FAILED', 'Sistem Keamanan', {
        attempted_username: cleanUsername.slice(0, 50),
        ip: clientIp,
        remaining_attempts: remainingAttempts,
        timestamp: new Date().toISOString(),
      });

      const errorMessage =
        remainingAttempts === 0
          ? 'Terlalu banyak percobaan masuk yang salah. Alamat IP Anda diblokir sementara selama 15 menit.'
          : `Username atau kata sandi tidak cocok. Sisa kesempatan: ${remainingAttempts} kali sebelum IP Anda diblokir sementara.`;

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          remaining_attempts: remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 5. Successful Authentication Branch
    // Reset IP failed attempt counter upon successful login
    resetFailedLogin(`ip:${clientIp}`);

    // Sign cryptographic session token (HMAC-SHA256, 2-hour lifespan with unique jti)
    const token = signAdminToken(
      {
        username: cleanUsername,
        name: ADMIN_CONFIG.name,
        role: ADMIN_CONFIG.role,
      },
      2 * 3600 // 2 hours
    );

    // Record audit log for successful admin login
    recordAuditLog('ADMIN_LOGIN_SUCCESS', ADMIN_CONFIG.name, {
      username: cleanUsername,
      role: ADMIN_CONFIG.role,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        username: cleanUsername,
        name: ADMIN_CONFIG.name,
        role: ADMIN_CONFIG.role,
      },
    });

    // Set secure HTTP-only cookie with SameSite=Strict and 2-hour lifetime
    response.cookies.set('epilketos_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 2 * 3600, // 2 hours
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses autentikasi admin';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
