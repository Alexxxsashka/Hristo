import pg from 'pg';
const { Pool } = pg;

async function findClothingWithoutVariants() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`
      SELECT id, name 
      FROM products 
      WHERE (category_id = 'clothing' OR category_id = 'uniforms')
      AND (variants IS NULL OR jsonb_array_length(variants) = 0)
    `);
    console.log("Clothing without variants:", res.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

findClothingWithoutVariants();
