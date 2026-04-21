
import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function debug() {
  try {
    const ordersRes = await pool.query("SELECT id FROM orders LIMIT 5");
    console.log("Orders sample IDs:", ordersRes.rows.map(r => r.id));

    const itemsRes = await pool.query("SELECT order_id FROM order_items LIMIT 5");
    console.log("Order Items sample order_ids:", itemsRes.rows.map(r => r.order_id));

    const countAll = await pool.query("SELECT COUNT(*) FROM order_items");
    console.log("Total order items count:", countAll.rows[0].count);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
