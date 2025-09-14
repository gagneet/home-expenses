'use client';

import { useRouter } from 'next/navigation';
import FileUploadSimple from '../../components/upload/FileUploadSimple';

export default function UploadPage() {
  const router = useRouter();

  const handleUploadComplete = (data: any) => {
    console.log('Upload complete:', data);
    localStorage.setItem('transactions', JSON.stringify(data.transactions));
    router.push('/dashboard');
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    // Maybe show a toast notification in the future
  };

  return (
    <FileUploadSimple
      onUploadComplete={handleUploadComplete}
      onError={handleUploadError}
    />
  );
}
