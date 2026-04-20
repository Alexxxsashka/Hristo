
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function recalculateUserPointsAndRank(pool: any, userId: string) {
  if (!userId || userId === "guest") return;
  console.log(`🔄 [Loyalty] Recalculating for user: ${userId}`);
  try {
    // 1. Sum total of all paid/delivered/shipped/processing orders
    const ordersRes = await pool.query(
      "SELECT SUM(total) as spent FROM orders WHERE user_id = $1 AND status IN ('paid', 'processing', 'shipped', 'delivered')",
      [userId]
    );
    const totalSpent = parseFloat(ordersRes.rows[0]?.spent || 0);
    const points = Math.floor(totalSpent); // 1 EUR = 1 PT

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

    // 2. Ensure user exists and update
    const userRes = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (id, role, points, rank, discount_level, username) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, 'user', points, rank, discount, `User_${userId.slice(-4)}`]
      );
    } else {
      await pool.query(
        "UPDATE users SET points = $1, rank = $2, discount_level = $3 WHERE id = $4",
        [points, rank, discount, userId]
      );
    }

    console.log(`✅ [Loyalty] Success for ${userId}: ${points} pts, rank: ${rank}`);
    return { points, rank, discount };
  } catch (err) {
    console.error("❌ [Loyalty] Recalculation failed:", err);
    throw err;
  }
}

recalculateUserPointsAndRank(pool, 'TODtGP0LatOomUJOVocghu9pt3A2')
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
