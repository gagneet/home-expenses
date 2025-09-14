-- Enhanced Database Schema for Australian Personal Finance Management
-- Supports Microsoft Money-level functionality with Australian specifics

-- =============================================
-- CORE ENTITIES
-- =============================================

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Australia/Sydney',
    currency_preference VARCHAR(3) DEFAULT 'AUD',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Financial Institutions (Australian banks, super funds, brokers)
CREATE TABLE financial_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    institution_type VARCHAR(50) CHECK (institution_type IN (
        'bank', 'credit_union', 'building_society', 'super_fund',
        'broker', 'insurance', 'other'
    )),
    country VARCHAR(2) DEFAULT 'AU',
    website VARCHAR(255),
    logo_url VARCHAR(500),
    bsb_range VARCHAR(20), -- e.g., "062-000 to 062-999" for CommBank
    primary_color VARCHAR(7), -- Hex color for UI theming
    statement_formats JSONB, -- Supported import formats
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Account Types and Categories
CREATE TABLE account_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) CHECK (category IN (
        'asset', 'liability', 'equity', 'income', 'expense'
    )),
    sub_category VARCHAR(50) CHECK (sub_category IN (
        'checking', 'savings', 'term_deposit', 'credit_card', 'loan',
        'mortgage', 'investment', 'superannuation', 'managed_fund',
        'share_trading', 'cryptocurrency', 'property', 'vehicle', 'other'
    )),
    is_tax_deductible BOOLEAN DEFAULT FALSE,
    ato_category_code VARCHAR(10), -- ATO tax category codes
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

-- User Accounts (Bank accounts, credit cards, investments, super, etc.)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES financial_institutions(id),
    account_type_id UUID NOT NULL REFERENCES account_types(id),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    bsb VARCHAR(7), -- Australian BSB format: XXX-XXX
    account_nickname VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'AUD',
    opening_balance DECIMAL(15,2) DEFAULT 0.00,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2), -- For credit cards/overdrafts
    credit_limit DECIMAL(15,2),
    interest_rate DECIMAL(5,4), -- Store as percentage, e.g., 4.50% = 0.0450
    account_opened_date DATE,
    account_closed_date DATE,
    is_closed BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    include_in_net_worth BOOLEAN DEFAULT TRUE,
    auto_categorize BOOLEAN DEFAULT TRUE,
    last_reconciled_date DATE,
    last_statement_balance DECIMAL(15,2),
    last_statement_date DATE,
    notes TEXT,
    metadata JSONB, -- Store institution-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_credit_limit CHECK (credit_limit >= 0),
    CONSTRAINT valid_bsb_format CHECK (bsb ~ '^\\d{3}-\\d{3}$' OR bsb IS NULL)
);

-- =============================================
-- TRANSACTION MANAGEMENT
-- =============================================

-- Payees (Merchants, employers, service providers)
CREATE TABLE payees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255), -- For matching algorithms
    default_category_id UUID,
    payee_type VARCHAR(50) CHECK (payee_type IN (
        'merchant', 'employer', 'government', 'individual', 'transfer', 'other'
    )),
    abn VARCHAR(14), -- Australian Business Number
    website VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    auto_categorize BOOLEAN DEFAULT TRUE,
    is_transfer_account BOOLEAN DEFAULT FALSE,
    linked_account_id UUID REFERENCES accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, normalized_name)
);

-- Transaction Categories (Income and Expense categories)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_category_id UUID REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    category_type VARCHAR(20) CHECK (category_type IN ('income', 'expense', 'transfer')),
    is_system_category BOOLEAN DEFAULT FALSE,
    is_tax_deductible BOOLEAN DEFAULT FALSE,
    gst_treatment VARCHAR(20) CHECK (gst_treatment IN (
        'gst_free', 'input_taxed', 'gst_inclusive', 'not_applicable'
    )) DEFAULT 'not_applicable',
    ato_category VARCHAR(100), -- ATO category for tax reporting
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    payee_id UUID REFERENCES payees(id),
    category_id UUID REFERENCES categories(id),
    parent_transaction_id UUID REFERENCES transactions(id), -- For splits
    transaction_date DATE NOT NULL,
    posted_date DATE,
    description VARCHAR(500) NOT NULL,
    original_description VARCHAR(500), -- Raw bank description
    reference_number VARCHAR(100),
    bpay_reference VARCHAR(50), -- BPAY specific reference
    cheque_number VARCHAR(20),
    amount DECIMAL(15,2) NOT NULL,
    running_balance DECIMAL(15,2),
    transaction_type VARCHAR(50) CHECK (transaction_type IN (
        'debit', 'credit', 'transfer_in', 'transfer_out', 'fee',
        'interest', 'dividend', 'capital_gain', 'capital_loss', 'other'
    )),
    status VARCHAR(20) CHECK (status IN (
        'pending', 'cleared', 'reconciled', 'void'
    )) DEFAULT 'cleared',
    is_split_transaction BOOLEAN DEFAULT FALSE,
    is_transfer BOOLEAN DEFAULT FALSE,
    transfer_account_id UUID REFERENCES accounts(id),
    is_tax_relevant BOOLEAN DEFAULT FALSE,
    gst_amount DECIMAL(15,2) DEFAULT 0.00,
    franking_credits DECIMAL(15,2) DEFAULT 0.00, -- For Australian dividends
    foreign_amount DECIMAL(15,2),
    foreign_currency VARCHAR(3),
    exchange_rate DECIMAL(10,6),
    import_source VARCHAR(100), -- Which file/method imported this
    import_id VARCHAR(255), -- Unique ID from import source
    is_duplicate BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2), -- AI categorization confidence
    tags TEXT[], -- Array of tags
    notes TEXT,
    attachments JSONB, -- Receipt/document references
    location JSONB, -- GPS coordinates if available
    metadata JSONB, -- Additional structured data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT non_zero_amount CHECK (amount != 0),
    CONSTRAINT valid_gst_amount CHECK (gst_amount >= 0),
    CONSTRAINT valid_franking_credits CHECK (franking_credits >= 0)
);

-- =============================================
-- AUSTRALIAN INVESTMENT & SUPERANNUATION
-- =============================================

-- Investment Holdings (Stocks, ETFs, Managed Funds)
CREATE TABLE investment_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    security_code VARCHAR(20) NOT NULL, -- ASX code (e.g., CBA, VAS)
    security_name VARCHAR(255),
    security_type VARCHAR(50) CHECK (security_type IN (
        'ordinary_shares', 'preference_shares', 'etf', 'managed_fund',
        'bond', 'option', 'warrant', 'cryptocurrency', 'other'
    )),
    exchange VARCHAR(10) DEFAULT 'ASX',
    units_held DECIMAL(15,6) DEFAULT 0,
    average_cost_per_unit DECIMAL(10,4),
    current_price DECIMAL(10,4),
    currency VARCHAR(3) DEFAULT 'AUD',
    last_price_update TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(account_id, security_code)
);

-- Investment Transactions (Buys, sells, dividends, DRP)
CREATE TABLE investment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    holding_id UUID REFERENCES investment_holdings(id),
    transaction_date DATE NOT NULL,
    settlement_date DATE,
    security_code VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(30) CHECK (transaction_type IN (
        'buy', 'sell', 'dividend', 'drp', 'bonus_issue', 'rights_issue',
        'stock_split', 'return_of_capital', 'franking_credit_refund', 'other'
    )),
    units DECIMAL(15,6),
    price_per_unit DECIMAL(10,4),
    gross_amount DECIMAL(15,2),
    brokerage DECIMAL(15,2) DEFAULT 0.00,
    gst_on_brokerage DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2),
    franking_credits DECIMAL(15,2) DEFAULT 0.00,
    franking_percentage DECIMAL(5,2) DEFAULT 0.00,
    cgt_discount_eligible BOOLEAN DEFAULT FALSE,
    description VARCHAR(500),
    reference_number VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Superannuation Accounts (SMSF, Industry, Retail)
CREATE TABLE superannuation_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fund_name VARCHAR(255) NOT NULL,
    fund_abn VARCHAR(14),
    fund_usi VARCHAR(15), -- Unique Superannuation Identifier
    fund_type VARCHAR(30) CHECK (fund_type IN (
        'smsf', 'industry', 'retail', 'public_sector', 'corporate'
    )),
    member_number VARCHAR(50),
    account_balance DECIMAL(15,2) DEFAULT 0.00,
    accumulation_balance DECIMAL(15,2) DEFAULT 0.00,
    pension_balance DECIMAL(15,2) DEFAULT 0.00,
    insurance_cover JSONB, -- Life, TPD, Income Protection details
    beneficiaries JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Super Contributions and Transactions
CREATE TABLE superannuation_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_account_id UUID NOT NULL REFERENCES superannuation_accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(50) CHECK (transaction_type IN (
        'concessional_contribution', 'non_concessional_contribution',
        'government_contribution', 'rollover_in', 'rollover_out',
        'benefit_payment', 'investment_return', 'insurance_premium',
        'admin_fee', 'other_fee', 'tax', 'other'
    )),
    amount DECIMAL(15,2) NOT NULL,
    tax_component DECIMAL(15,2) DEFAULT 0.00,
    taxable_component DECIMAL(15,2) DEFAULT 0.00,
    tax_free_component DECIMAL(15,2) DEFAULT 0.00,
    description VARCHAR(500),
    financial_year INTEGER,
    contribution_cap_usage DECIMAL(15,2), -- Against annual caps
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- BUDGETING & PLANNING
-- =============================================

-- Budget Templates and Plans
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    budget_type VARCHAR(20) CHECK (budget_type IN ('monthly', 'quarterly', 'annual', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_income_budget DECIMAL(15,2) DEFAULT 0.00,
    total_expense_budget DECIMAL(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget Category Allocations
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    budgeted_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0.00,
    variance DECIMAL(15,2) DEFAULT 0.00,
    rollover_unused BOOLEAN DEFAULT FALSE,
    notes TEXT,

    UNIQUE(budget_id, category_id)
);

-- Financial Goals (Savings targets, debt reduction)
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_name VARCHAR(255) NOT NULL,
    goal_type VARCHAR(50) CHECK (goal_type IN (
        'savings', 'debt_reduction', 'investment', 'emergency_fund',
        'house_deposit', 'retirement', 'other'
    )),
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    linked_accounts UUID[], -- Array of account IDs
    monthly_contribution DECIMAL(15,2),
    is_achieved BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_target_amount CHECK (target_amount > 0),
    CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 5)
);

-- =============================================
-- REPORTING & RECONCILIATION
-- =============================================

-- Account Reconciliation Records
CREATE TABLE reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    reconciled_by UUID NOT NULL REFERENCES users(id),
    statement_date DATE NOT NULL,
    statement_balance DECIMAL(15,2) NOT NULL,
    book_balance DECIMAL(15,2) NOT NULL,
    difference DECIMAL(15,2) NOT NULL,
    reconciled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    UNIQUE(account_id, statement_date)
);

-- Tax Year Summaries (For BAS, Income Tax)
CREATE TABLE tax_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tax_year VARCHAR(9) NOT NULL, -- e.g., "2024-2025"
    summary_type VARCHAR(30) CHECK (summary_type IN (
        'income_tax', 'bas_quarterly', 'bas_monthly', 'cgt_summary'
    )),
    total_income DECIMAL(15,2) DEFAULT 0.00,
    total_deductions DECIMAL(15,2) DEFAULT 0.00,
    total_gst_collected DECIMAL(15,2) DEFAULT 0.00,
    total_gst_paid DECIMAL(15,2) DEFAULT 0.00,
    franking_credits DECIMAL(15,2) DEFAULT 0.00,
    capital_gains DECIMAL(15,2) DEFAULT 0.00,
    capital_losses DECIMAL(15,2) DEFAULT 0.00,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,

    UNIQUE(user_id, tax_year, summary_type)
);

-- =============================================
-- AUDIT & SECURITY
-- =============================================

-- Audit Trail for all changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Data Import History
CREATE TABLE import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    filename VARCHAR(500),
    file_size INTEGER,
    file_hash VARCHAR(128), -- SHA-256 hash to prevent duplicate imports
    import_type VARCHAR(50) CHECK (import_type IN (
        'bank_statement', 'credit_card', 'investment', 'superannuation', 'manual'
    )),
    institution_id UUID REFERENCES financial_institutions(id),
    transactions_imported INTEGER DEFAULT 0,
    transactions_duplicated INTEGER DEFAULT 0,
    transactions_errors INTEGER DEFAULT 0,
    import_status VARCHAR(20) CHECK (import_status IN (
        'pending', 'processing', 'completed', 'failed', 'partial'
    )),
    error_log TEXT,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Primary performance indexes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_transactions_payee ON transactions(payee_id) WHERE payee_id IS NOT NULL;
CREATE INDEX idx_transactions_import ON transactions(import_id) WHERE import_id IS NOT NULL;
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- Account and institution indexes
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_institution ON accounts(institution_id);
CREATE INDEX idx_accounts_type ON accounts(account_type_id);
CREATE INDEX idx_accounts_active ON accounts(user_id) WHERE NOT is_closed AND NOT is_hidden;

-- Investment indexes
CREATE INDEX idx_investment_holdings_account ON investment_holdings(account_id);
CREATE INDEX idx_investment_holdings_security ON investment_holdings(security_code);
CREATE INDEX idx_investment_transactions_date ON investment_transactions(transaction_date DESC);
CREATE INDEX idx_investment_transactions_security ON investment_transactions(security_code);

-- Category and payee indexes
CREATE INDEX idx_categories_user_type ON categories(user_id, category_type);
CREATE INDEX idx_payees_user_name ON payees(user_id, normalized_name);

-- Budget and goals indexes
CREATE INDEX idx_budget_categories_budget ON budget_categories(budget_id);
CREATE INDEX idx_financial_goals_user ON financial_goals(user_id) WHERE NOT is_achieved;

-- Audit and import indexes
CREATE INDEX idx_audit_log_user_time ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_import_history_user_date ON import_history(user_id, imported_at DESC);
CREATE INDEX idx_import_history_hash ON import_history(file_hash);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Net Worth Summary View
CREATE VIEW v_net_worth AS
SELECT
    a.user_id,
    SUM(CASE WHEN at.category = 'asset' THEN a.current_balance ELSE 0 END) as total_assets,
    SUM(CASE WHEN at.category = 'liability' THEN ABS(a.current_balance) ELSE 0 END) as total_liabilities,
    SUM(CASE WHEN at.category = 'asset' THEN a.current_balance
             WHEN at.category = 'liability' THEN a.current_balance
             ELSE 0 END) as net_worth
FROM accounts a
JOIN account_types at ON a.account_type_id = at.id
WHERE a.include_in_net_worth = TRUE
  AND a.is_closed = FALSE
  AND a.is_hidden = FALSE
GROUP BY a.user_id;

-- Monthly Transaction Summary View
CREATE VIEW v_monthly_summary AS
SELECT
    t.user_id,
    DATE_TRUNC('month', t.transaction_date) as month,
    c.category_type,
    c.name as category_name,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.status != 'void'
GROUP BY t.user_id, DATE_TRUNC('month', t.transaction_date), c.category_type, c.name;
