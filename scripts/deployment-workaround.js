#!/usr/bin/env node
/**
 * Deployment Workaround Script
 * Alternative deployment strategy to bypass platform migration issues
 */

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function deploymentWorkaround() {
  console.log(
    "🔧 Running deployment workaround for platform migration issues...",
  );

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    return false;
  }

  try {
    // Create database connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      max: 1,
    });
    const db = drizzle({ client: pool });

    console.log("🔌 Testing database connection...");

    // Simple connection test
    await db.execute("SELECT NOW() as current_time");
    console.log("✅ Database connection successful");

    // Check current database state
    const tableCheck = await db.execute(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    const tableCount = parseInt(tableCheck.rows[0].table_count);
    console.log(`📋 Database has ${tableCount} existing tables`);

    if (tableCount === 0) {
      console.log(
        "🆕 Fresh database - schema will be initialized on first application request",
      );
    } else {
      console.log("✅ Existing database structure detected");
    }

    await pool.end();
    console.log("✅ Deployment workaround completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Deployment workaround failed:", error.message);

    if (error.message.includes("connect")) {
      console.error(
        "💡 Database connection issue - verify DATABASE_URL in deployment environment",
      );
    } else if (error.message.includes("timeout")) {
      console.error(
        "💡 Connection timeout - this may be a temporary platform issue",
      );
    }

    return false;
  }
}

// Export for use in deployment
export { deploymentWorkaround };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deploymentWorkaround().then((success) => {
    if (!success) {
      console.error("❌ Workaround failed");
      process.exit(1);
    }
    console.log("✅ Workaround completed");
  });
}
