import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { FrankingCreditsCalculator } from '../lib/franking-calculator';
import { createInvestmentTransaction } from '../models/investment';
import { NewInvestmentTransaction } from '../types/investment';

const router = express.Router();

// All routes in this file are protected
router.use(authMiddleware);

router.post('/dividend', async (req: AuthenticatedRequest, res) => {
  try {
    const { accountId, securityCode, dividendAmount, frankingPercentage, sharesHeld } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!accountId || !securityCode || !dividendAmount || frankingPercentage === undefined || !sharesHeld) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const totalDividend = parseFloat(dividendAmount) * parseInt(sharesHeld, 10);
    const frankingDetails = FrankingCreditsCalculator.calculate(totalDividend, frankingPercentage);

    // Prepare data for saving
    const investmentTxData: NewInvestmentTransaction = {
        user_id: userId,
        account_id: accountId,
        security_code: securityCode,
        transaction_type: 'dividend',
        transaction_date: new Date().toISOString(), // Or use a date from req.body if provided
        gross_amount: frankingDetails.cashDividend,
        franking_credits: frankingDetails.frankingCredit,
        franking_percentage: parseFloat(frankingPercentage),
        units_held: parseInt(sharesHeld, 10),
    };

    // Save investment transaction
    await createInvestmentTransaction(investmentTxData);

    res.status(200).json({
      success: true,
      frankingDetails
    });

  } catch (error) {
    console.error('Dividend processing error:', error);
    if (error instanceof Error) {
        res.status(500).json({ error: 'Failed to process dividend', details: error.message });
    } else {
        res.status(500).json({ error: 'Failed to process dividend' });
    }
  }
});

export default router;
