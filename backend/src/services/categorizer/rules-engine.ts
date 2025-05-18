// backend/src/services/categorizer/rules-engine.ts
import { Transaction } from '../../models/transaction';
import { CATEGORY_RULES } from './categories';

export interface CategoryRule {
  category: string;
  subcategory?: string;
  patterns: RegExp[];
}

export class TransactionCategorizer {
  private rules: CategoryRule[] = CATEGORY_RULES;
  
  /**
   * Categorizes a transaction based on its description
   * @param transaction The transaction to categorize
   * @returns The categorized transaction
   */
  public categorize(transaction: Transaction): Transaction {
    const description = transaction.description.toLowerCase();
    
    // Try to match the transaction against category rules
    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(description)) {
          return {
            ...transaction,
            category: {
              name: rule.category,
              subcategory: rule.subcategory
            }
          };
        }
      }
    }
    
    // Default categorization if no rule matches
    return {
      ...transaction,
      category: {
        name: 'Other',
        subcategory: 'Uncategorized'
      }
    };
  }
  
  /**
   * Categorizes multiple transactions
   * @param transactions List of transactions to categorize
   * @returns Categorized transactions
   */
  public categorizeAll(transactions: Transaction[]): Transaction[] {
    return transactions.map(transaction => this.categorize(transaction));
  }
  
  /**
   * Allows adding custom category rules
   * @param rule New category rule to add
   */
  public addRule(rule: CategoryRule): void {
    this.rules.push(rule);
  }
}

// backend/src/services/categorizer/categories.ts
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