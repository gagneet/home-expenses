// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import FileUploadSimple from './components/upload/FileUploadSimple';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { Transaction } from './types/transaction';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDate, setUploadDate] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
      setIsUploaded(true);
    }
  }, []);

  const handleLogin = (token: string) => {
    setToken(token);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('transactions');
  };

  const handleUploadComplete = (data: any) => {
    console.log('Upload complete:', data);
    setTransactions(data.transactions);
    localStorage.setItem('transactions', JSON.stringify(data.transactions));
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
    localStorage.removeItem('transactions');
  };
  
  if (!token) {
    return showLogin ? (
      <Login onLogin={handleLogin} onShowRegister={() => setShowLogin(false)} />
    ) : (
      <Register onRegister={() => setShowLogin(true)} onShowLogin={() => setShowLogin(true)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Financial Statement Analyzer</h1>
          <div>
            {isUploaded && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-4"
              >
                Upload New Statements
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
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