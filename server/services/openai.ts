import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface AICommand {
  intent: string;
  action: string;
  parameters?: Record<string, any>;
  response: string;
}

class OpenAIService {
  async processMessage(message: string): Promise<string> {
    try {
      // Analyze the user's intent and provide appropriate response
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت مساعد ذكي لنظام إدارة مصنع الأكياس البلاستيكية (MPBF Next). يمكنك مساعدة المستخدمين في:

1. الاستعلام عن حالة الطلبات وأوامر التشغيل
2. تتبع الإنتاج والرولات
3. مراقبة المكائن وحالتها
4. إدارة المستودع والجرد
5. معلومات الجودة والصيانة
6. إحصائيات الإنتاج والأداء

استجب باللغة العربية بطريقة مهنية ومفيدة. إذا سُئلت عن معلومات محددة لا تملكها، اطلب من المستخدم توضيح أكثر أو راجع النظام للحصول على المعلومات المطلوبة.

إذا طُلب منك تنفيذ إجراء معين (مثل إنشاء رول أو تحديث حالة)، اشرح الخطوات المطلوبة واطلب التأكيد.`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0].message.content || "عذراً، لم أتمكن من فهم طلبك. يرجى المحاولة مرة أخرى.";

      // Check if the message contains specific queries that need data
      if (await this.needsDataQuery(message)) {
        return await this.handleDataQuery(message, aiResponse);
      }

      return aiResponse;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return "عذراً، حدث خطأ في المساعد الذكي. يرجى المحاولة مرة أخرى لاحقاً.";
    }
  }

  private async needsDataQuery(message: string): Promise<boolean> {
    const dataKeywords = [
      'حالة الطلب', 'رقم الطلب', 'أمر التشغيل', 'الرول', 'المكينة',
      'الإنتاج', 'المستودع', 'الجودة', 'الصيانة', 'إحصائيات'
    ];
    
    return dataKeywords.some(keyword => message.includes(keyword));
  }

  private async handleDataQuery(message: string, baseResponse: string): Promise<string> {
    try {
      // Extract order numbers or specific identifiers from the message
      const orderMatch = message.match(/JO-\d{4}-\d{3}|ORD-\d+|R-\d+/);
      
      if (orderMatch) {
        const identifier = orderMatch[0];
        
        if (identifier.startsWith('JO-')) {
          // Query job order information
          const stats = await storage.getDashboardStats();
          return `${baseResponse}\n\nالإحصائيات الحالية:\n• الطلبات النشطة: ${stats.activeOrders}\n• معدل الإنتاج: ${stats.productionRate}%\n• نسبة الجودة: ${stats.qualityScore}%\n• نسبة الهدر: ${stats.wastePercentage}%`;
        }
      }

      // For general queries, provide dashboard stats
      if (message.includes('إحصائيات') || message.includes('حالة المصنع')) {
        const stats = await storage.getDashboardStats();
        return `إحصائيات المصنع الحالية:\n\n• الطلبات النشطة: ${stats.activeOrders} طلب\n• معدل الإنتاج: ${stats.productionRate}%\n• نسبة الجودة: ${stats.qualityScore}%\n• نسبة الهدر: ${stats.wastePercentage}%\n\nهل تحتاج معلومات إضافية حول أي من هذه النقاط؟`;
      }

      return baseResponse;
    } catch (error) {
      console.error('Data query error:', error);
      return baseResponse + "\n\n(ملاحظة: لم أتمكن من الوصول لبيانات النظام حالياً)";
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
            content: "أنت محلل بيانات متخصص في الإنتاج الصناعي. قم بتحليل البيانات المقدمة وقدم توصيات لتحسين الأداء باللغة العربية."
          },
          {
            role: "user",
            content: `حلل هذه البيانات الإنتاجية:
- الطلبات النشطة: ${stats.activeOrders}
- معدل الإنتاج: ${stats.productionRate}%
- نسبة الجودة: ${stats.qualityScore}%
- نسبة الهدر: ${stats.wastePercentage}%

قدم تحليل موجز وتوصيات للتحسين.`
          }
        ],
        max_tokens: 400,
        temperature: 0.5,
      });

      return analysis.choices[0].message.content || "لم أتمكن من تحليل البيانات حالياً.";
    } catch (error) {
      console.error('Production analysis error:', error);
      return "حدث خطأ أثناء تحليل بيانات الإنتاج.";
    }
  }

  async generateMaintenanceAlert(machineId: number, issueDescription: string): Promise<string> {
    try {
      const machine = await storage.getMachineById(machineId);
      
      if (!machine) {
        return "لم أتمكن من العثور على بيانات المكينة المحددة.";
      }

      const alert = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "أنت خبير صيانة المعدات الصناعية. قم بتحليل المشكلة وقدم توصيات للإصلاح باللغة العربية."
          },
          {
            role: "user",
            content: `المكينة: ${machine.name_ar || machine.name}
نوع المكينة: ${machine.type}
المشكلة المبلغ عنها: ${issueDescription}

قدم تقييم سريع للمشكلة والإجراءات المطلوبة.`
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      return alert.choices[0].message.content || "لم أتمكن من تحليل المشكلة المبلغ عنها.";
    } catch (error) {
      console.error('Maintenance alert error:', error);
      return "حدث خطأ أثناء تحليل تبليغ الصيانة.";
    }
  }
}

export const openaiService = new OpenAIService();
