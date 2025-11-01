import {
  Settings,
  Cog,
  Warehouse,
  ClipboardCheck,
  Users,
  Wrench,
  Database,
  BarChart3,
  Home,
  FileText,
  LayoutDashboard,
  Monitor,
  Activity,
  ClipboardList,
  Factory,
  Printer,
  Scissors,
  BarChart2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { canAccessRoute } from "../../utils/roleUtils";

/** ✅ نوع العنصر في القائمة */
interface ModuleItem {
  name: string;
  name_ar: string;
  icon: React.ElementType;
  path: string;
  active: boolean;
  role?: string[]; // صلاحيات مخصصة (اختياري)
}

/** ✅ القائمة الأساسية للنظام */
const modules: ModuleItem[] = [
  { name: "الرئيسية", name_ar: "الرئيسية", icon: Home, path: "/", active: false },
  { name: "لوحة التحكم", name_ar: "لوحة التحكم", icon: LayoutDashboard, path: "/user-dashboard", active: false },
  { name: "الطلبات", name_ar: "الطلبات", icon: FileText, path: "/orders", active: false },
  { name: "الإنتاج", name_ar: "الإنتاج", icon: Cog, path: "/production", active: false },
  { name: "مراقبة الإنتاج", name_ar: "مراقبة الإنتاج", icon: Monitor, path: "/production-monitoring", active: false },
  { name: "الجودة", name_ar: "الجودة", icon: ClipboardCheck, path: "/quality", active: false },
  { name: "الصيانة", name_ar: "الصيانة", icon: Wrench, path: "/maintenance", active: false },
  { name: "الموارد البشرية", name_ar: "الموارد البشرية", icon: Users, path: "/hr", active: false },
  { name: "المستودع", name_ar: "المستودع", icon: Warehouse, path: "/warehouse", active: false },
  { name: "التعريفات", name_ar: "التعريفات", icon: Database, path: "/definitions", active: false },
  { name: "التقارير", name_ar: "التقارير", icon: BarChart3, path: "/reports", active: false },
  { name: "الأدوات", name_ar: "الأدوات", icon: Wrench, path: "/tools", active: false },
  { name: "الإعدادات", name_ar: "الإعدادات", icon: Settings, path: "/settings", active: false },
];

/** 🧩 قسم النسخة التجريبية (v2) */
const modulesV2: ModuleItem[] = [
  { name: "أوامر الإنتاج v2", name_ar: "أوامر الإنتاج v2", icon: ClipboardList, path: "/production-orders-v2", active: false },
  { name: "إنتاج الفيلم v2", name_ar: "إنتاج الفيلم v2", icon: Factory, path: "/production-film-v2", active: false },
  { name: "الطباعة v2", name_ar: "الطباعة v2", icon: Printer, path: "/production-printing-v2", active: false },
  { name: "التقطيع v2", name_ar: "التقطيع v2", icon: Scissors, path: "/production-cutting-v2", active: false },
  { name: "لوحة المراقبة v2", name_ar: "لوحة المراقبة v2", icon: BarChart2, path: "/production-dashboard-v2", active: false },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  // ✅ فلترة الموديولات بناءً على الصلاحيات
  const accessibleModules = modules.filter((module) => canAccessRoute(user, module.path));

  // ✅ السماح بعرض الإصدار التجريبي فقط للمديرين والمشرفين
  const showV2Section = user?.role === "admin" || user?.role === "manager";

  return (
    <aside className="fixed right-0 top-16 bottom-0 bg-white shadow-sm border-l border-gray-200 w-64 hidden lg:block z-10 overflow-y-auto">
      <nav className="p-4">
        <div className="space-y-2">
          {accessibleModules.map((module) => {
            const Icon = module.icon;
            const isActive = location === module.path;

            return (
              <Link key={module.name} href={module.path}>
                <div className={isActive ? "nav-item nav-item-active" : "nav-item"}>
                  <div className="w-full">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{module.name_ar}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 🧩 الإصدار التجريبي (v2) */}
        {showV2Section && (
          <div className="mt-6">
            <h2 className="text-xs font-semibold text-gray-500 mb-2 px-2">
              🧩 الإصدار التجريبي (v2)
            </h2>
            <div className="space-y-2">
              {modulesV2.map((module) => {
                const Icon = module.icon;
                const isActive = location === module.path;
                return (
                  <Link key={module.name} href={module.path}>
                    <div className={isActive ? "nav-item nav-item-active" : "nav-item"}>
                      <div className="w-full">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{module.name_ar}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
