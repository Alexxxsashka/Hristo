import type { VercelRequest, VercelResponse } from "@vercel/node";

// NOTE: Do NOT call dotenv.config() here — on Vercel, env vars are already in process.env
// and dotenv can overwrite them or fail silently

let isConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug: log all available env var NAMES (not values) on first request
  if (!isConnected) {
    const allKeys = Object.keys(process.env).filter(k =>
      k.toLowerCase().includes('database') ||
      k.toLowerCase().includes('postgres') ||
      k.toLowerCase().includes('neon') ||
      k.toLowerCase().includes('pg') ||
      k.toLowerCase().includes('sql')
    );
    console.log('[API] DB-related env vars detected:', allKeys);
  }

  // Resolve connection string from any common naming convention
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.hrdatabase_DATABASE_URL ||
    process.env.hrdatabase_POSTGRES_URL ||
    process.env.hrdatabase_POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.PG_CONNECTION_STRING ||
    // Last resort: scan all env vars for anything that looks like a pg connection string
    Object.values(process.env).find(v => v?.startsWith('postgresql://') || v?.startsWith('postgres://'));

  if (!connectionString) {
    const availableKeys = Object.keys(process.env).filter(k =>
      k.toLowerCase().includes('database') ||
      k.toLowerCase().includes('postgres') ||
      k.toLowerCase().includes('neon')
    );
    console.error('[API] No DB connection string found. Checked env vars:', availableKeys);
    return res.status(500).json({
      error: 'Database connection string not configured on Vercel.',
      hint: 'Set DATABASE_URL or POSTGRES_URL in Vercel Environment Variables.',
      detectedDbEnvVars: availableKeys,
    });
  }

  // Inject the resolved connection string so db.service.ts can find it
  process.env.DATABASE_URL = connectionString;

  // Lazy-load app and db service AFTER env vars are confirmed available
  const { app } = await import("../backend/app.js");
  const { testConnection } = await import("../backend/services/db.service.js");

  // 1. Ensure DB connection and run migrations
  if (!isConnected) {
    try {
      await testConnection();
      isConnected = true;
      console.log('[API] DB connected and schema initialized.');
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[API] DB connection/migration failed:", message);
      return res.status(500).json({ error: `Internal Server Error (DB): ${message}` });
    }
  }

  // 2. Delegate to the Express app
  return app(req as any, res as any);
}
