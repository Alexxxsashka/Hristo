import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function migrate() {
    try {
        console.log('Migrating site_settings table...');
        
        // Add missing columns to match SiteSettings interface in src/types.ts
        await pool.query(`
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "heroTitle" TEXT;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "announcement" TEXT;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "showAnnouncement" BOOLEAN DEFAULT false;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;
            
            -- Also ensure camelCase versions for existing snake_case columns if they are accessed that way
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
            ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
        `);

        // Migration: copy from snake_case to camelCase for existing rows if any
        await pool.query(`
            UPDATE site_settings 
            SET "contactEmail" = COALESCE("contactEmail", contact_email),
                "contactPhone" = COALESCE("contactPhone", contact_phone);
        `);

        // Ensure at least one row exists
        const exists = await pool.query('SELECT id FROM site_settings WHERE id = $1', ['default']);
        if (exists.rows.length === 0) {
            await pool.query('INSERT INTO site_settings (id) VALUES ($1)', ['default']);
            console.log('Inserted default row into site_settings.');
        }

        console.log('Migration completed successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
