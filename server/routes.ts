import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertNewOrderSchema, 
  insertJobOrderSchema, 
  insertRollSchema, 
  insertMaintenanceRequestSchema,
  insertInventoryMovementSchema,
  insertProductionOrderSchema,
  customers,
  customer_products,
  locations
} from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";

import { z } from "zod";

const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, created_at: true }).extend({
  sales_rep_id: z.union([z.string(), z.number(), z.null()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    const num = parseInt(val as string);
    return isNaN(num) ? null : num;
  })
});
const insertCustomerProductSchema = createInsertSchema(customer_products).omit({ id: true, created_at: true });
const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
import { openaiService } from "./services/openai";
import { mlService } from "./services/ml-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبان" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "بيانات تسجيل الدخول غير صحيحة" });
      }

      if (user.status !== 'active') {
        return res.status(401).json({ message: "الحساب غير نشط" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          display_name: user.display_name,
          display_name_ar: user.display_name_ar,
          role_id: user.role_id 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الإحصائيات" });
    }
  });

  // Machine Learning API routes
  app.get("/api/ml/predictions/:machineId", async (req, res) => {
    try {
      const machineId = parseInt(req.params.machineId);
      const hoursAhead = parseInt(req.query.hours as string) || 24;
      
      const prediction = await mlService.predictProductionPerformance(machineId, hoursAhead);
      res.json(prediction);
    } catch (error) {
      console.error('ML prediction error:', error);
      res.status(500).json({ message: "خطأ في تحليل التنبؤات" });
    }
  });

  app.get("/api/ml/anomalies/:machineId", async (req, res) => {
    try {
      const machineId = parseInt(req.params.machineId);
      
      // استخدام آخر بيانات متاحة للمكينة
      const mockData = {
        timestamp: new Date(),
        machineId,
        productionRate: 75 + Math.random() * 20,
        qualityScore: 85 + Math.random() * 10,
        wastePercentage: 3 + Math.random() * 4,
        temperature: 180 + Math.random() * 20,
        pressure: 12 + Math.random() * 3,
        speed: 80 + Math.random() * 15
      };
      
      const anomaly = await mlService.detectAnomalies(mockData);
      res.json(anomaly);
    } catch (error) {
      console.error('ML anomaly detection error:', error);
      res.status(500).json({ message: "خطأ في اكتشاف الشذوذ" });
    }
  });

  app.get("/api/ml/patterns", async (req, res) => {
    try {
      const patterns = await mlService.analyzeProductionPatterns();
      res.json(patterns);
    } catch (error) {
      console.error('ML pattern analysis error:', error);
      res.status(500).json({ message: "خطأ في تحليل الأنماط" });
    }
  });

  app.get("/api/ml/optimization/:machineId", async (req, res) => {
    try {
      const machineId = parseInt(req.params.machineId);
      const optimization = await mlService.optimizeProductionParameters(machineId);
      res.json(optimization);
    } catch (error) {
      console.error('ML optimization error:', error);
      res.status(500).json({ message: "خطأ في تحليل التحسينات" });
    }
  });

  app.post("/api/ml/train/:machineId", async (req, res) => {
    try {
      const machineId = parseInt(req.params.machineId);
      
      // محاكاة تدريب النموذج بإضافة بيانات عشوائية
      for (let i = 0; i < 50; i++) {
        const data = {
          timestamp: new Date(Date.now() - i * 3600000), // آخر 50 ساعة
          machineId,
          productionRate: 70 + Math.random() * 25,
          qualityScore: 80 + Math.random() * 15,
          wastePercentage: 2 + Math.random() * 6,
          temperature: 175 + Math.random() * 20,
          pressure: 10 + Math.random() * 5,
          speed: 75 + Math.random() * 20
        };
        await mlService.addProductionData(data);
      }
      
      res.json({ 
        success: true, 
        message: `تم تدريب النموذج للمكينة ${machineId} بنجاح`,
        dataPoints: 50
      });
    } catch (error) {
      console.error('ML training error:', error);
      res.status(500).json({ message: "خطأ في تدريب النموذج" });
    }
  });

  app.post("/api/ml/apply-optimization/:machineId", async (req, res) => {
    try {
      const machineId = parseInt(req.params.machineId);
      const optimization = req.body;
      
      // محاكاة تطبيق التحسينات
      res.json({ 
        success: true, 
        message: `تم تطبيق التحسينات على المكينة ${machineId}`,
        appliedSettings: optimization
      });
    } catch (error) {
      console.error('ML optimization application error:', error);
      res.status(500).json({ message: "خطأ في تطبيق التحسينات" });
    }
  });

  app.post("/api/ml/production-data", async (req, res) => {
    try {
      const productionData = req.body;
      await mlService.addProductionData(productionData);
      res.json({ success: true, message: "تم إضافة البيانات بنجاح" });
    } catch (error) {
      console.error('ML data addition error:', error);
      res.status(500).json({ message: "خطأ في إضافة البيانات" });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الطلبات" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  // Job Orders routes
  app.get("/api/job-orders", async (req, res) => {
    try {
      const { stage } = req.query;
      let jobOrders;
      
      if (stage) {
        jobOrders = await storage.getJobOrdersByStage(stage as string);
      } else {
        jobOrders = await storage.getJobOrders();
      }
      
      res.json(jobOrders);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب أوامر التشغيل" });
    }
  });

  app.post("/api/job-orders", async (req, res) => {
    try {
      const validatedData = insertJobOrderSchema.parse(req.body);
      const jobOrder = await storage.createJobOrder(validatedData);
      res.json(jobOrder);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  // Rolls routes
  app.get("/api/rolls", async (req, res) => {
    try {
      const rolls = await storage.getRolls();
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الرولات" });
    }
  });

  app.post("/api/rolls", async (req, res) => {
    try {
      const validatedData = insertRollSchema.parse(req.body);
      const roll = await storage.createRoll(validatedData);
      res.json(roll);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  app.patch("/api/rolls/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const roll = await storage.updateRoll(id, updates);
      res.json(roll);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث الرول" });
    }
  });

  // Machines routes
  app.get("/api/machines", async (req, res) => {
    try {
      const machines = await storage.getMachines();
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المكائن" });
    }
  });

  // Customers routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب العملاء" });
    }
  });

  // Health check endpoint for deployment
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Customers routes  
  app.post("/api/customers", async (req, res) => {
    try {
      console.log('Received customer data:', req.body);
      const validatedData = insertCustomerSchema.parse(req.body);
      console.log('Validated customer data:', validatedData);
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error) {
      console.error('Customer creation error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      res.status(400).json({ message: "بيانات غير صحيحة", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(id, validatedData);
      res.json(customer);
    } catch (error) {
      console.error('Customer update error:', error);
      res.status(400).json({ message: "خطأ في تحديث العميل", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Sections routes
  app.get("/api/sections", async (req, res) => {
    try {
      const sections = await storage.getSections();
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الأقسام" });
    }
  });

  // Material Groups routes
  app.get("/api/material-groups", async (req, res) => {
    try {
      const materialGroups = await storage.getMaterialGroups();
      res.json(materialGroups);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب مجموعات المواد" });
    }
  });

  // Items routes
  app.get("/api/items", async (req, res) => {
    try {
      const materialGroupId = req.query.material_group_id;
      const items = await storage.getItems(materialGroupId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: "خطأ في جلب الأصناف" });
    }
  });

  // Customer Products routes
  app.get("/api/customer-products", async (req, res) => {
    try {
      const customerProducts = await storage.getCustomerProducts();
      res.json(customerProducts);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب منتجات العملاء" });
    }
  });

  app.post("/api/customer-products", async (req, res) => {
    try {
      const customerProduct = await storage.createCustomerProduct(req.body);
      res.json(customerProduct);
    } catch (error) {
      console.error('Customer product creation error:', error);
      res.status(500).json({ message: "خطأ في إنشاء منتج العميل" });
    }
  });

  // Locations routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المواقع" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocationExtended(validatedData);
      res.json(location);
    } catch (error) {
      console.error('Location creation error:', error);
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLocationSchema.partial().parse(req.body);
      const location = await storage.updateLocationExtended(id, validatedData);
      res.json(location);
    } catch (error) {
      console.error('Location update error:', error);
      res.status(400).json({ message: "فشل في تحديث الموقع" });
    }
  });

  // Inventory movements routes
  app.get("/api/inventory-movements", async (req, res) => {
    try {
      const movements = await storage.getInventoryMovements();
      res.json(movements);
    } catch (error) {
      console.error('Error fetching inventory movements:', error);
      res.status(500).json({ message: "خطأ في جلب حركات المخزون" });
    }
  });

  app.post("/api/inventory-movements", async (req, res) => {
    try {
      const validatedData = insertInventoryMovementSchema.parse(req.body);
      const movement = await storage.createInventoryMovement(validatedData);
      res.json(movement);
    } catch (error) {
      console.error('Inventory movement creation error:', error);
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  app.delete("/api/inventory-movements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryMovement(id);
      if (success) {
        res.json({ message: "تم حذف الحركة بنجاح" });
      } else {
        res.status(404).json({ message: "الحركة غير موجودة" });
      }
    } catch (error) {
      console.error('Inventory movement deletion error:', error);
      res.status(500).json({ message: "خطأ في حذف الحركة" });
    }
  });

  // Users routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المستخدمين" });
    }
  });

  // Categories routes (for material groups)
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الفئات" });
    }
  });

  // Training Records routes
  app.get("/api/training-records", async (req, res) => {
    try {
      const trainingRecords = await storage.getTrainingRecords();
      res.json(trainingRecords);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب سجلات التدريب" });
    }
  });

  app.post("/api/training-records", async (req, res) => {
    try {
      const trainingRecord = await storage.createTrainingRecord(req.body);
      res.json(trainingRecord);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  // Admin Decisions routes
  app.get("/api/admin-decisions", async (req, res) => {
    try {
      const adminDecisions = await storage.getAdminDecisions();
      res.json(adminDecisions);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب القرارات الإدارية" });
    }
  });

  app.post("/api/admin-decisions", async (req, res) => {
    try {
      const adminDecision = await storage.createAdminDecision(req.body);
      res.json(adminDecision);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  // Warehouse Transactions routes
  app.get("/api/warehouse-transactions", async (req, res) => {
    try {
      const warehouseTransactions = await storage.getWarehouseTransactions();
      res.json(warehouseTransactions);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب حركات المستودع" });
    }
  });

  app.post("/api/warehouse-transactions", async (req, res) => {
    try {
      const warehouseTransaction = await storage.createWarehouseTransaction(req.body);
      res.json(warehouseTransaction);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  // Mixing Recipes routes
  app.get("/api/mixing-recipes", async (req, res) => {
    try {
      const mixingRecipes = await storage.getMixingRecipes();
      res.json(mixingRecipes);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب وصفات الخلط" });
    }
  });

  app.post("/api/mixing-recipes", async (req, res) => {
    try {
      const mixingRecipe = await storage.createMixingRecipe(req.body);
      res.json(mixingRecipe);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  // ERP Integration Routes
  app.get("/api/erp/configurations", async (req, res) => {
    try {
      const configurations = await storage.getERPConfigurations();
      res.json(configurations);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب إعدادات ERP" });
    }
  });

  app.post("/api/erp/configurations", async (req, res) => {
    try {
      const configuration = await storage.createERPConfiguration(req.body);
      res.json(configuration);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  app.put("/api/erp/configurations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const configuration = await storage.updateERPConfiguration(id, req.body);
      res.json(configuration);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث الإعدادات" });
    }
  });

  app.delete("/api/erp/configurations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteERPConfiguration(id);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ message: "خطأ في حذف الإعدادات" });
    }
  });

  app.get("/api/erp/sync-logs", async (req, res) => {
    try {
      const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
      const logs = await storage.getERPSyncLogs(configId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب سجلات المزامنة" });
    }
  });

  app.post("/api/erp/sync/:configId/:entityType", async (req, res) => {
    try {
      const configId = parseInt(req.params.configId);
      const entityType = req.params.entityType;
      
      // Mock sync operation
      const syncResult = {
        success: Math.floor(Math.random() * 100) + 50,
        failed: Math.floor(Math.random() * 10),
        errors: [],
        duration: Math.floor(Math.random() * 60) + 10
      };

      // Log the sync operation
      await storage.createERPSyncLog({
        erp_config_id: configId,
        entity_type: entityType,
        operation: 'manual_sync',
        status: syncResult.failed > 0 ? 'partial' : 'success',
        records_processed: syncResult.success + syncResult.failed,
        records_success: syncResult.success,
        records_failed: syncResult.failed,
        sync_duration: syncResult.duration
      });

      res.json(syncResult);
    } catch (error) {
      res.status(500).json({ message: "خطأ في عملية المزامنة" });
    }
  });

  app.get("/api/erp/entity-mappings/:configId/:entityType", async (req, res) => {
    try {
      const configId = parseInt(req.params.configId);
      const entityType = req.params.entityType;
      const mappings = await storage.getERPEntityMappings(configId, entityType);
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب ربط الكيانات" });
    }
  });

  // Database Configuration Routes
  app.get("/api/database/configurations", async (req, res) => {
    try {
      const configurations = await storage.getDatabaseConfigurations();
      res.json(configurations);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب إعدادات قواعد البيانات" });
    }
  });

  app.post("/api/database/configurations", async (req, res) => {
    try {
      const configuration = await storage.createDatabaseConfiguration(req.body);
      res.json(configuration);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة لقاعدة البيانات" });
    }
  });

  app.put("/api/database/configurations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const configuration = await storage.updateDatabaseConfiguration(id, req.body);
      res.json(configuration);
    } catch (error) {
      res.status(400).json({ message: "خطأ في تحديث إعدادات قاعدة البيانات" });
    }
  });

  app.delete("/api/database/configurations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDatabaseConfiguration(id);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ message: "خطأ في حذف إعدادات قاعدة البيانات" });
    }
  });

  app.post("/api/database/test-connection", async (req, res) => {
    try {
      const { type, host, port, database, username, password, ssl_enabled } = req.body;
      
      // Mock connection test for database
      const isConnected = Math.random() > 0.2; // 80% success rate for demo
      
      if (isConnected) {
        res.json({
          success: true,
          message: "تم الاتصال بقاعدة البيانات بنجاح",
          details: {
            type,
            host,
            database,
            responseTime: Math.floor(Math.random() * 200) + 50
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: "فشل في الاتصال بقاعدة البيانات",
          error: "Connection timeout or invalid credentials"
        });
      }
    } catch (error) {
      res.status(500).json({ message: "خطأ في اختبار الاتصال بقاعدة البيانات" });
    }
  });

  // Data mapping endpoints
  app.get("/api/database/mappings/:configId", async (req, res) => {
    try {
      const configId = parseInt(req.params.configId);
      const mappings = await storage.getDataMappings(configId);
      res.json(mappings);
    } catch (error) {
      console.error("Error fetching data mappings:", error);
      res.status(500).json({ error: "فشل في جلب خرائط البيانات" });
    }
  });

  app.post("/api/database/mappings", async (req, res) => {
    try {
      const mapping = await storage.createDataMapping(req.body);
      res.json(mapping);
    } catch (error) {
      console.error("Error creating data mapping:", error);
      res.status(500).json({ error: "فشل في إنشاء خريطة البيانات" });
    }
  });

  app.put("/api/database/mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mapping = await storage.updateDataMapping(id, req.body);
      res.json(mapping);
    } catch (error) {
      console.error("Error updating data mapping:", error);
      res.status(500).json({ error: "فشل في تحديث خريطة البيانات" });
    }
  });

  app.delete("/api/database/mappings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDataMapping(id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting data mapping:", error);
      res.status(500).json({ error: "فشل في حذف خريطة البيانات" });
    }
  });

  // Data synchronization endpoints
  app.post("/api/database/sync/:configId", async (req, res) => {
    try {
      const configId = parseInt(req.params.configId);
      const { entity_type, direction } = req.body;
      const result = await storage.syncData(configId, entity_type, direction);
      res.json(result);
    } catch (error) {
      console.error("Error syncing data:", error);
      res.status(500).json({ error: "فشل في مزامنة البيانات" });
    }
  });

  app.get("/api/database/sync-logs/:configId", async (req, res) => {
    try {
      const configId = parseInt(req.params.configId);
      const logs = await storage.getSyncLogs(configId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "فشل في جلب سجلات المزامنة" });
    }
  });

  app.post("/api/erp/test-connection", async (req, res) => {
    try {
      const { type, endpoint, username, password, settings } = req.body;
      
      // Mock connection test
      const isConnected = Math.random() > 0.3; // 70% success rate for demo
      
      if (isConnected) {
        res.json({ 
          success: true, 
          message: "تم الاتصال بنجاح", 
          details: {
            system: type,
            version: "1.0.0",
            responseTime: Math.floor(Math.random() * 1000) + 100
          }
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "فشل في الاتصال", 
          error: "Invalid credentials or server unavailable" 
        });
      }
    } catch (error) {
      res.status(500).json({ message: "خطأ في اختبار الاتصال" });
    }
  });



  // Maintenance routes
  app.get("/api/maintenance", async (req, res) => {
    try {
      const requests = await storage.getMaintenanceRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب طلبات الصيانة" });
    }
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const validatedData = insertMaintenanceRequestSchema.parse(req.body);
      const request = await storage.createMaintenanceRequest(validatedData);
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  // Quality checks routes
  app.get("/api/quality-checks", async (req, res) => {
    try {
      const qualityChecks = await storage.getQualityChecks();
      res.json(qualityChecks);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب فحوصات الجودة" });
    }
  });

  // Maintenance requests routes
  app.get("/api/maintenance-requests", async (req, res) => {
    try {
      const maintenanceRequests = await storage.getMaintenanceRequests();
      res.json(maintenanceRequests);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب طلبات الصيانة" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res) => {
    try {
      const attendance = await storage.getAttendance();
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب بيانات الحضور" });
    }
  });

  // AI Assistant routes
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context, userId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "الرسالة مطلوبة" });
      }

      // استخدام المساعد الذكي المتطور
      const reply = await openaiService.processMessage(message, userId);
      res.json({ reply });
    } catch (error) {
      console.error('AI Chat Error:', error);
      const fallbackResponse = generateFallbackResponse(message);
      res.json({ reply: fallbackResponse });
    }
  });

  // AI Voice Command endpoint
  app.post("/api/ai/voice-command", async (req, res) => {
    try {
      const { command, language = 'ar-SA', context = 'voice_assistant' } = req.body;
      
      if (!command || typeof command !== 'string') {
        return res.status(400).json({ message: "أمر صوتي غير صالح" });
      }

      const { dialect } = req.body;
      const result = await openaiService.processVoiceCommand(command, language, dialect);
      
      // Map actions to actual system operations
      let actionData = null;
      switch (result.action) {
        case 'navigate_dashboard':
          actionData = { route: '/dashboard' };
          break;
        case 'navigate_orders':
          actionData = { route: '/orders' };
          break;
        case 'navigate_production':
          actionData = { route: '/production' };
          break;
        case 'navigate_maintenance':
          actionData = { route: '/maintenance' };
          break;
        case 'navigate_definitions':
          actionData = { route: '/definitions' };
          break;
        case 'navigate_hr':
          actionData = { route: '/hr' };
          break;
        case 'navigate_quality':
          actionData = { route: '/quality' };
          break;
        case 'navigate_reports':
          actionData = { route: '/reports' };
          break;
        case 'show_stats':
          actionData = { queryKey: '/api/dashboard/stats' };
          break;
        case 'refresh_orders':
          actionData = { queryKey: '/api/orders' };
          break;
        case 'refresh_machines':
          actionData = { queryKey: '/api/machines' };
          break;
        case 'refresh_production':
          actionData = { queryKey: '/api/job-orders' };
          break;
      }

      res.json({
        message: result.response,
        action: result.action !== 'none' ? result.action : null,
        data: actionData,
        intent: result.intent,
        parameters: result.parameters
      });
    } catch (error) {
      console.error('Voice Command Error:', error);
      res.status(500).json({ message: "خطأ في معالجة الأمر الصوتي" });
    }
  });

  // AI Advanced Features routes
  app.post("/api/ai/generate-report", async (req, res) => {
    try {
      const { reportType, parameters, userId } = req.body;
      
      if (!reportType) {
        return res.status(400).json({ message: "نوع التقرير مطلوب" });
      }

      const { AIReports } = await import('./services/ai-reports');
      
      let report;
      switch (reportType.toLowerCase()) {
        case 'production':
        case 'إنتاج':
          report = await AIReports.generateProductionReport(parameters);
          break;
        case 'quality':
        case 'جودة':
          report = await AIReports.generateQualityReport(parameters);
          break;
        case 'maintenance':
        case 'صيانة':
          report = await AIReports.generateMaintenanceReport(parameters);
          break;
        case 'sales':
        case 'مبيعات':
          report = await AIReports.generateSalesReport(parameters);
          break;
        default:
          report = await AIReports.generateCustomReport(reportType, parameters);
      }

      res.json({ report });
    } catch (error) {
      console.error('Report Generation Error:', error);
      res.status(500).json({ message: "خطأ في توليد التقرير الذكي" });
    }
  });

  app.get("/api/ai/notifications", async (req, res) => {
    try {
      const { AINotifications } = await import('./services/ai-notifications');
      const notifications = AINotifications.getActiveNotifications();
      res.json({ notifications });
    } catch (error) {
      console.error('Notifications Error:', error);
      res.status(500).json({ message: "خطأ في جلب الإشعارات" });
    }
  });

  app.post("/api/ai/monitor", async (req, res) => {
    try {
      const { AINotifications } = await import('./services/ai-notifications');
      const notifications = await AINotifications.performIntelligentMonitoring();
      res.json({ notifications, count: notifications.length });
    } catch (error) {
      console.error('Monitoring Error:', error);
      res.status(500).json({ message: "خطأ في النظام الذكي للمراقبة" });
    }
  });

  app.get("/api/ai/learning-stats", async (req, res) => {
    try {
      const { AILearning } = await import('./services/ai-learning');
      const stats = AILearning.getLearningStatistics();
      res.json({ stats });
    } catch (error) {
      console.error('Learning Stats Error:', error);
      res.status(500).json({ message: "خطأ في جلب إحصائيات التعلم" });
    }
  });

  app.get("/api/ai/recommendations/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { AILearning } = await import('./services/ai-learning');
      const recommendations = await AILearning.getPersonalizedRecommendations(parseInt(userId));
      res.json({ recommendations });
    } catch (error) {
      console.error('Recommendations Error:', error);
      res.status(500).json({ message: "خطأ في جلب التوصيات المخصصة" });
    }
  });

  app.post("/api/ai/feedback", async (req, res) => {
    try {
      const { userId, actionType, context, feedback } = req.body;
      
      const { AILearning } = await import('./services/ai-learning');
      await AILearning.recordLearningData(userId, actionType, context, true, 0, feedback);
      
      res.json({ message: "تم تسجيل التعليق بنجاح" });
    } catch (error) {
      console.error('Feedback Error:', error);
      res.status(500).json({ message: "خطأ في تسجيل التعليق" });
    }
  });

  function generateFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('إنتاج') || lowerMessage.includes('production')) {
      return 'بناءً على البيانات الحالية، معدل الإنتاج يبلغ 85%. يمكنك مراجعة تفاصيل أكثر في صفحة الإنتاج.';
    } else if (lowerMessage.includes('جودة') || lowerMessage.includes('quality')) {
      return 'فحوصات الجودة تتم بانتظام. يمكنك مراجعة نتائج الفحوصات من صفحة إدارة الجودة.';
    } else if (lowerMessage.includes('صيانة') || lowerMessage.includes('maintenance')) {
      return 'هناك طلبات صيانة نشطة. يرجى مراجعة صفحة الصيانة للتفاصيل.';
    } else if (lowerMessage.includes('موظف') || lowerMessage.includes('employee')) {
      return 'يمكنك مراجعة حضور الموظفين وإدارة الموارد البشرية من القسم المخصص.';
    } else {
      return 'شكراً لك على استفسارك. يمكنني مساعدتك في معلومات حول الإنتاج، الجودة، الصيانة، والموارد البشرية. ما الذي تريد معرفته؟';
    }
  }

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = {
        activeOrders: 12,
        productionRate: 85,
        presentEmployees: 18,
        totalEmployees: 22,
        maintenanceAlerts: 2
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب إحصائيات لوحة المتابعة" });
    }
  });

  // Rolls endpoint
  app.get("/api/rolls", async (req, res) => {
    try {
      const rolls = await storage.getRolls();
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الرولات" });
    }
  });

  // Reports endpoint
  app.get("/api/reports", async (req, res) => {
    try {
      const reports: any[] = []; // Placeholder for reports data
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب التقارير" });
    }
  });

  // Machines routes  
  app.get("/api/machines", async (req, res) => {
    try {
      const machines = await storage.getMachines();
      res.json(machines);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المكائن" });
    }
  });

  app.post("/api/machines", async (req, res) => {
    try {
      const machine = await storage.createMachine(req.body);
      res.json(machine);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الماكينة" });
    }
  });

  app.put("/api/machines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const machine = await storage.updateMachine(id, req.body);
      res.json(machine);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الماكينة" });
    }
  });

  // Users routes
  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء المستخدم" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث المستخدم" });
    }
  });

  // Sections routes
  app.post("/api/sections", async (req, res) => {
    try {
      const section = await storage.createSection(req.body);
      res.json(section);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء القسم" });
    }
  });

  app.put("/api/sections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const section = await storage.updateSection(id, req.body);
      res.json(section);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث القسم" });
    }
  });

  // Material Groups routes
  app.post("/api/material-groups", async (req, res) => {
    try {
      const materialGroup = await storage.createMaterialGroup(req.body);
      res.json(materialGroup);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء مجموعة المواد" });
    }
  });

  app.put("/api/material-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const materialGroup = await storage.updateMaterialGroup(id, req.body);
      res.json(materialGroup);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث مجموعة المواد" });
    }
  });

  // Items routes
  app.post("/api/items", async (req, res) => {
    try {
      const item = await storage.createItem(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الصنف" });
    }
  });

  app.put("/api/items/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const item = await storage.updateItem(id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الصنف" });
    }
  });

  // Customer Products routes
  app.post("/api/customer-products", async (req, res) => {
    try {
      const customerProduct = await storage.createCustomerProduct(req.body);
      res.json(customerProduct);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء منتج العميل" });
    }
  });

  app.put("/api/customer-products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerProduct = await storage.updateCustomerProduct(id, req.body);
      res.json(customerProduct);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث منتج العميل" });
    }
  });

  // Locations routes
  app.post("/api/locations", async (req, res) => {
    try {
      const location = await storage.createLocation(req.body);
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الموقع" });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.updateLocation(id, req.body);
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الموقع" });
    }
  });

  // ============ HR System API Routes ============

  // Training Programs
  app.get("/api/hr/training-programs", async (req, res) => {
    try {
      const programs = await storage.getTrainingPrograms();
      res.json(programs);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب البرامج التدريبية" });
    }
  });

  app.post("/api/hr/training-programs", async (req, res) => {
    try {
      const program = await storage.createTrainingProgram(req.body);
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء البرنامج التدريبي" });
    }
  });

  app.put("/api/hr/training-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const program = await storage.updateTrainingProgram(id, req.body);
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث البرنامج التدريبي" });
    }
  });

  app.get("/api/hr/training-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const program = await storage.getTrainingProgramById(id);
      if (program) {
        res.json(program);
      } else {
        res.status(404).json({ message: "البرنامج التدريبي غير موجود" });
      }
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب البرنامج التدريبي" });
    }
  });

  // Training Materials
  app.get("/api/hr/training-materials", async (req, res) => {
    try {
      const programId = req.query.program_id ? parseInt(req.query.program_id as string) : undefined;
      const materials = await storage.getTrainingMaterials(programId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المواد التدريبية" });
    }
  });

  app.post("/api/hr/training-materials", async (req, res) => {
    try {
      const material = await storage.createTrainingMaterial(req.body);
      res.json(material);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء المادة التدريبية" });
    }
  });

  // Training Enrollments  
  app.get("/api/hr/training-enrollments", async (req, res) => {
    try {
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
      const enrollments = await storage.getTrainingEnrollments(employeeId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب التسجيلات التدريبية" });
    }
  });

  app.post("/api/hr/training-enrollments", async (req, res) => {
    try {
      const enrollment = await storage.createTrainingEnrollment(req.body);
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تسجيل الموظف في البرنامج" });
    }
  });

  app.put("/api/hr/training-enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollment = await storage.updateTrainingEnrollment(id, req.body);
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث التسجيل التدريبي" });
    }
  });

  // Performance Reviews
  app.get("/api/hr/performance-reviews", async (req, res) => {
    try {
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
      const reviews = await storage.getPerformanceReviews(employeeId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب تقييمات الأداء" });
    }
  });

  app.post("/api/hr/performance-reviews", async (req, res) => {
    try {
      const review = await storage.createPerformanceReview(req.body);
      res.json(review);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء تقييم الأداء" });
    }
  });

  app.put("/api/hr/performance-reviews/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const review = await storage.updatePerformanceReview(id, req.body);
      res.json(review);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث تقييم الأداء" });
    }
  });

  // Performance Criteria
  app.get("/api/hr/performance-criteria", async (req, res) => {
    try {
      const criteria = await storage.getPerformanceCriteria();
      res.json(criteria);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب معايير التقييم" });
    }
  });

  app.post("/api/hr/performance-criteria", async (req, res) => {
    try {
      const criteria = await storage.createPerformanceCriteria(req.body);
      res.json(criteria);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء معيار التقييم" });
    }
  });

  // Leave Types
  app.get("/api/hr/leave-types", async (req, res) => {
    try {
      const leaveTypes = await storage.getLeaveTypes();
      res.json(leaveTypes);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب أنواع الإجازات" });
    }
  });

  app.post("/api/hr/leave-types", async (req, res) => {
    try {
      const leaveType = await storage.createLeaveType(req.body);
      res.json(leaveType);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء نوع الإجازة" });
    }
  });

  // Leave Requests
  app.get("/api/hr/leave-requests", async (req, res) => {
    try {
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
      const requests = await storage.getLeaveRequests(employeeId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب طلبات الإجازات" });
    }
  });

  app.post("/api/hr/leave-requests", async (req, res) => {
    try {
      const request = await storage.createLeaveRequest(req.body);
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء طلب الإجازة" });
    }
  });

  app.put("/api/hr/leave-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.updateLeaveRequest(id, req.body);
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث طلب الإجازة" });
    }
  });

  app.get("/api/hr/leave-requests/pending", async (req, res) => {
    try {
      const requests = await storage.getPendingLeaveRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الطلبات المعلقة" });
    }
  });

  // Leave Balances
  app.get("/api/hr/leave-balances/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const balances = await storage.getLeaveBalances(employeeId, year);
      res.json(balances);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب أرصدة الإجازات" });
    }
  });

  app.post("/api/hr/leave-balances", async (req, res) => {
    try {
      const balance = await storage.createLeaveBalance(req.body);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء رصيد الإجازة" });
    }
  });

  // DELETE routes for definitions
  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.json({ message: "تم حذف العميل بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف العميل" });
    }
  });

  app.delete("/api/sections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSection(id);
      res.json({ message: "تم حذف القسم بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف القسم" });
    }
  });

  app.delete("/api/material-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaterialGroup(id);
      res.json({ message: "تم حذف مجموعة المواد بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف مجموعة المواد" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      await storage.deleteItem(req.params.id);
      res.json({ message: "تم حذف الصنف بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الصنف" });
    }
  });

  app.delete("/api/customer-products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomerProduct(id);
      res.json({ message: "تم حذف منتج العميل بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف منتج العميل" });
    }
  });

  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLocation(id);
      res.json({ message: "تم حذف الموقع بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الموقع" });
    }
  });

  app.delete("/api/machines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMachine(id);
      res.json({ message: "تم حذف الماكينة بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الماكينة" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "تم حذف المستخدم بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف المستخدم" });
    }
  });

  // Inventory Management routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventoryItems();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب بيانات المخزون" });
    }
  });

  app.get("/api/inventory/stats", async (req, res) => {
    try {
      const stats = await storage.getInventoryStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب إحصائيات المخزون" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const item = await storage.createInventoryItem(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إضافة صنف للمخزون" });
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateInventoryItem(id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث صنف المخزون" });
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventoryItem(id);
      res.json({ message: "تم حذف صنف المخزون بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف صنف المخزون" });
    }
  });

  // ============ Locations Management API ============
  
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ message: "خطأ في جلب المواقع" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const result = insertLocationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: result.error.errors });
      }
      
      const location = await storage.createLocationExtended(result.data);
      res.status(201).json(location);
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ message: "خطأ في إنشاء الموقع" });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const locationId = parseInt(req.params.id);
      const result = insertLocationSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: result.error.errors });
      }
      
      const location = await storage.updateLocationExtended(locationId, result.data);
      res.json(location);
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ message: "خطأ في تحديث الموقع" });
    }
  });

  // ============ Inventory Movements Management API ============
  
  app.get("/api/inventory-movements", async (req, res) => {
    try {
      const movements = await storage.getAllInventoryMovements();
      res.json(movements);
    } catch (error) {
      console.error('Error fetching inventory movements:', error);
      res.status(500).json({ message: "خطأ في جلب حركات المخزون" });
    }
  });

  app.post("/api/inventory-movements", async (req, res) => {
    try {
      const result = insertInventoryMovementSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: result.error.errors });
      }
      
      const movement = await storage.createInventoryMovement(result.data);
      res.status(201).json(movement);
    } catch (error) {
      console.error('Error creating inventory movement:', error);
      res.status(500).json({ message: "خطأ في إنشاء حركة المخزون" });
    }
  });

  app.delete("/api/inventory-movements/:id", async (req, res) => {
    try {
      const movementId = parseInt(req.params.id);
      await storage.deleteInventoryMovement(movementId);
      res.json({ message: "تم حذف الحركة بنجاح" });
    } catch (error) {
      console.error('Error deleting inventory movement:', error);
      res.status(500).json({ message: "خطأ في حذف الحركة" });
    }
  });

  // ============ Orders Management API ============
  
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: "خطأ في جلب الطلبات" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      console.log('Received order data:', req.body);
      const order = await storage.createOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: "خطأ في إنشاء الطلب" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const result = insertNewOrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: result.error.errors });
      }
      
      const order = await storage.updateOrder(orderId, result.data);
      res.json(order);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: "خطأ في تحديث الطلب" });
    }
  });

  // ============ Production Orders Management API ============
  
  app.get("/api/production-orders", async (req, res) => {
    try {
      const productionOrders = await storage.getAllProductionOrders();
      res.json(productionOrders);
    } catch (error) {
      console.error('Error fetching production orders:', error);
      res.status(500).json({ message: "خطأ في جلب أوامر الإنتاج" });
    }
  });

  app.post("/api/production-orders", async (req, res) => {
    try {
      console.log('Received production order data:', req.body);
      const productionOrder = await storage.createProductionOrder(req.body);
      res.status(201).json(productionOrder);
    } catch (error) {
      console.error('Error creating production order:', error);
      res.status(500).json({ message: "خطأ في إنشاء أمر الإنتاج" });
    }
  });

  app.put("/api/production-orders/:id", async (req, res) => {
    try {
      const productionOrderId = parseInt(req.params.id);
      const result = insertProductionOrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "بيانات غير صحيحة", errors: result.error.errors });
      }
      
      const productionOrder = await storage.updateProductionOrder(productionOrderId, result.data);
      res.json(productionOrder);
    } catch (error) {
      console.error('Error updating production order:', error);
      res.status(500).json({ message: "خطأ في تحديث أمر الإنتاج" });
    }
  });

  // ============ Settings API ============
  
  // System Settings
  app.get("/api/settings/system", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "خطأ في جلب إعدادات النظام" });
    }
  });

  app.post("/api/settings/system", async (req, res) => {
    try {
      const { settings, userId } = req.body;
      const results = [];
      
      for (const [key, value] of Object.entries(settings)) {
        try {
          const existingSetting = await storage.getSystemSettingByKey(key);
          if (existingSetting) {
            const updated = await storage.updateSystemSetting(key, String(value), userId);
            results.push(updated);
          } else {
            const created = await storage.createSystemSetting({
              setting_key: key,
              setting_value: String(value),
              updated_by: userId
            });
            results.push(created);
          }
        } catch (error) {
          console.error(`Error saving setting ${key}:`, error);
        }
      }
      
      res.json({ message: "تم حفظ إعدادات النظام بنجاح", settings: results });
    } catch (error) {
      console.error("Error saving system settings:", error);
      res.status(500).json({ message: "خطأ في حفظ إعدادات النظام" });
    }
  });

  // User Settings
  app.get("/api/settings/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "خطأ في جلب إعدادات المستخدم" });
    }
  });

  app.post("/api/settings/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { settings } = req.body;
      const results = [];
      
      for (const [key, value] of Object.entries(settings)) {
        try {
          const updated = await storage.updateUserSetting(userId, key, String(value));
          results.push(updated);
        } catch (error) {
          console.error(`Error saving user setting ${key}:`, error);
        }
      }
      
      res.json({ message: "تم حفظ إعداداتك الشخصية بنجاح", settings: results });
    } catch (error) {
      console.error("Error saving user settings:", error);
      res.status(500).json({ message: "خطأ في حفظ إعدادات المستخدم" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
