// backend/src/services/reports/generator.ts
import { Transaction } from '../../models/transaction';
import { BankStatement } from '../../types';

export interface CategorySummary {
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
}

export interface ExpenseSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  categorySummaries: CategorySummary[];
}

export class ReportGenerator {
  /**
   * Generates a comprehensive expense summary from categorized transactions
   */
  public generateExpenseSummary(statements: BankStatement[]): ExpenseSummary {
    // Combine all transactions from all statements
    const allTransactions: Transaction[] = statements.flatMap(
      statement => statement.transactions
    );
    
    // Calculate total income
    const totalIncome = allTransactions
      .filter(t => t.category?.name === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total expenses (negative amounts)
    const totalExpenses = Math.abs(
      allTransactions
        .filter(t => t.amount < 0 && t.category?.name !== 'Investments' && t.category?.name !== 'Transfers')
        .reduce((sum, t) => sum + t.amount, 0)
    );
    
    // Calculate net savings
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    // Generate category summaries
    const categorySummaries = this.generateCategorySummaries(allTransactions, totalExpenses);
    
    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      categorySummaries
    };
  }
  
  /**
   * Generates a breakdown of expenses by category
   */
  private generateCategorySummaries(transactions: Transaction[], totalExpenses: number): CategorySummary[] {
    // Skip income, transfers and investment categories
    const expenseTransactions = transactions.filter(
      t => t.amount < 0 && 
           t.category?.name !== 'Income' && 
           t.category?.name !== 'Transfers' &&
           t.category?.name !== 'Investments'
    );
    
    // Group by category and subcategory
    const categoryMap = new Map<string, Map<string, number>>();
    
    for (const transaction of expenseTransactions) {
      const category = transaction.category?.name || 'Other';
      const subcategory = transaction.category?.subcategory || 'Uncategorized';
      const amount = Math.abs(transaction.amount);
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map<string, number>());
      }
      
      const subcategoryMap = categoryMap.get(category)!;
      subcategoryMap.set(
        subcategory, 
        (subcategoryMap.get(subcategory) || 0) + amount
      );
    }
    
    // Convert to array of category summaries
    const result: CategorySummary[] = [];
    
    categoryMap.forEach((subcategoryMap, category) => {
      // Add a summary for the category as a whole
      const categoryTotal = Array.from(subcategoryMap.values()).reduce((sum, amount) => sum + amount, 0);
      const categoryPercentage = (categoryTotal / totalExpenses) * 100;
      
      result.push({
        category,
        amount: categoryTotal,
        percentage: categoryPercentage
      });
      
      // Add summaries for each subcategory
      subcategoryMap.forEach((amount, subcategory) => {
        const percentage = (amount / totalExpenses) * 100;
        
        result.push({
          category,
          subcategory,
          amount,
          percentage
        });
      });
    });
    
    // Sort by amount descending
    return result.sort((a, b) => b.amount - a.amount);
  }
  
  /**
   * Generates a monthly trend analysis
   */
  public generateMonthlyTrend(statements: BankStatement[]) {
    // Implementation for historical trending data
    // This would extract data across multiple statement periods
    // and generate month-by-month comparisons
  }
  
  /**
   * Identifies unusual expenses or income
   */
  public identifyAnomalies(statements: BankStatement[]) {
    // Implementation to detect unusual spending patterns or income
  }
}