import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function list() {
  const res = await pool.query('SELECT id, name, slug FROM categories');
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}
list();
