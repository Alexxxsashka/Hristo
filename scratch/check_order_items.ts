
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkSchema() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order_items'");
    console.log('Columns in order_items:');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
