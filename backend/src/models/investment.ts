import pool from '../db';
import { InvestmentTransaction, NewInvestmentTransaction } from '../types/investment';

export const createInvestmentTransaction = async (
  txData: NewInvestmentTransaction
): Promise<InvestmentTransaction> => {
  const {
    user_id,
    account_id,
    security_code,
    transaction_date,
    transaction_type,
    gross_amount,
    franking_credits,
    franking_percentage,
    units_held,
  } = txData;

  const query = `
    INSERT INTO investment_transactions (
      user_id,
      account_id,
      security_code,
      transaction_date,
      transaction_type,
      gross_amount,
      franking_credits,
      franking_percentage,
      units,
      net_amount -- Assuming net_amount is the same as gross for a dividend
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $6)
    RETURNING *;
  `;

  const values = [
    user_id,
    account_id,
    security_code,
    transaction_date,
    transaction_type,
    gross_amount,
    franking_credits,
    franking_percentage,
    units_held,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating investment transaction:', error);
    throw error;
  }
};
