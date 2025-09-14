import { NextResponse } from 'next/server';
import { FrankingCreditsCalculator } from '../../../../lib/server/lib/franking-calculator';
import { createInvestmentTransaction } from '../../../../lib/server/models/investment';
import { NewInvestmentTransaction } from '../../../../lib/server/types/investment';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable must be set');
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const userId = decoded.userId;

    const { accountId, securityCode, dividendAmount, frankingPercentage, sharesHeld } = await req.json();

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
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
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
