import pg from 'pg';
const { Pool } = pg;

async function checkClothingDetail() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`
      SELECT name, variant_attributes, variants 
      FROM products 
      WHERE name = 'Emerson G3 Combat Pants'
    `);
    console.log("Detail for Emerson G3:", JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkClothingDetail();
