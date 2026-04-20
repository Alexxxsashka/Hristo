
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@34.29.209.72:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('orders', 'users', 'order_items')
      ORDER BY table_name, ordinal_position;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
