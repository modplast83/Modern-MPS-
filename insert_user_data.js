import fs from 'fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Set up database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function insertUserData() {
  const client = await pool.connect();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    // Clear existing data (handle foreign keys by deleting in correct order)
    console.log('Clearing existing data...');
    await client.query('DELETE FROM waste');
    await client.query('DELETE FROM rolls');
    await client.query('DELETE FROM production_orders'); 
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM warehouse_transactions');
    await client.query('DELETE FROM customer_products');
    await client.query('DELETE FROM items');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM customers');
    
    // Load data from JSON files
    const customers = JSON.parse(fs.readFileSync('./attached_assets/customers_1754097341241.json', 'utf8'));
    const categories = JSON.parse(fs.readFileSync('./attached_assets/categories_1754097341243.json', 'utf8'));
    const items = JSON.parse(fs.readFileSync('./attached_assets/items_1754097341243.json', 'utf8'));
    const customerProducts = JSON.parse(fs.readFileSync('./attached_assets/customer_products_1754097341242.json', 'utf8'));
    
    // Insert categories first
    console.log('Inserting categories...');
    for (const category of categories) {
      await client.query(
        'INSERT INTO categories (id, name, code, name_ar, parent_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [category.id, category.name, category.code, category.name_ar, category.parent_id || null]
      );
    }
    
    // Insert customers
    console.log('Inserting customers...');
    for (const customer of customers) {
      await client.query(
        'INSERT INTO customers (id, name, code, name_ar, user_id, plate_drawer_code) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
        [customer.id, customer.name, customer.code, customer.name_ar, customer.user_id, customer.plate_drawer_code === 'null' ? null : customer.plate_drawer_code]
      );
    }
    
    // Insert items
    console.log('Inserting items...');
    for (const item of items) {
      await client.query(
        'INSERT INTO items (id, category_id, name, full_name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [item.id, item.category_id, item.name, item.full_name]
      );
    }
    
    // Insert customer products
    console.log('Inserting customer products...');
    for (const cp of customerProducts) {
      await client.query(`
        INSERT INTO customer_products (
          id, customer_id, category_id, item_id, size_caption, width, left_f, right_f,
          thickness, thickness_one, printing_cylinder, length_cm, cutting_length_cm,
          raw_material, master_batch_id, printed, cutting_unit, unit_weight_kg,
          packing, punching, cover, volum, knife, notes, unit_qty, package_kg,
          cliche_front_design, cliche_back_design
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        ) ON CONFLICT (id) DO NOTHING
      `, [
        cp.id, cp.customer_id, cp.category_id, cp.item_id, cp.size_caption,
        cp.width, cp.left_f, cp.right_f, cp.thickness, cp.thickness_one,
        cp.printing_cylinder, cp.length_cm, cp.cutting_length_cm, cp.raw_material,
        cp.master_batch_id, cp.printed, cp.cutting_unit, cp.unit_weight_kg,
        cp.packing, cp.punching, cp.cover, cp.volum, cp.knife, cp.notes,
        cp.unit_qty, cp.package_kg, cp.cliche_front_design, cp.cliche_back_design
      ]);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ Data insertion completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error inserting data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the insertion
insertUserData().catch(console.error);