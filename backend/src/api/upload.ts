import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdf from 'pdf-parse';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createTransaction } from '../models/transaction';
import { TransactionCategorizer } from '../services/categorizer';
import { Transaction } from '../types/transaction';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

const parseTransactions = (text: string): Omit<Transaction, 'id' | 'user_id' | 'account_id'>[] => {
  const transactions: Omit<Transaction, 'id' | 'user_id' | 'account_id'>[] = [];
  const lines = text.split('\n');
  const transactionRegex = /(\d{2}\s[A-Za-z]{3})\s(.*?)\s([\d,]+\.\d{2})/;

  for (const line of lines) {
    const match = line.match(transactionRegex);
    if (match) {
      const [_, date, description, amount] = match;
      transactions.push({
        transaction_date: new Date(date),
        description: description.trim(),
        amount: parseFloat(amount.replace(/,/g, '')),
      });
    }
  }
  return transactions;
};

router.post('/upload', authMiddleware, upload.array('files'), async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  const { userId } = req.user;
  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ message: 'accountId is required' });
  }

  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const categorizer = new TransactionCategorizer();
    let totalTransactions = 0;

    for (const file of files) {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdf(dataBuffer);
      const parsedTransactions = parseTransactions(data.text);
      const categorizedTransactions = categorizer.categorizeAll(parsedTransactions);

      for (const t of categorizedTransactions) {
        await createTransaction({
          ...t,
          user_id: userId,
          account_id: accountId,
        });
        totalTransactions++;
      }
    }

    res.status(200).json({ message: `Successfully uploaded and processed ${totalTransactions} transactions.` });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ message: 'Error processing uploaded files' });
  }
});

export default router;
