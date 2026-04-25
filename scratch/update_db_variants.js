import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function updateDb() {
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
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants_group_id text`);
        console.log("Added variants_group_id column to products");
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

updateDb();
