
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkUsers() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
  console.table(res.rows);
  process.exit(0);
}

checkUsers();
