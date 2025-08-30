import type { Express, Request } from "express";
import { createServer, type Server } from "http";

// Extend Express Request type to include session
declare module 'express-serve-static-core' {
  interface Request {
    session: {
      userId?: number;
      [key: string]: any;
      destroy?: (callback: (err?: any) => void) => void;
    };
  }
}
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertNewOrderSchema, 
  insertJobOrderSchema, 
  insertRollSchema, 
  insertMaintenanceRequestSchema,
  insertMaintenanceActionSchema,
  insertMaintenanceReportSchema,
  insertOperatorNegligenceReportSchema,
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
import { NotificationService } from "./services/notification-service";

// Initialize notification service
const notificationService = new NotificationService(storage);

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

      // Save user session with explicit save callback
      req.session.userId = user.id;
      
      // Debug session creation (remove in production)
      // console.log("Login successful - Session ID:", req.sessionID);
      // console.log("Login successful - User ID saved to session:", req.session.userId);

      // Ensure session is saved before responding
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "خطأ في حفظ الجلسة" });
        }
        
        // Session saved successfully
        res.json({ 
          user: { 
            id: user.id, 
            username: user.username, 
            display_name: user.display_name,
            display_name_ar: user.display_name_ar,
            role_id: user.role_id 
          } 
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Get current user
  app.get("/api/me", async (req, res) => {
    try {
      // Check if session exists and has user ID
      if (!req.session?.userId) {
        return res.status(401).json({ message: "غير مسجل الدخول" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        // User doesn't exist in database, clear session
        if (req.session.destroy) {
          req.session.destroy((err: any) => {
            if (err) console.error("Error destroying invalid session:", err);
          });
        }
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // User found - extend session by touching it (rolling session will reset expiry)
      if (req.session.touch) {
        req.session.touch();
      }
      
      // Save session to ensure it persists
      if (req.session.save) {
        req.session.save((err: any) => {
          if (err) {
            console.error("Error saving session on /api/me:", err);
            // Continue anyway, don't break the response
          }
        });
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
      console.error("Get current user error:", error);
      res.status(500).json({ message: "خطأ في الخادم" });
    }
  });

  // Logout
  app.post("/api/logout", async (req, res) => {
    try {
      if (req.session?.destroy) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).json({ message: "خطأ في تسجيل الخروج" });
          }
          // Clear all possible session cookies
          res.clearCookie('connect.sid');
          res.clearCookie('plastic-bag-session');
          res.json({ message: "تم تسجيل الخروج بنجاح" });
        });
      } else {
        // Fallback session clearing
        req.session = {} as any;
        res.clearCookie('connect.sid');
        res.clearCookie('plastic-bag-session');
        res.json({ message: "تم تسجيل الخروج بنجاح" });
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "خطأ في تسجيل الخروج" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "خطأ في جلب الإحصائيات" });
    }
  });

  // ==== NOTIFICATIONS API ROUTES ====
  
  // Send WhatsApp message (Meta API or Twilio)
  app.post("/api/notifications/whatsapp", async (req, res) => {
    try {
      const { phone_number, message, title, priority, context_type, context_id, template_name, variables, use_template = false } = req.body;
      
      if (!phone_number || !message) {
        return res.status(400).json({ message: "رقم الهاتف والرسالة مطلوبان" });
      }

      const result = await notificationService.sendWhatsAppMessage(phone_number, message, {
        title,
        priority,
        context_type,
        context_id,
        useTemplate: use_template,
        templateName: template_name
      });

      if (result.success) {
        res.json({ 
          success: true, 
          messageId: result.messageId,
          message: "تم إرسال رسالة الواتس اب بنجاح"
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: result.error,
          message: "فشل في إرسال رسالة الواتس اب"
        });
      }
    } catch (error: any) {
      console.error("Error sending WhatsApp message:", error);
      res.status(500).json({ message: "خطأ في إرسال رسالة الواتس اب" });
    }
  });

  // Send test message
  app.post("/api/notifications/test", async (req, res) => {
    try {
      const { phone_number } = req.body;
      
      if (!phone_number) {
        return res.status(400).json({ message: "رقم الهاتف مطلوب" });
      }

      const result = await notificationService.sendTestMessage(phone_number);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error: any) {
      console.error("Error sending test message:", error);
      res.status(500).json({ message: "خطأ في إرسال رسالة الاختبار" });
    }
  });

  // Get notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : undefined;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "خطأ في جلب الإشعارات" });
    }
  });

  // Webhook endpoint for Meta WhatsApp
  app.get("/api/notifications/webhook/meta", (req, res) => {
    // Verify webhook (Meta requirement)
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'mpbf_webhook_token';
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Meta Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Meta Webhook verification failed');
      res.sendStatus(403);
    }
  });

  app.post("/api/notifications/webhook/meta", async (req, res) => {
    try {
      console.log("📨 Meta Webhook received:", JSON.stringify(req.body, null, 2));
      
      // معالجة webhook من Meta
      if (notificationService.metaWhatsApp) {
        await notificationService.metaWhatsApp.handleWebhook(req.body);
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error("Error processing Meta webhook:", error);
      res.status(500).json({ message: "خطأ في معالجة Meta webhook" });
    }
  });

  // Update notification status (Twilio webhook)
  app.post("/api/notifications/webhook/twilio", async (req, res) => {
    try {
      const { MessageSid, MessageStatus, ErrorMessage } = req.body;
      
      if (MessageSid) {
        await notificationService.updateMessageStatus(MessageSid);
      }
      
      res.status(200).send("OK");
    } catch (error: any) {
      console.error("Error handling Twilio webhook:", error);
      res.status(500).send("Error");
    }
  });

  // Get notification templates
  app.get("/api/notification-templates", async (req, res) => {
    try {
      const templates = await storage.getNotificationTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching notification templates:", error);
      res.status(500).json({ message: "خطأ في جلب قوالب الإشعارات" });
    }
  });

  // Create notification template
  app.post("/api/notification-templates", async (req, res) => {
    try {
      const template = await storage.createNotificationTemplate(req.body);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating notification template:", error);
      res.status(500).json({ message: "خطأ في إنشاء قالب الإشعار" });
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
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Orders fetch error:", error);
      res.status(500).json({ message: "خطأ في جلب الطلبات" });
    }
  });

  // Generate next order number
  app.get("/api/orders/next-number", async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      const orderNumbers = orders
        .map((order: any) => order.order_number)
        .filter((num: string) => num && num.startsWith('ORD'))
        .map((num: string) => {
          const match = num.match(/^ORD(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        });
      
      const nextNumber = orderNumbers.length > 0 ? Math.max(...orderNumbers) + 1 : 1;
      const orderNumber = `ORD${nextNumber.toString().padStart(3, '0')}`;
      
      res.json({ orderNumber });
    } catch (error) {
      console.error("Order number generation error:", error);
      res.status(500).json({ message: "خطأ في توليد رقم الطلب" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session?.userId) {
        return res.status(401).json({ message: "غير مسجل الدخول" });
      }

      // Add the created_by field from session (as a number) and ensure other numeric fields are properly converted
      const orderData = {
        ...req.body,
        created_by: req.session.userId, // This is already a number from session
        delivery_days: req.body.delivery_days ? parseInt(req.body.delivery_days) : null
      };

      const validatedData = insertNewOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedData);
      res.json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(400).json({ message: "بيانات غير صحيحة" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      await storage.deleteOrder(orderId);
      res.json({ message: "تم حذف الطلب بنجاح" });
    } catch (error) {
      console.error("Order deletion error:", error);
      res.status(500).json({ message: "خطأ في حذف الطلب" });
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
      const { stage } = req.query;
      if (stage) {
        const rolls = await storage.getRollsByStage(stage as string);
        res.json(rolls);
      } else {
        const rolls = await storage.getRolls();
        res.json(rolls);
      }
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

  // Material Groups routes (Categories)
  app.get("/api/material-groups", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching material groups:', error);
      res.status(500).json({ message: "خطأ في جلب مجموعات المواد" });
    }
  });

  // Items routes
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
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
      console.error("Customer products fetch error:", error);
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
      const id = req.params.id;
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

  app.post("/api/categories", async (req, res) => {
    try {
      console.log('Received category data:', req.body);
      
      // Generate sequential ID if not provided
      let categoryId = req.body.id;
      if (!categoryId) {
        const existingCategories = await storage.getCategories();
        const categoryNumbers = existingCategories
          .map(cat => cat.id)
          .filter(id => id && id.startsWith('CAT') && id.length <= 6) // Standard format only
          .map(id => {
            const num = id.replace('CAT', '');
            return isNaN(parseInt(num)) ? 0 : parseInt(num);
          })
          .filter(num => num > 0)
          .sort((a, b) => b - a);
        
        const nextNumber = categoryNumbers.length > 0 ? categoryNumbers[0] + 1 : 1;
        categoryId = nextNumber < 10 ? `CAT0${nextNumber}` : `CAT${nextNumber}`;
      }
      
      const processedData = {
        ...req.body,
        id: categoryId,
        parent_id: req.body.parent_id === 'none' || req.body.parent_id === '' ? null : req.body.parent_id,
        code: req.body.code === '' || !req.body.code ? null : req.body.code
      };
      
      console.log('Processed category data:', processedData);
      const category = await storage.createCategory(processedData);
      console.log('Created category:', category);
      res.json(category);
    } catch (error) {
      console.error('Category creation error:', error);
      res.status(500).json({ message: "خطأ في إنشاء الفئة", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log('Updating category:', id, req.body);
      
      const processedData = {
        ...req.body,
        parent_id: req.body.parent_id === 'none' || req.body.parent_id === '' ? null : req.body.parent_id,
        code: req.body.code === '' || !req.body.code ? null : req.body.code
      };
      
      const category = await storage.updateCategory(id, processedData);
      res.json(category);
    } catch (error) {
      console.error('Category update error:', error);
      res.status(500).json({ message: "خطأ في تحديث الفئة", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteCategory(id);
      res.json({ message: "تم حذف الفئة بنجاح" });
    } catch (error) {
      console.error('Category deletion error:', error);
      res.status(500).json({ message: "خطأ في حذف الفئة", error: error instanceof Error ? error.message : 'Unknown error' });
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

  app.post("/api/maintenance-requests", async (req, res) => {
    try {
      console.log('Creating maintenance request with data:', req.body);
      const validatedData = insertMaintenanceRequestSchema.parse(req.body);
      const request = await storage.createMaintenanceRequest(validatedData);
      console.log('Created maintenance request:', request);
      res.json(request);
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      res.status(500).json({ 
        message: "خطأ في إنشاء طلب الصيانة", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Maintenance Actions routes
  app.get("/api/maintenance-actions", async (req, res) => {
    try {
      const actions = await storage.getAllMaintenanceActions();
      res.json(actions);
    } catch (error) {
      console.error('Error fetching maintenance actions:', error);
      res.status(500).json({ message: "خطأ في جلب إجراءات الصيانة" });
    }
  });

  app.get("/api/maintenance-actions/request/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const actions = await storage.getMaintenanceActionsByRequestId(requestId);
      res.json(actions);
    } catch (error) {
      console.error('Error fetching maintenance actions by request:', error);
      res.status(500).json({ message: "خطأ في جلب إجراءات الصيانة للطلب" });
    }
  });

  app.post("/api/maintenance-actions", async (req, res) => {
    try {
      console.log('Creating maintenance action with data:', req.body);
      const data = insertMaintenanceActionSchema.parse(req.body);
      console.log('Parsed action data:', data);
      const action = await storage.createMaintenanceAction(data);
      console.log('Created maintenance action:', action);
      res.json(action);
    } catch (error) {
      console.error('Error creating maintenance action:', error);
      res.status(500).json({ 
        message: "خطأ في إنشاء إجراء الصيانة",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/maintenance-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const action = await storage.updateMaintenanceAction(id, req.body);
      res.json(action);
    } catch (error) {
      console.error('Error updating maintenance action:', error);
      res.status(500).json({ message: "خطأ في تحديث إجراء الصيانة" });
    }
  });

  app.delete("/api/maintenance-actions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaintenanceAction(id);
      res.json({ message: "تم حذف إجراء الصيانة بنجاح" });
    } catch (error) {
      console.error('Error deleting maintenance action:', error);
      res.status(500).json({ message: "خطأ في حذف إجراء الصيانة" });
    }
  });

  // Maintenance Reports routes
  app.get("/api/maintenance-reports", async (req, res) => {
    try {
      const { type } = req.query;
      const reports = type 
        ? await storage.getMaintenanceReportsByType(type as string)
        : await storage.getAllMaintenanceReports();
      res.json(reports);
    } catch (error) {
      console.error('Error fetching maintenance reports:', error);
      res.status(500).json({ message: "خطأ في جلب بلاغات الصيانة" });
    }
  });

  app.post("/api/maintenance-reports", async (req, res) => {
    try {
      const data = insertMaintenanceReportSchema.parse(req.body);
      const report = await storage.createMaintenanceReport(data);
      res.json(report);
    } catch (error) {
      console.error('Error creating maintenance report:', error);
      res.status(500).json({ message: "خطأ في إنشاء بلاغ الصيانة" });
    }
  });

  app.put("/api/maintenance-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.updateMaintenanceReport(id, req.body);
      res.json(report);
    } catch (error) {
      console.error('Error updating maintenance report:', error);
      res.status(500).json({ message: "خطأ في تحديث بلاغ الصيانة" });
    }
  });

  app.delete("/api/maintenance-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaintenanceReport(id);
      res.json({ message: "تم حذف بلاغ الصيانة بنجاح" });
    } catch (error) {
      console.error('Error deleting maintenance report:', error);
      res.status(500).json({ message: "خطأ في حذف بلاغ الصيانة" });
    }
  });

  // Operator Negligence Reports routes
  app.get("/api/operator-negligence-reports", async (req, res) => {
    try {
      const { operator_id } = req.query;
      const reports = operator_id 
        ? await storage.getOperatorNegligenceReportsByOperator(parseInt(operator_id as string))
        : await storage.getAllOperatorNegligenceReports();
      res.json(reports);
    } catch (error) {
      console.error('Error fetching operator negligence reports:', error);
      res.status(500).json({ message: "خطأ في جلب بلاغات إهمال المشغلين" });
    }
  });

  app.post("/api/operator-negligence-reports", async (req, res) => {
    try {
      const data = insertOperatorNegligenceReportSchema.parse(req.body);
      const report = await storage.createOperatorNegligenceReport(data);
      res.json(report);
    } catch (error) {
      console.error('Error creating operator negligence report:', error);
      res.status(500).json({ message: "خطأ في إنشاء بلاغ إهمال المشغل" });
    }
  });

  app.put("/api/operator-negligence-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.updateOperatorNegligenceReport(id, req.body);
      res.json(report);
    } catch (error) {
      console.error('Error updating operator negligence report:', error);
      res.status(500).json({ message: "خطأ في تحديث بلاغ إهمال المشغل" });
    }
  });

  app.delete("/api/operator-negligence-reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOperatorNegligenceReport(id);
      res.json({ message: "تم حذف بلاغ إهمال المشغل بنجاح" });
    } catch (error) {
      console.error('Error deleting operator negligence report:', error);
      res.status(500).json({ message: "خطأ في حذف بلاغ إهمال المشغل" });
    }
  });

  // Spare Parts routes
  app.get("/api/spare-parts", async (req, res) => {
    try {
      const spareParts = await storage.getAllSpareParts();
      res.json(spareParts);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      res.status(500).json({ message: "خطأ في جلب قطع الغيار" });
    }
  });

  app.post("/api/spare-parts", async (req, res) => {
    try {
      const sparePart = await storage.createSparePart(req.body);
      res.json(sparePart);
    } catch (error) {
      console.error('Error creating spare part:', error);
      res.status(500).json({ message: "خطأ في إنشاء قطعة الغيار" });
    }
  });

  app.put("/api/spare-parts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sparePart = await storage.updateSparePart(id, req.body);
      res.json(sparePart);
    } catch (error) {
      console.error('Error updating spare part:', error);
      res.status(500).json({ message: "خطأ في تحديث قطعة الغيار" });
    }
  });

  app.delete("/api/spare-parts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSparePart(id);
      res.json({ message: "تم حذف قطعة الغيار بنجاح" });
    } catch (error) {
      console.error('Error deleting spare part:', error);
      res.status(500).json({ message: "خطأ في حذف قطعة الغيار" });
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
      const fallbackResponse = generateFallbackResponse(req.body.message);
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
      console.log('Received machine data:', req.body);
      
      // Generate sequential ID if not provided
      let machineId = req.body.id;
      if (!machineId) {
        // Get the latest machine to determine the next sequential number
        const existingMachines = await storage.getMachines();
        const machineNumbers = existingMachines
          .map(machine => machine.id)
          .filter(id => id.startsWith('MAC'))
          .map(id => parseInt(id.replace('MAC', '')))
          .filter(num => !isNaN(num))
          .sort((a, b) => b - a);
        
        const nextNumber = machineNumbers.length > 0 ? machineNumbers[0] + 1 : 1;
        machineId = `MAC${nextNumber.toString().padStart(2, '0')}`;
      }
      
      const processedData = {
        ...req.body,
        id: machineId
      };
      
      console.log('Processed machine data:', processedData);
      const machine = await storage.createMachine(processedData);
      console.log('Created machine:', machine);
      res.json(machine);
    } catch (error) {
      console.error('Machine creation error:', error);
      res.status(500).json({ message: "خطأ في إنشاء الماكينة", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/machines/:id", async (req, res) => {
    try {
      const id = req.params.id; // Now using string ID
      console.log('Updating machine:', id, req.body);
      const machine = await storage.updateMachine(id, req.body);
      res.json(machine);
    } catch (error) {
      console.error('Machine update error:', error);
      res.status(500).json({ message: "خطأ في تحديث الماكينة", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Users routes
  app.post("/api/users", async (req, res) => {
    try {
      console.log('Received user data:', req.body);
      
      // ID will be auto-generated by the database (serial/auto-increment)

      // Handle role_id conversion - convert role name to role ID
      let roleId = null;
      if (req.body.role_id && req.body.role_id !== '' && req.body.role_id !== 'none') {
        if (typeof req.body.role_id === 'string') {
          // If it's a role name like 'admin', convert to role ID
          const roles = await storage.getRoles();
          const role = roles.find(r => r.name === req.body.role_id || r.name_ar === req.body.role_id);
          if (role) {
            roleId = role.id;
          } else {
            // If it's a numeric string, parse it
            const parsed = parseInt(req.body.role_id);
            if (!isNaN(parsed)) {
              roleId = parsed;
            }
          }
        } else if (typeof req.body.role_id === 'number') {
          roleId = req.body.role_id;
        }
      }

      // Handle section_id - convert section string ID to integer
      let sectionId = null;
      if (req.body.section_id && req.body.section_id !== '' && req.body.section_id !== 'none') {
        // Simple mapping from section string ID to integer
        const sectionMapping: { [key: string]: number } = {
          'SEC01': 1,
          'SEC02': 2,
          'SEC03': 3,
          'SEC04': 4,
          'SEC05': 5,
          'SEC06': 6,
          'SEC07': 7
        };
        sectionId = sectionMapping[req.body.section_id] || null;
      }
      
      const processedData = {
        username: req.body.username,
        password: req.body.password || 'defaultPassword',
        display_name: req.body.display_name,
        display_name_ar: req.body.display_name_ar,
        role_id: roleId,
        section_id: sectionId,
        status: req.body.status || 'active'
      };
      
      console.log('Processed user data:', processedData);
      const user = await storage.createUser(processedData);
      console.log('Created user:', user);
      res.json(user);
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ message: "خطأ في إنشاء المستخدم", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Updating user:', id, req.body);
      
      // Process role_id and section_id to convert empty strings and "none" to null
      let roleId = null;
      if (req.body.role_id && req.body.role_id !== '' && req.body.role_id !== 'none') {
        const roleMapping = {
          'ROLE01': 1,
          'ROLE02': 2,
          'ROLE03': 3,
          'ROLE04': 4,
          'ROLE05': 5,
          'ROLE06': 6,
          'ROLE07': 7
        };
        roleId = roleMapping[req.body.role_id as keyof typeof roleMapping] || null;
      }
      
      let sectionId = null;
      if (req.body.section_id && req.body.section_id !== '' && req.body.section_id !== 'none') {
        const sectionMapping = {
          'SEC01': 1,
          'SEC02': 2,
          'SEC03': 3,
          'SEC04': 4,
          'SEC05': 5,
          'SEC06': 6,
          'SEC07': 7
        };
        sectionId = sectionMapping[req.body.section_id as keyof typeof sectionMapping] || null;
      }
      
      const processedData = {
        ...req.body,
        role_id: roleId,
        section_id: sectionId
      };
      
      console.log('Processed role_id:', roleId, 'from:', req.body.role_id);
      console.log('Processed section_id:', sectionId, 'from:', req.body.section_id);
      
      const user = await storage.updateUser(id, processedData);
      res.json(user);
    } catch (error) {
      console.error('User update error:', error);
      res.status(500).json({ message: "خطأ في تحديث المستخدم", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Roles management routes
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error('Roles fetch error:', error);
      res.status(500).json({ message: "خطأ في جلب الأدوار" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      console.log('Received role data:', req.body);
      const role = await storage.createRole(req.body);
      console.log('Created role:', role);
      res.json(role);
    } catch (error) {
      console.error('Role creation error:', error);
      res.status(500).json({ message: "خطأ في إنشاء الدور", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('Updating role:', id, req.body);
      const role = await storage.updateRole(id, req.body);
      res.json(role);
    } catch (error) {
      console.error('Role update error:', error);
      res.status(500).json({ message: "خطأ في تحديث الدور", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRole(id);
      res.json({ message: "تم حذف الدور بنجاح" });
    } catch (error) {
      console.error('Role deletion error:', error);
      res.status(500).json({ message: "خطأ في حذف الدور", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Sections routes
  app.post("/api/sections", async (req, res) => {
    try {
      console.log('Received section data:', req.body);
      
      // Generate sequential ID if not provided
      let sectionId = req.body.id;
      if (!sectionId) {
        // Get the latest section to determine the next sequential number
        const existingSections = await storage.getSections();
        const sectionNumbers = existingSections
          .map(section => section.id)
          .filter(id => id.startsWith('SEC'))
          .map(id => parseInt(id.replace('SEC', '')))
          .filter(num => !isNaN(num))
          .sort((a, b) => b - a);
        
        const nextNumber = sectionNumbers.length > 0 ? sectionNumbers[0] + 1 : 1;
        sectionId = `SEC${nextNumber.toString().padStart(2, '0')}`;
      }
      
      const processedData = {
        ...req.body,
        id: sectionId
      };
      
      console.log('Processed section data:', processedData);
      const section = await storage.createSection(processedData);
      console.log('Created section:', section);
      res.json(section);
    } catch (error) {
      console.error('Section creation error:', error);
      res.status(500).json({ message: "خطأ في إنشاء القسم", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/sections/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const section = await storage.updateSection(id, req.body);
      res.json(section);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث القسم" });
    }
  });

  // Material Groups routes




  // Items routes
  app.post("/api/items", async (req, res) => {
    try {
      console.log('Received item data:', req.body);
      
      // Generate sequential ID if not provided
      let itemId = req.body.id;
      if (!itemId) {
        // Get the latest item to determine the next sequential number
        const existingItems = await storage.getItems();
        const itemNumbers = existingItems
          .map(item => item.id)
          .filter(id => id.startsWith('ITEM'))
          .map(id => parseInt(id.replace('ITEM', '')))
          .filter(num => !isNaN(num))
          .sort((a, b) => b - a);
        
        const nextNumber = itemNumbers.length > 0 ? itemNumbers[0] + 1 : 1;
        itemId = `ITEM${nextNumber.toString().padStart(3, '0')}`;
      }
      
      // Convert empty strings to null for optional fields
      const processedData = {
        ...req.body,
        id: itemId,
        category_id: req.body.category_id === '' || req.body.category_id === 'none' || !req.body.category_id ? null : req.body.category_id,
        code: req.body.code === '' || !req.body.code ? null : req.body.code
      };
      
      console.log('Processed item data:', processedData);
      const item = await storage.createItem(processedData);
      console.log('Created item:', item);
      res.json(item);
    } catch (error) {
      console.error('Item creation error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: "خطأ في إنشاء الصنف", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/items/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log('Updating item:', id, req.body);
      
      // Convert empty strings to null for optional fields
      const processedData = {
        ...req.body,
        category_id: req.body.category_id === '' || req.body.category_id === 'none' || !req.body.category_id ? null : req.body.category_id,
        code: req.body.code === '' || !req.body.code ? null : req.body.code
      };
      
      console.log('Processed item update data:', processedData);
      const item = await storage.updateItem(id, processedData);
      res.json(item);
    } catch (error) {
      console.error('Item update error:', error);
      res.status(500).json({ message: "خطأ في تحديث الصنف", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Customer Products routes
  app.post("/api/customer-products", async (req, res) => {
    try {
      // Convert material_group_id to category_id for backwards compatibility
      const processedData = {
        ...req.body,
        category_id: req.body.material_group_id || req.body.category_id,
      };
      delete processedData.material_group_id;
      
      const customerProduct = await storage.createCustomerProduct(processedData);
      res.json(customerProduct);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء منتج العميل" });
    }
  });

  app.put("/api/customer-products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate the ID parameter
      if (isNaN(id)) {
        return res.status(400).json({ message: "معرف المنتج غير صحيح" });
      }
      
      // Validate request body using Zod schema
      const validation = insertCustomerProductSchema.safeParse({
        ...req.body,
        category_id: req.body.material_group_id || req.body.category_id,
      });
      
      if (!validation.success) {
        console.error('Customer product validation error:', validation.error.errors);
        return res.status(400).json({ 
          message: "بيانات غير صحيحة", 
          errors: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Remove material_group_id for backwards compatibility
      const processedData = { ...validation.data };
      delete (processedData as any).material_group_id;
      
      const customerProduct = await storage.updateCustomerProduct(id, processedData);
      
      if (!customerProduct) {
        return res.status(404).json({ message: "منتج العميل غير موجود" });
      }
      
      res.json(customerProduct);
    } catch (error) {
      console.error('Customer product update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: "خطأ في تحديث منتج العميل", 
        error: errorMessage 
      });
    }
  });

  // Locations routes
  app.post("/api/locations", async (req, res) => {
    try {
      console.log('Received location data:', req.body);
      
      // Generate sequential ID if not provided
      let locationId = req.body.id;
      if (!locationId) {
        // Get the latest location to determine the next sequential number
        const existingLocations = await storage.getLocations();
        const locationNumbers = existingLocations
          .map(location => location.id)
          .filter(id => id.startsWith('LOC'))
          .map(id => parseInt(id.replace('LOC', '')))
          .filter(num => !isNaN(num))
          .sort((a, b) => b - a);
        
        const nextNumber = locationNumbers.length > 0 ? locationNumbers[0] + 1 : 1;
        locationId = `LOC${nextNumber.toString().padStart(2, '0')}`;
      }
      
      const processedData = {
        ...req.body,
        id: locationId
      };
      
      console.log('Processed location data:', processedData);
      const location = await storage.createLocation(processedData);
      console.log('Created location:', location);
      res.json(location);
    } catch (error) {
      console.error('Location creation error:', error);
      res.status(500).json({ message: "خطأ في إنشاء الموقع", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const id = req.params.id; // Now using string ID
      console.log('Updating location:', id, req.body);
      const location = await storage.updateLocation(id, req.body);
      res.json(location);
    } catch (error) {
      console.error('Location update error:', error);
      res.status(500).json({ message: "خطأ في تحديث الموقع", error: error instanceof Error ? error.message : 'Unknown error' });
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

  // Training Evaluations
  app.get("/api/hr/training-evaluations", async (req, res) => {
    try {
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
      const programId = req.query.program_id ? parseInt(req.query.program_id as string) : undefined;
      const evaluations = await storage.getTrainingEvaluations(employeeId, programId);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب التقييمات التدريبية" });
    }
  });

  app.post("/api/hr/training-evaluations", async (req, res) => {
    try {
      const evaluation = await storage.createTrainingEvaluation(req.body);
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء التقييم التدريبي" });
    }
  });

  app.put("/api/hr/training-evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const evaluation = await storage.updateTrainingEvaluation(id, req.body);
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث التقييم التدريبي" });
    }
  });

  app.get("/api/hr/training-evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const evaluation = await storage.getTrainingEvaluationById(id);
      if (evaluation) {
        res.json(evaluation);
      } else {
        res.status(404).json({ message: "التقييم التدريبي غير موجود" });
      }
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب التقييم التدريبي" });
    }
  });

  // Training Certificates
  app.get("/api/hr/training-certificates", async (req, res) => {
    try {
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
      const certificates = await storage.getTrainingCertificates(employeeId);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب الشهادات التدريبية" });
    }
  });

  app.post("/api/hr/training-certificates", async (req, res) => {
    try {
      const certificate = await storage.createTrainingCertificate(req.body);
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء الشهادة التدريبية" });
    }
  });

  app.post("/api/hr/training-certificates/generate/:enrollmentId", async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.enrollmentId);
      const certificate = await storage.generateTrainingCertificate(enrollmentId);
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إصدار الشهادة التدريبية" });
    }
  });

  app.put("/api/hr/training-certificates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.updateTrainingCertificate(id, req.body);
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث الشهادة التدريبية" });
    }
  });

  // Training Evaluations
  app.get("/api/hr/training-evaluations", async (req, res) => {
    try {
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
      const programId = req.query.program_id ? parseInt(req.query.program_id as string) : undefined;
      const evaluations = await storage.getTrainingEvaluations(employeeId, programId);
      res.json(evaluations);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب تقييمات التدريب" });
    }
  });

  app.post("/api/hr/training-evaluations", async (req, res) => {
    try {
      const evaluation = await storage.createTrainingEvaluation(req.body);
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء تقييم التدريب" });
    }
  });

  app.put("/api/hr/training-evaluations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const evaluation = await storage.updateTrainingEvaluation(id, req.body);
      res.json(evaluation);
    } catch (error) {
      res.status(500).json({ message: "خطأ في تحديث تقييم التدريب" });
    }
  });

  // Training Certificates
  app.get("/api/hr/training-certificates", async (req, res) => {
    try {
      const employeeId = req.query.employee_id ? parseInt(req.query.employee_id as string) : undefined;
      const certificates = await storage.getTrainingCertificates(employeeId);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "خطأ في جلب شهادات التدريب" });
    }
  });

  app.post("/api/hr/training-certificates", async (req, res) => {
    try {
      const certificate = await storage.createTrainingCertificate(req.body);
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "خطأ في إنشاء شهادة التدريب" });
    }
  });

  app.get("/api/hr/training-certificates/:id/generate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const certificate = await storage.generateTrainingCertificate(id);
      res.json(certificate);
    } catch (error) {
      res.status(500).json({ message: "خطأ في توليد شهادة التدريب" });
    }
  });

  // Performance Reviews
  app.get("/api/hr/performance-reviews", async (req, res) => {
    try {
      const employeeId = req.query.employee_id ? req.query.employee_id as string : undefined;
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
      const employeeId = req.query.employee_id ? req.query.employee_id as string : undefined;
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
      const employeeId = req.params.employeeId;
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
      const id = req.params.id;
      await storage.deleteSection(id);
      res.json({ message: "تم حذف القسم بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف القسم" });
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
      const id = req.params.id;
      await storage.deleteLocation(id);
      res.json({ message: "تم حذف الموقع بنجاح" });
    } catch (error) {
      res.status(500).json({ message: "خطأ في حذف الموقع" });
    }
  });

  app.delete("/api/machines/:id", async (req, res) => {
    try {
      const id = req.params.id;
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
      const locationId = req.params.id;
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

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "الحالة مطلوبة" });
      }

      // Validate status values
      const validStatuses = ['pending', 'for_production', 'on_hold', 'waiting', 'in_progress', 'completed', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "حالة غير صحيحة" });
      }
      
      const order = await storage.updateOrderStatus(orderId, status);
      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: "خطأ في تحديث حالة الطلب" });
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

  // Database Management routes
  app.get("/api/database/stats", async (req, res) => {
    try {
      const stats = await storage.getDatabaseStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching database stats:", error);
      res.status(500).json({ message: "خطأ في جلب إحصائيات قاعدة البيانات" });
    }
  });

  app.post("/api/database/backup", async (req, res) => {
    try {
      const backup = await storage.createDatabaseBackup();
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
      
      // Send the backup data directly for download
      res.send(backup.data);
    } catch (error) {
      console.error("Error creating database backup:", error);
      res.status(500).json({ message: "خطأ في إنشاء النسخة الاحتياطية" });
    }
  });

  app.get("/api/database/backup/download/:backupId", async (req, res) => {
    try {
      const backupId = req.params.backupId;
      const backupFile = await storage.getBackupFile(backupId);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="backup-${backupId}.sql"`);
      res.send(backupFile);
    } catch (error) {
      console.error("Error downloading backup:", error);
      res.status(500).json({ message: "خطأ في تحميل النسخة الاحتياطية" });
    }
  });

  app.post("/api/database/restore", async (req, res) => {
    try {
      const { backupData } = req.body;
      const result = await storage.restoreDatabaseBackup(backupData);
      res.json({ message: "تم استعادة قاعدة البيانات بنجاح", result });
    } catch (error) {
      console.error("Error restoring database:", error);
      res.status(500).json({ message: "خطأ في استعادة قاعدة البيانات" });
    }
  });

  app.get("/api/database/export/:tableName", async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const format = req.query.format as string || 'csv';
      
      const data = await storage.exportTableData(tableName, format);
      
      let contentType = 'text/csv';
      let fileExtension = 'csv';
      
      switch (format) {
        case 'json':
          contentType = 'application/json';
          fileExtension = 'json';
          break;
        case 'excel':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${tableName}.${fileExtension}"`);
      
      // Set proper charset for CSV to ensure Arabic text encoding
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      }
      
      res.send(data);
    } catch (error) {
      console.error("Error exporting table data:", error);
      res.status(500).json({ message: "خطأ في تصدير بيانات الجدول" });
    }
  });

  app.post("/api/database/import/:tableName", async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const { data, format } = req.body;
      
      const result = await storage.importTableData(tableName, data, format);
      res.json({ 
        message: "تم استيراد البيانات بنجاح", 
        importedRecords: result.count
      });
    } catch (error) {
      console.error("Error importing table data:", error);
      res.status(500).json({ message: "خطأ في استيراد البيانات" });
    }
  });

  // Enhanced batch import endpoint
  app.post("/api/database/import/:tableName/batch", async (req, res) => {
    try {
      const tableName = req.params.tableName;
      const { data, options } = req.body;
      
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "البيانات المرسلة غير صالحة" });
      }

      console.log(`Processing batch import for ${tableName}: ${data.length} records (Batch ${options?.batchNumber || 1}/${options?.totalBatches || 1})`);
      
      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
        warnings: [] as string[]
      };

      // Process each record in the batch
      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        
        try {
          // Validate and process the record based on table type
          let processedRecord = { ...record };
          
          // Table-specific processing
          if (tableName === 'customers') {
            // Generate ID if not provided
            if (!processedRecord.id) {
              const existingCustomers = await storage.getCustomers();
              const lastId = existingCustomers.length > 0 
                ? Math.max(...existingCustomers.map(c => {
                    const idNum = parseInt(c.id.replace('CID', ''));
                    return isNaN(idNum) ? 0 : idNum;
                  }))
                : 0;
              processedRecord.id = `CID${String(lastId + 1).padStart(4, '0')}`;
            }
            
            // Validate using schema
            const validatedRecord = insertCustomerSchema.parse(processedRecord);
            await storage.createCustomer(validatedRecord);
            
          } else if (tableName === 'categories') {
            // Generate ID if not provided
            if (!processedRecord.id) {
              const existingCategories = await storage.getCategories();
              const lastId = existingCategories.length > 0 
                ? Math.max(...existingCategories.map(c => {
                    const idNum = parseInt(c.id.replace('CAT', ''));
                    return isNaN(idNum) ? 0 : idNum;
                  }))
                : 0;
              processedRecord.id = `CAT${String(lastId + 1).padStart(2, '0')}`;
            }
            
            await storage.createCategory(processedRecord);
            
          } else if (tableName === 'sections') {
            // Generate ID if not provided
            if (!processedRecord.id) {
              const existingSections = await storage.getSections();
              const lastId = existingSections.length > 0 
                ? Math.max(...existingSections.map(s => {
                    const idNum = parseInt(s.id.replace('SEC', ''));
                    return isNaN(idNum) ? 0 : idNum;
                  }))
                : 0;
              processedRecord.id = `SEC${String(lastId + 1).padStart(2, '0')}`;
            }
            
            await storage.createSection(processedRecord);
            
          } else if (tableName === 'items') {
            // Generate ID if not provided
            if (!processedRecord.id) {
              const existingItems = await storage.getItems();
              const lastId = existingItems.length > 0 
                ? Math.max(...existingItems.map(i => {
                    const idNum = parseInt(i.id.replace('ITM', ''));
                    return isNaN(idNum) ? 0 : idNum;
                  }))
                : 0;
              processedRecord.id = `ITM${String(lastId + 1).padStart(3, '0')}`;
            }
            
            await storage.createItem(processedRecord);
            
          } else if (tableName === 'customer_products') {
            // Auto-increment numeric ID
            if (!processedRecord.id) {
              const existingProducts = await storage.getCustomerProducts();
              const lastId = existingProducts.length > 0 
                ? Math.max(...existingProducts.map(p => p.id).filter(id => typeof id === 'number'))
                : 0;
              processedRecord.id = lastId + 1;
            }
            
            // Handle cutting_unit field specifically to ensure it's included
            if (processedRecord.cutting_unit !== undefined && processedRecord.cutting_unit !== null) {
              // Keep the cutting_unit value as is
              console.log('Processing cutting_unit:', processedRecord.cutting_unit);
            }
            
            // Convert numeric string fields to proper types
            const numericFields = ['width', 'left_facing', 'right_facing', 'thickness', 'unit_weight_kg', 'package_weight_kg'];
            numericFields.forEach(field => {
              if (processedRecord[field] && typeof processedRecord[field] === 'string') {
                const numValue = parseFloat(processedRecord[field]);
                if (!isNaN(numValue)) {
                  processedRecord[field] = numValue;
                }
              }
            });
            
            const integerFields = ['cutting_length_cm', 'unit_quantity'];
            integerFields.forEach(field => {
              if (processedRecord[field] && typeof processedRecord[field] === 'string') {
                const intValue = parseInt(processedRecord[field]);
                if (!isNaN(intValue)) {
                  processedRecord[field] = intValue;
                }
              }
            });
            
            // Handle boolean fields
            if (processedRecord.is_printed !== undefined) {
              processedRecord.is_printed = processedRecord.is_printed === 'true' || processedRecord.is_printed === true;
            }
            
            // Validate using schema
            const validatedRecord = insertCustomerProductSchema.parse(processedRecord);
            await storage.createCustomerProduct(validatedRecord);
            
          } else if (tableName === 'users') {
            // Auto-increment numeric ID
            if (!processedRecord.id) {
              const existingUsers = await storage.getUsers();
              const lastId = existingUsers.length > 0 
                ? Math.max(...existingUsers.map(u => u.id))
                : 0;
              processedRecord.id = lastId + 1;
            }
            
            // Set default role if not provided
            if (!processedRecord.role_id) {
              processedRecord.role_id = 2; // Default user role
            }
            
            // Validate using schema
            const validatedRecord = insertUserSchema.parse(processedRecord);
            await storage.createUser(validatedRecord);
            
          } else if (tableName === 'machines') {
            // Generate ID if not provided
            if (!processedRecord.id) {
              const existingMachines = await storage.getMachines();
              const lastId = existingMachines.length > 0 
                ? Math.max(...existingMachines.map(m => {
                    const idNum = parseInt(m.id.replace('MAC', ''));
                    return isNaN(idNum) ? 0 : idNum;
                  }))
                : 0;
              processedRecord.id = `MAC${String(lastId + 1).padStart(2, '0')}`;
            }
            
            await storage.createMachine(processedRecord);
            
          } else if (tableName === 'locations') {
            // Auto-increment numeric ID
            if (!processedRecord.id) {
              const existingLocations = await storage.getLocations();
              const lastId = existingLocations.length > 0 
                ? Math.max(...existingLocations.map(l => typeof l.id === 'number' ? l.id : parseInt(l.id)))
                : 0;
              processedRecord.id = lastId + 1;
            }
            
            // Validate using schema
            const validatedRecord = insertLocationSchema.parse(processedRecord);
            await storage.createLocation(validatedRecord);
            
          } else {
            // Generic handling for other tables
            await storage.importTableData(tableName, [record], 'json');
          }
          
          results.successful++;
          
        } catch (error) {
          results.failed++;
          const errorMsg = `السجل ${i + 1}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`;
          results.errors.push(errorMsg);
          
          if (!options?.continueOnError) {
            // Stop processing if not continuing on error
            break;
          }
        }
      }

      res.json({
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        warnings: results.warnings,
        batchNumber: options?.batchNumber || 1,
        totalBatches: options?.totalBatches || 1
      });
      
    } catch (error) {
      console.error("Error in batch import:", error);
      res.status(500).json({ 
        message: "خطأ في معالجة الدفعة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });

  app.post("/api/database/optimize", async (req, res) => {
    try {
      const result = await storage.optimizeTables();
      res.json({ message: "تم تحسين الجداول بنجاح", result });
    } catch (error) {
      console.error("Error optimizing tables:", error);
      res.status(500).json({ message: "خطأ في تحسين الجداول" });
    }
  });

  app.post("/api/database/integrity-check", async (req, res) => {
    try {
      const result = await storage.checkDatabaseIntegrity();
      res.json({ message: "تم فحص تكامل قاعدة البيانات", result });
    } catch (error) {
      console.error("Error checking database integrity:", error);
      res.status(500).json({ message: "خطأ في فحص تكامل قاعدة البيانات" });
    }
  });

  app.post("/api/database/cleanup", async (req, res) => {
    try {
      const { daysOld } = req.body;
      const result = await storage.cleanupOldData(daysOld || 90);
      res.json({ 
        message: "تم تنظيف البيانات القديمة بنجاح", 
        deletedRecords: result.count
      });
    } catch (error) {
      console.error("Error cleaning up old data:", error);
      res.status(500).json({ message: "خطأ في تنظيف البيانات القديمة" });
    }
  });

  // ============ HR Attendance Management API ============
  
  app.get("/api/attendance", async (req, res) => {
    try {
      const attendance = await storage.getAttendance();
      res.json(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: "خطأ في جلب بيانات الحضور" });
    }
  });

  // Get daily attendance status for a user
  app.get("/api/attendance/daily-status/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      
      const status = await storage.getDailyAttendanceStatus(userId, date);
      res.json(status);
    } catch (error) {
      console.error('Error fetching daily attendance status:', error);
      res.status(500).json({ message: "خطأ في جلب حالة الحضور اليومية" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const attendance = await storage.createAttendance(req.body);
      
      // Send attendance notification
      try {
        const user = await storage.getUserById(req.body.user_id);
        if (user && user.phone) {
          let messageTemplate = '';
          let priority = 'normal';
          
          switch (req.body.status) {
            case 'حاضر':
              messageTemplate = `مرحباً ${user.display_name_ar || user.username}، تم تسجيل حضورك اليوم بنجاح في ${new Date().toLocaleTimeString('ar-SA')}. نتمنى لك يوم عمل مثمر!`;
              priority = 'normal';
              break;
            case 'في الاستراحة':
              messageTemplate = `${user.display_name_ar || user.username}، تم تسجيل بدء استراحة الغداء في ${new Date().toLocaleTimeString('ar-SA')}. استمتع بوقت راحتك!`;
              priority = 'low';
              break;
            case 'يعمل':
              messageTemplate = `${user.display_name_ar || user.username}، تم تسجيل انتهاء استراحة الغداء في ${new Date().toLocaleTimeString('ar-SA')}. مرحباً بعودتك للعمل!`;
              priority = 'normal';
              break;
            case 'مغادر':
              messageTemplate = `${user.display_name_ar || user.username}، تم تسجيل انصرافك في ${new Date().toLocaleTimeString('ar-SA')}. شكراً لجهودك اليوم، نراك غداً!`;
              priority = 'normal';
              break;
          }
          
          if (messageTemplate) {
            await notificationService.sendWhatsAppMessage(user.phone, messageTemplate, {
              title: 'تنبيه الحضور',
              priority,
              context_type: 'attendance',
              context_id: attendance.id?.toString()
            });
          }
        }
      } catch (notificationError) {
        console.error("Failed to send attendance notification:", notificationError);
        // Don't fail the main request if notification fails
      }
      
      res.status(201).json(attendance);
    } catch (error) {
      console.error('Error creating attendance:', error);
      
      // Return the specific error message for validation errors
      if (error instanceof Error && error.message.includes('تم تسجيل')) {
        return res.status(400).json({ message: error.message });
      }
      
      if (error instanceof Error && error.message.includes('يجب')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "خطأ في إنشاء سجل الحضور" });
    }
  });

  app.put("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const attendance = await storage.updateAttendance(id, req.body);
      res.json(attendance);
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ message: "خطأ في تحديث سجل الحضور" });
    }
  });

  app.delete("/api/attendance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAttendance(id);
      res.json({ message: "تم حذف سجل الحضور بنجاح" });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      res.status(500).json({ message: "خطأ في حذف سجل الحضور" });
    }
  });

  // ============ User Violations Management API ============
  
  app.get("/api/violations", async (req, res) => {
    try {
      const violations = await storage.getViolations();
      res.json(violations);
    } catch (error) {
      console.error('Error fetching violations:', error);
      res.status(500).json({ message: "خطأ في جلب بيانات المخالفات" });
    }
  });

  app.post("/api/violations", async (req, res) => {
    try {
      const violation = await storage.createViolation(req.body);
      res.status(201).json(violation);
    } catch (error) {
      console.error('Error creating violation:', error);
      res.status(500).json({ message: "خطأ في إنشاء المخالفة" });
    }
  });

  app.put("/api/violations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const violation = await storage.updateViolation(id, req.body);
      res.json(violation);
    } catch (error) {
      console.error('Error updating violation:', error);
      res.status(500).json({ message: "خطأ في تحديث المخالفة" });
    }
  });

  app.delete("/api/violations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteViolation(id);
      res.json({ message: "تم حذف المخالفة بنجاح" });
    } catch (error) {
      console.error('Error deleting violation:', error);
      res.status(500).json({ message: "خطأ في حذف المخالفة" });
    }
  });

  // ============ User Requests Management API ============
  
  app.get("/api/user-requests", async (req, res) => {
    try {
      console.log('Fetching user requests - Session ID:', req.sessionID);
      console.log('Fetching user requests - User ID in session:', req.session.userId);
      
      const requests = await storage.getUserRequests();
      console.log('Found', requests.length, 'user requests');
      
      res.json(requests);
    } catch (error) {
      console.error('Error fetching user requests:', error);
      res.status(500).json({ message: "خطأ في جلب طلبات المستخدمين" });
    }
  });

  app.post("/api/user-requests", async (req, res) => {
    try {
      const request = await storage.createUserRequest(req.body);
      res.status(201).json(request);
    } catch (error) {
      console.error('Error creating user request:', error);
      res.status(500).json({ message: "خطأ في إنشاء الطلب" });
    }
  });

  app.put("/api/user-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.updateUserRequest(id, req.body);
      res.json(request);
    } catch (error) {
      console.error('Error updating user request:', error);
      res.status(500).json({ message: "خطأ في تحديث الطلب" });
    }
  });

  app.patch("/api/user-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.updateUserRequest(id, req.body);
      res.json(request);
    } catch (error) {
      console.error('Error updating user request:', error);
      res.status(500).json({ message: "خطأ في تحديث الطلب" });
    }
  });

  app.delete("/api/user-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUserRequest(id);
      res.json({ message: "تم حذف الطلب بنجاح" });
    } catch (error) {
      console.error('Error deleting user request:', error);
      res.status(500).json({ message: "خطأ في حذف الطلب" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
