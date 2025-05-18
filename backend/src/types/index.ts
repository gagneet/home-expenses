// backend/src/types/index.ts
/**
 * Common types used throughout the application
 */

/**
 * Statement type enum
 */
export enum StatementType {
  BANK = 'bank',
  CREDIT_CARD = 'credit_card',
  LOAN = 'loan'
}

/**
 * Category structure
 */
export interface Category {
  name: string;
  subcategory?: string;
}

/**
 * Transaction interface
 */
export interface Transaction {
  id?: string;
  statementId?: string;
  date: Date;
  description: string;
  amount: number;
  balance?: number;
  category: Category | null;
  raw?: string;
}

/**
 * Bank statement interface
 */
export interface BankStatement {
  id?: string;
  userId?: string;
  bankName: string;
  accountNumber: string;
  statementPeriod: {
    start: Date;
    end: Date;
  };
  closingBalance: number;
  transactions: Transaction[];
  type: StatementType;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  uploadDate?: Date;
  accountType?: string;
  rawData?: string;
}

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API error response
 */
export interface APIError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}