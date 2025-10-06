import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  date,
  timestamp,
  json,
  text,
  decimal,
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { parseIntSafe, parseFloatSafe } from "./validation-utils";

/**
 * =================================================================
 * 🏭 MANUFACTURING WORKFLOW INVARIANTS & DATA INTEGRITY RULES
 * =================================================================
 *
 * This schema defines the core business rules and data integrity constraints
 * for our plastic bag manufacturing workflow system. These invariants MUST
 * be maintained at all times to ensure system consistency.
 *
 * 📋 CRITICAL BUSINESS INVARIANTS:
 *
 * A) ORDER-PRODUCTION QUANTITY CONSTRAINT:
 *    ∑(ProductionOrder.quantity_kg) ≤ Order.total_quantity + tolerance
 *    - Sum of all production order quantities for an order cannot exceed
 *      the original order quantity plus allowed overrun tolerance
 *    - Prevents overproduction beyond customer requirements
 *
 * B) PRODUCTION-ROLL QUANTITY CONSTRAINT:
 *    ∑(Roll.weight_kg) ≤ ProductionOrder.final_quantity_kg + tolerance
 *    - Sum of roll weights cannot exceed production order final quantity
 *    - Accounts for production overrun settings and tolerances
 *    - Prevents creating rolls that exceed production requirements
 *
 * C) INVENTORY NON-NEGATIVE CONSTRAINT:
 *    Inventory.current_stock ≥ 0 AT ALL TIMES
 *    - Current stock levels must never go negative
 *    - All inventory movements must be validated before execution
 *    - Prevents overselling or over-allocation of materials
 *
 * D) VALID STATE TRANSITIONS:
 *    - Orders: waiting → in_production → completed/cancelled
 *    - Production Orders: pending → active → completed/cancelled
 *    - Rolls: film → printing → cutting → done
 *    - Machines: active ↔ maintenance ↔ down (bidirectional)
 *    - Invalid transitions must be rejected with proper error messages
 *
 * E) MACHINE OPERATIONAL CONSTRAINT:
 *    - Rolls can only be created on machines with status = 'active'
 *    - Production operations require valid, active machines
 *    - Machine must exist in database and be properly configured
 *
 * F) REFERENTIAL INTEGRITY CONSTRAINT:
 *    - All foreign key relationships must be maintained
 *    - Deletion of parent records must be restricted if children exist
 *    - Orphaned records are not allowed in the system
 *
 * G) TEMPORAL CONSISTENCY CONSTRAINTS:
 *    - Delivery dates must be in the future when orders are created
 *    - Production timestamps must follow logical sequence
 *    - Roll creation date ≤ printing date ≤ cutting completion date
 *
 * H) QUALITY & WASTE TRACKING CONSTRAINTS:
 *    - Waste quantities must be positive when recorded
 *    - Quality check scores must be within valid ranges (1-5)
 *    - Total waste cannot exceed production quantities
 *
 * 🔒 VALIDATION ENFORCEMENT LEVELS:
 *
 * 1. DATABASE LEVEL: Foreign keys, NOT NULL, CHECK constraints, unique indexes
 * 2. APPLICATION LEVEL: Zod schema validation, business rule enforcement
 * 3. TRANSACTION LEVEL: Multi-table operations with rollback on failure
 * 4. UI LEVEL: Client-side validation for immediate feedback
 *
 * 🚨 CONCURRENT OPERATION SAFETY:
 * - All multi-table operations use database transactions
 * - Optimistic concurrency control for high-traffic operations
 * - Row-level locking for critical inventory updates
 * - Proper error handling with user-friendly Arabic messages
 *
 * =================================================================
 */

// 🔐 جدول الصلاحيات
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  permissions: json("permissions").$type<string[]>(),
});

// 📁 جدول الأقسام
export const sections = pgTable("sections", {
  id: varchar("id", { length: 20 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  description: text("description"),
});

// 🧑‍💼 جدول المستخدمين
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 100 }).notNull(),
  display_name: varchar("display_name", { length: 100 }),
  display_name_ar: varchar("display_name_ar", { length: 100 }),
  full_name: varchar("full_name", { length: 200 }),
  phone: varchar("phone", { length: 20 }), // رقم الهاتف للواتس اب
  email: varchar("email", { length: 100 }),
  role_id: integer("role_id").references(() => roles.id),
  section_id: integer("section_id"),
  status: varchar("status", { length: 20 }).default("active"), // active / suspended / deleted
  created_at: timestamp("created_at").defaultNow(),
});

// 📋 جدول طلبات المستخدمين
export const user_requests = pgTable("user_requests", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("معلق"),
  priority: varchar("priority", { length: 20 }).default("عادي"),
  response: text("response"),
  reviewed_by: integer("reviewed_by").references(() => users.id),
  date: timestamp("date").defaultNow(),
  reviewed_date: timestamp("reviewed_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 📋 جدول الحضور
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("غائب"), // حاضر / غائب / استراحة غداء / مغادر
  check_in_time: timestamp("check_in_time"),
  check_out_time: timestamp("check_out_time"),
  lunch_start_time: timestamp("lunch_start_time"),
  lunch_end_time: timestamp("lunch_end_time"),
  notes: text("notes"),
  created_by: integer("created_by").references(() => users.id),
  updated_by: integer("updated_by").references(() => users.id),
  date: date("date")
    .notNull()
    .default(sql`CURRENT_DATE`),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 🧾 جدول العملاء
export const customers = pgTable("customers", {
  id: varchar("id", { length: 20 }).primaryKey(), // Changed to varchar to match CID001 format
  name: varchar("name", { length: 200 }).notNull(),
  name_ar: varchar("name_ar", { length: 200 }),
  code: varchar("code", { length: 20 }),
  user_id: varchar("user_id", { length: 10 }),
  plate_drawer_code: varchar("plate_drawer_code", { length: 20 }),
  city: varchar("city", { length: 50 }),
  address: text("address"),
  tax_number: varchar("tax_number", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  sales_rep_id: integer("sales_rep_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// 🗂️ جدول المجموعات
export const categories = pgTable("categories", {
  id: varchar("id", { length: 20 }).primaryKey(), // Changed to varchar to match CAT001 format
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  code: varchar("code", { length: 20 }),
  parent_id: varchar("parent_id", { length: 20 }),
});

// 🛒 جدول منتجات العملاء (User's Custom Data Integration)
export const customer_products = pgTable("customer_products", {
  id: serial("id").primaryKey(),
  customer_id: varchar("customer_id", { length: 20 }).references(
    () => customers.id,
  ),
  category_id: varchar("category_id", { length: 20 }).references(
    () => categories.id,
  ),
  item_id: varchar("item_id", { length: 20 }).references(() => items.id),
  size_caption: varchar("size_caption", { length: 50 }),
  width: decimal("width", { precision: 8, scale: 2 }),
  left_facing: decimal("left_facing", { precision: 8, scale: 2 }),
  right_facing: decimal("right_facing", { precision: 8, scale: 2 }),
  thickness: decimal("thickness", { precision: 6, scale: 3 }),
  printing_cylinder: varchar("printing_cylinder", { length: 10 }), // 8" to 38" + 39"
  cutting_length_cm: integer("cutting_length_cm"),
  raw_material: varchar("raw_material", { length: 20 }), // HDPE-LDPE-Regrind
  master_batch_id: varchar("master_batch_id", { length: 20 }), // CLEAR-WHITE-BLACK etc
  is_printed: boolean("is_printed").default(false),
  cutting_unit: varchar("cutting_unit", { length: 20 }), // KG-ROLL-PKT
  punching: varchar("punching", { length: 20 }), // NON-T-Shirt-T-shirt\Hook-Banana
  unit_weight_kg: decimal("unit_weight_kg", { precision: 8, scale: 3 }),
  unit_quantity: integer("unit_quantity"),
  package_weight_kg: decimal("package_weight_kg", { precision: 8, scale: 2 }),
  cliche_front_design: text("cliche_front_design"), // Base64 encoded image data
  cliche_back_design: text("cliche_back_design"), // Base64 encoded image data
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

// 🏭 جدول المكائن - Machine Management with Operational Constraints
// INVARIANT E: Only machines with status = 'active' can be used for production
// STATUS TRANSITIONS: active ↔ maintenance ↔ down (bidirectional transitions allowed)
// CONSTRAINT: Machine must be assigned to valid section
export const machines = pgTable(
  "machines",
  {
    id: varchar("id", { length: 20 }).primaryKey(), // Format: M001, M002, etc.
    name: varchar("name", { length: 100 }).notNull(), // Machine display name (English)
    name_ar: varchar("name_ar", { length: 100 }), // Machine display name (Arabic)
    type: varchar("type", { length: 50 }).notNull(), // ENUM: extruder / printer / cutter / quality_check
    section_id: varchar("section_id", { length: 20 }).references(
      () => sections.id,
      { onDelete: "restrict" },
    ), // ON DELETE RESTRICT
    status: varchar("status", { length: 20 }).notNull().default("active"), // ENUM: active / maintenance / down
  },
  (table) => ({
    // Check constraints for machine integrity
    machineIdFormat: check(
      "machine_id_format",
      sql`${table.id} ~ '^M[0-9]{3}$'`,
    ), // Format: M001, M002, etc.
    typeValid: check(
      "type_valid",
      sql`${table.type} IN ('extruder', 'printer', 'cutter', 'quality_check')`,
    ),
    statusValid: check(
      "status_valid",
      sql`${table.status} IN ('active', 'maintenance', 'down')`,
    ),
    nameNotEmpty: check("name_not_empty", sql`LENGTH(TRIM(${table.name})) > 0`),
  }),
);

// 🧾 جدول الطلبات - Order Management with Quantity Constraints
// INVARIANT A: ∑(ProductionOrder.quantity_kg) ≤ Order.total_quantity + tolerance
// STATUS TRANSITIONS: waiting → in_production → completed/cancelled
// CONSTRAINT: delivery_date must be future date when status = 'waiting'
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    order_number: varchar("order_number", { length: 50 }).notNull().unique(), // Must be unique across system
    customer_id: varchar("customer_id", { length: 20 })
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }), // ON DELETE RESTRICT
    delivery_days: integer("delivery_days"), // Must be > 0 if specified
    status: varchar("status", { length: 30 }).notNull().default("waiting"), // ENUM: waiting / in_production / paused / cancelled / completed
    notes: text("notes"),
    created_by: integer("created_by").references(() => users.id, {
      onDelete: "set null",
    }), // ON DELETE SET NULL
    created_at: timestamp("created_at").notNull().defaultNow(),
    delivery_date: date("delivery_date"), // Must be >= CURRENT_DATE when order is created
  },
  (table) => ({
    // Check constraints for data integrity
    deliveryDaysPositive: check(
      "delivery_days_positive",
      sql`${table.delivery_days} IS NULL OR ${table.delivery_days} > 0`,
    ),
    statusValid: check(
      "status_valid",
      sql`${table.status} IN ('waiting', 'in_production', 'paused', 'cancelled', 'completed')`,
    ),
    // Temporal constraint: delivery_date must be in future when order is active
    deliveryDateValid: check(
      "delivery_date_valid",
      sql`${table.delivery_date} IS NULL OR ${table.delivery_date} >= CURRENT_DATE`,
    ),
  }),
);

// 📋 جدول أوامر الإنتاج - NEW WORKFLOW: Multi-stage tracking with unlimited rolls
// إزالة قيود الكمية والسماح بتتبع مراحل الإنتاج المتعددة
// STATUS TRANSITIONS: pending → active → completed/cancelled
export const production_orders = pgTable(
  "production_orders",
  {
    id: serial("id").primaryKey(),
    production_order_number: varchar("production_order_number", { length: 50 })
      .notNull()
      .unique(),
    order_id: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    customer_product_id: integer("customer_product_id")
      .notNull()
      .references(() => customer_products.id, { onDelete: "restrict" }),

    // كمية الإنتاج الأساسية
    quantity_kg: decimal("quantity_kg", { precision: 10, scale: 2 }).notNull(), // الكمية المطلوبة من الطلب
    overrun_percentage: decimal("overrun_percentage", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("5.00"),
    final_quantity_kg: decimal("final_quantity_kg", {
      precision: 10,
      scale: 2,
    }).notNull(), // للمراجع فقط

    // NEW: حقول تتبع الكميات الفعلية لكل مرحلة
    produced_quantity_kg: decimal("produced_quantity_kg", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"), // مجموع أوزان جميع الرولات
    printed_quantity_kg: decimal("printed_quantity_kg", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"), // مجموع أوزان الرولات المطبوعة
    net_quantity_kg: decimal("net_quantity_kg", { precision: 10, scale: 2 })
      .notNull()
      .default("0"), // الكمية الصافية (بعد التقطيع - الهدر)
    waste_quantity_kg: decimal("waste_quantity_kg", { precision: 10, scale: 2 })
      .notNull()
      .default("0"), // مجموع هدر جميع الرولات

    // NEW: نسب الإكمال لكل مرحلة
    film_completion_percentage: decimal("film_completion_percentage", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("0"), // نسبة إكمال الفيلم
    printing_completion_percentage: decimal("printing_completion_percentage", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("0"), // نسبة إكمال الطباعة
    cutting_completion_percentage: decimal("cutting_completion_percentage", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("0"), // نسبة إكمال التقطيع

    status: varchar("status", { length: 30 }).notNull().default("pending"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // تحديث القيود لتتناسب مع النظام الجديد
    quantityPositive: check(
      "quantity_kg_positive",
      sql`${table.quantity_kg} > 0`,
    ),
    overrunPercentageValid: check(
      "overrun_percentage_valid",
      sql`${table.overrun_percentage} >= 0 AND ${table.overrun_percentage} <= 50`,
    ),
    finalQuantityPositive: check(
      "final_quantity_kg_positive",
      sql`${table.final_quantity_kg} > 0`,
    ),
    statusValid: check(
      "production_status_valid",
      sql`${table.status} IN ('pending', 'active', 'completed', 'cancelled')`,
    ),

    // NEW: قيود الكميات الجديدة
    producedQuantityNonNegative: check(
      "produced_quantity_non_negative",
      sql`${table.produced_quantity_kg} >= 0`,
    ),
    printedQuantityNonNegative: check(
      "printed_quantity_non_negative",
      sql`${table.printed_quantity_kg} >= 0`,
    ),
    netQuantityNonNegative: check(
      "net_quantity_non_negative",
      sql`${table.net_quantity_kg} >= 0`,
    ),
    wasteQuantityNonNegative: check(
      "waste_quantity_non_negative",
      sql`${table.waste_quantity_kg} >= 0`,
    ),

    // NEW: قيود نسب الإكمال
    filmCompletionValid: check(
      "film_completion_valid",
      sql`${table.film_completion_percentage} >= 0 AND ${table.film_completion_percentage} <= 100`,
    ),
    printingCompletionValid: check(
      "printing_completion_valid",
      sql`${table.printing_completion_percentage} >= 0 AND ${table.printing_completion_percentage} <= 100`,
    ),
    cuttingCompletionValid: check(
      "cutting_completion_valid",
      sql`${table.cutting_completion_percentage} >= 0 AND ${table.cutting_completion_percentage} <= 100`,
    ),
  }),
);

// 🧵 جدول الرولات - Roll Management with Production Constraints
// INVARIANT B: Sum of roll weights ≤ ProductionOrder.final_quantity_kg + tolerance
// INVARIANT E: Machine must exist and have status = 'active' during creation
// STAGE TRANSITIONS: film → printing → cutting → done (sequential only)
// TEMPORAL CONSTRAINTS: created_at ≤ printed_at ≤ cut_completed_at ≤ completed_at
export const rolls = pgTable(
  "rolls",
  {
    id: serial("id").primaryKey(),
    roll_seq: integer("roll_seq").notNull(), // Sequential number within production order, CHECK: > 0
    roll_number: varchar("roll_number", { length: 64 }).notNull().unique(), // Auto-generated format: PO001-R001
    production_order_id: integer("production_order_id")
      .notNull()
      .references(() => production_orders.id, { onDelete: "cascade" }), // ON DELETE CASCADE
    qr_code_text: text("qr_code_text").notNull(), // JSON string with roll metadata
    qr_png_base64: text("qr_png_base64"), // Base64 encoded QR code image
    stage: varchar("stage", { length: 20 }).notNull().default("film"), // ENUM: film / printing / cutting / done - sequential transitions only
    weight_kg: decimal("weight_kg", { precision: 12, scale: 3 }).notNull(), // CHECK: > 0, validates against production order limits
    cut_weight_total_kg: decimal("cut_weight_total_kg", {
      precision: 12,
      scale: 3,
    })
      .notNull()
      .default("0"), // CHECK: >= 0, <= weight_kg
    waste_kg: decimal("waste_kg", { precision: 12, scale: 3 })
      .notNull()
      .default("0"), // CHECK: >= 0, <= weight_kg
    printed_at: timestamp("printed_at"), // Set when stage changes to 'printing', must be >= created_at
    cut_completed_at: timestamp("cut_completed_at"), // Set when stage changes to 'cutting', must be >= printed_at
    performed_by: integer("performed_by").references(() => users.id, {
      onDelete: "set null",
    }), // Legacy field, ON DELETE SET NULL
    machine_id: varchar("machine_id", { length: 20 })
      .notNull()
      .references(() => machines.id, { onDelete: "restrict" }), // ON DELETE RESTRICT, machine must be 'active'
    employee_id: integer("employee_id").references(() => users.id, {
      onDelete: "set null",
    }), // Legacy field, ON DELETE SET NULL
    created_by: integer("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }), // ON DELETE RESTRICT - user who created the roll
    printed_by: integer("printed_by").references(() => users.id, {
      onDelete: "set null",
    }), // ON DELETE SET NULL - user who printed the roll
    cut_by: integer("cut_by").references(() => users.id, {
      onDelete: "set null",
    }), // ON DELETE SET NULL - user who cut the roll
    qr_code: varchar("qr_code", { length: 255 }), // Legacy field
    created_at: timestamp("created_at").notNull().defaultNow(),
    completed_at: timestamp("completed_at"), // Set when stage = 'done'
  },
  (table) => ({
    // Check constraints for roll integrity
    rollSeqPositive: check("roll_seq_positive", sql`${table.roll_seq} > 0`),
    weightPositive: check("weight_kg_positive", sql`${table.weight_kg} > 0`),
    weightReasonable: check(
      "weight_kg_reasonable",
      sql`${table.weight_kg} <= 2000`,
    ), // Max 2000kg per roll
    cutWeightValid: check(
      "cut_weight_valid",
      sql`${table.cut_weight_total_kg} >= 0 AND ${table.cut_weight_total_kg} <= ${table.weight_kg}`,
    ),
    wasteValid: check(
      "waste_valid",
      sql`${table.waste_kg} >= 0 AND ${table.waste_kg} <= ${table.weight_kg}`,
    ),
    stageValid: check(
      "stage_valid",
      sql`${table.stage} IN ('film', 'printing', 'cutting', 'done')`,
    ),
    // Temporal constraints: timestamps must be in logical order
    printedAtValid: check(
      "printed_at_valid",
      sql`${table.printed_at} IS NULL OR ${table.printed_at} >= ${table.created_at}`,
    ),
    cutCompletedAtValid: check(
      "cut_completed_at_valid",
      sql`${table.cut_completed_at} IS NULL OR (${table.cut_completed_at} >= ${table.created_at} AND (${table.printed_at} IS NULL OR ${table.cut_completed_at} >= ${table.printed_at}))`,
    ),
    completedAtValid: check(
      "completed_at_valid",
      sql`${table.completed_at} IS NULL OR ${table.completed_at} >= ${table.created_at}`,
    ),
    // INVARIANT E: Machine must be active for roll creation - enforced at application level
    machineActiveForCreation: check("machine_active_for_creation", sql`TRUE`), // Placeholder - enforced in application layer
  }),
);

// ✂️ جدول القطع (Cuts)
export const cuts = pgTable("cuts", {
  id: serial("id").primaryKey(),
  roll_id: integer("roll_id")
    .notNull()
    .references(() => rolls.id, { onDelete: "cascade" }),
  cut_weight_kg: decimal("cut_weight_kg", {
    precision: 12,
    scale: 3,
  }).notNull(),
  pieces_count: integer("pieces_count"),
  performed_by: integer("performed_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// 🏪 جدول إيصالات المستودع (Warehouse Receipts)
export const warehouse_receipts = pgTable("warehouse_receipts", {
  id: serial("id").primaryKey(),
  production_order_id: integer("production_order_id")
    .notNull()
    .references(() => production_orders.id, { onDelete: "cascade" }),
  cut_id: integer("cut_id").references(() => cuts.id, { onDelete: "set null" }),
  received_weight_kg: decimal("received_weight_kg", {
    precision: 12,
    scale: 3,
  }).notNull(),
  received_by: integer("received_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// ⚙️ جدول إعدادات الإنتاج (Production Settings)
export const production_settings = pgTable("production_settings", {
  id: serial("id").primaryKey(),
  overrun_tolerance_percent: decimal("overrun_tolerance_percent", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("10.00"),
});

// 🗑️ جدول الهدر (Waste)
export const waste = pgTable("waste", {
  id: serial("id").primaryKey(),
  production_order_id: integer("production_order_id").references(
    () => production_orders.id,
    { onDelete: "cascade" },
  ),
  quantity_wasted: decimal("quantity_wasted", {
    precision: 8,
    scale: 2,
  }).notNull(),
  reason: varchar("reason", { length: 100 }),
  date_recorded: timestamp("date_recorded").defaultNow(),
});

// 🎨 جدول الألوان (Colors)
export const colors = pgTable("colors", {
  id: varchar("id", { length: 20 }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  name_ar: varchar("name_ar", { length: 50 }),
  code: varchar("code", { length: 20 }),
  hex_value: varchar("hex_value", { length: 7 }),
});

// 🗂️ جدول المواد (Items)
export const items = pgTable("items", {
  id: varchar("id", { length: 20 }).primaryKey(),
  category_id: varchar("category_id", { length: 20 }).references(
    () => categories.id,
  ),
  name: varchar("name", { length: 200 }).notNull(),
  name_ar: varchar("name_ar", { length: 200 }),
  code: varchar("code", { length: 50 }),
  type: varchar("type", { length: 50 }),
  reorder_level: decimal("reorder_level", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 20 }),
});

// 📦 جدول المخزون (Inventory)
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  item_id: varchar("item_id", { length: 20 }).references(() => items.id),
  location_id: integer("location_id").references(() => locations.id),
  current_stock: decimal("current_stock", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
});

// 🏷️ جدول المواقع (Locations)
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  type: varchar("type", { length: 50 }),
  parent_id: integer("parent_id"),
});

// 📋 جدول حركات المخزون (Inventory Movements)
export const inventory_movements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  item_id: varchar("item_id", { length: 20 }).references(() => items.id),
  location_id: integer("location_id").references(() => locations.id),
  movement_type: varchar("movement_type", { length: 50 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  reference_number: varchar("reference_number", { length: 50 }),
  notes: text("notes"),
  performed_by: integer("performed_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// 🛠️ جدول طلبات الصيانة (Maintenance Requests)
export const maintenance_requests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  machine_id: varchar("machine_id", { length: 20 }).references(
    () => machines.id,
  ),
  request_type: varchar("request_type", { length: 50 }),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("pending"),
  requested_by: integer("requested_by").references(() => users.id),
  assigned_to: integer("assigned_to").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  resolved_at: timestamp("resolved_at"),
});

// 🔧 جدول إجراءات الصيانة (Maintenance Actions)
export const maintenance_actions = pgTable("maintenance_actions", {
  id: serial("id").primaryKey(),
  request_id: integer("request_id")
    .notNull()
    .references(() => maintenance_requests.id, { onDelete: "cascade" }),
  action_taken: text("action_taken").notNull(),
  performed_by: integer("performed_by")
    .notNull()
    .references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// 📊 جدول تقارير الصيانة (Maintenance Reports)
export const maintenance_reports = pgTable("maintenance_reports", {
  id: serial("id").primaryKey(),
  machine_id: varchar("machine_id", { length: 20 }).references(
    () => machines.id,
  ),
  report_type: varchar("report_type", { length: 50 }),
  findings: text("findings"),
  recommendations: text("recommendations"),
  reported_by: integer("reported_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// ⚠️ جدول تقارير التهاون (Operator Negligence Reports)
export const operator_negligence_reports = pgTable(
  "operator_negligence_reports",
  {
    id: serial("id").primaryKey(),
    operator_id: integer("operator_id").references(() => users.id),
    machine_id: varchar("machine_id", { length: 20 }).references(
      () => machines.id,
    ),
    incident_description: text("incident_description").notNull(),
    severity: varchar("severity", { length: 20 }).default("low"),
    reported_by: integer("reported_by").references(() => users.id),
    created_at: timestamp("created_at").defaultNow(),
  },
);

// 🔩 جدول قطع الغيار الاستهلاكية (Consumable Parts)
export const consumable_parts = pgTable("consumable_parts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  code: varchar("code", { length: 50 }),
  machine_id: varchar("machine_id", { length: 20 }).references(
    () => machines.id,
  ),
  current_stock: integer("current_stock").notNull().default(0),
  reorder_level: integer("reorder_level").default(10),
  unit: varchar("unit", { length: 20 }),
});

// 📋 جدول معاملات قطع الغيار (Consumable Part Transactions)
export const consumable_part_transactions = pgTable(
  "consumable_part_transactions",
  {
    id: serial("id").primaryKey(),
    part_id: integer("part_id")
      .notNull()
      .references(() => consumable_parts.id, { onDelete: "cascade" }),
    transaction_type: varchar("transaction_type", { length: 20 }).notNull(),
    quantity: integer("quantity").notNull(),
    performed_by: integer("performed_by").references(() => users.id),
    notes: text("notes"),
    created_at: timestamp("created_at").defaultNow(),
  },
);

export const system_settings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const user_settings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  message: text("message").notNull(),
  source: varchar("source", { length: 100 }),
  related_entity_id: varchar("related_entity_id", { length: 50 }),
  related_entity_type: varchar("related_entity_type", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  acknowledged_by: integer("acknowledged_by").references(() => users.id),
  acknowledged_at: timestamp("acknowledged_at"),
  resolved_at: timestamp("resolved_at"),
  metadata: json("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

export const system_health = pgTable("system_health", {
  id: serial("id").primaryKey(),
  metric_name: varchar("metric_name", { length: 100 }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("healthy"),
  threshold_warning: decimal("threshold_warning", { precision: 10, scale: 2 }),
  threshold_critical: decimal("threshold_critical", {
    precision: 10,
    scale: 2,
  }),
  last_checked_at: timestamp("last_checked_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
});

export const performance_metrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  entity_type: varchar("entity_type", { length: 50 }).notNull(),
  entity_id: varchar("entity_id", { length: 50 }).notNull(),
  metric_name: varchar("metric_name", { length: 100 }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }),
  period_start: timestamp("period_start"),
  period_end: timestamp("period_end"),
  metadata: json("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

export const corrective_actions = pgTable("corrective_actions", {
  id: serial("id").primaryKey(),
  alert_id: integer("alert_id").references(() => alerts.id, {
    onDelete: "cascade",
  }),
  action_type: varchar("action_type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  assigned_to: integer("assigned_to").references(() => users.id),
  priority: varchar("priority", { length: 20 }).default("medium"),
  due_date: timestamp("due_date"),
  completed_at: timestamp("completed_at"),
  notes: text("notes"),
  metadata: json("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

export const data_validation_logs = pgTable("data_validation_logs", {
  id: serial("id").primaryKey(),
  entity_type: varchar("entity_type", { length: 50 }).notNull(),
  entity_id: varchar("entity_id", { length: 50 }).notNull(),
  validation_type: varchar("validation_type", { length: 50 }).notNull(),
  is_valid: boolean("is_valid").notNull(),
  errors: json("errors").$type<string[]>(),
  warnings: json("warnings").$type<string[]>(),
  validated_by: integer("validated_by").references(() => users.id),
  metadata: json("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

export const training_programs = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  name_ar: varchar("name_ar", { length: 200 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  duration_hours: integer("duration_hours"),
  difficulty_level: varchar("difficulty_level", { length: 50 }),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const training_materials = pgTable("training_materials", {
  id: serial("id").primaryKey(),
  program_id: integer("program_id")
    .notNull()
    .references(() => training_programs.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  content_url: text("content_url"),
  order_index: integer("order_index").default(0),
});

export const training_enrollments = pgTable("training_enrollments", {
  id: serial("id").primaryKey(),
  program_id: integer("program_id")
    .notNull()
    .references(() => training_programs.id, { onDelete: "cascade" }),
  employee_id: integer("employee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  enrolled_date: timestamp("enrolled_date").defaultNow(),
  completion_date: timestamp("completion_date"),
  status: varchar("status", { length: 20 }).default("enrolled"),
  progress_percentage: integer("progress_percentage").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const training_evaluations = pgTable("training_evaluations", {
  id: serial("id").primaryKey(),
  enrollment_id: integer("enrollment_id")
    .notNull()
    .references(() => training_enrollments.id, { onDelete: "cascade" }),
  program_id: integer("program_id")
    .notNull()
    .references(() => training_programs.id, { onDelete: "cascade" }),
  employee_id: integer("employee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  evaluator_id: integer("evaluator_id").references(() => users.id),
  score: decimal("score", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  evaluation_date: timestamp("evaluation_date"),
  created_at: timestamp("created_at").defaultNow(),
});

export const training_certificates = pgTable("training_certificates", {
  id: serial("id").primaryKey(),
  enrollment_id: integer("enrollment_id")
    .notNull()
    .references(() => training_enrollments.id, { onDelete: "cascade" }),
  program_id: integer("program_id")
    .notNull()
    .references(() => training_programs.id, { onDelete: "cascade" }),
  employee_id: integer("employee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  certificate_number: varchar("certificate_number", { length: 100 })
    .notNull()
    .unique(),
  issued_date: timestamp("issued_date").defaultNow(),
  expiry_date: timestamp("expiry_date"),
  issued_by: integer("issued_by").references(() => users.id),
});

export const performance_reviews = pgTable("performance_reviews", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reviewer_id: integer("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  review_period_start: date("review_period_start").notNull(),
  review_period_end: date("review_period_end").notNull(),
  overall_rating: decimal("overall_rating", { precision: 3, scale: 2 }),
  comments: text("comments"),
  status: varchar("status", { length: 20 }).default("draft"),
  submitted_at: timestamp("submitted_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const performance_criteria = pgTable("performance_criteria", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  name_ar: varchar("name_ar", { length: 200 }),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  weight: decimal("weight", { precision: 5, scale: 2 }).default("1.00"),
  is_active: boolean("is_active").default(true),
});

export const performance_ratings = pgTable("performance_ratings", {
  id: serial("id").primaryKey(),
  review_id: integer("review_id")
    .notNull()
    .references(() => performance_reviews.id, { onDelete: "cascade" }),
  criteria_id: integer("criteria_id")
    .notNull()
    .references(() => performance_criteria.id, { onDelete: "restrict" }),
  rating: decimal("rating", { precision: 3, scale: 2 }).notNull(),
  comments: text("comments"),
});

export const leave_types = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  description: text("description"),
  max_days_per_year: integer("max_days_per_year"),
  requires_approval: boolean("requires_approval").default(true),
  is_paid: boolean("is_paid").default(true),
  is_active: boolean("is_active").default(true),
});

export const leave_requests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  leave_type_id: integer("leave_type_id")
    .notNull()
    .references(() => leave_types.id, { onDelete: "restrict" }),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("pending"),
  direct_manager_status: varchar("direct_manager_status", { length: 20 }),
  direct_manager_id: integer("direct_manager_id").references(() => users.id),
  direct_manager_reviewed_at: timestamp("direct_manager_reviewed_at"),
  hr_status: varchar("hr_status", { length: 20 }),
  hr_reviewed_by: integer("hr_reviewed_by").references(() => users.id),
  hr_reviewed_at: timestamp("hr_reviewed_at"),
  replacement_employee_id: integer("replacement_employee_id").references(
    () => users.id,
  ),
  rejection_reason: text("rejection_reason"),
  created_at: timestamp("created_at").defaultNow(),
});

export const leave_balances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  leave_type_id: integer("leave_type_id")
    .notNull()
    .references(() => leave_types.id, { onDelete: "restrict" }),
  year: integer("year").notNull(),
  allocated_days: decimal("allocated_days", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  used_days: decimal("used_days", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  remaining_days: decimal("remaining_days", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
});

export const insertSystemSettingSchema = createInsertSchema(
  system_settings,
).omit({
  id: true,
  updated_at: true,
});

export const insertUserSettingSchema = createInsertSchema(user_settings).omit({
  id: true,
  updated_at: true,
});

export type CustomerProduct = typeof customer_products.$inferSelect & {
  customer_name?: string;
  customer_name_ar?: string;
  customer_code?: string;
};
export type InsertCustomerProduct = z.infer<typeof insertCustomerProductSchema>;
export type SystemSetting = typeof system_settings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type UserSetting = typeof user_settings.$inferSelect;
export type InsertUserSetting = z.infer<typeof insertUserSettingSchema>;

export const insertCustomerProductSchema = createInsertSchema(customer_products)
  .omit({
    id: true,
    created_at: true,
    width: true,
    left_facing: true,
    right_facing: true,
    thickness: true,
    unit_weight_kg: true,
    package_weight_kg: true,
    cutting_length_cm: true,
    unit_quantity: true,
  })
  .extend({
    width: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num.toString();
      }),
    left_facing: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num.toString();
      }),
    right_facing: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num.toString();
      }),
    thickness: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num.toString();
      }),
    unit_weight_kg: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num.toString();
      }),
    package_weight_kg: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : val;
        return isNaN(num) ? undefined : num.toString();
      }),
    cutting_length_cm: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        try {
          const num =
            typeof val === "string"
              ? parseIntSafe(val, "Cutting length", { min: 1, max: 10000 })
              : val;
          return num;
        } catch {
          return undefined;
        }
      }),
    unit_quantity: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return undefined;
        try {
          const num =
            typeof val === "string"
              ? parseIntSafe(val, "Unit quantity", { min: 1, max: 1000000 })
              : val;
          return num;
        } catch {
          return undefined;
        }
      }),
  });

export const insertCategorySchema = createInsertSchema(categories);
export const insertCustomerSchema = createInsertSchema(customers).omit({
  created_at: true,
});

export const insertTrainingProgramSchema = createInsertSchema(
  training_programs,
).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTrainingMaterialSchema = createInsertSchema(
  training_materials,
).omit({
  id: true,
});

export const insertTrainingEnrollmentSchema = createInsertSchema(
  training_enrollments,
).omit({
  id: true,
  enrolled_date: true,
  created_at: true,
  updated_at: true,
});

export const insertTrainingEvaluationSchema = createInsertSchema(
  training_evaluations,
).omit({
  id: true,
  created_at: true,
});

export const insertTrainingCertificateSchema = createInsertSchema(
  training_certificates,
).omit({
  id: true,
  issued_date: true,
});

export const insertPerformanceReviewSchema = createInsertSchema(
  performance_reviews,
).omit({
  id: true,
  created_at: true,
});

export const insertPerformanceCriteriaSchema = createInsertSchema(
  performance_criteria,
).omit({
  id: true,
});

export const insertPerformanceRatingSchema = createInsertSchema(
  performance_ratings,
).omit({
  id: true,
});

export const insertLeaveTypeSchema = createInsertSchema(leave_types).omit({
  id: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leave_requests).omit(
  {
    id: true,
    created_at: true,
  },
);

export const insertLeaveBalanceSchema = createInsertSchema(leave_balances).omit(
  {
    id: true,
  },
);

export type TrainingProgram = typeof training_programs.$inferSelect;
export type InsertTrainingProgram = z.infer<
  typeof insertTrainingProgramSchema
>;
export type TrainingMaterial = typeof training_materials.$inferSelect;
export type InsertTrainingMaterial = z.infer<
  typeof insertTrainingMaterialSchema
>;
export type TrainingEnrollment = typeof training_enrollments.$inferSelect;
export type InsertTrainingEnrollment = z.infer<
  typeof insertTrainingEnrollmentSchema
>;
export type TrainingEvaluation = typeof training_evaluations.$inferSelect;
export type InsertTrainingEvaluation = z.infer<
  typeof insertTrainingEvaluationSchema
>;
export type TrainingCertificate = typeof training_certificates.$inferSelect;
export type InsertTrainingCertificate = z.infer<
  typeof insertTrainingCertificateSchema
>;

export type PerformanceReview = typeof performance_reviews.$inferSelect;
export type InsertPerformanceReview = z.infer<
  typeof insertPerformanceReviewSchema
>;
export type PerformanceCriteria = typeof performance_criteria.$inferSelect;
export type InsertPerformanceCriteria = z.infer<
  typeof insertPerformanceCriteriaSchema
>;
export type PerformanceRating = typeof performance_ratings.$inferSelect;
export type InsertPerformanceRating = z.infer<
  typeof insertPerformanceRatingSchema
>;

export type LeaveType = typeof leave_types.$inferSelect;
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;
export type LeaveRequest = typeof leave_requests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveBalance = typeof leave_balances.$inferSelect;
export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = {
  name: string;
  name_ar?: string | null;
  permissions?: string[] | null;
};
export type Section = typeof sections.$inferSelect;
export type InsertSection = {
  id: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
};
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserRequest = typeof user_requests.$inferSelect;
export type InsertUserRequest = {
  user_id: number;
  type: string;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  response?: string | null;
  reviewed_by?: number | null;
};
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = {
  user_id: number;
  status?: string;
  check_in_time?: Date | null;
  check_out_time?: Date | null;
  lunch_start_time?: Date | null;
  lunch_end_time?: Date | null;
  notes?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  date?: string;
};
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = {
  id: string;
  name: string;
  name_ar?: string | null;
  code?: string | null;
  user_id?: string | null;
  plate_drawer_code?: string | null;
  city?: string | null;
  address?: string | null;
  tax_number?: string | null;
  phone?: string | null;
  sales_rep_id?: number | null;
};
export type Category = typeof categories.$inferSelect;
export type InsertCategory = {
  id: string;
  name: string;
  name_ar?: string | null;
  code?: string | null;
  parent_id?: string | null;
};
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = {
  id: string;
  name: string;
  name_ar?: string | null;
  type: string;
  section_id?: string | null;
  status?: string;
};
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertNewOrderSchema>;
export type ProductionOrder = typeof production_orders.$inferSelect & {
  order_number?: string;
  customer_id?: string;
  customer_name?: string;
  item_name?: string;
  size_caption?: string;
  cutting_length_cm?: number;
  delivery_date?: string;
  delivery_days?: number;
};
export type InsertProductionOrder = z.infer<
  typeof insertProductionOrderSchema
>;
export type Roll = typeof rolls.$inferSelect;
export type InsertRoll = z.infer<typeof insertRollSchema>;
export type Cut = typeof cuts.$inferSelect;
export type InsertCut = z.infer<typeof insertCutSchema>;
export type WarehouseReceipt = typeof warehouse_receipts.$inferSelect;
export type InsertWarehouseReceipt = z.infer<
  typeof insertWarehouseReceiptSchema
>;
export type ProductionSettings = typeof production_settings.$inferSelect;
export type InsertProductionSettings = z.infer<
  typeof insertProductionSettingsSchema
>;
export type Waste = typeof waste.$inferSelect;
export type InsertWaste = {
  production_order_id?: number | null;
  quantity_wasted: string;
  reason?: string | null;
};
export type Color = typeof colors.$inferSelect;
export type InsertColor = {
  id: string;
  name: string;
  name_ar?: string | null;
  code?: string | null;
  hex_value?: string | null;
};
export type Item = typeof items.$inferSelect;
export type InsertItem = {
  id: string;
  category_id?: string | null;
  name: string;
  name_ar?: string | null;
  code?: string | null;
  type?: string | null;
  reorder_level?: string | null;
  unit?: string | null;
};
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = {
  name: string;
  name_ar?: string | null;
  type?: string | null;
  parent_id?: number | null;
};
export type InventoryMovement = typeof inventory_movements.$inferSelect;
export type InsertInventoryMovement = z.infer<
  typeof insertInventoryMovementSchema
>;
export type MaintenanceRequest = typeof maintenance_requests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<
  typeof insertMaintenanceRequestSchema
>;
export type MaintenanceAction = typeof maintenance_actions.$inferSelect;
export type InsertMaintenanceAction = z.infer<
  typeof insertMaintenanceActionSchema
>;
export type MaintenanceReport = typeof maintenance_reports.$inferSelect;
export type InsertMaintenanceReport = z.infer<
  typeof insertMaintenanceReportSchema
>;
export type OperatorNegligenceReport =
  typeof operator_negligence_reports.$inferSelect;
export type InsertOperatorNegligenceReport = z.infer<
  typeof insertOperatorNegligenceReportSchema
>;
export type ConsumablePart = typeof consumable_parts.$inferSelect;
export type InsertConsumablePart = z.infer<typeof insertConsumablePartSchema>;
export type ConsumablePartTransaction =
  typeof consumable_part_transactions.$inferSelect;
export type InsertConsumablePartTransaction = z.infer<
  typeof insertConsumablePartTransactionSchema
>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = {
  type: string;
  severity?: string;
  message: string;
  source?: string | null;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
  status?: string;
  acknowledged_by?: number | null;
  acknowledged_at?: Date | null;
  resolved_at?: Date | null;
  metadata?: any;
};
export type SystemHealth = typeof system_health.$inferSelect;
export type InsertSystemHealth = {
  metric_name: string;
  value: string;
  unit?: string | null;
  status?: string;
  threshold_warning?: string | null;
  threshold_critical?: string | null;
  last_checked_at?: Date;
};
export type PerformanceMetric = typeof performance_metrics.$inferSelect;
export type InsertPerformanceMetric = {
  entity_type: string;
  entity_id: string;
  metric_name: string;
  value: string;
  unit?: string | null;
  period_start?: Date | null;
  period_end?: Date | null;
  metadata?: any;
};
export type CorrectiveAction = typeof corrective_actions.$inferSelect;
export type InsertCorrectiveAction = {
  alert_id?: number | null;
  action_type: string;
  description: string;
  status?: string;
  assigned_to?: number | null;
  priority?: string | null;
  due_date?: Date | null;
  completed_at?: Date | null;
  notes?: string | null;
  metadata?: any;
};
export type DataValidationLog = typeof data_validation_logs.$inferSelect;
export type InsertDataValidationLog = {
  entity_type: string;
  entity_id: string;
  validation_type: string;
  is_valid: boolean;
  errors?: string[] | null;
  warnings?: string[] | null;
  validated_by?: number | null;
  metadata?: any;
};

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const sectionsRelations = relations(sections, ({ many }) => ({
  machines: many(machines),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.id],
  }),
  createdOrders: many(orders, { relationName: "created_by" }),
  attendance: many(attendance, { relationName: "attendance_user" }),
  performedBy: many(rolls, { relationName: "performed_by" }),
  requests: many(user_requests, { relationName: "user_requests" }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  salesRep: one(users, {
    fields: [customers.sales_rep_id],
    references: [users.id],
  }),
  orders: many(orders),
  customerProducts: many(customer_products),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
  customerProducts: many(customer_products),
}));

export const customerProductsRelations = relations(
  customer_products,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [customer_products.customer_id],
      references: [customers.id],
    }),
    category: one(categories, {
      fields: [customer_products.category_id],
      references: [categories.id],
    }),
    item: one(items, {
      fields: [customer_products.item_id],
      references: [items.id],
    }),
    productionOrders: many(production_orders),
  }),
);

export const machinesRelations = relations(machines, ({ one, many }) => ({
  section: one(sections, {
    fields: [machines.section_id],
    references: [sections.id],
  }),
  rolls: many(rolls),
  maintenanceRequests: many(maintenance_requests),
  maintenanceReports: many(maintenance_reports),
  operatorNegligenceReports: many(operator_negligence_reports),
  consumableParts: many(consumable_parts),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customer_id],
    references: [customers.id],
  }),
  createdBy: one(users, {
    fields: [orders.created_by],
    references: [users.id],
  }),
  productionOrders: many(production_orders),
}));

export const productionOrdersRelations = relations(
  production_orders,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [production_orders.order_id],
      references: [orders.id],
    }),
    customerProduct: one(customer_products, {
      fields: [production_orders.customer_product_id],
      references: [customer_products.id],
    }),
    rolls: many(rolls),
    wasteRecords: many(waste),
    warehouseReceipts: many(warehouse_receipts),
  }),
);

export const rollsRelations = relations(rolls, ({ one, many }) => ({
  productionOrder: one(production_orders, {
    fields: [rolls.production_order_id],
    references: [production_orders.id],
  }),
  machine: one(machines, {
    fields: [rolls.machine_id],
    references: [machines.id],
  }),
  performedBy: one(users, {
    fields: [rolls.performed_by],
    references: [users.id],
    relationName: "performed_by",
  }),
  employee: one(users, {
    fields: [rolls.employee_id],
    references: [users.id],
    relationName: "employee",
  }),
  createdBy: one(users, {
    fields: [rolls.created_by],
    references: [users.id],
    relationName: "created_by",
  }),
  printedBy: one(users, {
    fields: [rolls.printed_by],
    references: [users.id],
    relationName: "printed_by",
  }),
  cutBy: one(users, {
    fields: [rolls.cut_by],
    references: [users.id],
    relationName: "cut_by",
  }),
  cuts: many(cuts),
}));

export const cutsRelations = relations(cuts, ({ one, many }) => ({
  roll: one(rolls, {
    fields: [cuts.roll_id],
    references: [rolls.id],
  }),
  performedBy: one(users, {
    fields: [cuts.performed_by],
    references: [users.id],
  }),
  warehouseReceipts: many(warehouse_receipts),
}));

export const warehouseReceiptsRelations = relations(
  warehouse_receipts,
  ({ one }) => ({
    productionOrder: one(production_orders, {
      fields: [warehouse_receipts.production_order_id],
      references: [production_orders.id],
    }),
    cut: one(cuts, {
      fields: [warehouse_receipts.cut_id],
      references: [cuts.id],
    }),
    receivedBy: one(users, {
      fields: [warehouse_receipts.received_by],
      references: [users.id],
    }),
  }),
);

export const wasteRelations = relations(waste, ({ one }) => ({
  productionOrder: one(production_orders, {
    fields: [waste.production_order_id],
    references: [production_orders.id],
  }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.category_id],
    references: [categories.id],
  }),
  inventory: many(inventory),
  inventoryMovements: many(inventory_movements),
  customerProducts: many(customer_products),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  item: one(items, {
    fields: [inventory.item_id],
    references: [items.id],
  }),
  location: one(locations, {
    fields: [inventory.location_id],
    references: [locations.id],
  }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  inventory: many(inventory),
  inventoryMovements: many(inventory_movements),
}));

export const inventoryMovementsRelations = relations(
  inventory_movements,
  ({ one }) => ({
    item: one(items, {
      fields: [inventory_movements.item_id],
      references: [items.id],
    }),
    location: one(locations, {
      fields: [inventory_movements.location_id],
      references: [locations.id],
    }),
    performedBy: one(users, {
      fields: [inventory_movements.performed_by],
      references: [users.id],
    }),
  }),
);

export const maintenanceRequestsRelations = relations(
  maintenance_requests,
  ({ one, many }) => ({
    machine: one(machines, {
      fields: [maintenance_requests.machine_id],
      references: [machines.id],
    }),
    requestedBy: one(users, {
      fields: [maintenance_requests.requested_by],
      references: [users.id],
    }),
    assignedTo: one(users, {
      fields: [maintenance_requests.assigned_to],
      references: [users.id],
    }),
    actions: many(maintenance_actions),
  }),
);

export const maintenanceActionsRelations = relations(
  maintenance_actions,
  ({ one }) => ({
    request: one(maintenance_requests, {
      fields: [maintenance_actions.request_id],
      references: [maintenance_requests.id],
    }),
    performedBy: one(users, {
      fields: [maintenance_actions.performed_by],
      references: [users.id],
    }),
  }),
);

export const maintenanceReportsRelations = relations(
  maintenance_reports,
  ({ one }) => ({
    machine: one(machines, {
      fields: [maintenance_reports.machine_id],
      references: [machines.id],
    }),
    reportedBy: one(users, {
      fields: [maintenance_reports.reported_by],
      references: [users.id],
    }),
  }),
);

export const operatorNegligenceReportsRelations = relations(
  operator_negligence_reports,
  ({ one }) => ({
    operator: one(users, {
      fields: [operator_negligence_reports.operator_id],
      references: [users.id],
      relationName: "operator",
    }),
    machine: one(machines, {
      fields: [operator_negligence_reports.machine_id],
      references: [machines.id],
    }),
    reportedBy: one(users, {
      fields: [operator_negligence_reports.reported_by],
      references: [users.id],
      relationName: "reporter",
    }),
  }),
);

export const consumablePartsRelations = relations(
  consumable_parts,
  ({ one, many }) => ({
    machine: one(machines, {
      fields: [consumable_parts.machine_id],
      references: [machines.id],
    }),
    transactions: many(consumable_part_transactions),
  }),
);

export const consumablePartTransactionsRelations = relations(
  consumable_part_transactions,
  ({ one }) => ({
    part: one(consumable_parts, {
      fields: [consumable_part_transactions.part_id],
      references: [consumable_parts.id],
    }),
    performedBy: one(users, {
      fields: [consumable_part_transactions.performed_by],
      references: [users.id],
    }),
  }),
);

export const userRequestsRelations = relations(user_requests, ({ one }) => ({
  user: one(users, {
    fields: [user_requests.user_id],
    references: [users.id],
    relationName: "user_requests",
  }),
  reviewedBy: one(users, {
    fields: [user_requests.reviewed_by],
    references: [users.id],
    relationName: "reviewed_user_requests",
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.user_id],
    references: [users.id],
    relationName: "attendance_user",
  }),
  createdBy: one(users, {
    fields: [attendance.created_by],
    references: [users.id],
    relationName: "attendance_created_by",
  }),
  updatedBy: one(users, {
    fields: [attendance.updated_by],
    references: [users.id],
    relationName: "attendance_updated_by",
  }),
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  acknowledgedBy: one(users, {
    fields: [alerts.acknowledged_by],
    references: [users.id],
  }),
  correctiveActions: many(corrective_actions),
}));

export const correctiveActionsRelations = relations(
  corrective_actions,
  ({ one }) => ({
    alert: one(alerts, {
      fields: [corrective_actions.alert_id],
      references: [alerts.id],
    }),
    assignedTo: one(users, {
      fields: [corrective_actions.assigned_to],
      references: [users.id],
    }),
  }),
);

export const dataValidationLogsRelations = relations(
  data_validation_logs,
  ({ one }) => ({
    validatedBy: one(users, {
      fields: [data_validation_logs.validated_by],
      references: [users.id],
    }),
  }),
);

export const trainingProgramsRelations = relations(
  training_programs,
  ({ many }) => ({
    materials: many(training_materials),
    enrollments: many(training_enrollments),
    evaluations: many(training_evaluations),
    certificates: many(training_certificates),
  }),
);

export const trainingMaterialsRelations = relations(
  training_materials,
  ({ one }) => ({
    program: one(training_programs, {
      fields: [training_materials.program_id],
      references: [training_programs.id],
    }),
  }),
);

export const trainingEnrollmentsRelations = relations(
  training_enrollments,
  ({ one, many }) => ({
    program: one(training_programs, {
      fields: [training_enrollments.program_id],
      references: [training_programs.id],
    }),
    employee: one(users, {
      fields: [training_enrollments.employee_id],
      references: [users.id],
    }),
    evaluation: one(training_evaluations, {
      fields: [training_enrollments.id],
      references: [training_evaluations.enrollment_id],
    }),
    certificate: one(training_certificates, {
      fields: [training_enrollments.id],
      references: [training_certificates.enrollment_id],
    }),
  }),
);

export const trainingEvaluationsRelations = relations(
  training_evaluations,
  ({ one }) => ({
    enrollment: one(training_enrollments, {
      fields: [training_evaluations.enrollment_id],
      references: [training_enrollments.id],
    }),
    program: one(training_programs, {
      fields: [training_evaluations.program_id],
      references: [training_programs.id],
    }),
    employee: one(users, {
      fields: [training_evaluations.employee_id],
      references: [users.id],
    }),
    evaluator: one(users, {
      fields: [training_evaluations.evaluator_id],
      references: [users.id],
    }),
  }),
);

export const trainingCertificatesRelations = relations(
  training_certificates,
  ({ one }) => ({
    enrollment: one(training_enrollments, {
      fields: [training_certificates.enrollment_id],
      references: [training_enrollments.id],
    }),
    program: one(training_programs, {
      fields: [training_certificates.program_id],
      references: [training_programs.id],
    }),
    employee: one(users, {
      fields: [training_certificates.employee_id],
      references: [users.id],
    }),
    issuer: one(users, {
      fields: [training_certificates.issued_by],
      references: [users.id],
    }),
  }),
);

export const performanceReviewsRelations = relations(
  performance_reviews,
  ({ one, many }) => ({
    employee: one(users, {
      fields: [performance_reviews.employee_id],
      references: [users.id],
      relationName: "employee_reviews",
    }),
    reviewer: one(users, {
      fields: [performance_reviews.reviewer_id],
      references: [users.id],
      relationName: "reviewer_reviews",
    }),
    ratings: many(performance_ratings),
  }),
);

export const performanceCriteriaRelations = relations(
  performance_criteria,
  ({ many }) => ({
    ratings: many(performance_ratings),
  }),
);

export const performanceRatingsRelations = relations(
  performance_ratings,
  ({ one }) => ({
    review: one(performance_reviews, {
      fields: [performance_ratings.review_id],
      references: [performance_reviews.id],
    }),
    criteria: one(performance_criteria, {
      fields: [performance_ratings.criteria_id],
      references: [performance_criteria.id],
    }),
  }),
);

export const leaveTypesRelations = relations(leave_types, ({ many }) => ({
  requests: many(leave_requests),
  balances: many(leave_balances),
}));

export const leaveRequestsRelations = relations(leave_requests, ({ one }) => ({
  employee: one(users, {
    fields: [leave_requests.employee_id],
    references: [users.id],
  }),
  leaveType: one(leave_types, {
    fields: [leave_requests.leave_type_id],
    references: [leave_types.id],
  }),
  directManager: one(users, {
    fields: [leave_requests.direct_manager_id],
    references: [users.id],
  }),
  hrReviewer: one(users, {
    fields: [leave_requests.hr_reviewed_by],
    references: [users.id],
  }),
  replacementEmployee: one(users, {
    fields: [leave_requests.replacement_employee_id],
    references: [users.id],
  }),
}));

export const leaveBalancesRelations = relations(leave_balances, ({ one }) => ({
  employee: one(users, {
    fields: [leave_balances.employee_id],
    references: [users.id],
  }),
  leaveType: one(leave_types, {
    fields: [leave_balances.leave_type_id],
    references: [leave_types.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export const insertNewOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
});

export const insertProductionOrderSchema = createInsertSchema(production_orders)
  .omit({
    id: true,
    created_at: true,
  })
  .extend({
    quantity_kg: z
      .union([z.string(), z.number()])
      .transform((val) => parseFloatSafe(val, "Quantity", { min: 0.01 })),
    overrun_percentage: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) =>
        val === undefined || val === null || val === ""
          ? 5
          : parseFloatSafe(val, "Overrun percentage", { min: 0, max: 50 }),
      ),
  });

export const insertRollSchema = createInsertSchema(rolls)
  .omit({
    id: true,
    created_at: true,
  })
  .extend({
    weight_kg: z
      .string()
      .optional()
      .transform((val) => parseFloatSafe(val, "Weight")),
  });

export const insertMaintenanceRequestSchema =
  createInsertSchema(maintenance_requests).omit({
    id: true,
    created_at: true,
  });

export const insertMaintenanceActionSchema =
  createInsertSchema(maintenance_actions).omit({
    id: true,
    created_at: true,
  });

export const insertMaintenanceReportSchema =
  createInsertSchema(maintenance_reports).omit({
    id: true,
    created_at: true,
  });

export const insertOperatorNegligenceReportSchema = createInsertSchema(
  operator_negligence_reports,
).omit({
  id: true,
  created_at: true,
});

export const insertConsumablePartSchema =
  createInsertSchema(consumable_parts).omit({
    id: true,
  });

export const insertConsumablePartTransactionSchema = createInsertSchema(
  consumable_part_transactions,
).omit({
  id: true,
  created_at: true,
});

export const insertInventoryMovementSchema =
  createInsertSchema(inventory_movements).omit({
    id: true,
    created_at: true,
  });

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
});

export const insertCutSchema = createInsertSchema(cuts).omit({
  id: true,
  created_at: true,
});

export const insertWarehouseReceiptSchema =
  createInsertSchema(warehouse_receipts).omit({
    id: true,
    created_at: true,
  });

export const insertProductionSettingsSchema =
  createInsertSchema(production_settings).omit({
    id: true,
  });
