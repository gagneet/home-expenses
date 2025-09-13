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

export const findTransactionsByUser = async (userId: string): Promise<Transaction[]> => {
  const result = await pool.query(
    `SELECT t.*, c.name as category_name, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1
     ORDER BY t.transaction_date DESC`,
    [userId]
  );
  return result.rows.map(row => ({
    ...row,
    transaction_date: new Date(row.transaction_date).toLocaleDateString('en-US'),
    category: {
      id: row.category_id,
      name: row.category_name,
      color: row.category_color,
    }
  }));
};
