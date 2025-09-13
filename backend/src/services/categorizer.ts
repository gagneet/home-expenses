import { Transaction } from '../types/transaction';
import { CATEGORY_RULES } from './category-rules';

interface CategoryRule {
  category: string;
  subcategory?: string;
  patterns: RegExp[];
}

export class TransactionCategorizer {
  private rules: CategoryRule[] = CATEGORY_RULES;

  public categorize(transaction: Omit<Transaction, 'id' | 'user_id' | 'account_id'>): Partial<Transaction> {
    const description = transaction.description.toLowerCase();

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(description)) {
          // This is a simplified approach. In a real application, you would
          // look up the category_id from the database based on the category name.
          // For now, we'll just return the names.
          return {
            ...transaction,
            // category_id: rule.category_id, // In a real app
          };
        }
      }
    }

    return transaction;
  }

  public categorizeAll(transactions: Omit<Transaction, 'id' | 'user_id' | 'account_id'>[]): Partial<Transaction>[] {
    return transactions.map(transaction => this.categorize(transaction));
  }
}
