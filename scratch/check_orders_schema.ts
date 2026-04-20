
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrders() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
  console.table(res.rows);
  process.exit(0);
}

checkOrders();
