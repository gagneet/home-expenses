import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { withAuth, AuthenticatedRequest } from '../../../../lib/server/auth';
import { createTransaction } from '../../../../lib/server/models/transaction';
import { TransactionCategorizer } from '../../../../lib/server/services/categorizer';
import { parseTransactions } from '../../../../lib/server/services/parser';
import { Transaction } from '../../../../lib/server/types/transaction';
import { v4 as uuidv4 } from 'uuid';

const generateErrorId = () => uuidv4();

async function handler(req: AuthenticatedRequest) {
  if (!req.user) {
    return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
  }

  const { userId } = req.user;
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

  try {
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
      userId,
      accountId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { message: 'Error processing uploaded files', error_id: errorId },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
