import pg from 'pg';
const { Pool } = pg;

async function checkMisclassified() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`
      SELECT p.id, p.name, p.type, p.category_id, c.parent_id 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.type = 'weapon' OR p.category_id = 'weapons' OR c.parent_id = 'weapons'
    `);
    console.log("Potential weapon items:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkMisclassified();
