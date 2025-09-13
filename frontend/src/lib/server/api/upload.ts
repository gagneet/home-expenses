import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdf from 'pdf-parse';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createTransaction } from '../models/transaction';
import { TransactionCategorizer } from '../services/categorizer';
import { Transaction } from '../types/transaction';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const generateErrorId = () => uuidv4();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and add timestamp
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + sanitizedName);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Only allow PDF files
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Helper to parse various date formats
function parseDate(dateStr: string): Date | null {
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
function parseAmount(amountStr: string): number {
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

const parseTransactions = (text: string, bank: string): Omit<Transaction, 'id' | 'user_id' | 'account_id'>[] => {
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

router.post('/upload', authMiddleware, upload.array('files'), async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const { userId } = req.user;
  const { accountId, bank } = req.body;

  if (!accountId) {
    return res.status(400).json({ message: 'accountId is required' });
  }

  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const categorizer = new TransactionCategorizer();
    const allCreatedTransactions = [];

    for (const file of files) {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdf(dataBuffer);
      const parsedTransactions = parseTransactions(data.text, bank);
      const categorizedTransactions = await categorizer.categorizeAll(parsedTransactions.map(t => ({...t, user_id: userId})), userId);

      for (const t of categorizedTransactions) {
        const createdTransaction = await createTransaction({
          ...(t as Omit<Transaction, 'id'>),
          account_id: accountId,
        });
        allCreatedTransactions.push(createdTransaction);
      }
    }

    res.status(200).json({
      message: `Successfully uploaded and processed ${allCreatedTransactions.length} transactions.`,
      transactions: allCreatedTransactions,
    });
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error processing upload (ID: ${errorId}):`, {
      userId,
      accountId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Error processing uploaded files', error_id: errorId });
  }
});

export default router;
