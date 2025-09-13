// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import FileUploadSimple from './components/upload/FileUploadSimple';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AccountForm from './components/accounts/AccountForm'; // Import the new form
import { Transaction } from './types'; // Corrected import path

type View = 'dashboard' | 'upload' | 'addAccount';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('upload');
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
      setCurrentView('dashboard'); // Go to dashboard if data exists
    }
  }, []);

  const handleLogin = (token: string) => {
    setToken(token);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentView('upload');
    localStorage.removeItem('token');
    localStorage.removeItem('transactions');
  };

  const handleUploadComplete = (data: any) => {
    console.log('Upload complete:', data);
    setTransactions(data.transactions);
    localStorage.setItem('transactions', JSON.stringify(data.transactions));
    setCurrentView('dashboard');
    setUploadDate(new Date().toISOString());
    setUploadError(null);
  };
  
  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    setUploadError(error.message);
  };
  
  const handleReset = () => {
    setCurrentView('upload');
    setUploadError(null);
    setTransactions([]);
    localStorage.removeItem('transactions');
  };
  
  const renderCurrentView = () => {
    switch (currentView) {
      case 'addAccount':
        return (
          <AccountForm
            onSubmitSuccess={(newAccount) => {
              console.log('Account created:', newAccount);
              // Maybe refresh accounts list in the future
              setCurrentView('dashboard');
            }}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'upload':
        return (
          <FileUploadSimple
            onUploadComplete={handleUploadComplete}
            onError={handleUploadError}
          />
        );
      case 'dashboard':
      default:
        return <Dashboard uploadDate={uploadDate} transactions={transactions} />;
    }
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
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Financial Analyzer</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              New Upload
            </button>
            <button
              onClick={() => setCurrentView('addAccount')}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              Add Account
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {uploadError && (
          <div className="bg-red-100 border-l-4 border-red-400 text-red-700 p-4 mb-6 rounded-md">
            <p className="font-bold">Upload Failed</p>
            <p>{uploadError}</p>
          </div>
        )}
        
        {renderCurrentView()}
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