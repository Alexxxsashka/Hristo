import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function main() {
  const res = await pool.query("SELECT id, slug, filters FROM categories WHERE slug = 'airsoft-weapons'");
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}
main().catch(console.error);
