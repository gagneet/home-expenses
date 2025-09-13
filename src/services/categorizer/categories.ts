export const CATEGORY_RULES = [
  {
    category: 'Housing',
    subcategory: 'Mortgage',
    patterns: [
      /mortgage/i,
      /home loan/i,
      /loan \d+/i,
      /loan pymt/i
    ]
  },
  {
    category: 'Housing',
    subcategory: 'Strata',
    patterns: [
      /strata/i,
      /body corporate/i,
      /owners corp/i
    ]
  },
  {
    category: 'Housing',
    subcategory: 'Utilities',
    patterns: [
      /electricity/i,
      /water/i,
      /gas/i,
      /internet/i,
      /broadband/i,
      /telstra/i,
      /optus/i,
      /vodafone/i,
      /origin energy/i,
      /agl/i
    ]
  },
  {
    category: 'Food',
    subcategory: 'Groceries',
    patterns: [
      /woolworths/i,
      /coles/i,
      /aldi/i,
      /igr/i,
      /grocery/i,
      /supermarket/i
    ]
  },
  {
    category: 'Food',
    subcategory: 'Dining Out',
    patterns: [
      /restaurant/i,
      /cafe/i,
      /coffee/i,
      /uber eats/i,
      /deliveroo/i,
      /menulog/i,
      /doordash/i
    ]
  },
  {
    category: 'Transportation',
    subcategory: 'Fuel',
    patterns: [
      /fuel/i,
      /petrol/i,
      /shell/i,
      /bp/i,
      /caltex/i
    ]
  },
  {
    category: 'Transportation',
    subcategory: 'Public Transport',
    patterns: [
      /opal/i,
      /myki/i,
      /go card/i,
      /transport/i,
      /train/i,
      /bus/i
    ]
  },
  {
    category: 'Income',
    subcategory: 'Salary',
    patterns: [
      /salary/i,
      /pay \d+/i,
      /wages/i,
      /payroll/i
    ]
  },
  {
    category: 'Income',
    subcategory: 'Interest',
    patterns: [
      /interest/i,
      /dividend/i
    ]
  },
  {
    category: 'Investments',
    subcategory: 'Savings',
    patterns: [
      /savings/i,
      /transfer to \d+ for savings/i,
      /\d+ for savings/i
    ]
  },
  {
    category: 'Debts',
    subcategory: 'Credit Card',
    patterns: [
      /credit card/i,
      /credit card payment/i,
      /cc payment/i,
      /autopay pmnt/i,
      /american express/i,
      /amex/i
    ]
  }
];
