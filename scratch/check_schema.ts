
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    console.log("Orders table schema:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error("Error checking schema:", e);
  } finally {
    await pool.end();
  }
}

checkSchema();
