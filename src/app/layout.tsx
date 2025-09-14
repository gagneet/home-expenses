import Providers from './providers';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react'; // Note: These hooks can't be used in a server component
import '../index.css';

// This component remains a Server Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* The Providers component is a Client Component that wraps children with SessionProvider */}
        <Providers>
          <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                  <Link href={"/"}>Financial Analyzer</Link>
                </h1>
                {/* This header part needs session data, so it should be a client component */}
                <AuthHeader />
              </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>

            <footer className="bg-white shadow mt-8 py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                  Financial Statement Analyzer - Simplifying your financial insights
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}

// A new client component to handle the authenticated part of the header
function AuthHeader() {
  'use client';

  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Welcome, {session?.user?.name || 'User'}!</span>
      <Link
        href="/upload"
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        New Upload
      </Link>
      <Link
        href="/account/add"
        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
      >
        Add Account
      </Link>
      <button
        onClick={() => signOut()}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}
