import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../backend/app.js";
import { testConnection } from "../backend/services/db.service.js";

// Vercel serverless function doesn't need to call .listen()
// It just needs to export the handler or the app.

let isConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.hrdatabase_DATABASE_URL ||
    process.env.hrdatabase_POSTGRES_URL;

  if (!connectionString) {
    console.error('Missing Neon database connection string. Set DATABASE_URL or POSTGRES_URL.');
    return res.status(500).json({ error: 'Missing DATABASE_URL or POSTGRES_URL env var for Neon DB.' });
  }

  // 1. Ensure DB connection and run migrations
  if (!isConnected) {
    try {
      await testConnection(); // This now calls runMigrations internally
      isConnected = true;
    } catch (error) {
      console.error("DB connection/migration failed in Vercel handler:", error);
      return res.status(500).json({ error: "Internal Server Error (DB/Migration)" });
    }
  }

  // 2. Delegate to the Express app
  return app(req as any, res as any);
}
