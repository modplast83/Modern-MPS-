/**
 * Central Permissions Registry
 * نظام الصلاحيات المركزي
 * 
 * This file defines all permissions and their mappings to UI elements
 * هذا الملف يعرّف جميع الصلاحيات وربطها بعناصر الواجهة
 */

export type PermissionKey = 
  | 'view_dashboard'
  | 'manage_orders'
  | 'manage_production'
  | 'manage_maintenance'
  | 'manage_quality'
  | 'manage_inventory'
  | 'manage_users'
  | 'manage_hr'
  | 'view_reports'
  | 'manage_settings'
  | 'manage_definitions'
  | 'manage_roles'
  | 'view_production'
  | 'view_hr'
  | 'view_quality'
  | 'view_maintenance'
  | 'view_inventory'
  | 'admin'; // Super admin permission

export interface Permission {
  id: PermissionKey;
  name: string;
  name_ar: string;
  category: string;
  description?: string;
}

// Define all available permissions
export const PERMISSIONS: Permission[] = [
  // Dashboard
  { 
    id: 'view_dashboard', 
    name: 'View Dashboard', 
    name_ar: 'عرض لوحة التحكم', 
    category: 'عام',
    description: 'Access to main dashboard and statistics'
  },
  
  // Orders
  { 
    id: 'manage_orders', 
    name: 'Manage Orders', 
    name_ar: 'إدارة الطلبات', 
    category: 'الطلبات',
    description: 'Create, edit, delete orders'
  },
  
  // Production
  { 
    id: 'view_production', 
    name: 'View Production', 
    name_ar: 'عرض الإنتاج', 
    category: 'الإنتاج',
    description: 'View production data and queues'
  },
  { 
    id: 'manage_production', 
    name: 'Manage Production', 
    name_ar: 'إدارة الإنتاج', 
    category: 'الإنتاج',
    description: 'Create and manage production orders'
  },
  
  // Maintenance
  { 
    id: 'view_maintenance', 
    name: 'View Maintenance', 
    name_ar: 'عرض الصيانة', 
    category: 'الصيانة',
    description: 'View maintenance reports'
  },
  { 
    id: 'manage_maintenance', 
    name: 'Manage Maintenance', 
    name_ar: 'إدارة الصيانة', 
    category: 'الصيانة',
    description: 'Create and manage maintenance requests'
  },
  
  // Quality
  { 
    id: 'view_quality', 
    name: 'View Quality', 
    name_ar: 'عرض الجودة', 
    category: 'الجودة',
    description: 'View quality reports'
  },
  { 
    id: 'manage_quality', 
    name: 'Manage Quality', 
    name_ar: 'إدارة الجودة', 
    category: 'الجودة',
    description: 'Manage quality control and reports'
  },
  
  // Inventory
  { 
    id: 'view_inventory', 
    name: 'View Inventory', 
    name_ar: 'عرض المخزون', 
    category: 'المخزون',
    description: 'View inventory levels'
  },
  { 
    id: 'manage_inventory', 
    name: 'Manage Inventory', 
    name_ar: 'إدارة المخزون', 
    category: 'المخزون',
    description: 'Manage inventory and warehouse'
  },
  
  // Users
  { 
    id: 'manage_users', 
    name: 'Manage Users', 
    name_ar: 'إدارة المستخدمين', 
    category: 'المستخدمين',
    description: 'Create, edit, delete users'
  },
  
  // HR
  { 
    id: 'view_hr', 
    name: 'View HR', 
    name_ar: 'عرض الموارد البشرية', 
    category: 'الموارد البشرية',
    description: 'View HR data and attendance'
  },
  { 
    id: 'manage_hr', 
    name: 'Manage HR', 
    name_ar: 'إدارة الموارد البشرية', 
    category: 'الموارد البشرية',
    description: 'Manage HR, attendance, and training'
  },
  
  // Reports
  { 
    id: 'view_reports', 
    name: 'View Reports', 
    name_ar: 'عرض التقارير', 
    category: 'التقارير',
    description: 'View system reports and analytics'
  },
  
  // System
  { 
    id: 'manage_settings', 
    name: 'Manage Settings', 
    name_ar: 'إدارة الإعدادات', 
    category: 'النظام',
    description: 'Modify system settings'
  },
  { 
    id: 'manage_definitions', 
    name: 'Manage Definitions', 
    name_ar: 'إدارة التعريفات', 
    category: 'النظام',
    description: 'Manage system definitions and master data'
  },
  { 
    id: 'manage_roles', 
    name: 'Manage Roles', 
    name_ar: 'إدارة الأدوار', 
    category: 'النظام',
    description: 'Create and modify user roles'
  },
  
  // Admin
  { 
    id: 'admin', 
    name: 'Administrator', 
    name_ar: 'مدير النظام', 
    category: 'النظام',
    description: 'Full system access'
  }
];

// Route to permission mapping
export const ROUTE_PERMISSIONS: Record<string, PermissionKey[]> = {
  '/': ['view_dashboard'],
  '/dashboard': ['view_dashboard'],
  '/orders': ['manage_orders'],
  '/production': ['view_production', 'manage_production'],
  '/maintenance': ['view_maintenance', 'manage_maintenance'],
  '/quality': ['view_quality', 'manage_quality'],
  '/inventory': ['view_inventory', 'manage_inventory'],
  '/hr': ['view_hr', 'manage_hr'],
  '/reports': ['view_reports'],
  '/settings': ['manage_settings', 'admin'],
  '/definitions': ['manage_definitions'],
  '/users': ['manage_users'],
};

// Settings tabs permissions
export const SETTINGS_TAB_PERMISSIONS: Record<string, PermissionKey[]> = {
  'general': ['manage_settings', 'admin'],
  'system': ['manage_settings', 'admin'],
  'database': ['admin'],
  'roles': ['manage_roles', 'admin'],
  'user': [], // All users can access their own settings
};

// Helper function to check if user has permission
export function hasPermission(
  userPermissions: string[] | undefined | null,
  requiredPermissions: PermissionKey | PermissionKey[],
  requireAll: boolean = false
): boolean {
  if (!userPermissions) return false;
  
  // Admin has all permissions
  if (userPermissions.includes('admin')) return true;
  
  const required = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  if (requireAll) {
    // User must have ALL required permissions
    return required.every(perm => userPermissions.includes(perm));
  } else {
    // User needs at least ONE of the required permissions
    return required.some(perm => userPermissions.includes(perm));
  }
}

// Helper function to filter permissions by category
export function getPermissionsByCategory(category: string): Permission[] {
  return PERMISSIONS.filter(p => p.category === category);
}

// Helper function to get permission details
export function getPermission(id: PermissionKey): Permission | undefined {
  return PERMISSIONS.find(p => p.id === id);
}

// Helper function to validate permissions array
export function validatePermissions(permissions: string[]): PermissionKey[] {
  const validKeys = PERMISSIONS.map(p => p.id);
  return permissions.filter(p => validKeys.includes(p as PermissionKey)) as PermissionKey[];
}

// Export permission groups for UI organization
export const PERMISSION_CATEGORIES = [
  'عام',
  'الطلبات', 
  'الإنتاج',
  'الصيانة',
  'الجودة',
  'المخزون',
  'المستخدمين',
  'الموارد البشرية',
  'التقارير',
  'النظام'
];