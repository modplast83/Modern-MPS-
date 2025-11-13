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
import { useTranslation } from 'react-i18next';

const modules = [
  {
    translationKey: "sidebar.home",
    icon: Home,
    path: "/",
    active: false,
  },
  {
    translationKey: "sidebar.dashboard",
    icon: LayoutDashboard,
    path: "/user-dashboard",
    active: false,
  },
  {
    translationKey: "sidebar.ordersProduction",
    icon: FileText,
    path: "/orders",
    active: false,
  },
  {
    translationKey: "sidebar.filmOperator",
    icon: Film,
    path: "/film-operator",
    active: false,
    requiredSections: [3],
  },
  {
    translationKey: "sidebar.printingOperator",
    icon: Printer,
    path: "/printing-operator",
    active: false,
    requiredSections: [4],
  },
  {
    translationKey: "sidebar.cuttingOperator",
    icon: Scissors,
    path: "/cutting-operator",
    active: false,
    requiredSections: [5],
  },
  {
    translationKey: "sidebar.productionMonitoring",
    icon: Monitor,
    path: "/production-monitoring",
    active: false,
  },
  {
    translationKey: "sidebar.quality",
    icon: ClipboardCheck,
    path: "/quality",
    active: false,
  },
  {
    translationKey: "sidebar.maintenance",
    icon: Wrench,
    path: "/maintenance",
    active: false,
  },
  {
    translationKey: "sidebar.hr",
    icon: Users,
    path: "/hr",
    active: false,
  },
  {
    translationKey: "sidebar.warehouse",
    icon: Warehouse,
    path: "/warehouse",
    active: false,
  },
  {
    translationKey: "sidebar.definitions",
    icon: Database,
    path: "/definitions",
    active: false,
  },
  {
    translationKey: "sidebar.reports",
    icon: BarChart3,
    path: "/reports",
    active: false,
  },
  {
    translationKey: "sidebar.tools",
    icon: Wrench,
    path: "/tools",
    active: false,
  },
  {
    translationKey: "sidebar.settings",
    icon: Settings,
    path: "/settings",
    active: false,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

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
              <Link key={module.translationKey} href={module.path}>
                <div
                  className={isActive ? "nav-item nav-item-active" : "nav-item"}
                >
                  <div className="w-full">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{t(module.translationKey)}</span>
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
