import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface SmartNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actions?: NotificationAction[];
  targetUsers?: number[];
  createdAt: Date;
  expiresAt?: Date;
}

interface NotificationAction {
  label: string;
  action: string;
  url?: string;
  confirm?: boolean;
}

export class AINotifications {
  private static notifications: SmartNotification[] = [];
  
  // إرسال إشعار ذكي
  static async sendIntelligentNotification(action: string, data: any): Promise<SmartNotification | null> {
    try {
      const notification = await this.generateNotification(action, data);
      
      if (notification) {
        this.notifications.push(notification);
        
        // إرسال إلى المستخدمين المستهدفين
        await this.deliverNotification(notification);
        
        return notification;
      }
      
      return null;
    } catch (error) {
      console.error('Smart notification error:', error);
      return null;
    }
  }

  // توليد إشعار باستخدام AI
  private static async generateNotification(action: string, data: any): Promise<SmartNotification | null> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت نظام إشعارات ذكي لمصنع الأكياس البلاستيكية. قم بتحليل الإجراء والبيانات وإنشاء إشعار مناسب بتنسيق JSON:

{
  "shouldNotify": true/false,
  "type": "info/warning/error/success",
  "priority": "low/medium/high/critical",
  "title": "عنوان الإشعار",
  "message": "نص الإشعار",
  "actions": [
    {"label": "تسمية الإجراء", "action": "اسم الإجراء", "url": "رابط اختياري"}
  ],
  "targetUsers": [قائمة معرفات المستخدمين المستهدفين],
  "expiresIn": عدد الساعات قبل انتهاء الصلاحية
}

قواعد الإشعارات:
- إنشاء/تحديث العمليات العادية → إشعارات info منخفضة الأولوية
- مشاكل الإنتاج/الجودة → إشعارات warning متوسطة الأولوية  
- أعطال المكائن/أخطاء النظام → إشعارات error عالية الأولوية
- حالات الطوارئ → إشعارات critical للجميع`
          },
          {
            role: "user",
            content: `الإجراء: ${action}
البيانات: ${JSON.stringify(data, null, 2)}

قرر ما إذا كان يجب إرسال إشعار وما نوعه وأولويته.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!result.shouldNotify) {
        return null;
      }
      
      const notification: SmartNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: result.type || 'info',
        priority: result.priority || 'medium',
        title: result.title || 'إشعار النظام',
        message: result.message || 'تم تنفيذ عملية في النظام',
        actions: result.actions || [],
        targetUsers: result.targetUsers || [],
        createdAt: new Date(),
        expiresAt: result.expiresIn ? new Date(Date.now() + result.expiresIn * 60 * 60 * 1000) : undefined
      };
      
      return notification;
    } catch (error) {
      console.error('Notification generation error:', error);
      return null;
    }
  }

  // تسليم الإشعار
  private static async deliverNotification(notification: SmartNotification): Promise<void> {
    try {
      // تسجيل الإشعار في قاعدة البيانات
      console.log(`📢 إشعار جديد [${notification.priority.toUpperCase()}]: ${notification.title}`);
      console.log(`   ${notification.message}`);
      
      // يمكن إضافة تكامل مع خدمات الإشعارات الخارجية هنا
      // مثل: البريد الإلكتروني، SMS، Push notifications، Slack، إلخ
      
      // إشعارات فورية للحالات الحرجة
      if (notification.priority === 'critical') {
        await this.sendCriticalAlert(notification);
      }
      
    } catch (error) {
      console.error('Notification delivery error:', error);
    }
  }

  // إرسال تنبيه حرج
  private static async sendCriticalAlert(notification: SmartNotification): Promise<void> {
    console.log(`🚨 تنبيه حرج: ${notification.title}`);
    console.log(`   ${notification.message}`);
    
    // يمكن إضافة تكامل مع أنظمة التنبيه الطارئة هنا
  }

  // فحص دوري للإشعارات الذكية
  static async performIntelligentMonitoring(): Promise<SmartNotification[]> {
    const notifications: SmartNotification[] = [];
    
    try {
      // فحص حالة المكائن
      const machineNotifications = await this.checkMachineStatus();
      notifications.push(...machineNotifications);
      
      // فحص الإنتاج
      const productionNotifications = await this.checkProductionStatus();
      notifications.push(...productionNotifications);
      
      // فحص الجودة
      const qualityNotifications = await this.checkQualityStatus();
      notifications.push(...qualityNotifications);
      
      // فحص المخزون
      const inventoryNotifications = await this.checkInventoryStatus();
      notifications.push(...inventoryNotifications);
      
      // إرسال الإشعارات
      for (const notification of notifications) {
        await this.deliverNotification(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Intelligent monitoring error:', error);
      return [];
    }
  }

  // فحص حالة المكائن
  private static async checkMachineStatus(): Promise<SmartNotification[]> {
    try {
      const machines = await storage.getMachines();
      const notifications: SmartNotification[] = [];
      
      const downMachines = machines.filter(m => m.status === 'down');
      const maintenanceMachines = machines.filter(m => m.status === 'maintenance');
      
      if (downMachines.length > 0) {
        notifications.push({
          id: `machine_down_${Date.now()}`,
          type: 'error',
          priority: 'high',
          title: 'مكائن متوقفة',
          message: `يوجد ${downMachines.length} مكينة متوقفة. يُرجى المراجعة فوراً.`,
          actions: [
            { label: 'عرض المكائن', action: 'navigate_machines', url: '/definitions?tab=machines' }
          ],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 ساعات
        });
      }
      
      if (maintenanceMachines.length > 3) {
        notifications.push({
          id: `machine_maintenance_${Date.now()}`,
          type: 'warning',
          priority: 'medium',
          title: 'عدد كبير من المكائن في الصيانة',
          message: `يوجد ${maintenanceMachines.length} مكينة في الصيانة. قد يؤثر على الإنتاج.`,
          actions: [
            { label: 'جدولة الصيانة', action: 'schedule_maintenance', url: '/maintenance' }
          ],
          createdAt: new Date()
        });
      }
      
      return notifications;
    } catch (error) {
      console.error('Machine status check error:', error);
      return [];
    }
  }

  // فحص حالة الإنتاج
  private static async checkProductionStatus(): Promise<SmartNotification[]> {
    try {
      const stats = await storage.getDashboardStats();
      const notifications: SmartNotification[] = [];
      
      if (stats.productionRate < 60) {
        notifications.push({
          id: `production_low_${Date.now()}`,
          type: 'warning',
          priority: 'high',
          title: 'معدل الإنتاج منخفض',
          message: `معدل الإنتاج الحالي ${stats.productionRate}% أقل من المعدل المطلوب.`,
          actions: [
            { label: 'تحليل الإنتاج', action: 'analyze_production', url: '/production' }
          ],
          createdAt: new Date()
        });
      }
      
      if (stats.activeOrders > 20) {
        notifications.push({
          id: `orders_high_${Date.now()}`,
          type: 'info',
          priority: 'medium',
          title: 'عدد كبير من الطلبات النشطة',
          message: `يوجد ${stats.activeOrders} طلب نشط. قد تحتاج لزيادة السعة الإنتاجية.`,
          actions: [
            { label: 'عرض الطلبات', action: 'view_orders', url: '/production' }
          ],
          createdAt: new Date()
        });
      }
      
      return notifications;
    } catch (error) {
      console.error('Production status check error:', error);
      return [];
    }
  }

  // فحص حالة الجودة
  private static async checkQualityStatus(): Promise<SmartNotification[]> {
    try {
      const stats = await storage.getDashboardStats();
      const notifications: SmartNotification[] = [];
      
      if (stats.qualityScore < 80) {
        notifications.push({
          id: `quality_low_${Date.now()}`,
          type: 'warning',
          priority: 'high',
          title: 'انخفاض مؤشر الجودة',
          message: `مؤشر الجودة الحالي ${stats.qualityScore}% أقل من المعايير المطلوبة.`,
          actions: [
            { label: 'مراجعة الجودة', action: 'review_quality', url: '/quality' }
          ],
          createdAt: new Date()
        });
      }
      
      if (stats.wastePercentage > 5) {
        notifications.push({
          id: `waste_high_${Date.now()}`,
          type: 'warning',
          priority: 'medium',
          title: 'ارتفاع نسبة الهدر',
          message: `نسبة الهدر الحالية ${stats.wastePercentage}% أعلى من المعدل المقبول.`,
          actions: [
            { label: 'تحليل الهدر', action: 'analyze_waste', url: '/quality' }
          ],
          createdAt: new Date()
        });
      }
      
      return notifications;
    } catch (error) {
      console.error('Quality status check error:', error);
      return [];
    }
  }

  // فحص حالة المخزون
  private static async checkInventoryStatus(): Promise<SmartNotification[]> {
    try {
      // محاكاة بيانات المخزون حتى يتم إضافة الوظائف
      const inventory: any[] = [];
      const notifications: SmartNotification[] = [];
      
      const lowStockItems = inventory.filter((item: any) => 
        (item.current_stock || 0) < (item.min_stock || 10)
      );
      
      if (lowStockItems.length > 0) {
        notifications.push({
          id: `inventory_low_${Date.now()}`,
          type: 'warning',
          priority: 'medium',
          title: 'نقص في المخزون',
          message: `يوجد ${lowStockItems.length} صنف تحت الحد الأدنى للمخزون.`,
          actions: [
            { label: 'عرض المخزون', action: 'view_inventory', url: '/warehouse?tab=inventory' }
          ],
          createdAt: new Date()
        });
      }
      
      return notifications;
    } catch (error) {
      console.error('Inventory status check error:', error);
      return [];
    }
  }

  // الحصول على الإشعارات النشطة
  static getActiveNotifications(): SmartNotification[] {
    const now = new Date();
    return this.notifications.filter(notification => 
      !notification.expiresAt || notification.expiresAt > now
    );
  }

  // تنظيف الإشعارات المنتهية الصلاحية
  static cleanupExpiredNotifications(): void {
    const now = new Date();
    this.notifications = this.notifications.filter(notification => 
      !notification.expiresAt || notification.expiresAt > now
    );
  }

  // تحديد ما إذا كان يجب إرسال إشعار
  static shouldSendNotification(action: string): boolean {
    const notificationActions = [
      'add_customer', 'add_order', 'add_production_order', 'add_machine',
      'update_order', 'update_machine', 'delete_customer', 'delete_order',
      'machine_down', 'quality_issue', 'low_inventory', 'production_delay'
    ];
    
    return notificationActions.includes(action);
  }
}

// تشغيل الفحص الدوري كل 15 دقيقة
setInterval(async () => {
  await AINotifications.performIntelligentMonitoring();
  AINotifications.cleanupExpiredNotifications();
}, 15 * 60 * 1000);