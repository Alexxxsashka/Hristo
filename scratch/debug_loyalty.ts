import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const r = await pool.query("SELECT id, username, email, points, rank FROM users");
  console.log(JSON.stringify(r.rows, null, 2));
  
  const o = await pool.query("SELECT DISTINCT user_id FROM orders");
  console.log("Order owners:", o.rows.map(r => r.user_id));

  await pool.end();
}

main();
