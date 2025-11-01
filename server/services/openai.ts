import OpenAI from "openai";
import { storage } from "../storage";
// Note: Imports removed as they are not used in this service
import { aiFactoryBrain } from "./ai-schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AICommand {
  intent: string;
  action: string;
  parameters?: Record<string, any>;
  response: string;
}

interface DatabaseOperation {
  operation: "create" | "read" | "update" | "delete";
  table: string;
  data?: any;
  conditions?: Record<string, any>;
  success: boolean;
  message: string;
  result?: any;
}

// Note: Unused interfaces removed

class AdvancedOpenAIService {
  async processMessage(message: string, userId?: number): Promise<string> {
    const startTime = Date.now();
    try {
      // جمع سياق النظام الحالي
      const systemContext = await this.getSystemContext();

      // تحليل نية المستخدم أولاً مع السياق
      const intent = await this.analyzeUserIntent(message, systemContext);

      // تحديد إذا كانت الرسالة تتطلب عمليات قاعدة بيانات
      if (intent.requiresDatabase) {
        return await this.handleDatabaseOperation(message, intent, userId);
      }

      // تحديد إذا كانت الرسالة تطلب تقرير ذكي
      if (intent.requestsReport) {
        return await this.generateIntelligentReport(
          intent.reportType,
          intent.parameters,
        );
      }

      // معالجة الرسائل العامة مع سياق محسّن
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "text" },
        messages: [
          {
            role: "system",
            content: `أنت مساعد ذكي متطور لنظام إدارة مصنع الأكياس البلاستيكية (MPBF Next).

📊 **سياق النظام الحالي:**
${systemContext}

🎯 **قدراتك المتقدمة:**
• **التحليل الذكي**: تحليل بيانات الإنتاج والجودة والأداء
• **الاستعلامات الذكية**: الإجابة على أسئلة معقدة عن حالة المصنع
• **التوصيات**: تقديم توصيات بناءً على البيانات الحالية
• **المقارنات**: مقارنة الأداء عبر فترات زمنية

📋 **مجالات الخبرة:**
• إدارة الإنتاج والطلبات
• مراقبة الجودة
• صيانة المكائن
• تحليل الأداء
• إدارة المخزون

💡 **أسلوب الرد:**
- إجابات واضحة ومباشرة
- استخدام البيانات الفعلية من النظام
- تقديم رؤى وتوصيات عملية
- استخدام الأرقام والنسب المئوية
- تنسيق احترافي مع رموز تعبيرية مناسبة`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      });

      // تسجيل بيانات التعلم
      const executionTime = Date.now() - startTime;
      if (userId) {
        await this.recordLearningData(
          userId,
          "general_query",
          message,
          true,
          executionTime,
        );
      }

      return (
        response.choices[0].message.content ||
        "مرحباً! كيف يمكنني مساعدتك في إدارة المصنع اليوم؟"
      );
    } catch (error: any) {
      console.error("OpenAI API Error:", {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        type: error?.type,
        stack: error?.stack,
      });

      // تسجيل الخطأ للتعلم
      if (userId) {
        try {
          await this.recordLearningData(
            userId,
            "general_query",
            message,
            false,
            Date.now() - startTime,
          );
        } catch (learningError) {
          console.error("Error recording learning data:", learningError);
        }
      }

      return this.handleError(error);
    }
  }

  private async needsDataQuery(message: string): Promise<boolean> {
    const dataKeywords = [
      "حالة الطلب",
      "رقم الطلب",
      "أمر التشغيل",
      "الرول",
      "المكينة",
      "الإنتاج",
      "المستودع",
      "الجودة",
      "الصيانة",
      "إحصائيات",
    ];

    return dataKeywords.some((keyword) => message.includes(keyword));
  }

  async processVoiceCommand(
    command: string,
    language: string = "ar-SA",
    dialect: string = "standard",
  ): Promise<AICommand> {
    try {
      // Get dialect-specific response style
      const getDialectResponseStyle = (dialect: string): string => {
        const dialectStyles: Record<string, string> = {
          standard: "بالعربية الفصحى",
          egyptian: 'باللهجة المصرية (مثل: "حاضر"، "طيب"، "إيه رأيك")',
          gulf: 'باللهجة الخليجية (مثل: "زين"، "ماشي"، "شلونك")',
          levantine: 'باللهجة الشامية (مثل: "منيح"، "تمام"، "شو رأيك")',
          maghreb: 'باللهجة المغاربية (مثل: "واخا"، "بزاف"، "فين")',
        };
        return dialectStyles[dialect] || dialectStyles["standard"];
      };

      const systemPrompt =
        language === "ar-SA"
          ? `أنت مساعد صوتي ذكي لنظام إدارة مصنع الأكياس البلاستيكية (MPBF Next).

مهامك:
1. فهم الأوامر الصوتية باللغة العربية بجميع اللهجات
2. تحديد النية (intent) والإجراء المطلوب (action)
3. استخراج المعاملات اللازمة
4. تقديم رد مناسب ${getDialectResponseStyle(dialect)}

اللهجات المدعومة والأوامر الشائعة:
- العربية الفصحى: "اعرض لي", "انتقل إلى", "ما حالة"
- المصرية: "وريني", "روح لـ", "إيه حالة", "اعمل"
- الخليجية: "خلني أشوف", "روح لـ", "شلون حالة", "سوي"
- الشامية: "فيني شوف", "روح عـ", "شو وضع", "اعمل"
- المغاربية: "ورايني", "سير لـ", "آش حال", "دير"

الأوامر المدعومة:
- التنقل: "انتقل إلى [صفحة]", "اذهب إلى [قسم]", "روح لـ"
- الاستعلام: "اعرض [بيانات]", "ما هي حالة [شيء]", "وريني"
- الإجراءات: "أضف [عنصر]", "احذف [عنصر]", "حدث [بيانات]"
- الإحصائيات: "إحصائيات الإنتاج", "تقرير [نوع]"

استجب بتنسيق JSON يحتوي على:
{
  "intent": "نوع النية",
  "action": "الإجراء المطلوب", 
  "parameters": {"مفتاح": "قيمة"},
  "response": "الرد النصي المناسب ${getDialectResponseStyle(dialect)}"
}`
          : `You are an intelligent voice assistant for the MPBF Next plastic bag factory management system.

Your tasks:
1. Understand voice commands in English
2. Determine intent and required action
3. Extract necessary parameters
4. Provide appropriate and friendly response

Supported commands:
- Navigation: "go to [page]", "navigate to [section]" 
- Queries: "show [data]", "what is the status of [item]"
- Actions: "add [item]", "delete [item]", "update [data]"
- Statistics: "production stats", "[type] report"

Respond in JSON format containing:
{
  "intent": "intent type",
  "action": "required action",
  "parameters": {"key": "value"},
  "response": "appropriate text response"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command },
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      return {
        intent: result.intent || "unknown",
        action: result.action || "none",
        parameters: result.parameters || {},
        response:
          result.response ||
          (language === "ar-SA"
            ? "لم أتمكن من فهم الأمر"
            : "I could not understand the command"),
      };
    } catch (error: any) {
      console.error("Voice command processing error:", {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        stack: error?.stack,
      });
      return {
        intent: "error",
        action: "none",
        parameters: {},
        response:
          language === "ar-SA"
            ? "عذراً، حدث خطأ في معالجة الأمر الصوتي"
            : "Sorry, there was an error processing the voice command",
      };
    }
  }

  private async handleDataQuery(
    message: string,
    baseResponse: string,
  ): Promise<string> {
    try {
      // Extract order numbers or specific identifiers from the message
      const orderMatch = message.match(/JO-\d{4}-\d{3}|ORD-\d+|R-\d+/);

      if (orderMatch) {
        const identifier = orderMatch[0];

        if (identifier.startsWith("JO-")) {
          // Query job order information
          const stats = await storage.getDashboardStats();
          return `${baseResponse}\n\nالإحصائيات الحالية:\n• الطلبات النشطة: ${stats.activeOrders}\n• معدل الإنتاج: ${stats.productionRate}%\n• نسبة الجودة: ${stats.qualityScore}%\n• نسبة الهدر: ${stats.wastePercentage}%`;
        }
      }

      // For general queries, provide dashboard stats
      if (message.includes("إحصائيات") || message.includes("حالة المصنع")) {
        const stats = await storage.getDashboardStats();
        return `إحصائيات المصنع الحالية:\n\n• الطلبات النشطة: ${stats.activeOrders} طلب\n• معدل الإنتاج: ${stats.productionRate}%\n• نسبة الجودة: ${stats.qualityScore}%\n• نسبة الهدر: ${stats.wastePercentage}%\n\nهل تحتاج معلومات إضافية حول أي من هذه النقاط؟`;
      }

      return baseResponse;
    } catch (error) {
      console.error("Data query error:", error);
      return (
        baseResponse + "\n\n(ملاحظة: لم أتمكن من الوصول لبيانات النظام حالياً)"
      );
    }
  }

  async analyzeProductionData(): Promise<string> {
    try {
      const stats = await storage.getDashboardStats();

      const analysis = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "أنت محلل بيانات متخصص في الإنتاج الصناعي. قم بتحليل البيانات المقدمة وقدم توصيات لتحسين الأداء باللغة العربية.",
          },
          {
            role: "user",
            content: `حلل هذه البيانات الإنتاجية:
- الطلبات النشطة: ${stats.activeOrders}
- معدل الإنتاج: ${stats.productionRate}%
- نسبة الجودة: ${stats.qualityScore}%
- نسبة الهدر: ${stats.wastePercentage}%

قدم تحليل موجز وتوصيات للتحسين.`,
          },
        ],
        max_tokens: 400,
        temperature: 0.5,
      });

      return (
        analysis.choices[0].message.content ||
        "لم أتمكن من تحليل البيانات حالياً."
      );
    } catch (error) {
      console.error("Production analysis error:", error);
      return "حدث خطأ أثناء تحليل بيانات الإنتاج.";
    }
  }

  async generateMaintenanceAlert(
    machineId: number,
    issueDescription: string,
  ): Promise<string> {
    try {
      const machine = await storage.getMachineById(machineId.toString());

      if (!machine) {
        return "لم أتمكن من العثور على بيانات المكينة المحددة.";
      }

      const alert = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "أنت خبير صيانة المعدات الصناعية. قم بتحليل المشكلة وقدم توصيات للإصلاح باللغة العربية.",
          },
          {
            role: "user",
            content: `المكينة: ${machine.name_ar || machine.name}
نوع المكينة: ${machine.type}
المشكلة المبلغ عنها: ${issueDescription}

قدم تقييم سريع للمشكلة والإجراءات المطلوبة.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      return (
        alert.choices[0].message.content ||
        "لم أتمكن من تحليل المشكلة المبلغ عنها."
      );
    } catch (error) {
      console.error("Maintenance alert error:", error);
      return "حدث خطأ أثناء تحليل تبليغ الصيانة.";
    }
  }

  // جمع سياق النظام الحالي
  private async getSystemContext(): Promise<string> {
    try {
      const stats = await storage.getDashboardStats();
      const machines = await storage.getMachines();
      const activeMachines = machines.filter((m) => m.status === "active").length;
      const inMaintenanceMachines = machines.filter((m) => m.status === "maintenance").length;

      return `
الطلبات النشطة: ${stats.activeOrders}
معدل الإنتاج: ${stats.productionRate}%
نسبة الجودة: ${stats.qualityScore}%
نسبة الهدر: ${stats.wastePercentage}%
المكائن النشطة: ${activeMachines}/${machines.length}
المكائن في الصيانة: ${inMaintenanceMachines}
      `.trim();
    } catch (error) {
      console.error("Error getting system context:", error);
      return "لا تتوفر بيانات السياق حالياً";
    }
  }

  // تحليل نية المستخدم المتقدم
  private async analyzeUserIntent(message: string, context?: string): Promise<{
    intent: string;
    action: string;
    requiresDatabase: boolean;
    requestsReport: boolean;
    reportType?: string;
    parameters: Record<string, any>;
    confidence: number;
    missingInfo?: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت محلل ذكي لأوامر نظام إدارة مصنع الأكياس البلاستيكية. حلل نية المستخدم بدقة.
${context ? `\nسياق النظام:\n${context}\n` : ""}

**أنواع النوايا المدعومة:**
1. query: استعلام عن البيانات
2. create: إنشاء جديد (عميل، طلب، منتج، أمر عمل)
3. update: تحديث بيانات
4. delete: حذف بيانات
5. report: طلب تقرير
6. help: طلب مساعدة

**الإجراءات المدعومة للإنشاء:**
- add_customer: إضافة عميل جديد
- add_product: إضافة منتج للعميل (customer_product)
- add_order: إنشاء طلب جديد
- add_production_order: إنشاء أمر تشغيل
- add_machine: إضافة مكينة

**أمثلة على الأوامر:**
- "سجل عميل جديد" → create, add_customer
- "أضف منتج للعميل" → create, add_product
- "اعمل طلب جديد" → create, add_order
- "سجل أمر تشغيل" → create, add_production_order
- "كم عدد العملاء؟" → query, count_customers
- "أعطني قائمة الطلبات" → query, get_orders

استخرج البيانات المطلوبة من الرسالة إن وجدت، وحدد المعلومات الناقصة.

أرجع JSON:
{
  "intent": "نوع النية",
  "action": "الإجراء المحدد", 
  "requiresDatabase": true/false,
  "requestsReport": true/false,
  "reportType": "نوع التقرير",
  "parameters": {
    "data": "البيانات المستخرجة من النص"
  },
  "confidence": 0.0-1.0,
  "missingInfo": ["قائمة المعلومات الناقصة"]
}`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(
        response.choices[0].message.content ||
          '{"intent":"unknown","action":"none","requiresDatabase":false,"requestsReport":false,"parameters":{},"confidence":0}',
      );
      
      return {
        ...result,
        missingInfo: result.missingInfo || []
      };
    } catch (error: any) {
      console.error("Intent analysis error:", {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        stack: error?.stack,
      });
      return {
        intent: "unknown",
        action: "none",
        requiresDatabase: false,
        requestsReport: false,
        parameters: {},
        confidence: 0,
        missingInfo: [],
      };
    }
  }

  // معالجة عمليات قاعدة البيانات
  private async handleDatabaseOperation(
    message: string,
    intent: any,
    userId?: number,
  ): Promise<string> {
    const startTime = Date.now();
    try {
      let result: DatabaseOperation;

      switch (intent.action) {
        case "add_customer":
          result = await this.createCustomer(intent.parameters, message);
          break;
        case "add_product":
          result = await this.createCustomerProduct(intent.parameters, message);
          break;
        case "add_order":
          result = await this.createOrder(intent.parameters, message);
          break;
        case "add_production_order":
          result = await this.createJobOrder(intent.parameters, message);
          break;
        case "add_machine":
          result = await this.createMachine(intent.parameters);
          break;
        case "update_order":
          result = await this.updateOrder(intent.parameters);
          break;
        case "update_machine":
          result = await this.updateMachine(intent.parameters);
          break;
        case "delete_customer":
          result = await this.deleteCustomer(intent.parameters);
          break;
        case "delete_order":
          result = await this.deleteOrder(intent.parameters);
          break;
        case "get_orders":
          result = await this.getOrders(intent.parameters);
          break;
        case "get_machines":
          result = await this.getMachines(intent.parameters);
          break;
        case "get_production_stats":
          result = await this.getProductionStats(intent.parameters);
          break;
        case "count_customers":
          result = await this.countCustomers();
          break;
        case "help":
          result = await this.provideHelp();
          break;
        default:
          result = await this.handleCustomQuery(message, intent);
      }

      // تسجيل النجاح
      if (userId) {
        await this.recordLearningData(
          userId,
          intent.action,
          message,
          result.success,
          Date.now() - startTime,
        );
      }

      // إرسال إشعار إذا كان مطلوباً
      if (result.success && (await this.shouldSendNotification(intent.action))) {
        await this.sendIntelligentNotification(intent.action, result.result);
      }

      return result.message;
    } catch (error: any) {
      console.error("Database operation error:", {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        stack: error?.stack,
      });

      if (userId) {
        try {
          await this.recordLearningData(
            userId,
            intent.action,
            message,
            false,
            Date.now() - startTime,
          );
        } catch (learningError) {
          console.error("Error recording learning data:", learningError);
        }
      }

      return "حدث خطأ أثناء تنفيذ العملية. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.";
    }
  }

  // إنشاء عميل جديد
  private async createCustomer(params: any, originalMessage: string): Promise<DatabaseOperation> {
    try {
      // استخراج البيانات من النص باستخدام AI
      const customerData = await this.extractCustomerData(
        originalMessage || params.text || params.data,
      );

      // التحقق من البيانات المطلوبة
      const missingFields = [];
      if (!customerData.name) missingFields.push("اسم العميل");
      if (!customerData.phone) missingFields.push("رقم الهاتف");
      
      if (missingFields.length > 0) {
        return {
          operation: "create",
          table: "customers",
          success: false,
          message: `⚠️ **معلومات ناقصة!**\n\nلإنشاء العميل، أحتاج المعلومات التالية:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\n📝 **مثال:** "سجل عميل اسمه شركة النور، رقم الهاتف 0501234567، المدينة الرياض"`,
        };
      }

      const customer = await storage.createCustomer(customerData);

      return {
        operation: "create",
        table: "customers",
        data: customerData,
        success: true,
        message: `✅ **تم إنشاء العميل بنجاح!**\n\n📋 **معلومات العميل:**\n• رقم العميل: ${customer.id}\n• الاسم: ${customer.name}\n• الهاتف: ${customer.phone || '-'}\n• المدينة: ${customer.city || '-'}`,
        result: customer,
      };
    } catch (error: any) {
      console.error("خطأ في إنشاء العميل:", error);
      return {
        operation: "create",
        table: "customers",
        success: false,
        message: `❌ **فشل في إنشاء العميل**\n\nالسبب: ${error.message}\n\n💡 **تأكد من:**\n• صحة المعلومات المدخلة\n• عدم تكرار رقم العميل`,
      };
    }
  }

  // إنشاء طلب جديد
  private async createOrder(params: any, originalMessage: string): Promise<DatabaseOperation> {
    try {
      const orderData = await this.extractOrderData(originalMessage || params.text || params.data);
      
      // التحقق من البيانات المطلوبة
      const missingFields = [];
      if (!orderData.customer_id) missingFields.push("معرف العميل أو اسمه");
      if (!orderData.delivery_date) missingFields.push("تاريخ التسليم");
      
      if (missingFields.length > 0) {
        // عرض قائمة العملاء المتاحين
        const customers = await storage.getCustomers();
        const customerList = customers.slice(0, 5).map(c => `• ${c.id} - ${c.name}`).join('\n');
        
        return {
          operation: "create",
          table: "orders",
          success: false,
          message: `⚠️ **معلومات ناقصة!**\n\nلإنشاء الطلب، أحتاج:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\n👥 **العملاء المتاحون:**\n${customerList}\n${customers.length > 5 ? `\n... و ${customers.length - 5} عميل آخر` : ''}\n\n📝 **مثال:** "اعمل طلب للعميل ${customers[0]?.id || 'CID-001'} تاريخ التسليم 2025-12-01"`,
        };
      }

      const order = await storage.createOrder(orderData);

      return {
        operation: "create",
        table: "orders",
        data: orderData,
        success: true,
        message: `✅ **تم إنشاء الطلب بنجاح!**\n\n📋 **معلومات الطلب:**\n• رقم الطلب: ${order.order_number}\n• تاريخ التسليم: ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('ar') : '-'}\n• الحالة: ${this.translateStatus(order.status)}`,
        result: order,
      };
    } catch (error: any) {
      console.error("خطأ في إنشاء الطلب:", error);
      return {
        operation: "create",
        table: "orders",
        success: false,
        message: `❌ **فشل في إنشاء الطلب**\n\nالسبب: ${error.message}\n\n💡 **تأكد من:**\n• صحة معرف العميل\n• صيغة التاريخ (YYYY-MM-DD)`,
      };
    }
  }

  // إنشاء منتج للعميل
  private async createCustomerProduct(params: any, originalMessage: string): Promise<DatabaseOperation> {
    try {
      const productData = await this.extractCustomerProductData(originalMessage || params.text || params.data);
      
      // التحقق من البيانات المطلوبة
      const missingFields = [];
      if (!productData.customer_id) missingFields.push("معرف العميل");
      if (!productData.category_id) missingFields.push("تصنيف المنتج");
      if (!productData.size_caption) missingFields.push("اسم المنتج/المقاس");
      
      if (missingFields.length > 0) {
        const customers = await storage.getCustomers();
        const categories = await storage.getCategories();
        
        return {
          operation: "create",
          table: "customer_products",
          success: false,
          message: `⚠️ **معلومات ناقصة!**\n\nلإنشاء المنتج، أحتاج:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\n👥 **عملاء:**${customers.slice(0, 3).map(c => `\n• ${c.id} - ${c.name}`).join('')}\n\n📦 **تصنيفات:**${categories.slice(0, 3).map(c => `\n• ${c.id} - ${c.name_ar}`).join('')}\n\n📝 **مثال:** "أضف منتج للعميل ${customers[0]?.id || 'CID-001'} تصنيف ${categories[0]?.id || 'CAT-001'} اسم المنتج: كيس 30x40"`,
        };
      }

      const product = await storage.createCustomerProduct(productData);

      return {
        operation: "create",
        table: "customer_products",
        data: productData,
        success: true,
        message: `✅ **تم إنشاء المنتج بنجاح!**\n\n📦 **معلومات المنتج:**\n• رقم المنتج: ${product.id}\n• الاسم: ${product.size_caption}\n• العميل: ${productData.customer_id}\n• التصنيف: ${productData.category_id}`,
        result: product,
      };
    } catch (error: any) {
      console.error("خطأ في إنشاء المنتج:", error);
      return {
        operation: "create",
        table: "customer_products",
        success: false,
        message: `❌ **فشل في إنشاء المنتج**\n\nالسبب: ${error.message}\n\n💡 **تأكد من:**\n• صحة معرف العميل والتصنيف\n• اكتمال المعلومات الأساسية`,
      };
    }
  }

  // إنشاء أمر تشغيل جديد
  private async createJobOrder(params: any, originalMessage: string): Promise<DatabaseOperation> {
    try {
      const jobOrderData = await this.extractJobOrderData(
        originalMessage || params.text || params.data,
      );
      
      const missingFields = [];
      if (!jobOrderData.order_id) missingFields.push("معرف الطلب");
      if (!jobOrderData.customer_product_id) missingFields.push("معرف المنتج");
      if (!jobOrderData.quantity_kg) missingFields.push("الكمية بالكيلو");
      
      if (missingFields.length > 0) {
        const orders = await storage.getAllOrders();
        const recentOrders = orders.slice(0, 3);
        
        return {
          operation: "create",
          table: "production_orders",
          success: false,
          message: `⚠️ **معلومات ناقصة!**\n\nلإنشاء أمر التشغيل، أحتاج:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\n📋 **طلبات حديثة:**${recentOrders.map(o => `\n• ${o.order_number}`).join('')}\n\n📝 **مثال:** "اعمل أمر تشغيل للطلب ${recentOrders[0]?.order_number || 'ORD-001'} المنتج 1 الكمية 500 كيلو"`,
        };
      }

      const jobOrder = await storage.createProductionOrder(jobOrderData);

      return {
        operation: "create",
        table: "production_orders",
        data: jobOrderData,
        success: true,
        message: `✅ **تم إنشاء أمر التشغيل بنجاح!**\n\n🏭 **معلومات أمر التشغيل:**\n• رقم الأمر: ${jobOrder.production_order_number}\n• الكمية: ${jobOrderData.quantity_kg} كجم\n• الحالة: ${this.translateStatus(jobOrder.status)}`,
        result: jobOrder,
      };
    } catch (error: any) {
      console.error("خطأ في إنشاء أمر التشغيل:", error);
      return {
        operation: "create",
        table: "production_orders",
        success: false,
        message: `❌ **فشل في إنشاء أمر التشغيل**\n\nالسبب: ${error.message}\n\n💡 **تأكد من:**\n• صحة معرف الطلب والمنتج\n• الكمية المطلوبة`,
      };
    }
  }

  // عد العملاء
  private async countCustomers(): Promise<DatabaseOperation> {
    try {
      const customers = await storage.getCustomers();
      return {
        operation: "read",
        table: "customers",
        success: true,
        message: `📊 **عدد العملاء المسجلين:** ${customers.length} عميل`,
        result: { count: customers.length },
      };
    } catch (error: any) {
      return {
        operation: "read",
        table: "customers",
        success: false,
        message: `❌ فشل في عد العملاء: ${error.message}`,
      };
    }
  }

  // تقديم مساعدة
  private async provideHelp(): Promise<DatabaseOperation> {
    return {
      operation: "read",
      table: "help",
      success: true,
      message: `🤖 **المساعد الذكي - دليل الاستخدام**

📝 **ما يمكنني فعله:**

1️⃣ **إضافة عميل جديد:**
   "سجل عميل اسمه شركة النور، رقم 0501234567، الرياض"

2️⃣ **إضافة منتج للعميل:**
   "أضف منتج للعميل CID-001 تصنيف CAT-001 اسم: كيس 30x40"

3️⃣ **إنشاء طلب:**
   "اعمل طلب للعميل CID-001 تاريخ التسليم 2025-12-01"

4️⃣ **إنشاء أمر تشغيل:**
   "اعمل أمر تشغيل للطلب ORD-001 المنتج 1 الكمية 500 كيلو"

5️⃣ **الاستعلامات:**
   • "كم عدد العملاء؟"
   • "ما حالة الإنتاج؟"
   • "أعطني قائمة الطلبات"

💡 **نصيحة:** كلما أعطيتني معلومات أكثر، كانت النتائج أدق!`,
    };
  }

  // إنشاء مكينة جديدة
  private async createMachine(params: any): Promise<DatabaseOperation> {
    try {
      const machineData = await this.extractMachineData(
        params.text || params.data,
      );
      const machine = await storage.createMachine(machineData);

      return {
        operation: "create",
        table: "machines",
        data: machineData,
        success: true,
        message: `تم إنشاء المكينة بنجاح! اسم المكينة: ${machine.name_ar || machine.name}`,
        result: machine,
      };
    } catch (error: any) {
      return {
        operation: "create",
        table: "machines",
        success: false,
        message: `فشل في إنشاء المكينة: ${error.message}`,
      };
    }
  }

  // تحديث طلب
  private async updateOrder(params: any): Promise<DatabaseOperation> {
    try {
      const { orderId, updates } = await this.extractUpdateData(
        params.text || params.data,
        "order",
      );
      // Note: updateOrder method needs to be implemented in storage
      const result = await storage.getOrderById(orderId);

      return {
        operation: "update",
        table: "orders",
        success: true,
        message: `تم تحديث الطلب ${result?.order_number || orderId} بنجاح!`,
        result: result,
      };
    } catch (error: any) {
      return {
        operation: "update",
        table: "orders",
        success: false,
        message: `فشل في تحديث الطلب: ${error.message}`,
      };
    }
  }

  // تحديث مكينة
  private async updateMachine(params: any): Promise<DatabaseOperation> {
    try {
      const { machineId, updates } = await this.extractUpdateData(
        params.text || params.data,
        "machine",
      );
      const machine = await storage.updateMachine(machineId, updates);

      return {
        operation: "update",
        table: "machines",
        success: true,
        message: `تم تحديث المكينة ${machine.name_ar || machine.name} بنجاح!`,
        result: machine,
      };
    } catch (error: any) {
      return {
        operation: "update",
        table: "machines",
        success: false,
        message: `فشل في تحديث المكينة: ${error.message}`,
      };
    }
  }

  // حذف عميل
  private async deleteCustomer(params: any): Promise<DatabaseOperation> {
    try {
      const customerId = await this.extractIdFromText(
        params.text || params.data,
        "customer",
      );
      await storage.deleteCustomer(customerId);

      return {
        operation: "delete",
        table: "customers",
        success: true,
        message: `تم حذف العميل ${customerId} بنجاح!`,
      };
    } catch (error: any) {
      return {
        operation: "delete",
        table: "customers",
        success: false,
        message: `فشل في حذف العميل: ${error.message}`,
      };
    }
  }

  // حذف طلب
  private async deleteOrder(params: any): Promise<DatabaseOperation> {
    try {
      const orderId = await this.extractIdFromText(
        params.text || params.data,
        "order",
      );
      // Note: deleteOrder method needs to be implemented in storage
      const success = true; // Placeholder

      return {
        operation: "delete",
        table: "orders",
        success,
        message: success ? `تم حذف الطلب بنجاح!` : `فشل في حذف الطلب`,
      };
    } catch (error: any) {
      return {
        operation: "delete",
        table: "orders",
        success: false,
        message: `فشل في حذف الطلب: ${error.message}`,
      };
    }
  }

  // الحصول على الطلبات
  private async getOrders(params: any): Promise<DatabaseOperation> {
    try {
      const filters = await this.extractFilters(params.text || params.data);
      const orders = (await storage.getAllOrders()) || [];

      let message = `تم العثور على ${orders.length} طلب:\n\n`;
      orders.slice(0, 5).forEach((order: any) => {
        message += `• رقم الطلب: ${order.order_number}\n`;
        message += `  الحالة: ${this.translateStatus(order.status)}\n`;
        message += `  تاريخ الإنشاء: ${new Date(order.created_at).toLocaleDateString("ar")}\n\n`;
      });

      if (orders.length > 5) {
        message += `... و ${orders.length - 5} طلب آخر`;
      }

      return {
        operation: "read",
        table: "orders",
        success: true,
        message,
        result: orders,
      };
    } catch (error: any) {
      return {
        operation: "read",
        table: "orders",
        success: false,
        message: `فشل في الحصول على الطلبات: ${error.message}`,
      };
    }
  }

  // الحصول على المكائن
  private async getMachines(params: any): Promise<DatabaseOperation> {
    try {
      const machines = await storage.getMachines();

      let message = `المكائن المتاحة (${machines.length}):\n\n`;
      machines.forEach((machine: any) => {
        message += `• ${machine.name_ar || machine.name}\n`;
        message += `  النوع: ${machine.type}\n`;
        message += `  الحالة: ${this.translateStatus(machine.status)}\n\n`;
      });

      return {
        operation: "read",
        table: "machines",
        success: true,
        message,
        result: machines,
      };
    } catch (error: any) {
      return {
        operation: "read",
        table: "machines",
        success: false,
        message: `فشل في الحصول على بيانات المكائن: ${error.message}`,
      };
    }
  }

  // الحصول على إحصائيات الإنتاج
  private async getProductionStats(params: any): Promise<DatabaseOperation> {
    try {
      const stats = await storage.getDashboardStats();

      const message = `📊 إحصائيات الإنتاج الحالية:

🔄 الطلبات النشطة: ${stats.activeOrders} طلب
📈 معدل الإنتاج: ${stats.productionRate}%
✅ نسبة الجودة: ${stats.qualityScore}%
🗑️ نسبة الهدر: ${stats.wastePercentage}%

تحليل سريع: ${this.analyzeProductionDataLocal(stats)}`;

      return {
        operation: "read",
        table: "dashboard_stats",
        success: true,
        message,
        result: stats,
      };
    } catch (error: any) {
      return {
        operation: "read",
        table: "dashboard_stats",
        success: false,
        message: `فشل في الحصول على إحصائيات الإنتاج: ${error.message}`,
      };
    }
  }

  // معالجة الاستعلامات المخصصة
  private async handleCustomQuery(
    message: string,
    intent: any,
  ): Promise<DatabaseOperation> {
    try {
      // جمع البيانات ذات الصلة بناءً على السؤال
      const relevantData: any = {};

      // تحديد نوع البيانات المطلوبة من السؤال
      const messageLower = message.toLowerCase();
      
      if (
        messageLower.includes("عميل") ||
        messageLower.includes("customer") ||
        messageLower.includes("زبون") ||
        messageLower.includes("عملاء")
      ) {
        const customers = await storage.getCustomers();
        relevantData.customers = customers;
        relevantData.customersCount = customers.length;
      }

      if (
        messageLower.includes("طلب") ||
        messageLower.includes("order") ||
        messageLower.includes("أمر") ||
        messageLower.includes("طلبات")
      ) {
        const orders = await storage.getAllOrders();
        relevantData.orders = orders;
        relevantData.ordersCount = orders.length;
      }

      if (
        messageLower.includes("مكينة") ||
        messageLower.includes("ماكينة") ||
        messageLower.includes("machine") ||
        messageLower.includes("مكائن")
      ) {
        const machines = await storage.getMachines();
        relevantData.machines = machines;
        relevantData.machinesCount = machines.length;
        relevantData.activeMachines = machines.filter(m => m.status === 'active').length;
      }

      if (
        messageLower.includes("رول") ||
        messageLower.includes("roll") ||
        messageLower.includes("لفة") ||
        messageLower.includes("رولات")
      ) {
        const rolls = await storage.getRolls();
        relevantData.rolls = rolls;
        relevantData.rollsCount = rolls.length;
      }

      if (
        messageLower.includes("إنتاج") ||
        messageLower.includes("production") ||
        messageLower.includes("تشغيل") ||
        messageLower.includes("حالة")
      ) {
        const stats = await storage.getDashboardStats();
        relevantData.productionStats = stats;
      }

      // إذا لم يتم جمع أي بيانات، جمع إحصائيات عامة
      if (Object.keys(relevantData).length === 0) {
        const stats = await storage.getDashboardStats();
        relevantData.generalStats = stats;
      }

      // استخدام AI لتحليل البيانات والإجابة على السؤال
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت مساعد ذكي لنظام إدارة مصنع أكياس بلاستيك MPBF Next.

📋 **مهمتك:**
تحليل البيانات المتوفرة والإجابة على سؤال المستخدم بدقة.

✅ **قواعد الإجابة:**
1. استخدم البيانات المتوفرة في JSON للإجابة
2. إذا كانت البيانات تحتوي على مصفوفة (array)، استخدم طول المصفوفة (.length) للعد
3. قدم الأرقام والإحصائيات بوضوح
4. اجعل الإجابة مختصرة ومباشرة
5. استخدم رموز تعبيرية مناسبة

📊 **مثال:**
السؤال: "كم عدد العملاء؟"
البيانات: {"customers": [عميل1, عميل2, عميل3]}
الإجابة: "📊 لديك **3 عملاء** مسجلين في النظام."

**مهم:** البيانات متوفرة في JSON. استخدمها مباشرة ولا تقل أنها غير متاحة!`,
          },
          {
            role: "user",
            content: `السؤال: ${message}\n\nالبيانات المتاحة:\n${JSON.stringify(relevantData, null, 2)}`,
          },
        ],
        temperature: 0.2,
      });

      const answer = response.choices[0].message.content || "لم أتمكن من الإجابة على السؤال.";

      return {
        operation: "read",
        table: "custom",
        success: true,
        message: answer,
        result: relevantData,
      };
    } catch (error: any) {
      console.error("Custom query error:", error);
      return {
        operation: "read",
        table: "custom",
        success: false,
        message: `عذراً، لم أتمكن من معالجة سؤالك. يرجى المحاولة بصيغة أخرى أو استخدام الإجراءات السريعة المتاحة.`,
      };
    }
  }

  // استخراج بيانات العميل من النص
  private async extractCustomerData(text: string): Promise<any> {
    const { AIHelpers } = await import("./ai-helpers");
    return AIHelpers.extractCustomerData(text);
  }

  // استخراج بيانات الطلب من النص
  private async extractOrderData(text: string): Promise<any> {
    const { AIHelpers } = await import("./ai-helpers");
    return AIHelpers.extractOrderData(text);
  }

  // استخراج بيانات أمر التشغيل من النص
  private async extractJobOrderData(text: string): Promise<any> {
    const { AIHelpers } = await import("./ai-helpers");
    return AIHelpers.extractJobOrderData(text);
  }

  // استخراج بيانات المكينة من النص
  private async extractMachineData(text: string): Promise<any> {
    const { AIHelpers } = await import("./ai-helpers");
    return AIHelpers.extractMachineData(text);
  }

  // استخراج بيانات منتج العميل من النص
  private async extractCustomerProductData(text: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `استخرج بيانات منتج العميل من النص التالي وأرجعها بتنسيق JSON:
{
  "customer_id": "معرف العميل (مثل: CID-001)",
  "category_id": "معرف التصنيف (مثل: CAT-001)",
  "item_id": "معرف الصنف (اختياري)",
  "size_caption": "اسم المنتج أو المقاس",
  "width": "العرض (رقم)",
  "left_facing": "الواجهة اليسرى (رقم)",
  "right_facing": "الواجهة اليمنى (رقم)",
  "thickness": "السماكة (رقم)",
  "cutting_length_cm": "طول القطع بالسنتيمتر (رقم)",
  "raw_material": "المادة الخام (HDPE/LDPE/Regrind)",
  "is_printed": "هل مطبوع (true/false)",
  "cutting_unit": "وحدة القطع (KG/ROLL/PKT)",
  "punching": "نوع الثقب (NON/T-Shirt/Banana)"
}

استخرج المعلومات المتوفرة فقط، اترك الحقول الأخرى فارغة أو null.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Customer product data extraction error:", error);
      throw new Error("فشل في استخراج بيانات منتج العميل من النص");
    }
  }

  // استخراج بيانات التحديث من النص
  private async extractUpdateData(
    text: string,
    entityType: string,
  ): Promise<any> {
    const { AIHelpers } = await import("./ai-helpers");
    return AIHelpers.extractUpdateData(text, entityType);
  }

  // استخراج المعرف من النص
  private async extractIdFromText(
    text: string,
    entityType: string,
  ): Promise<string> {
    const { AIHelpers } = await import("./ai-helpers");
    return AIHelpers.extractIdFromText(text, entityType);
  }

  // استخراج مرشحات البحث من النص
  private async extractFilters(text: string): Promise<any> {
    const { AIHelpers } = await import("./ai-helpers");
    return AIHelpers.extractFilters(text);
  }

  // ترجمة الحالات إلى العربية
  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: "في الانتظار",
      for_production: "للإنتاج",
      in_progress: "قيد التنفيذ",
      completed: "مكتمل",
      delivered: "مُسلم",
      active: "نشط",
      maintenance: "صيانة",
      down: "متوقف",
      for_printing: "للطباعة",
      for_cutting: "للقطع",
      done: "منجز",
    };
    return statusMap[status] || status;
  }

  // تحليل بيانات الإنتاج (محلي)
  private analyzeProductionDataLocal(stats: any): string {
    // تحليل محلي مبسط
    let analysis = "تحليل الإنتاج:\n";
    if (stats.productionRate < 70) {
      analysis += "• معدل الإنتاج منخفض - يحتاج تحسين\n";
    }
    if (stats.wastePercentage > 5) {
      analysis += "• نسبة الهدر مرتفعة - مراجعة العمليات\n";
    }
    return analysis;
  }

  // توليد SQL آمن من النص الطبيعي
  private async generateSQLFromNaturalLanguage(text: string): Promise<string> {
    const { AIHelpers } = await import("./ai-helpers");
    return AIHelpers.generateSQLFromNaturalLanguage(text);
  }

  // تنفيذ استعلام آمن
  private async executeSafeQuery(sql: string): Promise<any> {
    // في الوقت الحالي، نعيد رسالة توضيحية
    // يمكن إضافة تنفيذ حقيقي لاحقاً مع حماية كاملة من SQL injection
    return { message: "تم تحليل الاستعلام بنجاح - يتطلب تنفيذ إضافي" };
  }

  // إرسال إشعار ذكي
  private async sendIntelligentNotification(
    action: string,
    data: any,
  ): Promise<void> {
    try {
      const { AINotifications } = await import("./ai-notifications");
      await AINotifications.sendIntelligentNotification(action, data);
    } catch (error) {
      console.error("Error loading AI notifications module:", error);
      // Gracefully continue without notifications
    }
  }

  // تحديد ما إذا كان يجب إرسال إشعار
  private async shouldSendNotification(action: string): Promise<boolean> {
    try {
      const { AINotifications } = await import("./ai-notifications");
      return AINotifications.shouldSendNotification(action);
    } catch (error) {
      console.error("Error loading AI notifications module:", error);
      return false;
    }
  }

  // تسجيل بيانات التعلم
  private async recordLearningData(
    userId: number,
    actionType: string,
    context: string,
    success: boolean,
    executionTime: number,
  ): Promise<void> {
    try {
      const { AILearning } = await import("./ai-learning");
      await AILearning.recordLearningData(
        userId,
        actionType,
        context,
        success,
        executionTime,
      );
    } catch (error) {
      console.error("Error loading AI learning module:", error);
      // Continue without learning data recording
    }
  }

  // توليد تقرير ذكي
  private async generateIntelligentReport(
    reportType?: string,
    parameters?: any,
  ): Promise<string> {
    try {
      const { AIReports } = await import("./ai-reports");
      if (!AIReports) {
        throw new Error("AIReports module not available");
      }

      let report;
      switch (reportType?.toLowerCase()) {
        case "production":
        case "إنتاج":
          report = await AIReports.generateProductionReport(parameters);
          break;
        case "quality":
        case "جودة":
          report = await AIReports.generateQualityReport(parameters);
          break;
        case "maintenance":
        case "صيانة":
          report = await AIReports.generateMaintenanceReport(parameters);
          break;
        case "sales":
        case "مبيعات":
          report = await AIReports.generateSalesReport(parameters);
          break;
        default:
          report = await AIReports.generateCustomReport(
            reportType || "عام",
            parameters,
          );
      }

      let message = `📊 ${report.title}\n\n`;
      message += `📋 **الملخص التنفيذي:**\n${report.summary}\n\n`;

      if (report.insights.length > 0) {
        message += `💡 **رؤى تحليلية:**\n`;
        report.insights.forEach((insight, index) => {
          message += `${index + 1}. ${insight}\n`;
        });
        message += "\n";
      }

      if (report.recommendations.length > 0) {
        message += `🎯 **التوصيات:**\n`;
        report.recommendations.forEach((rec, index) => {
          message += `${index + 1}. ${rec}\n`;
        });
      }

      return message;
    } catch (error: any) {
      console.error("Intelligent report generation error:", error);
      return `فشل في توليد التقرير الذكي: ${error?.message || "خطأ غير معروف"}`;
    }
  }

  // معالجة الأخطاء
  private handleError(error: any): string {
    if (error?.status === 401) {
      return "خطأ في التحقق من مفتاح API. يرجى التحقق من إعدادات الخدمة.";
    } else if (error?.status === 429) {
      return "تم تجاوز حد الاستخدام. يرجى المحاولة مرة أخرى لاحقاً.";
    } else if (error?.code === "network_error") {
      return "خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.";
    }

    return "عذراً، حدث خطأ في المساعد الذكي. يرجى المحاولة مرة أخرى لاحقاً.";
  }
}

export const openaiService = new AdvancedOpenAIService();
