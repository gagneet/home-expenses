import express from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { GSTCalculator } from '../lib/gst-calculator';
import { updateTransactionGstDetails } from '../models/transaction';

const router = express.Router();

// All routes in this file are protected
router.use(authMiddleware);

router.post('/process-gst', async (req: AuthenticatedRequest, res) => {
  try {
    const { transactionId, amount, gstTreatment } = req.body;

    if (!transactionId || amount === undefined || !gstTreatment) {
        return res.status(400).json({ error: 'Missing required fields: transactionId, amount, gstTreatment' });
    }

    const gstCalculation = GSTCalculator.calculateFromTotal(amount, gstTreatment);

    // Update transaction in database with GST details
    const updatedTransaction = await updateTransactionGstDetails(
        transactionId,
        gstCalculation.gstAmount,
        gstCalculation.netAmount
    );

    res.status(200).json({
      success: true,
      gstCalculation,
      updatedTransaction
    });

  } catch (error) {
    console.error('GST processing error:', error);
    if (error instanceof Error) {
        res.status(500).json({ error: 'Failed to process GST calculation', details: error.message });
    } else {
        res.status(500).json({ error: 'Failed to process GST calculation' });
    }
  }
});

export default router;
