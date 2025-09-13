// frontend/src/types/index.ts

/**
 * Bank option for selection
 */
export interface BankOption {
  id: string;
  name: string;
  logo: string;
}

/**
 * Transaction category
 */
export interface Category {
  name: string;
  subcategory?: string;
}

/**
 * Individual transaction
 */
export interface Transaction {
  id?: string;
  date: Date | string;
  description: string;
  amount: number;
  balance?: number;
  category: Category | null;
}

/**
 * Category summary for reports
 */
export interface CategorySummary {
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
}

/**
 * Expense summary report
 */
export interface ExpenseSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  categorySummaries: CategorySummary[];
}

/**
 * Monthly trend data
 */
export interface MonthlyTrend {
  month: string;
  year: number;
  income: number;
  expenses: number;
  savings: number;
}

/**
 * Statement metadata
 */
export interface StatementInfo {
  id: string;
  bankName: string;
  accountNumber: string;
  statementPeriod: {
    start: string;
    end: string;
  };
  transactionCount: number;
  fileName: string;
}

/**
 * Upload result
 */
export interface UploadResult {
  message: string;
  statements: StatementInfo[];
  summary: ExpenseSummary;
}