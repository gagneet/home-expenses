import { auth } from '@/lib/auth'; // Assuming auth is exported from a central file
import { redirect } from 'next/navigation';

// The root page of the application.
// It checks for an active session and redirects the user accordingly.
export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    // If there is a session, redirect to the main dashboard.
    redirect('/dashboard');
  } else {
    // If there is no session, redirect to the login page.
    redirect('/login');
  }

  // This part is never reached due to the redirects,
  // but a component must return a valid JSX element or null.
  return null;
}
