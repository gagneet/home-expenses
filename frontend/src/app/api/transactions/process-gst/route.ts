import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/server/auth';
import { GSTCalculator } from '../../../../lib/server/lib/gst-calculator';
import { updateTransactionGstDetails } from '../../../../lib/server/models/transaction';

async function handler(req: AuthenticatedRequest) {
  try {
    const { transactionId, amount, gstTreatment } = await req.json();

    if (!transactionId || amount === undefined || !gstTreatment) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, amount, gstTreatment' },
        { status: 400 }
      );
    }

    const gstCalculation = GSTCalculator.calculateFromTotal(amount, gstTreatment);

    // Update transaction in database with GST details
    const updatedTransaction = await updateTransactionGstDetails(
      transactionId,
      gstCalculation.gstAmount,
      gstCalculation.netAmount
    );

    return NextResponse.json(
      {
        success: true,
        gstCalculation,
        updatedTransaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GST processing error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to process GST calculation', details: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to process GST calculation' },
        { status: 500 }
      );
    }
  }
}

export const POST = withAuth(handler);
