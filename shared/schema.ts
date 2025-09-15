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
  id: varchar('id', { length: 20 }).primaryKey(),
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
  full_name: varchar('full_name', { length: 200 }),
  phone: varchar('phone', { length: 20 }), // رقم الهاتف للواتس اب
  email: varchar('email', { length: 100 }),
  role_id: integer('role_id').references(() => roles.id),
  section_id: integer('section_id'),
  status: varchar('status', { length: 20 }).default('active'), // active / suspended / deleted
  created_at: timestamp('created_at').defaultNow(),
});

// 📋 جدول طلبات المستخدمين
export const user_requests = pgTable('user_requests', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('معلق'),
  priority: varchar('priority', { length: 20 }).default('عادي'),
  response: text('response'),
  reviewed_by: integer('reviewed_by').references(() => users.id),
  date: timestamp('date').defaultNow(),
  reviewed_date: timestamp('reviewed_date'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 📋 جدول الحضور
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('غائب'), // حاضر / غائب / استراحة غداء / مغادر
  check_in_time: timestamp('check_in_time'),
  check_out_time: timestamp('check_out_time'),
  lunch_start_time: timestamp('lunch_start_time'),
  lunch_end_time: timestamp('lunch_end_time'),
  notes: text('notes'),
  created_by: integer('created_by').references(() => users.id),
  updated_by: integer('updated_by').references(() => users.id),
  date: date('date').notNull().default(sql`CURRENT_DATE`),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
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

// 🛒 جدول منتجات العملاء (User's Custom Data Integration)
export const customer_products = pgTable('customer_products', {
  id: serial('id').primaryKey(),
  customer_id: varchar('customer_id', { length: 20 }).references(() => customers.id),
  category_id: varchar('category_id', { length: 20 }).references(() => categories.id),
  item_id: varchar('item_id', { length: 20 }).references(() => items.id),
  size_caption: varchar('size_caption', { length: 50 }),
  width: decimal('width', { precision: 8, scale: 2 }),
  left_facing: decimal('left_facing', { precision: 8, scale: 2 }),
  right_facing: decimal('right_facing', { precision: 8, scale: 2 }),
  thickness: decimal('thickness', { precision: 6, scale: 3 }),
  printing_cylinder: varchar('printing_cylinder', { length: 10 }), // 8" to 38" + 39"
  cutting_length_cm: integer('cutting_length_cm'),
  raw_material: varchar('raw_material', { length: 20 }), // HDPE-LDPE-Regrind
  master_batch_id: varchar('master_batch_id', { length: 20 }), // CLEAR-WHITE-BLACK etc
  is_printed: boolean('is_printed').default(false),
  cutting_unit: varchar('cutting_unit', { length: 20 }), // KG-ROLL-PKT
  punching: varchar('punching', { length: 20 }), // NON-T-Shirt-T-shirt\Hook-Banana
  unit_weight_kg: decimal('unit_weight_kg', { precision: 8, scale: 3 }),
  unit_quantity: integer('unit_quantity'),
  package_weight_kg: decimal('package_weight_kg', { precision: 8, scale: 2 }),
  cliche_front_design: text('cliche_front_design'), // Base64 encoded image data
  cliche_back_design: text('cliche_back_design'), // Base64 encoded image data
  notes: text('notes'),
  status: varchar('status', { length: 20 }).default('active'),
  created_at: timestamp('created_at').defaultNow(),
});

// 🏭 جدول المكائن
export const machines = pgTable('machines', {
  id: varchar('id', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  type: varchar('type', { length: 50 }), // extruder / printer / cutter
  section_id: varchar('section_id', { length: 20 }).references(() => sections.id),
  status: varchar('status', { length: 20 }).default('active'), // active / maintenance / down
});

// 🧾 جدول الطلبات
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  order_number: varchar('order_number', { length: 50 }).notNull().unique(),
  customer_id: varchar('customer_id', { length: 20 }).notNull().references(() => customers.id),
  delivery_days: integer('delivery_days'),
  status: varchar('status', { length: 30 }).default('waiting'), // waiting / in_production / paused / cancelled / completed
  notes: text('notes'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  delivery_date: date('delivery_date')
});

// 📋 جدول أوامر الإنتاج
export const production_orders = pgTable('production_orders', {
  id: serial('id').primaryKey(),
  production_order_number: varchar('production_order_number', { length: 50 }).notNull().unique(),
  order_id: integer('order_id').notNull().references(() => orders.id),
  customer_product_id: integer('customer_product_id').notNull().references(() => customer_products.id),
  quantity_kg: decimal('quantity_kg', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).default('pending'),
  created_at: timestamp('created_at').defaultNow()
});


// 🧵 جدول الرولات
export const rolls = pgTable('rolls', {
  id: serial('id').primaryKey(),
  roll_seq: integer('roll_seq').notNull(),
  roll_number: varchar('roll_number', { length: 64 }).notNull().unique(),
  production_order_id: integer('production_order_id').references(() => production_orders.id),
  qr_code_text: text('qr_code_text').notNull(),
  qr_png_base64: text('qr_png_base64'),
  stage: varchar('stage', { length: 20 }).notNull(), // film, printing, cutting, done
  weight_kg: decimal('weight_kg', { precision: 12, scale: 3 }).notNull(),
  cut_weight_total_kg: decimal('cut_weight_total_kg', { precision: 12, scale: 3 }).notNull().default('0'),
  waste_kg: decimal('waste_kg', { precision: 12, scale: 3 }).notNull().default('0'),
  printed_at: timestamp('printed_at'),
  cut_completed_at: timestamp('cut_completed_at'),
  performed_by: integer('performed_by').references(() => users.id), // Legacy field, kept for backward compatibility
  machine_id: varchar('machine_id', { length: 20 }).references(() => machines.id),
  employee_id: integer('employee_id').references(() => users.id), // Legacy field, kept for backward compatibility
  created_by: integer('created_by').references(() => users.id), // المستخدم الذي أنشأ الرول
  printed_by: integer('printed_by').references(() => users.id), // المستخدم الذي طبع الرول
  cut_by: integer('cut_by').references(() => users.id), // المستخدم الذي قطع الرول
  qr_code: varchar('qr_code', { length: 255 }),
  created_at: timestamp('created_at').defaultNow(),
  completed_at: timestamp('completed_at'),
});

// ✂️ جدول القطع (Cuts)
export const cuts = pgTable('cuts', {
  id: serial('id').primaryKey(),
  roll_id: integer('roll_id').notNull().references(() => rolls.id, { onDelete: 'cascade' }),
  cut_weight_kg: decimal('cut_weight_kg', { precision: 12, scale: 3 }).notNull(),
  pieces_count: integer('pieces_count'),
  performed_by: integer('performed_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow()
});

// 🏪 جدول إيصالات المستودع (Warehouse Receipts)
export const warehouse_receipts = pgTable('warehouse_receipts', {
  id: serial('id').primaryKey(),
  production_order_id: integer('production_order_id').notNull().references(() => production_orders.id),
  cut_id: integer('cut_id').references(() => cuts.id),
  received_weight_kg: decimal('received_weight_kg', { precision: 12, scale: 3 }).notNull(),
  received_by: integer('received_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow()
});

// ⚙️ جدول إعدادات الإنتاج (Production Settings)
export const production_settings = pgTable('production_settings', {
  id: serial('id').primaryKey(),
  overrun_tolerance_percent: decimal('overrun_tolerance_percent', { precision: 5, scale: 2 }).notNull().default('3'),
  allow_last_roll_overrun: boolean('allow_last_roll_overrun').notNull().default(true),
  qr_prefix: varchar('qr_prefix', { length: 32 }).notNull().default('ROLL')
});

// 🗑️ جدول الهدر
export const waste = pgTable('waste', {
  id: serial('id').primaryKey(),
  roll_id: integer('roll_id').references(() => rolls.id),
  production_order_id: integer('production_order_id').references(() => production_orders.id),
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



// 🛠️ جدول طلبات الصيانة
export const maintenance_requests = pgTable('maintenance_requests', {
  id: serial('id').primaryKey(),
  request_number: varchar('request_number', { length: 50 }).notNull().unique(), // MO001, MO002, etc.
  machine_id: varchar('machine_id', { length: 20 }).references(() => machines.id),
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

// 🔧 جدول إجراءات الصيانة
export const maintenance_actions = pgTable('maintenance_actions', {
  id: serial('id').primaryKey(),
  action_number: varchar('action_number', { length: 50 }).notNull().unique(), // MA001, MA002, etc.
  maintenance_request_id: integer('maintenance_request_id').notNull().references(() => maintenance_requests.id),
  action_type: varchar('action_type', { length: 50 }).notNull(), // فحص مبدئي / تغيير قطعة غيار / إصلاح مكانيكي / إصلاح كهربائي / إيقاف الماكينة
  description: text('description'),
  text_report: text('text_report'), // التقرير النصي
  spare_parts_request: text('spare_parts_request'), // طلب قطع غيار
  machining_request: text('machining_request'), // طلب مخرطة
  operator_negligence_report: text('operator_negligence_report'), // تبليغ اهمال المشغل
  
  // User tracking
  performed_by: integer('performed_by').notNull().references(() => users.id), // المستخدم الذي نفذ الإجراء
  request_created_by: integer('request_created_by').references(() => users.id), // المستخدم الذي أنشأ طلب الصيانة
  
  // Status and notifications
  requires_management_action: boolean('requires_management_action').default(false), // يحتاج موافقة إدارية
  management_notified: boolean('management_notified').default(false), // تم إبلاغ الإدارة
  
  action_date: timestamp('action_date').defaultNow(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 🔧 جدول قطع الغيار
export const spare_parts = pgTable('spare_parts', {
  id: serial('id').primaryKey(),
  part_id: varchar('part_id', { length: 50 }).notNull().unique(),
  machine_name: varchar('machine_name', { length: 100 }).notNull(),
  part_name: varchar('part_name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  serial_number: varchar('serial_number', { length: 100 }).notNull(),
  specifications: text('specifications'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 📋 جدول بلاغات الصيانة (للإدارة)
export const maintenance_reports = pgTable('maintenance_reports', {
  id: serial('id').primaryKey(),
  report_number: varchar('report_number', { length: 50 }).notNull().unique(), // MR001, MR002, etc.
  maintenance_action_id: integer('maintenance_action_id').notNull().references(() => maintenance_actions.id),
  report_type: varchar('report_type', { length: 30 }).notNull(), // spare_parts / machining / operator_negligence
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 20 }).default('normal'), // low / normal / high / urgent
  
  // Status tracking
  status: varchar('status', { length: 20 }).default('pending'), // pending / reviewed / approved / rejected / completed
  reviewed_by: integer('reviewed_by').references(() => users.id),
  review_notes: text('review_notes'),
  review_date: timestamp('review_date'),
  
  created_by: integer('created_by').notNull().references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ⚠️ جدول بلاغات إهمال المشغلين
export const operator_negligence_reports = pgTable('operator_negligence_reports', {
  id: serial('id').primaryKey(),
  report_number: varchar('report_number', { length: 50 }).notNull().unique(), // ON001, ON002, etc.
  maintenance_action_id: integer('maintenance_action_id').references(() => maintenance_actions.id),
  operator_id: integer('operator_id').notNull().references(() => users.id),
  machine_id: varchar('machine_id', { length: 20 }).references(() => machines.id),
  negligence_type: varchar('negligence_type', { length: 50 }).notNull(), // عدم صيانة / سوء استخدام / عدم اتباع تعليمات
  description: text('description').notNull(),
  evidence: text('evidence'), // الأدلة
  
  // Impact assessment
  damage_cost: decimal('damage_cost', { precision: 10, scale: 2 }),
  downtime_hours: integer('downtime_hours'),
  
  // Status and follow-up
  status: varchar('status', { length: 20 }).default('reported'), // reported / under_investigation / action_taken / closed
  action_taken: text('action_taken'),
  disciplinary_action: varchar('disciplinary_action', { length: 50 }), // تحذير / خصم / إيقاف مؤقت
  
  reported_by: integer('reported_by').notNull().references(() => users.id),
  investigated_by: integer('investigated_by').references(() => users.id),
  report_date: timestamp('report_date').defaultNow(),
  investigation_date: timestamp('investigation_date'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
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
  name: varchar('name', { length: 100 }),
  name_ar: varchar('name_ar', { length: 100 }),
  code: varchar('code', { length: 50 }),
  status: varchar('status', { length: 20 }).default('active'),
});

// 🌍 جدول المواقع الجغرافية
export const locations = pgTable('locations', {
  id: varchar('id', { length: 20 }).primaryKey(),
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
  location_id: varchar('location_id', { length: 20 }).references(() => locations.id),
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
  reference_id: integer('reference_id'), // order_id, production_order_id, etc.
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

// 📚 جدول البرامج التدريبية الميدانية
export const training_programs = pgTable('training_programs', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  title_ar: varchar('title_ar', { length: 200 }),
  description: text('description'),
  description_ar: text('description_ar'),
  type: varchar('type', { length: 20 }).default('field'), // field / online (للمستقبل)
  category: varchar('category', { length: 50 }), // general / department_specific
  training_scope: varchar('training_scope', { length: 50 }), // safety / first_aid / fire_safety / technical / film / printing / cutting
  duration_hours: integer('duration_hours'),
  max_participants: integer('max_participants'),
  location: varchar('location', { length: 200 }), // مكان التدريب الميداني
  prerequisites: text('prerequisites'),
  learning_objectives: json('learning_objectives').$type<string[]>(),
  practical_requirements: text('practical_requirements'), // المتطلبات العملية للتدريب
  instructor_id: integer('instructor_id').references(() => users.id),
  department_id: varchar('department_id', { length: 20 }).references(() => sections.id), // للتدريبات الخاصة بالقسم
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
  training_date: date('training_date'), // تاريخ التدريب الميداني
  attendance_status: varchar('attendance_status', { length: 20 }).default('enrolled'), // enrolled / attended / absent / cancelled
  completion_status: varchar('completion_status', { length: 20 }).default('not_started'), // not_started / completed / failed
  attendance_notes: text('attendance_notes'), // ملاحظات الحضور
  practical_performance: varchar('practical_performance', { length: 20 }), // excellent / good / fair / poor
  final_score: integer('final_score'), // 0-100
  certificate_issued: boolean('certificate_issued').default(false),
  certificate_number: varchar('certificate_number', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 📋 جدول تقييم التدريب الميداني
export const training_evaluations = pgTable('training_evaluations', {
  id: serial('id').primaryKey(),
  enrollment_id: integer('enrollment_id').references(() => training_enrollments.id),
  program_id: integer('program_id').references(() => training_programs.id),
  employee_id: integer('employee_id').references(() => users.id),
  evaluator_id: integer('evaluator_id').references(() => users.id),
  evaluation_date: date('evaluation_date').notNull(),
  
  // معايير التقييم البسيطة
  theoretical_understanding: integer('theoretical_understanding'), // 1-5 فهم نظري
  practical_skills: integer('practical_skills'), // 1-5 مهارات عملية
  safety_compliance: integer('safety_compliance'), // 1-5 الالتزام بالسلامة
  teamwork: integer('teamwork'), // 1-5 العمل الجماعي
  communication: integer('communication'), // 1-5 التواصل
  
  overall_rating: integer('overall_rating'), // 1-5 التقييم الإجمالي
  strengths: text('strengths'), // نقاط القوة
  areas_for_improvement: text('areas_for_improvement'), // مجالات التحسين
  additional_notes: text('additional_notes'), // ملاحظات إضافية
  recommendation: varchar('recommendation', { length: 20 }), // pass / fail / needs_retraining
  
  created_at: timestamp('created_at').defaultNow(),
});

// 🎖️ جدول شهادات التدريب
export const training_certificates = pgTable('training_certificates', {
  id: serial('id').primaryKey(),
  enrollment_id: integer('enrollment_id').references(() => training_enrollments.id).unique(),
  employee_id: integer('employee_id').references(() => users.id),
  program_id: integer('program_id').references(() => training_programs.id),
  certificate_number: varchar('certificate_number', { length: 50 }).unique().notNull(),
  issue_date: date('issue_date').notNull(),
  expiry_date: date('expiry_date'), // بعض الشهادات تنتهي صلاحيتها
  final_score: integer('final_score'),
  certificate_status: varchar('certificate_status', { length: 20 }).default('active'), // active / expired / revoked
  issued_by: integer('issued_by').references(() => users.id),
  certificate_file_url: varchar('certificate_file_url', { length: 500 }), // رابط ملف الشهادة
  created_at: timestamp('created_at').defaultNow(),
});

// 📊 جدول تقييم الأداء
export const performance_reviews = pgTable('performance_reviews', {
  id: serial('id').primaryKey(),
  employee_id: varchar('employee_id', { length: 20 }).notNull().references(() => users.id),
  reviewer_id: varchar('reviewer_id', { length: 20 }).notNull().references(() => users.id),
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
  employee_id: varchar('employee_id', { length: 20 }).notNull().references(() => users.id),
  leave_type_id: integer('leave_type_id').notNull().references(() => leave_types.id),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  days_count: integer('days_count').notNull(),
  reason: text('reason'),
  medical_certificate_url: varchar('medical_certificate_url', { length: 500 }),
  emergency_contact: varchar('emergency_contact', { length: 100 }),
  work_handover: text('work_handover'), // تسليم العمل
  replacement_employee_id: varchar('replacement_employee_id', { length: 20 }).references(() => users.id),
  
  // Approval workflow
  direct_manager_id: varchar('direct_manager_id', { length: 20 }).references(() => users.id),
  direct_manager_status: varchar('direct_manager_status', { length: 20 }).default('pending'), // pending / approved / rejected
  direct_manager_comments: text('direct_manager_comments'),
  direct_manager_action_date: timestamp('direct_manager_action_date'),
  
  hr_status: varchar('hr_status', { length: 20 }).default('pending'), // pending / approved / rejected
  hr_comments: text('hr_comments'),
  hr_action_date: timestamp('hr_action_date'),
  hr_reviewed_by: varchar('hr_reviewed_by', { length: 20 }).references(() => users.id),
  
  final_status: varchar('final_status', { length: 20 }).default('pending'), // pending / approved / rejected / cancelled
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 💰 جدول رصيد الإجازات
export const leave_balances = pgTable('leave_balances', {
  id: serial('id').primaryKey(),
  employee_id: varchar('employee_id', { length: 20 }).notNull().references(() => users.id),
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
  issued_by: varchar('issued_by', { length: 20 }).references(() => users.id),
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

// 📢 جدول الإشعارات والرسائل
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  title_ar: varchar('title_ar', { length: 200 }),
  message: text('message').notNull(),
  message_ar: text('message_ar'),
  type: varchar('type', { length: 30 }).notNull(), // whatsapp / sms / email / push / system
  priority: varchar('priority', { length: 20 }).default('normal'), // low / normal / high / urgent
  
  // Recipients
  recipient_type: varchar('recipient_type', { length: 20 }).notNull(), // user / group / role / all
  recipient_id: varchar('recipient_id', { length: 20 }), // user_id, role_id, or null for 'all'
  phone_number: varchar('phone_number', { length: 20 }),
  
  // Status tracking
  status: varchar('status', { length: 20 }).default('pending'), // pending / sent / delivered / failed / read
  sent_at: timestamp('sent_at'),
  delivered_at: timestamp('delivered_at'),
  read_at: timestamp('read_at'),
  
  // Twilio/WhatsApp specific
  twilio_sid: varchar('twilio_sid', { length: 100 }), // Twilio message SID
  external_status: varchar('external_status', { length: 30 }), // Twilio status callback
  error_message: text('error_message'),
  
  // Metadata
  scheduled_for: timestamp('scheduled_for'), // For scheduled messages
  context_type: varchar('context_type', { length: 30 }), // attendance / order / maintenance / hr
  context_id: varchar('context_id', { length: 50 }), // Related record ID
  
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 📋 جدول قوالب الإشعارات
export const notification_templates = pgTable('notification_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  
  // Template content
  title_template: varchar('title_template', { length: 200 }).notNull(),
  title_template_ar: varchar('title_template_ar', { length: 200 }),
  message_template: text('message_template').notNull(),
  message_template_ar: text('message_template_ar'),
  
  // Configuration
  type: varchar('type', { length: 30 }).notNull(), // whatsapp / sms / email / push
  trigger_event: varchar('trigger_event', { length: 50 }).notNull(), // order_created / attendance_late / etc
  is_active: boolean('is_active').default(true),
  
  // Variables used in template (JSON array)
  variables: json('variables').$type<string[]>(), // ["user_name", "order_number", etc.]
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
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
  productionOrders: many(production_orders),
}));

export const productionOrdersRelations = relations(production_orders, ({ one, many }) => ({
  order: one(orders, { fields: [production_orders.order_id], references: [orders.id] }),
  customerProduct: one(customer_products, { fields: [production_orders.customer_product_id], references: [customer_products.id] }),
  rolls: many(rolls),
  waste: many(waste),
  warehouseReceipts: many(warehouse_receipts),
}));

export const rollsRelations = relations(rolls, ({ one, many }) => ({
  productionOrder: one(production_orders, { fields: [rolls.production_order_id], references: [production_orders.id] }),
  machine: one(machines, { fields: [rolls.machine_id], references: [machines.id] }),
  employee: one(users, { fields: [rolls.employee_id], references: [users.id] }),
  performedBy: one(users, { fields: [rolls.performed_by], references: [users.id] }),
  waste: many(waste),
  qualityChecks: many(quality_checks),
  cuts: many(cuts),
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

export const notificationsRelations = relations(notifications, ({ one }) => ({
  createdBy: one(users, { fields: [notifications.created_by], references: [users.id] }),
}));

export const notificationTemplatesRelations = relations(notification_templates, ({ one }) => ({
  // No direct relations needed for templates
}));

// Types for notifications
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationTemplate = typeof notification_templates.$inferSelect;
export type InsertNotificationTemplate = typeof notification_templates.$inferInsert;

// Insert schemas for notifications
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertNotificationTemplateSchema = createInsertSchema(notification_templates);

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
  category: one(categories, { fields: [customer_products.category_id], references: [categories.id] }),
  item: one(items, { fields: [customer_products.item_id], references: [items.id] }),
  productionOrders: many(production_orders),
}));

// تم حذف علاقات جدول المنتجات

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  // يمكن إضافة علاقات الموردين مع الأصناف لاحقاً
}));

export const trainingRecordsRelations = relations(training_records, ({ one }) => ({
  employee: one(users, { fields: [training_records.employee_id], references: [users.id] }),
}));

export const cutsRelations = relations(cuts, ({ one, many }) => ({
  roll: one(rolls, { fields: [cuts.roll_id], references: [rolls.id] }),
  performedBy: one(users, { fields: [cuts.performed_by], references: [users.id] }),
  warehouseReceipts: many(warehouse_receipts),
}));

export const warehouseReceiptsRelations = relations(warehouse_receipts, ({ one }) => ({
  productionOrder: one(production_orders, { fields: [warehouse_receipts.production_order_id], references: [production_orders.id] }),
  cut: one(cuts, { fields: [warehouse_receipts.cut_id], references: [cuts.id] }),
  receivedBy: one(users, { fields: [warehouse_receipts.received_by], references: [users.id] }),
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


export const insertRollSchema = createInsertSchema(rolls).omit({
  id: true,
  created_at: true,
  roll_number: true,
  completed_at: true,
  roll_seq: true,
  qr_code_text: true,
  qr_png_base64: true,
});

export const insertCutSchema = createInsertSchema(cuts).omit({
  id: true,
  created_at: true,
}).extend({
  cut_weight_kg: z.number().positive("الوزن يجب أن يكون أكبر من صفر")
});

export const insertWarehouseReceiptSchema = createInsertSchema(warehouse_receipts).omit({
  id: true,
  created_at: true,
}).extend({
  received_weight_kg: z.number().positive("الوزن يجب أن يكون أكبر من صفر")
});

export const insertProductionSettingsSchema = createInsertSchema(production_settings).omit({
  id: true,
}).extend({
  overrun_tolerance_percent: z.number().min(0).max(10, "النسبة يجب أن تكون بين 0 و 10")
});

export const insertMaintenanceRequestSchema = createInsertSchema(maintenance_requests).omit({
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
  production_order_number: true,
}).extend({
  // Transform decimal fields to handle both string and number inputs
  quantity_kg: z.union([z.string(), z.number()]).transform((val) => {
    if (val === null || val === undefined || val === '') return '0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? '0' : num.toString();
  })
});


// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SparePart = typeof spare_parts.$inferSelect;
export type InsertSparePart = typeof spare_parts.$inferInsert;
// Legacy order types - will be phased out
export type Roll = typeof rolls.$inferSelect;
export type InsertRoll = z.infer<typeof insertRollSchema>;
export type Machine = typeof machines.$inferSelect;
export type InsertMachine = typeof machines.$inferInsert;
export type MaintenanceRequest = typeof maintenance_requests.$inferSelect;
export type InsertMaintenanceRequest = z.infer<typeof insertMaintenanceRequestSchema>;
export type QualityCheck = typeof quality_checks.$inferSelect;
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
  updated_by: varchar('updated_by', { length: 20 }).references(() => users.id)
});

// 👤 جدول إعدادات المستخدمين
export const user_settings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 20 }).references(() => users.id).notNull(),
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



export const insertCustomerProductSchema = createInsertSchema(customer_products).omit({
  id: true,
  created_at: true,
}).extend({
  // Transform decimal fields to handle both string and number inputs
  width: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num.toString();
  }),
  left_facing: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num.toString();
  }),
  right_facing: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num.toString();
  }),
  thickness: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num.toString();
  }),
  unit_weight_kg: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num.toString();
  }),
  package_weight_kg: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? undefined : num.toString();
  }),
  cutting_length_cm: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? undefined : num;
  }),
  unit_quantity: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? undefined : num;
  }),
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
  created_at: true,
  updated_at: true,
});

export const insertTrainingEvaluationSchema = createInsertSchema(training_evaluations).omit({
  id: true,
  created_at: true,
});

export const insertTrainingCertificateSchema = createInsertSchema(training_certificates).omit({
  id: true,
  created_at: true,
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

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Maintenance Actions Schemas
export const insertMaintenanceActionSchema = createInsertSchema(maintenance_actions).omit({
  id: true,
  action_number: true,
  action_date: true,
  created_at: true,
  updated_at: true,
});

export const insertMaintenanceReportSchema = createInsertSchema(maintenance_reports).omit({
  id: true,
  report_number: true,
  created_at: true,
  updated_at: true,
});

export const insertOperatorNegligenceReportSchema = createInsertSchema(operator_negligence_reports).omit({
  id: true,
  report_number: true,
  created_at: true,
  updated_at: true,
});

// HR System Types
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type TrainingProgram = typeof training_programs.$inferSelect;
export type InsertTrainingProgram = z.infer<typeof insertTrainingProgramSchema>;
export type TrainingMaterial = typeof training_materials.$inferSelect;
export type InsertTrainingMaterial = z.infer<typeof insertTrainingMaterialSchema>;
export type TrainingEnrollment = typeof training_enrollments.$inferSelect;
export type InsertTrainingEnrollment = z.infer<typeof insertTrainingEnrollmentSchema>;
export type TrainingEvaluation = typeof training_evaluations.$inferSelect;
export type InsertTrainingEvaluation = z.infer<typeof insertTrainingEvaluationSchema>;
export type TrainingCertificate = typeof training_certificates.$inferSelect;
export type InsertTrainingCertificate = z.infer<typeof insertTrainingCertificateSchema>;
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

// Maintenance Types
export type MaintenanceAction = typeof maintenance_actions.$inferSelect;
export type InsertMaintenanceAction = z.infer<typeof insertMaintenanceActionSchema>;
export type MaintenanceReport = typeof maintenance_reports.$inferSelect;
export type InsertMaintenanceReport = z.infer<typeof insertMaintenanceReportSchema>;
export type OperatorNegligenceReport = typeof operator_negligence_reports.$inferSelect;
export type InsertOperatorNegligenceReport = z.infer<typeof insertOperatorNegligenceReportSchema>;

// Production Flow Types
export type Cut = typeof cuts.$inferSelect;
export type InsertCut = z.infer<typeof insertCutSchema>;
export type WarehouseReceipt = typeof warehouse_receipts.$inferSelect;
export type InsertWarehouseReceipt = z.infer<typeof insertWarehouseReceiptSchema>;
export type ProductionSettings = typeof production_settings.$inferSelect;
export type InsertProductionSettings = z.infer<typeof insertProductionSettingsSchema>;

// HR Relations
export const trainingProgramsRelations = relations(training_programs, ({ one, many }) => ({
  instructor: one(users, { fields: [training_programs.instructor_id], references: [users.id] }),
  materials: many(training_materials),
  enrollments: many(training_enrollments),
}));

export const trainingMaterialsRelations = relations(training_materials, ({ one }) => ({
  program: one(training_programs, { fields: [training_materials.program_id], references: [training_programs.id] }),
}));

export const trainingEnrollmentsRelations = relations(training_enrollments, ({ one, many }) => ({
  program: one(training_programs, { fields: [training_enrollments.program_id], references: [training_programs.id] }),
  employee: one(users, { fields: [training_enrollments.employee_id], references: [users.id] }),
  evaluation: one(training_evaluations, { fields: [training_enrollments.id], references: [training_evaluations.enrollment_id] }),
  certificate: one(training_certificates, { fields: [training_enrollments.id], references: [training_certificates.enrollment_id] }),
}));

export const trainingEvaluationsRelations = relations(training_evaluations, ({ one }) => ({
  enrollment: one(training_enrollments, { fields: [training_evaluations.enrollment_id], references: [training_enrollments.id] }),
  program: one(training_programs, { fields: [training_evaluations.program_id], references: [training_programs.id] }),
  employee: one(users, { fields: [training_evaluations.employee_id], references: [users.id] }),
  evaluator: one(users, { fields: [training_evaluations.evaluator_id], references: [users.id] }),
}));

export const trainingCertificatesRelations = relations(training_certificates, ({ one }) => ({
  enrollment: one(training_enrollments, { fields: [training_certificates.enrollment_id], references: [training_enrollments.id] }),
  program: one(training_programs, { fields: [training_certificates.program_id], references: [training_programs.id] }),
  employee: one(users, { fields: [training_certificates.employee_id], references: [users.id] }),
  issuer: one(users, { fields: [training_certificates.issued_by], references: [users.id] }),
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

// Sanitized user type that excludes sensitive fields like password
export type SafeUser = Omit<User, 'password'>;

// Import ERP schemas
export * from './erp-schema';
