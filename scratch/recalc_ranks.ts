import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function recalculateUserPointsAndRank(userId: string) {
  if (!userId || userId === 'guest') return;
  try {
    // Ensure user exists
    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (userCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (id, email, username, role, rank, points) VALUES ($1, $2, $3, 'user', 'recruit', 0) ON CONFLICT DO NOTHING",
        [userId, `user_${userId}@placeholder.com`, `User_${userId.slice(-4)}`]
      );
    }

    const fulfilledStatuses = ['processing', 'shipped', 'delivered', 'paid'];
    const ordersRes = await pool.query(
      "SELECT SUM(total) as total_spent FROM orders WHERE user_id = $1 AND status = ANY($2)",
      [userId, fulfilledStatuses]
    );
    
    const points = Math.floor(Number(ordersRes.rows[0]?.total_spent || 0));
    
    const ranks = [
      { name: 'recruit', threshold: 0, discount: 0 },
      { name: 'private', threshold: 500, discount: 3 },
      { name: 'sergeant', threshold: 1500, discount: 5 },
      { name: 'special_forces', threshold: 3000, discount: 10 },
      { name: 'operator', threshold: 5000, discount: 15 },
      { name: 'commander', threshold: 10000, discount: 20 },
    ].reverse();

    const currentRank = ranks.find(r => points >= r.threshold) || ranks[ranks.length - 1];
    
    await pool.query(
      "UPDATE users SET points = $2, rank = $3, discount_level = $4 WHERE id = $1",
      [userId, points, currentRank.name, currentRank.discount]
    );
    console.log(`Updated User ${userId}: Points=${points}, Rank=${currentRank.name}`);
  } catch (err) {
    console.error("Failed for user", userId, err);
  }
}

async function main() {
  const usersRes = await pool.query("SELECT id FROM users");
  for (const u of usersRes.rows) {
    await recalculateUserPointsAndRank(u.id);
  }
  
  // also find IDs from orders that might not be in users table
  const orderUsersRes = await pool.query("SELECT DISTINCT user_id FROM orders");
  for (const u of orderUsersRes.rows) {
    await recalculateUserPointsAndRank(u.user_id);
  }

  await pool.end();
}

main();
