import { Transaction } from '../types/transaction';

// Helper to parse various date formats
export function parseDate(dateStr: string): Date | null {
  // Try several common date formats: DD/MM/YYYY, YYYY-MM-DD, DD MMM YYYY, DD MMM, etc.
  const formats = [
    /^\d{2}\/\d{2}\/\d{4}$/, // 12/01/2024
    /^\d{4}-\d{2}-\d{2}$/,   // 2024-01-12
    /^\d{2}\s[A-Za-z]{3}\s\d{4}$/, // 12 Jan 2024
    /^\d{2}\s[A-Za-z]{3}$/,  // 12 Jan
  ];
  let date: Date | null = null;
  for (const format of formats) {
    if (format.test(dateStr.trim())) {
      // Try to parse directly
      date = new Date(dateStr.trim());
      if (!isNaN(date.getTime())) return date;
    }
  }
  // Fallback: try Date constructor
  date = new Date(dateStr.trim());
  if (!isNaN(date.getTime())) return date;
  return null;
}

// Helper to parse amounts with optional currency, negative, parentheses, etc.
export function parseAmount(amountStr: string): number {
  // Remove currency symbols and whitespace
  let cleaned = amountStr.replace(/[^0-9,.\-()]/g, '').trim();
  // Handle parentheses for negative amounts
  let negative = false;
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }
  // Remove thousands separators (commas)
  cleaned = cleaned.replace(/,/g, '');
  // Handle trailing minus
  if (cleaned.endsWith('-')) {
    negative = true;
    cleaned = cleaned.slice(0, -1);
  }
  // Parse float
  let value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  return negative ? -value : value;
}

interface BankParsingConfig {
  transactionRegex: RegExp;
  datePattern: RegExp;
  descriptionPattern: RegExp;
  amountPattern: RegExp;
  dateFormat: string;
}

const BANK_CONFIGS: { [key: string]: Partial<BankParsingConfig> } = {
  'commbank': {
    transactionRegex: /^\s*([\d]{2}\s[A-Za-z]{3})\s+(.+?)\s+([-\(]?\$?\(?[\d,]+\.\d{2}\)?-?)\s*$/,
  },
  'default': {
    transactionRegex: /^\s*([\d]{2}\/[\d]{2}\/[\d]{4}|[\d]{4}-[\d]{2}-[\d]{2}|[\d]{2}\s[A-Za-z]{3}\s[\d]{4}|[\d]{2}\s[A-Za-z]{3})\s+(.+?)\s+([-\(]?\$?\(?[\d,]+\.\d{2}\)?-?)\s*$/,
  }
};

export const parseTransactions = (text: string, bank: string): Omit<Transaction, 'id' | 'user_id' | 'account_id'>[] => {
  const transactions: Omit<Transaction, 'id' | 'user_id' | 'account_id'>[] = [];
  const lines = text.split('\n');
  const config = BANK_CONFIGS[bank] || BANK_CONFIGS['default'];

  for (const line of lines) {
    if (config.transactionRegex) {
      const match = line.match(config.transactionRegex);
      if (match) {
        const [_, dateStr, description, amountStr] = match;
        const date = parseDate(dateStr);
        if (!date) continue;

        transactions.push({
          transaction_date: date,
          description: description.trim(),
          amount: parseAmount(amountStr),
        });
      }
    }
  }
  return transactions;
};
