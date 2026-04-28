import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../backend/app.js";
import { testConnection } from "../backend/services/db.service.js";

// Vercel serverless function doesn't need to call .listen()
// It just needs to export the handler or the app.

let isConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Ensure DB connection
  if (!isConnected) {
    try {
      await testConnection();
      isConnected = true;
    } catch (error) {
      console.error("DB connection failed in Vercel handler:", error);
      return res.status(500).json({ error: "Internal Server Error (DB)" });
    }
  }

  // 2. Delegate to the Express app
  return app(req as any, res as any);
}
