import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function check() {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'site_settings'
    `);
    console.log("Column types in site_settings:");
    res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

check();
