// ===============================================
// 🔹 Error Learning Enhancer
// ===============================================
// Description: Advanced error learning and pattern recognition
// ===============================================

// import { AILearning } from "./ai-learning"; // Commented out - file doesn't exist

export interface ErrorPattern {
  errorType: string;
  frequency: number;
  lastOccurrence: Date;
  userImpact: "low" | "medium" | "high";
  suggestedFix?: string;
  relatedErrors: string[];
}

export interface LearningRecommendation {
  type: "prevent_error" | "improve_performance" | "enhance_ux";
  priority: "low" | "medium" | "high";
  description: string;
  actionItems: string[];
  expectedImpact: string;
}

export class ErrorLearningEnhancer {
  private static errorHistory: Map<string, ErrorPattern> = new Map();
  private static recommendations: LearningRecommendation[] = [];

  /**
   * تسجيل خطأ والتعلم منه
   */
  static async recordError(
    errorType: string,
    errorMessage: string,
    context: {
      userId?: number;
      action?: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      // تحديث نمط الخطأ
      const pattern = this.errorHistory.get(errorType);
      
      if (pattern) {
        pattern.frequency++;
        pattern.lastOccurrence = new Date();
        
        // تحديث مستوى التأثير بناءً على التكرار
        if (pattern.frequency > 10) {
          pattern.userImpact = "high";
        } else if (pattern.frequency > 5) {
          pattern.userImpact = "medium";
        }
      } else {
        this.errorHistory.set(errorType, {
          errorType,
          frequency: 1,
          lastOccurrence: new Date(),
          userImpact: "low",
          relatedErrors: []
        });
      }

      // تسجيل في نظام التعلم العام
      // Commented out - AILearning module doesn't exist
      // if (context.userId) {
      //   await AILearning.recordLearningData(
      //     context.userId,
      //     context.action || "error_encountered",
      //     `${errorType}: ${errorMessage}`,
      //     false,
      //     0,
      //     "negative"
      //   );
      // }

      // توليد توصية إذا تكرر الخطأ
      if (pattern && pattern.frequency >= 3) {
        await this.generateErrorRecommendation(errorType, pattern);
      }

      console.log(`⚠️ تم تسجيل خطأ: ${errorType} (التكرار: ${pattern?.frequency || 1})`);
    } catch (error) {
      console.error("Error recording error:", error);
    }
  }

  /**
   * توليد توصية بناءً على نمط الخطأ
   */
  private static async generateErrorRecommendation(
    errorType: string,
    pattern: ErrorPattern
  ): Promise<void> {
    // فحص إذا كان لدينا توصية مسبقة لهذا الخطأ
    const existingRec = this.recommendations.find(
      r => r.description.includes(errorType)
    );

    if (existingRec) {
      // تحديث الأولوية بناءً على التكرار
      if (pattern.frequency > 10) {
        existingRec.priority = "high";
      }
      return;
    }

    // إنشاء توصية جديدة
    const recommendation: LearningRecommendation = {
      type: "prevent_error",
      priority: pattern.userImpact === "high" ? "high" : 
                pattern.userImpact === "medium" ? "medium" : "low",
      description: `تكرر خطأ "${errorType}" ${pattern.frequency} مرة`,
      actionItems: [
        "مراجعة الكود المتعلق بهذا الخطأ",
        "إضافة validationإضافية",
        "تحسين رسائل الخطأ للمستخدم"
      ],
      expectedImpact: `تقليل تكرار هذا الخطأ بنسبة ${Math.min(pattern.frequency * 5, 90)}%`
    };

    this.recommendations.push(recommendation);
    console.log(`💡 تم توليد توصية جديدة لمعالجة: ${errorType}`);
  }

  /**
   * الحصول على أنماط الأخطاء الأكثر شيوعاً
   */
  static getTopErrors(limit: number = 5): ErrorPattern[] {
    return Array.from(this.errorHistory.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * الحصول على التوصيات ذات الأولوية العالية
   */
  static getHighPriorityRecommendations(): LearningRecommendation[] {
    return this.recommendations
      .filter(r => r.priority === "high")
      .slice(0, 10);
  }

  /**
   * البحث عن حل لخطأ معين
   */
  static async suggestFix(errorType: string, errorMessage: string): Promise<string> {
    const pattern = this.errorHistory.get(errorType);
    
    if (pattern && pattern.suggestedFix) {
      return pattern.suggestedFix;
    }

    // استخدام التاريخ للعثور على حلول
    const relatedErrors = Array.from(this.errorHistory.values())
      .filter(p => p.errorType.includes(errorType.split('_')[0]));

    if (relatedErrors.length > 0) {
      return `هذا الخطأ حدث ${pattern?.frequency || 0} مرة سابقاً. جرب:
• التحقق من البيانات المُدخلة
• مراجعة الصلاحيات
• التأكد من اتصال قاعدة البيانات`;
    }

    return "خطأ جديد. يُنصح بفحص السجلات للتفاصيل.";
  }

  /**
   * تحليل أنماط الأخطاء لاكتشاف مشاكل النظام
   */
  static analyzeErrorPatterns(): {
    criticalIssues: string[];
    warningIssues: string[];
    suggestions: string[];
  } {
    const critical: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    this.errorHistory.forEach((pattern, errorType) => {
      if (pattern.userImpact === "high") {
        critical.push(`${errorType}: تكرر ${pattern.frequency} مرة`);
      } else if (pattern.userImpact === "medium") {
        warnings.push(`${errorType}: تكرر ${pattern.frequency} مرة`);
      }

      if (pattern.frequency > 5) {
        suggestions.push(`يُنصح بمعالجة "${errorType}" لتحسين تجربة المستخدم`);
      }
    });

    return {
      criticalIssues: critical,
      warningIssues: warnings,
      suggestions
    };
  }

  /**
   * مسح بيانات الأخطاء القديمة
   */
  static clearOldErrors(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.errorHistory.forEach((pattern, errorType) => {
      if (pattern.lastOccurrence < cutoffDate) {
        this.errorHistory.delete(errorType);
      }
    });

    console.log(`🧹 تم مسح أخطاء أقدم من ${daysOld} يوم`);
  }

  /**
   * تصدير تقرير الأخطاء
   */
  static generateErrorReport(): {
    totalErrors: number;
    uniqueErrors: number;
    topErrors: ErrorPattern[];
    recommendations: LearningRecommendation[];
    analysis: ReturnType<typeof ErrorLearningEnhancer.analyzeErrorPatterns>;
  } {
    const topErrors = this.getTopErrors(10);
    const analysis = this.analyzeErrorPatterns();

    return {
      totalErrors: Array.from(this.errorHistory.values())
        .reduce((sum, p) => sum + p.frequency, 0),
      uniqueErrors: this.errorHistory.size,
      topErrors,
      recommendations: this.getHighPriorityRecommendations(),
      analysis
    };
  }

  /**
   * التعلم من نجاحات سابقة لمنع أخطاء مستقبلية
   */
  static async learnFromSuccess(
    action: string,
    context: any,
    userId?: number
  ): Promise<void> {
    // تسجيل النجاح
    // Commented out - AILearning module doesn't exist
    // if (userId) {
    //   await AILearning.recordLearningData(
    //     userId,
    //     action,
    //     JSON.stringify(context),
    //     true,
    //     0,
    //     "positive"
    //   );
    // }

    // البحث عن أخطاء مماثلة وتحديث الحلول المقترحة
    const relatedErrorTypes = Array.from(this.errorHistory.keys())
      .filter(errorType => errorType.includes(action.split('_')[0]));

    for (const errorType of relatedErrorTypes) {
      const pattern = this.errorHistory.get(errorType);
      if (pattern && !pattern.suggestedFix) {
        pattern.suggestedFix = `جرب الطريقة التي نجحت في: ${action}`;
      }
    }
  }
}

// تنظيف دوري للأخطاء القديمة (كل 24 ساعة)
setInterval(() => {
  ErrorLearningEnhancer.clearOldErrors(30);
}, 24 * 60 * 60 * 1000);

export default ErrorLearningEnhancer;
