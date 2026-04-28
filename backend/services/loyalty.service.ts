import { pool } from './db.service.js';

export const RANK_THRESHOLDS = [
  { rank: 'recruit', threshold: 0, discount: 0 },
  { rank: 'private', threshold: 500, discount: 3 },
  { rank: 'sergeant', threshold: 1500, discount: 5 },
  { rank: 'special_forces', threshold: 3000, discount: 10 },
  { rank: 'operator', threshold: 5000, discount: 15 },
  { rank: 'commander', threshold: 10000, discount: 20 }
];

export const recalculateUserPointsAndRank = async (userId: string) => {
  console.log(`🔄 Recalculating loyalty for user: ${userId}`);
  try {
    const ordersRes = await pool.query(
      "SELECT SUM(total) as spent FROM orders WHERE user_id = $1 AND status IN ('paid', 'processing', 'shipped', 'delivered')",
      [userId]
    );
    const totalSpent = parseFloat(ordersRes.rows[0]?.spent || 0);
    const points = Math.floor(totalSpent);

    let rank = 'recruit';
    let discount = 0;
    for (const r of RANK_THRESHOLDS) {
      if (points >= r.threshold) {
        rank = r.rank;
        discount = r.discount;
      }
    }

    const userRes = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) return;

    await pool.query(
      `UPDATE users SET points = $1, rank = $2, discount_level = $3 WHERE id = $4`,
      [points, rank, discount, userId]
    );
    console.log(`✅ Loyalty updated for ${userId}: ${points} pts, ${rank} rank`);
  } catch (err) {
    console.error(`❌ Loyalty recalculation failed for ${userId}:`, err);
  }
};
