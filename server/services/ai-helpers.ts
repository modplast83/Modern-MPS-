import OpenAI from "openai";
import { generateCustomerId, generateOrderNumber, generateJobOrderNumber } from "@shared/id-generator";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export class AIHelpers {
  // استخراج بيانات العميل من النص
  static async extractCustomerData(text: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `استخرج بيانات العميل من النص التالي وأرجعها بتنسيق JSON:
{
  "id": "معرف العميل (اختياري)",
  "name": "اسم العميل",
  "name_ar": "الاسم بالعربية",
  "code": "رمز العميل (اختياري)",
  "city": "المدينة",
  "address": "العنوان",
  "phone": "رقم الهاتف",
  "tax_number": "الرقم الضريبي (اختياري)"
}

إذا لم تجد معلومة محددة، اتركها فارغة أو null.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // إنشاء ID تلقائي إذا لم يكن موجوداً
      if (!result.id) {
        result.id = generateCustomerId();
      }
      
      return result;
    } catch (error) {
      console.error('Customer data extraction error:', error);
      throw new Error('فشل في استخراج بيانات العميل من النص');
    }
  }

  // استخراج بيانات الطلب من النص
  static async extractOrderData(text: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `استخرج بيانات الطلب من النص التالي وأرجعها بتنسيق JSON:
{
  "order_number": "رقم الطلب (اختياري - سيتم إنشاؤه تلقائياً)",
  "customer_id": "معرف العميل",
  "delivery_date": "تاريخ التسليم (YYYY-MM-DD)",
  "notes": "ملاحظات الطلب",
  "status": "حالة الطلب - pending/for_production/completed/delivered"
}

إذا لم تجد معلومة محددة، استخدم قيماً افتراضية مناسبة.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // إنشاء رقم طلب تلقائي
      if (!result.order_number) {
        result.order_number = generateOrderNumber();
      }
      
      // حالة افتراضية
      if (!result.status) {
        result.status = 'pending';
      }
      
      return result;
    } catch (error) {
      console.error('Order data extraction error:', error);
      throw new Error('فشل في استخراج بيانات الطلب من النص');
    }
  }

  // استخراج بيانات أمر التشغيل من النص
  static async extractJobOrderData(text: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `استخرج بيانات أمر التشغيل من النص التالي وأرجعها بتنسيق JSON:
{
  "job_number": "رقم أمر التشغيل (اختياري)",
  "order_id": "معرف الطلب",
  "customer_product_id": "معرف منتج العميل",
  "quantity_required": "الكمية المطلوبة",
  "status": "حالة أمر التشغيل - pending/in_progress/completed"
}

استخرج الأرقام والمعرفات بدقة.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // إنشاء رقم أمر تشغيل تلقائي
      if (!result.job_number) {
        result.job_number = generateJobOrderNumber();
      }
      
      // حالة افتراضية
      if (!result.status) {
        result.status = 'pending';
      }
      
      return result;
    } catch (error) {
      console.error('Job order data extraction error:', error);
      throw new Error('فشل في استخراج بيانات أمر التشغيل من النص');
    }
  }

  // استخراج بيانات المكينة من النص
  static async extractMachineData(text: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `استخرج بيانات المكينة من النص التالي وأرجعها بتنسيق JSON:
{
  "name": "اسم المكينة",
  "name_ar": "الاسم بالعربية",
  "type": "نوع المكينة - extruder/printer/cutter",
  "section_id": "معرف القسم (اختياري)",
  "status": "حالة المكينة - active/maintenance/down"
}

حدد نوع المكينة بدقة حسب الوصف.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // حالة افتراضية
      if (!result.status) {
        result.status = 'active';
      }
      
      return result;
    } catch (error) {
      console.error('Machine data extraction error:', error);
      throw new Error('فشل في استخراج بيانات المكينة من النص');
    }
  }

  // استخراج بيانات التحديث من النص
  static async extractUpdateData(text: string, entityType: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `استخرج بيانات التحديث للـ ${entityType} من النص التالي وأرجعها بتنسيق JSON:

للطلبات:
{
  "orderId": "معرف الطلب",
  "updates": {
    "status": "الحالة الجديدة",
    "delivery_date": "تاريخ التسليم الجديد",
    "notes": "ملاحظات محدثة"
  }
}

للمكائن:
{
  "machineId": "معرف المكينة",
  "updates": {
    "status": "الحالة الجديدة",
    "name": "اسم محدث",
    "type": "نوع محدث"
  }
}

استخرج المعرف والحقول المطلوب تحديثها فقط.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Update data extraction error:', error);
      throw new Error('فشل في استخراج بيانات التحديث من النص');
    }
  }

  // استخراج المعرف من النص
  static async extractIdFromText(text: string, entityType: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `استخرج معرف الـ ${entityType} من النص التالي:

للعملاء: ابحث عن CID أو رقم العميل
للطلبات: ابحث عن ORD أو رقم الطلب
للمكائن: ابحث عن أرقام أو أسماء المكائن
لأوامر التشغيل: ابحث عن JO أو رقم أمر التشغيل

أرجع فقط المعرف بدون تفسير.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1
      });

      const result = response.choices[0].message.content?.trim();
      if (!result) {
        throw new Error(`لم يتم العثور على معرف الـ ${entityType} في النص`);
      }
      
      return result;
    } catch (error) {
      console.error('ID extraction error:', error);
      throw new Error(`فشل في استخراج معرف الـ ${entityType} من النص`);
    }
  }

  // استخراج مرشحات البحث من النص
  static async extractFilters(text: string): Promise<any> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `استخرج مرشحات البحث من النص التالي وأرجعها بتنسيق JSON:
{
  "status": "حالة محددة",
  "date_from": "من تاريخ (YYYY-MM-DD)",
  "date_to": "إلى تاريخ (YYYY-MM-DD)",
  "customer_id": "معرف عميل محدد",
  "limit": "عدد النتائج المطلوبة"
}

إذا لم يتم تحديد مرشح معين، لا تدرجه في النتيجة.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Filters extraction error:', error);
      return {};
    }
  }

  // ترجمة الحالات إلى العربية
  static translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'في الانتظار',
      'for_production': 'للإنتاج',
      'in_progress': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'delivered': 'مُسلم',
      'active': 'نشط',
      'maintenance': 'صيانة',
      'down': 'متوقف',
      'for_printing': 'للطباعة',
      'for_cutting': 'للقطع',
      'done': 'منجز'
    };
    
    return statusMap[status] || status;
  }

  // تحليل بيانات الإنتاج
  static analyzeProductionData(stats: any): string {
    let analysis = "";
    
    if (stats.productionRate < 70) {
      analysis += "معدل الإنتاج منخفض - يُنصح بمراجعة عمليات الإنتاج. ";
    } else if (stats.productionRate > 90) {
      analysis += "معدل الإنتاج ممتاز! ";
    }
    
    if (stats.qualityScore < 80) {
      analysis += "نسبة الجودة تحتاج تحسين - يُنصح بمراجعة إجراءات فحص الجودة. ";
    }
    
    if (stats.wastePercentage > 5) {
      analysis += "نسبة الهدر مرتفعة - يُنصح بتحليل أسباب الهدر وتقليلها. ";
    }
    
    if (stats.activeOrders > 10) {
      analysis += "عدد كبير من الطلبات النشطة - قد تحتاج لزيادة الإنتاجية. ";
    }
    
    return analysis || "الأداء ضمن المعدلات الطبيعية.";
  }

  // توليد SQL آمن من النص الطبيعي
  static async generateSQLFromNaturalLanguage(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `حول النص التالي إلى استعلام SQL آمن للجداول التالية:
- customers (العملاء)
- orders (الطلبات)
- production_orders (أوامر التشغيل)
- rolls (الرولات)
- machines (المكائن)
- users (المستخدمين)
- quality_checks (فحص الجودة)
- maintenance_records (سجلات الصيانة)

قواعد مهمة:
1. استخدم فقط SELECT (لا INSERT/UPDATE/DELETE)
2. استخدم معاملات آمنة
3. أضف LIMIT للحد من النتائج
4. تجنب استعلامات معقدة

أرجع فقط SQL بدون شرح.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1
      });

      const sql = response.choices[0].message.content?.trim();
      
      // فحص أمان أساسي
      if (!sql || !sql.toLowerCase().startsWith('select')) {
        throw new Error('استعلام غير آمن');
      }
      
      return sql;
    } catch (error) {
      console.error('SQL generation error:', error);
      throw new Error('فشل في توليد استعلام SQL من النص');
    }
  }
}