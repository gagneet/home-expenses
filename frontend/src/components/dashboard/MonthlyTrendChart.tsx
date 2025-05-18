// frontend/src/components/dashboard/MonthlyTrendChart.tsx
import React, { useMemo } from 'react';
import { Transaction } from '../../types';

// Simple placeholder component that doesn't require external dependencies
// Replace with recharts implementation after installing the package
const MonthlyTrendChart: React.FC<{
  transactions: Transaction[];
  selectedCategory: string | null;
}> = ({ transactions, selectedCategory }) => {
  // Group transactions by month and calculate totals
  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {};
    
    // Process transactions
    transactions.forEach(transaction => {
      // Skip if category filter is applied and doesn't match
      if (selectedCategory && transaction.category?.name !== selectedCategory) {
        return;
      }
      
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (transaction.amount >= 0) {
        months[monthKey].income += transaction.amount;
      } else {
        months[monthKey].expenses += Math.abs(transaction.amount);
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(months)
      .map(([key, data]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          month: new Date(year, month - 1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
          income: data.income,
          expenses: data.expenses,
          savings: data.income - data.expenses
        };
      })
      .sort((a, b) => {
        return new Date(a.month).getTime() - new Date(b.month).getTime();
      });
  }, [transactions, selectedCategory]);
  
  // If there's no data, show a placeholder message
  if (monthlyData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-500">
          {selectedCategory 
            ? `No data available for ${selectedCategory}` 
            : 'No monthly trend data available'}
        </p>
      </div>
    );
  }
  
  // Simple visualization without recharts - replace with proper chart when dependencies are installed
  return (
    <div className="h-64 overflow-x-auto">
      <div className="text-center text-sm text-gray-500 mb-4">
        Note: Install recharts package for proper visualization
      </div>
      
      <div className="flex min-w-max h-40 items-end space-x-4 px-4">
        {monthlyData.map((data, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="flex space-x-1">
              <div 
                className="w-8 bg-green-500" 
                style={{ height: `${Math.min(data.income / 100, 100)}px` }}
                title={`Income: $${data.income.toFixed(2)}`}
              ></div>
              <div 
                className="w-8 bg-red-500" 
                style={{ height: `${Math.min(data.expenses / 100, 100)}px` }}
                title={`Expenses: $${data.expenses.toFixed(2)}`}
              ></div>
              <div 
                className={`w-8 ${data.savings >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                style={{ height: `${Math.min(Math.abs(data.savings) / 100, 100)}px` }}
                title={`Savings: $${data.savings.toFixed(2)}`}
              ></div>
            </div>
            <div className="text-xs mt-2 whitespace-nowrap">{data.month}</div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-4 space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 mr-1"></div>
          <span>Income</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 mr-1"></div>
          <span>Expenses</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 mr-1"></div>
          <span>Savings</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrendChart;