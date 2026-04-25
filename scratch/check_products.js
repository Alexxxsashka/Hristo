import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function checkColumns() {
    let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        try {
            const envPath = path.resolve('.env');
            if (fs.existsSync(envPath)) {
                const env = fs.readFileSync(envPath, 'utf8');
                const match = env.match(/DATABASE_URL=["']?(.+?)["']?(\s|$)/) || env.match(/POSTGRES_URL=["']?(.+?)["']?(\s|$)/);
                if (match) connectionString = match[1];
            }
        } catch (e) { }
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
        console.log("Columns in products:", res.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkColumns();
