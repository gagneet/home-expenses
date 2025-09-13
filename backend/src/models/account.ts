import pool from '../db';
import { Account, AccountType, FinancialInstitution } from '../types/account';

export const createAccount = async (account: Omit<Account, 'id'>): Promise<Account> => {
  const {
    user_id,
    account_type_id,
    account_name,
  } = account;
  const result = await pool.query(
    'INSERT INTO accounts (user_id, account_type_id, account_name) VALUES ($1, $2, $3) RETURNING *',
    [user_id, account_type_id, account_name]
  );
  return result.rows[0];
};

export const findAccountsByUser = async (userId: string): Promise<Account[]> => {
  const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
  return result.rows;
};

export const createFinancialInstitution = async (institution: Omit<FinancialInstitution, 'id'>): Promise<FinancialInstitution> => {
  const { name } = institution;
  const result = await pool.query(
    'INSERT INTO financial_institutions (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
};

export const findFinancialInstitutions = async (): Promise<FinancialInstitution[]> => {
  const result = await pool.query('SELECT * FROM financial_institutions');
  return result.rows;
};

export const createAccountType = async (accountType: Omit<AccountType, 'id'>): Promise<AccountType> => {
  const { name } = accountType;
  const result = await pool.query(
    'INSERT INTO account_types (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
};

export const findAccountTypes = async (): Promise<AccountType[]> => {
  const result = await pool.query('SELECT * FROM account_types');
  return result.rows;
};
