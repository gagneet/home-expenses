import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Initialize express app
const app = express();
const port = process.env.PORT || 4000;

// Configure middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
});

// API routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Upload endpoint
app.post('/api/statements/upload', upload.array('files'), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const bank = req.body.bank || 'unknown';
    const accountType = req.body.accountType || 'checking';
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Log upload info
    console.log(`Received ${files.length} files from bank: ${bank}, account type: ${accountType}`);
    files.forEach(file => {
      console.log(`File: ${file.originalname}, Size: ${file.size} bytes, Path: ${file.path}`);
    });
    
    // Return mock response
    // In a real implementation, this would process the files and extract data
    setTimeout(() => {
      res.status(200).json({
        message: 'Files processed successfully',
        statements: files.map((file, index) => ({
          id: `stmt-${index}`,
          bankName: bank,
          accountNumber: `XXXX-XXXX-${1000 + index}`,
          statementPeriod: {
            start: '2024-01-01',
            end: '2024-01-31'
          },
          transactionCount: Math.floor(Math.random() * 50) + 10,
          fileName: file.originalname
        })),
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
      });
    }, 2000); // Simulate processing time
    
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ message: 'Error processing uploaded files' });
  }
});

// Transactions endpoint
app.get('/api/statements/transactions', (req, res) => {
  // Get query parameters
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const category = req.query.category as string;
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  
  console.log(`Query params: startDate=${startDate}, endDate=${endDate}, category=${category}, limit=${limit}, offset=${offset}`);
  
  // Mock transactions
  const transactions = [
    {
      id: '1',
      date: '2024-01-05',
      description: 'Salary Aris Zinc Pty Ltd',
      amount: 8490.02,
      balance: 9054.37,
      category: { name: 'Income', subcategory: 'Salary' }
    },
    {
      id: '2',
      date: '2024-01-05',
      description: 'Home Loan Pymt',
      amount: -2981.00,
      balance: 6073.37,
      category: { name: 'Housing', subcategory: 'Mortgage' }
    },
    {
      id: '3',
      date: '2024-01-05',
      description: 'Transfer To 86 400 CommBank App For Savings',
      amount: -1225.00,
      balance: 4848.37,
      category: { name: 'Transfers', subcategory: 'Savings' }
    },
    {
      id: '4',
      date: '2024-01-06',
      description: 'Direct Debit AMERICAN EXPRESS',
      amount: -1435.53,
      balance: 3412.84,
      category: { name: 'Debt Payments', subcategory: 'Credit Card' }
    },
    {
      id: '5',
      date: '2024-01-14',
      description: 'CBA CR CARD AUTOPAY PMNT',
      amount: -2276.15,
      balance: 1136.69,
      category: { name: 'Debt Payments', subcategory: 'Credit Card' }
    },
    {
      id: '6',
      date: '2024-01-20',
      description: 'Wdl ATM Red NP-Majura Park',
      amount: -240.00,
      balance: 896.69, 
      category: { name: 'ATM Withdrawals' }
    },
    {
      id: '7',
      date: '2024-01-25',
      description: 'Direct Credit Avneet Rooprai For Daily Needs',
      amount: 6259.32,
      balance: 7156.01,
      category: { name: 'Income', subcategory: 'Transfer' }
    },
    {
      id: '8',
      date: '2024-01-28',
      description: 'Direct Debit AMERICAN EXPRESS',
      amount: -3470.97,
      balance: 3685.04,
      category: { name: 'Debt Payments', subcategory: 'Credit Card' }
    }
  ];
  
  // Filter by category if provided
  const filteredTransactions = category
    ? transactions.filter(t => t.category?.name === category)
    : transactions;
  
  // Apply pagination
  const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
  
  // Send response
  res.status(200).json({
    transactions: paginatedTransactions,
    pagination: {
      total: filteredTransactions.length,
      offset,
      limit
    }
  });
});

// Summary endpoint
app.get('/api/statements/summary', (req, res) => {
  // Mock summary data
  const summary = {
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
  };
  
  res.status(200).json(summary);
});

// Trends endpoint
app.get('/api/statements/trends', (req, res) => {
  const months = parseInt(req.query.months as string) || 6;
  const category = req.query.category as string;
  
  console.log(`Trends params: months=${months}, category=${category}`);
  
  // Generate mock monthly data
  const trends = [];
  
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    const income = Math.round((8000 + Math.random() * 2000) * 100) / 100;
    const expenses = Math.round((4000 + Math.random() * 2000) * 100) / 100;
    const savings = income - expenses;
    
    trends.unshift({
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      income,
      expenses,
      savings
    });
  }
  
  res.status(200).json(trends);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});