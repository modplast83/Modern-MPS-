import { LucideIcon, Home, LayoutDashboard, FileText, Activity, Monitor, ClipboardCheck, Wrench, Users, Warehouse, Database, BarChart3, Settings, Gauge } from "lucide-react";

export interface NavigationItem {
  name: string;
  name_ar: string;
  icon: LucideIcon;
  path: string;
  priority: number; // 1-4 للعناصر السريعة على الجوال، 5+ للعناصر الأخرى
  group: 'primary' | 'support' | 'admin'; // تجميع العناصر في الـ drawer
}

export const navigationItems: NavigationItem[] = [
  {
    name: "الرئيسية",
    name_ar: "الرئيسية",
    icon: Home,
    path: "/",
    priority: 1,
    group: 'primary',
  },
  {
    name: "لوحة التحكم",
    name_ar: "لوحة التحكم",
    icon: LayoutDashboard,
    path: "/user-dashboard",
    priority: 5,
    group: 'primary',
  },
  {
    name: "الطلبات والإنتاج",
    name_ar: "الطلبات والإنتاج",
    icon: FileText,
    path: "/orders",
    priority: 2,
    group: 'primary',
  },
  {
    name: "لوحة الإنتاج",
    name_ar: "لوحة الإنتاج",
    icon: Activity,
    path: "/production-dashboard",
    priority: 3,
    group: 'primary',
  },
  {
    name: "مراقبة الإنتاج",
    name_ar: "مراقبة الإنتاج",
    icon: Monitor,
    path: "/production-monitoring",
    priority: 6,
    group: 'primary',
  },
  {
    name: "الجودة",
    name_ar: "الجودة",
    icon: ClipboardCheck,
    path: "/quality",
    priority: 7,
    group: 'support',
  },
  {
    name: "الصيانة",
    name_ar: "الصيانة",
    icon: Wrench,
    path: "/maintenance",
    priority: 8,
    group: 'support',
  },
  {
    name: "الموارد البشرية",
    name_ar: "الموارد البشرية",
    icon: Users,
    path: "/hr",
    priority: 9,
    group: 'support',
  },
  {
    name: "المستودع",
    name_ar: "المستودع",
    icon: Warehouse,
    path: "/warehouse",
    priority: 4,
    group: 'primary',
  },
  {
    name: "التعريفات",
    name_ar: "التعريفات",
    icon: Database,
    path: "/definitions",
    priority: 10,
    group: 'admin',
  },
  {
    name: "التقارير",
    name_ar: "التقارير",
    icon: BarChart3,
    path: "/reports",
    priority: 11,
    group: 'admin',
  },
  {
    name: "الأدوات",
    name_ar: "الأدوات",
    icon: Wrench,
    path: "/tools",
    priority: 12,
    group: 'admin',
  },
  {
    name: "الإعدادات",
    name_ar: "الإعدادات",
    icon: Settings,
    path: "/settings",
    priority: 13,
    group: 'admin',
  },
  {
    name: "مراقبة النظام",
    name_ar: "مراقبة النظام",
    icon: Gauge,
    path: "/system-monitoring",
    priority: 14,
    group: 'admin',
  },
];

export const getQuickAccessItems = (items: NavigationItem[]): NavigationItem[] => {
  return items.filter(item => item.priority <= 4).sort((a, b) => a.priority - b.priority);
};

export const groupNavigationItems = (items: NavigationItem[]) => {
  return {
    primary: items.filter(item => item.group === 'primary').sort((a, b) => a.priority - b.priority),
    support: items.filter(item => item.group === 'support').sort((a, b) => a.priority - b.priority),
    admin: items.filter(item => item.group === 'admin').sort((a, b) => a.priority - b.priority),
  };
};
