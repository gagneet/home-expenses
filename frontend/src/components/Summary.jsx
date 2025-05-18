// frontend/src/components/Summary.jsx
import React from 'react';
import { ExpenseBarChart, ExpensePieChart } from './Charts';

const Summary = ({ summaryData }) => {
  if (!summaryData) {
    return <div className="text-center py-8">No data available</div>;
  }

  // Format data for bar chart
  const getBarChartData = () => {
    if (!summaryData.high_level_summary) return [];
    
    return Object.entries(summaryData.high_level_summary).map(([name, value]) => ({
      name,
      amount: value
    }));
  };

  // Format data for pie chart
  const getPieChartData = () => {
    if (!summaryData.high_level_summary) return [];
    
    return Object.entries(summaryData.high_level_summary).map(([name, value]) => ({
      name,
      value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">Financial Summary</h2>
      
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Total Income</h3>
          <p className="text-2xl font-bold text-blue-600">${summaryData.total_income?.toFixed(2) || '0.00'}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-red-800 mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600">${summaryData.total_expenses?.toFixed(2) || '0.00'}</p>
        </div>
        
        <div className={`${summaryData.net_cashflow >= 0 ? 'bg-green-50' : 'bg-yellow-50'} p-4 rounded-lg`}>
          <h3 className={`text-lg font-medium mb-2 ${summaryData.net_cashflow >= 0 ? 'text-green-800' : 'text-yellow-800'}`}>
            Net Cashflow
          </h3>
          <p className={`text-2xl font-bold ${summaryData.net_cashflow >= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
            ${summaryData.net_cashflow?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Expense Breakdown</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <ExpenseBarChart data={getBarChartData()} />
          
          {/* Pie Chart */}
          <ExpensePieChart data={getPieChartData()} />
        </div>
      </div>
      
      {/* Detailed Expense Table */}
      <div>
        <h3 className="text-lg font-medium mb-4">Detailed Expense Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaryData.high_level_summary && Object.entries(summaryData.high_level_summary).map(([category, amount], index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((amount / summaryData.total_expenses) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  Total Expenses
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  ${summaryData.total_expenses?.toFixed(2) || '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Transaction History (Optional) */}
      {summaryData.transaction_history && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Transaction History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(summaryData.transaction_history).map(([date, transactions]) => (
                  transactions.map((transaction, index) => (
                    <tr key={`${date}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {index === 0 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" rowSpan={transactions.length}>
                          {date}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Summary;