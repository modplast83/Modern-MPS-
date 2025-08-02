#!/usr/bin/env node
/**
 * Production Startup Script
 * Runs migrations before starting the server
 */

import { runMigrations } from './migrate.js';

async function startProduction() {
  console.log('🚀 Starting production deployment...');
  
  try {
    // First, run database migrations
    await runMigrations();
    
    // Then start the server
    console.log('🌟 Starting server...');
    const { default: app } = await import('../dist/index.js');
    
  } catch (error) {
    console.error('❌ Production startup failed:', error);
    process.exit(1);
  }
}

startProduction();