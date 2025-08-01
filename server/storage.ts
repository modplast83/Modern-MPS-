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
}

export const storage = new DatabaseStorage();