import pool from '../db';
import { User } from '../types/user';

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const { email, username, password_hash, first_name, last_name } = user;
  const result = await pool.query(
    'INSERT INTO users (email, username, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [email, username, password_hash, first_name, last_name]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  return null;
};

export const findUserById = async (id: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  return null;
};
