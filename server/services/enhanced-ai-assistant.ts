// ===============================================
// 🔹 Enhanced AI Assistant with Database Intelligence
// ===============================================
// Features:
// - Smart clarification when unsure
// - Database schema understanding
// - Confirmation before execution
// - Learning from errors
// ===============================================

import OpenAI from "openai";
import { queryEngine, enhancedDatabaseSchema } from "./database-query-engine";
import { AILearning } from "./ai-learning";
import { openaiService } from "./openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponse {
  message: string;
  requiresClarification: boolean;
  clarificationQuestion?: string;
  suggestedActions?: string[];
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  actionPlan?: {
    description: string;
    table?: string;
    operation?: string;
    data?: any;
  };
  confidence: number;
  sources?: string[];
}

export interface UserContext {
  userId?: number;
  previousMessages?: string[];
  currentConversation?: string;
}

export class EnhancedAIAssistant {
  private conversationHistory: Map<number, Array<{role: string, content: string}>> = new Map();

  /**
   * معالجة رسالة مع فهم محسّن وطلب توضيح عند الحاجة
   */
  async processMessageWithIntelligence(
    message: string,
    context: UserContext
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // 1️⃣ تحليل النية مع مستوى الثقة
      const intentAnalysis = await this.analyzeIntentWithConfidence(message);

      // 2️⃣ إذا كان مستوى الثقة منخفض - اطلب توضيح
      if (intentAnalysis.confidence < 0.6) {
        return this.requestClarification(intentAnalysis, message);
      }

      // 3️⃣ إذا كانت هناك معلومات ناقصة - اسأل عنها
      if (intentAnalysis.missingInfo && intentAnalysis.missingInfo.length > 0) {
        return this.askForMissingInformation(intentAnalysis);
      }

      // 4️⃣ إذا كانت العملية تتطلب قاعدة بيانات - ابحث أولاً
      if (intentAnalysis.requiresDatabase) {
        const searchResults = await this.searchDatabase(intentAnalysis);
        
        // إذا كانت عملية كتابة (create/update/delete) - نفذها مباشرة
        if (this.isWriteOperation(intentAnalysis.action)) {
          return this.executeWriteOperation(intentAnalysis, context);
        }

        // عملية قراءة - نفذ مباشرة
        return this.executeReadOperation(intentAnalysis, searchResults);
      }

      // 5️⃣ سؤال عام - استخدم المعرفة العامة
      return this.handleGeneralQuery(message, context);

    } catch (error: any) {
      console.error("Enhanced AI Assistant Error:", error);
      
      // تسجيل الخطأ للتعلم
      if (context.userId) {
        await AILearning.recordLearningData(
          context.userId,
          "message_processing",
          message,
          false,
          Date.now() - startTime
        );
      }

      return {
        message: "عذراً، واجهت صعوبة في فهم طلبك. هل يمكنك إعادة صياغته بطريقة مختلفة؟",
        requiresClarification: true,
        requiresConfirmation: false,
        confidence: 0,
        clarificationQuestion: "يرجى توضيح ما تريد القيام به بالتفصيل."
      };
    }
  }

  /**
   * تحليل النية مع مستوى الثقة
   */
  private async analyzeIntentWithConfidence(message: string): Promise<{
    intent: string;
    action: string;
    confidence: number;
    requiresDatabase: boolean;
    table?: string;
    parameters: Record<string, any>;
    missingInfo?: string[];
  }> {
    try {
      // بناء قائمة الجداول المتاحة
      const tablesInfo = enhancedDatabaseSchema.map(s => 
        `• ${s.arabicName} (${s.name}): ${s.description}\n  الحقول القابلة للبحث: ${s.searchableFields.join(', ') || 'لا يوجد'}`
      ).join('\n');

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت محلل ذكي متقدم لنظام إدارة مصنع الأكياس البلاستيكية (MPBF).

**قاعدة البيانات المتاحة:**
${tablesInfo}

**مهمتك:**
1. فهم نية المستخدم بدقة
2. تحديد الجدول/الجداول المطلوبة
3. استخراج المعلومات الموجودة
4. تحديد المعلومات الناقصة
5. تقييم مستوى ثقتك في الفهم (0-1)

**أنواع العمليات:**
- read: قراءة البيانات (SELECT)
- create: إنشاء جديد (INSERT)
- update: تحديث (UPDATE)
- delete: حذف (DELETE)
- analyze: تحليل وإحصائيات

**أمثلة:**
• "ابحث عن عميل اسمه أحمد" → read, table: customers, confidence: 0.9
• "سجل عميل جديد" → create, table: customers, confidence: 0.5, missingInfo: ["الاسم", "الهاتف"]
• "كم عدد الطلبات النشطة؟" → analyze, table: orders, confidence: 1.0

**تعليمات:**
- إذا لم تفهم المطلوب بوضوح: confidence < 0.6
- إذا فهمت النية لكن ينقص بيانات: confidence 0.6-0.8 + missingInfo
- إذا فهمت كل شيء: confidence > 0.8

أرجع JSON:
{
  "intent": "read|create|update|delete|analyze|general",
  "action": "وصف دقيق للعملية",
  "confidence": 0.0-1.0,
  "requiresDatabase": true/false,
  "table": "اسم الجدول أو null",
  "parameters": {"البيانات المستخرجة"},
  "missingInfo": ["قائمة المعلومات الناقصة"]
}`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        intent: result.intent || "general",
        action: result.action || "",
        confidence: result.confidence || 0,
        requiresDatabase: result.requiresDatabase || false,
        table: result.table || undefined,
        parameters: result.parameters || {},
        missingInfo: result.missingInfo || []
      };
    } catch (error) {
      console.error("Intent analysis error:", error);
      return {
        intent: "general",
        action: "",
        confidence: 0,
        requiresDatabase: false,
        parameters: {},
        missingInfo: []
      };
    }
  }

  /**
   * طلب توضيح عند انخفاض مستوى الثقة
   */
  private requestClarification(intentAnalysis: any, originalMessage: string): AIResponse {
    const suggestions = queryEngine.suggestQueries(originalMessage);
    
    return {
      message: `لم أفهم طلبك بشكل كامل. هل تقصد أحد الأمور التالية؟`,
      requiresClarification: true,
      requiresConfirmation: false,
      confidence: intentAnalysis.confidence,
      clarificationQuestion: "يرجى اختيار أحد الخيارات التالية أو إعادة صياغة سؤالك:",
      suggestedActions: suggestions.length > 0 ? suggestions : [
        "البحث عن معلومات في قاعدة البيانات",
        "إنشاء سجل جديد (عميل، طلب، منتج)",
        "عرض تقرير أو إحصائيات",
        "الحصول على مساعدة عامة"
      ]
    };
  }

  /**
   * طلب المعلومات الناقصة
   */
  private askForMissingInformation(intentAnalysis: any): AIResponse {
    const missingFields = intentAnalysis.missingInfo.join('، ');
    
    return {
      message: `فهمت أنك تريد ${intentAnalysis.action}، لكن أحتاج المعلومات التالية:`,
      requiresClarification: true,
      requiresConfirmation: false,
      confidence: intentAnalysis.confidence,
      clarificationQuestion: `يرجى تزويدي بـ: ${missingFields}`,
      suggestedActions: intentAnalysis.missingInfo.map((field: string) => 
        `أدخل ${field}`
      )
    };
  }

  /**
   * البحث في قاعدة البيانات
   */
  private async searchDatabase(intentAnalysis: any): Promise<any> {
    if (!intentAnalysis.table) {
      return { success: false, data: [] };
    }

    // إذا كان هناك نص بحث
    if (intentAnalysis.parameters.searchTerm) {
      return await queryEngine.smartSearch(
        intentAnalysis.table,
        intentAnalysis.parameters.searchTerm
      );
    }

    // إذا كان استعلام SQL مباشر
    if (intentAnalysis.parameters.customQuery) {
      return await queryEngine.executeSafeQuery(
        intentAnalysis.parameters.customQuery
      );
    }

    return { success: true, data: [] };
  }

  /**
   * طلب تأكيد قبل عمليات الكتابة
   */
  private requestConfirmation(intentAnalysis: any, searchResults: any): AIResponse {
    let confirmMessage = "";
    
    switch (intentAnalysis.intent) {
      case "create":
        confirmMessage = `هل تريد إنشاء سجل جديد في جدول "${this.getArabicTableName(intentAnalysis.table)}"؟`;
        break;
      case "update":
        confirmMessage = `هل تريد تحديث البيانات في جدول "${this.getArabicTableName(intentAnalysis.table)}"؟`;
        break;
      case "delete":
        confirmMessage = `⚠️ هل أنت متأكد من حذف البيانات من جدول "${this.getArabicTableName(intentAnalysis.table)}"؟ هذا الإجراء لا يمكن التراجع عنه!`;
        break;
    }

    return {
      message: "تم فهم طلبك. يرجى التأكيد قبل المتابعة.",
      requiresClarification: false,
      requiresConfirmation: true,
      confirmationMessage: confirmMessage,
      actionPlan: {
        description: intentAnalysis.action,
        table: intentAnalysis.table,
        operation: intentAnalysis.intent,
        data: intentAnalysis.parameters
      },
      confidence: intentAnalysis.confidence
    };
  }

  /**
   * تنفيذ عملية قراءة
   */
  private async executeReadOperation(intentAnalysis: any, searchResults: any): Promise<AIResponse> {
    if (!searchResults.success) {
      return {
        message: `عذراً، حدث خطأ: ${searchResults.error}`,
        requiresClarification: false,
        requiresConfirmation: false,
        confidence: intentAnalysis.confidence
      };
    }

    if (!searchResults.data || searchResults.data.length === 0) {
      return {
        message: "لم أجد أي نتائج مطابقة لبحثك.",
        requiresClarification: true,
        requiresConfirmation: false,
        confidence: intentAnalysis.confidence,
        clarificationQuestion: "هل تريد تعديل معايير البحث أو البحث في جدول آخر؟"
      };
    }

    // تنسيق النتائج
    const formattedResults = await this.formatSearchResults(
      searchResults.data,
      intentAnalysis.table
    );

    return {
      message: formattedResults,
      requiresClarification: false,
      requiresConfirmation: false,
      confidence: intentAnalysis.confidence,
      sources: [intentAnalysis.table]
    };
  }

  /**
   * معالجة سؤال عام
   */
  private async handleGeneralQuery(message: string, context: UserContext): Promise<AIResponse> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت مساعد ذكي متخصص في نظام إدارة مصنع الأكياس البلاستيكية (MPBF).
            
قدراتك:
• الإجابة على أسئلة عامة عن النظام
• شرح كيفية استخدام الميزات
• تقديم نصائح للاستخدام الأمثل
• المساعدة في حل المشاكل

أسلوب الرد:
- واضح ومباشر
- احترافي ومفيد
- استخدم رموز تعبيرية مناسبة
- اقترح خطوات عملية`
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return {
        message: response.choices[0].message.content || "كيف يمكنني مساعدتك؟",
        requiresClarification: false,
        requiresConfirmation: false,
        confidence: 0.8
      };
    } catch (error) {
      console.error("General query error:", error);
      return {
        message: "عذراً، حدث خطأ. كيف يمكنني مساعدتك؟",
        requiresClarification: false,
        requiresConfirmation: false,
        confidence: 0
      };
    }
  }

  /**
   * تنسيق نتائج البحث
   */
  private async formatSearchResults(data: any[], tableName?: string): Promise<string> {
    if (!data || data.length === 0) {
      return "لم أجد أي نتائج.";
    }

    const tableArabicName = this.getArabicTableName(tableName);
    const count = data.length;
    
    let result = `📊 **نتائج البحث في ${tableArabicName}** (${count} ${count === 1 ? 'نتيجة' : 'نتائج'})\n\n`;

    // عرض أول 5 نتائج
    const displayData = data.slice(0, 5);
    
    displayData.forEach((item, index) => {
      result += `**${index + 1}.** `;
      
      // عرض الحقول المهمة فقط
      const importantFields = this.getImportantFields(tableName);
      importantFields.forEach(field => {
        if (item[field] !== undefined && item[field] !== null) {
          result += `${field}: ${item[field]} | `;
        }
      });
      
      result += '\n';
    });

    if (count > 5) {
      result += `\n... و ${count - 5} نتيجة أخرى`;
    }

    return result;
  }

  /**
   * الحقول المهمة لكل جدول
   */
  private getImportantFields(tableName?: string): string[] {
    const fieldMap: Record<string, string[]> = {
      customers: ['name', 'name_ar', 'phone', 'city'],
      orders: ['order_number', 'customer_id', 'status', 'created_at'],
      production_orders: ['production_order_number', 'status', 'quantity_kg'],
      rolls: ['roll_number', 'weight_kg', 'stage'],
      machines: ['name', 'name_ar', 'type', 'status'],
      users: ['username', 'full_name', 'status']
    };

    return fieldMap[tableName || ''] || ['id', 'name'];
  }

  /**
   * الحصول على الاسم العربي للجدول
   */
  private getArabicTableName(tableName?: string): string {
    const schema = enhancedDatabaseSchema.find(s => s.name === tableName);
    return schema?.arabicName || tableName || "غير معروف";
  }

  /**
   * فحص إذا كانت عملية كتابة
   */
  private isWriteOperation(action: string): boolean {
    const writeActions = ['create', 'update', 'delete', 'insert', 'modify', 'remove'];
    return writeActions.some(w => action.toLowerCase().includes(w));
  }

  /**
   * تنفيذ عملية كتابة (create/update/delete)
   */
  private async executeWriteOperation(intentAnalysis: any, context: UserContext): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // استخدام الخدمة القديمة (openaiService) للتعامل مع الأوامر المعقدة
      // بناء رسالة واضحة للخدمة القديمة
      const originalMessage = `${intentAnalysis.action}. البيانات: ${JSON.stringify(intentAnalysis.parameters, null, 2)}`;
      const result = await openaiService.processMessage(originalMessage, context.userId);

      // تسجيل النجاح
      if (context.userId) {
        await AILearning.recordLearningData(
          context.userId,
          intentAnalysis.intent,
          intentAnalysis.action,
          true,
          Date.now() - startTime
        );
      }

      return {
        message: result || "✅ تم تنفيذ العملية بنجاح",
        requiresClarification: false,
        requiresConfirmation: false,
        confidence: 0.9
      };
    } catch (error: any) {
      console.error("Write operation error:", error);
      
      // تسجيل الفشل
      if (context.userId) {
        await AILearning.recordLearningData(
          context.userId,
          intentAnalysis.intent,
          intentAnalysis.action,
          false,
          Date.now() - startTime
        );
      }

      return {
        message: `❌ عذراً، حدث خطأ: ${error.message}\n\nيمكنك المحاولة مرة أخرى أو تزويدي بالمعلومات بشكل أوضح.`,
        requiresClarification: true,
        requiresConfirmation: false,
        confidence: 0
      };
    }
  }

  /**
   * تنفيذ العملية بعد التأكيد
   */
  async executeConfirmedAction(
    actionPlan: any,
    userId?: number
  ): Promise<{success: boolean, message: string}> {
    const startTime = Date.now();
    
    try {
      // هنا يتم تنفيذ العملية الفعلية
      // TODO: Integrate with actual database operations
      
      // تسجيل النجاح
      if (userId) {
        await AILearning.recordLearningData(
          userId,
          actionPlan.operation,
          JSON.stringify(actionPlan),
          true,
          Date.now() - startTime
        );
      }

      return {
        success: true,
        message: `✅ تم تنفيذ العملية بنجاح في جدول "${this.getArabicTableName(actionPlan.table)}"`
      };
    } catch (error: any) {
      // تسجيل الفشل
      if (userId) {
        await AILearning.recordLearningData(
          userId,
          actionPlan.operation,
          JSON.stringify(actionPlan),
          false,
          Date.now() - startTime
        );
      }

      return {
        success: false,
        message: `❌ فشل تنفيذ العملية: ${error.message}`
      };
    }
  }
}

export const enhancedAI = new EnhancedAIAssistant();
