import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface AdminProfile {
  username: string;
  name: string;
  role: 'admin_utama' | string;
}

interface SessionPayload extends AdminProfile {
  jti: string; // Unique session token ID for server-side revocation tracking
  iat: number;
  exp: number;
}

// Secret key for HMAC token signing — loaded strictly from environment variables.
// Static hardcoded fallbacks are STRICTLY OMITTED to eliminate key guessing or leaks.
// If unset, a unique ephemeral random 256-bit key is generated per process instance with an alert.
const SESSION_SECRET = (() => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 16) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[KEAMANAN PERINGATAN] SESSION_SECRET tidak diset atau < 16 karakter. Menggunakan kunci acak unik per-instance.'
      );
    }
    return crypto.randomBytes(32).toString('hex');
  }
  return secret.trim();
})();

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

// Server-side session revocation registry
const revokedSessionTokens = new Set<string>();

/**
 * Revoke an active admin session token server-side
 */
export function revokeAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload: SessionPayload = JSON.parse(base64UrlDecode(parts[1]));
    if (payload.jti) {
      revokedSessionTokens.add(payload.jti);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Check if a session ID has been revoked
 */
export function isSessionRevoked(jti: string): boolean {
  return revokedSessionTokens.has(jti);
}

/**
 * Sign a cryptographic session token with HMAC-SHA256
 * Default Expiration: 2 hours (strict session lifecycle)
 */
export function signAdminToken(admin: AdminProfile, expiresInSeconds = 2 * 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  const payload: SessionPayload = {
    ...admin,
    jti,
    iat: now,
    exp: now + expiresInSeconds,
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
  jti?: string;
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

  // Parse and validate payload
  try {
    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Sesi login telah kedaluwarsa. Silakan masuk kembali.' };
    }

    if (payload.jti && isSessionRevoked(payload.jti)) {
      return { valid: false, error: 'Sesi login telah dicabut atau diakhiri.' };
    }

    return {
      valid: true,
      jti: payload.jti,
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

  // 2. Fallback to HTTP-only cookie
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

// Failed login lockout store (for brute force protection)
interface FailedLoginRecord {
  attempts: number;
  lockedUntil: number;
  firstAttempt: number;
}
const failedLoginStore = new Map<string, FailedLoginRecord>();

// Periodic garbage collection every 5 minutes
if (typeof setInterval !== 'undefined') {
  const gcTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
    for (const [key, record] of failedLoginStore.entries()) {
      if (record.lockedUntil > 0 && now > record.lockedUntil + 3600000) {
        failedLoginStore.delete(key);
      }
    }
  }, 300000);
  if (gcTimer && typeof gcTimer.unref === 'function') {
    gcTimer.unref();
  }
}

/**
 * Check if IP or username is currently locked out from login
 */
export function checkLoginLockout(key: string): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = failedLoginStore.get(key);
  if (!record) return { locked: false, retryAfterSeconds: 0 };

  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, retryAfterSeconds };
  }

  // If lockout expired, reset record
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    failedLoginStore.delete(key);
  }

  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Record a failed login attempt; locks after maxAttempts (default: 5) for lockoutDurationMs (default: 15 min)
 */
export function recordFailedLogin(
  key: string,
  maxAttempts = 5,
  lockoutDurationMs = 15 * 60 * 1000,
  windowMs = 15 * 60 * 1000
): { attempts: number; locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let record = failedLoginStore.get(key);

  if (!record || now - record.firstAttempt > windowMs) {
    record = { attempts: 1, lockedUntil: 0, firstAttempt: now };
    failedLoginStore.set(key, record);
    return { attempts: 1, locked: false, retryAfterSeconds: 0 };
  }

  record.attempts += 1;
  if (record.attempts >= maxAttempts) {
    record.lockedUntil = now + lockoutDurationMs;
    const retryAfterSeconds = Math.ceil(lockoutDurationMs / 1000);
    return { attempts: record.attempts, locked: true, retryAfterSeconds };
  }

  return { attempts: record.attempts, locked: false, retryAfterSeconds: 0 };
}

/**
 * Reset failed login tracking on successful authentication
 */
export function resetFailedLogin(key: string): void {
  failedLoginStore.delete(key);
}

/**
 * IP/Identifier-based rate limiter (sliding/fixed window)
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
 * Safe client IP extraction with trusted reverse-proxy priority (Vercel / Cloudflare)
 * Defends against IP spoofing via forged X-Forwarded-For or X-Real-IP headers.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Vercel edge trusted header (injected by Vercel infrastructure; client headers stripped)
  const xVercelIp = req.headers.get('x-vercel-forwarded-for');
  if (xVercelIp) {
    const ip = xVercelIp.split(',')[0].trim();
    if (/^[0-9a-fA-F:.]+$/.test(ip)) return ip;
  }

  // 2. Cloudflare connecting IP (trusted when behind Cloudflare proxy)
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp && /^[0-9a-fA-F:.]+$/.test(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  // 3. If deployed on Vercel but x-vercel-forwarded-for was missing, do NOT trust arbitrary client headers
  if (process.env.VERCEL) {
    return '127.0.0.1';
  }

  // 4. Reverse proxy real IP (only in non-Vercel trusted environments)
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && /^[0-9a-fA-F:.]+$/.test(xRealIp.trim())) {
    return xRealIp.trim();
  }

  // 5. Fallback x-forwarded-for (use the rightmost/last proxy hop to resist client-side prepend spoofing)
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const hops = xForwardedFor.split(',').map((s) => s.trim()).filter(Boolean);
    const lastHop = hops[hops.length - 1];
    if (lastHop && /^[0-9a-fA-F:.]+$/.test(lastHop)) {
      return lastHop;
    }
  }

  return '127.0.0.1';
}

/**
 * Validate candidate photo URL to prevent SSRF and stored XSS attacks
 */
export function validateCandidatePhotoUrl(url: string): { valid: boolean; sanitizedUrl: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: true, sanitizedUrl: '' };
  }

  const clean = url.trim();
  if (!clean) {
    return { valid: true, sanitizedUrl: '' };
  }

  // Disallow dangerous schemes immediately
  if (/^(javascript|vbscript|data|file):/i.test(clean)) {
    return { valid: false, sanitizedUrl: '', error: 'Skema URL tidak aman (hanya HTTPS atau path lokal yang diizinkan).' };
  }

  // Allow local relative paths starting with /
  if (clean.startsWith('/') && !clean.startsWith('//')) {
    return { valid: true, sanitizedUrl: clean.slice(0, 500) };
  }

  // Must be HTTPS for external resources
  if (!clean.startsWith('https://')) {
    return { valid: false, sanitizedUrl: '', error: 'URL foto harus menggunakan protokol aman HTTPS.' };
  }

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();

    // Prevent SSRF to localhost or internal network / cloud metadata
    const isPrivateOrLoopback =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '169.254.169.254' || // AWS / GCP / Cloud metadata
      host === 'metadata.google.internal' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal');

    if (isPrivateOrLoopback) {
      return { valid: false, sanitizedUrl: '', error: 'Alamat URL foto merujuk ke jaringan lokal atau privat (SSRF Protection).' };
    }

    return { valid: true, sanitizedUrl: parsed.toString().slice(0, 500) };
  } catch {
    return { valid: false, sanitizedUrl: '', error: 'Format URL foto tidak valid.' };
  }
}

/**
 * Sanitize untrusted text inputs (strip HTML tags, prevent XSS and script injections)
 */
export function sanitizeString(input: string, maxLen = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    // Neutralize dangerous pseudo-protocols like javascript:, vbscript:, data:text
    .replace(/(?:javascript|vbscript|data):/gi, '')
    // Neutralize inline event handlers like onerror=, onload=, onclick=
    .replace(/\bon\w+\s*=/gi, '')
    // Strip all HTML/XML tags
    .replace(/<[^>]*>/g, '')
    // Convert sensitive HTML entities to safe equivalents
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
