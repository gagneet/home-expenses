'use client';

import { useRouter } from 'next/navigation';
import AccountForm from '../../../components/accounts/AccountForm';

export default function AddAccountPage() {
  const router = useRouter();

  const handleSubmitSuccess = (newAccount: any) => {
    console.log('Account created:', newAccount);
    // In the future, we might want to show a success message
    // or update a list of accounts.
    router.push('/dashboard');
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <AccountForm
      onSubmitSuccess={handleSubmitSuccess}
      onCancel={handleCancel}
    />
  );
}
