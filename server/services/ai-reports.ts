import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface IntelligentReport {
  title: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  data: Record<string, any>;
  charts?: any[];
}

export class AIReports {
  // توليد تقرير الإنتاج الذكي
  static async generateProductionReport(params?: any): Promise<IntelligentReport> {
    try {
      // جمع البيانات
      const stats = await storage.getDashboardStats();
      const jobOrders = await storage.getJobOrders();
      const machines = await storage.getMachines();
      const rolls = await storage.getRolls();
      
      // تحليل البيانات باستخدام AI
      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت محلل بيانات متخصص في الإنتاج الصناعي. حلل البيانات التالية وقدم تقريراً شاملاً بتنسيق JSON:

{
  "title": "عنوان التقرير",
  "summary": "ملخص تنفيذي موجز",
  "insights": ["نقطة تحليلية 1", "نقطة تحليلية 2", "..."],
  "recommendations": ["توصية 1", "توصية 2", "..."],
  "key_metrics": {
    "metric1": "قيمة1",
    "metric2": "قيمة2"
  }
}`
          },
          {
            role: "user",
            content: `بيانات الإنتاج:
الطلبات النشطة: ${stats.activeOrders}
معدل الإنتاج: ${stats.productionRate}%
نسبة الجودة: ${stats.qualityScore}%
نسبة الهدر: ${stats.wastePercentage}%
عدد أوامر التشغيل: ${jobOrders.length}
عدد المكائن: ${machines.length}
عدد الرولات: ${rolls.length}

قدم تحليلاً شاملاً مع توصيات عملية.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(analysis.choices[0].message.content || '{}');
      
      return {
        title: result.title || "تقرير الإنتاج الذكي",
        summary: result.summary || "تحليل شامل لأداء الإنتاج",
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        data: {
          stats,
          jobOrders: jobOrders.length,
          machines: machines.length,
          rolls: rolls.length,
          key_metrics: result.key_metrics || {}
        }
      };
    } catch (error) {
      console.error('Production report error:', error);
      throw new Error('فشل في توليد تقرير الإنتاج');
    }
  }

  // توليد تقرير الجودة الذكي
  static async generateQualityReport(params?: any): Promise<IntelligentReport> {
    try {
      const qualityChecks = await storage.getQualityChecks();
      const stats = await storage.getDashboardStats();
      
      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت خبير في إدارة الجودة. حلل بيانات فحوصات الجودة وقدم تقريراً شاملاً بتنسيق JSON مع التركيز على:
- اتجاهات الجودة
- نقاط الضعف
- التوصيات للتحسين
- مؤشرات الأداء الرئيسية`
          },
          {
            role: "user",
            content: `بيانات الجودة:
نسبة الجودة الإجمالية: ${stats.qualityScore}%
عدد فحوصات الجودة: ${qualityChecks.length}
نسبة الهدر: ${stats.wastePercentage}%

قدم تحليلاً متخصصاً في الجودة مع توصيات محددة.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(analysis.choices[0].message.content || '{}');
      
      return {
        title: result.title || "تقرير الجودة الذكي",
        summary: result.summary || "تحليل شامل لمؤشرات الجودة",
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        data: {
          qualityScore: stats.qualityScore,
          qualityChecks: qualityChecks.length,
          wastePercentage: stats.wastePercentage,
          checks: qualityChecks.slice(0, 10)
        }
      };
    } catch (error) {
      console.error('Quality report error:', error);
      throw new Error('فشل في توليد تقرير الجودة');
    }
  }

  // توليد تقرير الصيانة الذكي
  static async generateMaintenanceReport(params?: any): Promise<IntelligentReport> {
    try {
      const machines = await storage.getMachines();
      // الحصول على سجلات الصيانة (محاكاة حتى يتم إضافة الوظيفة)
      const maintenanceRecords: any[] = [];
      
      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت مختص في إدارة الصيانة الصناعية. حلل بيانات الصيانة وقدم تقريراً شاملاً بتنسيق JSON يتضمن:
- حالة المكائن
- جدولة الصيانة الوقائية
- التكاليف والكفاءة
- توصيات التحسين`
          },
          {
            role: "user",
            content: `بيانات الصيانة:
عدد المكائن: ${machines.length}
المكائن النشطة: ${machines.filter(m => m.status === 'active').length}
المكائن في الصيانة: ${machines.filter(m => m.status === 'maintenance').length}
المكائن المتوقفة: ${machines.filter(m => m.status === 'down').length}
سجلات الصيانة: ${maintenanceRecords.length}

قدم تحليلاً متخصصاً في الصيانة.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(analysis.choices[0].message.content || '{}');
      
      return {
        title: result.title || "تقرير الصيانة الذكي",
        summary: result.summary || "تحليل شامل لحالة المكائن والصيانة",
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        data: {
          totalMachines: machines.length,
          activeMachines: machines.filter(m => m.status === 'active').length,
          maintenanceMachines: machines.filter(m => m.status === 'maintenance').length,
          downMachines: machines.filter(m => m.status === 'down').length,
          maintenanceRecords: maintenanceRecords.length
        }
      };
    } catch (error) {
      console.error('Maintenance report error:', error);
      throw new Error('فشل في توليد تقرير الصيانة');
    }
  }

  // توليد تقرير المبيعات والعملاء الذكي
  static async generateSalesReport(params?: any): Promise<IntelligentReport> {
    try {
      const customers = await storage.getCustomers();
      const orders = await storage.getOrders();
      const stats = await storage.getDashboardStats();
      
      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت محلل مبيعات متخصص. حلل بيانات المبيعات والعملاء وقدم تقريراً شاملاً بتنسيق JSON يشمل:
- أداء المبيعات
- تحليل العملاء
- الاتجاهات والفرص
- استراتيجيات النمو`
          },
          {
            role: "user",
            content: `بيانات المبيعات:
عدد العملاء: ${customers.length}
عدد الطلبات: ${orders.length}
الطلبات النشطة: ${stats.activeOrders}
الطلبات المكتملة: ${orders.filter(o => o.status === 'completed').length}
الطلبات المُسلمة: ${orders.filter(o => o.status === 'delivered').length}

قدم تحليلاً تجارياً شاملاً.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(analysis.choices[0].message.content || '{}');
      
      return {
        title: result.title || "تقرير المبيعات والعملاء الذكي",
        summary: result.summary || "تحليل شامل لأداء المبيعات والعملاء",
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        data: {
          totalCustomers: customers.length,
          totalOrders: orders.length,
          activeOrders: stats.activeOrders,
          completedOrders: orders.filter(o => o.status === 'completed').length,
          deliveredOrders: orders.filter(o => o.status === 'delivered').length
        }
      };
    } catch (error) {
      console.error('Sales report error:', error);
      throw new Error('فشل في توليد تقرير المبيعات');
    }
  }

  // توليد تقرير مخصص
  static async generateCustomReport(reportType: string, params?: any): Promise<IntelligentReport> {
    try {
      // جمع البيانات حسب نوع التقرير
      let data = {};
      let contextDescription = "";
      
      switch (reportType.toLowerCase()) {
        case 'inventory':
        case 'مخزون':
          data = await this.gatherInventoryData();
          contextDescription = "بيانات المخزون والمستودع";
          break;
        case 'hr':
        case 'موارد_بشرية':
          data = await this.gatherHRData();
          contextDescription = "بيانات الموارد البشرية";
          break;
        case 'financial':
        case 'مالي':
          data = await this.gatherFinancialData();
          contextDescription = "البيانات المالية والتكاليف";
          break;
        default:
          data = await storage.getDashboardStats();
          contextDescription = "البيانات العامة للنظام";
      }
      
      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت محلل بيانات متخصص. قم بتحليل ${contextDescription} وإنشاء تقرير شامل بتنسيق JSON يتضمن:
- تحليل الوضع الحالي
- المؤشرات الرئيسية
- التحديات والفرص
- توصيات عملية قابلة للتنفيذ`
          },
          {
            role: "user",
            content: `نوع التقرير: ${reportType}
البيانات: ${JSON.stringify(data, null, 2)}

قدم تحليلاً شاملاً ومتخصصاً.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(analysis.choices[0].message.content || '{}');
      
      return {
        title: result.title || `تقرير ${reportType} الذكي`,
        summary: result.summary || `تحليل شامل لـ ${contextDescription}`,
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        data
      };
    } catch (error) {
      console.error('Custom report error:', error);
      throw new Error(`فشل في توليد تقرير ${reportType}`);
    }
  }

  // جمع بيانات المخزون
  private static async gatherInventoryData(): Promise<any> {
    try {
      // محاكاة بيانات المخزون حتى يتم إضافة الوظائف
      const inventory: any[] = [];
      const locations: any[] = [];
      const movements: any[] = [];
      
      return {
        totalItems: inventory.length,
        totalLocations: locations.length,
        totalMovements: movements.length,
        lowStockItems: inventory.filter((item: any) => (item.current_stock || 0) < (item.min_stock || 10)).length
      };
    } catch (error) {
      return { error: 'فشل في جمع بيانات المخزون' };
    }
  }

  // جمع بيانات الموارد البشرية
  private static async gatherHRData(): Promise<any> {
    try {
      const users = await storage.getUsers();
      // محاكاة بيانات الموارد البشرية حتى يتم إضافة الوظائف
      const attendance: any[] = [];
      const training: any[] = [];
      
      return {
        totalEmployees: users.length,
        activeEmployees: users.filter(u => u.status === 'active').length,
        attendanceRecords: attendance.length,
        trainingRecords: training.length
      };
    } catch (error) {
      return { error: 'فشل في جمع بيانات الموارد البشرية' };
    }
  }

  // جمع البيانات المالية
  private static async gatherFinancialData(): Promise<any> {
    try {
      const orders = await storage.getOrders();
      const stats = await storage.getDashboardStats();
      
      return {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        deliveredOrders: orders.filter(o => o.status === 'delivered').length,
        productionRate: stats.productionRate,
        wastePercentage: stats.wastePercentage
      };
    } catch (error) {
      return { error: 'فشل في جمع البيانات المالية' };
    }
  }
}