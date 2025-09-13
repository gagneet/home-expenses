'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../components/auth/Login';
import Register from '../../components/auth/Register';

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(true);
  const router = useRouter();

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    // Also set a cookie for server-side authentication
    document.cookie = `token=${token}; path=/;`;
    router.push('/dashboard');
  };

  return showLogin ? (
    <Login onLogin={handleLogin} onShowRegister={() => setShowLogin(false)} />
  ) : (
    <Register onRegister={() => setShowLogin(true)} onShowLogin={() => setShowLogin(true)} />
  );
}
