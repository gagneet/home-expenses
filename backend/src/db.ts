import { Pool } from 'pg';

const pool = new Pool({
  user: 'jules',
  host: 'localhost',
  database: 'home_expenses',
  password: 'password',
  port: 5432,
});

export default pool;
