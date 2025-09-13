import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '../../../../lib/server/auth';
import { createAccount } from '../../../../lib/server/models/account';
import { AustralianBankingUtils } from '../../../../lib/server/lib/australian-banking';
import { NewAccount } from '../../../../lib/server/types/account';

async function handler(req: AuthenticatedRequest) {
  try {
    const { accountName, accountNumber, bsb, accountType } = await req.json();
    const userId = req.user?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Validate account type
    const validAccountTypes = ['checking', 'savings', 'credit_card', 'investment', 'superannuation'];
    if (!validAccountTypes.includes(accountType)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
    }

    // 1. Validate BSB
    const bsbValidation = AustralianBankingUtils.validateBSB(bsb);
    if (!bsbValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid BSB',
          details: bsbValidation.error,
        },
        { status: 400 }
      );
    }

    // 2. Validate account number
    const accountValidation = AustralianBankingUtils.validateAccountNumber(accountNumber, bsb);
    if (!accountValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid account number',
          details: accountValidation.error,
        },
        { status: 400 }
      );
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

    return NextResponse.json(
      {
        success: true,
        account: newAccount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Account creation error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
