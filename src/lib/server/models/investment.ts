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
      net_amount
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;

  // Note: This assumes a fixed withholding tax rate for non-residents, or for other tax reasons.
  // In a real-world application, this rate should be configurable or based on user-specific tax status.
  const withholdingTaxRate = 0.15; // 15% is a common withholding tax rate for unfranked dividends.
  const netAmount = gross_amount * (1 - withholdingTaxRate);

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
    netAmount,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating investment transaction:', error);
    throw error;
  }
};
