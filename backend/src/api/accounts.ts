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

const router = express.Router();

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
    res.status(500).json({ message: 'Error creating account' });
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
    res.status(500).json({ message: 'Error fetching accounts' });
  }
});

// Financial Institutions
router.post('/institutions', authMiddleware, async (req, res) => {
  const { name } = req.body;
  try {
    const institution = await createFinancialInstitution({ name });
    res.status(201).json(institution);
  } catch (error) {
    res.status(500).json({ message: 'Error creating financial institution' });
  }
});

router.get('/institutions', authMiddleware, async (req, res) => {
  try {
    const institutions = await findFinancialInstitutions();
    res.status(200).json(institutions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching financial institutions' });
  }
});

// Account Types
router.post('/types', authMiddleware, async (req, res) => {
  const { name } = req.body;
  try {
    const accountType = await createAccountType({ name });
    res.status(201).json(accountType);
  } catch (error) {
    res.status(500).json({ message: 'Error creating account type' });
  }
});

router.get('/types', authMiddleware, async (req, res) => {
  try {
    const accountTypes = await findAccountTypes();
    res.status(200).json(accountTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching account types' });
  }
});

export default router;
