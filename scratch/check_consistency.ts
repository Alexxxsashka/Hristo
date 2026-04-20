
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkData() {
  try {
    const orders = await pool.query('SELECT user_id, COUNT(*), SUM(total) FROM orders GROUP BY user_id');
    console.log('--- Orders per User ---');
    console.table(orders.rows);

    const users = await pool.query('SELECT id, email, username, points, rank, discount_level FROM users');
    console.log('\n--- Users Table ---');
    console.table(users.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
