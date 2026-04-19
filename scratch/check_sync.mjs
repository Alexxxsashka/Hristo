import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
});

async function checkSync() {
  try {
    const result = await pool.query('SELECT id, name, image_url, images FROM products');
    console.log('--- PRODUCTS SYNC CHECK ---');
    result.rows.forEach(p => {
      console.log(`Product: ${p.name} (${p.id})`);
      console.log(`  image_url: ${p.image_url}`);
      console.log(`  images: ${JSON.stringify(p.images)}`);
      if (Array.isArray(p.images) && p.images.length > 0) {
        if (p.image_url !== p.images[0]) {
          console.warn(`  [MISMATCH] image_url does not match images[0]!`);
        }
      } else {
        console.warn(`  [EMPTY] images array is empty!`);
      }
      console.log('---------------------------');
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkSync();
