import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class RequestValidationError extends Error {
  public validationErrors: ValidationError[];
  public statusCode: number;

  constructor(errors: ValidationError[]) {
    super("بيانات الطلب غير صحيحة");
    this.name = "RequestValidationError";
    this.validationErrors = errors;
    this.statusCode = 400;
  }
}

function formatZodErrors(zodError: ZodError): ValidationError[] {
  return zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: getArabicErrorMessage(err.code, err.message, err.path.join(".")),
    code: err.code,
  }));
}

function getArabicErrorMessage(
  code: string,
  originalMessage: string,
  field: string,
): string {
  const fieldNames: Record<string, string> = {
    username: "اسم المستخدم",
    password: "كلمة المرور",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    phone_number: "رقم الهاتف",
    customer_id: "معرف العميل",
    order_number: "رقم الطلب",
    quantity: "الكمية",
    quantity_kg: "الكمية بالكيلوجرام",
    status: "الحالة",
    delivery_date: "تاريخ التسليم",
    name: "الاسم",
    title: "العنوان",
    message: "الرسالة",
    id: "المعرف",
  };

  const arabicField = fieldNames[field] || field;

  switch (code) {
    case "invalid_type":
      return `${arabicField} يجب أن يكون من النوع الصحيح`;
    case "too_small":
      if (originalMessage.includes("String must contain at least")) {
        const minLength = originalMessage.match(/\d+/)?.[0] || "1";
        return `${arabicField} يجب أن يحتوي على ${minLength} أحرف على الأقل`;
      }
      if (originalMessage.includes("Number must be greater than or equal to")) {
        const minValue = originalMessage.match(/\d+/)?.[0] || "0";
        return `${arabicField} يجب أن يكون ${minValue} أو أكثر`;
      }
      return `${arabicField} صغير جداً`;
    case "too_big":
      if (originalMessage.includes("String must contain at most")) {
        const maxLength = originalMessage.match(/\d+/)?.[0] || "100";
        return `${arabicField} يجب أن لا يتجاوز ${maxLength} حرف`;
      }
      if (originalMessage.includes("Number must be less than or equal to")) {
        const maxValue = originalMessage.match(/\d+/)?.[0] || "100";
        return `${arabicField} يجب أن يكون ${maxValue} أو أقل`;
      }
      return `${arabicField} كبير جداً`;
    case "invalid_string":
      if (originalMessage.includes("Invalid email")) {
        return `${arabicField} غير صحيح`;
      }
      if (originalMessage.includes("Invalid url")) {
        return `${arabicField} يجب أن يكون رابط صحيح`;
      }
      return `${arabicField} غير صحيح`;
    case "invalid_date":
      return `${arabicField} يجب أن يكون تاريخ صحيح`;
    case "invalid_enum_value":
      return `${arabicField} يحتوي على قيمة غير مسموحة`;
    case "unrecognized_keys":
      return `يحتوي الطلب على بيانات غير معترف بها`;
    default:
      return `${arabicField} غير صحيح`;
  }
}

// Validation middleware factory
export function validateRequest<T extends Record<string, ZodSchema>>(
  schemas: T,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: ValidationError[] = [];

      // Validate request body
      if (schemas.body) {
        try {
          console.log(
            "🔍 Validating request body:",
            JSON.stringify(req.body, null, 2),
          );
          req.body = schemas.body.parse(req.body);
          console.log("✅ Validation successful");
        } catch (error) {
          console.log("❌ Validation failed:", error);
          if (error instanceof ZodError) {
            console.log(
              "❌ Zod validation errors:",
              JSON.stringify(error.errors, null, 2),
            );
            errors.push(...formatZodErrors(error));
          } else {
            errors.push({
              field: "body",
              message: "بيانات الطلب غير صحيحة",
              code: "invalid_body",
            });
          }
        }
      }

      // Validate query parameters
      if (schemas.query) {
        try {
          req.query = schemas.query.parse(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error));
          } else {
            errors.push({
              field: "query",
              message: "معاملات الاستعلام غير صحيحة",
              code: "invalid_query",
            });
          }
        }
      }

      // Validate route parameters
      if (schemas.params) {
        try {
          req.params = schemas.params.parse(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error));
          } else {
            errors.push({
              field: "params",
              message: "معاملات المسار غير صحيحة",
              code: "invalid_params",
            });
          }
        }
      }

      // If there are validation errors, return them
      if (errors.length > 0) {
        return res.status(400).json({
          message: "بيانات الطلب غير صحيحة",
          errors: errors,
          success: false,
        });
      }

      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      return res.status(500).json({
        message: "خطأ في التحقق من صحة البيانات",
        success: false,
      });
    }
  };
}

// Phone number validation schema (defined separately to avoid circular dependency)
const phoneNumberSchema = z
  .string()
  .min(10, "رقم الهاتف يجب أن يحتوي على 10 أرقام على الأقل")
  .max(15, "رقم الهاتف يجب أن لا يتجاوز 15 رقم")
  .regex(/^[\+]?[0-9\-\(\)\s]+$/, "رقم الهاتف غير صحيح");

// Common validation schemas
export const commonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z
      .string()
      .regex(/^\d+$/, "المعرف يجب أن يكون رقم صحيح")
      .transform(Number),
  }),

  // Pagination query validation
  pagination: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),

  // Phone number validation
  phoneNumber: phoneNumberSchema,

  // User authentication
  loginCredentials: z.object({
    username: z
      .string()
      .min(3, "اسم المستخدم يجب أن يحتوي على 3 أحرف على الأقل")
      .max(50, "اسم المستخدم يجب أن لا يتجاوز 50 حرف")
      .trim(),
    password: z
      .string()
      .min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل")
      .max(100, "كلمة المرور طويلة جداً"),
  }),

  // Order creation validation
  createOrder: z.object({
    customer_id: z.string().min(1, "معرف العميل مطلوب"),
    order_number: z
      .string()
      .min(1, "رقم الطلب مطلوب")
      .max(50, "رقم الطلب طويل جداً")
      .trim(),
    delivery_days: z
      .union([z.number(), z.string().regex(/^\d+$/)])
      .transform((val) => (typeof val === "string" ? Number(val) : val))
      .refine(
        (val) => val >= 0 && val <= 365,
        "أيام التسليم يجب أن تكون بين 0 و 365 يوم",
      )
      .optional(),
    delivery_date: z.string().optional(),
    notes: z.string().max(1000, "الملاحظات طويلة جداً").optional(),
    created_by: z
      .union([
        z.number(),
        z.string().regex(/^\d+$/, "معرف المنشئ يجب أن يكون رقم صحيح"),
      ])
      .transform((val) => (typeof val === "string" ? Number(val) : val))
      .refine((val) => val >= 1, "معرف المنشئ مطلوب"),
  }),

  // Order status update
  updateOrderStatus: z.object({
    status: z.enum(
      [
        "pending",
        "waiting",
        "in_production",
        "for_production",
        "paused",
        "on_hold",
        "completed",
        "cancelled",
      ],
      {
        errorMap: () => ({ message: "حالة الطلب غير صحيحة" }),
      },
    ),
  }),

  // WhatsApp message validation
  whatsappMessage: z.object({
    phone_number: phoneNumberSchema,
    message: z
      .string()
      .min(1, "الرسالة مطلوبة")
      .max(4096, "الرسالة طويلة جداً"),
    title: z.string().max(100, "العنوان طويل جداً").optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    context_type: z.string().max(50).optional(),
    context_id: z.string().max(50).optional(),
    template_name: z.string().max(100).optional(),
    use_template: z.boolean().optional(),
  }),
};

// Session validation middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({
      message: "غير مسجل الدخول - يرجى تسجيل الدخول أولاً",
      success: false,
    });
  }
  next();
}

// Admin role validation middleware
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // First check if user is authenticated
  if (!req.session?.userId) {
    return res.status(401).json({
      message: "غير مسجل الدخول - يرجى تسجيل الدخول أولاً",
      success: false,
    });
  }

  try {
    // Import db and related schemas here to avoid circular dependencies
    const { db } = await import("../db");
    const { users, roles } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");

    // Get user with role information
    const userWithRole = await db
      .select({
        user_id: users.id,
        user_role_id: users.role_id,
        role_name: roles.name,
        role_permissions: roles.permissions,
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.id, req.session.userId))
      .limit(1);

    if (userWithRole.length === 0) {
      return res.status(403).json({
        message: "المستخدم غير موجود",
        success: false,
      });
    }

    const user = userWithRole[0];

    // Check if user has admin role or admin permissions
    const isAdmin =
      user.role_name === "admin" ||
      user.role_name === "مدير النظام" ||
      user.role_name === "administrator" ||
      user.user_role_id === 1 || // Assume role ID 1 is admin
      (user.role_permissions &&
        Array.isArray(user.role_permissions) &&
        user.role_permissions.includes("admin"));

    if (!isAdmin) {
      return res.status(403).json({
        message: "غير مخول للوصول - صلاحيات المدير مطلوبة",
        success: false,
      });
    }

    // User is authenticated and has admin privileges
    next();
  } catch (error) {
    console.error("Admin role validation error:", error);
    return res.status(500).json({
      message: "خطأ في التحقق من الصلاحيات",
      success: false,
    });
  }
}

export { z } from "zod";
