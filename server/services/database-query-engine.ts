// ===============================================
// 🔹 Enhanced Database Query Engine for AI
// ===============================================
// Description: Intelligent database querying with error handling and learning
// ===============================================

import { db } from "./ai-schema";
import { AILearning } from "./ai-learning";

export interface QueryResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount?: number;
  executionTime?: number;
}

export interface DatabaseSchema {
  name: string;
  arabicName: string;
  description: string;
  primaryKey: string;
  foreignKeys: Array<{
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }>;
  searchableFields: string[];
  commonQueries: string[];
}

// مخطط قاعدة البيانات المحسّن
export const enhancedDatabaseSchema: DatabaseSchema[] = [
  {
    name: "customers",
    arabicName: "العملاء",
    description: "بيانات العملاء والموردين - معلومات الاتصال والمناطق",
    primaryKey: "id",
    foreignKeys: [
      { column: "sales_rep_id", referencedTable: "users", referencedColumn: "id" }
    ],
    searchableFields: ["name", "name_ar", "phone", "city"],
    commonQueries: [
      "البحث عن عميل بالاسم أو رقم الهاتف",
      "عرض جميع عملاء مدينة معينة",
      "إحصاء العملاء حسب المندوب"
    ]
  },
  {
    name: "orders",
    arabicName: "الطلبات",
    description: "طلبات العملاء الرئيسية مع الحالة والقيمة",
    primaryKey: "id",
    foreignKeys: [
      { column: "customer_id", referencedTable: "customers", referencedColumn: "id" }
    ],
    searchableFields: ["order_number"],
    commonQueries: [
      "البحث عن طلب برقم الطلب",
      "عرض طلبات عميل معين",
      "إحصاء الطلبات حسب الحالة"
    ]
  },
  {
    name: "production_orders",
    arabicName: "أوامر الإنتاج",
    description: "أوامر الإنتاج المرتبطة بالطلبات مع تفاصيل الكميات والمراحل",
    primaryKey: "id",
    foreignKeys: [
      { column: "order_id", referencedTable: "orders", referencedColumn: "id" },
      { column: "customer_product_id", referencedTable: "customer_products", referencedColumn: "id" }
    ],
    searchableFields: ["production_order_number"],
    commonQueries: [
      "البحث عن أمر إنتاج برقمه",
      "عرض أوامر إنتاج نشطة",
      "تتبع تقدم أمر إنتاج معين"
    ]
  },
  {
    name: "rolls",
    arabicName: "الرولات",
    description: "الرولات المنتجة عبر مراحل الفيلم والطباعة والقص",
    primaryKey: "id",
    foreignKeys: [
      { column: "production_order_id", referencedTable: "production_orders", referencedColumn: "id" },
      { column: "film_machine_id", referencedTable: "machines", referencedColumn: "id" },
      { column: "printing_machine_id", referencedTable: "machines", referencedColumn: "id" },
      { column: "cutting_machine_id", referencedTable: "machines", referencedColumn: "id" },
      { column: "created_by", referencedTable: "users", referencedColumn: "id" },
      { column: "printed_by", referencedTable: "users", referencedColumn: "id" },
      { column: "cut_by", referencedTable: "users", referencedColumn: "id" }
    ],
    searchableFields: ["roll_number"],
    commonQueries: [
      "البحث عن رول برقمه",
      "عرض رولات في مرحلة معينة",
      "إحصاء الرولات حسب الماكينة أو المرحلة"
    ]
  },
  {
    name: "machines",
    arabicName: "المكائن",
    description: "معلومات المكائن في أقسام المصنع مع الحالة والقدرات",
    primaryKey: "id",
    foreignKeys: [
      { column: "section_id", referencedTable: "sections", referencedColumn: "id" }
    ],
    searchableFields: ["name", "name_ar"],
    commonQueries: [
      "البحث عن ماكينة بالاسم",
      "عرض مكائن قسم معين",
      "إحصاء المكائن حسب الحالة أو النوع"
    ]
  },
  {
    name: "inventory",
    arabicName: "المخزون",
    description: "المخزون الحالي للمواد مع الكميات والمواقع",
    primaryKey: "id",
    foreignKeys: [
      { column: "item_id", referencedTable: "items", referencedColumn: "id" },
      { column: "location_id", referencedTable: "locations", referencedColumn: "id" }
    ],
    searchableFields: ["item_id"],
    commonQueries: [
      "البحث عن كمية صنف معين",
      "عرض أصناف أقل من الحد الأدنى",
      "إحصاء المخزون حسب الفئة"
    ]
  },
  {
    name: "users",
    arabicName: "المستخدمون",
    description: "المستخدمون والموظفون مع الصلاحيات والأقسام",
    primaryKey: "id",
    foreignKeys: [
      { column: "role_id", referencedTable: "roles", referencedColumn: "id" }
    ],
    searchableFields: ["username", "full_name"],
    commonQueries: [
      "البحث عن مستخدم بالاسم",
      "عرض مستخدمي قسم معين",
      "إحصاء المستخدمين حسب الدور"
    ]
  }
];

export class DatabaseQueryEngine {
  
  /**
   * البحث الذكي في قاعدة البيانات
   */
  async smartSearch(tableName: string, searchTerm: string, userId?: number): Promise<QueryResult> {
    const startTime = Date.now();
    
    try {
      // 1️⃣ التحقق من أن الجدول في القائمة البيضاء
      const schema = enhancedDatabaseSchema.find(s => s.name === tableName);
      if (!schema) {
        return {
          success: false,
          error: `جدول "${tableName}" غير موجود في قاعدة البيانات`
        };
      }

      if (schema.searchableFields.length === 0) {
        return {
          success: false,
          error: `جدول "${tableName}" لا يدعم البحث النصي`
        };
      }

      // 2️⃣ التحقق من أن اسم الجدول آمن (whitelist فقط)
      const allowedTables = enhancedDatabaseSchema.map(s => s.name);
      if (!allowedTables.includes(tableName)) {
        return {
          success: false,
          error: `جدول "${tableName}" غير مسموح به`
        };
      }

      // 3️⃣ التحقق من أن الحقول آمنة (whitelist فقط)
      const allowedFields = schema.searchableFields;
      const invalidFields = allowedFields.filter(f => !/^[a-z_]+$/i.test(f));
      if (invalidFields.length > 0) {
        return {
          success: false,
          error: `حقول غير صحيحة: ${invalidFields.join(', ')}`
        };
      }

      // 4️⃣ إنشاء استعلام بحث آمن باستخدام parameterized query
      const searchConditions = allowedFields
        .map(field => `${field}::text ILIKE $1`)
        .join(' OR ');

      // 5️⃣ استخدام parameterized query مع التحقق من الجدول
      const query = `
        SELECT * FROM ${tableName}
        WHERE ${searchConditions}
        LIMIT 50
      `;

      const result = await db.query(query, [`%${searchTerm}%`]);
      const executionTime = Date.now() - startTime;

      // تسجيل العملية للتعلم
      if (userId) {
        await AILearning.recordLearningData(
          userId,
          "database_search",
          `البحث في ${tableName} عن "${searchTerm}"`,
          true,
          executionTime
        );
      }

      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount || 0,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // تسجيل الخطأ للتعلم
      if (userId) {
        await AILearning.recordLearningData(
          userId,
          "database_search",
          `البحث في ${tableName} عن "${searchTerm}"`,
          false,
          executionTime
        );
      }

      return {
        success: false,
        error: `فشل البحث: ${error.message}`,
        executionTime
      };
    }
  }

  /**
   * تنفيذ استعلام SQL آمن (قراءة فقط)
   */
  async executeSafeQuery(sql: string, params: any[] = [], userId?: number): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // 1️⃣ فحص أمان الاستعلام
      const safetyCheck = this.checkQuerySafety(sql);
      if (!safetyCheck.isSafe) {
        return {
          success: false,
          error: `تم رفض الاستعلام لأسباب أمنية: ${safetyCheck.reason}`
        };
      }

      // 2️⃣ التحقق من أن الجداول المستخدمة في القائمة البيضاء
      const usedTables = this.extractTableNames(sql);
      const allowedTables = enhancedDatabaseSchema.map(s => s.name);
      const unauthorizedTables = usedTables.filter(t => !allowedTables.includes(t));
      
      if (unauthorizedTables.length > 0) {
        return {
          success: false,
          error: `جداول غير مسموح بها: ${unauthorizedTables.join(', ')}`
        };
      }

      // 3️⃣ تنفيذ الاستعلام
      const result = await db.query(sql, params);
      const executionTime = Date.now() - startTime;

      // تسجيل العملية الناجحة
      if (userId) {
        await AILearning.recordLearningData(
          userId,
          "sql_query",
          sql.substring(0, 100),
          true,
          executionTime
        );
      }

      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount || 0,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // تسجيل الخطأ للتعلم
      if (userId) {
        await AILearning.recordLearningData(
          userId,
          "sql_query",
          sql.substring(0, 100),
          false,
          executionTime
        );
      }

      return {
        success: false,
        error: `فشل تنفيذ الاستعلام: ${error.message}`,
        executionTime
      };
    }
  }

  /**
   * فحص أمان الاستعلام (محسّن)
   */
  private checkQuerySafety(sql: string): { isSafe: boolean; reason?: string } {
    // 1️⃣ فحص العمليات الخطيرة
    const dangerousPatterns = [
      { pattern: /DELETE\s+FROM/i, reason: "عمليات الحذف غير مسموحة" },
      { pattern: /DROP\s+(TABLE|DATABASE|SCHEMA)/i, reason: "عمليات DROP غير مسموحة" },
      { pattern: /TRUNCATE/i, reason: "عملية TRUNCATE غير مسموحة" },
      { pattern: /ALTER\s+(TABLE|DATABASE)/i, reason: "عمليات ALTER غير مسموحة" },
      { pattern: /UPDATE\s+/i, reason: "عمليات UPDATE غير مسموحة" },
      { pattern: /INSERT\s+INTO/i, reason: "عمليات INSERT غير مسموحة" },
      { pattern: /CREATE\s+(TABLE|DATABASE)/i, reason: "عمليات CREATE غير مسموحة" },
      { pattern: /GRANT\s+/i, reason: "عمليات GRANT غير مسموحة" },
      { pattern: /REVOKE\s+/i, reason: "عمليات REVOKE غير مسموحة" }
    ];

    for (const { pattern, reason } of dangerousPatterns) {
      if (pattern.test(sql)) {
        return { isSafe: false, reason };
      }
    }

    // 2️⃣ فحص محاولات SQL injection
    const injectionPatterns = [
      { pattern: /;\s*DROP/i, reason: "محاولة SQL injection مكتشفة" },
      { pattern: /;\s*DELETE/i, reason: "محاولة SQL injection مكتشفة" },
      { pattern: /--\s*$/m, reason: "تعليقات SQL مشبوهة" },
      { pattern: /\/\*.*\*\//s, reason: "تعليقات SQL block مشبوهة" },
      { pattern: /UNION\s+SELECT/i, reason: "محاولة UNION attack" },
      { pattern: /xp_cmdshell/i, reason: "محاولة تنفيذ أوامر النظام" }
    ];

    for (const { pattern, reason } of injectionPatterns) {
      if (pattern.test(sql)) {
        return { isSafe: false, reason };
      }
    }

    // 3️⃣ التأكد من أنه استعلام SELECT فقط
    if (!/^\s*SELECT/i.test(sql.trim())) {
      return { isSafe: false, reason: "يُسمح فقط باستعلامات SELECT" };
    }

    return { isSafe: true };
  }

  /**
   * استخراج أسماء الجداول من استعلام SQL
   */
  private extractTableNames(sql: string): string[] {
    const tables: string[] = [];
    
    // البحث عن FROM table_name
    const fromMatches = sql.matchAll(/FROM\s+([a-z_]+)/gi);
    for (const match of fromMatches) {
      tables.push(match[1].toLowerCase());
    }

    // البحث عن JOIN table_name
    const joinMatches = sql.matchAll(/JOIN\s+([a-z_]+)/gi);
    for (const match of joinMatches) {
      tables.push(match[1].toLowerCase());
    }

    return [...new Set(tables)]; // إزالة التكرار
  }

  /**
   * الحصول على معلومات عن جدول
   */
  getTableInfo(tableName: string): DatabaseSchema | null {
    return enhancedDatabaseSchema.find(s => s.name === tableName) || null;
  }

  /**
   * البحث عن جداول متعلقة
   */
  findRelatedTables(tableName: string): string[] {
    const relatedTables = new Set<string>();
    const schema = this.getTableInfo(tableName);

    if (!schema) return [];

    // إضافة الجداول المرتبطة عبر foreign keys
    schema.foreignKeys.forEach(fk => {
      relatedTables.add(fk.referencedTable);
    });

    // إضافة الجداول التي تشير إلى هذا الجدول
    enhancedDatabaseSchema.forEach(s => {
      s.foreignKeys.forEach(fk => {
        if (fk.referencedTable === tableName) {
          relatedTables.add(s.name);
        }
      });
    });

    return Array.from(relatedTables);
  }

  /**
   * توليد اقتراحات استعلام ذكية
   */
  suggestQueries(userIntent: string): string[] {
    const suggestions: string[] = [];

    enhancedDatabaseSchema.forEach(schema => {
      schema.commonQueries.forEach(query => {
        if (query.toLowerCase().includes(userIntent.toLowerCase())) {
          suggestions.push(`${schema.arabicName}: ${query}`);
        }
      });
    });

    return suggestions;
  }
}

export const queryEngine = new DatabaseQueryEngine();
