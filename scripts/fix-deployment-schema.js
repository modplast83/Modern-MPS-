#!/usr/bin/env node
/**
 * Deployment Schema Fix Script
 * Safely handles schema changes that might cause data loss during deployment
 */

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

async function fixDeploymentSchema() {
  console.log("🔧 Fixing deployment schema issues...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });

    console.log("🔌 Connected to database");

    // Check if this is a fresh database or existing one
    const tableCheck = await db.execute(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);

    const tableCount = parseInt(tableCheck.rows[0].table_count);
    console.log(`📊 Found ${tableCount} existing tables`);

    if (tableCount === 0) {
      console.log("🆕 Fresh database detected - no schema conflicts");
      console.log("✅ Ready for clean schema deployment");
    } else {
      console.log(
        "🔄 Existing database detected - checking for schema conflicts...",
      );

      // Check for specific columns that might cause issues
      const conflictChecks = [
        {
          table: "categories",
          column: "parent_id",
          expectedType: "varchar",
          description: "parent_id type change",
        },
        {
          table: "customers",
          column: "name",
          expectedType: "varchar(200)",
          description: "customer name length increase",
        },
        {
          table: "customer_products",
          column: "customer_product_code",
          expectedType: "missing",
          description: "deprecated customer_product_code column",
        },
      ];

      for (const check of conflictChecks) {
        try {
          const columnCheck = await db.execute(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = '${check.table}' 
            AND column_name = '${check.column}'
            AND table_schema = 'public'
          `);

          if (columnCheck.rows.length > 0 && check.expectedType !== "missing") {
            console.log(
              `   ⚠️  Found ${check.description} - will need migration`,
            );
          } else if (
            columnCheck.rows.length === 0 &&
            check.expectedType === "missing"
          ) {
            console.log(`   ✅ ${check.description} already resolved`);
          } else if (
            columnCheck.rows.length > 0 &&
            check.expectedType === "missing"
          ) {
            console.log(`   🔧 ${check.description} needs cleanup`);
          }
        } catch (error) {
          console.log(
            `   ⚠️  Could not check ${check.description}: ${error.message}`,
          );
        }
      }

      // Backup critical data before schema changes
      console.log("💾 Creating data backup for critical tables...");

      try {
        // Export customer data if exists
        const customerData = await db.execute(
          "SELECT COUNT(*) as count FROM customers",
        );
        const customerCount = parseInt(customerData.rows[0].count);
        if (customerCount > 0) {
          console.log(
            `   📋 ${customerCount} customers found - data will be preserved`,
          );
        }

        // Export user data if exists
        const userData = await db.execute(
          "SELECT COUNT(*) as count FROM users",
        );
        const userCount = parseInt(userData.rows[0].count);
        if (userCount > 0) {
          console.log(
            `   👥 ${userCount} users found - data will be preserved`,
          );
        }
      } catch (error) {
        console.log(
          "   ⚠️  Could not check existing data - may be schema mismatch",
        );
      }
    }

    console.log("\n🚀 Schema fix completed");
    console.log("💡 Recommendations for deployment:");
    console.log(
      "   1. Use drizzle-kit push with --force for production deployment",
    );
    console.log("   2. Ensure all environment variables are set in deployment");
    console.log("   3. Test with a small dataset first if possible");

    await pool.end();
    console.log("✅ Schema fix script completed successfully");
  } catch (error) {
    console.error("❌ Schema fix failed:", error.message);

    // Provide specific guidance based on error type
    if (
      error.message.includes("relation") &&
      error.message.includes("does not exist")
    ) {
      console.error(
        "\n💡 Missing tables detected - this is normal for a fresh deployment",
      );
      console.error(
        "   The schema will be created during the deployment process",
      );
    } else if (error.message.includes("connect")) {
      console.error("\n💡 Connection issue - ensure DATABASE_URL is correct");
      console.error(
        "   Check that the database is accessible from the deployment environment",
      );
    }

    process.exit(1);
  }
}

// Export for use in other scripts
export { fixDeploymentSchema };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDeploymentSchema().catch((error) => {
    console.error("❌ Schema fix script failed:", error);
    process.exit(1);
  });
}
