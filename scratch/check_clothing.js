import pg from 'pg';
const { Pool } = pg;

async function checkClothing() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query("SELECT id, name, type, category_id FROM products WHERE category_id ILIKE '%cloth%' OR category_id ILIKE '%wear%' OR name ILIKE '%shirt%' OR name ILIKE '%pant%' OR name ILIKE '%jacket%'");
    console.log("Clothing-like products:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkClothing();
