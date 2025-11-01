export interface DashboardStats {
  activeOrders: number;
  productionRate: number;
  qualityScore: number;
  wastePercentage: number;
}

export interface User {
  id: number;
  username: string;
  display_name?: string;
  display_name_ar?: string;
  role_id?: number;
  section_id?: number;
  permissions?: string[];
  role_name?: string;
  role_name_ar?: string;
}

export interface AuthUser extends User {
  /**
   * 🔐 الرمز المميز للجلسة (JWT أو Session Token)
   */
  token?: string;

  /**
   * 🎭 الدور المنطقي للمستخدم داخل النظام
   * يتم اشتقاقه تلقائيًا من role_name أو role_name_ar
   * عند تسجيل الدخول أو تحميل الجلسة.
   */
  role?: "admin" | "manager" | "supervisor" | "employee" | "viewer";
}


export interface ProductionOrderWithDetails {
  id: number;
  production_order_number: string;
  order_id: number;
  product_id: number;
  quantity_required: string;
  produced_quantity_kg: string;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_name_ar?: string;
  product_name?: string;
  product_name_ar?: string;
}

export interface RollWithDetails {
  id: number;
  roll_number: string;
  production_order_id?: number;
  weight?: string;
  status: string;
  current_stage: string;
  machine_id?: number;
  employee_id?: number;
  qr_code?: string;
  created_at: string;
  production_order_number?: string;
  product_name?: string;
  product_name_ar?: string;
  machine_name?: string;
  machine_name_ar?: string;
  employee_name?: string;
  employee_name_ar?: string;
}

export interface MachineStatus {
  id: number;
  name: string;
  name_ar?: string;
  type: string;
  status: "active" | "maintenance" | "down";
  section_id?: number;
  current_employee?: string;
  productivity?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

export interface ProductionStage {
  id: string;
  name: string;
  name_ar: string;
  key: "film" | "printing" | "cutting";
  active: boolean;
}

export interface Section {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
}
