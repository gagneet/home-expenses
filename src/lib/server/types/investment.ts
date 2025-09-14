export interface InvestmentTransaction {
  id: string;
  user_id: string;
  account_id: string;
  holding_id?: string;
  transaction_date: string;
  settlement_date?: string;
  security_code: string;
  transaction_type: 'buy' | 'sell' | 'dividend' | 'drp' | 'bonus_issue' | 'rights_issue' | 'stock_split' | 'return_of_capital' | 'franking_credit_refund' | 'other';
  units?: number;
  price_per_unit?: number;
  gross_amount?: number;
  brokerage?: number;
  gst_on_brokerage?: number;
  net_amount?: number;
  franking_credits?: number;
  franking_percentage?: number;
  cgt_discount_eligible: boolean;
  description?: string;
  reference_number?: string;
  metadata?: any;
  created_at: string;
}

export type NewInvestmentTransaction = Pick<InvestmentTransaction,
  'user_id' |
  'account_id' |
  'security_code' |
  'transaction_type' |
  'transaction_date'
> & {
  gross_amount: number;
  franking_credits: number;
  franking_percentage: number;
  units_held: number; // This comes from the API request but is not directly in the table
};
