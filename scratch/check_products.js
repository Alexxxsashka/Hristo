import pg from 'pg';
const { Pool } = pg;

async function checkProducts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query("SELECT id, name, status, category_id FROM products WHERE name ILIKE '%Glock%' OR name ILIKE '%Suppressor%' OR name ILIKE '%Глок%' OR name ILIKE '%Глушитель%'");
    console.log("Found products:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkProducts();
