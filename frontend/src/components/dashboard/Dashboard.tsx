// frontend/src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { ExpenseSummary, Transaction } from '../../types';
import CategoryTable from './CategoryTable';
import MonthlyTrendChart from './MonthlyTrendChart';
import Summary from './Summary';
import TransactionList from './TransactionList';
import api from '../../services/api';

interface DashboardProps {
  uploadDate?: string;
  transactions: Transaction[];
}

// Simplified version of the Dashboard component
const Dashboard: React.FC<DashboardProps> = ({ uploadDate, transactions }) => {
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    categorySummaries: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Mock data for demonstration
  const mockSummary: ExpenseSummary = {
    totalIncome: 9500,
    totalExpenses: 5600,
    netSavings: 3900,
    savingsRate: 41.05,
    categorySummaries: [
      { category: 'Housing', amount: 2500, percentage: 44.64 },
      { category: 'Housing', subcategory: 'Mortgage', amount: 1800, percentage: 32.14 },
      { category: 'Housing', subcategory: 'Utilities', amount: 450, percentage: 8.03 },
      { category: 'Housing', subcategory: 'Strata', amount: 250, percentage: 4.46 },
      { category: 'Food', amount: 1200, percentage: 21.42 },
      { category: 'Food', subcategory: 'Groceries', amount: 800, percentage: 14.28 },
      { category: 'Food', subcategory: 'Dining Out', amount: 400, percentage: 7.14 },
      { category: 'Transportation', amount: 600, percentage: 10.71 },
      { category: 'Transportation', subcategory: 'Fuel', amount: 350, percentage: 6.25 },
      { category: 'Transportation', subcategory: 'Public Transport', amount: 250, percentage: 4.46 },
      { category: 'Other', amount: 1300, percentage: 23.21 }
    ]
  };

  useEffect(() => {
    const processData = () => {
      try {
        setLoading(true);
        // In a real implementation, this would fetch a summary from the API
        // For now, we use mock data for the summary.
        setExpenseSummary(mockSummary);
        setLoading(false);
      } catch (err) {
        setError('Failed to process dashboard data');
        console.error(err);
        setLoading(false);
      }
    };

    processData();
  }, [transactions]); // Re-process if transactions change
  
  // Handle category selection for filtering
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };
  
  // Filter transactions by selected category
  const filteredTransactions = selectedCategory
    ? transactions.filter(t => t.category?.name === selectedCategory)
    : transactions;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <Summary
        totalIncome={expenseSummary.totalIncome}
        totalExpenses={expenseSummary.totalExpenses}
        netSavings={expenseSummary.netSavings}
        savingsRate={expenseSummary.savingsRate}
      />
      
      {/* Monthly Trend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Monthly Trends</h3>
        <MonthlyTrendChart 
          transactions={transactions}
          selectedCategory={selectedCategory}
        />
      </div>
      
      {/* Category Table */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">Category Breakdown</h3>
        <CategoryTable 
          categorySummaries={expenseSummary.categorySummaries}
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
        />
      </div>
      
      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">
          {selectedCategory ? `Transactions: ${selectedCategory}` : 'Recent Transactions'}
        </h3>
        <TransactionList 
          transactions={filteredTransactions}
          onCategorySelect={handleCategorySelect}
        />
      </div>
    </div>
  );
};

export default Dashboard;