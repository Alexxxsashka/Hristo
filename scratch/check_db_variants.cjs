const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
});

async function checkProducts() {
  try {
    const r = await pool.query("SELECT id, name, variant_attributes FROM products WHERE id LIKE 'test-pants%'");
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkProducts();
