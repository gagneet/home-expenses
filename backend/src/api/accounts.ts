import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createAccount } from '../models/account';
import { AustralianBankingUtils } from '../lib/australian-banking';
import { NewAccount } from '../types/account';

const router = express.Router();

// All routes in this file are protected
router.use(authMiddleware);

router.post('/create', async (req: AuthenticatedRequest, res) => {
  try {
    const { accountName, accountNumber, bsb, accountType } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // 1. Validate BSB
    const bsbValidation = AustralianBankingUtils.validateBSB(bsb);
    if (!bsbValidation.valid) {
      return res.status(400).json({
        error: 'Invalid BSB',
        details: bsbValidation.error
      });
    }

    // 2. Validate account number
    const accountValidation = AustralianBankingUtils.validateAccountNumber(accountNumber, bsb);
    if (!accountValidation.valid) {
      return res.status(400).json({
        error: 'Invalid account number',
        details: accountValidation.error
      });
    }

    // 3. Prepare account data
    const accountData: NewAccount = {
      user_id: userId,
      account_name: accountName,
      account_number: accountValidation.cleanNumber!,
      bsb,
      account_type: accountType,
    };

    // 4. Create account in database
    const newAccount = await createAccount(accountData);

    res.status(201).json({
      success: true,
      account: newAccount
    });

  } catch (error) {
    console.error('Account creation error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

export default router;
