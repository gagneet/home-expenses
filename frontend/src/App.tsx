// frontend/src/App.tsx
import React, { useState } from 'react';
import FileUploadSimple from './components/upload/FileUploadSimple';
import Dashboard from './components/dashboard/Dashboard';
import { Transaction } from './types';

const App: React.FC = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const handleUploadComplete = (data: any) => {
    console.log('Upload complete:', data);
    setTransactions(data.transactions);
    setIsUploaded(true);
    setUploadDate(new Date().toISOString());
    setUploadError(null);
  };
  
  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    setUploadError(error.message);
  };
  
  const handleReset = () => {
    setIsUploaded(false);
    setUploadError(null);
    setTransactions([]);
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Financial Statement Analyzer</h1>
          {isUploaded && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Upload New Statements
            </button>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {uploadError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">Upload failed: {uploadError}</p>
              </div>
            </div>
          </div>
        )}
        
        {!isUploaded ? (
          <FileUploadSimple 
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        ) : (
          <Dashboard uploadDate={uploadDate} transactions={transactions} />
        )}
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
};

export default App;