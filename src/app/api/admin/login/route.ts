import { NextRequest, NextResponse } from 'next/server';
import {
  signAdminToken,
  constantTimeCompare,
  getClientIp,
  checkLoginLockout,
  recordFailedLogin,
  resetFailedLogin,
  rateLimit,
  sanitizeString,
} from '@/lib/security';
import { recordAuditLog } from '@/lib/storage';

interface AdminAccountConfig {
  username: string;
  aliases: string[];
  password?: string;
  name: string;
  role: 'admin_utama' | 'ketua_panitia';
}

/**
 * Load configured administrator accounts strictly from environment variables.
 * NO static fallback passwords are used to guarantee production security.
 */
function getAdminAccounts(): AdminAccountConfig[] {
  const accounts: AdminAccountConfig[] = [];

  // 1. Administrator Utama
  const utamaUser = process.env.ADMIN_UTAMA_USERNAME || process.env.ADMIN_USERNAME || 'admin.utama';
  const utamaPass = process.env.ADMIN_UTAMA_PASSWORD || process.env.ADMIN_PASSWORD;
  if (utamaPass && typeof utamaPass === 'string' && utamaPass.trim().length > 0) {
    accounts.push({
      username: utamaUser.trim(),
      aliases: ['admin', 'admin.utama'],
      password: utamaPass.trim(),
      name: 'Administrator Utama E-PILKETOS',
      role: 'admin_utama',
    });
  }

  // 2. Ketua Panitia Pelaksana
  const ketuaUser = process.env.ADMIN_KETUA_USERNAME || 'ketua.panitia';
  const ketuaPass = process.env.ADMIN_KETUA_PASSWORD;
  if (ketuaPass && typeof ketuaPass === 'string' && ketuaPass.trim().length > 0) {
    accounts.push({
      username: ketuaUser.trim(),
      aliases: ['ketua.panitia', 'ketua'],
      password: ketuaPass.trim(),
      name: 'Ketua Panitia Pelaksana E-PILKETOS',
      role: 'ketua_panitia',
    });
  }

  return accounts;
}

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

    // Sanitize username against XSS and control characters
    const cleanUsername = sanitizeString(username.trim(), 100);
    const cleanPassword = password.trim();

    // 3. Constant-Time Multi-Account Authentication
    const configuredAccounts = getAdminAccounts();

    let authenticatedAccount: AdminAccountConfig | null = null;

    for (const account of configuredAccounts) {
      if (!account.password) continue;

      const usernameMatches =
        constantTimeCompare(account.username, cleanUsername) ||
        account.aliases.some((alias) => constantTimeCompare(alias, cleanUsername));

      const passwordMatches = constantTimeCompare(account.password, cleanPassword);

      if (usernameMatches && passwordMatches) {
        authenticatedAccount = account;
        break;
      }
    }

    // 4. Failed Authentication Branch (Per-IP Failure Tracking)
    if (!authenticatedAccount) {
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
    resetFailedLogin(`ip:${clientIp}`);

    // Sign cryptographic session token (HMAC-SHA256, 2-hour lifespan with unique jti)
    const token = signAdminToken(
      {
        username: authenticatedAccount.username,
        name: authenticatedAccount.name,
        role: authenticatedAccount.role,
      },
      2 * 3600 // 2 hours
    );

    // Record audit log for successful admin login
    recordAuditLog('ADMIN_LOGIN_SUCCESS', authenticatedAccount.name, {
      username: authenticatedAccount.username,
      role: authenticatedAccount.role,
      ip: clientIp,
      timestamp: new Date().toISOString(),
    });

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        username: authenticatedAccount.username,
        name: authenticatedAccount.name,
        role: authenticatedAccount.role,
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