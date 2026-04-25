import pg from 'pg';
const { Pool } = pg;

async function checkTestClothing() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(`
      SELECT id, name, variant_attributes, variants 
      FROM products 
      WHERE category_id IN ('clothing', 'uniforms', 'jackets', 'pants', 'boots', 'gloves', 'headwear')
      OR name ILIKE '%Emerson%' OR name ILIKE '%Invader%'
    `);
    console.log("Clothing products with variants:", res.rows.map(r => ({
      name: r.name,
      has_attr: !!r.variant_attributes,
      has_variants: !!r.variants && r.variants.length > 0
    })));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkTestClothing();
