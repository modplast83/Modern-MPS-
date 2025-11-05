/**
 * AI Orchestrator - MPBF Factory
 * الإصدار المتكامل 2025
 * -----------------------------------------------------
 * - تحليل أوامر المستخدم (عربية / إنجليزية)
 * - تأكيد قبل التنفيذ
 * - تنفيذ فعلي على PostgreSQL
 * - يدعم: الطلبات / الرولات / العملاء / المكائن / الصيانة / الجودة
 * - يسجل التعلّم الذاتي لكل عملية
 * - متكامل مع openaiService و AILearning و mlService
 */

import { Client } from "pg";
import { openaiService } from "./openai";
import { AILearning } from "./ai-learning";
import { mlService } from "./ml-service";

interface UserCommand {
  userId: number;
  message: string;
}

interface PendingAction {
  action: string;
  parameters?: Record<string, any>;
  table?: string;
  language?: string;
}

// اتصال بقاعدة البيانات
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

db.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

export class AIOrchestrator {
  /**
   * 🔹 تحليل أمر المستخدم باستخدام OpenAI
   */
  static async handleUserCommand({ userId, message }: UserCommand) {
    try {
      console.log(`🧠 تحليل الأمر: ${message}`);

      // تحليل اللغة تلقائيًا
      const lang = /[ء-ي]/.test(message) ? "ar" : "en";

      // تحليل الأمر عبر openaiService
      const analysis = await openaiService.processMessage(message, userId);

      if (!analysis || typeof analysis !== "object") {
        return this.respond(lang, "لم أفهم الأمر، هل يمكنك التوضيح؟", "I couldn’t understand your request, please clarify.");
      }

      // إذا كان أمرًا يحتاج قاعدة بيانات (إضافة / تعديل / حذف)
      if (analysis.action && /(create|update|delete)/i.test(analysis.action)) {
        const summary = this.describeAction(analysis.action, analysis.parameters, lang);
        return {
          needsConfirmation: true,
          summary,
          pendingAction: {
            action: analysis.action,
            parameters: analysis.parameters,
            language: lang,
          },
        };
      }

      // الرد العام (استفسار أو تحليلي)
      return this.respond(lang, analysis.response || "تم تحليل طلبك.", "Your request has been processed.");
    } catch (error) {
      console.error("❌ Error in handleUserCommand:", error);
      return this.respond("ar", "حدث خطأ أثناء تحليل الأمر.", "An error occurred while processing the command.");
    }
  }

  /**
   * 🔹 تنفيذ الأوامر بعد تأكيد المستخدم
   */
  static async confirmAndExecute(userId: number, pendingAction: PendingAction) {
    const { action, parameters, language } = pendingAction;
    try {
      let sql = "";
      let values: any[] = [];
      let resultMessage = "";

      /**
       * 🧾 أوامر الطلبات
       */
      if (action.includes("create_order")) {
        sql = `
          INSERT INTO orders (order_number, customer_id, status, created_at)
          VALUES ($1, $2, 'pending', NOW())
          RETURNING id, order_number;
        `;
        values = [
          parameters?.order_number || `ORD-${Date.now()}`,
          parameters?.customer_id,
        ];
        const res = await db.query(sql, values);
        resultMessage = language === "ar"
          ? `✅ تم إنشاء الطلب بنجاح (رقم ${res.rows[0].order_number})`
          : `✅ Order created successfully (No. ${res.rows[0].order_number})`;
      }

      if (action.includes("update_order")) {
        sql = `UPDATE orders SET status = $1 WHERE id = $2 RETURNING order_number;`;
        values = [parameters?.status || "updated", parameters?.id];
        const res = await db.query(sql, values);
        resultMessage = language === "ar"
          ? `✏️ تم تحديث حالة الطلب رقم ${res.rows[0]?.order_number || parameters?.id}`
          : `✏️ Order ${res.rows[0]?.order_number || parameters?.id} updated successfully.`;
      }

      if (action.includes("delete_order")) {
        sql = `DELETE FROM orders WHERE id = $1 RETURNING id;`;
        values = [parameters?.id];
        await db.query(sql, values);
        resultMessage = language === "ar"
          ? `🗑️ تم حذف الطلب رقم ${parameters?.id}.`
          : `🗑️ Order ${parameters?.id} deleted.`;
      }

      /**
       * 🎞️ أوامر الرولات
       */
      if (action.includes("create_roll")) {
        sql = `
          INSERT INTO rolls (roll_number, job_order_id, weight, status, machine_id, employee_id, created_at)
          VALUES ($1, $2, $3, 'for_printing', $4, $5, NOW())
          RETURNING id, roll_number;
        `;
        values = [
          parameters?.roll_number || `R-${Date.now()}`,
          parameters?.job_order_id,
          parameters?.weight || 0,
          parameters?.machine_id,
          parameters?.employee_id,
        ];
        const res = await db.query(sql, values);
        resultMessage = language === "ar"
          ? `🎞️ تم تسجيل رول جديد (${res.rows[0].roll_number})`
          : `🎞️ New roll created (${res.rows[0].roll_number})`;
      }

      /**
       * 🧰 الصيانة
       */
      if (action.includes("create_maintenance")) {
        sql = `
          INSERT INTO maintenance_requests (machine_id, reported_by, issue_type, description, urgency_level, status)
          VALUES ($1, $2, $3, $4, $5, 'open') RETURNING id;
        `;
        values = [
          parameters?.machine_id,
          parameters?.reported_by,
          parameters?.issue_type || "general",
          parameters?.description || "",
          parameters?.urgency_level || "normal",
        ];
        const res = await db.query(sql, values);
        resultMessage = language === "ar"
          ? `🧰 تم تسجيل بلاغ صيانة (${res.rows[0].id}).`
          : `🧰 Maintenance request created (ID ${res.rows[0].id}).`;
      }

      /**
       * 🧍‍♂️ العملاء
       */
      if (action.includes("create_customer")) {
        sql = `
          INSERT INTO customers (id, name, phone, city, address, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id;
        `;
        values = [
          parameters?.code || `C-${Date.now()}`,
          parameters?.name,
          parameters?.phone,
          parameters?.city,
          parameters?.address,
        ];
        const res = await db.query(sql, values);
        resultMessage = language === "ar"
          ? `👤 تم تسجيل عميل جديد (${parameters?.name}).`
          : `👤 New customer created (${parameters?.name}).`;
      }

      /**
       * 🏭 الجودة / الإنتاج
       */
      if (action.includes("create_quality_check")) {
        sql = `
          INSERT INTO quality_checks (target_type, target_id, result, score, notes, checked_by)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
        `;
        values = [
          parameters?.target_type,
          parameters?.target_id,
          parameters?.result || "pass",
          parameters?.score || 100,
          parameters?.notes || "",
          parameters?.checked_by,
        ];
        const res = await db.query(sql, values);
        resultMessage = language === "ar"
          ? `📋 تم تسجيل فحص جودة (${res.rows[0].id}).`
          : `📋 Quality check recorded (ID ${res.rows[0].id}).`;
      }

      /**
       * 🔍 تحليل البيانات
       */
      if (action.includes("analyze_performance")) {
        const data = await mlService.analyzeProductionEfficiency();
        resultMessage = language === "ar"
          ? `📊 تقرير الأداء:\n${data.summary_ar}`
          : `📊 Performance Report:\n${data.summary_en}`;
      }

      /**
       * 🧠 تسجيل تعلم
       */
      await AILearning.recordLearningData(
        userId,
        action,
        JSON.stringify(parameters),
        true,
        0,
      );

      return { status: "success", message: resultMessage };
    } catch (error: any) {
      console.error("❌ Execution Error:", error);
      return this.respond(language, "فشل تنفيذ العملية.", "Execution failed.");
    }
  }

  /**
   * 🔹 وصف موجز للأوامر للتأكيد
   */
  private static describeAction(action: string, params?: Record<string, any>, lang: string = "ar") {
    const texts = {
      create_order: {
        ar: `إنشاء طلب جديد للعميل ${params?.customer_id || "?"}`,
        en: `Create new order for customer ${params?.customer_id || "?"}`,
      },
      create_roll: {
        ar: `تسجيل رول جديد للمكينة ${params?.machine_id || "?"}`,
        en: `Create new roll for machine ${params?.machine_id || "?"}`,
      },
      create_customer: {
        ar: `إضافة عميل جديد (${params?.name || "?"})`,
        en: `Add new customer (${params?.name || "?"})`,
      },
      create_maintenance: {
        ar: `تسجيل بلاغ صيانة للمكينة ${params?.machine_id || "?"}`,
        en: `Log maintenance request for machine ${params?.machine_id || "?"}`,
      },
      delete_order: {
        ar: `حذف الطلب رقم ${params?.id || "?"}`,
        en: `Delete order ${params?.id || "?"}`,
      },
    };
    const key = Object.keys(texts).find((k) => action.includes(k));
    return key ? texts[key][lang] : action;
  }

  /**
   * 🔹 رد متعدد اللغات
   */
  private static respond(lang: string, ar: string, en: string) {
    return {
      needsConfirmation: false,
      status: "info",
      message: lang === "ar" ? ar : en,
    };
  }
}

export const AIOrchestratorInstance = new AIOrchestrator();
