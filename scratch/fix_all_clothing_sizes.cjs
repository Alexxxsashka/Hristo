
const pg = require('pg');

const pool = new pg.Pool({
  connectionString: "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
});

async function updateClothingSizes() {
  try {
    console.log('Fetching clothing products...');
    const res = await pool.query("SELECT id, name, variant_attributes FROM products WHERE type = 'gear' OR category_id = 'clothing' OR category_id = 'uniforms'");
    
    for (const row of res.rows) {
      let attrs = row.variant_attributes;
      if (typeof attrs === 'string') {
        try { attrs = JSON.parse(attrs); } catch (e) { attrs = []; }
      }
      if (!Array.isArray(attrs)) attrs = [];

      // Check if Size attribute exists
      const hasSize = attrs.some(a => a.name === 'Size');
      if (!hasSize) {
        console.log(`Adding sizes to ${row.name}...`);
        attrs.push({
          name: 'Size',
          options: ['S', 'M', 'L', 'XL', 'XXL']
        });

        await pool.query(
          "UPDATE products SET variant_attributes = $1 WHERE id = $2",
          [JSON.stringify(attrs), row.id]
        );
      } else {
        console.log(`${row.name} already has sizes.`);
      }
    }

    console.log('Update complete!');
  } catch (err) {
    console.error('Update failed:', err);
  } finally {
    await pool.end();
  }
}

updateClothingSizes();
