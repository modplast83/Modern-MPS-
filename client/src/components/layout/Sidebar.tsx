import { 
  Settings, 
  Cog, 
  Warehouse, 
  ClipboardCheck, 
  Users, 
  Wrench, 
  Database, 
  BarChart3 
} from "lucide-react";

const modules = [
  {
    name: "الإنتاج",
    name_ar: "الإنتاج",
    icon: Cog,
    active: true,
    subItems: [
      { name: "الطلبات", name_ar: "الطلبات" },
      { name: "أوامر التشغيل", name_ar: "أوامر التشغيل" },
      { name: "الرولات", name_ar: "الرولات" },
      { name: "إدارة الهدر", name_ar: "إدارة الهدر" },
    ]
  },
  {
    name: "المستودع",
    name_ar: "المستودع",
    icon: Warehouse,
    active: false
  },
  {
    name: "الجودة",
    name_ar: "الجودة",
    icon: ClipboardCheck,
    active: false
  },
  {
    name: "الموارد البشرية",
    name_ar: "الموارد البشرية",
    icon: Users,
    active: false
  },
  {
    name: "الصيانة",
    name_ar: "الصيانة",
    icon: Wrench,
    active: false
  },
  {
    name: "التعريفات",
    name_ar: "التعريفات",
    icon: Database,
    active: false
  },
  {
    name: "التقارير",
    name_ar: "التقارير",
    icon: BarChart3,
    active: false
  },
  {
    name: "الإعدادات",
    name_ar: "الإعدادات",
    icon: Settings,
    active: false
  },
];

export default function Sidebar() {
  return (
    <aside className="bg-white shadow-sm border-l border-gray-200 w-64 hidden lg:block">
      <nav className="p-4">
        <div className="space-y-2">
          {modules.map((module) => {
            const Icon = module.icon;
            
            return (
              <div key={module.name} className={module.active ? "nav-item active" : "nav-item"}>
                <div className="w-full">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{module.name_ar}</span>
                  </div>
                  
                  {module.active && module.subItems && (
                    <div className="space-y-1 mr-8 mt-2">
                      {module.subItems.map((item) => (
                        <a 
                          key={item.name}
                          href="#" 
                          className="block text-sm text-primary hover:text-primary/80 py-1"
                        >
                          {item.name_ar}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
