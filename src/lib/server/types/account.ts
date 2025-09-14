export interface Account {
  id: string;
  user_id: string;
  institution_id?: string;
  account_type_id: string;
  account_name: string;
  account_number?: string;
  bsb?: string;
  account_nickname?: string;
  currency: string;
  opening_balance: number;
  current_balance: number;
  available_balance?: number;
  credit_limit?: number;
  interest_rate?: number;
  account_opened_date?: string;
  account_closed_date?: string;
  is_closed: boolean;
  is_hidden: boolean;
  include_in_net_worth: boolean;
  auto_categorize: boolean;
  last_reconciled_date?: string;
  last_statement_balance?: number;
  last_statement_date?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export type NewAccount = Pick<Account,
  'user_id' |
  'account_name' |
  'account_number' |
  'bsb'
> & {
  // Assuming account_type is passed from the frontend and needs to be resolved to an ID
  account_type: string;
  institution_name?: string; // To find or create an institution
};
