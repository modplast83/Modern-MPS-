import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface LearningData {
  user_id: number;
  action_type: string;
  context: string;
  success: boolean;
  execution_time: number;
  user_feedback?: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

interface LearningInsight {
  pattern: string;
  frequency: number;
  success_rate: number;
  recommendations: string[];
  improvement_areas: string[];
}

interface UserPattern {
  user_id: number;
  common_actions: string[];
  preferred_workflows: string[];
  peak_usage_times: string[];
  success_patterns: string[];
  areas_for_improvement: string[];
}

export class AILearning {
  private static learningData: LearningData[] = [];
  private static insights: LearningInsight[] = [];
  private static userPatterns: Map<number, UserPattern> = new Map();

  // تسجيل بيانات التعلم
  static async recordLearningData(
    userId: number,
    actionType: string,
    context: string,
    success: boolean,
    executionTime: number,
    userFeedback?: 'positive' | 'negative' | 'neutral'
  ): Promise<void> {
    try {
      const learningEntry: LearningData = {
        user_id: userId,
        action_type: actionType,
        context,
        success,
        execution_time: executionTime,
        user_feedback: userFeedback,
        timestamp: new Date()
      };

      this.learningData.push(learningEntry);

      // تحديث أنماط المستخدم
      await this.updateUserPatterns(userId);

      // تحليل دوري كل 50 إدخال جديد
      if (this.learningData.length % 50 === 0) {
        await this.analyzeLearningPatterns();
      }

      console.log(`📊 تم تسجيل بيانات التعلم: ${actionType} - نجح: ${success} - وقت التنفيذ: ${executionTime}ms`);
    } catch (error) {
      console.error('Learning data recording error:', error);
    }
  }

  // تحليل أنماط التعلم
  private static async analyzeLearningPatterns(): Promise<void> {
    try {
      // تجميع البيانات حسب نوع الإجراء
      const actionGroups = this.groupByAction();
      
      for (const [actionType, data] of Object.entries(actionGroups)) {
        const insight = await this.generateActionInsight(actionType, data);
        if (insight) {
          this.insights.push(insight);
        }
      }

      // تنظيف الرؤى القديمة (الاحتفاظ بآخر 100)
      if (this.insights.length > 100) {
        this.insights = this.insights.slice(-100);
      }

      console.log(`🧠 تم تحليل ${Object.keys(actionGroups).length} نوع من الإجراءات`);
    } catch (error) {
      console.error('Learning patterns analysis error:', error);
    }
  }

  // تجميع البيانات حسب نوع الإجراء
  private static groupByAction(): Record<string, LearningData[]> {
    const groups: Record<string, LearningData[]> = {};
    
    for (const entry of this.learningData) {
      if (!groups[entry.action_type]) {
        groups[entry.action_type] = [];
      }
      groups[entry.action_type].push(entry);
    }
    
    return groups;
  }

  // توليد رؤى للإجراء
  private static async generateActionInsight(actionType: string, data: LearningData[]): Promise<LearningInsight | null> {
    try {
      const successRate = data.filter(d => d.success).length / data.length;
      const avgExecutionTime = data.reduce((sum, d) => sum + d.execution_time, 0) / data.length;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت نظام تعلم آلي متخصص في تحليل أنماط استخدام النظام. حلل البيانات التالية وقدم رؤى بتنسيق JSON:

{
  "pattern": "وصف النمط المكتشف",
  "recommendations": ["توصية 1", "توصية 2", "..."],
  "improvement_areas": ["مجال تحسين 1", "مجال تحسين 2", "..."]
}

ركز على:
- تحسين الأداء
- تقليل وقت التنفيذ
- زيادة معدل النجاح
- تحسين تجربة المستخدم`
          },
          {
            role: "user",
            content: `نوع الإجراء: ${actionType}
عدد المحاولات: ${data.length}
معدل النجاح: ${(successRate * 100).toFixed(1)}%
متوسط وقت التنفيذ: ${avgExecutionTime.toFixed(0)}ms
التعليقات الإيجابية: ${data.filter(d => d.user_feedback === 'positive').length}
التعليقات السلبية: ${data.filter(d => d.user_feedback === 'negative').length}

حلل هذه البيانات وقدم رؤى للتحسين.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        pattern: result.pattern || `نمط ${actionType}`,
        frequency: data.length,
        success_rate: successRate,
        recommendations: result.recommendations || [],
        improvement_areas: result.improvement_areas || []
      };
    } catch (error) {
      console.error('Action insight generation error:', error);
      return null;
    }
  }

  // تحديث أنماط المستخدم
  private static async updateUserPatterns(userId: number): Promise<void> {
    try {
      const userData = this.learningData.filter(d => d.user_id === userId);
      
      if (userData.length < 10) return; // نحتاج بيانات كافية للتحليل
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `حلل أنماط استخدام المستخدم وقدم تحليلاً بتنسيق JSON:

{
  "common_actions": ["الإجراءات الأكثر شيوعاً"],
  "preferred_workflows": ["سلاسل العمل المفضلة"],
  "peak_usage_times": ["أوقات الذروة"],
  "success_patterns": ["الأنماط الناجحة"],
  "areas_for_improvement": ["مجالات التحسين"]
}`
          },
          {
            role: "user",
            content: `بيانات المستخدم ${userId}:
عدد الإجراءات: ${userData.length}
معدل النجاح الإجمالي: ${(userData.filter(d => d.success).length / userData.length * 100).toFixed(1)}%
الإجراءات الشائعة: ${Array.from(new Set(userData.map(d => d.action_type))).join(', ')}
متوسط وقت التنفيذ: ${(userData.reduce((sum, d) => sum + d.execution_time, 0) / userData.length).toFixed(0)}ms

حلل أنماط هذا المستخدم.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      this.userPatterns.set(userId, {
        user_id: userId,
        common_actions: result.common_actions || [],
        preferred_workflows: result.preferred_workflows || [],
        peak_usage_times: result.peak_usage_times || [],
        success_patterns: result.success_patterns || [],
        areas_for_improvement: result.areas_for_improvement || []
      });
      
      console.log(`👤 تم تحديث أنماط المستخدم ${userId}`);
    } catch (error) {
      console.error('User patterns update error:', error);
    }
  }

  // الحصول على توصيات مخصصة للمستخدم
  static async getPersonalizedRecommendations(userId: number): Promise<string[]> {
    try {
      const userPattern = this.userPatterns.get(userId);
      const userData = this.learningData.filter(d => d.user_id === userId);
      
      if (!userPattern || userData.length < 5) {
        return [
          "استخدم المساعد الصوتي لتسريع العمليات",
          "استفد من التقارير الذكية لتحليل الأداء",
          "راجع إعدادات النظام لتخصيص تجربتك"
        ];
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت مستشار ذكي لتحسين الإنتاجية. قدم توصيات مخصصة للمستخدم بناءً على أنماط استخدامه.
            
أرجع قائمة من التوصيات العملية بتنسيق JSON:
{
  "recommendations": ["توصية 1", "توصية 2", "..."]
}`
          },
          {
            role: "user",
            content: `أنماط المستخدم ${userId}:
الإجراءات الشائعة: ${userPattern.common_actions.join(', ')}
سلاسل العمل المفضلة: ${userPattern.preferred_workflows.join(', ')}
معدل النجاح: ${(userData.filter(d => d.success).length / userData.length * 100).toFixed(1)}%
مجالات التحسين: ${userPattern.areas_for_improvement.join(', ')}

قدم توصيات شخصية لتحسين الإنتاجية.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.recommendations || [];
    } catch (error) {
      console.error('Personalized recommendations error:', error);
      return ["استمر في استكشاف ميزات النظام لتحسين الإنتاجية"];
    }
  }

  // الحصول على إحصائيات التعلم
  static getLearningStatistics(): any {
    const totalActions = this.learningData.length;
    const successfulActions = this.learningData.filter(d => d.success).length;
    const averageExecutionTime = totalActions > 0 
      ? this.learningData.reduce((sum, d) => sum + d.execution_time, 0) / totalActions 
      : 0;
    
    const actionTypes = Array.from(new Set(this.learningData.map(d => d.action_type)));
    const uniqueUsers = Array.from(new Set(this.learningData.map(d => d.user_id)));
    
    return {
      total_actions: totalActions,
      success_rate: totalActions > 0 ? (successfulActions / totalActions * 100).toFixed(1) + '%' : '0%',
      average_execution_time: averageExecutionTime.toFixed(0) + 'ms',
      unique_action_types: actionTypes.length,
      active_users: uniqueUsers.length,
      insights_generated: this.insights.length,
      user_patterns_tracked: this.userPatterns.size
    };
  }

  // الحصول على رؤى محددة
  static getInsightsByAction(actionType: string): LearningInsight[] {
    return this.insights.filter(insight => 
      insight.pattern.toLowerCase().includes(actionType.toLowerCase())
    );
  }

  // تصدير بيانات التعلم (للنسخ الاحتياطي أو التحليل)
  static exportLearningData(): any {
    return {
      learning_data: this.learningData,
      insights: this.insights,
      user_patterns: Array.from(this.userPatterns.entries()),
      export_timestamp: new Date().toISOString()
    };
  }

  // استيراد بيانات التعلم
  static importLearningData(data: any): void {
    try {
      if (data.learning_data) {
        this.learningData = data.learning_data;
      }
      if (data.insights) {
        this.insights = data.insights;
      }
      if (data.user_patterns) {
        this.userPatterns = new Map(data.user_patterns);
      }
      
      console.log('📥 تم استيراد بيانات التعلم بنجاح');
    } catch (error) {
      console.error('Learning data import error:', error);
    }
  }

  // تنظيف البيانات القديمة (أكثر من 30 يوم)
  static cleanupOldData(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const beforeCount = this.learningData.length;
    this.learningData = this.learningData.filter(d => d.timestamp > thirtyDaysAgo);
    const afterCount = this.learningData.length;
    
    console.log(`🧹 تم تنظيف ${beforeCount - afterCount} إدخال قديم من بيانات التعلم`);
  }
}

// تنظيف دوري للبيانات القديمة (كل 24 ساعة)
setInterval(() => {
  AILearning.cleanupOldData();
}, 24 * 60 * 60 * 1000);