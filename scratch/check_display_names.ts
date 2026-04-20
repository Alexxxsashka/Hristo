import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const r = await pool.query("SELECT id, username, display_name, points FROM users");
  console.log(JSON.stringify(r.rows, null, 2));
  await pool.end();
}

main();
