import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function migrate() {
  try {
    console.log("Starting migration for site_settings...");

    // Add new columns to site_settings
    await pool.query(`
      ALTER TABLE site_settings 
      ADD COLUMN IF NOT EXISTS "heroSlides" JSONB,
      ADD COLUMN IF NOT EXISTS "promoBanners" JSONB,
      ADD COLUMN IF NOT EXISTS "featuredCategoriesList" JSONB,
      ADD COLUMN IF NOT EXISTS "announcementLink" TEXT,
      ADD COLUMN IF NOT EXISTS "aboutUsTitle" TEXT,
      ADD COLUMN IF NOT EXISTS "aboutUsText" TEXT,
      ADD COLUMN IF NOT EXISTS "aboutUsImage" TEXT,
      ADD COLUMN IF NOT EXISTS "aboutUsLink" TEXT,
      ADD COLUMN IF NOT EXISTS "footerTags" TEXT[],
      ADD COLUMN IF NOT EXISTS "footerDescription" TEXT;
    `);

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
