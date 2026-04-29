const pkg = require('pg');
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
});

async function migrate() {
  try {
    console.log('Ensuring audit_logs columns exist...');
    
    // Add missing columns if they don't exist
    await pool.query(`
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_type TEXT;
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_id TEXT;
    `);
    
    // Ensure id is UUID with default
    await pool.query(`
      ALTER TABLE audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `);

    console.log('Migration completed successfully.');
    await pool.end();
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
}

migrate();
