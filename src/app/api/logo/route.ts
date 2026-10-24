import { NextResponse } from 'next/server';
import { SCHOOL_LOGO_DATA_URI } from '@/lib/schoolLogoData';

export async function GET() {
  try {
    const base64 = SCHOOL_LOGO_DATA_URI.split(',')[1];
    if (!base64) {
      return new NextResponse('Logo data missing', { status: 404 });
    }

    const buffer = Buffer.from(base64, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
