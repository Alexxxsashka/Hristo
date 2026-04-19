import pg from 'pg';

const connectionString = "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function check() {
    try {
        const res = await pool.query("SELECT id, name, slug, image_url, model_3d_url, has_3d FROM products WHERE name ILIKE '%glock%'");
        console.log('--- PRODUCTS MATCHING GLOCK ---');
        console.log(JSON.stringify(res.rows, null, 2));
        
        const allRes = await pool.query("SELECT COUNT(*) FROM products");
        console.log(`\nTotal products: ${allRes.rows[0].count}`);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
