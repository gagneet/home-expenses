import pool from '../db';
import { Category } from '../types/category';

export const findCategoryByName = async (name: string, userId: string): Promise<Category | null> => {
  const result = await pool.query('SELECT * FROM categories WHERE name = $1 AND (user_id = $2 OR is_system_category = TRUE)', [name, userId]);
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  return null;
};

export const createCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const { name, user_id } = category;
  const result = await pool.query(
    'INSERT INTO categories (name, user_id) VALUES ($1, $2) RETURNING *',
    [name, user_id]
  );
  return result.rows[0];
};
