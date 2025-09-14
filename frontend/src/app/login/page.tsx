'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Login from '../../components/auth/Login';
import Register from '../../components/auth/Register';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const handleLogin = () => {
    // After a successful login, the AuthContext will automatically
    // pick up the user on the next render. We just need to redirect.
    router.push('/dashboard');
  };

  if (user) {
    router.push('/dashboard');
    return null;
  }

  return showLogin ? (
    <Login onLogin={handleLogin} onShowRegister={() => setShowLogin(false)} />
  ) : (
    <Register onRegister={() => setShowLogin(true)} onShowLogin={() => setShowLogin(true)} />
  );
}
