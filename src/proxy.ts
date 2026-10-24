import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/security';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // 1. Cross-Site Request Forgery (CSRF) Guard for Mutating API Requests
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        // Ensure origin hostname matches incoming host header (port-aware)
        if (originUrl.host !== host) {
          return NextResponse.json(
            { success: false, error: 'Akses lintas asal ditolak (CSRF Protection).' },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Origin header tidak valid.' },
          { status: 403 }
        );
      }
    }
  }

  // 2. Server-Side Protection for Admin UI Routes
  if (pathname.startsWith('/admin')) {
    const sessionCookie = req.cookies.get('epilketos_admin_session')?.value;
    const isValidSession = sessionCookie ? verifyAdminToken(sessionCookie).valid : false;

    // A. Visiting /admin/login while already authenticated -> redirect to dashboard
    if (pathname === '/admin/login') {
      if (isValidSession) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.next();
    }

    // B. Visiting any protected admin page without valid session -> redirect to login
    if (!isValidSession) {
      const loginUrl = new URL('/admin/login', req.url);
      const response = NextResponse.redirect(loginUrl);
      // Clean invalid or expired cookie
      if (sessionCookie) {
        response.cookies.delete('epilketos_admin_session');
      }
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
