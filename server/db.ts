import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 5000,
});

pool.on('error', (err: Error) => {
  console.error('🔴 Database pool error (non-fatal):', err.message);
  console.error('📍 Error code:', (err as any).code || 'Unknown');
  console.error('💡 The application will continue running and attempt to reconnect on next query');
});

export const db = drizzle({ client: pool, schema });
