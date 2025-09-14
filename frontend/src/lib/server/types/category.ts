export interface Category {
  id: string;
  user_id: string;
  parent_category_id?: string;
  name: string;
  category_type?: 'income' | 'expense' | 'transfer';
  is_system_category?: boolean;
  is_tax_deductible?: boolean;
  gst_treatment?: 'gst_free' | 'input_taxed' | 'gst_inclusive' | 'not_applicable';
  ato_category?: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: Date;
}
