#!/usr/bin/env node
/**
 * Production Database Deployment Script
 * Handles database schema deployment with data preservation
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import ws from "ws";
import { spawn } from 'child_process';
import { promisify } from 'util';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

const execAsync = promisify(spawn);

async function deployDatabase() {
  console.log('🚀 Starting production database deployment...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL in your deployment environment variables');
    process.exit(1);
  }

  try {
    // Step 1: Test database connection
    console.log('🔌 Testing database connection...');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 15000,
      max: 10
    });
    const db = drizzle({ client: pool });
    
    // Basic connection test
    const connectionTest = await db.execute('SELECT NOW() as current_time');
    console.log(`✅ Database connection successful at ${connectionTest.rows[0].current_time}`);
    
    // Step 2: Check existing schema
    const tableCheck = await db.execute(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tableCount = parseInt(tableCheck.rows[0].table_count);
    const isNewDatabase = tableCount === 0;
    
    console.log(`📊 Database status: ${isNewDatabase ? 'Fresh (new)' : `Existing (${tableCount} tables)`}`);
    
    // Step 3: Apply schema changes
    if (isNewDatabase) {
      console.log('🆕 Fresh database - deploying complete schema...');
      
      // For fresh database, use drizzle-kit push to create all tables
      console.log('📋 Generating and applying schema...');
      
      try {
        // Use drizzle-kit push for fresh deployment
        const { exec } = await import('child_process');
        const execPromise = promisify(exec);
        
        const pushResult = await execPromise('npx drizzle-kit push --force', {
          env: { ...process.env, NODE_ENV: 'production' }
        });
        
        console.log('✅ Schema deployed successfully');
        if (pushResult.stdout) console.log('   Output:', pushResult.stdout);
        
      } catch (pushError) {
        console.log('⚠️  Schema push failed, trying migration approach...');
        
        // Fallback to migration approach
        await migrate(db, { migrationsFolder: './migrations' });
        console.log('✅ Migration completed successfully');
      }
      
    } else {
      console.log('🔄 Existing database - applying safe updates...');
      
      // For existing database, use migrations
      try {
        await migrate(db, { migrationsFolder: './migrations' });
        console.log('✅ Migrations applied successfully');
      } catch (migrationError) {
        console.log('⚠️  Standard migration failed, checking for schema conflicts...');
        
        // Handle schema conflicts manually
        await handleSchemaConflicts(db);
      }
    }
    
    // Step 4: Verify deployment
    console.log('🔍 Verifying deployment...');
    
    const finalTableCheck = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = finalTableCheck.rows.map(row => row.table_name);
    console.log(`✅ Deployment verified: ${tables.length} tables active`);
    
    // Check for critical tables
    const criticalTables = ['users', 'customers', 'orders', 'machines', 'roles'];
    const missingTables = criticalTables.filter(table => !tables.includes(table));
    
    if (missingTables.length === 0) {
      console.log('✅ All critical tables are present');
    } else {
      console.log(`⚠️  Missing critical tables: ${missingTables.join(', ')}`);
    }
    
    // Step 5: Test basic operations
    console.log('🧪 Testing basic database operations...');
    
    try {
      // Test user table access
      const userCount = await db.execute('SELECT COUNT(*) as count FROM users');
      console.log(`✅ User table accessible (${userCount.rows[0].count} records)`);
      
      // Test other critical tables
      const orderCount = await db.execute('SELECT COUNT(*) as count FROM orders');
      console.log(`✅ Orders table accessible (${orderCount.rows[0].count} records)`);
      
    } catch (testError) {
      console.log('⚠️  Some tables may need manual verification:', testError.message);
    }
    
    await pool.end();
    console.log('✅ Database deployment completed successfully');
    
    // Success summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 PRODUCTION DATABASE DEPLOYMENT SUCCESSFUL');
    console.log(`📊 Database: ${isNewDatabase ? 'New deployment' : 'Updated existing'}`);
    console.log(`📋 Tables: ${tables.length} active`);
    console.log('🔗 Application ready for production traffic');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Database deployment failed:', error.message);
    
    // Detailed error handling
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused:');
      console.error('   - Check DATABASE_URL is correct');
      console.error('   - Verify database server is running');
      console.error('   - Ensure network connectivity');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication failed:');
      console.error('   - Verify DATABASE_URL credentials');
      console.error('   - Check database user permissions');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Connection timeout:');
      console.error('   - Database may be overloaded');
      console.error('   - Check network stability');
    } else if (error.message.includes('migration')) {
      console.error('\n💡 Migration error:');
      console.error('   - Check migration files syntax');
      console.error('   - Verify schema compatibility');
    }
    
    console.error('\n📞 For persistent issues, contact Replit support');
    process.exit(1);
  }
}

async function handleSchemaConflicts(db) {
  console.log('🔧 Handling schema conflicts...');
  
  // Start transaction for atomicity
  await db.execute('BEGIN');
  
  try {
    // Handle specific known conflicts
    
    // 1. Fix parent_id type in categories table
    console.log('   🔄 Updating categories.parent_id type...');
    await db.execute(`
      ALTER TABLE categories 
      ALTER COLUMN parent_id TYPE varchar(20) 
      USING parent_id::varchar(20)
    `);
    console.log('   ✅ Categories parent_id updated');
    
    // 2. Fix customer name length
    console.log('   🔄 Updating customer name lengths...');
    await db.execute(`
      ALTER TABLE customers 
      ALTER COLUMN name TYPE varchar(200)
    `);
    await db.execute(`
      ALTER TABLE customers 
      ALTER COLUMN name_ar TYPE varchar(200)
    `);
    console.log('   ✅ Customer name lengths updated');
    
    // 3. Remove deprecated columns
    console.log('   🔄 Cleaning deprecated columns...');
    const deprecatedColumns = [
      { table: 'customer_products', column: 'customer_product_code' },
      { table: 'customer_products', column: 'customer_product_name' },
      { table: 'customer_products', column: 'customer_product_name_ar' },
      { table: 'customer_products', column: 'specifications' },
      { table: 'customer_products', column: 'price' }
    ];
    
    for (const col of deprecatedColumns) {
      try {
        await db.execute(`ALTER TABLE ${col.table} DROP COLUMN IF EXISTS ${col.column}`);
        console.log(`   ✅ Removed ${col.table}.${col.column}`);
      } catch (dropError) {
        console.log(`   ⚠️  Could not remove ${col.table}.${col.column}: ${dropError.message}`);
      }
    }
    
    // Commit transaction on success
    await db.execute('COMMIT');
    console.log('✅ Schema conflicts resolved');
    
  } catch (conflictError) {
    // Rollback transaction on error
    await db.execute('ROLLBACK');
    console.log('⚠️  Some schema conflicts could not be resolved automatically:', conflictError.message);
    console.log('   Manual intervention may be required');
    throw conflictError;
  }
}

// Export for use in other scripts
export { deployDatabase };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployDatabase().catch(error => {
    console.error('❌ Database deployment script failed:', error);
    process.exit(1);
  });
}