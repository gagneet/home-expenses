export interface User {
  id: string;
  email: string;
  username?: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  timezone?: string;
  currency_preference?: string;
  date_format?: string;
  two_factor_enabled?: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_login_at?: Date;
  is_active?: boolean;
}
