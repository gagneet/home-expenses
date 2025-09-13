import pool from '../db';
import { Account, NewAccount } from '../types/account';
import { AustralianBankingUtils } from '../lib/australian-banking';

// A placeholder function to get account_type_id.
// In a real app, this might be cached or pre-loaded.
async function getAccountTypeId(typeName: string): Promise<string> {
  // This is a simplification. The schema has a detailed account_types table.
  // We'll query it to find the ID for a given sub_category name.
  const res = await pool.query(
    'SELECT id FROM account_types WHERE sub_category = $1 LIMIT 1',
    [typeName]
  );
  if (res.rows.length === 0) {
    // If the type name is not found in the database, reject the request.
    // This ensures data integrity and prevents the creation of accounts with invalid types.
    // A production system should have a well-defined list of account types.
    throw new Error(`Account type '${typeName}' is not a valid or supported account type.`);
  }
  return res.rows[0].id;
}

async function findOrCreateInstitution(bankName: string): Promise<string> {
  // Check if the institution already exists
  let res = await pool.query(
    'SELECT id FROM financial_institutions WHERE name = $1',
    [bankName]
  );

  if (res.rows.length > 0) {
    return res.rows[0].id;
  }

  // If not, create it
  res = await pool.query(
    `INSERT INTO financial_institutions (name, institution_type, country)
     VALUES ($1, 'bank', 'AU')
     RETURNING id`,
    [bankName]
  );
  return res.rows[0].id;
}

export const createAccount = async (accountData: NewAccount): Promise<Account> => {
  const { user_id, account_name, account_number, bsb, account_type } = accountData;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Identify bank and find/create institution
    let institutionId: string | null = null;
    if (bsb) {
      const bankName = AustralianBankingUtils.identifyBankByBSB(bsb);
      if (bankName) {
        institutionId = await findOrCreateInstitution(bankName);
      }
    }

    // 2. Get account type ID
    const accountTypeId = await getAccountTypeId(account_type);

    // 3. Insert the account
    const insertQuery = `
      INSERT INTO accounts (
        user_id, institution_id, account_type_id, account_name,
        account_number, bsb, currency, opening_balance, current_balance
      ) VALUES ($1, $2, $3, $4, $5, $6, 'AUD', 0, 0)
      RETURNING *;
    `;

    const values = [
      user_id,
      institutionId,
      accountTypeId,
      account_name,
      account_number,
      bsb,
    ];

    const result = await client.query(insertQuery, values);
    const newAccount = result.rows[0];

    await client.query('COMMIT');
    return newAccount;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating account in transaction:', error);
    throw error;
  } finally {
    client.release();
  }
};
