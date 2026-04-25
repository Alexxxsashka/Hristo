import pg from 'pg';
const { Pool } = pg;

async function checkProductStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`
      SELECT id, name, status, type 
      FROM products 
      WHERE name ILIKE '%Glock%' OR name ILIKE '%Suppressor%' OR name ILIKE '%глок%' OR name ILIKE '%глушитель%'
    `);
    console.log("Glock/Suppressor status:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkProductStatus();
