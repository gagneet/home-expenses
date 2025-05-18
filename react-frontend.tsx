import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ExpenseCalculator = () => {
  const [statements, setStatements] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c'];

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setStatements(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setStatements(prev => prev.filter((_, i) => i !== index));
  };

  const processStatements = async () => {
    // In a real application, this would upload files to the backend
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response with sample data
      const mockSummary = {
        total_income: 7500.00,
        total_expenses: 5234.78,
        net_cashflow: 2265.22,
        high_level_summary: {
          Mortgage: 1850.00,
          Strata: 450.00,
          Utilities: 375.45,
          Groceries: 685.22,
          'Eating Out': 425.35,
          Travel: 250.00,
          Others: 1198.76
        }
      };
      
      setSummary(mockSummary);
    } catch (err) {
      setError('Error processing statements. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setStatements([]);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format data for charts
  const getBarChartData = () => {
    if (!summary) return [];
    
    return Object.entries(summary.high_level_summary).map(([name, value]) => ({
      name,
      amount: value
    }));
  };

  const getPieChartData = () => {
    if (!summary) return [];
    
    return Object.entries(summary.high_level_summary).map(([name, value]) => ({
      name,
      value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Home Expenditure Calculator</h1>
        
        {/* File Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Bank & Credit Card Statements</h2>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Upload your statements (Bank & Credit Card)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".pdf,.csv,.xlsx,.xls"
              ref={fileInputRef}
            />
          </div>
          
          {/* File List */}
          {statements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Selected Files:</h3>
              <ul className="space-y-2">
                {statements.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate mr-2">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex space-x-4">
            <button
              onClick={processStatements}
              disabled={statements.length === 0 || isProcessing}
              className={`px-4 py-2 rounded-md ${
                statements.length === 0 || isProcessing
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Process Statements'}
            </button>
            
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Clear All
            </button>
          </div>
          
          {error && (
            <div className="mt-4 text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
        
        {/* Results Section */}
        {summary && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Financial Summary</h2>
            
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Total Income</h3>
                <p className="text-2xl font-bold text-blue-600">${summary.total_income.toFixed(2)}</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-800 mb-2">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">${summary.total_expenses.toFixed(2)}</p>
              </div>
              
              <div className={`${summary.net_cashflow >= 0 ? 'bg-green-50' : 'bg-yellow-50'} p-4 rounded-lg`}>
                <h3 className="text-lg font-medium mb-2"
                    className={summary.net_cashflow >= 0 ? 'text-green-800' : 'text-yellow-800'}>
                  Net Cashflow
                </h3>
                <p className={`text-2xl font-bold ${summary.net_cashflow >= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  ${summary.net_cashflow.toFixed(2)}
                </p>
              </div>
            </div>
            
            {/* Charts */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Expense Breakdown</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-4 text-center">Expenses by Category</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={getBarChartData()}
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="amount" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Pie Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-4 text-center">Expense Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
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
                    {Object.entries(summary.high_level_summary).map(([category, amount], index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {((amount / summary.total_expenses) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        Total Expenses
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${summary.total_expenses.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        100%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCalculator;
