// ===============================================
// 🔹 MPBF Next AI Schema & Relational Mapper
// ===============================================
// Author: أبوخالد
// Description: Core schema and relationship intelligence
// ===============================================

import { Pool } from "pg";

// إنشاء الاتصال بقاعدة PostgreSQL باستخدام متغيرات البيئة
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ========================
// 1️⃣ تعريف الجداول
// ========================

export const AISchema = [
  {
    name: "customers",
    description: "بيانات العملاء والموردين",
    fields: [
      { name: "id", type: "varchar(20)" },
      { name: "name", type: "varchar(200)" },
      { name: "name_ar", type: "varchar(200)" },
      { name: "city", type: "varchar(50)" },
      { name: "address", type: "text" },
      { name: "tax_number", type: "varchar(20)" },
      { name: "phone", type: "varchar(20)" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "orders",
    description: "طلبات العملاء المرتبطة بالإنتاج",
    fields: [
      { name: "id", type: "serial" },
      { name: "order_number", type: "varchar(50)" },
      { name: "customer_id", type: "varchar(20)" },
      { name: "status", type: "varchar(30)" },
      { name: "created_at", type: "timestamp" },
      { name: "delivery_date", type: "date" },
    ],
  },
  {
    name: "production_orders",
    description: "أوامر التشغيل المرتبطة بالطلبات",
    fields: [
      { name: "id", type: "serial" },
      { name: "job_number", type: "varchar(50)" },
      { name: "order_id", type: "integer" },
      { name: "quantity_required", type: "numeric(10,2)" },
      { name: "quantity_produced", type: "numeric(10,2)" },
      { name: "status", type: "varchar(30)" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "rolls",
    description: "الرولات المنتجة خلال العمليات الإنتاجية",
    fields: [
      { name: "id", type: "serial" },
      { name: "roll_number", type: "varchar(50)" },
      { name: "job_order_id", type: "integer" },
      { name: "weight", type: "numeric(8,2)" },
      { name: "machine_id", type: "integer" },
      { name: "employee_id", type: "integer" },
      { name: "status", type: "varchar(30)" },
      { name: "current_stage", type: "varchar(30)" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "machines",
    description: "معلومات المكائن وأقسامها",
    fields: [
      { name: "id", type: "serial" },
      { name: "name", type: "varchar(100)" },
      { name: "name_ar", type: "varchar(100)" },
      { name: "type", type: "varchar(50)" },
      { name: "status", type: "varchar(20)" },
      { name: "section_id", type: "integer" },
    ],
  },
  {
    name: "maintenance_requests",
    description: "طلبات الصيانة ومتابعتها",
    fields: [
      { name: "id", type: "serial" },
      { name: "machine_id", type: "integer" },
      { name: "issue_type", type: "varchar(50)" },
      { name: "description", type: "text" },
      { name: "urgency_level", type: "varchar(20)" },
      { name: "status", type: "varchar(20)" },
      { name: "date_reported", type: "timestamp" },
    ],
  },
  {
    name: "waste",
    description: "بيانات الهدر الناتج أثناء الإنتاج",
    fields: [
      { name: "id", type: "serial" },
      { name: "roll_id", type: "integer" },
      { name: "job_order_id", type: "integer" },
      { name: "quantity_wasted", type: "numeric(8,2)" },
      { name: "reason", type: "varchar(100)" },
      { name: "stage", type: "varchar(50)" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "quality_checks",
    description: "نتائج فحوصات الجودة للمراحل المختلفة",
    fields: [
      { name: "id", type: "serial" },
      { name: "target_type", type: "varchar(20)" },
      { name: "target_id", type: "integer" },
      { name: "result", type: "varchar(10)" },
      { name: "score", type: "integer" },
      { name: "notes", type: "text" },
      { name: "checked_by", type: "integer" },
      { name: "created_at", type: "timestamp" },
    ],
  },
];

// ========================
// 2️⃣ مولد العلاقات الذكي
// ========================

export class RelationalMapper {
  private schema: any[];

  constructor(schema = AISchema) {
    this.schema = schema;
  }

  // 🔍 تحليل العلاقات بناءً على أسماء الحقول تلقائيًا
  inferRelations() {
    const relations: any[] = [];
    for (const table of this.schema) {
      for (const field of table.fields) {
        if (field.name.endsWith("_id")) {
          const refTable = this.schema.find((t) =>
            field.name.startsWith(t.name.slice(0, -1))
          );
          if (refTable) {
            relations.push({
              from: `${table.name}.${field.name}`,
              to: `${refTable.name}.id`,
            });
          }
        }
      }
    }
    return relations;
  }

  // 🧭 توليد JOIN تلقائي بين الجداول
  buildJoinPath(fromTable: string, toTable: string) {
    const relations = this.inferRelations();
    const path: string[] = [];

    const dfs = (current: string, target: string, visited = new Set()) => {
      if (current === target) return true;
      visited.add(current);
      for (const rel of relations) {
        const [tbl1] = rel.from.split(".");
        const [tbl2] = rel.to.split(".");
        if (tbl1 === current && !visited.has(tbl2)) {
          path.push(`${tbl1} → ${tbl2}`);
          if (dfs(tbl2, target, visited)) return true;
        }
      }
      return false;
    };

    dfs(fromTable, toTable);
    return path;
  }

  // 🧠 استنتاج الجداول ذات العلاقة من نص استعلام طبيعي
  detectRelatedTables(query: string): string[] {
    const tables: string[] = [];
    for (const tbl of this.schema) {
      const keywords = [
        tbl.name,
        tbl.description,
        ...tbl.fields.map((f) => f.name),
      ]
        .join(" ")
        .toLowerCase();
      if (query.toLowerCase().includes(tbl.name) || query.toLowerCase().includes(tbl.description || "")) {
        tables.push(tbl.name);
      }
    }
    return tables.length ? tables : ["orders"];
  }
}

// ✅ إنشاء نسخة عامة
export const relationalMapper = new RelationalMapper(AISchema);
// ========================
// 3️⃣ محلل اللغة الطبيعية إلى SQL
// ========================

import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class NaturalSQL {
  async interpret(message: string): Promise<string> {
    const relations = relationalMapper.inferRelations();

    const prompt = `
أنت محلل أوامر ذكي داخل نظام إدارة مصنع أكياس بلاستيك (MPBF Next).
مهمتك: تحويل أوامر المستخدم (بالعربية أو الإنجليزية) إلى استعلام SQL آمن لقاعدة بيانات PostgreSQL.

🧩 قاعدة البيانات تحتوي على الجداول التالية:
${AISchema.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

🔗 العلاقات بين الجداول:
${relations.map((r) => `${r.from} → ${r.to}`).join("\n")}

🧠 التعليمات:
- لا تستخدم * أبداً، حدّد الأعمدة المهمة فقط.
- أضف LIMIT 10 للاستعلامات العامة.
- لا تعدّل أو تحذف بيانات إلا بطلب واضح من المستخدم.
- الاستعلام يجب أن يكون صحيح وقابل للتنفيذ في PostgreSQL.
- إذا لم يكن من المنطقي تنفيذ العملية، أرجع تعليقاً بدلاً من SQL.

الرسالة:
"${message}"

أجب فقط بـ SQL صالح أو تعليق يبدأ بـ "--" إن لم يمكن توليد SQL.
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 600,
      temperature: 0.2,
    });

    return res.choices[0].message.content?.trim() || "-- No SQL generated";
  }
}

export const naturalSQL = new NaturalSQL();

// ========================
// 4️⃣ منفذ الاستعلامات الذكي
// ========================

export class SQLExecutor {
  async execute(sql: string): Promise<any> {
    if (sql.startsWith("--")) {
      return { message: sql.replace("--", "").trim(), data: [] };
    }

    try {
      const result = await db.query(sql);
      return { message: "✅ تم تنفيذ العملية بنجاح", data: result.rows };
    } catch (err: any) {
      return {
        message: `❌ خطأ في تنفيذ الاستعلام: ${err.message}`,
        data: [],
      };
    }
  }

  formatMarkdown(data: any[], title = "النتائج"): string {
    if (!data || data.length === 0)
      return "ℹ️ لا توجد نتائج مطابقة للاستعلام.";

    const keys = Object.keys(data[0]);
    let output = `## 📊 ${title}\n\n| ${keys.join(" | ")} |\n| ${keys
      .map(() => "---")
      .join(" | ")} |\n`;

    for (const row of data) {
      output +=
        "| " +
        keys.map((k) => (row[k] !== null ? row[k] : "-")).join(" | ") +
        " |\n";
    }

    return output;
  }
}

export const sqlExecutor = new SQLExecutor();

// ========================
// 5️⃣ المساعد الذكي الشامل
// ========================

export class AIFactoryBrain {
  async handleUserQuery(message: string): Promise<string> {
    try {
      // تحديد اللغة (عربية أو إنجليزية)
      const isArabic = /[ء-ي]/.test(message);

      // تحليل الجداول ذات العلاقة
      const tables = relationalMapper.detectRelatedTables(message);

      // توليد SQL
      const sql = await naturalSQL.interpret(message);

      // تنفيذ فعلي
      const result = await sqlExecutor.execute(sql);

      // تنسيق النتائج
      let response = sqlExecutor.formatMarkdown(result.data, "نتائج الاستعلام");

      // إضافة توضيح
      const langNote = isArabic
        ? "🧠 تمت معالجة الاستعلام بالعربية بنجاح."
        : "🧠 Query processed successfully in English.";

      return `### 🤖 مساعد المصنع الذكي (MPBF Next)\n\n**الأمر:** ${message}\n\n**الجدول المستهدف:** ${tables.join(
        ", "
      )}\n\n**الاستعلام المولد:**\n\`\`\`sql\n${sql}\n\`\`\`\n\n${response}\n\n${langNote}`;
    } catch (err: any) {
      return `⚠️ حدث خطأ أثناء المعالجة: ${err.message}`;
    }
  }
}

// ✅ تهيئة المساعد
export const aiFactoryBrain = new AIFactoryBrain();

// ========================
// 🧩 مثال للاستخدام
// ========================
// import { aiFactoryBrain } from "./ai-schema";
// const reply = await aiFactoryBrain.handleUserQuery("اعطني آخر 5 رولات من ماكينة رقم 4");
// console.log(reply);

// ========================
// 🔚 نهاية الملف
// ========================
