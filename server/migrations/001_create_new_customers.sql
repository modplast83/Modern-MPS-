-- ===============================================
-- Migration: Create new_customers table
-- Description: جدول العملاء الجديد لتصفية وتحديث البيانات
-- Date: 2025-11-08
-- ===============================================

CREATE TABLE IF NOT EXISTS new_customers (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  code VARCHAR(20),
  user_id VARCHAR(10),
  plate_drawer_code VARCHAR(20),
  city VARCHAR(50),
  address TEXT,
  tax_number VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  sales_rep_id INTEGER REFERENCES users(id),
  
  -- حقول محسّنة للإدارة والتتبع
  status VARCHAR(20) DEFAULT 'active',
  is_verified BOOLEAN DEFAULT FALSE,
  credit_limit DECIMAL(10, 2),
  
  -- حقول الهجرة من الجدول القديم
  migrated_from_id VARCHAR(20),
  migration_status VARCHAR(30) DEFAULT 'pending',
  migrated_at TIMESTAMP,
  
  -- بيانات إضافية مرنة
  metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_new_customers_name ON new_customers(name);
CREATE INDEX IF NOT EXISTS idx_new_customers_name_ar ON new_customers(name_ar);
CREATE INDEX IF NOT EXISTS idx_new_customers_phone ON new_customers(phone);
CREATE INDEX IF NOT EXISTS idx_new_customers_city ON new_customers(city);
CREATE INDEX IF NOT EXISTS idx_new_customers_status ON new_customers(status);
CREATE INDEX IF NOT EXISTS idx_new_customers_migration_status ON new_customers(migration_status);
CREATE INDEX IF NOT EXISTS idx_new_customers_migrated_from_id ON new_customers(migrated_from_id);

-- Add comment to table
COMMENT ON TABLE new_customers IS 'جدول العملاء المحدّث مع حقول محسّنة للإدارة والتتبع';
