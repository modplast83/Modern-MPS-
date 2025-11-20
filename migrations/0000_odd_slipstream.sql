CREATE TABLE "admin_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"title_ar" varchar(100),
	"description" text,
	"target_type" varchar(20),
	"target_id" integer,
	"date" date NOT NULL,
	"issued_by" integer
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"date" date NOT NULL,
	"overtime_minutes" integer DEFAULT 0,
	"location" varchar(100),
	"status" varchar(20) DEFAULT 'present'
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"code" varchar(20),
	"parent_id" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "company_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"address" text,
	"tax_number" varchar(20),
	"phone" varchar(20),
	"email" varchar(100),
	"logo_url" varchar(255),
	"working_hours_per_day" integer DEFAULT 8,
	"default_language" varchar(10) DEFAULT 'ar'
);
--> statement-breakpoint
CREATE TABLE "customer_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" varchar(20),
	"category_id" varchar(20),
	"item_id" varchar(20),
	"size_caption" varchar(50),
	"width" varchar(10),
	"left_f" varchar(10),
	"right_f" varchar(10),
	"thickness" varchar(10),
	"thickness_one" varchar(10),
	"printing_cylinder" varchar(10),
	"length_cm" varchar(10),
	"cutting_length_cm" varchar(10),
	"raw_material" varchar(50),
	"master_batch_id" varchar(20),
	"printed" varchar(10),
	"cutting_unit" varchar(50),
	"unit_weight_kg" varchar(10),
	"packing" varchar(100),
	"punching" varchar(50),
	"cover" varchar(100),
	"volum" varchar(10),
	"knife" varchar(10),
	"unit_qty" varchar(10),
	"package_kg" varchar(10),
	"cliche_front_design" text,
	"cliche_back_design" text,
	"notes" text,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"name_ar" varchar(200),
	"code" varchar(20),
	"user_id" varchar(10),
	"plate_drawer_code" varchar(20),
	"city" varchar(50),
	"address" text,
	"tax_number" varchar(20),
	"phone" varchar(20),
	"sales_rep_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"category_id" varchar(20),
	"name" varchar(100) NOT NULL,
	"full_name" varchar(100),
	"name_ar" varchar(100),
	"unit" varchar(20),
	"type" varchar(50),
	"price" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_number" varchar(50) NOT NULL,
	"order_id" integer NOT NULL,
	"customer_product_id" integer,
	"quantity_required" numeric(10, 2) NOT NULL,
	"quantity_produced" numeric(10, 2) DEFAULT '0',
	"status" varchar(30) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "production_orders_job_number_unique" UNIQUE("job_number")
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"year" integer NOT NULL,
	"allocated_days" integer NOT NULL,
	"used_days" integer DEFAULT 0,
	"pending_days" integer DEFAULT 0,
	"remaining_days" integer NOT NULL,
	"carried_forward" integer DEFAULT 0,
	"expires_at" date
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days_count" integer NOT NULL,
	"reason" text,
	"medical_certificate_url" varchar(500),
	"emergency_contact" varchar(100),
	"work_handover" text,
	"replacement_employee_id" integer,
	"direct_manager_id" integer,
	"direct_manager_status" varchar(20) DEFAULT 'pending',
	"direct_manager_comments" text,
	"direct_manager_action_date" timestamp,
	"hr_status" varchar(20) DEFAULT 'pending',
	"hr_comments" text,
	"hr_action_date" timestamp,
	"hr_reviewed_by" integer,
	"final_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"description" text,
	"description_ar" text,
	"days_per_year" integer,
	"is_paid" boolean DEFAULT true,
	"requires_medical_certificate" boolean DEFAULT false,
	"min_notice_days" integer DEFAULT 1,
	"max_consecutive_days" integer,
	"applicable_after_months" integer DEFAULT 0,
	"color" varchar(20) DEFAULT '#3b82f6',
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"coordinates" varchar(100),
	"tolerance_range" integer
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"type" varchar(50),
	"section_id" integer,
	"status" varchar(20) DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "maintenance_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer,
	"reported_by" integer,
	"issue_type" varchar(50),
	"description" text,
	"urgency_level" varchar(20) DEFAULT 'normal',
	"status" varchar(20) DEFAULT 'open',
	"assigned_to" integer,
	"action_taken" text,
	"date_reported" timestamp DEFAULT now(),
	"date_resolved" timestamp
);
--> statement-breakpoint
CREATE TABLE "material_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100) NOT NULL,
	"code" varchar(20),
	"description" text,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "material_groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "mixing_recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"machine_type" varchar(20),
	"formula_layers" integer,
	"material_items" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"customer_id" varchar(20) NOT NULL,
	"status" varchar(30) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"delivery_date" date,
	"notes" text,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "performance_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"description" text,
	"description_ar" text,
	"category" varchar(50),
	"weight_percentage" integer DEFAULT 20,
	"applicable_roles" json,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "performance_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"criteria_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"reviewer_id" integer NOT NULL,
	"review_period_start" date NOT NULL,
	"review_period_end" date NOT NULL,
	"review_type" varchar(20),
	"overall_rating" integer,
	"goals_achievement" integer,
	"skills_rating" integer,
	"behavior_rating" integer,
	"strengths" text,
	"areas_for_improvement" text,
	"development_plan" text,
	"goals_for_next_period" text,
	"employee_comments" text,
	"reviewer_comments" text,
	"hr_comments" text,
	"status" varchar(20) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "quality_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" varchar(20),
	"target_id" integer,
	"result" varchar(10),
	"score" integer,
	"notes" text,
	"checked_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"name_ar" varchar(100),
	"permissions" json
);
--> statement-breakpoint
CREATE TABLE "rolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"roll_number" varchar(50) NOT NULL,
	"job_order_id" integer,
	"weight" numeric(8, 2),
	"status" varchar(30) DEFAULT 'for_printing',
	"current_stage" varchar(30) DEFAULT 'film',
	"machine_id" integer,
	"employee_id" integer,
	"qr_code" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "rolls_roll_number_unique" UNIQUE("roll_number")
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"description" text
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"contact" varchar(100),
	"phone" varchar(20),
	"address" text,
	"materials_supplied" json
);
--> statement-breakpoint
CREATE TABLE "training_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer,
	"employee_id" integer,
	"enrolled_date" timestamp DEFAULT now(),
	"start_date" date,
	"completion_date" date,
	"status" varchar(20) DEFAULT 'enrolled',
	"progress_percentage" integer DEFAULT 0,
	"final_score" integer,
	"certificate_issued" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "training_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer,
	"title" varchar(200) NOT NULL,
	"title_ar" varchar(200),
	"type" varchar(20),
	"content" text,
	"file_url" varchar(500),
	"order_index" integer DEFAULT 0,
	"duration_minutes" integer,
	"is_mandatory" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"title_ar" varchar(200),
	"description" text,
	"description_ar" text,
	"category" varchar(50),
	"duration_hours" integer,
	"max_participants" integer,
	"prerequisites" text,
	"learning_objectives" json,
	"materials" json,
	"instructor_id" integer,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"training_type" varchar(100),
	"training_name" varchar(200),
	"date" date NOT NULL,
	"status" varchar(20) DEFAULT 'completed',
	"instructor" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(100) NOT NULL,
	"display_name" varchar(100),
	"display_name_ar" varchar(100),
	"role_id" integer,
	"section_id" integer,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"violation_type" varchar(50),
	"description" text,
	"date" date NOT NULL,
	"action_taken" text,
	"reported_by" integer
);
--> statement-breakpoint
CREATE TABLE "warehouse_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(30),
	"item_id" integer,
	"quantity" numeric(10, 2) NOT NULL,
	"from_location" varchar(100),
	"to_location" varchar(100),
	"date" timestamp DEFAULT now(),
	"reference_id" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "waste" (
	"id" serial PRIMARY KEY NOT NULL,
	"roll_id" integer,
	"job_order_id" integer,
	"quantity_wasted" numeric(8, 2) NOT NULL,
	"reason" varchar(100),
	"stage" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ar" varchar(100),
	"type" varchar(50) NOT NULL,
	"endpoint" varchar(500) NOT NULL,
	"api_key" varchar(500),
	"username" varchar(100),
	"password" varchar(500),
	"settings" json,
	"is_active" boolean DEFAULT true,
	"last_sync" timestamp,
	"sync_frequency" integer DEFAULT 60,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_entity_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"erp_config_id" integer,
	"local_entity_type" varchar(50) NOT NULL,
	"local_entity_id" integer NOT NULL,
	"external_entity_id" varchar(100) NOT NULL,
	"external_entity_data" json,
	"sync_status" varchar(20) DEFAULT 'synced',
	"last_synced" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_field_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"erp_config_id" integer,
	"entity_type" varchar(50) NOT NULL,
	"local_field" varchar(100) NOT NULL,
	"external_field" varchar(100) NOT NULL,
	"transformation_rule" text,
	"is_required" boolean DEFAULT false,
	"default_value" varchar(500),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_integration_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" varchar(100) NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" varchar(20) DEFAULT 'string',
	"description" text,
	"description_ar" text,
	"category" varchar(50) DEFAULT 'general',
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "erp_integration_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "erp_sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"erp_config_id" integer,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"operation" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"records_processed" integer DEFAULT 0,
	"records_success" integer DEFAULT 0,
	"records_failed" integer DEFAULT 0,
	"error_message" text,
	"sync_duration" integer,
	"data_payload" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_sync_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"erp_config_id" integer,
	"entity_type" varchar(50) NOT NULL,
	"sync_direction" varchar(20) NOT NULL,
	"schedule_type" varchar(20) NOT NULL,
	"schedule_time" varchar(10),
	"last_run" timestamp,
	"next_run" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin_decisions" ADD CONSTRAINT "admin_decisions_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_products" ADD CONSTRAINT "customer_products_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_sales_rep_id_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_customer_product_id_customer_products_id_fk" FOREIGN KEY ("customer_product_id") REFERENCES "public"."customer_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_replacement_employee_id_users_id_fk" FOREIGN KEY ("replacement_employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_direct_manager_id_users_id_fk" FOREIGN KEY ("direct_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_hr_reviewed_by_users_id_fk" FOREIGN KEY ("hr_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machines" ADD CONSTRAINT "machines_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_ratings" ADD CONSTRAINT "performance_ratings_review_id_performance_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."performance_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_ratings" ADD CONSTRAINT "performance_ratings_criteria_id_performance_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."performance_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_job_order_id_production_orders_id_fk" FOREIGN KEY ("job_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_machine_id_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolls" ADD CONSTRAINT "rolls_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_materials" ADD CONSTRAINT "training_materials_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "violations" ADD CONSTRAINT "violations_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste" ADD CONSTRAINT "waste_roll_id_rolls_id_fk" FOREIGN KEY ("roll_id") REFERENCES "public"."rolls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste" ADD CONSTRAINT "waste_job_order_id_production_orders_id_fk" FOREIGN KEY ("job_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_entity_mappings" ADD CONSTRAINT "erp_entity_mappings_erp_config_id_erp_configurations_id_fk" FOREIGN KEY ("erp_config_id") REFERENCES "public"."erp_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_field_mappings" ADD CONSTRAINT "erp_field_mappings_erp_config_id_erp_configurations_id_fk" FOREIGN KEY ("erp_config_id") REFERENCES "public"."erp_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_sync_logs" ADD CONSTRAINT "erp_sync_logs_erp_config_id_erp_configurations_id_fk" FOREIGN KEY ("erp_config_id") REFERENCES "public"."erp_configurations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_sync_schedules" ADD CONSTRAINT "erp_sync_schedules_erp_config_id_erp_configurations_id_fk" FOREIGN KEY ("erp_config_id") REFERENCES "public"."erp_configurations"("id") ON DELETE no action ON UPDATE no action;