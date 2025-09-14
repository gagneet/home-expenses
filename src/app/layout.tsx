'use client';

import Link from 'next/link';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import '../index.css';

function SiteLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            <Link href={isAuthenticated ? "/dashboard" : "/"}>Financial Analyzer</Link>
          </h1>
          {isAuthenticated && (
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
          )}
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
  );
}

// We need a wrapper component for the SessionProvider
function RootLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <SiteLayout>{children}</SiteLayout>
            </body>
        </html>
    )
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
        <RootLayoutContent>{children}</RootLayoutContent>
    </SessionProvider>
  );
}
