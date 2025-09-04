// 📦 MPBF Next - Drizzle ORM Schema (TypeScript)
// مخصص لمشروع مصنع الأكياس البلاستيكية - النسخة المتطورة

import { pgTable, serial, varchar, integer, boolean, date, timestamp, json, text } from 'drizzle-orm/pg-core';

// 🧑‍💼 جدول الموظفين (users)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  password: varchar('password', { length: 100 }).notNull(),
  display_name: varchar('display_name', { length: 100 }),
  role_id: integer('role_id'),
  section_id: integer('section_id'),
  status: varchar('status', { length: 20 }), // active / suspended / deleted
});

// 📁 جدول الأقسام
export const sections = pgTable('sections', {
  name_ar: varchar('name_ar', { length: 100 }),
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull()
});

// 🔐 جدول الصلاحيات
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  permissions: json('permissions')
});

// 🧾 جدول العملاء
export const customers = pgTable('customers', {
  name_ar: varchar('name_ar', { length: 100 }),
  id: serial('id').primaryKey(),
  name_ar: varchar('name_ar', { length: 100 }),
  name_en: varchar('name_en', { length: 100 }),
  city: varchar('city', { length: 50 }),
  address: varchar('address', { length: 255 }),
  tax_number: varchar('tax_number', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  sales_rep_id: integer('sales_rep_id')
});

// 🏭 جدول المكائن
export const machines = pgTable('machines', {
  name_ar: varchar('name_ar', { length: 100 }),
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  type: varchar('type', { length: 50 }), // extruder / printer / cutter
  section_id: integer('section_id'),
  status: varchar('status', { length: 20 }) // active / maintenance / down
});

// 🛠️ جدول طلبات الصيانة
export const maintenance_requests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  machine_id: integer('machine_id'),
  reported_by: integer('reported_by'),
  issue_type: varchar('issue_type', { length: 50 }), // لف ماطور، قطع غيار، مخرطة...
  description: text('description'),
  status: varchar('status', { length: 20 }), // open / in_progress / resolved
  assigned_to: integer('assigned_to'),
  action_taken: text('action_taken'),
  date_reported: timestamp('date_reported').defaultNow(),
  date_resolved: timestamp('date_resolved')
});

// 📋 جدول المخالفات
export const violations = pgTable('violations', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id'),
  violation_type: varchar('violation_type', { length: 50 }),
  description: text('description'),
  date: date('date'),
  action_taken: text('action_taken')
});

// 📢 جدول القرارات الإدارية
export const admin_decisions = pgTable('admin_decisions', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 100 }),
  description: text('description'),
  target_type: varchar('target_type', { length: 20 }), // user / department
  target_id: integer('target_id'),
  date: date('date')
});


// 🧾 جدول الطلبات
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').notNull(),
  status: varchar('status', { length: 30 }), // pending / for_production / completed / delivered
  created_at: timestamp('created_at').defaultNow(),
  notes: text('notes')
});

// ⚙️ جدول أوامر التشغيل
export const production_orders = pgTable('production_orders', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity_required: integer('quantity_required'),
  quantity_produced: integer('quantity_produced'),
  status: varchar('status', { length: 30 }),
  created_at: timestamp('created_at').defaultNow()
});

// 🧵 جدول الرولات
export const rolls = pgTable('rolls', {
  id: serial('id').primaryKey(),
  job_order_id: integer('job_order_id'),
  weight: integer('weight'),
  status: varchar('status', { length: 30 }), // for_printing / for_cutting / done
  section_id: integer('section_id'),
  machine_id: integer('machine_id'),
  employee_id: integer('employee_id'),
  qr_code_url: varchar('qr_code_url', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  history_log: json('history_log')
});

// 🗑️ جدول الهدر
export const waste = pgTable('waste', {
  id: serial('id').primaryKey(),
  roll_id: integer('roll_id'),
  job_order_id: integer('job_order_id'),
  quantity_wasted: integer('quantity_wasted'),
  reason: varchar('reason', { length: 100 }),
  stage: varchar('stage', { length: 50 }) // extruder / cutting / printing
});

// 🧪 جدول تشييك الجودة
export const quality_checks = pgTable('quality_checks', {
  id: serial('id').primaryKey(),
  target_type: varchar('target_type', { length: 20 }), // roll / material
  target_id: integer('target_id'),
  result: varchar('result', { length: 10 }), // pass / fail
  notes: text('notes'),
  checked_by: integer('checked_by'),
  created_at: timestamp('created_at').defaultNow()
});

// 🏬 جدول حركات المستودع
export const warehouse_transactions = pgTable('warehouse_transactions', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 30 }), // incoming / issued / production / delivery
  item_id: integer('item_id'),
  quantity: integer('quantity'),
  from_location: varchar('from_location', { length: 100 }),
  to_location: varchar('to_location', { length: 100 }),
  date: timestamp('date').defaultNow()
});

// 🧱 جدول خلطات المواد
export const mixing_recipes = pgTable('mixing_recipes', {
  id: serial('id').primaryKey(),
  machine_type: varchar('machine_type', { length: 20 }), // A / ABA
  formula_layers: integer('formula_layers'),
  material_items: json('material_items'), // [{item_id: 1, percentage: 70}, {...}]
  created_at: timestamp('created_at').defaultNow()
});

// 🧍‍♂️ جدول التدريب
export const training_records = pgTable('training_records', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id'),
  training_type: varchar('training_type', { length: 100 }),
  date: date('date'),
  status: varchar('status', { length: 20 }) // completed / pending
});

// 📦 جدول الموردين
export const suppliers = pgTable('suppliers', {
  name_ar: varchar('name_ar', { length: 100 }),
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  contact: varchar('contact', { length: 100 }),
  materials_supplied: json('materials_supplied')
});


// العلاقات بين الجداول (Relations)

// users مرتبط بـ sections و roles
// customers مرتبط بـ users (مندوب مبيعات)
// machines مرتبط بـ sections
// rolls مرتبط بـ production_orders, machines, employees, sections
// waste مرتبط بـ rolls و production_orders
// production_orders مرتبط بـ orders و customer_products
// orders مرتبط بـ customers
// quality_checks مرتبط بـ users (checked_by)
// training_records مرتبط بـ users
// maintenance_requests مرتبط بـ machines و users

// ملاحظة: Drizzle يدعم العلاقات بواسطة joins داخل الكويريز وليس عن طريق foreign key constraints مباشرة في التعريف.
// يفضل الحفاظ على العلاقات منطقيًا داخل الكود.



// 🗂️ جدول المجموعات الأساسية والفرعية
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name_ar: varchar('name_ar', { length: 100 }),
  name_en: varchar('name_en', { length: 100 }),
  parent_id: integer('parent_id')
});


// 📦 جدول الأصناف (Items)
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name_ar: varchar('name_ar', { length: 100 }),
  name_en: varchar('name_en', { length: 100 }),
  unit: varchar('unit', { length: 20 }),
  type: varchar('type', { length: 50 }), // raw / final
  price: integer('price')
});


// 🌍 جدول المواقع الجغرافية
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name_ar: varchar('name_ar', { length: 100 }),
  name_en: varchar('name_en', { length: 100 }),
  coordinates: varchar('coordinates', { length: 100 }),
  tolerance_range: integer('tolerance_range')
});


// 🏢 جدول بيانات المصنع
export const company_profile = pgTable('company_profile', {
  id: serial('id').primaryKey(),
  name_ar: varchar('name_ar', { length: 100 }),
  name_en: varchar('name_en', { length: 100 }),
  address: text('address'),
  tax_number: varchar('tax_number', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  logo_url: varchar('logo_url', { length: 255 })
});
