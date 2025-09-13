// frontend/src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { ExpenseSummary, Transaction } from '../../types';
import CategoryTable from './CategoryTable';
import MonthlyTrendChart from './MonthlyTrendChart';
import Summary from './Summary';
import TransactionList from './TransactionList';

const calculateSummary = (transactions: Transaction[]): ExpenseSummary => {
  const summary: ExpenseSummary = {
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    savingsRate: 0,
    categorySummaries: [],
  };

  const categoryMap: { [key: string]: number } = {};

  for (const t of transactions) {
    if (t.amount > 0) {
      summary.totalIncome += t.amount;
    } else {
      summary.totalExpenses += Math.abs(t.amount);
    }

    if (t.category) {
      const categoryName = t.category.name || 'Uncategorized';
      categoryMap[categoryName] = (categoryMap[categoryName] || 0) + Math.abs(t.amount);
    }
  }

  summary.netSavings = summary.totalIncome - summary.totalExpenses;
  summary.savingsRate = summary.totalIncome > 0 ? (summary.netSavings / summary.totalIncome) * 100 : 0;

  summary.categorySummaries = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0,
  }));

  return summary;
};


const Dashboard: React.FC<{
  uploadDate?: string;
  transactions: Transaction[];
}> = ({ uploadDate, transactions }) => {
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
  
  useEffect(() => {
    if (transactions.length > 0) {
      setExpenseSummary(calculateSummary(transactions));
      setLoading(false);
    }
  }, [transactions]);
  
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