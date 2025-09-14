import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// The `auth` property contains the middleware logic.
// It will automatically protect routes and redirect to the login page
// if the user is not authenticated.
export default NextAuth(authConfig).auth;

export const config = {
  // The matcher specifies which routes the middleware should run on.
  // This is a list of all pages and API routes that require authentication.
  matcher: [
    '/api/accounts/:path*',
    '/api/investments/:path*',
    '/api/statements/:path*',
    '/api/transactions/:path*',
    '/dashboard/:path*',
    '/upload/:path*',
    '/account/:path*',
  ],
};
