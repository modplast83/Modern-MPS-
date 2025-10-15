import { Request, Response, NextFunction } from "express";
import { hasPermission, type PermissionKey } from "../../shared/permissions";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    role_id: number;
    department?: string | null;
    status: string;
    permissions?: string[];
  };
}

// Middleware to require authentication
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Middleware to require specific permissions
export function requirePermission(...permissions: PermissionKey[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admin always has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has any of the required permissions
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(req.user?.permissions || null, permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        error: "Insufficient permissions",
        required: permissions,
        message: "ليس لديك الصلاحيات الكافية للقيام بهذا الإجراء"
      });
    }

    next();
  };
}

// Middleware to require admin role
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: "Admin access required",
      message: "هذا الإجراء متاح للمسؤولين فقط"
    });
  }

  next();
}