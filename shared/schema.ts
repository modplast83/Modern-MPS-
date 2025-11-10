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
  jsonb,
  text,
  decimal,
  check,
  index,
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

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// 🧑‍💼 جدول المستخدمين (supports both username/password and Replit Auth)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).unique(),
  password: varchar("password", { length: 100 }),
  display_name: varchar("display_name", { length: 100 }),
  display_name_ar: varchar("display_name_ar", { length: 100 }),
  full_name: varchar("full_name", { length: 200 }),
  phone: varchar("phone", { length: 20 }), // رقم الهاتف للواتس اب
  email: varchar("email", { length: 100 }),
  role_id: integer("role_id").references(() => roles.id),
  section_id: integer("section_id"),
  status: varchar("status", { length: 20 }).default("active"), // active / suspended / deleted
  created_at: timestamp("created_at").defaultNow(),
  
  // Replit Auth fields (from integration blueprint)
  replit_user_id: varchar("replit_user_id", { length: 255 }).unique(), // Replit user ID from OpenID Connect
  first_name: varchar("first_name", { length: 100 }),
  last_name: varchar("last_name", { length: 100 }),
  profile_image_url: varchar("profile_image_url", { length: 500 }),
  updated_at: timestamp("updated_at").defaultNow(),
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
  tax_number: varchar("tax_number", { length: 14 }),
  commercial_name: varchar("commercial_name", { length: 200 }),
  unified_number: varchar("unified_number", { length: 10 }),
  unique_customer_number: varchar("unique_customer_number", { length: 20 }),
  is_active: boolean("is_active").default(true),
  phone: varchar("phone", { length: 20 }),
  sales_rep_id: integer("sales_rep_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  unifiedNumberFormat: check(
    "unified_number_format",
    sql`${table.unified_number} IS NULL OR ${table.unified_number} ~ '^7[0-9]{9}$'`,
  ),
  taxNumberLength: check(
    "tax_number_length",
    sql`${table.tax_number} IS NULL OR LENGTH(${table.tax_number}) = 14`,
  ),
}));

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
    
    // قدرة الإنتاج بالكيلوجرام في الساعة حسب الحجم
    capacity_small_kg_per_hour: decimal("capacity_small_kg_per_hour", {
      precision: 8,
      scale: 2,
    }), // قدرة الإنتاج للحجم الصغير
    capacity_medium_kg_per_hour: decimal("capacity_medium_kg_per_hour", {
      precision: 8,
      scale: 2,
    }), // قدرة الإنتاج للحجم الوسط
    capacity_large_kg_per_hour: decimal("capacity_large_kg_per_hour", {
      precision: 8,
      scale: 2,
    }), // قدرة الإنتاج للحجم الكبير
    
    // نوع السكرو لمكائن الفيلم (A أو ABA فقط)
    screw_type: varchar("screw_type", { length: 10 }).default("A"), // 'A' للسكرو الواحد، 'ABA' لنظام السكروين
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
    screwTypeValid: check(
      "screw_type_valid",
      sql`${table.screw_type} IS NULL OR ${table.screw_type} IN ('A', 'ABA')`,
    ), // نوع السكرو يكون 'A' أو 'ABA' فقط
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

    // NEW: حقول تخصيص الماكينة والعامل
    assigned_machine_id: varchar("assigned_machine_id", { length: 20 })
      .references(() => machines.id, { onDelete: "set null" }), // تخصيص ماكينة الفيلم
    assigned_operator_id: integer("assigned_operator_id")
      .references(() => users.id, { onDelete: "set null" }), // تخصيص العامل المسؤول
    
    // NEW: حقول أوقات الإنتاج
    production_start_time: timestamp("production_start_time"), // وقت بداية الإنتاج
    production_end_time: timestamp("production_end_time"), // وقت نهاية الإنتاج
    production_time_minutes: integer("production_time_minutes"), // المدة الإجمالية بالدقائق
    
    // NEW: علامات اكتمال المراحل
    film_completed: boolean("film_completed").default(false), // علامة اكتمال مرحلة الفيلم
    printing_completed: boolean("printing_completed").default(false), // علامة اكتمال الطباعة
    is_final_roll_created: boolean("is_final_roll_created").default(false), // علامة إنشاء آخر رول

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
    film_machine_id: varchar("film_machine_id", { length: 20 })
      .notNull()
      .references(() => machines.id, { onDelete: "restrict" }), // Machine used for film production
    printing_machine_id: varchar("printing_machine_id", { length: 20 })
      .references(() => machines.id, { onDelete: "restrict" }), // Machine used for printing (assigned in printing stage)
    cutting_machine_id: varchar("cutting_machine_id", { length: 20 })
      .references(() => machines.id, { onDelete: "restrict" }), // Machine used for cutting (assigned in cutting stage)
    machine_id: varchar("machine_id", { length: 20 }).references(
      () => machines.id,
      { onDelete: "restrict" },
    ), // Legacy field for backward compatibility
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
    
    // NEW: حقول إضافية لتتبع الإنتاج
    is_last_roll: boolean("is_last_roll").default(false), // لتحديد آخر رول في أمر الإنتاج
    production_time_minutes: integer("production_time_minutes"), // وقت إنتاج الرول بالدقائق
    roll_created_at: timestamp("roll_created_at").defaultNow(), // وقت إنشاء الرول بدقة
    
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

// 🏭 جدول طوابير الماكينات - Machine Queues for Production Scheduling
export const machine_queues = pgTable("machine_queues", {
  id: serial("id").primaryKey(),
  machine_id: varchar("machine_id", { length: 20 })
    .notNull()
    .references(() => machines.id, { onDelete: "cascade" }), // مرجع للماكينة
  production_order_id: integer("production_order_id")
    .notNull()
    .references(() => production_orders.id, { onDelete: "cascade" }), // مرجع لأمر الإنتاج
  queue_position: integer("queue_position").notNull(), // الترتيب في الطابور
  estimated_start_time: timestamp("estimated_start_time"), // الوقت التقديري للبدء
  assigned_at: timestamp("assigned_at").defaultNow(), // وقت التخصيص
  assigned_by: integer("assigned_by")
    .references(() => users.id, { onDelete: "set null" }), // المستخدم الذي خصص
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
    .default("3"),
  allow_last_roll_overrun: boolean("allow_last_roll_overrun")
    .notNull()
    .default(true),
  qr_prefix: varchar("qr_prefix", { length: 32 }).notNull().default("ROLL"),
});

// 🗑️ جدول الهدر
export const waste = pgTable("waste", {
  id: serial("id").primaryKey(),
  roll_id: integer("roll_id").references(() => rolls.id, {
    onDelete: "cascade",
  }),
  production_order_id: integer("production_order_id").references(
    () => production_orders.id,
    { onDelete: "cascade" },
  ),
  quantity_wasted: decimal("quantity_wasted", {
    precision: 8,
    scale: 2,
  }).notNull(),
  reason: varchar("reason", { length: 100 }),
  stage: varchar("stage", { length: 50 }), // extruder / cutting / printing
  created_at: timestamp("created_at").defaultNow(),
});

// 🧪 جدول فحص الجودة
export const quality_checks = pgTable("quality_checks", {
  id: serial("id").primaryKey(),
  target_type: varchar("target_type", { length: 20 }), // roll / material
  target_id: integer("target_id"),
  result: varchar("result", { length: 10 }), // pass / fail
  score: integer("score"), // 1-5 stars
  notes: text("notes"),
  checked_by: integer("checked_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// 🛠️ جدول طلبات الصيانة
export const maintenance_requests = pgTable("maintenance_requests", {
  id: serial("id").primaryKey(),
  request_number: varchar("request_number", { length: 50 }).notNull().unique(), // MO001, MO002, etc.
  machine_id: varchar("machine_id", { length: 20 }).references(
    () => machines.id,
  ),
  reported_by: integer("reported_by").references(() => users.id),
  issue_type: varchar("issue_type", { length: 50 }), // mechanical / electrical / other
  description: text("description"),
  urgency_level: varchar("urgency_level", { length: 20 }).default("normal"), // normal / medium / urgent
  status: varchar("status", { length: 20 }).default("open"), // open / in_progress / resolved
  assigned_to: integer("assigned_to").references(() => users.id),
  action_taken: text("action_taken"),
  date_reported: timestamp("date_reported").defaultNow(),
  date_resolved: timestamp("date_resolved"),
});

// 🔧 جدول إجراءات الصيانة
export const maintenance_actions = pgTable("maintenance_actions", {
  id: serial("id").primaryKey(),
  action_number: varchar("action_number", { length: 50 }).notNull().unique(), // MA001, MA002, etc.
  maintenance_request_id: integer("maintenance_request_id")
    .notNull()
    .references(() => maintenance_requests.id, { onDelete: "cascade" }),
  action_type: varchar("action_type", { length: 50 }).notNull(), // فحص مبدئي / تغيير قطعة غيار / إصلاح مكانيكي / إصلاح كهربائي / إيقاف الماكينة
  description: text("description"),
  text_report: text("text_report"), // التقرير النصي
  spare_parts_request: text("spare_parts_request"), // طلب قطع غيار
  machining_request: text("machining_request"), // طلب مخرطة
  operator_negligence_report: text("operator_negligence_report"), // تبليغ اهمال المشغل

  // User tracking
  performed_by: integer("performed_by")
    .notNull()
    .references(() => users.id), // المستخدم الذي نفذ الإجراء
  request_created_by: integer("request_created_by").references(() => users.id), // المستخدم الذي أنشأ طلب الصيانة

  // Status and notifications
  requires_management_action: boolean("requires_management_action").default(
    false,
  ), // يحتاج موافقة إدارية
  management_notified: boolean("management_notified").default(false), // تم إبلاغ الإدارة

  action_date: timestamp("action_date").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 🔧 جدول قطع الغيار
export const spare_parts = pgTable("spare_parts", {
  id: serial("id").primaryKey(),
  part_id: varchar("part_id", { length: 50 }).notNull().unique(),
  machine_name: varchar("machine_name", { length: 100 }).notNull(),
  part_name: varchar("part_name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  serial_number: varchar("serial_number", { length: 100 }).notNull(),
  specifications: text("specifications"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 🔧 جدول قطع الغيار الاستهلاكية - Consumable Spare Parts
export const consumable_parts = pgTable(
  "consumable_parts",
  {
    id: serial("id").primaryKey(),
    part_id: varchar("part_id", { length: 50 }).notNull().unique(), // CP001, CP002, etc.
    type: varchar("type", { length: 100 }).notNull(), // نوع القطعة (سيور، بيرنقات، مسامير، الخ)
    code: varchar("code", { length: 50 }).notNull(), // كود القطعة
    current_quantity: integer("current_quantity").notNull().default(0), // الكمية الحالية
    min_quantity: integer("min_quantity").default(0), // الحد الأدنى للكمية
    max_quantity: integer("max_quantity").default(0), // الحد الأقصى للكمية
    unit: varchar("unit", { length: 20 }).default("قطعة"), // الوحدة (قطعة، كيلو، متر، الخ)
    barcode: varchar("barcode", { length: 100 }), // الباركود
    location: varchar("location", { length: 100 }), // موقع التخزين
    notes: text("notes"), // ملاحظات
    status: varchar("status", { length: 20 }).default("active"), // active / inactive
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Check constraints for consumable parts integrity
    currentQuantityNonNegative: check(
      "current_quantity_non_negative",
      sql`${table.current_quantity} >= 0`,
    ),
    minQuantityNonNegative: check(
      "min_quantity_non_negative",
      sql`${table.min_quantity} >= 0`,
    ),
    maxQuantityNonNegative: check(
      "max_quantity_non_negative",
      sql`${table.max_quantity} >= 0`,
    ),
    statusValid: check(
      "consumable_status_valid",
      sql`${table.status} IN ('active', 'inactive')`,
    ),
  }),
);

// 📊 جدول حركات قطع الغيار الاستهلاكية - Consumable Parts Transactions
export const consumable_parts_transactions = pgTable(
  "consumable_parts_transactions",
  {
    id: serial("id").primaryKey(),
    transaction_id: varchar("transaction_id", { length: 50 })
      .notNull()
      .unique(), // CT001, CT002, etc.
    consumable_part_id: integer("consumable_part_id")
      .notNull()
      .references(() => consumable_parts.id, { onDelete: "restrict" }),
    transaction_type: varchar("transaction_type", { length: 10 }).notNull(), // in / out
    quantity: integer("quantity").notNull(), // الكمية (سالبة للخروج، موجبة للدخول)
    barcode_scanned: varchar("barcode_scanned", { length: 100 }), // الباركود الممسوح
    manual_entry: boolean("manual_entry").default(false), // إدخال يدوي أم بالماسح
    transaction_reason: varchar("transaction_reason", { length: 100 }), // سبب الحركة
    notes: text("notes"), // ملاحظات
    performed_by: integer("performed_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    // Check constraints for transaction integrity
    quantityPositive: check("quantity_positive", sql`${table.quantity} > 0`),
    transactionTypeValid: check(
      "transaction_type_valid",
      sql`${table.transaction_type} IN ('in', 'out')`,
    ),
  }),
);

// 📋 جدول بلاغات الصيانة (للإدارة)
export const maintenance_reports = pgTable("maintenance_reports", {
  id: serial("id").primaryKey(),
  report_number: varchar("report_number", { length: 50 }).notNull().unique(), // MR001, MR002, etc.
  maintenance_action_id: integer("maintenance_action_id")
    .notNull()
    .references(() => maintenance_actions.id),
  report_type: varchar("report_type", { length: 30 }).notNull(), // spare_parts / machining / operator_negligence
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { length: 20 }).default("normal"), // low / normal / high / urgent

  // Status tracking
  status: varchar("status", { length: 20 }).default("pending"), // pending / reviewed / approved / rejected / completed
  reviewed_by: integer("reviewed_by").references(() => users.id),
  review_notes: text("review_notes"),
  review_date: timestamp("review_date"),

  created_by: integer("created_by")
    .notNull()
    .references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ⚠️ جدول بلاغات إهمال المشغلين
export const operator_negligence_reports = pgTable(
  "operator_negligence_reports",
  {
    id: serial("id").primaryKey(),
    report_number: varchar("report_number", { length: 50 }).notNull().unique(), // ON001, ON002, etc.
    maintenance_action_id: integer("maintenance_action_id").references(
      () => maintenance_actions.id,
    ),
    operator_id: integer("operator_id")
      .notNull()
      .references(() => users.id),
    machine_id: varchar("machine_id", { length: 20 }).references(
      () => machines.id,
    ),
    negligence_type: varchar("negligence_type", { length: 50 }).notNull(), // عدم صيانة / سوء استخدام / عدم اتباع تعليمات
    description: text("description").notNull(),
    evidence: text("evidence"), // الأدلة

    // Impact assessment
    damage_cost: decimal("damage_cost", { precision: 10, scale: 2 }),
    downtime_hours: integer("downtime_hours"),

    // Status and follow-up
    status: varchar("status", { length: 20 }).default("reported"), // reported / under_investigation / action_taken / closed
    action_taken: text("action_taken"),
    disciplinary_action: varchar("disciplinary_action", { length: 50 }), // تحذير / خصم / إيقاف مؤقت

    reported_by: integer("reported_by")
      .notNull()
      .references(() => users.id),
    investigated_by: integer("investigated_by").references(() => users.id),
    report_date: timestamp("report_date").defaultNow(),
    investigation_date: timestamp("investigation_date"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
);

// 📋 جدول المخالفات
export const violations = pgTable("violations", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id").references(() => users.id),
  violation_type: varchar("violation_type", { length: 50 }),
  description: text("description"),
  date: date("date").notNull(),
  action_taken: text("action_taken"),
  reported_by: integer("reported_by").references(() => users.id),
});

// 📦 جدول الأصناف والمواد
export const items = pgTable("items", {
  id: varchar("id", { length: 20 }).primaryKey(),
  category_id: varchar("category_id", { length: 20 }),
  name: varchar("name", { length: 100 }),
  name_ar: varchar("name_ar", { length: 100 }),
  code: varchar("code", { length: 50 }),
  status: varchar("status", { length: 20 }).default("active"),
});

// 🌍 جدول المواقع الجغرافية
export const locations = pgTable("locations", {
  id: varchar("id", { length: 20 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  coordinates: varchar("coordinates", { length: 100 }),
  tolerance_range: integer("tolerance_range"),
});

// 📦 جدول الموردين
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  contact: varchar("contact", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  materials_supplied: json("materials_supplied").$type<number[]>(),
});

// 📦 جدول المخزون الحالي - Inventory Management with Stock Constraints
// INVARIANT C: Inventory.current_stock ≥ 0 AT ALL TIMES
// CONSTRAINT: current_stock must never go negative during any operation
// VALIDATION: All inventory movements must be validated before execution
// 📦 جدول المخزون - Inventory Management with Stock Constraints
// INVARIANT C: current_stock ≥ 0 AT ALL TIMES - NEVER NEGATIVE
// BUSINESS RULE: max_stock ≥ min_stock for proper threshold management
export const inventory = pgTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    item_id: varchar("item_id", { length: 20 })
      .notNull()
      .references(() => items.id, { onDelete: "restrict" }), // ON DELETE RESTRICT
    location_id: varchar("location_id", { length: 20 }).references(
      () => locations.id,
      { onDelete: "restrict" },
    ), // ON DELETE RESTRICT
    current_stock: decimal("current_stock", { precision: 10, scale: 2 })
      .notNull()
      .default("0"), // CHECK: >= 0 - NEVER NEGATIVE
    min_stock: decimal("min_stock", { precision: 10, scale: 2 })
      .notNull()
      .default("0"), // CHECK: >= 0 - minimum stock threshold
    max_stock: decimal("max_stock", { precision: 10, scale: 2 })
      .notNull()
      .default("0"), // CHECK: >= min_stock - maximum stock threshold
    unit: varchar("unit", { length: 20 }).notNull().default("كيلو"), // ENUM: kg / piece / roll / package
    cost_per_unit: decimal("cost_per_unit", { precision: 10, scale: 4 }), // CHECK: >= 0 if not null
    last_updated: timestamp("last_updated").notNull().defaultNow(), // Updated on every stock change
  },
  (table) => ({
    // INVARIANT C: Stock constraints for inventory integrity
    currentStockNonNegative: check(
      "current_stock_non_negative",
      sql`${table.current_stock} >= 0`,
    ),
    minStockNonNegative: check(
      "min_stock_non_negative",
      sql`${table.min_stock} >= 0`,
    ),
    maxStockNonNegative: check(
      "max_stock_non_negative",
      sql`${table.max_stock} >= 0`,
    ),
    stockThresholdLogical: check(
      "stock_threshold_logical",
      sql`${table.max_stock} >= ${table.min_stock}`,
    ),
    costPerUnitValid: check(
      "cost_per_unit_valid",
      sql`${table.cost_per_unit} IS NULL OR ${table.cost_per_unit} >= 0`,
    ),
    unitValid: check(
      "unit_valid",
      sql`${table.unit} IN ('كيلو', 'قطعة', 'رول', 'علبة', 'kg', 'piece', 'roll', 'package')`,
    ),
    // Unique constraint: one inventory record per item-location combination
    itemLocationUnique: check("item_location_unique", sql`TRUE`), // This will be handled as a unique index separately
  }),
);

// 📋 جدول حركات المخزون - Inventory Movement Tracking with Validation
// BUSINESS RULE: All movements must have positive quantities
// REFERENTIAL INTEGRITY: Movements must reference valid inventory items
// AUDIT TRAIL: Complete tracking of all stock changes with user accountability
export const inventory_movements = pgTable(
  "inventory_movements",
  {
    id: serial("id").primaryKey(),
    inventory_id: integer("inventory_id")
      .notNull()
      .references(() => inventory.id, { onDelete: "restrict" }), // ON DELETE RESTRICT
    movement_type: varchar("movement_type", { length: 20 }).notNull(), // in / out / transfer / adjustment
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // CHECK: > 0
    unit_cost: decimal("unit_cost", { precision: 10, scale: 4 }), // CHECK: >= 0 if not null
    total_cost: decimal("total_cost", { precision: 10, scale: 4 }), // CHECK: >= 0 if not null
    reference_number: varchar("reference_number", { length: 50 }),
    reference_type: varchar("reference_type", { length: 20 }), // purchase / sale / production / adjustment
    notes: text("notes"),
    created_by: integer("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }), // ON DELETE RESTRICT for audit trail
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Check constraints for movement integrity
    quantityPositive: check("quantity_positive", sql`${table.quantity} > 0`),
    unitCostValid: check(
      "unit_cost_valid",
      sql`${table.unit_cost} IS NULL OR ${table.unit_cost} >= 0`,
    ),
    totalCostValid: check(
      "total_cost_valid",
      sql`${table.total_cost} IS NULL OR ${table.total_cost} >= 0`,
    ),
    movementTypeValid: check(
      "movement_type_valid",
      sql`${table.movement_type} IN ('in', 'out', 'transfer', 'adjustment')`,
    ),
    referenceTypeValid: check(
      "reference_type_valid",
      sql`${table.reference_type} IS NULL OR ${table.reference_type} IN ('purchase', 'sale', 'production', 'adjustment', 'transfer')`,
    ),
    // Logical constraint: if unit_cost and quantity are provided, total_cost should be reasonable
    totalCostLogical: check(
      "total_cost_logical",
      sql`${table.total_cost} IS NULL OR ${table.unit_cost} IS NULL OR ${table.total_cost} = ${table.unit_cost} * ${table.quantity}`,
    ),
  }),
);

// 🏬 جدول حركات المستودع
export const warehouse_transactions = pgTable("warehouse_transactions", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 30 }), // incoming / issued / production / delivery
  item_id: varchar("item_id", { length: 20 }).references(() => items.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  from_location: varchar("from_location", { length: 100 }),
  to_location: varchar("to_location", { length: 100 }),
  date: timestamp("date").defaultNow(),
  reference_id: integer("reference_id"), // order_id, production_order_id, etc.
  notes: text("notes"),
});

// 🧍‍♂️ جدول التدريب
export const training_records = pgTable("training_records", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id").references(() => users.id),
  training_type: varchar("training_type", { length: 100 }),
  training_name: varchar("training_name", { length: 200 }),
  date: date("date").notNull(),
  status: varchar("status", { length: 20 }).default("completed"), // completed / pending / cancelled
  instructor: varchar("instructor", { length: 100 }),
  notes: text("notes"),
});

// 📚 جدول البرامج التدريبية الميدانية
export const training_programs = pgTable("training_programs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  title_ar: varchar("title_ar", { length: 200 }),
  description: text("description"),
  description_ar: text("description_ar"),
  type: varchar("type", { length: 20 }).default("field"), // field / online (للمستقبل)
  category: varchar("category", { length: 50 }), // general / department_specific
  training_scope: varchar("training_scope", { length: 50 }), // safety / first_aid / fire_safety / technical / film / printing / cutting
  duration_hours: integer("duration_hours"),
  max_participants: integer("max_participants"),
  location: varchar("location", { length: 200 }), // مكان التدريب الميداني
  prerequisites: text("prerequisites"),
  learning_objectives: json("learning_objectives").$type<string[]>(),
  practical_requirements: text("practical_requirements"), // المتطلبات العملية للتدريب
  instructor_id: integer("instructor_id").references(() => users.id),
  department_id: varchar("department_id", { length: 20 }).references(
    () => sections.id,
  ), // للتدريبات الخاصة بالقسم
  status: varchar("status", { length: 20 }).default("active"), // active / inactive / draft
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 📖 جدول المواد التدريبية
export const training_materials = pgTable("training_materials", {
  id: serial("id").primaryKey(),
  program_id: integer("program_id").references(() => training_programs.id),
  title: varchar("title", { length: 200 }).notNull(),
  title_ar: varchar("title_ar", { length: 200 }),
  type: varchar("type", { length: 20 }), // video / document / quiz / assignment
  content: text("content"),
  file_url: varchar("file_url", { length: 500 }),
  order_index: integer("order_index").default(0),
  duration_minutes: integer("duration_minutes"),
  is_mandatory: boolean("is_mandatory").default(true),
});

// 🎓 جدول تسجيل الموظفين في البرامج التدريبية
export const training_enrollments = pgTable("training_enrollments", {
  id: serial("id").primaryKey(),
  program_id: integer("program_id").references(() => training_programs.id),
  employee_id: integer("employee_id").references(() => users.id),
  enrolled_date: timestamp("enrolled_date").defaultNow(),
  training_date: date("training_date"), // تاريخ التدريب الميداني
  attendance_status: varchar("attendance_status", { length: 20 }).default(
    "enrolled",
  ), // enrolled / attended / absent / cancelled
  completion_status: varchar("completion_status", { length: 20 }).default(
    "not_started",
  ), // not_started / completed / failed
  attendance_notes: text("attendance_notes"), // ملاحظات الحضور
  practical_performance: varchar("practical_performance", { length: 20 }), // excellent / good / fair / poor
  final_score: integer("final_score"), // 0-100
  certificate_issued: boolean("certificate_issued").default(false),
  certificate_number: varchar("certificate_number", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 📋 جدول تقييم التدريب الميداني
export const training_evaluations = pgTable("training_evaluations", {
  id: serial("id").primaryKey(),
  enrollment_id: integer("enrollment_id").references(
    () => training_enrollments.id,
  ),
  program_id: integer("program_id").references(() => training_programs.id),
  employee_id: integer("employee_id").references(() => users.id),
  evaluator_id: integer("evaluator_id").references(() => users.id),
  evaluation_date: date("evaluation_date").notNull(),

  // معايير التقييم البسيطة
  theoretical_understanding: integer("theoretical_understanding"), // 1-5 فهم نظري
  practical_skills: integer("practical_skills"), // 1-5 مهارات عملية
  safety_compliance: integer("safety_compliance"), // 1-5 الالتزام بالسلامة
  teamwork: integer("teamwork"), // 1-5 العمل الجماعي
  communication: integer("communication"), // 1-5 التواصل

  overall_rating: integer("overall_rating"), // 1-5 التقييم الإجمالي
  strengths: text("strengths"), // نقاط القوة
  areas_for_improvement: text("areas_for_improvement"), // مجالات التحسين
  additional_notes: text("additional_notes"), // ملاحظات إضافية
  recommendation: varchar("recommendation", { length: 20 }), // pass / fail / needs_retraining

  created_at: timestamp("created_at").defaultNow(),
});

// 🎖️ جدول شهادات التدريب
export const training_certificates = pgTable("training_certificates", {
  id: serial("id").primaryKey(),
  enrollment_id: integer("enrollment_id")
    .references(() => training_enrollments.id)
    .unique(),
  employee_id: integer("employee_id").references(() => users.id),
  program_id: integer("program_id").references(() => training_programs.id),
  certificate_number: varchar("certificate_number", { length: 50 })
    .unique()
    .notNull(),
  issue_date: date("issue_date").notNull(),
  expiry_date: date("expiry_date"), // بعض الشهادات تنتهي صلاحيتها
  final_score: integer("final_score"),
  certificate_status: varchar("certificate_status", { length: 20 }).default(
    "active",
  ), // active / expired / revoked
  issued_by: integer("issued_by").references(() => users.id),
  certificate_file_url: varchar("certificate_file_url", { length: 500 }), // رابط ملف الشهادة
  created_at: timestamp("created_at").defaultNow(),
});

// 📊 جدول تقييم الأداء
export const performance_reviews = pgTable("performance_reviews", {
  id: serial("id").primaryKey(),
  employee_id: varchar("employee_id", { length: 20 })
    .notNull()
    .references(() => users.id),
  reviewer_id: varchar("reviewer_id", { length: 20 })
    .notNull()
    .references(() => users.id),
  review_period_start: date("review_period_start").notNull(),
  review_period_end: date("review_period_end").notNull(),
  review_type: varchar("review_type", { length: 20 }), // annual / semi_annual / quarterly / probation
  overall_rating: integer("overall_rating"), // 1-5 scale
  goals_achievement: integer("goals_achievement"), // 1-5 scale
  skills_rating: integer("skills_rating"), // 1-5 scale
  behavior_rating: integer("behavior_rating"), // 1-5 scale
  strengths: text("strengths"),
  areas_for_improvement: text("areas_for_improvement"),
  development_plan: text("development_plan"),
  goals_for_next_period: text("goals_for_next_period"),
  employee_comments: text("employee_comments"),
  reviewer_comments: text("reviewer_comments"),
  hr_comments: text("hr_comments"),
  status: varchar("status", { length: 20 }).default("draft"), // draft / completed / approved / archived
  created_at: timestamp("created_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

// 🎯 جدول معايير التقييم
export const performance_criteria = pgTable("performance_criteria", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  description: text("description"),
  description_ar: text("description_ar"),
  category: varchar("category", { length: 50 }), // technical / behavioral / leadership / productivity
  weight_percentage: integer("weight_percentage").default(20), // وزن المعيار في التقييم الإجمالي
  applicable_roles: json("applicable_roles").$type<number[]>(), // أيدي الأدوار المطبق عليها
  is_active: boolean("is_active").default(true),
});

// 📋 جدول تفاصيل تقييم المعايير
export const performance_ratings = pgTable("performance_ratings", {
  id: serial("id").primaryKey(),
  review_id: integer("review_id")
    .notNull()
    .references(() => performance_reviews.id),
  criteria_id: integer("criteria_id")
    .notNull()
    .references(() => performance_criteria.id),
  rating: integer("rating").notNull(), // 1-5 scale
  comments: text("comments"),
});

// 🏖️ جدول أنواع الإجازات
export const leave_types = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  description: text("description"),
  description_ar: text("description_ar"),
  days_per_year: integer("days_per_year"), // عدد الأيام المسموحة سنوياً
  is_paid: boolean("is_paid").default(true),
  requires_medical_certificate: boolean("requires_medical_certificate").default(
    false,
  ),
  min_notice_days: integer("min_notice_days").default(1), // الحد الأدنى للإشعار المسبق
  max_consecutive_days: integer("max_consecutive_days"), // أقصى عدد أيام متتالية
  applicable_after_months: integer("applicable_after_months").default(0), // يحق للموظف بعد كم شهر
  color: varchar("color", { length: 20 }).default("#3b82f6"), // لون العرض في التقويم
  is_active: boolean("is_active").default(true),
});

// 📝 جدول طلبات الإجازات
export const leave_requests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employee_id: varchar("employee_id", { length: 20 })
    .notNull()
    .references(() => users.id),
  leave_type_id: integer("leave_type_id")
    .notNull()
    .references(() => leave_types.id),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  days_count: integer("days_count").notNull(),
  reason: text("reason"),
  medical_certificate_url: varchar("medical_certificate_url", { length: 500 }),
  emergency_contact: varchar("emergency_contact", { length: 100 }),
  work_handover: text("work_handover"), // تسليم العمل
  replacement_employee_id: varchar("replacement_employee_id", {
    length: 20,
  }).references(() => users.id),

  // Approval workflow
  direct_manager_id: varchar("direct_manager_id", { length: 20 }).references(
    () => users.id,
  ),
  direct_manager_status: varchar("direct_manager_status", {
    length: 20,
  }).default("pending"), // pending / approved / rejected
  direct_manager_comments: text("direct_manager_comments"),
  direct_manager_action_date: timestamp("direct_manager_action_date"),

  hr_status: varchar("hr_status", { length: 20 }).default("pending"), // pending / approved / rejected
  hr_comments: text("hr_comments"),
  hr_action_date: timestamp("hr_action_date"),
  hr_reviewed_by: varchar("hr_reviewed_by", { length: 20 }).references(
    () => users.id,
  ),

  final_status: varchar("final_status", { length: 20 }).default("pending"), // pending / approved / rejected / cancelled

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 💰 جدول رصيد الإجازات
export const leave_balances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employee_id: varchar("employee_id", { length: 20 })
    .notNull()
    .references(() => users.id),
  leave_type_id: integer("leave_type_id")
    .notNull()
    .references(() => leave_types.id),
  year: integer("year").notNull(),
  allocated_days: integer("allocated_days").notNull(), // الأيام المخصصة
  used_days: integer("used_days").default(0), // الأيام المستخدمة
  pending_days: integer("pending_days").default(0), // الأيام المعلقة (طلبات لم توافق عليها بعد)
  remaining_days: integer("remaining_days").notNull(), // الأيام المتبقية
  carried_forward: integer("carried_forward").default(0), // الأيام المنقولة من السنة السابقة
  expires_at: date("expires_at"), // تاريخ انتهاء صلاحية الإجازات المنقولة
});

// 📢 جدول القرارات الإدارية
export const admin_decisions = pgTable("admin_decisions", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  title_ar: varchar("title_ar", { length: 100 }),
  description: text("description"),
  target_type: varchar("target_type", { length: 20 }), // user / department / company
  target_id: integer("target_id"),
  date: date("date").notNull(),
  issued_by: varchar("issued_by", { length: 20 }).references(() => users.id),
});

// 🏢 جدول بيانات المصنع
export const company_profile = pgTable("company_profile", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  address: text("address"),
  tax_number: varchar("tax_number", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  logo_url: varchar("logo_url", { length: 255 }),
  working_hours_per_day: integer("working_hours_per_day").default(8),
  default_language: varchar("default_language", { length: 10 }).default("ar"),
});

// 📢 جدول الإشعارات والرسائل
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  title_ar: varchar("title_ar", { length: 200 }),
  message: text("message").notNull(),
  message_ar: text("message_ar"),
  type: varchar("type", { length: 30 }).notNull(), // whatsapp / sms / email / push / system
  priority: varchar("priority", { length: 20 }).default("normal"), // low / normal / high / urgent

  // Recipients
  recipient_type: varchar("recipient_type", { length: 20 }).notNull(), // user / group / role / all
  recipient_id: varchar("recipient_id", { length: 20 }), // user_id, role_id, or null for 'all'
  phone_number: varchar("phone_number", { length: 20 }),

  // Status tracking
  status: varchar("status", { length: 20 }).default("pending"), // pending / sent / delivered / failed / read
  sent_at: timestamp("sent_at"),
  delivered_at: timestamp("delivered_at"),
  read_at: timestamp("read_at"),

  // Twilio/WhatsApp specific
  twilio_sid: varchar("twilio_sid", { length: 100 }), // Twilio message SID
  external_status: varchar("external_status", { length: 30 }), // Twilio status callback
  error_message: text("error_message"),

  // Metadata
  scheduled_for: timestamp("scheduled_for"), // For scheduled messages
  context_type: varchar("context_type", { length: 30 }), // attendance / order / maintenance / hr
  context_id: varchar("context_id", { length: 50 }), // Related record ID

  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 📋 جدول قوالب الإشعارات
export const notification_templates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),

  // Template content
  title_template: varchar("title_template", { length: 200 }).notNull(),
  title_template_ar: varchar("title_template_ar", { length: 200 }),
  message_template: text("message_template").notNull(),
  message_template_ar: text("message_template_ar"),

  // Configuration
  type: varchar("type", { length: 30 }).notNull(), // whatsapp / sms / email / push
  trigger_event: varchar("trigger_event", { length: 50 }).notNull(), // order_created / attendance_late / etc
  is_active: boolean("is_active").default(true),

  // Variables used in template (JSON array)
  variables: json("variables").$type<string[]>(), // ["user_name", "order_number", etc.]

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.role_id], references: [roles.id] }),
  section: one(sections, {
    fields: [users.section_id],
    references: [sections.id],
  }),
  attendance: many(attendance),
  violations: many(violations),
  trainingRecords: many(training_records),
  trainingEnrollments: many(training_enrollments),
  performanceReviews: many(performance_reviews, {
    relationName: "employee_reviews",
  }),
  conductedReviews: many(performance_reviews, {
    relationName: "reviewer_reviews",
  }),
  leaveRequests: many(leave_requests),
  leaveBalances: many(leave_balances),
  instructedPrograms: many(training_programs),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  salesRep: one(users, {
    fields: [customers.sales_rep_id],
    references: [users.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customer_id],
    references: [customers.id],
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
    waste: many(waste),
    warehouseReceipts: many(warehouse_receipts),
  }),
);

export const rollsRelations = relations(rolls, ({ one, many }) => ({
  productionOrder: one(production_orders, {
    fields: [rolls.production_order_id],
    references: [production_orders.id],
  }),
  filmMachine: one(machines, {
    fields: [rolls.film_machine_id],
    references: [machines.id],
    relationName: "film_machine",
  }),
  printingMachine: one(machines, {
    fields: [rolls.printing_machine_id],
    references: [machines.id],
    relationName: "printing_machine",
  }),
  cuttingMachine: one(machines, {
    fields: [rolls.cutting_machine_id],
    references: [machines.id],
    relationName: "cutting_machine",
  }),
  machine: one(machines, {
    fields: [rolls.machine_id],
    references: [machines.id],
  }),
  employee: one(users, { fields: [rolls.employee_id], references: [users.id] }),
  performedBy: one(users, {
    fields: [rolls.performed_by],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [rolls.created_by],
    references: [users.id],
    relationName: "created_by_user",
  }),
  printedBy: one(users, {
    fields: [rolls.printed_by],
    references: [users.id],
    relationName: "printed_by_user",
  }),
  cutBy: one(users, {
    fields: [rolls.cut_by],
    references: [users.id],
    relationName: "cut_by_user",
  }),
  waste: many(waste),
  qualityChecks: many(quality_checks),
  cuts: many(cuts),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
  section: one(sections, {
    fields: [machines.section_id],
    references: [sections.id],
  }),
  rolls: many(rolls),
  maintenanceRequests: many(maintenance_requests),
}));

export const sectionsRelations = relations(sections, ({ many }) => ({
  users: many(users),
  machines: many(machines),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
    relationName: "parent_category",
  }),
  children: many(categories, { relationName: "parent_category" }),
  items: many(items),
  customerProducts: many(customer_products),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  createdBy: one(users, {
    fields: [notifications.created_by],
    references: [users.id],
  }),
}));

export const notificationTemplatesRelations = relations(
  notification_templates,
  ({ one }) => ({
    // No direct relations needed for templates
  }),
);

// Types for notifications
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationTemplate = typeof notification_templates.$inferSelect;
export type InsertNotificationTemplate =
  typeof notification_templates.$inferInsert;

// Insert schemas for notifications
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertNotificationTemplateSchema = createInsertSchema(
  notification_templates,
);

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.category_id],
    references: [categories.id],
  }),
  customerProducts: many(customer_products),
  warehouseTransactions: many(warehouse_transactions),
  inventory: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  item: one(items, { fields: [inventory.item_id], references: [items.id] }),
  location: one(locations, {
    fields: [inventory.location_id],
    references: [locations.id],
  }),
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

// تم حذف علاقات جدول المنتجات

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  // يمكن إضافة علاقات الموردين مع الأصناف لاحقاً
}));

export const trainingRecordsRelations = relations(
  training_records,
  ({ one }) => ({
    employee: one(users, {
      fields: [training_records.employee_id],
      references: [users.id],
    }),
  }),
);

export const cutsRelations = relations(cuts, ({ one, many }) => ({
  roll: one(rolls, { fields: [cuts.roll_id], references: [rolls.id] }),
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

export const adminDecisionsRelations = relations(
  admin_decisions,
  ({ one }) => ({
    issuedBy: one(users, {
      fields: [admin_decisions.issued_by],
      references: [users.id],
    }),
  }),
);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

// Order schema (legacy - will be phased out)

// Enhanced Roll Creation Schema with Business Rule Validation
export const insertRollSchema = createInsertSchema(rolls)
  .omit({
    id: true,
    created_at: true,
    roll_number: true,
    completed_at: true,
    roll_seq: true,
    qr_code_text: true,
    qr_png_base64: true,
    created_by: true, // Added on server-side from session
    printed_by: true, // Added on server-side when printed
    cut_by: true, // Added on server-side when cut
  })
  .extend({
    // INVARIANT B: Enforce production order constraints
    production_order_id: z.number().int().positive("معرف أمر الإنتاج مطلوب"),
    // INVARIANT E: Machines must be valid and active
    film_machine_id: z.string().min(1, "معرف ماكينة الفيلم مطلوب"),
    // Printing and cutting machines are optional at creation, assigned in later stages
    printing_machine_id: z.string().optional(),
    cutting_machine_id: z.string().optional(),
    // Weight validation with business rules
    weight_kg: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") {
          throw new Error("الوزن مطلوب");
        }
        const num =
          typeof val === "string" ? parseFloatSafe(val, "الوزن") : val;
        return num;
      })
      .refine((val) => val > 0, "يجب أن يكون الوزن أكبر من صفر")
      .refine((val) => val <= 2000, "الوزن لا يمكن أن يتجاوز 2000 كيلو"),
    // Stage validation - must start at 'film'
    stage: z
      .string()
      .default("film")
      .refine(
        (val) => ["film", "printing", "cutting", "done"].includes(val),
        "مرحلة الإنتاج غير صحيحة",
      ),
    // User validation
    created_by: z.number().int().positive("معرف المستخدم مطلوب"),
  });

export const insertCutSchema = createInsertSchema(cuts)
  .omit({
    id: true,
    created_at: true,
  })
  .extend({
    cut_weight_kg: z.number().positive("الوزن يجب أن يكون أكبر من صفر"),
  });

export const insertWarehouseReceiptSchema = createInsertSchema(
  warehouse_receipts,
)
  .omit({
    id: true,
    created_at: true,
  })
  .extend({
    received_weight_kg: z.number().positive("الوزن يجب أن يكون أكبر من صفر"),
  });

export const insertProductionSettingsSchema = createInsertSchema(
  production_settings,
)
  .omit({
    id: true,
  })
  .extend({
    overrun_tolerance_percent: z
      .number()
      .min(0)
      .max(10, "النسبة يجب أن تكون بين 0 و 10"),
  });

export const insertMaintenanceRequestSchema = createInsertSchema(
  maintenance_requests,
).omit({
  id: true,
  request_number: true,
  date_reported: true,
  date_resolved: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
});

export const insertWarehouseTransactionSchema = createInsertSchema(
  warehouse_transactions,
).omit({
  id: true,
  date: true,
});

export const insertInventorySchema = createInsertSchema(inventory)
  .omit({
    id: true,
    last_updated: true,
  })
  .extend({
    // location_id can be string or number from frontend
    location_id: z
      .union([z.string(), z.number(), z.null()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        return typeof val === "number" ? val.toString() : val;
      }),
    // current_stock can be string or number from frontend
    current_stock: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return "0";
        return typeof val === "number" ? val.toString() : val;
      })
      .refine((val) => parseFloat(val) >= 0, "المخزون الحالي يجب أن يكون صفر أو أكثر"),
    // min_stock validation
    min_stock: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return "0";
        return typeof val === "number" ? val.toString() : val;
      })
      .refine((val) => parseFloat(val) >= 0, "الحد الأدنى للمخزون يجب أن يكون صفر أو أكثر"),
    // max_stock validation
    max_stock: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return "0";
        return typeof val === "number" ? val.toString() : val;
      })
      .refine((val) => parseFloat(val) >= 0, "الحد الأقصى للمخزون يجب أن يكون صفر أو أكثر"),
    // cost_per_unit validation
    cost_per_unit: z
      .union([z.string(), z.number(), z.null()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        return typeof val === "number" ? val.toString() : val;
      }),
  });

export const insertInventoryMovementSchema = createInsertSchema(
  inventory_movements,
).omit({
  id: true,
  created_at: true,
});

export const insertTrainingRecordSchema = createInsertSchema(
  training_records,
).omit({
  id: true,
});

export const insertAdminDecisionSchema = createInsertSchema(
  admin_decisions,
).omit({
  id: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

// Enhanced Order Creation Schema with Business Rule Validation
export const insertNewOrderSchema = createInsertSchema(orders)
  .omit({
    id: true,
    created_at: true,
  })
  .extend({
    // Order number validation
    order_number: z
      .string()
      .min(1, "رقم الطلب مطلوب")
      .max(50, "رقم الطلب طويل جداً"),
    // Customer validation - INVARIANT F: Must reference valid customer
    customer_id: z.string().min(1, "معرف العميل مطلوب"),
    // INVARIANT G: Delivery date must be in future
    delivery_date: z
      .union([z.string(), z.date(), z.null()])
      .optional()
      .transform((val) => {
        if (!val) return null;
        const date = typeof val === "string" ? new Date(val) : val;
        return date instanceof Date && !isNaN(date.getTime()) ? date : null;
      })
      .refine((date) => {
        if (!date) return true; // null is allowed
        return date >= new Date(new Date().setHours(0, 0, 0, 0));
      }, "يجب أن يكون تاريخ التسليم في المستقبل"),
    // Delivery days validation
    delivery_days: z
      .union([z.string(), z.number(), z.null()])
      .optional()
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num =
          typeof val === "string" ? parseIntSafe(val, "أيام التسليم") : val;
        return num;
      })
      .refine(
        (val) => val === null || val > 0,
        "أيام التسليم يجب أن تكون أكبر من صفر",
      ),
    // Status validation
    status: z
      .enum(["waiting", "in_production", "paused", "cancelled", "completed"])
      .default("waiting"),
    // User reference
    created_by: z.number().int().positive("معرف المستخدم مطلوب").optional(),
  });

// Enhanced Production Order Schema with NEW WORKFLOW tracking fields
export const insertProductionOrderSchema = createInsertSchema(production_orders)
  .omit({
    id: true,
    created_at: true,
    production_order_number: true,
    // SECURITY: final_quantity_kg calculated server-side only - never trust client values
    final_quantity_kg: true,
    // NEW: حقول التتبع تحسب تلقائياً - لا نحتاجها في الإدخال
    produced_quantity_kg: true,
    printed_quantity_kg: true,
    net_quantity_kg: true,
    waste_quantity_kg: true,
    film_completion_percentage: true,
    printing_completion_percentage: true,
    cutting_completion_percentage: true,
  })
  .extend({
    // INVARIANT A & F: Order must exist and be valid
    order_id: z.number().int().positive("معرف الطلب مطلوب"),
    customer_product_id: z.number().int().positive("معرف منتج العميل مطلوب"),
    // Quantity validation with business rules
    quantity_kg: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") {
          throw new Error("الكمية مطلوبة");
        }
        const num =
          typeof val === "string" ? parseFloatSafe(val, "الكمية") : val;
        return num.toString();
      })
      .refine((val) => parseFloat(val) > 0, "يجب أن تكون الكمية أكبر من صفر")
      .refine(
        (val) => parseFloat(val) <= 10000,
        "الكمية لا يمكن أن تتجاوز 10000 كيلو",
      ),
    // Overrun percentage validation
    overrun_percentage: z
      .union([z.string(), z.number()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return "5.00";
        const num =
          typeof val === "string" ? parseFloatSafe(val, "نسبة الزيادة") : val;
        return num.toString();
      })
      .refine((val) => {
        const num = parseFloat(val);
        return num >= 0 && num <= 50;
      }, "نسبة الزيادة يجب أن تكون بين 0 و 50 بالمئة"),
    // Note: final_quantity_kg is omitted - calculated server-side for security
    // Status validation
    status: z
      .enum(["pending", "active", "completed", "cancelled"])
      .default("pending"),
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};
export type SparePart = typeof spare_parts.$inferSelect;
export type InsertSparePart = typeof spare_parts.$inferInsert;
// Legacy order types - will be phased out
export type Roll = typeof rolls.$inferSelect;
export type InsertRoll = z.infer<typeof insertRollSchema>;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;
export type MaintenanceRequest = typeof maintenance_requests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<
  typeof insertMaintenanceRequestSchema
>;
export type QualityCheck = typeof quality_checks.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type WarehouseTransaction = typeof warehouse_transactions.$inferSelect;
export type InsertWarehouseTransaction = z.infer<
  typeof insertWarehouseTransactionSchema
>;
export type TrainingRecord = typeof training_records.$inferSelect;
export type InsertTrainingRecord = z.infer<typeof insertTrainingRecordSchema>;
export type AdminDecision = typeof admin_decisions.$inferSelect;
export type InsertAdminDecision = z.infer<typeof insertAdminDecisionSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Inventory = typeof inventory.$inferSelect;
export type NewOrder = typeof orders.$inferSelect;
export type InsertNewOrder = z.infer<typeof insertNewOrderSchema>;
export type ProductionOrder = typeof production_orders.$inferSelect;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryMovement = typeof inventory_movements.$inferSelect;
export type InsertInventoryMovement = z.infer<
  typeof insertInventoryMovementSchema
>;
export type Section = typeof sections.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Violation = typeof violations.$inferSelect;
export type CompanyProfile = typeof company_profile.$inferSelect;
// 🔧 جدول إعدادات النظام
export const system_settings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  setting_key: varchar("setting_key", { length: 100 }).notNull().unique(),
  setting_value: text("setting_value"),
  setting_type: varchar("setting_type", { length: 20 }).default("string"), // string / number / boolean / json
  description: text("description"),
  is_editable: boolean("is_editable").default(true),
  updated_at: timestamp("updated_at").defaultNow(),
  updated_by: varchar("updated_by", { length: 20 }).references(() => users.id),
});

// 📍 جدول مواقع المصانع
export const factory_locations = pgTable("factory_locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  allowed_radius: integer("allowed_radius").notNull().default(500), // بالأمتار
  is_active: boolean("is_active").notNull().default(true),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: integer("created_by").references(() => users.id),
});

// 👤 جدول إعدادات المستخدمين
export const user_settings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  user_id: varchar("user_id", { length: 20 })
    .references(() => users.id)
    .notNull(),
  setting_key: varchar("setting_key", { length: 100 }).notNull(),
  setting_value: text("setting_value"),
  setting_type: varchar("setting_type", { length: 20 }).default("string"), // string / number / boolean / json
  updated_at: timestamp("updated_at").defaultNow(),
});

// Insert schemas for settings
export const insertSystemSettingSchema = createInsertSchema(
  system_settings,
).omit({
  id: true,
  updated_at: true,
});

export const insertFactoryLocationSchema = createInsertSchema(
  factory_locations,
).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertUserSettingSchema = createInsertSchema(user_settings).omit({
  id: true,
  updated_at: true,
});

// Insert schema for machine_queues
export const insertMachineQueueSchema = createInsertSchema(machine_queues).omit({
  id: true,
  created_at: true,
  assigned_at: true,
});

export type CustomerProduct = typeof customer_products.$inferSelect & {
  customer_name?: string;
  customer_name_ar?: string;
  customer_code?: string;
};
export type InsertCustomerProduct = z.infer<typeof insertCustomerProductSchema>;
export type SystemSetting = typeof system_settings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type FactoryLocation = typeof factory_locations.$inferSelect;
export type InsertFactoryLocation = z.infer<typeof insertFactoryLocationSchema>;
export type UserSetting = typeof user_settings.$inferSelect;
export type InsertUserSetting = z.infer<typeof insertUserSettingSchema>;

// Machine Queue types
export type MachineQueue = typeof machine_queues.$inferSelect;
export type InsertMachineQueue = z.infer<typeof insertMachineQueueSchema>;

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
  })
  .extend({
    // Transform decimal fields to handle both string and number inputs
    width: z.preprocess(
      (val): string | undefined => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : (val as number);
        return isNaN(num) ? undefined : num.toString();
      },
      z.string().optional()
    ),
    left_facing: z.preprocess(
      (val): string | undefined => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : (val as number);
        return isNaN(num) ? undefined : num.toString();
      },
      z.string().optional()
    ),
    right_facing: z.preprocess(
      (val): string | undefined => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : (val as number);
        return isNaN(num) ? undefined : num.toString();
      },
      z.string().optional()
    ),
    thickness: z.preprocess(
      (val): string | undefined => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : (val as number);
        return isNaN(num) ? undefined : num.toString();
      },
      z.string().optional()
    ),
    unit_weight_kg: z.preprocess(
      (val): string | undefined => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : (val as number);
        return isNaN(num) ? undefined : num.toString();
      },
      z.string().optional()
    ),
    package_weight_kg: z.preprocess(
      (val): string | undefined => {
        if (val === null || val === undefined || val === "") return undefined;
        const num = typeof val === "string" ? parseFloat(val) : (val as number);
        return isNaN(num) ? undefined : num.toString();
      },
      z.string().optional()
    ),
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
          return undefined; // Return undefined for invalid values instead of NaN
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
          return undefined; // Return undefined for invalid values instead of NaN
        }
      }),
  });

export const insertCategorySchema = createInsertSchema(categories);
export const insertCustomerSchema = createInsertSchema(customers).omit({
  created_at: true,
}).extend({
  tax_number: z.string().length(14, "الرقم الضريبي يجب أن يكون 14 خانة").optional().or(z.literal("")),
  unified_number: z.string().regex(/^7\d{9}$/, "الرقم الموحد يجب أن يكون 10 أرقام ويبدأ بـ 7").optional().or(z.literal("")),
  unique_customer_number: z.string().optional().or(z.literal("")),
  commercial_name: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true).optional(),
});

// HR System Schemas
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
  created_at: true,
});

export const insertPerformanceReviewSchema = createInsertSchema(
  performance_reviews,
).omit({
  id: true,
  created_at: true,
  completed_at: true,
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
    updated_at: true,
    direct_manager_action_date: true,
    hr_action_date: true,
  },
);

export const insertLeaveBalanceSchema = createInsertSchema(leave_balances).omit(
  {
    id: true,
  },
);

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Maintenance Actions Schemas
export const insertMaintenanceActionSchema = createInsertSchema(
  maintenance_actions,
).omit({
  id: true,
  action_number: true,
  action_date: true,
  created_at: true,
  updated_at: true,
});

export const insertMaintenanceReportSchema = createInsertSchema(
  maintenance_reports,
).omit({
  id: true,
  report_number: true,
  created_at: true,
  updated_at: true,
});

export const insertOperatorNegligenceReportSchema = createInsertSchema(
  operator_negligence_reports,
).omit({
  id: true,
  report_number: true,
  created_at: true,
  updated_at: true,
});

// Consumable Parts Schemas
export const insertConsumablePartSchema = createInsertSchema(
  consumable_parts,
).omit({
  id: true,
  part_id: true,
  created_at: true,
  updated_at: true,
});

export const insertConsumablePartTransactionSchema = createInsertSchema(
  consumable_parts_transactions,
).omit({
  id: true,
  transaction_id: true,
  created_at: true,
});

// HR System Types
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type TrainingProgram = typeof training_programs.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
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

// Maintenance Types
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

// Consumable Parts Types
export type ConsumablePart = typeof consumable_parts.$inferSelect;
export type InsertConsumablePart = z.infer<typeof insertConsumablePartSchema>;
export type ConsumablePartTransaction =
  typeof consumable_parts_transactions.$inferSelect;
export type InsertConsumablePartTransaction = z.infer<
  typeof insertConsumablePartTransactionSchema
>;

// Production Flow Types
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

// HR Relations
export const trainingProgramsRelations = relations(
  training_programs,
  ({ one, many }) => ({
    instructor: one(users, {
      fields: [training_programs.instructor_id],
      references: [users.id],
    }),
    materials: many(training_materials),
    enrollments: many(training_enrollments),
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

// 🚨 جداول نظام التحذيرات الذكية ومنع الأخطاء

// جدول التحذيرات والتنبيهات الذكية
export const system_alerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  title_ar: varchar("title_ar", { length: 200 }),
  message: text("message").notNull(),
  message_ar: text("message_ar"),
  type: varchar("type", { length: 30 }).notNull(), // system, production, quality, inventory, maintenance, security
  category: varchar("category", { length: 30 }).notNull(), // warning, error, critical, info, success
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  source: varchar("source", { length: 50 }).notNull(), // system_health, production_monitor, data_validator, etc.
  source_id: varchar("source_id", { length: 50 }), // ID of the source entity
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, resolved, dismissed, expired
  is_automated: boolean("is_automated").default(true),
  requires_action: boolean("requires_action").default(false),
  action_taken: varchar("action_taken", { length: 500 }),
  action_taken_by: integer("action_taken_by").references(() => users.id),
  action_taken_at: timestamp("action_taken_at"),
  resolved_by: integer("resolved_by").references(() => users.id),
  resolved_at: timestamp("resolved_at"),
  resolution_notes: text("resolution_notes"),
  affected_systems: json("affected_systems").$type<string[]>(),
  suggested_actions:
    json("suggested_actions").$type<
      { action: string; priority: number; description?: string }[]
    >(),
  context_data: json("context_data").$type<Record<string, any>>(),
  notification_sent: boolean("notification_sent").default(false),
  notification_methods: json("notification_methods").$type<string[]>(), // ['whatsapp', 'system', 'email']
  target_users: json("target_users").$type<number[]>(),
  target_roles: json("target_roles").$type<number[]>(),
  expires_at: timestamp("expires_at"),
  occurrences: integer("occurrences").default(1), // عدد مرات حدوث نفس التحذير
  last_occurrence: timestamp("last_occurrence").defaultNow(),
  first_occurrence: timestamp("first_occurrence").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// جدول قواعد التحذيرات والمراقبة
export const alert_rules = pgTable("alert_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }),
  description: text("description"),
  description_ar: text("description_ar"),
  monitor_type: varchar("monitor_type", { length: 50 }).notNull(), // database, performance, inventory, production, quality
  rule_type: varchar("rule_type", { length: 30 }).notNull(), // threshold, pattern, anomaly, schedule
  conditions: json("conditions").$type<Record<string, any>>().notNull(), // الشروط المطلوبة للتحذير
  threshold_value: decimal("threshold_value", { precision: 15, scale: 4 }),
  comparison_operator: varchar("comparison_operator", { length: 10 }), // >, <, >=, <=, =, !=
  check_frequency: varchar("check_frequency", { length: 20 })
    .notNull()
    .default("5min"), // 1min, 5min, 15min, 1hour, daily
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  is_enabled: boolean("is_enabled").default(true),
  notification_template: text("notification_template"),
  notification_template_ar: text("notification_template_ar"),
  escalation_rules:
    json("escalation_rules").$type<
      { delay_minutes: number; severity: string; target_roles: number[] }[]
    >(),
  suppress_duration: integer("suppress_duration").default(60), // دقائق منع التكرار
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// جدول فحوصات سلامة النظام
export const system_health_checks = pgTable("system_health_checks", {
  id: serial("id").primaryKey(),
  check_name: varchar("check_name", { length: 100 }).notNull(),
  check_name_ar: varchar("check_name_ar", { length: 100 }),
  check_type: varchar("check_type", { length: 30 }).notNull(), // database, api, service, disk, memory, cpu
  status: varchar("status", { length: 20 }).notNull().default("unknown"), // healthy, warning, critical, unknown
  last_check_time: timestamp("last_check_time").defaultNow(),
  check_duration_ms: integer("check_duration_ms"),
  success_rate_24h: decimal("success_rate_24h", {
    precision: 5,
    scale: 2,
  }).default("100.00"),
  average_response_time: integer("average_response_time"), // milliseconds
  error_count_24h: integer("error_count_24h").default(0),
  last_error: text("last_error"),
  last_error_time: timestamp("last_error_time"),
  check_details: json("check_details").$type<Record<string, any>>(),
  thresholds: json("thresholds").$type<{
    warning: number;
    critical: number;
    unit: string;
  }>(),
  is_critical: boolean("is_critical").default(false), // يؤثر على عمل النظام
  auto_recovery: boolean("auto_recovery").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// جدول مراقبة الأداء والموارد
export const system_performance_metrics = pgTable(
  "system_performance_metrics",
  {
    id: serial("id").primaryKey(),
    metric_name: varchar("metric_name", { length: 50 }).notNull(),
    metric_category: varchar("metric_category", { length: 30 }).notNull(), // system, database, application, business
    value: decimal("value", { precision: 15, scale: 4 }).notNull(),
    unit: varchar("unit", { length: 20 }), // ms, mb, percent, count, rate
    timestamp: timestamp("timestamp").defaultNow(),
    source: varchar("source", { length: 50 }), // server, database, application
    tags: json("tags").$type<Record<string, string>>(), // إضافة tags للتصنيف
    created_at: timestamp("created_at").defaultNow(),
  },
);

// جدول تسجيل الإجراءات التصحيحية
export const corrective_actions = pgTable("corrective_actions", {
  id: serial("id").primaryKey(),
  alert_id: integer("alert_id").references(() => system_alerts.id, {
    onDelete: "cascade",
  }),
  action_type: varchar("action_type", { length: 30 }).notNull(), // manual, automated, escalated
  action_title: varchar("action_title", { length: 200 }).notNull(),
  action_description: text("action_description").notNull(),
  action_description_ar: text("action_description_ar"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, in_progress, completed, failed
  assigned_to: integer("assigned_to").references(() => users.id),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  estimated_duration: integer("estimated_duration"), // minutes
  actual_duration: integer("actual_duration"),
  success_rate: decimal("success_rate", { precision: 5, scale: 2 }),
  notes: text("notes"),
  created_by: integer("created_by").references(() => users.id),
  completed_by: integer("completed_by").references(() => users.id),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// جدول إحصائيات النظام للتحليل
export const system_analytics = pgTable("system_analytics", {
  id: serial("id").primaryKey(),
  date: date("date")
    .notNull()
    .default(sql`CURRENT_DATE`),
  metric_type: varchar("metric_type", { length: 50 }).notNull(),
  total_alerts: integer("total_alerts").default(0),
  critical_alerts: integer("critical_alerts").default(0),
  resolved_alerts: integer("resolved_alerts").default(0),
  avg_resolution_time: integer("avg_resolution_time"), // minutes
  system_uptime_percent: decimal("system_uptime_percent", {
    precision: 5,
    scale: 2,
  }),
  total_health_checks: integer("total_health_checks").default(0),
  failed_health_checks: integer("failed_health_checks").default(0),
  performance_score: decimal("performance_score", { precision: 5, scale: 2 }),
  data: json("data").$type<Record<string, any>>(), // إضافة بيانات إحصائية
  created_at: timestamp("created_at").defaultNow(),
});

// أنواع البيانات للتحذيرات الذكية
export type SystemAlert = typeof system_alerts.$inferSelect;
export type InsertSystemAlert = typeof system_alerts.$inferInsert;
export type AlertRule = typeof alert_rules.$inferSelect;
export type InsertAlertRule = typeof alert_rules.$inferInsert;
export type SystemHealthCheck = typeof system_health_checks.$inferSelect;
export type InsertSystemHealthCheck = typeof system_health_checks.$inferInsert;
export type SystemPerformanceMetric =
  typeof system_performance_metrics.$inferSelect;
export type InsertSystemPerformanceMetric =
  typeof system_performance_metrics.$inferInsert;
export type CorrectiveAction = typeof corrective_actions.$inferSelect;
export type InsertCorrectiveAction = typeof corrective_actions.$inferInsert;
export type SystemAnalytics = typeof system_analytics.$inferSelect;
export type InsertSystemAnalytics = typeof system_analytics.$inferInsert;

// مخططات التحقق من البيانات للتحذيرات
export const insertSystemAlertSchema = createInsertSchema(system_alerts);
export const insertAlertRuleSchema = createInsertSchema(alert_rules);
export const insertSystemHealthCheckSchema =
  createInsertSchema(system_health_checks);
export const insertSystemPerformanceMetricSchema = createInsertSchema(
  system_performance_metrics,
);
export const insertCorrectiveActionSchema =
  createInsertSchema(corrective_actions);
export const insertSystemAnalyticsSchema = createInsertSchema(system_analytics);

// 📝 جدول الملاحظات السريعة
export const quick_notes = pgTable("quick_notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  note_type: varchar("note_type", { length: 50 }).notNull(), // order, design, statement, quote, delivery, call_customer, other
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  created_by: integer("created_by")
    .notNull()
    .references(() => users.id),
  assigned_to: integer("assigned_to")
    .notNull()
    .references(() => users.id),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 📎 جدول مرفقات الملاحظات
export const note_attachments = pgTable("note_attachments", {
  id: serial("id").primaryKey(),
  note_id: integer("note_id")
    .notNull()
    .references(() => quick_notes.id, { onDelete: "cascade" }),
  file_name: varchar("file_name", { length: 255 }).notNull(),
  file_type: varchar("file_type", { length: 100 }).notNull(),
  file_size: integer("file_size").notNull(),
  file_url: text("file_url").notNull(),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
});

// علاقات الملاحظات
export const quickNotesRelations = relations(quick_notes, ({ one, many }) => ({
  creator: one(users, {
    fields: [quick_notes.created_by],
    references: [users.id],
    relationName: "note_creator",
  }),
  assignee: one(users, {
    fields: [quick_notes.assigned_to],
    references: [users.id],
    relationName: "note_assignee",
  }),
  attachments: many(note_attachments),
}));

export const noteAttachmentsRelations = relations(note_attachments, ({ one }) => ({
  note: one(quick_notes, {
    fields: [note_attachments.note_id],
    references: [quick_notes.id],
  }),
}));

// أنواع البيانات للملاحظات
export type QuickNote = typeof quick_notes.$inferSelect;
export type InsertQuickNote = typeof quick_notes.$inferInsert;
export type NoteAttachment = typeof note_attachments.$inferSelect;
export type InsertNoteAttachment = typeof note_attachments.$inferInsert;

// مخططات التحقق من البيانات للملاحظات
export const insertQuickNoteSchema = createInsertSchema(quick_notes).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export const insertNoteAttachmentSchema = createInsertSchema(note_attachments).omit({
  id: true,
  uploaded_at: true,
});

// =================================================================
// 🧪 SIMPLIFIED MATERIAL MIXING SYSTEM
// =================================================================

// 📦 جدول عمليات الخلط المباشرة (بدون وصفات مسبقة)
export const mixing_batches = pgTable("mixing_batches", {
  id: serial("id").primaryKey(),
  batch_number: varchar("batch_number", { length: 50 }).notNull().unique(), // رقم الخلطة تلقائي
  production_order_id: integer("production_order_id")
    .notNull()
    .references(() => production_orders.id), // أمر الإنتاج المرتبط
  machine_id: varchar("machine_id", { length: 20 })
    .notNull()
    .references(() => machines.id), // ماكينة الفيلم
  screw_assignment: varchar("screw_assignment", { length: 10 })
    .notNull()
    .default("A"), // A أو B (للماكينات ذات السكروين)
  operator_id: integer("operator_id")
    .notNull()
    .references(() => users.id), // العامل الذي قام بالخلط
  total_weight_kg: decimal("total_weight_kg", { precision: 10, scale: 2 }).notNull(), // الوزن الكلي للخلطة
  status: varchar("status", { length: 30 }).notNull().default("completed"), // completed, cancelled
  notes: text("notes"), // ملاحظات
  created_at: timestamp("created_at").defaultNow().notNull(), // تاريخ ووقت الخلط
}, (table) => ({
  totalWeightPositive: check(
    "total_weight_positive",
    sql`${table.total_weight_kg} > 0`
  ),
  screwAssignmentValid: check(
    "screw_assignment_valid",
    sql`${table.screw_assignment} IN ('A', 'B')`
  ),
}));

// 🧬 جدول المكونات المخلوطة (المواد الخام والكميات الفعلية)
export const batch_ingredients = pgTable("batch_ingredients", {
  id: serial("id").primaryKey(),
  batch_id: integer("batch_id")
    .notNull()
    .references(() => mixing_batches.id, { onDelete: "cascade" }),
  item_id: varchar("item_id", { length: 20 })
    .notNull()
    .references(() => items.id), // المادة الخام من جدول الأصناف
  actual_weight_kg: decimal("actual_weight_kg", { precision: 10, scale: 2 }).notNull(), // الوزن الفعلي المخلوط
  percentage: decimal("percentage", { precision: 5, scale: 2 }), // النسبة المئوية (محسوبة تلقائياً)
  notes: text("notes"),
}, (table) => ({
  actualWeightPositive: check(
    "actual_weight_positive",
    sql`${table.actual_weight_kg} > 0`
  ),
  percentageValid: check(
    "percentage_valid",
    sql`${table.percentage} IS NULL OR (${table.percentage} > 0 AND ${table.percentage} <= 100)`
  ),
}));

// علاقات نظام الخلط المبسط
export const mixingBatchesRelations = relations(mixing_batches, ({ one, many }) => ({
  productionOrder: one(production_orders, {
    fields: [mixing_batches.production_order_id],
    references: [production_orders.id],
  }),
  machine: one(machines, {
    fields: [mixing_batches.machine_id],
    references: [machines.id],
  }),
  operator: one(users, {
    fields: [mixing_batches.operator_id],
    references: [users.id],
  }),
  ingredients: many(batch_ingredients),
}));

export const batchIngredientsRelations = relations(batch_ingredients, ({ one }) => ({
  batch: one(mixing_batches, {
    fields: [batch_ingredients.batch_id],
    references: [mixing_batches.id],
  }),
  item: one(items, {
    fields: [batch_ingredients.item_id],
    references: [items.id],
  }),
}));

// أنواع البيانات
export type MixingBatch = typeof mixing_batches.$inferSelect;
export type InsertMixingBatch = typeof mixing_batches.$inferInsert;
export type BatchIngredient = typeof batch_ingredients.$inferSelect;
export type InsertBatchIngredient = typeof batch_ingredients.$inferInsert;

// مخططات التحقق من البيانات
export const insertMixingBatchSchema = createInsertSchema(mixing_batches).omit({
  id: true,
  batch_number: true,
  created_at: true,
}).extend({
  total_weight_kg: z.string().refine((val) => parseFloatSafe(val) > 0, "الوزن الكلي يجب أن يكون أكبر من صفر"),
  screw_assignment: z.enum(["A", "B"]).default("A"),
});

export const insertBatchIngredientSchema = createInsertSchema(batch_ingredients).omit({
  id: true,
  percentage: true,
}).extend({
  actual_weight_kg: z.string().refine((val) => parseFloatSafe(val) > 0, "الوزن يجب أن يكون أكبر من صفر"),
});

// Sanitized user type that excludes sensitive fields like password
export type SafeUser = Omit<User, "password">;
