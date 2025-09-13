import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import {
  createAccount,
  findAccountsByUser,
  createFinancialInstitution,
  findFinancialInstitutions,
  createAccountType,
  findAccountTypes,
} from '../models/account';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const generateErrorId = () => uuidv4();

// Accounts
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const { userId } = req.user;
  const { account_type_id, account_name } = req.body;
  try {
    const account = await createAccount({ user_id: userId, account_type_id, account_name });
    res.status(201).json(account);
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error creating account (ID: ${errorId}):`, {
      userId,
      account_type_id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    if (error instanceof Error && error.message.includes('foreign key constraint')) {
      return res.status(400).json({
        message: 'Invalid account type specified'
      });
    }

    res.status(500).json({
      message: 'An error occurred while creating the account',
      error_id: errorId
    });
  }
});

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  const { userId } = req.user;
  try {
    const accounts = await findAccountsByUser(userId);
    res.status(200).json(accounts);
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error fetching accounts (ID: ${errorId}):`, {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Error fetching accounts', error_id: errorId });
  }
});

// Financial Institutions
router.post('/institutions', authMiddleware, async (req, res) => {
  const { name } = req.body;
  try {
    const institution = await createFinancialInstitution({ name });
    res.status(201).json(institution);
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error creating financial institution (ID: ${errorId}):`, {
      name,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Error creating financial institution', error_id: errorId });
  }
});

router.get('/institutions', authMiddleware, async (req, res) => {
  try {
    const institutions = await findFinancialInstitutions();
    res.status(200).json(institutions);
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error fetching financial institutions (ID: ${errorId}):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Error fetching financial institutions', error_id: errorId });
  }
});

// Account Types
router.post('/types', authMiddleware, async (req, res) => {
  const { name } = req.body;
  try {
    const accountType = await createAccountType({ name });
    res.status(201).json(accountType);
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error creating account type (ID: ${errorId}):`, {
      name,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Error creating account type', error_id: errorId });
  }
});

router.get('/types', authMiddleware, async (req, res) => {
  try {
    const accountTypes = await findAccountTypes();
    res.status(200).json(accountTypes);
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error fetching account types (ID: ${errorId}):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ message: 'Error fetching account types', error_id: errorId });
  }
});

export default router;
