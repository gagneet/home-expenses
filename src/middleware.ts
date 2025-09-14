import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    '/api/accounts/:path*',
    '/api/investments/:path*',
    '/api/statements/:path*',
    '/api/transactions/:path*',
    '/api/user/:path*',
    '/api/budgets/:path*',
    '/dashboard/:path*',
    '/upload/:path*',
    '/account/:path*',
    '/settings/:path*',
    '/profile/:path*',
  ],
};
