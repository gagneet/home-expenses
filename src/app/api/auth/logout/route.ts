import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
  const cookie = serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/',
  });

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.headers.set('Set-Cookie', cookie);
  return response;
}
