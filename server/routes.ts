import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertOrderSchema, 
  insertJobOrderSchema, 
  insertRollSchema, 
  insertMaintenanceRequestSchema,
  customers,
  products
} from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";

const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
const insertProductSchema = createInsertSchema(products).omit({ id: true });
import { openaiService } from "./services/openai";

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

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المنتجات" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  // Customers routes  
  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "بيانات غير صحيحة" });
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
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
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

  // Locations routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب المواقع" });
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
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "الرسالة مطلوبة" });
      }

      // Fallback response for factory operations
      const fallbackResponse = generateFallbackResponse(message);
      res.json({ reply: fallbackResponse });
    } catch (error) {
      res.status(500).json({ message: "خطأ في خدمة المساعد الذكي" });
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

  const httpServer = createServer(app);
  return httpServer;
}
