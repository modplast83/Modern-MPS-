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

// تم حذف جدول المنتجات واستبداله بجدول منتجات العملاء

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
  delivery_days: integer('delivery_days'),
  status: varchar('status', { length: 30 }).default('pending'), // pending / for_production / completed / delivered
  notes: text('notes'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  delivery_date: date('delivery_date')
});

// ⚙️ جدول أوامر الإنتاج
export const production_orders = pgTable('production_orders', {
  id: serial('id').primaryKey(),
  production_order_number: varchar('production_order_number', { length: 50 }).notNull().unique(),
  order_id: integer('order_id').notNull().references(() => orders.id),
  customer_product_id: integer('customer_product_id').references(() => customer_products.id),
  quantity_kg: decimal('quantity_kg', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).default('pending'), // pending / in_progress / completed / cancelled
  created_at: timestamp('created_at').defaultNow()
});

// ⚙️ جدول أوامر التشغيل (للتوافق مع النظام الموجود)
export const job_orders = pgTable('job_orders', {
  id: serial('id').primaryKey(),
  job_number: varchar('job_number', { length: 50 }).notNull().unique(),
  order_id: integer('order_id').notNull().references(() => orders.id),
  customer_product_id: integer('customer_product_id').references(() => customer_products.id),
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
  id: varchar('id', { length: 20 }).primaryKey(),
  category_id: varchar('category_id', { length: 20 }),
  material_group_id: integer('material_group_id').references(() => material_groups.id),
  name: varchar('name', { length: 100 }),
  name_ar: varchar('name_ar', { length: 100 }),
  code: varchar('code', { length: 50 }),
  status: varchar('status', { length: 20 }).default('active'),
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

// 📦 جدول المخزون الحالي
export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  item_id: varchar('item_id', { length: 20 }).notNull().references(() => items.id),
  location_id: integer('location_id').references(() => locations.id),
  current_stock: decimal('current_stock', { precision: 10, scale: 2 }).default('0'),
  min_stock: decimal('min_stock', { precision: 10, scale: 2 }).default('0'),
  max_stock: decimal('max_stock', { precision: 10, scale: 2 }).default('0'),
  unit: varchar('unit', { length: 20 }).default('كيلو'),
  cost_per_unit: decimal('cost_per_unit', { precision: 10, scale: 4 }),
  last_updated: timestamp('last_updated').defaultNow(),
});

// 📋 جدول حركات المخزون
export const inventory_movements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  inventory_id: integer('inventory_id').references(() => inventory.id),
  movement_type: varchar('movement_type', { length: 20 }).notNull(), // in / out / transfer / adjustment
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unit_cost: decimal('unit_cost', { precision: 10, scale: 4 }),
  total_cost: decimal('total_cost', { precision: 10, scale: 4 }),
  reference_number: varchar('reference_number', { length: 50 }),
  reference_type: varchar('reference_type', { length: 20 }), // purchase / sale / production / adjustment
  notes: text('notes'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
});

// 🏬 جدول حركات المستودع
export const warehouse_transactions = pgTable('warehouse_transactions', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 30 }), // incoming / issued / production / delivery
  item_id: varchar('item_id', { length: 20 }).references(() => items.id),
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

// 📚 جدول البرامج التدريبية
export const training_programs = pgTable('training_programs', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  title_ar: varchar('title_ar', { length: 200 }),
  description: text('description'),
  description_ar: text('description_ar'),
  category: varchar('category', { length: 50 }), // safety / technical / soft_skills / management
  duration_hours: integer('duration_hours'),
  max_participants: integer('max_participants'),
  prerequisites: text('prerequisites'),
  learning_objectives: json('learning_objectives').$type<string[]>(),
  materials: json('materials').$type<{title: string, type: string, url?: string}[]>(),
  instructor_id: integer('instructor_id').references(() => users.id),
  status: varchar('status', { length: 20 }).default('active'), // active / inactive / draft
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 📖 جدول المواد التدريبية
export const training_materials = pgTable('training_materials', {
  id: serial('id').primaryKey(),
  program_id: integer('program_id').references(() => training_programs.id),
  title: varchar('title', { length: 200 }).notNull(),
  title_ar: varchar('title_ar', { length: 200 }),
  type: varchar('type', { length: 20 }), // video / document / quiz / assignment
  content: text('content'),
  file_url: varchar('file_url', { length: 500 }),
  order_index: integer('order_index').default(0),
  duration_minutes: integer('duration_minutes'),
  is_mandatory: boolean('is_mandatory').default(true),
});

// 🎓 جدول تسجيل الموظفين في البرامج التدريبية
export const training_enrollments = pgTable('training_enrollments', {
  id: serial('id').primaryKey(),
  program_id: integer('program_id').references(() => training_programs.id),
  employee_id: integer('employee_id').references(() => users.id),
  enrolled_date: timestamp('enrolled_date').defaultNow(),
  start_date: date('start_date'),
  completion_date: date('completion_date'),
  status: varchar('status', { length: 20 }).default('enrolled'), // enrolled / in_progress / completed / cancelled
  progress_percentage: integer('progress_percentage').default(0),
  final_score: integer('final_score'), // 0-100
  certificate_issued: boolean('certificate_issued').default(false),
});

// 📊 جدول تقييم الأداء
export const performance_reviews = pgTable('performance_reviews', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull().references(() => users.id),
  reviewer_id: integer('reviewer_id').notNull().references(() => users.id),
  review_period_start: date('review_period_start').notNull(),
  review_period_end: date('review_period_end').notNull(),
  review_type: varchar('review_type', { length: 20 }), // annual / semi_annual / quarterly / probation
  overall_rating: integer('overall_rating'), // 1-5 scale
  goals_achievement: integer('goals_achievement'), // 1-5 scale
  skills_rating: integer('skills_rating'), // 1-5 scale
  behavior_rating: integer('behavior_rating'), // 1-5 scale
  strengths: text('strengths'),
  areas_for_improvement: text('areas_for_improvement'),
  development_plan: text('development_plan'),
  goals_for_next_period: text('goals_for_next_period'),
  employee_comments: text('employee_comments'),
  reviewer_comments: text('reviewer_comments'),
  hr_comments: text('hr_comments'),
  status: varchar('status', { length: 20 }).default('draft'), // draft / completed / approved / archived
  created_at: timestamp('created_at').defaultNow(),
  completed_at: timestamp('completed_at'),
});

// 🎯 جدول معايير التقييم
export const performance_criteria = pgTable('performance_criteria', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  description: text('description'),
  description_ar: text('description_ar'),
  category: varchar('category', { length: 50 }), // technical / behavioral / leadership / productivity
  weight_percentage: integer('weight_percentage').default(20), // وزن المعيار في التقييم الإجمالي
  applicable_roles: json('applicable_roles').$type<number[]>(), // أيدي الأدوار المطبق عليها
  is_active: boolean('is_active').default(true),
});

// 📋 جدول تفاصيل تقييم المعايير
export const performance_ratings = pgTable('performance_ratings', {
  id: serial('id').primaryKey(),
  review_id: integer('review_id').notNull().references(() => performance_reviews.id),
  criteria_id: integer('criteria_id').notNull().references(() => performance_criteria.id),
  rating: integer('rating').notNull(), // 1-5 scale
  comments: text('comments'),
});

// 🏖️ جدول أنواع الإجازات
export const leave_types = pgTable('leave_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  description: text('description'),
  description_ar: text('description_ar'),
  days_per_year: integer('days_per_year'), // عدد الأيام المسموحة سنوياً
  is_paid: boolean('is_paid').default(true),
  requires_medical_certificate: boolean('requires_medical_certificate').default(false),
  min_notice_days: integer('min_notice_days').default(1), // الحد الأدنى للإشعار المسبق
  max_consecutive_days: integer('max_consecutive_days'), // أقصى عدد أيام متتالية
  applicable_after_months: integer('applicable_after_months').default(0), // يحق للموظف بعد كم شهر
  color: varchar('color', { length: 20 }).default('#3b82f6'), // لون العرض في التقويم
  is_active: boolean('is_active').default(true),
});

// 📝 جدول طلبات الإجازات
export const leave_requests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull().references(() => users.id),
  leave_type_id: integer('leave_type_id').notNull().references(() => leave_types.id),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  days_count: integer('days_count').notNull(),
  reason: text('reason'),
  medical_certificate_url: varchar('medical_certificate_url', { length: 500 }),
  emergency_contact: varchar('emergency_contact', { length: 100 }),
  work_handover: text('work_handover'), // تسليم العمل
  replacement_employee_id: integer('replacement_employee_id').references(() => users.id),
  
  // Approval workflow
  direct_manager_id: integer('direct_manager_id').references(() => users.id),
  direct_manager_status: varchar('direct_manager_status', { length: 20 }).default('pending'), // pending / approved / rejected
  direct_manager_comments: text('direct_manager_comments'),
  direct_manager_action_date: timestamp('direct_manager_action_date'),
  
  hr_status: varchar('hr_status', { length: 20 }).default('pending'), // pending / approved / rejected
  hr_comments: text('hr_comments'),
  hr_action_date: timestamp('hr_action_date'),
  hr_reviewed_by: integer('hr_reviewed_by').references(() => users.id),
  
  final_status: varchar('final_status', { length: 20 }).default('pending'), // pending / approved / rejected / cancelled
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 💰 جدول رصيد الإجازات
export const leave_balances = pgTable('leave_balances', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull().references(() => users.id),
  leave_type_id: integer('leave_type_id').notNull().references(() => leave_types.id),
  year: integer('year').notNull(),
  allocated_days: integer('allocated_days').notNull(), // الأيام المخصصة
  used_days: integer('used_days').default(0), // الأيام المستخدمة
  pending_days: integer('pending_days').default(0), // الأيام المعلقة (طلبات لم توافق عليها بعد)
  remaining_days: integer('remaining_days').notNull(), // الأيام المتبقية
  carried_forward: integer('carried_forward').default(0), // الأيام المنقولة من السنة السابقة
  expires_at: date('expires_at'), // تاريخ انتهاء صلاحية الإجازات المنقولة
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
  material_group_id: integer('material_group_id').references(() => material_groups.id),
  item_id: varchar('item_id', { length: 20 }).references(() => items.id),
  size_caption: varchar('size_caption', { length: 50 }),
  width: decimal('width', { precision: 8, scale: 2 }),
  left_facing: decimal('left_facing', { precision: 8, scale: 2 }),
  right_facing: decimal('right_facing', { precision: 8, scale: 2 }),
  thickness: decimal('thickness', { precision: 6, scale: 3 }),
  printing_cylinder: varchar('printing_cylinder', { length: 10 }), // 8" to 38" + 39"
  length_cm: decimal('length_cm', { precision: 10, scale: 2 }),
  cutting_length_cm: integer('cutting_length_cm'),
  raw_material: varchar('raw_material', { length: 20 }), // HDPE-LDPE-Regrind
  master_batch_id: varchar('master_batch_id', { length: 20 }), // CLEAR-WHITE-BLACK etc
  is_printed: boolean('is_printed').default(false),
  cutting_unit: varchar('cutting_unit', { length: 10 }), // KG-ROLL-PKT
  punching: varchar('punching', { length: 20 }), // NON-T-Shirt-T-shirt\Hook-Banana
  unit_weight_kg: decimal('unit_weight_kg', { precision: 8, scale: 3 }),
  unit_quantity: integer('unit_quantity'),
  package_weight_kg: decimal('package_weight_kg', { precision: 8, scale: 2 }),
  cliche_front_design: varchar('cliche_front_design', { length: 500 }), // URL for uploaded photo
  cliche_back_design: varchar('cliche_back_design', { length: 500 }), // URL for uploaded photo
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
  trainingRecords: many(training_records),
  trainingEnrollments: many(training_enrollments),
  performanceReviews: many(performance_reviews, { relationName: "employee_reviews" }),
  conductedReviews: many(performance_reviews, { relationName: "reviewer_reviews" }),
  leaveRequests: many(leave_requests),
  leaveBalances: many(leave_balances),
  instructedPrograms: many(training_programs),
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
  customerProduct: one(customer_products, { fields: [job_orders.customer_product_id], references: [customer_products.id] }),
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
  items: many(items),
  customerProducts: many(customer_products),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, { fields: [items.category_id], references: [categories.id] }),
  customerProducts: many(customer_products),
  warehouseTransactions: many(warehouse_transactions),
  inventory: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  item: one(items, { fields: [inventory.item_id], references: [items.id] }),
  location: one(locations, { fields: [inventory.location_id], references: [locations.id] }),
}));

export const customerProductsRelations = relations(customer_products, ({ one, many }) => ({
  customer: one(customers, { fields: [customer_products.customer_id], references: [customers.id] }),
  materialGroup: one(material_groups, { fields: [customer_products.material_group_id], references: [material_groups.id] }),
  item: one(items, { fields: [customer_products.item_id], references: [items.id] }),
  jobOrders: many(job_orders),
}));

// تم حذف علاقات جدول المنتجات

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

// Order schema (legacy - will be phased out)

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

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  last_updated: true,
});

export const insertInventoryMovementSchema = createInsertSchema(inventory_movements).omit({
  id: true,
  created_at: true,
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

export const insertNewOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
  delivery_date: true,
});

export const insertProductionOrderSchema = createInsertSchema(production_orders).omit({
  id: true,
  created_at: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
// Legacy order types - will be phased out
export type JobOrder = typeof job_orders.$inferSelect;
export type InsertJobOrder = z.infer<typeof insertJobOrderSchema>;
export type Roll = typeof rolls.$inferSelect;
export type InsertRoll = z.infer<typeof insertRollSchema>;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;
export type MaintenanceRequest = typeof maintenance_requests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type QualityCheck = typeof quality_checks.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
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
export type Inventory = typeof inventory.$inferSelect;
export type NewOrder = typeof orders.$inferSelect;
export type InsertNewOrder = z.infer<typeof insertNewOrderSchema>;
export type ProductionOrder = typeof production_orders.$inferSelect;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryMovement = typeof inventory_movements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type Section = typeof sections.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Violation = typeof violations.$inferSelect;
export type CompanyProfile = typeof company_profile.$inferSelect;
// 🔧 جدول إعدادات النظام
export const system_settings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  setting_key: varchar('setting_key', { length: 100 }).notNull().unique(),
  setting_value: text('setting_value'),
  setting_type: varchar('setting_type', { length: 20 }).default('string'), // string / number / boolean / json
  description: text('description'),
  is_editable: boolean('is_editable').default(true),
  updated_at: timestamp('updated_at').defaultNow(),
  updated_by: integer('updated_by').references(() => users.id)
});

// 👤 جدول إعدادات المستخدمين
export const user_settings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  setting_key: varchar('setting_key', { length: 100 }).notNull(),
  setting_value: text('setting_value'),
  setting_type: varchar('setting_type', { length: 20 }).default('string'), // string / number / boolean / json
  updated_at: timestamp('updated_at').defaultNow()
});

// Insert schemas for settings
export const insertSystemSettingSchema = createInsertSchema(system_settings).omit({
  id: true,
  updated_at: true,
});

export const insertUserSettingSchema = createInsertSchema(user_settings).omit({
  id: true,
  updated_at: true,
});

export type CustomerProduct = typeof customer_products.$inferSelect;
export type InsertCustomerProduct = z.infer<typeof insertCustomerProductSchema>;
export type SystemSetting = typeof system_settings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type UserSetting = typeof user_settings.$inferSelect;
export type InsertUserSetting = z.infer<typeof insertUserSettingSchema>;

// 🧱 جدول مجموعات المواد
export const material_groups = pgTable("material_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  name_ar: varchar("name_ar", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique(),
  description: text("description"),
  parent_id: integer("parent_id").references(() => material_groups.id),
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

// HR System Schemas
export const insertTrainingProgramSchema = createInsertSchema(training_programs).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTrainingMaterialSchema = createInsertSchema(training_materials).omit({
  id: true,
});

export const insertTrainingEnrollmentSchema = createInsertSchema(training_enrollments).omit({
  id: true,
  enrolled_date: true,
});

export const insertPerformanceReviewSchema = createInsertSchema(performance_reviews).omit({
  id: true,
  created_at: true,
  completed_at: true,
});

export const insertPerformanceCriteriaSchema = createInsertSchema(performance_criteria).omit({
  id: true,
});

export const insertPerformanceRatingSchema = createInsertSchema(performance_ratings).omit({
  id: true,
});

export const insertLeaveTypeSchema = createInsertSchema(leave_types).omit({
  id: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leave_requests).omit({
  id: true,
  created_at: true,
  updated_at: true,
  direct_manager_action_date: true,
  hr_action_date: true,
});

export const insertLeaveBalanceSchema = createInsertSchema(leave_balances).omit({
  id: true,
});

// HR System Types
export type TrainingProgram = typeof training_programs.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type TrainingMaterial = typeof training_materials.$inferSelect;
export type InsertTrainingMaterial = z.infer<typeof insertTrainingMaterialSchema>;
export type TrainingEnrollment = typeof training_enrollments.$inferSelect;
export type InsertTrainingEnrollment = z.infer<typeof insertTrainingEnrollmentSchema>;
export type PerformanceReview = typeof performance_reviews.$inferSelect;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type PerformanceCriteria = typeof performance_criteria.$inferSelect;
export type InsertPerformanceCriteria = z.infer<typeof insertPerformanceCriteriaSchema>;
export type PerformanceRating = typeof performance_ratings.$inferSelect;
export type InsertPerformanceRating = z.infer<typeof insertPerformanceRatingSchema>;
export type LeaveType = typeof leave_types.$inferSelect;
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;
export type LeaveRequest = typeof leave_requests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveBalance = typeof leave_balances.$inferSelect;
export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;

// HR Relations
export const trainingProgramsRelations = relations(training_programs, ({ one, many }) => ({
  instructor: one(users, { fields: [training_programs.instructor_id], references: [users.id] }),
  materials: many(training_materials),
  enrollments: many(training_enrollments),
}));

export const trainingMaterialsRelations = relations(training_materials, ({ one }) => ({
  program: one(training_programs, { fields: [training_materials.program_id], references: [training_programs.id] }),
}));

export const trainingEnrollmentsRelations = relations(training_enrollments, ({ one }) => ({
  program: one(training_programs, { fields: [training_enrollments.program_id], references: [training_programs.id] }),
  employee: one(users, { fields: [training_enrollments.employee_id], references: [users.id] }),
}));

export const performanceReviewsRelations = relations(performance_reviews, ({ one, many }) => ({
  employee: one(users, { fields: [performance_reviews.employee_id], references: [users.id], relationName: "employee_reviews" }),
  reviewer: one(users, { fields: [performance_reviews.reviewer_id], references: [users.id], relationName: "reviewer_reviews" }),
  ratings: many(performance_ratings),
}));

export const performanceCriteriaRelations = relations(performance_criteria, ({ many }) => ({
  ratings: many(performance_ratings),
}));

export const performanceRatingsRelations = relations(performance_ratings, ({ one }) => ({
  review: one(performance_reviews, { fields: [performance_ratings.review_id], references: [performance_reviews.id] }),
  criteria: one(performance_criteria, { fields: [performance_ratings.criteria_id], references: [performance_criteria.id] }),
}));

export const leaveTypesRelations = relations(leave_types, ({ many }) => ({
  requests: many(leave_requests),
  balances: many(leave_balances),
}));

export const leaveRequestsRelations = relations(leave_requests, ({ one }) => ({
  employee: one(users, { fields: [leave_requests.employee_id], references: [users.id] }),
  leaveType: one(leave_types, { fields: [leave_requests.leave_type_id], references: [leave_types.id] }),
  directManager: one(users, { fields: [leave_requests.direct_manager_id], references: [users.id] }),
  hrReviewer: one(users, { fields: [leave_requests.hr_reviewed_by], references: [users.id] }),
  replacementEmployee: one(users, { fields: [leave_requests.replacement_employee_id], references: [users.id] }),
}));

export const leaveBalancesRelations = relations(leave_balances, ({ one }) => ({
  employee: one(users, { fields: [leave_balances.employee_id], references: [users.id] }),
  leaveType: one(leave_types, { fields: [leave_balances.leave_type_id], references: [leave_types.id] }),
}));

// Import ERP schemas
export * from './erp-schema';
