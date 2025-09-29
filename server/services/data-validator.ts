import type { IStorage } from "../storage";
import { getAlertManager } from "./alert-manager";
import { z } from "zod";

/**
 * أنواع قواعد التحقق
 */
export interface ValidationRule {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  table: string;
  field: string;
  rule_type:
    | "required"
    | "min"
    | "max"
    | "range"
    | "pattern"
    | "custom"
    | "reference";
  parameters: Record<string, any>;
  error_message: string;
  error_message_ar: string;
  severity: "low" | "medium" | "high" | "critical";
  is_enabled: boolean;
}

/**
 * نتيجة التحقق
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  message_ar: string;
  severity: string;
  rule_id: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  message_ar: string;
  suggestion?: string;
  suggestion_ar?: string;
}

/**
 * نظام التحقق من صحة البيانات وفحص الأخطاء
 */
export class DataValidator {
  private storage: IStorage;
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private customValidators: Map<string, Function> = new Map();

  constructor(storage: IStorage) {
    this.storage = storage;

    console.log("[DataValidator] نظام التحقق من صحة البيانات مُفعل");
    this.initialize();
  }

  /**
   * تشغيل النظام
   */
  private async initialize(): Promise<void> {
    try {
      // تحميل قواعد التحقق الافتراضية
      await this.loadDefaultValidationRules();

      // تسجيل المدققات المخصصة
      this.registerCustomValidators();

      console.log("[DataValidator] تم تشغيل نظام التحقق من البيانات بنجاح ✅");
    } catch (error) {
      console.error(
        "[DataValidator] خطأ في تشغيل نظام التحقق من البيانات:",
        error,
      );
    }
  }

  /**
   * تحميل قواعد التحقق الافتراضية
   */
  private async loadDefaultValidationRules(): Promise<void> {
    try {
      const defaultRules: ValidationRule[] = [
        // قواعد الطلبات
        {
          id: "order_customer_required",
          name: "Customer Required",
          name_ar: "العميل مطلوب",
          description: "Customer must be specified for all orders",
          description_ar: "يجب تحديد العميل لجميع الطلبات",
          table: "orders",
          field: "customer_id",
          rule_type: "required",
          parameters: {},
          error_message: "Customer is required",
          error_message_ar: "العميل مطلوب",
          severity: "high",
          is_enabled: true,
        },
        {
          id: "order_quantity_positive",
          name: "Positive Quantity",
          name_ar: "كمية موجبة",
          description: "Order quantity must be positive",
          description_ar: "يجب أن تكون كمية الطلب موجبة",
          table: "orders",
          field: "quantity",
          rule_type: "min",
          parameters: { min: 1 },
          error_message: "Quantity must be positive",
          error_message_ar: "يجب أن تكون الكمية موجبة",
          severity: "high",
          is_enabled: true,
        },
        {
          id: "order_delivery_date_future",
          name: "Future Delivery Date",
          name_ar: "تاريخ تسليم مستقبلي",
          description: "Delivery date must be in the future",
          description_ar: "يجب أن يكون تاريخ التسليم في المستقبل",
          table: "orders",
          field: "delivery_date",
          rule_type: "custom",
          parameters: { validator: "future_date" },
          error_message: "Delivery date must be in the future",
          error_message_ar: "يجب أن يكون تاريخ التسليم في المستقبل",
          severity: "medium",
          is_enabled: true,
        },

        // قواعد المنتجات
        {
          id: "product_dimensions_positive",
          name: "Positive Dimensions",
          name_ar: "أبعاد موجبة",
          description: "Product dimensions must be positive",
          description_ar: "يجب أن تكون أبعاد المنتج موجبة",
          table: "customer_products",
          field: "width",
          rule_type: "min",
          parameters: { min: 0.1 },
          error_message: "Width must be positive",
          error_message_ar: "يجب أن يكون العرض موجب",
          severity: "high",
          is_enabled: true,
        },
        {
          id: "product_thickness_range",
          name: "Thickness Range",
          name_ar: "نطاق السماكة",
          description: "Product thickness must be within valid range",
          description_ar: "يجب أن تكون سماكة المنتج ضمن النطاق المسموح",
          table: "customer_products",
          field: "thickness",
          rule_type: "range",
          parameters: { min: 0.01, max: 10 },
          error_message: "Thickness must be between 0.01 and 10 mm",
          error_message_ar: "يجب أن تكون السماكة بين 0.01 و 10 مم",
          severity: "medium",
          is_enabled: true,
        },

        // قواعد المخزون
        {
          id: "inventory_stock_negative",
          name: "Negative Stock Check",
          name_ar: "فحص المخزون السالب",
          description: "Stock quantity should not be negative",
          description_ar: "يجب ألا تكون كمية المخزون سالبة",
          table: "inventory",
          field: "current_stock",
          rule_type: "min",
          parameters: { min: 0 },
          error_message: "Stock quantity cannot be negative",
          error_message_ar: "لا يمكن أن تكون كمية المخزون سالبة",
          severity: "critical",
          is_enabled: true,
        },

        // قواعد المكائن
        {
          id: "machine_capacity_positive",
          name: "Positive Capacity",
          name_ar: "طاقة موجبة",
          description: "Machine capacity must be positive",
          description_ar: "يجب أن تكون طاقة الماكينة موجبة",
          table: "machines",
          field: "capacity",
          rule_type: "min",
          parameters: { min: 1 },
          error_message: "Machine capacity must be positive",
          error_message_ar: "يجب أن تكون طاقة الماكينة موجبة",
          severity: "medium",
          is_enabled: true,
        },

        // قواعد المستخدمين
        {
          id: "user_username_format",
          name: "Username Format",
          name_ar: "تنسيق اسم المستخدم",
          description: "Username must follow proper format",
          description_ar: "يجب أن يتبع اسم المستخدم التنسيق الصحيح",
          table: "users",
          field: "username",
          rule_type: "pattern",
          parameters: { pattern: "^[a-zA-Z0-9_]{3,20}$" },
          error_message:
            "Username must be 3-20 characters (letters, numbers, underscore)",
          error_message_ar:
            "يجب أن يكون اسم المستخدم 3-20 حرف (أحرف، أرقام، شرطة)",
          severity: "medium",
          is_enabled: true,
        },

        // قواعد المراجع
        {
          id: "customer_reference_valid",
          name: "Valid Customer Reference",
          name_ar: "مرجع عميل صحيح",
          description: "Customer reference must exist",
          description_ar: "يجب أن يكون مرجع العميل موجود",
          table: "orders",
          field: "customer_id",
          rule_type: "reference",
          parameters: { reference_table: "customers", reference_field: "id" },
          error_message: "Invalid customer reference",
          error_message_ar: "مرجع عميل غير صحيح",
          severity: "critical",
          is_enabled: true,
        },
      ];

      // تنظيم القواعد حسب الجدول
      this.validationRules.clear();
      for (const rule of defaultRules) {
        if (!this.validationRules.has(rule.table)) {
          this.validationRules.set(rule.table, []);
        }
        this.validationRules.get(rule.table)?.push(rule);
      }

      console.log(
        `[DataValidator] تم تحميل ${defaultRules.length} قاعدة تحقق افتراضية`,
      );
    } catch (error) {
      console.error("[DataValidator] خطأ في تحميل قواعد التحقق:", error);
    }
  }

  /**
   * تسجيل المدققات المخصصة
   */
  private registerCustomValidators(): void {
    // مدقق التاريخ المستقبلي
    this.customValidators.set("future_date", (value: any) => {
      if (!value) return true;
      const date = new Date(value);
      return date > new Date();
    });

    // مدقق تنسيق رقم الهاتف
    this.customValidators.set("phone_format", (value: any) => {
      if (!value) return true;
      const phoneRegex = /^(\+966|966|0)?[5-9][0-9]{8}$/;
      return phoneRegex.test(value.toString());
    });

    // مدقق تنسيق البريد الإلكتروني
    this.customValidators.set("email_format", (value: any) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value.toString());
    });

    // مدقق النطاق الزمني
    this.customValidators.set("business_hours", (value: any) => {
      if (!value) return true;
      const hour = new Date(value).getHours();
      return hour >= 6 && hour <= 22; // 6 صباحاً إلى 10 مساءً
    });

    console.log("[DataValidator] تم تسجيل المدققات المخصصة");
  }

  /**
   * التحقق من صحة البيانات
   */
  async validateData(
    tableName: string,
    data: Record<string, any>,
    isUpdate: boolean = false,
  ): Promise<ValidationResult> {
    try {
      const rules = this.validationRules.get(tableName) || [];
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      for (const rule of rules) {
        if (!rule.is_enabled) continue;

        const fieldValue = data[rule.field];
        const isValid = await this.applyRule(rule, fieldValue, data);

        if (!isValid) {
          if (rule.severity === "critical" || rule.severity === "high") {
            errors.push({
              field: rule.field,
              message: rule.error_message,
              message_ar: rule.error_message_ar,
              severity: rule.severity,
              rule_id: rule.id,
              value: fieldValue,
            });
          } else {
            warnings.push({
              field: rule.field,
              message: rule.error_message,
              message_ar: rule.error_message_ar,
              suggestion: this.getSuggestion(rule, fieldValue),
              suggestion_ar: this.getSuggestionAr(rule, fieldValue),
            });
          }
        }
      }

      // فحوصات إضافية للجداول المحددة
      await this.performSpecialValidations(tableName, data, errors, warnings);

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      // إنشاء تحذيرات للأخطاء الحرجة
      if (errors.length > 0) {
        await this.createValidationAlert(tableName, errors);
      }

      return result;
    } catch (error) {
      console.error("[DataValidator] خطأ في التحقق من البيانات:", error);
      return {
        isValid: false,
        errors: [
          {
            field: "system",
            message: "Validation system error",
            message_ar: "خطأ في نظام التحقق",
            severity: "critical",
            rule_id: "system_error",
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * تطبيق قاعدة تحقق
   */
  private async applyRule(
    rule: ValidationRule,
    value: any,
    data: Record<string, any>,
  ): Promise<boolean> {
    try {
      switch (rule.rule_type) {
        case "required":
          return value !== undefined && value !== null && value !== "";

        case "min":
          if (value === undefined || value === null) return true;
          const numValue = parseFloat(value);
          return !isNaN(numValue) && numValue >= rule.parameters.min;

        case "max":
          if (value === undefined || value === null) return true;
          const maxValue = parseFloat(value);
          return !isNaN(maxValue) && maxValue <= rule.parameters.max;

        case "range":
          if (value === undefined || value === null) return true;
          const rangeValue = parseFloat(value);
          return (
            !isNaN(rangeValue) &&
            rangeValue >= rule.parameters.min &&
            rangeValue <= rule.parameters.max
          );

        case "pattern":
          if (value === undefined || value === null) return true;
          const regex = new RegExp(rule.parameters.pattern);
          return regex.test(value.toString());

        case "custom":
          const validator = this.customValidators.get(
            rule.parameters.validator,
          );
          if (!validator) return true;
          return validator(value);

        case "reference":
          return await this.validateReference(rule, value);

        default:
          return true;
      }
    } catch (error) {
      console.error(`[DataValidator] خطأ في تطبيق القاعدة ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * التحقق من صحة المرجع
   */
  private async validateReference(
    rule: ValidationRule,
    value: any,
  ): Promise<boolean> {
    try {
      if (value === undefined || value === null) return true;

      // فحص وجود المرجع في الجدول المحدد
      // سنحتاج لإضافة عملية عامة للفحص في storage.ts
      // مؤقتاً سنفترض أن المرجع صحيح
      return true;
    } catch (error) {
      console.error("[DataValidator] خطأ في التحقق من المرجع:", error);
      return false;
    }
  }

  /**
   * فحوصات خاصة بجداول محددة
   */
  private async performSpecialValidations(
    tableName: string,
    data: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<void> {
    try {
      switch (tableName) {
        case "orders":
          await this.validateOrder(data, errors, warnings);
          break;
        case "customer_products":
          await this.validateCustomerProduct(data, errors, warnings);
          break;
        case "inventory":
          await this.validateInventory(data, errors, warnings);
          break;
        case "production_orders":
          await this.validateProductionOrder(data, errors, warnings);
          break;
      }
    } catch (error) {
      console.error("[DataValidator] خطأ في الفحوصات الخاصة:", error);
    }
  }

  /**
   * التحقق من صحة الطلب
   */
  private async validateOrder(
    data: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<void> {
    // فحص توافق تاريخ التسليم مع الطاقة الإنتاجية
    if (data.delivery_date && data.quantity) {
      const deliveryDate = new Date(data.delivery_date);
      const currentDate = new Date();
      const daysUntilDelivery = Math.ceil(
        (deliveryDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysUntilDelivery < 3) {
        warnings.push({
          field: "delivery_date",
          message: "Short delivery time may cause production delays",
          message_ar: "وقت التسليم القصير قد يسبب تأخير في الإنتاج",
          suggestion: "Consider extending delivery date",
          suggestion_ar: "فكر في تمديد تاريخ التسليم",
        });
      }
    }

    // فحص توفر المواد الخام
    if (data.customer_product_id) {
      // سنحتاج لفحص توفر المواد الخام للمنتج
    }
  }

  /**
   * التحقق من صحة منتج العميل
   */
  private async validateCustomerProduct(
    data: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<void> {
    // فحص منطقية الأبعاد
    if (data.width && data.left_facing && data.right_facing) {
      const totalWidth =
        parseFloat(data.left_facing) + parseFloat(data.right_facing);
      if (totalWidth > parseFloat(data.width)) {
        errors.push({
          field: "width",
          message: "Total facing width exceeds bag width",
          message_ar: "مجموع عرض الواجهات يتجاوز عرض الكيس",
          severity: "high",
          rule_id: "width_consistency",
        });
      }
    }

    // فحص وزن الوحدة
    if (data.unit_weight_kg && data.thickness && data.width) {
      // حساب تقديري للوزن بناءً على الأبعاد
      const estimatedWeight =
        parseFloat(data.thickness) * parseFloat(data.width) * 0.001; // تقدير بسيط
      const actualWeight = parseFloat(data.unit_weight_kg);

      if (Math.abs(actualWeight - estimatedWeight) > estimatedWeight * 0.5) {
        warnings.push({
          field: "unit_weight_kg",
          message: "Unit weight may not match dimensions",
          message_ar: "وزن الوحدة قد لا يتطابق مع الأبعاد",
          suggestion: "Verify weight calculation",
          suggestion_ar: "تحقق من حساب الوزن",
        });
      }
    }
  }

  /**
   * التحقق من صحة المخزون
   */
  private async validateInventory(
    data: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<void> {
    // فحص الحد الأدنى والأقصى
    if (data.min_stock && data.max_stock) {
      if (parseFloat(data.min_stock) >= parseFloat(data.max_stock)) {
        errors.push({
          field: "min_stock",
          message: "Minimum stock must be less than maximum stock",
          message_ar: "يجب أن يكون الحد الأدنى أقل من الحد الأقصى",
          severity: "medium",
          rule_id: "stock_limits",
        });
      }
    }

    // تحذير من المخزون المنخفض
    if (data.current_stock && data.min_stock) {
      if (parseFloat(data.current_stock) <= parseFloat(data.min_stock)) {
        warnings.push({
          field: "current_stock",
          message: "Stock level is at or below minimum",
          message_ar: "مستوى المخزون عند الحد الأدنى أو أقل",
          suggestion: "Consider reordering",
          suggestion_ar: "فكر في إعادة الطلب",
        });
      }
    }
  }

  /**
   * التحقق من صحة أمر الإنتاج
   */
  private async validateProductionOrder(
    data: Record<string, any>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): Promise<void> {
    // فحص توفر الماكينة
    if (data.machine_id) {
      // سنحتاج لفحص حالة الماكينة
    }

    // فحص الكمية مقابل الطلب الأصلي
    if (data.order_id && data.planned_quantity) {
      // سنحتاج لفحص الكمية في الطلب الأصلي
    }
  }

  /**
   * الحصول على اقتراح للحقل
   */
  private getSuggestion(rule: ValidationRule, value: any): string {
    switch (rule.rule_type) {
      case "min":
        return `Value should be at least ${rule.parameters.min}`;
      case "max":
        return `Value should be at most ${rule.parameters.max}`;
      case "range":
        return `Value should be between ${rule.parameters.min} and ${rule.parameters.max}`;
      case "pattern":
        return "Please check the format";
      default:
        return "Please review the value";
    }
  }

  /**
   * الحصول على اقتراح باللغة العربية
   */
  private getSuggestionAr(rule: ValidationRule, value: any): string {
    switch (rule.rule_type) {
      case "min":
        return `يجب أن تكون القيمة على الأقل ${rule.parameters.min}`;
      case "max":
        return `يجب أن تكون القيمة على الأكثر ${rule.parameters.max}`;
      case "range":
        return `يجب أن تكون القيمة بين ${rule.parameters.min} و ${rule.parameters.max}`;
      case "pattern":
        return "يرجى مراجعة التنسيق";
      default:
        return "يرجى مراجعة القيمة";
    }
  }

  /**
   * إنشاء تحذير للأخطاء في التحقق
   */
  private async createValidationAlert(
    tableName: string,
    errors: ValidationError[],
  ): Promise<void> {
    try {
      const criticalErrors = errors.filter((e) => e.severity === "critical");
      if (criticalErrors.length === 0) return;

      const alertManager = getAlertManager(this.storage);

      await alertManager.createAlert({
        title: `Data Validation Errors in ${tableName}`,
        title_ar: `أخطاء في التحقق من بيانات ${tableName}`,
        message: `Found ${criticalErrors.length} critical validation errors`,
        message_ar: `تم العثور على ${criticalErrors.length} خطأ حرج في التحقق`,
        type: "system",
        category: "error",
        severity: "high",
        source: "data_validator",
        source_id: tableName,
        context_data: { errors: criticalErrors },
        requires_action: true,
        target_roles: [1, 2], // الأدمن والمديرين
      });
    } catch (error) {
      console.error("[DataValidator] خطأ في إنشاء تحذير التحقق:", error);
    }
  }

  /**
   * Validate roll creation - NEW WORKFLOW: Allow unlimited rolls with overrun
   * إزالة القيود السابقة والسماح بإنشاء رولات متعددة مع overrun
   */
  async validateRollCreation(rollData: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Check production order exists
      const productionOrder = await this.storage.getProductionOrderById(
        rollData.production_order_id,
      );
      if (!productionOrder) {
        errors.push({
          field: "production_order_id",
          message: "Production order not found",
          message_ar: "أمر الإنتاج غير موجود",
          severity: "high",
          rule_id: "production_order_exists",
        });
        return { isValid: false, errors, warnings };
      }

      // Basic weight validation
      const proposedWeight = parseFloat(rollData.weight_kg || "0");
      if (proposedWeight <= 0) {
        errors.push({
          field: "weight_kg",
          message: "Roll weight must be positive",
          message_ar: "يجب أن يكون وزن الرول أكبر من صفر",
          severity: "high",
          rule_id: "roll_weight_positive",
        });
      }

      // إزالة قيود الوزن - السماح بإنشاء رولات متعددة مع تجاوز الكمية
      // التسجيل فقط للمتابعة
      const existingRolls = await this.storage.getRollsByProductionOrder(
        rollData.production_order_id,
      );
      const existingTotalWeight = existingRolls.reduce(
        (sum, roll) => sum + parseFloat(roll.weight_kg || "0"),
        0,
      );
      const newTotalWeight = existingTotalWeight + proposedWeight;
      const requiredQuantity = parseFloat(productionOrder.quantity_kg || "0");

      console.log(
        `[Roll Creation] Production Order ${rollData.production_order_id}:`,
      );
      console.log(`  Required: ${requiredQuantity}kg`);
      console.log(`  Current: ${existingTotalWeight}kg`);
      console.log(`  New roll: ${proposedWeight}kg`);
      console.log(`  Total will be: ${newTotalWeight}kg`);

      // معلومات إضافية فقط - بدون قيود
      if (newTotalWeight >= requiredQuantity) {
        console.log(
          `  Status: Will exceed required quantity by ${(newTotalWeight - requiredQuantity).toFixed(2)}kg`,
        );
      }

      return { isValid: errors.length === 0, errors, warnings };
    } catch (error) {
      console.error("[DataValidator] Error validating roll creation:", error);
      errors.push({
        field: "system",
        message: "System validation error",
        message_ar: "خطأ في نظام التحقق",
        severity: "critical",
        rule_id: "system_error",
      });
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * فحص سلامة قاعدة البيانات
   */
  async validateDatabaseIntegrity(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];

      // فحص المراجع المعطلة
      // سنحتاج لإضافة استعلامات للفحص

      // فحص البيانات المكررة
      // سنحتاج لإضافة استعلامات للفحص

      // فحص القيم المفقودة في الحقول المطلوبة
      // سنحتاج لإضافة استعلامات للفحص

      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error("[DataValidator] خطأ في فحص سلامة قاعدة البيانات:", error);
      return {
        isHealthy: false,
        issues: ["خطأ في فحص سلامة قاعدة البيانات"],
        recommendations: ["يرجى مراجعة سجلات النظام"],
      };
    }
  }

  /**
   * إضافة قاعدة تحقق مخصصة
   */
  addCustomRule(rule: ValidationRule): void {
    if (!this.validationRules.has(rule.table)) {
      this.validationRules.set(rule.table, []);
    }
    this.validationRules.get(rule.table)?.push(rule);
    console.log(`[DataValidator] تم إضافة قاعدة تحقق مخصصة: ${rule.name_ar}`);
  }

  /**
   * إضافة مدقق مخصص
   */
  addCustomValidator(name: string, validator: Function): void {
    this.customValidators.set(name, validator);
    console.log(`[DataValidator] تم إضافة مدقق مخصص: ${name}`);
  }

  /**
   * CRITICAL: validateEntity - Main validation entry point for all database writes
   * This method MUST be called before every database insert/update operation
   * Enforces business rules, invariants, and data integrity constraints
   */
  async validateEntity(
    tableName: string,
    data: Record<string, any>,
    isUpdate: boolean = false,
  ): Promise<ValidationResult> {
    console.log(`[DataValidator] 🔒 Validating ${tableName} entity:`, {
      tableName,
      isUpdate,
      dataKeys: Object.keys(data),
    });

    try {
      // Call the main validation method with enhanced logging
      const result = await this.validateData(tableName, data, isUpdate);

      // Enhanced error logging for critical failures
      if (!result.isValid) {
        console.error(
          `[DataValidator] ❌ VALIDATION FAILED for ${tableName}:`,
          {
            errors: result.errors,
            warnings: result.warnings,
            data: data,
          },
        );
      } else {
        console.log(`[DataValidator] ✅ Validation passed for ${tableName}`);
      }

      return result;
    } catch (error) {
      console.error(
        `[DataValidator] CRITICAL ERROR during ${tableName} validation:`,
        error,
      );
      return {
        isValid: false,
        errors: [
          {
            field: "_system",
            message: "Validation system error",
            message_ar: "خطأ في نظام التحقق",
            severity: "critical",
            rule_id: "system_error",
            value: error,
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * CRITICAL: validateStatusTransition - Enforces valid state transitions
   * Prevents invalid status changes that could corrupt business workflow
   */
  async validateStatusTransition(
    tableName: string,
    currentStatus: string,
    newStatus: string,
    entityId: number,
  ): Promise<ValidationResult> {
    console.log(
      `[DataValidator] 🔄 Validating status transition for ${tableName}:`,
      {
        entityId,
        currentStatus,
        newStatus,
      },
    );

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Define valid status transitions by table
      const validTransitions: Record<string, Record<string, string[]>> = {
        orders: {
          pending: ["waiting", "for_production", "cancelled"],
          waiting: ["in_production", "for_production", "on_hold", "cancelled"],
          for_production: ["in_production", "waiting", "on_hold", "cancelled"],
          in_production: ["paused", "completed", "on_hold", "in_progress"],
          in_progress: ["paused", "completed", "on_hold"],
          paused: ["in_production", "in_progress", "cancelled"],
          on_hold: ["waiting", "for_production", "cancelled"],
          completed: ["delivered"], // Only allow delivery from completed
          delivered: [], // Terminal state - no further transitions
          cancelled: [], // Terminal state - no further transitions
        },
        production_orders: {
          pending: ["active", "cancelled"],
          active: ["completed", "cancelled"],
          completed: [], // No transitions allowed from completed
          cancelled: [], // No transitions allowed from cancelled
        },
        rolls: {
          film: ["printing", "cutting"], // Can skip printing if not needed
          printing: ["cutting"],
          cutting: ["done"],
          done: [], // No transitions allowed from done
        },
      };

      // Check if table has defined transitions
      const tableTransitions = validTransitions[tableName];
      if (!tableTransitions) {
        warnings.push({
          field: "status",
          message: `No status transition rules defined for ${tableName}`,
          message_ar: `لا توجد قواعد انتقال حالة محددة لـ ${tableName}`,
        });
        return { isValid: true, errors, warnings };
      }

      // Check if current status exists
      const allowedFromCurrent = tableTransitions[currentStatus];
      if (!allowedFromCurrent) {
        errors.push({
          field: "status",
          message: `Invalid current status: ${currentStatus}`,
          message_ar: `حالة حالية غير صحيحة: ${currentStatus}`,
          severity: "high",
          rule_id: "invalid_current_status",
        });
        return { isValid: false, errors, warnings };
      }

      // Check if transition is allowed
      if (!allowedFromCurrent.includes(newStatus)) {
        errors.push({
          field: "status",
          message: `Invalid status transition: ${currentStatus} → ${newStatus}`,
          message_ar: `انتقال حالة غير صحيح: ${currentStatus} ← ${newStatus}`,
          severity: "high",
          rule_id: "invalid_status_transition",
          value: {
            from: currentStatus,
            to: newStatus,
            allowed: allowedFromCurrent,
          },
        });
        return { isValid: false, errors, warnings };
      }

      console.log(
        `[DataValidator] ✅ Valid status transition: ${currentStatus} → ${newStatus}`,
      );
      return { isValid: true, errors, warnings };
    } catch (error) {
      console.error(
        "[DataValidator] Error validating status transition:",
        error,
      );
      errors.push({
        field: "status",
        message: "Error validating status transition",
        message_ar: "خطأ في التحقق من انتقال الحالة",
        severity: "critical",
        rule_id: "transition_validation_error",
      });
      return { isValid: false, errors, warnings };
    }
  }
}

// إنشاء مثيل مشترك
let dataValidator: DataValidator | null = null;

export function getDataValidator(storage: IStorage): DataValidator {
  if (!dataValidator) {
    dataValidator = new DataValidator(storage);
  }
  return dataValidator;
}

export default DataValidator;
