'use client';

import { useRouter } from 'next/navigation';
import Register from '../../components/auth/Register';

export default function RegisterPage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/login');
  };

  return <Register onRegister={handleRegister} onShowLogin={() => router.push('/login')} />;
}
