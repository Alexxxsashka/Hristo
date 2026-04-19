import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require',
});

async function syncDatabase() {
  try {
    const result = await pool.query('SELECT id, name, images, image_url FROM products');
    console.log(`Checking ${result.rows.length} products...`);
    
    for (const p of result.rows) {
      if (Array.isArray(p.images) && p.images.length > 0) {
        const primaryImage = p.images[0];
        if (p.image_url !== primaryImage) {
          console.log(`Syncing ${p.name}: image_url -> ${primaryImage}`);
          await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [primaryImage, p.id]);
        }
      } else if (p.image_url && (!p.images || p.images.length === 0)) {
        console.log(`Initializing images gallery for ${p.name} with image_url`);
        await pool.query('UPDATE products SET images = $1 WHERE id = $2', [JSON.stringify([p.image_url]), p.id]);
      }
    }
    console.log('Database sync complete!');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

syncDatabase();
