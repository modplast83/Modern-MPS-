import { 
  users, 
  orders, 
  job_orders, 
  rolls, 
  machines, 
  customers,
  maintenance_requests,
  quality_checks,
  attendance,
  waste,
  sections,
  material_groups,
  items,
  customer_products,
  locations,
  categories,
  training_records,
  admin_decisions,
  warehouse_transactions,
  mixing_recipes,
  training_programs,
  training_materials,
  training_enrollments,
  performance_reviews,
  performance_criteria,
  performance_ratings,
  leave_types,
  leave_requests,
  leave_balances,
  type User, 
  type InsertUser,
  type Order,
  type InsertOrder,
  type JobOrder,
  type InsertJobOrder,
  type Roll,
  type InsertRoll,
  type Machine,
  type Customer,
  type MaintenanceRequest,
  type InsertMaintenanceRequest,
  type QualityCheck,
  type Attendance,
  type Section,
  type MaterialGroup,
  type Item,
  type CustomerProduct,
  type Location,
  type TrainingRecord,
  type AdminDecision,
  type WarehouseTransaction,
  type MixingRecipe,
  type TrainingProgram,
  type InsertTrainingProgram,
  type TrainingMaterial,
  type InsertTrainingMaterial,
  type TrainingEnrollment,
  type InsertTrainingEnrollment,
  type PerformanceReview,
  type InsertPerformanceReview,
  type PerformanceCriteria,
  type InsertPerformanceCriteria,
  type PerformanceRating,
  type InsertPerformanceRating,
  type LeaveType,
  type InsertLeaveType,
  type LeaveRequest,
  type InsertLeaveRequest,
  type LeaveBalance,
  type InsertLeaveBalance
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, sum, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  
  // Job Orders
  getJobOrders(): Promise<JobOrder[]>;
  getJobOrdersByStage(stage: string): Promise<JobOrder[]>;
  createJobOrder(jobOrder: InsertJobOrder): Promise<JobOrder>;
  
  // Rolls
  getRolls(): Promise<Roll[]>;
  getRollsByJobOrder(jobOrderId: number): Promise<Roll[]>;
  createRoll(roll: InsertRoll): Promise<Roll>;
  updateRoll(id: number, updates: Partial<Roll>): Promise<Roll>;
  
  // Machines
  getMachines(): Promise<Machine[]>;
  getMachineById(id: number): Promise<Machine | undefined>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  
  // Customer Products (replacing the old Product table)
  getCustomerProducts(): Promise<CustomerProduct[]>;
  createCustomerProduct(customerProduct: any): Promise<CustomerProduct>;
  
  // Customers
  createCustomer(customer: any): Promise<Customer>;
  createMachine(machine: any): Promise<Machine>;
  createSection(section: any): Promise<Section>;
  createMaterialGroup(materialGroup: any): Promise<MaterialGroup>;
  createItem(item: any): Promise<Item>;
  createCustomerProduct(customerProduct: any): Promise<CustomerProduct>;
  createLocation(location: any): Promise<Location>;
  
  // Training Records
  getTrainingRecords(): Promise<TrainingRecord[]>;
  createTrainingRecord(record: any): Promise<TrainingRecord>;
  
  // Admin Decisions  
  getAdminDecisions(): Promise<AdminDecision[]>;
  createAdminDecision(decision: any): Promise<AdminDecision>;
  
  // Warehouse Transactions
  getWarehouseTransactions(): Promise<WarehouseTransaction[]>;
  createWarehouseTransaction(transaction: any): Promise<WarehouseTransaction>;
  
  // Mixing Recipes
  getMixingRecipes(): Promise<MixingRecipe[]>;
  createMixingRecipe(recipe: any): Promise<MixingRecipe>;
  
  // ERP Integration
  getERPConfigurations(): Promise<any[]>;
  createERPConfiguration(config: any): Promise<any>;
  updateERPConfiguration(id: number, config: any): Promise<any>;
  deleteERPConfiguration(id: number): Promise<boolean>;
  getERPSyncLogs(configId?: number): Promise<any[]>;
  createERPSyncLog(log: any): Promise<any>;
  getERPEntityMappings(configId: number, entityType: string): Promise<any[]>;
  createERPEntityMapping(mapping: any): Promise<any>;
  
  // Sections
  getSections(): Promise<Section[]>;
  
  // Material Groups
  getMaterialGroups(): Promise<MaterialGroup[]>;
  
  // Items
  getItems(): Promise<Item[]>;
  
  // Customer Products
  getCustomerProducts(): Promise<CustomerProduct[]>;
  
  // Locations
  getLocations(): Promise<Location[]>;
  
  // Users
  getUsers(): Promise<User[]>;
  
  // Categories
  getCategories(): Promise<any[]>;
  
  // HR System - Training Programs
  getTrainingPrograms(): Promise<TrainingProgram[]>;
  createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram>;
  updateTrainingProgram(id: number, updates: Partial<TrainingProgram>): Promise<TrainingProgram>;
  getTrainingProgramById(id: number): Promise<TrainingProgram | undefined>;
  
  // HR System - Training Materials
  getTrainingMaterials(programId?: number): Promise<TrainingMaterial[]>;
  createTrainingMaterial(material: InsertTrainingMaterial): Promise<TrainingMaterial>;
  updateTrainingMaterial(id: number, updates: Partial<TrainingMaterial>): Promise<TrainingMaterial>;
  deleteTrainingMaterial(id: number): Promise<boolean>;
  
  // HR System - Training Enrollments  
  getTrainingEnrollments(employeeId?: number): Promise<TrainingEnrollment[]>;
  createTrainingEnrollment(enrollment: InsertTrainingEnrollment): Promise<TrainingEnrollment>;
  updateTrainingEnrollment(id: number, updates: Partial<TrainingEnrollment>): Promise<TrainingEnrollment>;
  getEnrollmentsByProgram(programId: number): Promise<TrainingEnrollment[]>;
  
  // HR System - Performance Reviews
  getPerformanceReviews(employeeId?: number): Promise<PerformanceReview[]>;
  createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview>;
  updatePerformanceReview(id: number, updates: Partial<PerformanceReview>): Promise<PerformanceReview>;
  getPerformanceReviewById(id: number): Promise<PerformanceReview | undefined>;
  
  // HR System - Performance Criteria
  getPerformanceCriteria(): Promise<PerformanceCriteria[]>;
  createPerformanceCriteria(criteria: InsertPerformanceCriteria): Promise<PerformanceCriteria>;
  updatePerformanceCriteria(id: number, updates: Partial<PerformanceCriteria>): Promise<PerformanceCriteria>;
  
  // HR System - Performance Ratings
  getPerformanceRatings(reviewId: number): Promise<PerformanceRating[]>;
  createPerformanceRating(rating: InsertPerformanceRating): Promise<PerformanceRating>;
  updatePerformanceRating(id: number, updates: Partial<PerformanceRating>): Promise<PerformanceRating>;
  
  // HR System - Leave Types
  getLeaveTypes(): Promise<LeaveType[]>;
  createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType>;
  updateLeaveType(id: number, updates: Partial<LeaveType>): Promise<LeaveType>;
  
  // HR System - Leave Requests
  getLeaveRequests(employeeId?: number): Promise<LeaveRequest[]>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest>;
  getLeaveRequestById(id: number): Promise<LeaveRequest | undefined>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  
  // HR System - Leave Balances
  getLeaveBalances(employeeId: number, year?: number): Promise<LeaveBalance[]>;
  createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance>;
  updateLeaveBalance(id: number, updates: Partial<LeaveBalance>): Promise<LeaveBalance>;
  getLeaveBalanceByType(employeeId: number, leaveTypeId: number, year: number): Promise<LeaveBalance | undefined>;
  
  // Maintenance
  getMaintenanceRequests(): Promise<MaintenanceRequest[]>;
  createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest>;
  
  // Quality
  getQualityChecks(): Promise<QualityCheck[]>;
  
  // Attendance
  getAttendance(): Promise<Attendance[]>;
  
  // Users list
  getUsers(): Promise<User[]>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<{
    activeOrders: number;
    productionRate: number;
    qualityScore: number;
    wastePercentage: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Delete methods
  async deleteMaterialGroup(id: number): Promise<void> {
    await db.delete(material_groups).where(eq(material_groups.id, id));
  }

  async deleteSection(id: number): Promise<void> {
    await db.delete(sections).where(eq(sections.id, id));
  }

  async deleteItem(id: string): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  async deleteCustomerProduct(id: number): Promise<void> {
    await db.delete(customer_products).where(eq(customer_products.id, id));
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  async deleteMachine(id: number): Promise<void> {
    await db.delete(machines).where(eq(machines.id, id));
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.created_at));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = `ORD-${Date.now()}`;
    const [order] = await db
      .insert(orders)
      .values({ ...insertOrder, order_number: orderNumber })
      .returning();
    return order;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getJobOrders(): Promise<JobOrder[]> {
    return await db.select().from(job_orders).orderBy(desc(job_orders.created_at));
  }

  async getJobOrdersByStage(stage: string): Promise<JobOrder[]> {
    return await db
      .select({
        id: job_orders.id,
        job_number: job_orders.job_number,
        order_id: job_orders.order_id,
        customer_product_id: job_orders.customer_product_id,
        quantity_required: job_orders.quantity_required,
        quantity_produced: job_orders.quantity_produced,
        status: job_orders.status,
        created_at: job_orders.created_at
      })
      .from(job_orders)
      .innerJoin(rolls, eq(job_orders.id, rolls.job_order_id))
      .where(eq(rolls.current_stage, stage))
      .groupBy(job_orders.id)
      .orderBy(desc(job_orders.created_at));
  }

  async createJobOrder(insertJobOrder: InsertJobOrder): Promise<JobOrder> {
    const jobNumber = `JO-${Date.now()}`;
    const [jobOrder] = await db
      .insert(job_orders)
      .values({ ...insertJobOrder, job_number: jobNumber })
      .returning();
    return jobOrder;
  }

  async getRolls(): Promise<Roll[]> {
    return await db.select().from(rolls).orderBy(desc(rolls.created_at));
  }

  async getRollsByJobOrder(jobOrderId: number): Promise<Roll[]> {
    return await db.select().from(rolls).where(eq(rolls.job_order_id, jobOrderId));
  }

  async createRoll(insertRoll: InsertRoll): Promise<Roll> {
    const rollNumber = `R-${Date.now()}`;
    const qrCode = `QR-${rollNumber}`;
    const [roll] = await db
      .insert(rolls)
      .values({ 
        ...insertRoll, 
        roll_number: rollNumber,
        qr_code: qrCode 
      })
      .returning();
    return roll;
  }

  async updateRoll(id: number, updates: Partial<Roll>): Promise<Roll> {
    const [roll] = await db
      .update(rolls)
      .set(updates)
      .where(eq(rolls.id, id))
      .returning();
    return roll;
  }

  async getMachines(): Promise<Machine[]> {
    return await db.select().from(machines);
  }

  async getMachineById(id: number): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine || undefined;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  // Customer Products - replaced the old Products table

  async getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    return await db
      .select()
      .from(maintenance_requests)
      .orderBy(desc(maintenance_requests.date_reported));
  }

  async createMaintenanceRequest(request: InsertMaintenanceRequest): Promise<MaintenanceRequest> {
    const [maintenanceRequest] = await db
      .insert(maintenance_requests)
      .values(request)
      .returning();
    return maintenanceRequest;
  }

  async getQualityChecks(): Promise<QualityCheck[]> {
    return await db
      .select()
      .from(quality_checks)
      .orderBy(desc(quality_checks.created_at));
  }

  async getAttendance(): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .orderBy(desc(attendance.date));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Replaced by createCustomerProduct

  async createCustomer(customer: any): Promise<Customer> {
    // Generate a new customer ID in format CID001, CID002, etc.
    const existingCustomers = await db.select({ id: customers.id }).from(customers);
    const customerIds = existingCustomers.map(c => c.id);
    const maxNumber = customerIds
      .filter(id => id.startsWith('CID'))
      .map(id => parseInt(id.substring(3)))
      .filter(num => !isNaN(num))
      .reduce((max, num) => Math.max(max, num), 0);
    
    const newId = `CID${String(maxNumber + 1).padStart(3, '0')}`;
    
    const [newCustomer] = await db
      .insert(customers)
      .values({
        ...customer,
        id: newId
      })
      .returning();
    return newCustomer;
  }

  async createMachine(machine: any): Promise<Machine> {
    const [newMachine] = await db
      .insert(machines)
      .values(machine)
      .returning();
    return newMachine;
  }

  async createSection(section: any): Promise<Section> {
    const [newSection] = await db
      .insert(sections)
      .values(section)
      .returning();
    return newSection;
  }

  async createMaterialGroup(materialGroup: any): Promise<MaterialGroup> {
    const [newMaterialGroup] = await db
      .insert(material_groups)
      .values(materialGroup)
      .returning();
    return newMaterialGroup;
  }

  async createItem(item: any): Promise<Item> {
    const [newItem] = await db
      .insert(items)
      .values(item)
      .returning();
    return newItem;
  }

  async createCustomerProduct(customerProduct: any): Promise<CustomerProduct> {
    const [newCustomerProduct] = await db
      .insert(customer_products)
      .values(customerProduct)
      .returning();
    return newCustomerProduct;
  }

  async createLocation(location: any): Promise<Location> {
    const [newLocation] = await db
      .insert(locations)
      .values(location)
      .returning();
    return newLocation;
  }

  async getSections(): Promise<Section[]> {
    return await db.select().from(sections);
  }

  async getMaterialGroups(): Promise<MaterialGroup[]> {
    return await db.select().from(material_groups);
  }

  async getItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async getCustomerProducts(): Promise<CustomerProduct[]> {
    return await db.select().from(customer_products);
  }

  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async getCategories(): Promise<any[]> {
    return await db.select().from(categories);
  }

  async getDashboardStats(): Promise<{
    activeOrders: number;
    productionRate: number;
    qualityScore: number;
    wastePercentage: number;
  }> {
    // Get active orders count
    const [activeOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'for_production'));
    
    const activeOrders = activeOrdersResult?.count || 0;

    // Get production rate (percentage based on job orders)
    const [productionResult] = await db
      .select({
        totalRequired: sum(job_orders.quantity_required),
        totalProduced: sum(job_orders.quantity_produced)
      })
      .from(job_orders);

    const productionRate = productionResult?.totalRequired && Number(productionResult.totalRequired) > 0
      ? Math.round((Number(productionResult.totalProduced) / Number(productionResult.totalRequired)) * 100)
      : 0;

    // Get quality score (average from quality checks)
    const [qualityResult] = await db
      .select({
        avgScore: sql<number>`AVG(CAST(${quality_checks.score} AS DECIMAL))`
      })
      .from(quality_checks)
      .where(sql`${quality_checks.created_at} >= NOW() - INTERVAL '30 days'`);

    const qualityScore = qualityResult?.avgScore 
      ? Math.round(Number(qualityResult.avgScore) * 20) // Convert 1-5 to percentage
      : 95; // Default high score

    // Get waste percentage
    const [wasteResult] = await db
      .select({ 
        totalWaste: sum(waste.quantity_wasted)
      })
      .from(waste)
      .where(sql`${waste.created_at} >= NOW() - INTERVAL '7 days'`);

    const wastePercentage = wasteResult?.totalWaste 
      ? Number(wasteResult.totalWaste) / 100 // Convert to percentage
      : 2.5; // Default low waste

    return {
      activeOrders,
      productionRate,
      qualityScore,
      wastePercentage
    };
  }

  // Training Records
  async getTrainingRecords(): Promise<TrainingRecord[]> {
    return await db.select().from(training_records).orderBy(desc(training_records.date));
  }

  async createTrainingRecord(record: any): Promise<TrainingRecord> {
    const [newRecord] = await db
      .insert(training_records)
      .values(record)
      .returning();
    return newRecord;
  }

  // Admin Decisions
  async getAdminDecisions(): Promise<AdminDecision[]> {
    return await db.select().from(admin_decisions).orderBy(desc(admin_decisions.date));
  }

  async createAdminDecision(decision: any): Promise<AdminDecision> {
    const [newDecision] = await db
      .insert(admin_decisions)
      .values(decision)
      .returning();
    return newDecision;
  }

  // Warehouse Transactions
  async getWarehouseTransactions(): Promise<WarehouseTransaction[]> {
    return await db.select().from(warehouse_transactions).orderBy(desc(warehouse_transactions.date));
  }

  async createWarehouseTransaction(transaction: any): Promise<WarehouseTransaction> {
    const [newTransaction] = await db
      .insert(warehouse_transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  // Mixing Recipes
  async getMixingRecipes(): Promise<MixingRecipe[]> {
    return await db.select().from(mixing_recipes).orderBy(desc(mixing_recipes.created_at));
  }

  async createMixingRecipe(recipe: any): Promise<MixingRecipe> {
    const [newRecipe] = await db
      .insert(mixing_recipes)
      .values(recipe)
      .returning();
    return newRecipe;
  }

  // ERP Integration Methods
  async getERPConfigurations(): Promise<any[]> {
    // For now, return mock data until we add the ERP tables to the main schema
    return [
      {
        id: 1,
        name: 'SAP Production System',
        name_ar: 'نظام ساب للإنتاج',
        type: 'SAP',
        endpoint: 'https://sap-server.company.com:8000',
        is_active: true,
        last_sync: new Date('2025-01-31T10:00:00Z'),
        sync_frequency: 60
      },
      {
        id: 2,
        name: 'Odoo CRM Integration',
        name_ar: 'تكامل أودو لإدارة العملاء',
        type: 'Odoo',
        endpoint: 'https://odoo.company.com',
        is_active: true,
        last_sync: new Date('2025-01-31T09:30:00Z'),
        sync_frequency: 120
      },
      {
        id: 3,
        name: 'Oracle Financials',
        name_ar: 'نظام أوراكل المالي',
        type: 'Oracle',
        endpoint: 'https://oracle-fin.company.com',
        is_active: false,
        last_sync: null,
        sync_frequency: 1440
      }
    ];
  }

  async createERPConfiguration(config: any): Promise<any> {
    // Mock implementation
    const newConfig = {
      id: Date.now(),
      ...config,
      created_at: new Date(),
      updated_at: new Date()
    };
    return newConfig;
  }

  async updateERPConfiguration(id: number, config: any): Promise<any> {
    // Mock implementation
    return {
      id,
      ...config,
      updated_at: new Date()
    };
  }

  async deleteERPConfiguration(id: number): Promise<boolean> {
    // Mock implementation
    return true;
  }

  async getERPSyncLogs(configId?: number): Promise<any[]> {
    // Mock sync logs
    return [
      {
        id: 1,
        erp_config_id: 1,
        entity_type: 'customers',
        operation: 'sync_in',
        status: 'success',
        records_processed: 150,
        records_success: 148,
        records_failed: 2,
        sync_duration: 45,
        created_at: new Date('2025-01-31T10:00:00Z'),
        error_message: null
      },
      {
        id: 2,
        erp_config_id: 1,
        entity_type: 'products',
        operation: 'sync_in',
        status: 'success',
        records_processed: 85,
        records_success: 85,
        records_failed: 0,
        sync_duration: 30,
        created_at: new Date('2025-01-31T10:05:00Z'),
        error_message: null
      },
      {
        id: 3,
        erp_config_id: 2,
        entity_type: 'orders',
        operation: 'sync_out',
        status: 'failed',
        records_processed: 25,
        records_success: 0,
        records_failed: 25,
        sync_duration: 5,
        created_at: new Date('2025-01-31T09:30:00Z'),
        error_message: 'Authentication failed: Invalid credentials'
      }
    ].filter(log => !configId || log.erp_config_id === configId);
  }

  async createERPSyncLog(log: any): Promise<any> {
    // Mock implementation
    return {
      id: Date.now(),
      ...log,
      created_at: new Date()
    };
  }

  async getERPEntityMappings(configId: number, entityType: string): Promise<any[]> {
    // Mock entity mappings
    return [
      {
        id: 1,
        erp_config_id: configId,
        local_entity_type: entityType,
        local_entity_id: 1,
        external_entity_id: 'CUST_001',
        sync_status: 'synced',
        last_synced: new Date('2025-01-31T10:00:00Z')
      },
      {
        id: 2,
        erp_config_id: configId,
        local_entity_type: entityType,
        local_entity_id: 2,
        external_entity_id: 'CUST_002',
        sync_status: 'pending',
        last_synced: new Date('2025-01-30T15:30:00Z')
      }
    ];
  }

  async createERPEntityMapping(mapping: any): Promise<any> {
    // Mock implementation
    return {
      id: Date.now(),
      ...mapping,
      created_at: new Date(),
      last_synced: new Date()
    };
  }

  // ============ HR System Implementation ============

  // Training Programs
  async getTrainingPrograms(): Promise<TrainingProgram[]> {
    return await db.select().from(training_programs).orderBy(desc(training_programs.created_at));
  }

  async createTrainingProgram(program: InsertTrainingProgram): Promise<TrainingProgram> {
    const [trainingProgram] = await db.insert(training_programs).values(program as any).returning();
    return trainingProgram;
  }

  async updateTrainingProgram(id: number, updates: Partial<TrainingProgram>): Promise<TrainingProgram> {
    const [trainingProgram] = await db
      .update(training_programs)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(training_programs.id, id))
      .returning();
    return trainingProgram;
  }

  async getTrainingProgramById(id: number): Promise<TrainingProgram | undefined> {
    const [program] = await db.select().from(training_programs).where(eq(training_programs.id, id));
    return program || undefined;
  }

  // Training Materials
  async getTrainingMaterials(programId?: number): Promise<TrainingMaterial[]> {
    const query = db.select().from(training_materials);
    if (programId) {
      return await query.where(eq(training_materials.program_id, programId)).orderBy(training_materials.order_index);
    }
    return await query.orderBy(training_materials.program_id, training_materials.order_index);
  }

  async createTrainingMaterial(material: InsertTrainingMaterial): Promise<TrainingMaterial> {
    const [trainingMaterial] = await db.insert(training_materials).values(material).returning();
    return trainingMaterial;
  }

  async updateTrainingMaterial(id: number, updates: Partial<TrainingMaterial>): Promise<TrainingMaterial> {
    const [trainingMaterial] = await db
      .update(training_materials)
      .set(updates)
      .where(eq(training_materials.id, id))
      .returning();
    return trainingMaterial;
  }

  async deleteTrainingMaterial(id: number): Promise<boolean> {
    const result = await db.delete(training_materials).where(eq(training_materials.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Training Enrollments
  async getTrainingEnrollments(employeeId?: number): Promise<TrainingEnrollment[]> {
    const query = db.select().from(training_enrollments);
    if (employeeId) {
      return await query.where(eq(training_enrollments.employee_id, employeeId)).orderBy(desc(training_enrollments.enrolled_date));
    }
    return await query.orderBy(desc(training_enrollments.enrolled_date));
  }

  async createTrainingEnrollment(enrollment: InsertTrainingEnrollment): Promise<TrainingEnrollment> {
    const [trainingEnrollment] = await db.insert(training_enrollments).values(enrollment).returning();
    return trainingEnrollment;
  }

  async updateTrainingEnrollment(id: number, updates: Partial<TrainingEnrollment>): Promise<TrainingEnrollment> {
    const [trainingEnrollment] = await db
      .update(training_enrollments)
      .set(updates)
      .where(eq(training_enrollments.id, id))
      .returning();
    return trainingEnrollment;
  }

  async getEnrollmentsByProgram(programId: number): Promise<TrainingEnrollment[]> {
    return await db.select().from(training_enrollments)
      .where(eq(training_enrollments.program_id, programId))
      .orderBy(desc(training_enrollments.enrolled_date));
  }

  // Performance Reviews
  async getPerformanceReviews(employeeId?: number): Promise<PerformanceReview[]> {
    const query = db.select().from(performance_reviews);
    if (employeeId) {
      return await query.where(eq(performance_reviews.employee_id, employeeId)).orderBy(desc(performance_reviews.created_at));
    }
    return await query.orderBy(desc(performance_reviews.created_at));
  }

  async createPerformanceReview(review: InsertPerformanceReview): Promise<PerformanceReview> {
    const [performanceReview] = await db.insert(performance_reviews).values(review).returning();
    return performanceReview;
  }

  async updatePerformanceReview(id: number, updates: Partial<PerformanceReview>): Promise<PerformanceReview> {
    const [performanceReview] = await db
      .update(performance_reviews)
      .set(updates)
      .where(eq(performance_reviews.id, id))
      .returning();
    return performanceReview;
  }

  async getPerformanceReviewById(id: number): Promise<PerformanceReview | undefined> {
    const [review] = await db.select().from(performance_reviews).where(eq(performance_reviews.id, id));
    return review || undefined;
  }

  // Performance Criteria
  async getPerformanceCriteria(): Promise<PerformanceCriteria[]> {
    return await db.select().from(performance_criteria).where(eq(performance_criteria.is_active, true));
  }

  async createPerformanceCriteria(criteria: InsertPerformanceCriteria): Promise<PerformanceCriteria> {
    const [performanceCriteria] = await db.insert(performance_criteria).values(criteria as any).returning();
    return performanceCriteria;
  }

  async updatePerformanceCriteria(id: number, updates: Partial<PerformanceCriteria>): Promise<PerformanceCriteria> {
    const [performanceCriteria] = await db
      .update(performance_criteria)
      .set(updates)
      .where(eq(performance_criteria.id, id))
      .returning();
    return performanceCriteria;
  }

  // Performance Ratings
  async getPerformanceRatings(reviewId: number): Promise<PerformanceRating[]> {
    return await db.select().from(performance_ratings)
      .where(eq(performance_ratings.review_id, reviewId));
  }

  async createPerformanceRating(rating: InsertPerformanceRating): Promise<PerformanceRating> {
    const [performanceRating] = await db.insert(performance_ratings).values(rating).returning();
    return performanceRating;
  }

  async updatePerformanceRating(id: number, updates: Partial<PerformanceRating>): Promise<PerformanceRating> {
    const [performanceRating] = await db
      .update(performance_ratings)
      .set(updates)
      .where(eq(performance_ratings.id, id))
      .returning();
    return performanceRating;
  }

  // Leave Types
  async getLeaveTypes(): Promise<LeaveType[]> {
    return await db.select().from(leave_types).where(eq(leave_types.is_active, true));
  }

  async createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType> {
    const [newLeaveType] = await db.insert(leave_types).values(leaveType).returning();
    return newLeaveType;
  }

  async updateLeaveType(id: number, updates: Partial<LeaveType>): Promise<LeaveType> {
    const [leaveType] = await db
      .update(leave_types)
      .set(updates)
      .where(eq(leave_types.id, id))
      .returning();
    return leaveType;
  }

  // Leave Requests
  async getLeaveRequests(employeeId?: number): Promise<LeaveRequest[]> {
    const query = db.select().from(leave_requests);
    if (employeeId) {
      return await query.where(eq(leave_requests.employee_id, employeeId)).orderBy(desc(leave_requests.created_at));
    }
    return await query.orderBy(desc(leave_requests.created_at));
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const [leaveRequest] = await db.insert(leave_requests).values(request).returning();
    return leaveRequest;
  }

  async updateLeaveRequest(id: number, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const [leaveRequest] = await db
      .update(leave_requests)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(leave_requests.id, id))
      .returning();
    return leaveRequest;
  }

  async getLeaveRequestById(id: number): Promise<LeaveRequest | undefined> {
    const [request] = await db.select().from(leave_requests).where(eq(leave_requests.id, id));
    return request || undefined;
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leave_requests)
      .where(eq(leave_requests.final_status, 'pending'))
      .orderBy(desc(leave_requests.created_at));
  }

  // Leave Balances
  async getLeaveBalances(employeeId: number, year?: number): Promise<LeaveBalance[]> {
    if (year) {
      return await db.select().from(leave_balances).where(and(
        eq(leave_balances.employee_id, employeeId),
        eq(leave_balances.year, year)
      ));
    }
    return await db.select().from(leave_balances).where(eq(leave_balances.employee_id, employeeId));
  }

  async createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance> {
    const [leaveBalance] = await db.insert(leave_balances).values(balance).returning();
    return leaveBalance;
  }

  async updateLeaveBalance(id: number, updates: Partial<LeaveBalance>): Promise<LeaveBalance> {
    const [leaveBalance] = await db
      .update(leave_balances)
      .set(updates)
      .where(eq(leave_balances.id, id))
      .returning();
    return leaveBalance;
  }

  async getLeaveBalanceByType(employeeId: number, leaveTypeId: number, year: number): Promise<LeaveBalance | undefined> {
    const [balance] = await db.select().from(leave_balances)
      .where(and(
        eq(leave_balances.employee_id, employeeId),
        eq(leave_balances.leave_type_id, leaveTypeId),
        eq(leave_balances.year, year)
      ));
    return balance || undefined;
  }
}

export const storage = new DatabaseStorage();