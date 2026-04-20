import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
  console.log(r.rows.map(c => c.column_name));
  await pool.end();
}

main();
