import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function migrate() {
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Checking site_settings table...");
    
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY,
        site_name TEXT,
        site_description TEXT,
        logo_url TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        address TEXT,
        facebook_url TEXT,
        twitter_url TEXT,
        instagram_url TEXT,
        linkedin_url TEXT,
        hero_title TEXT,
        hero_subtitle TEXT,
        hero_image TEXT,
        about_title TEXT,
        about_content TEXT,
        about_image TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Adding new hero feature columns...");
    await pool.query(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "heroFeatureImage" TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "heroFeatureVideo" TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS "heroFeatureMediaType" TEXT DEFAULT 'image';
    `);

    console.log("✅ Migration successful");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
