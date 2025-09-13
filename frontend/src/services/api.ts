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

// Base API URL - for client-side requests, this should be relative
const API_URL = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error || errorData.message || 'An error occurred';
    const details = errorData.details;
    const status = response.status;
    let code;

    if (status === 401) {
      code = 'AUTH_REQUIRED';
    } else if (status === 400) {
      code = 'INVALID_DATA';
    }

    throw new ApiError(details || message, status, code);
  }
  return response.json();
}

/**
 * Upload statement files to the server
 */
export const uploadStatements = async (
  files: File[],
  bank: string,
  accountId: string
): Promise<UploadResult> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('bank', bank);
  formData.append('accountId', accountId);

  const response = await fetch(`${API_URL}/statements/upload`, {
    method: 'POST',
    body: formData,
    ...getAuthHeaders(),
  });

  return handleResponse<UploadResult>(response);
};

/**
 * Fetch expense summary for a date range
 */
export const fetchExpenseSummary = async (
  startDate?: string,
  endDate?: string
): Promise<ExpenseSummary> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(`${API_URL}/statements/summary?${params.toString()}`, {
    ...getAuthHeaders(),
  });

  return handleResponse<ExpenseSummary>(response);
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
): Promise<{ transactions: Transaction[]; pagination: { total: number; offset: number; limit: number } }> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (category) params.append('category', category);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_URL}/statements/transactions?${params.toString()}`, {
    ...getAuthHeaders(),
  });

  return handleResponse<{ transactions: Transaction[]; pagination: { total: number; offset: number; limit: number } }>(response);
};

/**
 * Fetch monthly trends data
 */
export const fetchMonthlyTrends = async (
  months = 12,
  category?: string
): Promise<any[]> => {
  const params = new URLSearchParams();
  params.append('months', months.toString());
  if (category) params.append('category', category);

  const response = await fetch(`${API_URL}/statements/trends?${params.toString()}`, {
    ...getAuthHeaders(),
  });

  return handleResponse<any[]>(response);
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
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
  const response = await fetch(`${API_URL}/accounts/create`, {
    method: 'POST',
    body: JSON.stringify(accountData),
    ...getAuthHeaders(),
  });
  return handleResponse(response);
};

export interface GstProcessData {
  transactionId: string;
  amount: number;
  gstTreatment: 'GST_INCLUSIVE' | 'GST_FREE' | 'INPUT_TAXED' | 'NOT_APPLICABLE';
}

export const processGst = async (gstData: GstProcessData) => {
  const response = await fetch(`${API_URL}/transactions/process-gst`, {
    method: 'POST',
    body: JSON.stringify(gstData),
    ...getAuthHeaders(),
  });
  return handleResponse(response);
};

export interface DividendProcessData {
  accountId: string;
  securityCode: string;
  dividendAmount: number;
  frankingPercentage: number;
  sharesHeld: number;
}

export const processDividend = async (dividendData: DividendProcessData) => {
  const response = await fetch(`${API_URL}/investments/dividend`, {
    method: 'POST',
    body: JSON.stringify(dividendData),
    ...getAuthHeaders(),
  });
  return handleResponse(response);
};

// Export a combined API
export default {
  uploadStatements,
  fetchExpenseSummary,
  fetchTransactions,
  fetchMonthlyTrends,
  createAccount,
  processGst,
  processDividend,
};