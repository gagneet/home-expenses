// frontend/src/components/dashboard/CategoryTable.tsx
import React from 'react';
import { CategorySummary } from '../../types';

interface CategoryTableProps {
  categorySummaries: CategorySummary[];
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
}

const CategoryTable: React.FC<CategoryTableProps> = ({ 
  categorySummaries, 
  onCategorySelect, 
  selectedCategory 
}) => {
  // Get main categories only (no subcategories)
  const mainCategories = categorySummaries.filter(summary => !summary.subcategory);
  
  // Group subcategories by their parent category
  const subcategoriesByCategory = categorySummaries
    .filter(summary => summary.subcategory)
    .reduce((acc, summary) => {
      if (!acc[summary.category]) {
        acc[summary.category] = [];
      }
      acc[summary.category].push(summary);
      return acc;
    }, {} as Record<string, CategorySummary[]>);
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Percentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {mainCategories.map((category) => (
            <React.Fragment key={category.category}>
              {/* Main category row */}
              <tr 
                className={`
                  hover:bg-gray-50 cursor-pointer
                  ${selectedCategory === category.category ? 'bg-blue-50' : ''}
                `}
                onClick={() => onCategorySelect(
                  selectedCategory === category.category ? null : category.category
                )}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {category.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  ${category.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {category.percentage.toFixed(1)}%
                </td>
              </tr>
              
              {/* Subcategory rows, shown if parent category is selected */}
              {selectedCategory === category.category && subcategoriesByCategory[category.category]?.map((subcategory) => (
                <tr key={`${subcategory.category}-${subcategory.subcategory}`} className="bg-gray-50">
                  <td className="px-6 py-2 pl-10 whitespace-nowrap text-sm text-gray-600">
                    {subcategory.subcategory}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                    ${subcategory.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600 text-right">
                    {subcategory.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryTable;