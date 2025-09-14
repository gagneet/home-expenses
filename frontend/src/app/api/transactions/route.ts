import { NextResponse } from 'next/server';
import { findTransactionsByUser } from '../../../lib/server/models/transaction';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable must be set');
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const transactions = await findTransactionsByUser(decoded.userId);
    return NextResponse.json(transactions, { status: 200 });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
