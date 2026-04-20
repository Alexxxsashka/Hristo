import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const userId = "TODtGP0LatOomUJOVocghu9pt3A2";
  console.log(`🔄 Force recalculating for ${userId}`);

  // Sum total of all paid/delivered/shipped/processing orders
  const ordersRes = await pool.query(
    "SELECT SUM(total) as spent FROM orders WHERE user_id = $1",
    [userId]
  );
  const totalSpent = parseFloat(ordersRes.rows[0]?.spent || 0);
  console.log(`Total spent: €${totalSpent}`);
  
  const points = Math.floor(totalSpent);

  const RANK_THRESHOLDS = [
    { rank: 'recruit', threshold: 0, discount: 0 },
    { rank: 'private', threshold: 500, discount: 3 },
    { rank: 'sergeant', threshold: 1500, discount: 5 },
    { rank: 'special_forces', threshold: 3000, discount: 10 },
    { rank: 'operator', threshold: 5000, discount: 15 },
    { rank: 'commander', threshold: 10000, discount: 20 }
  ];

  let rank = 'recruit';
  let discount = 0;
  for (const r of RANK_THRESHOLDS) {
    if (points >= r.threshold) {
      rank = r.rank;
      discount = r.discount;
    }
  }

  // Ensure user exists first
  await pool.query(
    "INSERT INTO users (id, email, username, role) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
    [userId, "guardsowh@gmail.com", "GUARDSOWH", "user"]
  );

  await pool.query(
    "UPDATE users SET points = $1, rank = $2, discount_level = $3 WHERE id = $4",
    [points, rank, discount, userId]
  );

  console.log(`✅ Success: ${points} pts, rank: ${rank}, discount: ${discount}%`);
  await pool.end();
}

main();
