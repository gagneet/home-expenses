import { Transaction } from '../types/transaction';
import { CATEGORY_RULES } from './category-rules';
import { findCategoryByName, createCategory } from '../models/category';

interface CategoryRule {
  category: string;
  subcategory?: string;
  patterns: RegExp[];
}

export class TransactionCategorizer {
  private rules: CategoryRule[] = CATEGORY_RULES;

  public async categorize(transaction: Omit<Transaction, 'id' | 'account_id'>, userId: string): Promise<Partial<Transaction>> {
    const description = transaction.description.toLowerCase();

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (pattern.test(description)) {
          let category = await findCategoryByName(rule.category, userId);
          if (!category) {
            // If category doesn't exist, create it.
            // This is a simplification. In a real app, you might want to handle this differently.
            category = await createCategory({ name: rule.category, user_id: userId });
          }
          return {
            ...transaction,
            category_id: category.id,
            category: category,
          };
        }
      }
    }

    return transaction;
  }

  public async categorizeAll(transactions: Omit<Transaction, 'id' | 'account_id'>[], userId: string): Promise<Partial<Transaction>[]> {
    const categorizedTransactions = [];
    for (const transaction of transactions) {
      const categorized = await this.categorize(transaction, userId);
      categorizedTransactions.push(categorized);
    }
    return categorizedTransactions;
  }
}
