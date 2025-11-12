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
  Link2,
  FileText,
  LayoutDashboard,
  Monitor,
  Activity,
  Beaker,
  Film,
  Printer,
  Scissors,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../hooks/use-auth";
import { canAccessRoute } from "../../utils/roleUtils";

const modules = [
  {
    name: "الرئيسية",
    name_ar: "الرئيسية",
    icon: Home,
    path: "/",
    active: false,
  },
  {
    name: "لوحة التحكم",
    name_ar: "لوحة التحكم",
    icon: LayoutDashboard,
    path: "/user-dashboard",
    active: false,
  },
  {
    name: "الطلبات والإنتاج",
    name_ar: "الطلبات والإنتاج",
    icon: FileText,
    path: "/orders",
    active: false,
  },
  {
    name: "الإنتاج",
    name_ar: "الإنتاج",
    icon: Cog,
    path: "/production",
    active: false,
  },
  {
    name: "لوحة عامل الفيلم",
    name_ar: "لوحة عامل الفيلم",
    icon: Film,
    path: "/film-operator",
    active: false,
    requiredSections: [3], // SEC03 - قسم الفيلم/البثق
  },
  {
    name: "لوحة عامل الطباعة",
    name_ar: "لوحة عامل الطباعة",
    icon: Printer,
    path: "/printing-operator",
    active: false,
    requiredSections: [4], // مخصص لعاملي قسم الطباعة
  },
  {
    name: "لوحة عامل التقطيع",
    name_ar: "لوحة عامل التقطيع",
    icon: Scissors,
    path: "/cutting-operator",
    active: false,
    requiredSections: [5], // مخصص لعاملي قسم التقطيع
  },
  {
    name: "مراقبة الإنتاج",
    name_ar: "مراقبة الإنتاج",
    icon: Monitor,
    path: "/production-monitoring",
    active: false,
  },
  {
    name: "الجودة",
    name_ar: "الجودة",
    icon: ClipboardCheck,
    path: "/quality",
    active: false,
  },
  {
    name: "الصيانة",
    name_ar: "الصيانة",
    icon: Wrench,
    path: "/maintenance",
    active: false,
  },
  {
    name: "الموارد البشرية",
    name_ar: "الموارد البشرية",
    icon: Users,
    path: "/hr",
    active: false,
  },
  {
    name: "المستودع",
    name_ar: "المستودع",
    icon: Warehouse,
    path: "/warehouse",
    active: false,
  },
  {
    name: "التعريفات",
    name_ar: "التعريفات",
    icon: Database,
    path: "/definitions",
    active: false,
  },
  {
    name: "التقارير",
    name_ar: "التقارير",
    icon: BarChart3,
    path: "/reports",
    active: false,
  },
  {
      name: "الأدوات",
      name_ar: "الأدوات",
      icon: Wrench,
      path: "/tools",
      active: false,
    },
  {
    name: "الإعدادات",
    name_ar: "الإعدادات",
    icon: Settings,
    path: "/settings",
    active: false,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Filter modules based on user permissions and sections
  const accessibleModules = modules.filter(module => {
    // First check route permissions (this allows admin to access everything)
    if (!canAccessRoute(user, module.path)) {
      return false;
    }
    
    // Check if module has section requirements (but skip for admins)
    if (module.requiredSections) {
      // Admin can access all sections
      const isAdmin = user?.role_id === 1;
      if (!isAdmin) {
        // For non-admin users, check if user's section matches
        const userSectionId = user?.section_id;
        if (!userSectionId || !module.requiredSections.includes(userSectionId)) {
          return false;
        }
      }
    }
    
    return true;
  });

  return (
    <aside className="fixed right-0 top-16 bottom-0 bg-white shadow-sm border-l border-gray-200 w-64 hidden lg:block z-10 overflow-y-auto">
      <nav className="p-4">
        <div className="space-y-2">
          {accessibleModules.map((module) => {
            const Icon = module.icon;
            const isActive = location === module.path;

            return (
              <Link key={module.name} href={module.path}>
                <div
                  className={isActive ? "nav-item nav-item-active" : "nav-item"}
                >
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
      </nav>
    </aside>
  );
}
