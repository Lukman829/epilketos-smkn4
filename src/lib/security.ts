import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface AdminProfile {
  username: string;
  name: string;
  role: 'ketua_panitia' | 'admin_utama' | string;
}

interface SessionPayload extends AdminProfile {
  iat: number;
  exp: number;
}

// Secret key for HMAC token signing
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.ADMIN_UTAMA_PASSWORD ||
  'smkn4-epilketos-super-secret-hmac-key-2026';

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str) : str;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  return Buffer.from(b64, 'base64').toString('utf8');
}

/**
 * Sign a cryptographic session token with HMAC-SHA256
 * Expiration: 8 hours
 */
export function signAdminToken(admin: AdminProfile): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...admin,
    iat: now,
    exp: now + 8 * 3600, // 8 hours
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(data);
  const signature = base64UrlEncode(hmac.digest());

  return `${data}.${signature}`;
}

/**
 * Verify cryptographic session token and return admin profile
 */
export function verifyAdminToken(token: string): {
  valid: boolean;
  admin?: AdminProfile;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token sesi tidak ditemukan.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Format token sesi tidak valid.' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  // Verify HMAC signature in constant time
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET);
  expectedHmac.update(data);
  const expectedSigBuffer = expectedHmac.digest();

  let givenSigBuffer: Buffer;
  try {
    let b64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    givenSigBuffer = Buffer.from(b64, 'base64');
  } catch {
    return { valid: false, error: 'Tanda tangan token rusak.' };
  }

  if (
    expectedSigBuffer.length !== givenSigBuffer.length ||
    !crypto.timingSafeEqual(expectedSigBuffer, givenSigBuffer)
  ) {
    return { valid: false, error: 'Tanda tangan token sesi tidak sah atau dimanipulasi.' };
  }

  // Parse payload
  try {
    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Sesi login telah kedaluwarsa. Silakan masuk kembali.' };
    }

    return {
      valid: true,
      admin: {
        username: payload.username,
        name: payload.name,
        role: payload.role,
      },
    };
  } catch {
    return { valid: false, error: 'Gagal memproses data payload token.' };
  }
}

/**
 * Extract and authenticate admin session from request
 * Accepts Bearer token header or HTTP-only cookie
 */
export function getAdminFromRequest(req: NextRequest): AdminProfile | null {
  let token: string | null = null;

  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Fallback to cookie
  if (!token) {
    const cookieToken = req.cookies.get('epilketos_admin_session')?.value;
    if (cookieToken) {
      token = cookieToken.trim();
    }
  }

  if (!token) {
    return null;
  }

  const result = verifyAdminToken(token);
  return result.valid && result.admin ? result.admin : null;
}

/**
 * Constant-time comparison between two strings to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// In-memory rate limit store
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

/**
 * IP/Identifier-based rate limiter
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= limit) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Safe client IP extraction
 */
export function getClientIp(req: NextRequest): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp && /^[0-9a-fA-F:.]+$/.test(firstIp)) {
      return firstIp;
    }
  }

  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && /^[0-9a-fA-F:.]+$/.test(xRealIp.trim())) {
    return xRealIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Sanitize untrusted text inputs (strip HTML tags, prevent XSS)
 */
export function sanitizeString(input: string, maxLen = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return char;
      }
    })
    .trim()
    .slice(0, maxLen);
}

/**
 * Validate token string format
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const clean = token.trim();
  // Valid token length between 8 and 30 characters, alphanumeric and hyphens
  return clean.length >= 8 && clean.length <= 30 && /^[A-Za-z0-9\-]+$/.test(clean);
}
