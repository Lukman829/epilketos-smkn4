import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest, getClientIp, revokeAdminToken } from '@/lib/security';
import { recordAuditLog } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    const clientIp = getClientIp(req);

    // Revoke token server-side so it cannot be reused even if intercepted
    const authHeader = req.headers.get('authorization');
    const cookieToken = req.cookies.get('epilketos_admin_session')?.value;
    const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken)?.trim();
    if (token) {
      revokeAdminToken(token);
    }

    if (admin) {
      recordAuditLog('ADMIN_LOGOUT', admin.name, {
        username: admin.username,
        role: admin.role,
        ip: clientIp,
        timestamp: new Date().toISOString(),
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sesi administrasi berhasil diakhiri.',
    });

    // Invalidate the session cookie
    response.cookies.set('epilketos_admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memproses logout';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
