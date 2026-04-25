
const pg = require('pg');

const pool = new pg.Pool({
  connectionString: "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
});

async function checkProduct() {
  try {
    const res = await pool.query("SELECT id, name, variant_attributes, variants FROM products WHERE name LIKE 'Emerson G3 Combat Pants%'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkProduct();
