'use client';

import { useState, useEffect } from 'react';
import Dashboard from '../../components/dashboard/Dashboard';
import { Transaction } from '../../types';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uploadDate, setUploadDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    // In the future, this data should be fetched from an API.
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
    // I am not sure where uploadDate is stored. I will leave it undefined for now.
  }, []);

  return <Dashboard uploadDate={uploadDate} transactions={transactions} />;
}
