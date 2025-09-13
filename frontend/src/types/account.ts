export interface FinancialInstitution {
  id: string;
  name: string;
  short_name?: string;
  institution_type?: 'bank' | 'credit_union' | 'building_society' | 'super_fund' | 'broker' | 'insurance' | 'other';
  country?: string;
  website?: string;
  logo_url?: string;
  bsb_range?: string;
  primary_color?: string;
  statement_formats?: any;
  created_at?: Date;
}

export interface AccountType {
  id: string;
  name: string;
  category?: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  sub_category?: 'checking' | 'savings' | 'term_deposit' | 'credit_card' | 'loan' | 'mortgage' | 'investment' | 'superannuation' | 'managed_fund' | 'share_trading' | 'cryptocurrency' | 'property' | 'vehicle' | 'other';
  is_tax_deductible?: boolean;
  ato_category_code?: string;
  description?: string;
  sort_order?: number;
}

export interface Account {
  id: string;
  user_id: string;
  institution_id?: string;
  account_type_id: string;
  account_name: string;
  account_number?: string;
  bsb?: string;
  account_nickname?: string;
  currency?: string;
  opening_balance?: number;
  current_balance?: number;
  available_balance?: number;
  credit_limit?: number;
  interest_rate?: number;
  account_opened_date?: Date;
  account_closed_date?: Date;
  is_closed?: boolean;
  is_hidden?: boolean;
  include_in_net_worth?: boolean;
  auto_categorize?: boolean;
  last_reconciled_date?: Date;
  last_statement_balance?: number;
  last_statement_date?: Date;
  notes?: string;
  metadata?: any;
  created_at?: Date;
  updated_at?: Date;
}
