#!/usr/bin/env node

/**
 * Password Hashing Script for Production Deployment
 *
 * This script identifies and hashes any plaintext passwords in the database
 * to ensure security compliance before production deployment.
 *
 * Usage:
 *   node scripts/hash-passwords.js
 *
 * Environment Variables:
 *   DATABASE_URL - Required: PostgreSQL connection string
 *   DRY_RUN - Optional: Set to 'true' to preview changes without applying them
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// Configuration
const SALT_ROUNDS = 12; // Strong salt rounds for production
const DRY_RUN = process.env.DRY_RUN === "true";

async function hashPasswords() {
  console.log("🔐 Password Hashing Script Started");
  console.log("===================================");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("🧪 DRY RUN MODE: No changes will be made to the database");
  }

  console.log("✅ DATABASE_URL is configured");

  try {
    // Create database connection
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });

    console.log("🔌 Connected to database");

    // Fetch all users using raw SQL to avoid schema dependencies
    console.log("📋 Fetching user accounts...");
    const usersResult = await db.execute(
      "SELECT id, username, password FROM users ORDER BY id",
    );
    const allUsers = usersResult.rows;
    console.log(`📊 Found ${allUsers.length} user accounts`);

    let plaintextPasswordsFound = 0;
    let passwordsHashed = 0;
    let usersWithNoPassword = 0;
    const hashedUsers = [];

    console.log("\n🔍 Analyzing password security...");

    for (const user of allUsers) {
      if (!user.password) {
        usersWithNoPassword++;
        console.warn(
          `⚠️  User ${user.id} (${user.username}) has no password set`,
        );
        continue;
      }

      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isHashedPassword =
        user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$");

      if (!isHashedPassword) {
        plaintextPasswordsFound++;
        console.error(
          `🚨 PLAINTEXT PASSWORD FOUND: User ${user.id} (${user.username})`,
        );

        if (!DRY_RUN) {
          try {
            // Hash the plaintext password
            const hashedPassword = await bcrypt.hash(
              user.password,
              SALT_ROUNDS,
            );

            // Update user with hashed password using raw SQL
            await db.execute("UPDATE users SET password = $1 WHERE id = $2", [
              hashedPassword,
              user.id,
            ]);

            passwordsHashed++;
            hashedUsers.push({
              id: user.id,
              username: user.username,
              originalLength: user.password.length,
              hashedLength: hashedPassword.length,
            });

            console.log(
              `✅ Hashed password for user ${user.id} (${user.username})`,
            );
          } catch (hashError) {
            console.error(
              `❌ Failed to hash password for user ${user.id}:`,
              hashError,
            );
          }
        } else {
          console.log(
            `   → Would hash password for user ${user.id} (${user.username})`,
          );
        }
      }
    }

    console.log("\n📊 PASSWORD SECURITY ANALYSIS COMPLETE");
    console.log("=====================================");
    console.log(`👥 Total users analyzed: ${allUsers.length}`);
    console.log(
      `🔓 Users with plaintext passwords: ${plaintextPasswordsFound}`,
    );
    console.log(`🔐 Passwords hashed in this run: ${passwordsHashed}`);
    console.log(`⚠️  Users with no password: ${usersWithNoPassword}`);
    console.log(
      `✅ Users with properly hashed passwords: ${allUsers.length - plaintextPasswordsFound - usersWithNoPassword}`,
    );

    if (passwordsHashed > 0 && !DRY_RUN) {
      console.log("\n🔐 PASSWORDS SUCCESSFULLY HASHED:");
      hashedUsers.forEach((user) => {
        console.log(
          `   ✅ User ${user.id} (${user.username}): ${user.originalLength} chars → ${user.hashedLength} chars`,
        );
      });
    }

    if (DRY_RUN && plaintextPasswordsFound > 0) {
      console.log("\n🧪 DRY RUN SUMMARY:");
      console.log(`   ${plaintextPasswordsFound} password(s) would be hashed`);
      console.log("   Run without DRY_RUN=true to apply changes");
    }

    if (plaintextPasswordsFound === 0) {
      console.log("\n🎉 EXCELLENT! All user passwords are properly hashed.");
      console.log("   Your database is secure for production deployment.");
    } else if (passwordsHashed > 0 && !DRY_RUN) {
      console.log("\n✅ PASSWORD HASHING COMPLETE");
      console.log(
        "   All plaintext passwords have been converted to secure hashes.",
      );
      console.log("   Your database is now secure for production deployment.");
      console.log("\n⚠️  NEXT STEPS:");
      console.log("   1. Remove SKIP_SECURITY_CHECK environment variable");
      console.log(
        "   2. Test application startup to verify security check passes",
      );
      console.log("   3. Proceed with production deployment");
    }

    // Close the connection
    await pool.end();
    console.log("\n🔚 Database connection closed");

    // Exit with appropriate code
    if (DRY_RUN || plaintextPasswordsFound === 0 || passwordsHashed > 0) {
      console.log("✅ Script completed successfully");
      process.exit(0);
    } else {
      console.log("❌ Script completed with issues");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Password hashing failed:", error);
    process.exit(1);
  }
}

// Run the script
hashPasswords().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
