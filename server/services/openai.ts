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
    } catch (error: any) {
      console.error('OpenAI API Error:', {
        message: error?.message,
        status: error?.status,
        code: error?.code,
        type: error?.type
      });
      
      // Provide more specific error messages based on error type
      if (error?.status === 401) {
        return "خطأ في التحقق من مفتاح API. يرجى التحقق من إعدادات الخدمة.";
      } else if (error?.status === 429) {
        return "تم تجاوز حد الاستخدام. يرجى المحاولة مرة أخرى لاحقاً.";
      } else if (error?.code === 'network_error') {
        return "خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.";
      }
      
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

  async processVoiceCommand(command: string, language: string = 'ar-SA', dialect: string = 'standard'): Promise<AICommand> {
    try {
      // Get dialect-specific response style
      const getDialectResponseStyle = (dialect: string): string => {
        const dialectStyles: Record<string, string> = {
          'standard': 'بالعربية الفصحى',
          'egyptian': 'باللهجة المصرية (مثل: "حاضر"، "طيب"، "إيه رأيك")',
          'gulf': 'باللهجة الخليجية (مثل: "زين"، "ماشي"، "شلونك")',
          'levantine': 'باللهجة الشامية (مثل: "منيح"، "تمام"، "شو رأيك")',
          'maghreb': 'باللهجة المغاربية (مثل: "واخا"، "بزاف"، "فين")'
        };
        return dialectStyles[dialect] || dialectStyles['standard'];
      };

      const systemPrompt = language === 'ar-SA' ? 
        `أنت مساعد صوتي ذكي لنظام إدارة مصنع الأكياس البلاستيكية (MPBF Next).

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
}` :
        `You are an intelligent voice assistant for the MPBF Next plastic bag factory management system.

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
          { role: "user", content: command }
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        intent: result.intent || 'unknown',
        action: result.action || 'none',
        parameters: result.parameters || {},
        response: result.response || (language === 'ar-SA' ? 'لم أتمكن من فهم الأمر' : 'I could not understand the command')
      };
    } catch (error) {
      console.error('Voice command processing error:', error);
      return {
        intent: 'error',
        action: 'none',
        parameters: {},
        response: language === 'ar-SA' ? 'عذراً، حدث خطأ في معالجة الأمر الصوتي' : 'Sorry, there was an error processing the voice command'
      };
    }
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
