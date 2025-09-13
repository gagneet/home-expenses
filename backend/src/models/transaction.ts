import pool from '../db';
import { Transaction } from '../types/transaction';

export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const {
    user_id,
    account_id,
    transaction_date,
    description,
    amount,
  } = transaction;
  const result = await pool.query(
    'INSERT INTO transactions (user_id, account_id, transaction_date, description, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [user_id, account_id, transaction_date, description, amount]
  );
  return result.rows[0];
};
