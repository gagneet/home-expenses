'use client';

import { useState, useEffect } from 'react';
import Dashboard from '../../components/dashboard/Dashboard';
import { Transaction } from '../../types';
import { fetchTransactions } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const loadTransactions = async () => {
        try {
          const userTransactions = await fetchTransactions();
          setTransactions(userTransactions);
        } catch (error) {
          console.error('Failed to fetch transactions', error);
          // Optionally, show an error message to the user
        } finally {
          setLoading(false);
        }
      };
      loadTransactions();
    }
  }, [isAuthenticated]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Dashboard transactions={transactions} />;
}
