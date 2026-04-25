import pg from 'pg';
const { Pool } = pg;

async function checkRecentProducts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query("SELECT id, name, type, category_id FROM products ORDER BY created_at DESC LIMIT 10");
    console.log("Recent products:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkRecentProducts();
