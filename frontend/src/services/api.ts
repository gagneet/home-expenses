// frontend/src/services/api.ts
import axios from 'axios';
import { ExpenseSummary, Transaction, UploadResult } from '../types';

// Custom error types for better error handling in components
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API URL - configurable via environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

/**
 * Upload statement files to the server
 */
export const uploadStatements = async (
  files: File[], 
  bank: string, 
  accountType: string
): Promise<UploadResult> => {
  try {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('bank', bank);
    formData.append('accountType', accountType);
    
    const response = await axios.post(`${API_URL}/statements/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading statements:', error);
    throw error;
  }
};

/**
 * Fetch expense summary for a date range
 */
export const fetchExpenseSummary = async (
  startDate?: string,
  endDate?: string
): Promise<ExpenseSummary> => {
  try {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    const response = await axios.get(`${API_URL}/statements/summary?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense summary:', error);
    throw error;
  }
};

/**
 * Fetch transactions with optional filters
 */
export const fetchTransactions = async (
  startDate?: string,
  endDate?: string,
  category?: string | null,
  limit = 100,
  offset = 0
): Promise<{ transactions: Transaction[], pagination: { total: number, offset: number, limit: number } }> => {
  try {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    if (category) {
      params.append('category', category);
    }
    
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    const response = await axios.get(`${API_URL}/statements/transactions?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Fetch monthly trends data
 */
export const fetchMonthlyTrends = async (
  months = 12,
  category?: string
): Promise<any[]> => {
  try {
    const params = new URLSearchParams();
    
    params.append('months', months.toString());
    
    if (category) {
      params.append('category', category);
    }
    
    const response = await axios.get(`${API_URL}/statements/trends?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    throw error;
  }
};

// For demonstration, add a mock version of each API for local development
export const mockUploadStatements = async (
  files: File[], 
  bank: string, 
  accountType: string
): Promise<UploadResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    message: 'Files processed successfully',
    statements: [
      {
        id: '1',
        bankName: bank,
        accountNumber: 'XXXX-XXXX-1234',
        statementPeriod: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        transactionCount: files.length * 15, // Just a mock number
        fileName: files[0]?.name || 'statement.pdf'
      }
    ],
    summary: {
      totalIncome: 9500,
      totalExpenses: 5600,
      netSavings: 3900,
      savingsRate: 41.05,
      categorySummaries: [
        { category: 'Housing', amount: 2500, percentage: 44.64 },
        { category: 'Housing', subcategory: 'Mortgage', amount: 1800, percentage: 32.14 },
        { category: 'Housing', subcategory: 'Utilities', amount: 450, percentage: 8.03 },
        { category: 'Housing', subcategory: 'Strata', amount: 250, percentage: 4.46 },
        { category: 'Food', amount: 1200, percentage: 21.42 },
        { category: 'Food', subcategory: 'Groceries', amount: 800, percentage: 14.28 },
        { category: 'Food', subcategory: 'Dining Out', amount: 400, percentage: 7.14 },
        { category: 'Transportation', amount: 600, percentage: 10.71 },
        { category: 'Transportation', subcategory: 'Fuel', amount: 350, percentage: 6.25 },
        { category: 'Transportation', subcategory: 'Public Transport', amount: 250, percentage: 4.46 },
        { category: 'Other', amount: 1300, percentage: 23.21 }
      ]
    }
  };
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};


// =============================================
// NEW API FUNCTIONS
// =============================================

export interface NewAccountData {
  accountName: string;
  accountNumber: string;
  bsb: string;
  accountType: string;
}

export const createAccount = async (accountData: NewAccountData) => {
  try {
    const response = await axios.post(`${API_URL}/accounts/create`, accountData, getAuthHeaders());
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'An error occurred while creating the account.';
      const details = error.response?.data?.details;

      if (status === 401) {
        throw new ApiError('Authentication required. Please log in again.', status, 'AUTH_REQUIRED');
      } else if (status === 400) {
        throw new ApiError(details || message, status, 'INVALID_DATA');
      }
      throw new ApiError(message, status);
    }
    // Fallback for non-Axios errors
    throw new ApiError('A network error occurred. Please try again.');
  }
};

export interface GstProcessData {
  transactionId: string;
  amount: number;
  gstTreatment: 'GST_INCLUSIVE' | 'GST_FREE' | 'INPUT_TAXED' | 'NOT_APPLICABLE';
}

export const processGst = async (gstData: GstProcessData) => {
  try {
    const response = await axios.post(`${API_URL}/transactions/process-gst`, gstData, getAuthHeaders());
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'An error occurred while processing GST.';
      throw new ApiError(message, status);
    }
    throw new ApiError('A network error occurred. Please try again.');
  }
};


export interface DividendProcessData {
  accountId: string;
  securityCode: string;
  dividendAmount: number;
  frankingPercentage: number;
  sharesHeld: number;
}

export const processDividend = async (dividendData: DividendProcessData) => {
  try {
    const response = await axios.post(`${API_URL}/investments/dividend`, dividendData, getAuthHeaders());
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || 'An error occurred while processing the dividend.';
      throw new ApiError(message, status);
    }
    throw new ApiError('A network error occurred. Please try again.');
  }
};


// Export a combined API with fallbacks to mocks for development
export default {
  uploadStatements: process.env.NODE_ENV === 'development' ? mockUploadStatements : uploadStatements,
  fetchExpenseSummary,
  fetchTransactions,
  fetchMonthlyTrends,
  // New functions
  createAccount,
  processGst,
  processDividend,
};