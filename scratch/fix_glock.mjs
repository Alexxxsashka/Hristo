import pg from 'pg';

const connectionString = "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function fix() {
    try {
        console.log('--- FORCING 3D ON FOR GLOCK ---');
        const res = await pool.query(
            "UPDATE products SET has_3d = true WHERE name ILIKE '%glock%' RETURNING id, name, has_3d"
        );
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

fix();
