-- Migration: Simplify Mixing System
-- Date: 2025-11-10
-- Description: Remove formula-based system and convert to direct batch recording

-- Step 1: Backup existing data (if needed)
-- Users can manually backup mixing_formulas and formula_ingredients if needed

-- Step 2: Drop foreign key constraint from mixing_batches
ALTER TABLE "mixing_batches" DROP CONSTRAINT IF EXISTS "mixing_batches_formula_id_mixing_formulas_id_fk";
ALTER TABLE "mixing_batches" DROP CONSTRAINT IF EXISTS "mixing_batches_roll_id_rolls_id_fk";

-- Step 3: Remove formula_id and roll_id columns from mixing_batches
ALTER TABLE "mixing_batches" DROP COLUMN IF EXISTS "formula_id";
ALTER TABLE "mixing_batches" DROP COLUMN IF EXISTS "roll_id";
ALTER TABLE "mixing_batches" DROP COLUMN IF EXISTS "started_at";
ALTER TABLE "mixing_batches" DROP COLUMN IF EXISTS "completed_at";

-- Step 4: Add screw_assignment column to mixing_batches
ALTER TABLE "mixing_batches" 
ADD COLUMN IF NOT EXISTS "screw_assignment" varchar(10) NOT NULL DEFAULT 'A';

-- Step 5: Add check constraint for screw_assignment
ALTER TABLE "mixing_batches"
ADD CONSTRAINT "screw_assignment_valid" 
CHECK ("screw_assignment" IN ('A', 'B'));

-- Step 6: Make production_order_id NOT NULL
ALTER TABLE "mixing_batches"
ALTER COLUMN "production_order_id" SET NOT NULL;

-- Step 7: Update batch_ingredients table
-- Remove planned_weight_kg and variance_kg columns
ALTER TABLE "batch_ingredients" DROP COLUMN IF EXISTS "planned_weight_kg";
ALTER TABLE "batch_ingredients" DROP COLUMN IF EXISTS "variance_kg";

-- Rename actual_weight_kg to just actual_weight_kg (it's now the only weight)
-- Add percentage column for auto-calculated percentages
ALTER TABLE "batch_ingredients"
ADD COLUMN IF NOT EXISTS "percentage" decimal(5,2);

-- Add check constraint for percentage
ALTER TABLE "batch_ingredients"
ADD CONSTRAINT "percentage_valid" 
CHECK ("percentage" IS NULL OR ("percentage" > 0 AND "percentage" <= 100));

-- Make actual_weight_kg NOT NULL
ALTER TABLE "batch_ingredients"
ALTER COLUMN "actual_weight_kg" SET NOT NULL;

-- Step 8: Drop old formula tables
DROP TABLE IF EXISTS "formula_ingredients" CASCADE;
DROP TABLE IF EXISTS "mixing_formulas" CASCADE;

-- Step 9: Drop old mixing_recipes table (legacy system)
DROP TABLE IF EXISTS "mixing_recipes" CASCADE;

-- Migration complete
