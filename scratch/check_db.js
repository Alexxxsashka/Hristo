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
      WHERE table_name = 'site_settings'
    `);
        console.log("Columns in site_settings:", res.rows.map(r => r.column_name).join(', '));

        const allRows = await pool.query('SELECT * FROM site_settings');
        console.log(`\nTotal rows in site_settings: ${allRows.rows.length}`);
        allRows.rows.forEach((r, i) => {
            console.log(`Row ${i}: id=${r.id}, announcement="${r.announcement}", show="${r.show_announcement}", logo="${r.logo_url}"`);
        });

        if (allRows.rows.length > 0) {
            console.log("\nFull data for first row:");
            console.log(JSON.stringify(allRows.rows[0], null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkColumns();
