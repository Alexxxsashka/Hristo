import { pool } from '../backend/services/db.service.js';

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
    `);
    console.log('Audit Logs Columns:');
    res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkSchema();
