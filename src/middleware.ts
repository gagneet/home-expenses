import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable must be set');
    }
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/api/accounts/:path*',
    '/api/investments/:path*',
    '/api/statements/:path*',
    '/api/transactions/:path*',
    '/dashboard/:path*',
    '/upload/:path*',
    '/account/add/:path*',
  ],
};
