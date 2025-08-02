import { sql, relations } from "drizzle-orm";
import { pgTable, serial, varchar, integer, boolean, date, timestamp, json, text, decimal } from 'drizzle-orm/pg-core';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 🔐 جدول الصلاحيات
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  permissions: json('permissions').$type<string[]>()
});

// 📁 جدول الأقسام
export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  description: text('description')
});

// 🧑‍💼 جدول المستخدمين
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 100 }).notNull(),
  display_name: varchar('display_name', { length: 100 }),
  display_name_ar: varchar('display_name_ar', { length: 100 }),
  role_id: integer('role_id').references(() => roles.id),
  section_id: integer('section_id').references(() => sections.id),
  status: varchar('status', { length: 20 }).default('active'), // active / suspended / deleted
  created_at: timestamp('created_at').defaultNow(),
});

// 🧾 جدول العملاء
export const customers = pgTable('customers', {
  id: varchar('id', { length: 20 }).primaryKey(), // Changed to varchar to match CID001 format
  name: varchar('name', { length: 200 }).notNull(),
  name_ar: varchar('name_ar', { length: 200 }),
  code: varchar('code', { length: 20 }),
  user_id: varchar('user_id', { length: 10 }),
  plate_drawer_code: varchar('plate_drawer_code', { length: 20 }),
  city: varchar('city', { length: 50 }),
  address: text('address'),
  tax_number: varchar('tax_number', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  sales_rep_id: integer('sales_rep_id').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
});

// 🗂️ جدول المجموعات
export const categories = pgTable('categories', {
  id: varchar('id', { length: 20 }).primaryKey(), // Changed to varchar to match CAT001 format
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  code: varchar('code', { length: 20 }),
  parent_id: varchar('parent_id', { length: 20 }),
});

// 📦 جدول المنتجات
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  category_id: varchar('category_id', { length: 20 }).references(() => categories.id),
  type: varchar('type', { length: 50 }), // علاقي، بنانة، بدون تخريم
  needs_printing: boolean('needs_printing').default(false),
  waste_percentage: decimal('waste_percentage', { precision: 5, scale: 2 }).default('5.00'),
  unit: varchar('unit', { length: 20 }).default('kg'),
});

// 🏭 جدول المكائن
export const machines = pgTable('machines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  type: varchar('type', { length: 50 }), // extruder / printer / cutter
  section_id: integer('section_id').references(() => sections.id),
  status: varchar('status', { length: 20 }).default('active'), // active / maintenance / down
});

// 🧾 جدول الطلبات
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  order_number: varchar('order_number', { length: 50 }).notNull().unique(),
  customer_id: varchar('customer_id', { length: 20 }).notNull().references(() => customers.id),
  status: varchar('status', { length: 30 }).default('pending'), // pending / for_production / completed / delivered
  created_at: timestamp('created_at').defaultNow(),
  delivery_date: date('delivery_date'),
  notes: text('notes')
});

// ⚙️ جدول أوامر التشغيل
export const job_orders = pgTable('job_orders', {
  id: serial('id').primaryKey(),
  job_number: varchar('job_number', { length: 50 }).notNull().unique(),
  order_id: integer('order_id').notNull().references(() => orders.id),
  product_id: integer('product_id').notNull().references(() => products.id),
  quantity_required: decimal('quantity_required', { precision: 10, scale: 2 }).notNull(),
  quantity_produced: decimal('quantity_produced', { precision: 10, scale: 2 }).default('0'),
  status: varchar('status', { length: 30 }).default('pending'),
  created_at: timestamp('created_at').defaultNow()
});

// 🧵 جدول الرولات
export const rolls = pgTable('rolls', {
  id: serial('id').primaryKey(),
  roll_number: varchar('roll_number', { length: 50 }).notNull().unique(),
  job_order_id: integer('job_order_id').references(() => job_orders.id),
  weight: decimal('weight', { precision: 8, scale: 2 }),
  status: varchar('status', { length: 30 }).default('for_printing'), // for_printing / for_cutting / done
  current_stage: varchar('current_stage', { length: 30 }).default('film'), // film / printing / cutting
  machine_id: integer('machine_id').references(() => machines.id),
  employee_id: integer('employee_id').references(() => users.id),
  qr_code: varchar('qr_code', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  completed_at: timestamp('completed_at'),
});

// 🗑️ جدول الهدر
export const waste = pgTable('waste', {
  id: serial('id').primaryKey(),
  roll_id: integer('roll_id').references(() => rolls.id),
  job_order_id: integer('job_order_id').references(() => job_orders.id),
  quantity_wasted: decimal('quantity_wasted', { precision: 8, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 100 }),
  stage: varchar('stage', { length: 50 }), // extruder / cutting / printing
  created_at: timestamp('created_at').defaultNow(),
});

// 🧪 جدول فحص الجودة
export const quality_checks = pgTable('quality_checks', {
  id: serial('id').primaryKey(),
  target_type: varchar('target_type', { length: 20 }), // roll / material
  target_id: integer('target_id'),
  result: varchar('result', { length: 10 }), // pass / fail
  score: integer('score'), // 1-5 stars
  notes: text('notes'),
  checked_by: integer('checked_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow()
});

// 👥 جدول الحضور والانصراف
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull().references(() => users.id),
  check_in_time: timestamp('check_in_time'),
  check_out_time: timestamp('check_out_time'),
  date: date('date').notNull(),
  overtime_minutes: integer('overtime_minutes').default(0),
  location: varchar('location', { length: 100 }),
  status: varchar('status', { length: 20 }).default('present'), // present / absent / late
});

// 🛠️ جدول طلبات الصيانة
export const maintenance_requests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  machine_id: integer('machine_id').references(() => machines.id),
  reported_by: integer('reported_by').references(() => users.id),
  issue_type: varchar('issue_type', { length: 50 }), // mechanical / electrical / other
  description: text('description'),
  urgency_level: varchar('urgency_level', { length: 20 }).default('normal'), // normal / medium / urgent
  status: varchar('status', { length: 20 }).default('open'), // open / in_progress / resolved
  assigned_to: integer('assigned_to').references(() => users.id),
  action_taken: text('action_taken'),
  date_reported: timestamp('date_reported').defaultNow(),
  date_resolved: timestamp('date_resolved')
});

// 📋 جدول المخالفات
export const violations = pgTable('violations', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').references(() => users.id),
  violation_type: varchar('violation_type', { length: 50 }),
  description: text('description'),
  date: date('date').notNull(),
  action_taken: text('action_taken'),
  reported_by: integer('reported_by').references(() => users.id),
});

// 📦 جدول الأصناف والمواد
export const items = pgTable('items', {
  id: varchar('id', { length: 20 }).primaryKey(), // Changed to varchar to match ITM001 format
  category_id: varchar('category_id', { length: 20 }).references(() => categories.id),
  name: varchar('name', { length: 100 }).notNull(),
  full_name: varchar('full_name', { length: 100 }),
  name_ar: varchar('name_ar', { length: 100 }),
  unit: varchar('unit', { length: 20 }),
  type: varchar('type', { length: 50 }), // raw / final
  price: decimal('price', { precision: 10, scale: 2 }),
});

// 🌍 جدول المواقع الجغرافية
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  coordinates: varchar('coordinates', { length: 100 }),
  tolerance_range: integer('tolerance_range'),
});

// 📦 جدول الموردين
export const suppliers = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  contact: varchar('contact', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  materials_supplied: json('materials_supplied').$type<number[]>(),
});

// 🏬 جدول حركات المستودع
export const warehouse_transactions = pgTable('warehouse_transactions', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 30 }), // incoming / issued / production / delivery
  item_id: integer('item_id').references(() => items.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  from_location: varchar('from_location', { length: 100 }),
  to_location: varchar('to_location', { length: 100 }),
  date: timestamp('date').defaultNow(),
  reference_id: integer('reference_id'), // order_id, job_order_id, etc.
  notes: text('notes'),
});

// 🧱 جدول خلطات المواد
export const mixing_recipes = pgTable('mixing_recipes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  machine_type: varchar('machine_type', { length: 20 }), // A / ABA
  formula_layers: integer('formula_layers'),
  material_items: json('material_items').$type<{item_id: number, percentage: number}[]>(),
  created_at: timestamp('created_at').defaultNow()
});

// 🧍‍♂️ جدول التدريب
export const training_records = pgTable('training_records', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').references(() => users.id),
  training_type: varchar('training_type', { length: 100 }),
  training_name: varchar('training_name', { length: 200 }),
  date: date('date').notNull(),
  status: varchar('status', { length: 20 }).default('completed'), // completed / pending / cancelled
  instructor: varchar('instructor', { length: 100 }),
  notes: text('notes'),
});

// 📢 جدول القرارات الإدارية
export const admin_decisions = pgTable('admin_decisions', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 100 }).notNull(),
  title_ar: varchar('title_ar', { length: 100 }),
  description: text('description'),
  target_type: varchar('target_type', { length: 20 }), // user / department / company
  target_id: integer('target_id'),
  date: date('date').notNull(),
  issued_by: integer('issued_by').references(() => users.id),
});

// 🏢 جدول بيانات المصنع
export const company_profile = pgTable('company_profile', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  address: text('address'),
  tax_number: varchar('tax_number', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  logo_url: varchar('logo_url', { length: 255 }),
  working_hours_per_day: integer('working_hours_per_day').default(8),
  default_language: varchar('default_language', { length: 10 }).default('ar'),
});

// 🛒 جدول منتجات العملاء (User's Custom Data Integration)
export const customer_products = pgTable('customer_products', {
  id: serial('id').primaryKey(),
  customer_id: varchar('customer_id', { length: 20 }).references(() => customers.id),
  product_id: integer('product_id').references(() => products.id), // nullable for user data
  category_id: varchar('category_id', { length: 20 }).references(() => categories.id),
  item_id: varchar('item_id', { length: 20 }).references(() => items.id),
  size_caption: varchar('size_caption', { length: 50 }),
  width: varchar('width', { length: 10 }),
  left_f: varchar('left_f', { length: 10 }),
  right_f: varchar('right_f', { length: 10 }),
  thickness: varchar('thickness', { length: 10 }),
  thickness_one: varchar('thickness_one', { length: 10 }),
  printing_cylinder: varchar('printing_cylinder', { length: 10 }),
  length_cm: varchar('length_cm', { length: 10 }),
  cutting_length_cm: varchar('cutting_length_cm', { length: 10 }),
  raw_material: varchar('raw_material', { length: 50 }),
  master_batch_id: varchar('master_batch_id', { length: 20 }),
  printed: varchar('printed', { length: 10 }),
  cutting_unit: varchar('cutting_unit', { length: 50 }),
  unit_weight_kg: varchar('unit_weight_kg', { length: 10 }),
  packing: varchar('packing', { length: 100 }),
  punching: varchar('punching', { length: 50 }),
  cover: varchar('cover', { length: 100 }),
  volum: varchar('volum', { length: 10 }),
  knife: varchar('knife', { length: 10 }),
  unit_qty: varchar('unit_qty', { length: 10 }),
  package_kg: varchar('package_kg', { length: 10 }),
  cliche_front_design: text('cliche_front_design'),
  cliche_back_design: text('cliche_back_design'),
  notes: text('notes'),
  status: varchar('status', { length: 20 }).default('active'),
  created_at: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.role_id], references: [roles.id] }),
  section: one(sections, { fields: [users.section_id], references: [sections.id] }),
  attendance: many(attendance),
  violations: many(violations),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  salesRep: one(users, { fields: [customers.sales_rep_id], references: [users.id] }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customer_id], references: [customers.id] }),
  jobOrders: many(job_orders),
}));

export const jobOrdersRelations = relations(job_orders, ({ one, many }) => ({
  order: one(orders, { fields: [job_orders.order_id], references: [orders.id] }),
  product: one(products, { fields: [job_orders.product_id], references: [products.id] }),
  rolls: many(rolls),
  waste: many(waste),
}));

export const rollsRelations = relations(rolls, ({ one, many }) => ({
  jobOrder: one(job_orders, { fields: [rolls.job_order_id], references: [job_orders.id] }),
  machine: one(machines, { fields: [rolls.machine_id], references: [machines.id] }),
  employee: one(users, { fields: [rolls.employee_id], references: [users.id] }),
  waste: many(waste),
  qualityChecks: many(quality_checks),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
  section: one(sections, { fields: [machines.section_id], references: [sections.id] }),
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
  parent: one(categories, { fields: [categories.parent_id], references: [categories.id], relationName: "parent_category" }),
  children: many(categories, { relationName: "parent_category" }),
  products: many(products),
  items: many(items),
  customerProducts: many(customer_products),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, { fields: [items.category_id], references: [categories.id] }),
  customerProducts: many(customer_products),
  warehouseTransactions: many(warehouse_transactions),
}));

export const customerProductsRelations = relations(customer_products, ({ one }) => ({
  customer: one(customers, { fields: [customer_products.customer_id], references: [customers.id] }),
  product: one(products, { fields: [customer_products.product_id], references: [products.id] }),
  category: one(categories, { fields: [customer_products.category_id], references: [categories.id] }),
  item: one(items, { fields: [customer_products.item_id], references: [items.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.category_id], references: [categories.id] }),
  jobOrders: many(job_orders),
  customerProducts: many(customer_products),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  // يمكن إضافة علاقات الموردين مع الأصناف لاحقاً
}));

export const trainingRecordsRelations = relations(training_records, ({ one }) => ({
  employee: one(users, { fields: [training_records.employee_id], references: [users.id] }),
}));

export const adminDecisionsRelations = relations(admin_decisions, ({ one }) => ({
  issuedBy: one(users, { fields: [admin_decisions.issued_by], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
  order_number: true,
});

export const insertJobOrderSchema = createInsertSchema(job_orders).omit({
  id: true,
  created_at: true,
  job_number: true,
  quantity_produced: true,
});

export const insertRollSchema = createInsertSchema(rolls).omit({
  id: true,
  created_at: true,
  roll_number: true,
  completed_at: true,
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenance_requests).omit({
  id: true,
  date_reported: true,
  date_resolved: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
});

export const insertWarehouseTransactionSchema = createInsertSchema(warehouse_transactions).omit({
  id: true,
  date: true,
});

export const insertMixingRecipeSchema = createInsertSchema(mixing_recipes).omit({
  id: true,
  created_at: true,
});

export const insertTrainingRecordSchema = createInsertSchema(training_records).omit({
  id: true,
});

export const insertAdminDecisionSchema = createInsertSchema(admin_decisions).omit({
  id: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type JobOrder = typeof job_orders.$inferSelect;
export type InsertJobOrder = z.infer<typeof insertJobOrderSchema>;
export type Roll = typeof rolls.$inferSelect;
export type InsertRoll = z.infer<typeof insertRollSchema>;
export type Machine = typeof machines.$inferSelect;
export type MaintenanceRequest = typeof maintenance_requests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type QualityCheck = typeof quality_checks.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type WarehouseTransaction = typeof warehouse_transactions.$inferSelect;
export type InsertWarehouseTransaction = z.infer<typeof insertWarehouseTransactionSchema>;
export type MixingRecipe = typeof mixing_recipes.$inferSelect;
export type InsertMixingRecipe = z.infer<typeof insertMixingRecipeSchema>;
export type TrainingRecord = typeof training_records.$inferSelect;
export type InsertTrainingRecord = z.infer<typeof insertTrainingRecordSchema>;
export type AdminDecision = typeof admin_decisions.$inferSelect;
export type InsertAdminDecision = z.infer<typeof insertAdminDecisionSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Section = typeof sections.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Violation = typeof violations.$inferSelect;
export type CompanyProfile = typeof company_profile.$inferSelect;
export type CustomerProduct = typeof customer_products.$inferSelect;
export type InsertCustomerProduct = z.infer<typeof insertCustomerProductSchema>;

// 🧱 جدول مجموعات المواد
export const material_groups = pgTable("material_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

export type MaterialGroup = typeof material_groups.$inferSelect;
export type InsertMaterialGroup = typeof material_groups.$inferInsert;

// Insert schemas for new tables
export const insertMaterialGroupSchema = createInsertSchema(material_groups).omit({
  id: true,
  created_at: true,
});

export const insertCustomerProductSchema = createInsertSchema(customer_products).omit({
  id: true,
  created_at: true,
});

export const insertCategorySchema = createInsertSchema(categories);
export const insertCustomerSchema = createInsertSchema(customers).omit({
  created_at: true,
});

// Import ERP schemas
export * from './erp-schema';
