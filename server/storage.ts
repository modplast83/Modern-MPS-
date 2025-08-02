import { 
  users, 
  orders, 
  job_orders, 
  rolls, 
  machines, 
  customers,
  products,
  maintenance_requests,
  quality_checks,
  attendance,
  waste,
  sections,
  material_groups,
  items,
  customer_products,
  locations,
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
  type Product,
  type MaintenanceRequest,
  type InsertMaintenanceRequest,
  type QualityCheck,
  type Attendance,
  type Section,
  type MaterialGroup,
  type Item,
  type CustomerProduct,
  type Location
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
  
  // Products
  getProducts(): Promise<Product[]>;
  createProduct(product: any): Promise<Product>;
  
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
        product_id: job_orders.product_id,
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

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

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

  async createProduct(product: any): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async createCustomer(customer: any): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
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
}

export const storage = new DatabaseStorage();