import { pgTable, serial, varchar, integer, boolean, timestamp, json, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// جدول إعدادات أنظمة ERP
export const erp_configurations = pgTable('erp_configurations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  name_ar: varchar('name_ar', { length: 100 }),
  type: varchar('type', { length: 50 }).notNull(), // SAP, Oracle, Odoo, QuickBooks, Custom
  endpoint: varchar('endpoint', { length: 500 }).notNull(),
  api_key: varchar('api_key', { length: 500 }),
  username: varchar('username', { length: 100 }),
  password: varchar('password', { length: 500 }), // Should be encrypted
  settings: json('settings').$type<Record<string, any>>(),
  is_active: boolean('is_active').default(true),
  last_sync: timestamp('last_sync'),
  sync_frequency: integer('sync_frequency').default(60), // minutes
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// جدول سجلات المزامنة
export const erp_sync_logs = pgTable('erp_sync_logs', {
  id: serial('id').primaryKey(),
  erp_config_id: integer('erp_config_id').references(() => erp_configurations.id),
  entity_type: varchar('entity_type', { length: 50 }).notNull(), // customers, products, orders, inventory
  entity_id: integer('entity_id'),
  operation: varchar('operation', { length: 50 }).notNull(), // sync_in, sync_out, update, delete, bulk_sync
  status: varchar('status', { length: 20 }).notNull(), // pending, success, failed, partial
  records_processed: integer('records_processed').default(0),
  records_success: integer('records_success').default(0),
  records_failed: integer('records_failed').default(0),
  error_message: text('error_message'),
  sync_duration: integer('sync_duration'), // seconds
  data_payload: json('data_payload').$type<Record<string, any>>(),
  created_at: timestamp('created_at').defaultNow()
});

// جدول ربط الكيانات بين النظامين
export const erp_entity_mappings = pgTable('erp_entity_mappings', {
  id: serial('id').primaryKey(),
  erp_config_id: integer('erp_config_id').references(() => erp_configurations.id),
  local_entity_type: varchar('local_entity_type', { length: 50 }).notNull(), // customers, products, orders
  local_entity_id: integer('local_entity_id').notNull(),
  external_entity_id: varchar('external_entity_id', { length: 100 }).notNull(),
  external_entity_data: json('external_entity_data').$type<Record<string, any>>(),
  sync_status: varchar('sync_status', { length: 20 }).default('synced'), // synced, pending, failed
  last_synced: timestamp('last_synced').defaultNow(),
  created_at: timestamp('created_at').defaultNow()
});

// جدول قواعد التحويل والربط
export const erp_field_mappings = pgTable('erp_field_mappings', {
  id: serial('id').primaryKey(),
  erp_config_id: integer('erp_config_id').references(() => erp_configurations.id),
  entity_type: varchar('entity_type', { length: 50 }).notNull(),
  local_field: varchar('local_field', { length: 100 }).notNull(),
  external_field: varchar('external_field', { length: 100 }).notNull(),
  transformation_rule: text('transformation_rule'), // JSON or code for field transformation
  is_required: boolean('is_required').default(false),
  default_value: varchar('default_value', { length: 500 }),
  created_at: timestamp('created_at').defaultNow()
});

// جدول جداول المزامنة المجدولة
export const erp_sync_schedules = pgTable('erp_sync_schedules', {
  id: serial('id').primaryKey(),
  erp_config_id: integer('erp_config_id').references(() => erp_configurations.id),
  entity_type: varchar('entity_type', { length: 50 }).notNull(),
  sync_direction: varchar('sync_direction', { length: 20 }).notNull(), // in, out, bidirectional
  schedule_type: varchar('schedule_type', { length: 20 }).notNull(), // manual, hourly, daily, weekly
  schedule_time: varchar('schedule_time', { length: 10 }), // HH:MM for daily/weekly
  last_run: timestamp('last_run'),
  next_run: timestamp('next_run'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow()
});

// جدول إعدادات التكامل المتقدمة
export const erp_integration_settings = pgTable('erp_integration_settings', {
  id: serial('id').primaryKey(),
  setting_key: varchar('setting_key', { length: 100 }).notNull().unique(),
  setting_value: text('setting_value').notNull(),
  setting_type: varchar('setting_type', { length: 20 }).default('string'), // string, number, boolean, json
  description: text('description'),
  description_ar: text('description_ar'),
  category: varchar('category', { length: 50 }).default('general'),
  is_system: boolean('is_system').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Insert schemas
export const insertERPConfigurationSchema = createInsertSchema(erp_configurations).omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_sync: true
});

export const insertERPSyncLogSchema = createInsertSchema(erp_sync_logs).omit({
  id: true,
  created_at: true
});

export const insertERPEntityMappingSchema = createInsertSchema(erp_entity_mappings).omit({
  id: true,
  created_at: true,
  last_synced: true
});

export const insertERPFieldMappingSchema = createInsertSchema(erp_field_mappings).omit({
  id: true,
  created_at: true
});

export const insertERPSyncScheduleSchema = createInsertSchema(erp_sync_schedules).omit({
  id: true,
  created_at: true,
  last_run: true,
  next_run: true
});

export const insertERPIntegrationSettingSchema = createInsertSchema(erp_integration_settings).omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Types
export type ERPConfiguration = typeof erp_configurations.$inferSelect;
export type InsertERPConfiguration = z.infer<typeof insertERPConfigurationSchema>;
export type ERPSyncLog = typeof erp_sync_logs.$inferSelect;
export type InsertERPSyncLog = z.infer<typeof insertERPSyncLogSchema>;
export type ERPEntityMapping = typeof erp_entity_mappings.$inferSelect;
export type InsertERPEntityMapping = z.infer<typeof insertERPEntityMappingSchema>;
export type ERPFieldMapping = typeof erp_field_mappings.$inferSelect;
export type InsertERPFieldMapping = z.infer<typeof insertERPFieldMappingSchema>;
export type ERPSyncSchedule = typeof erp_sync_schedules.$inferSelect;
export type InsertERPSyncSchedule = z.infer<typeof insertERPSyncScheduleSchema>;
export type ERPIntegrationSetting = typeof erp_integration_settings.$inferSelect;
export type InsertERPIntegrationSetting = z.infer<typeof insertERPIntegrationSettingSchema>;