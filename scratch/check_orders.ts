
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrders() {
  try {
    const res = await pool.query("SELECT id, order_number, total, status, payment_status, payment_method, stripe_payment_intent_id FROM orders ORDER BY created_at DESC LIMIT 10");
    console.log('Last 10 orders:', JSON.stringify(res.rows, null, 2));
    
    const countRes = await pool.query("SELECT COUNT(*) FROM orders");
    console.log('Total orders:', countRes.rows[0].count);
    
    // Check for potential duplicates by order_number
    const dupRes = await pool.query("SELECT order_number, COUNT(*) FROM orders GROUP BY order_number HAVING COUNT(*) > 1");
    if (dupRes.rows.length > 0) {
      console.log('Found duplicate order numbers:', dupRes.rows);
    } else {
      console.log('No duplicate order numbers found.');
    }
  } catch (err) {
    console.error('Error checking orders:', err);
  } finally {
    await pool.end();
  }
}

checkOrders();
