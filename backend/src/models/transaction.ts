import pool from '../db';
import { Transaction } from '../types/transaction';

export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const {
    user_id,
    account_id,
    transaction_date,
    description,
    amount,
    category_id,
  } = transaction;
  const result = await pool.query(
    'INSERT INTO transactions (user_id, account_id, transaction_date, description, amount, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [user_id, account_id, transaction_date, description, amount, category_id]
  );
  return result.rows[0];
};
