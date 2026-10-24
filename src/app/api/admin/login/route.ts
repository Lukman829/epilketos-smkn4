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
const SINGLE_ADMIN = {
  username: process.env.ADMIN_USERNAME || process.env.ADMIN_UTAMA_USERNAME || 'admin.utama',
  password: process.env.ADMIN_PASSWORD || process.env.ADMIN_UTAMA_PASSWORD || 'PilketoSMKN4_Secure!',
  name: 'Administrator Utama E-PILKETOS',
  role: 'admin_utama',
};

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // General rate limiter on login endpoint: max 20 requests per minute to prevent socket flooding
    const generalRl = rateLimit(`login-flood:${clientIp}`, 20, 60 * 1000);
    if (!generalRl.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak request ke server login. Silakan tunggu ${generalRl.retryAfterSeconds} detik.`,
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

    // 1. Dual-Key Brute-Force Check: Verify if IP or Account is currently locked out
    const ipLockout = checkLoginLockout(`ip:${clientIp}`);
    if (ipLockout.locked) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan masuk yang gagal dari alamat IP ini. Akses diblokir selama ${ipLockout.retryAfterSeconds} detik demi keamanan sistem.`,
        },
        { status: 429 }
      );
    }

    const userLockout = checkLoginLockout(`user:${cleanUsername}`);
    if (userLockout.locked) {
      return NextResponse.json(
        {
          success: false,
          error: `Akun administrator ini sedang dikunci sementara karena rentetan kegagalan masuk. Silakan tunggu ${userLockout.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    // 2. Unconditional Constant-Time Authentication
    // Both username and password comparisons are executed without short-circuiting to prevent timing side-channels
    const usernameMatches = constantTimeCompare(SINGLE_ADMIN.username, cleanUsername);
    const passwordMatches = constantTimeCompare(SINGLE_ADMIN.password, cleanPassword);
    const isAuthenticated = usernameMatches && passwordMatches;

    // 3. Failed Authentication Branch
    if (!isAuthenticated) {
      // Record failure for both IP and Username (locks out after 5 consecutive failures for 15 minutes)
      const ipRecord = recordFailedLogin(`ip:${clientIp}`, 5, 15 * 60 * 1000);
      recordFailedLogin(`user:${cleanUsername}`, 5, 15 * 60 * 1000);

      recordAuditLog('ADMIN_LOGIN_FAILED', 'Sistem Keamanan', {
        attempted_username: cleanUsername.slice(0, 50),
        ip: clientIp,
        remaining_attempts: Math.max(0, 5 - ipRecord.attempts),
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Kredensial akun panitia tidak cocok.',
          remaining_attempts: Math.max(0, 5 - ipRecord.attempts),
        },
        { status: 401 }
      );
    }

    // 4. Successful Authentication Branch
    // Reset lockout counters on valid login
    resetFailedLogin(`ip:${clientIp}`);
    resetFailedLogin(`user:${cleanUsername}`);

    // Sign cryptographic session token (HMAC-SHA256, 2-hour lifespan with unique jti)
    const token = signAdminToken(
      {
        username: SINGLE_ADMIN.username,
        name: SINGLE_ADMIN.name,
        role: SINGLE_ADMIN.role,
      },
      2 * 3600 // 2 hours
    );

    // Record audit log for successful admin login
    recordAuditLog('ADMIN_LOGIN_SUCCESS', SINGLE_ADMIN.name, {
      username: SINGLE_ADMIN.username,
      role: SINGLE_ADMIN.role,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        username: SINGLE_ADMIN.username,
        name: SINGLE_ADMIN.name,
        role: SINGLE_ADMIN.role,
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
