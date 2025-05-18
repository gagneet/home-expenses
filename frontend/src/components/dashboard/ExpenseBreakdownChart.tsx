// frontend/src/components/dashboard/ExpenseBreakdownChart.tsx
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CategorySummary } from '../../types';

interface ExpenseBreakdownChartProps {
  categorySummaries: CategorySummary[];
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
}

// Color palette for the categories
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD',
  '#EC7063', '#5DADE2', '#48C9B0', '#F4D03F', '#EB984E',
  '#A6ACAF', '#D7BDE2', '#F5B7B1', '#7DCEA0', '#F7DC6F'
];

const ExpenseBreakdownChart: React.FC<ExpenseBreakdownChartProps> = ({ 
  categorySummaries, 
  onCategorySelect,
  selectedCategory 
}) => {
  // Prepare data for the pie chart - only include top-level categories
  const chartData = useMemo(() => {
    const mainCategories = categorySummaries
      .filter(summary => !summary.subcategory) // Only include main categories
      .sort((a, b) => b.amount - a.amount);    // Sort by amount
    
    return mainCategories;
  }, [categorySummaries]);

  // Custom legend that allows selection
  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center mt-4 text-sm">
        {payload.map((entry: any, index: number) => (
          <li 
            key={`item-${index}`}
            className={`flex items-center mx-2 my-1 cursor-pointer px-2 py-1 rounded
              ${selectedCategory === entry.value ? 'bg-gray-100' : ''}`}
            onClick={() => onCategorySelect(
              selectedCategory === entry.value ? null : entry.value
            )}
          >
            <div
              className="w-3 h-3 mr-1"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm">${data.amount.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{data.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  // Handle click on pie segments
  const handlePieClick = (data: any) => {
    const categoryName = data.name;
    onCategorySelect(selectedCategory === categoryName ? null : categoryName);
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={50}
            paddingAngle={1}
            dataKey="amount"
            nameKey="category"
            onClick={handlePieClick}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke={selectedCategory === entry.category ? '#333' : 'none'}
                strokeWidth={selectedCategory === entry.category ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpenseBreakdownChart;