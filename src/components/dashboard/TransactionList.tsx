// frontend/src/components/dashboard/TransactionList.tsx
import React from 'react';
import { Transaction } from '../../types';

interface TransactionListProps {
  transactions: Transaction[];
  onCategorySelect: (category: string | null) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onCategorySelect }) => {
  // Format date string to a more readable format
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
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
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                No transactions to display
              </td>
            </tr>
          ) : (
            transactions.map((transaction, index) => (
              <tr key={transaction.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => onCategorySelect(transaction.category?.name || null)}
                    className="hover:text-blue-600 focus:outline-none"
                  >
                    {transaction.category?.name || 'Uncategorized'}
                    {transaction.category?.subcategory && (
                      <span className="text-xs ml-1 text-gray-400">
                        ({transaction.category.subcategory})
                      </span>
                    )}
                  </button>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                  transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${Math.abs(transaction.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {transaction.balance !== undefined ? `$${transaction.balance.toFixed(2)}` : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;