// frontend/src/components/dashboard/Summary.tsx
import React from 'react';

interface SummaryProps {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
}

const Summary: React.FC<SummaryProps> = ({ 
  totalIncome, 
  totalExpenses, 
  netSavings, 
  savingsRate 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
        <p className="mt-1 text-2xl font-semibold text-green-600">${totalIncome.toFixed(2)}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
        <p className="mt-1 text-2xl font-semibold text-red-600">${totalExpenses.toFixed(2)}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Net Savings</h3>
        <p className={`mt-1 text-2xl font-semibold ${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${netSavings.toFixed(2)}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-500">Savings Rate</h3>
        <p className={`mt-1 text-2xl font-semibold ${savingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {savingsRate.toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default Summary;