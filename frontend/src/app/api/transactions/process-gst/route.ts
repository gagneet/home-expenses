import { NextResponse } from 'next/server';
import { GSTCalculator } from '../../../../lib/server/lib/gst-calculator';
import { updateTransactionGstDetails } from '../../../../lib/server/models/transaction';
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
    jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

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
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
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
