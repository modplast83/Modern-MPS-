-- Production Flow Schema Migration
-- Add new columns to existing tables and create new tables

-- Add new columns to production_orders table
ALTER TABLE production_orders 
ADD COLUMN IF NOT EXISTS requires_printing boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS in_production_at timestamp;

-- Add new columns to rolls table
ALTER TABLE rolls 
ADD COLUMN IF NOT EXISTS roll_seq integer,
ADD COLUMN IF NOT EXISTS qr_code_text text,
ADD COLUMN IF NOT EXISTS qr_png_base64 text,
ADD COLUMN IF NOT EXISTS weight_kg decimal(12,3),
ADD COLUMN IF NOT EXISTS cut_weight_total_kg decimal(12,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS waste_kg decimal(12,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS printed_at timestamp,
ADD COLUMN IF NOT EXISTS cut_completed_at timestamp,
ADD COLUMN IF NOT EXISTS performed_by integer REFERENCES users(id);

-- Migrate existing weight to weight_kg
UPDATE rolls SET weight_kg = weight WHERE weight_kg IS NULL AND weight IS NOT NULL;

-- Add stage column to replace current_stage
ALTER TABLE rolls ADD COLUMN IF NOT EXISTS stage varchar(20);
UPDATE rolls SET stage = CASE 
  WHEN current_stage = 'film' THEN 'film'
  WHEN current_stage = 'printing' THEN 'printing' 
  WHEN current_stage = 'cutting' THEN 'cutting'
  ELSE 'film'
END WHERE stage IS NULL;

-- Make required columns NOT NULL after data migration
ALTER TABLE rolls ALTER COLUMN roll_seq SET NOT NULL;
ALTER TABLE rolls ALTER COLUMN qr_code_text SET NOT NULL;
ALTER TABLE rolls ALTER COLUMN stage SET NOT NULL;
ALTER TABLE rolls ALTER COLUMN weight_kg SET NOT NULL;
ALTER TABLE rolls ALTER COLUMN cut_weight_total_kg SET NOT NULL;
ALTER TABLE rolls ALTER COLUMN waste_kg SET NOT NULL;

-- Create cuts table
CREATE TABLE IF NOT EXISTS cuts (
  id serial PRIMARY KEY,
  roll_id integer NOT NULL REFERENCES rolls(id) ON DELETE CASCADE,
  cut_weight_kg decimal(12,3) NOT NULL,
  pieces_count integer,
  performed_by integer REFERENCES users(id),
  created_at timestamp DEFAULT NOW()
);

-- Create warehouse_receipts table
CREATE TABLE IF NOT EXISTS warehouse_receipts (
  id serial PRIMARY KEY,
  job_order_id integer NOT NULL REFERENCES production_orders(id),
  cut_id integer REFERENCES cuts(id),
  received_weight_kg decimal(12,3) NOT NULL,
  received_by integer REFERENCES users(id),
  created_at timestamp DEFAULT NOW()
);

-- Create production_settings table
CREATE TABLE IF NOT EXISTS production_settings (
  id serial PRIMARY KEY,
  overrun_tolerance_percent decimal(5,2) NOT NULL DEFAULT 3,
  allow_last_roll_overrun boolean NOT NULL DEFAULT true,
  qr_prefix varchar(32) NOT NULL DEFAULT 'ROLL'
);

-- Insert default production settings
INSERT INTO production_settings (overrun_tolerance_percent, allow_last_roll_overrun, qr_prefix)
VALUES (3.00, true, 'ROLL')
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS rolls_stage_idx ON rolls(stage);
CREATE INDEX IF NOT EXISTS cuts_roll_idx ON cuts(roll_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS rolls_job_order_seq_idx ON rolls(job_order_id, roll_seq);