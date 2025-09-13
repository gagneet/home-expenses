import { Transaction } from '../../models/transaction';
import { CATEGORY_RULES } from './categories';

export interface CategoryRule {
  category: string;
  subcategory?: string;
  patterns: RegExp[];
}

export class TransactionCategorizer {
  private rules: CategoryRule[] = CATEGORY_RULES;

  public categorize(transaction: Transaction): Transaction {
    const description = transaction.description.toLowerCase();

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

    return {
      ...transaction,
      category: {
        name: 'Other',
        subcategory: 'Uncategorized'
      }
    };
  }

  public categorizeAll(transactions: Transaction[]): Transaction[] {
    return transactions.map(transaction => this.categorize(transaction));
  }
}
