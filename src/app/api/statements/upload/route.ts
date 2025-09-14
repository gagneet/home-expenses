import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { createTransaction } from '../../../../lib/server/models/transaction';
import { TransactionCategorizer } from '../../../../lib/server/services/categorizer';
import { parseTransactions } from '../../../../lib/server/services/parser';
import { Transaction } from '../../../../lib/server/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const generateErrorId = () => uuidv4();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_TYPES = ['application/pdf'];

export async function POST(req: Request) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable must be set');
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const userId = decoded.userId;

    const formData = await req.formData();
    const accountId = formData.get('accountId') as string;
    const bank = formData.get('bank') as string;
    const files = formData.getAll('files') as File[];

    if (!accountId) {
      return NextResponse.json({ message: 'accountId is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: `File ${file.name} exceeds maximum size of 5MB` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { message: `File ${file.name} has invalid type. Only PDF files are allowed` },
          { status: 400 }
        );
      }
    }

    const categorizer = new TransactionCategorizer();
    const allCreatedTransactions = [];

    for (const file of files) {
      const dataBuffer = Buffer.from(await file.arrayBuffer());
      const data = await pdf(dataBuffer);
      const parsedTransactions = parseTransactions(data.text, bank);
      const categorizedTransactions = await categorizer.categorizeAll(
        parsedTransactions.map((t) => ({ ...t, user_id: userId })),
        userId
      );

      for (const t of categorizedTransactions) {
        const createdTransaction = await createTransaction({
          ...(t as Omit<Transaction, 'id'>),
          account_id: accountId,
        });
        allCreatedTransactions.push(createdTransaction);
      }
    }

    return NextResponse.json(
      {
        message: `Successfully uploaded and processed ${allCreatedTransactions.length} transactions.`,
        transactions: allCreatedTransactions,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorId = generateErrorId();
    console.error(`Error processing upload (ID: ${errorId}):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    return NextResponse.json(
      { message: 'Error processing uploaded files', error_id: errorId },
      { status: 500 }
    );
  }
}
