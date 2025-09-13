import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/server/auth';
import { FrankingCreditsCalculator } from '../../../../lib/server/lib/franking-calculator';
import { createInvestmentTransaction } from '../../../../lib/server/models/investment';
import { NewInvestmentTransaction } from '../../../../lib/server/types/investment';

async function handler(req: AuthenticatedRequest) {
  try {
    const { accountId, securityCode, dividendAmount, frankingPercentage, sharesHeld } = await req.json();
    const userId = req.user?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (!accountId || !securityCode || !dividendAmount || frankingPercentage === undefined || !sharesHeld) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    return NextResponse.json(
      {
        success: true,
        frankingDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dividend processing error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to process dividend', details: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json({ error: 'Failed to process dividend' }, { status: 500 });
    }
  }
}

export const POST = withAuth(handler);
