const pkg = require('pg');
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_sztAkW5QeI3g@ep-old-mountain-anc6z8ky-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
    `);
    console.log('Audit Logs Columns:');
    res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    await pool.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkSchema();
