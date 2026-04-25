
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;

async function testUpdate() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  
  const settings = {
    heroSlides: [{ id: '1', title: 'Test' }],
    footerTags: ['tag1', 'tag2'],
    announcement: 'Hello World'
  };
  
  const id = 'default';

  try {
    const columnQuery = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'site_settings'
    `);
    
    const validColumns = new Map(columnQuery.rows.map(r => [r.column_name.toLowerCase(), r.data_type]));

    const keys = Object.keys(settings).filter(k => {
      const lowerK = k.toLowerCase();
      return k !== 'id' && !k.startsWith('_') && validColumns.has(lowerK);
    });

    console.log("Keys to update:", keys);

    const actualKeys = keys.map(k => {
      const lowerK = k.toLowerCase();
      const col = columnQuery.rows.find(r => r.column_name.toLowerCase() === lowerK);
      return col ? col.column_name : k;
    });

    const setClause = actualKeys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = keys.map(k => {
      const val = (settings as any)[k];
      const lowerK = k.toLowerCase();
      const dataType = validColumns.get(lowerK);
      
      if (dataType === 'ARRAY' && Array.isArray(val)) return val;
      return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
    });

    console.log("Values:", values);

    const query = `UPDATE site_settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
    console.log("Query:", query);
    
    await pool.query(query, [id, ...values]);
    console.log("✅ Update successful");
    
  } catch (e) {
    console.error("❌ Update failed:", e);
  } finally {
    await pool.end();
  }
}

testUpdate();
