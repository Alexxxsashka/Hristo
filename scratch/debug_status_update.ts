
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrder() {
  try {
    const res = await pool.query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5");
    console.log("Recent orders:");
    console.log(JSON.stringify(res.rows, null, 2));
    
    // Test update
    if (res.rows.length > 0) {
      const id = res.rows[0].id;
      console.log(`Testing update for order ${id}...`);
      try {
        await pool.query("UPDATE orders SET status='shipped' WHERE id = $1", [id]);
        console.log("Update SUCCESSFUL in direct DB test");
      } catch (e) {
        console.error("Update FAILED in direct DB test:", e);
      }
    }
  } catch (e) {
    console.error("Error checking orders:", e);
  } finally {
    await pool.end();
  }
}

checkOrder();
