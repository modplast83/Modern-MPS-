import {
  Home,
  Warehouse,
  ClipboardCheck,
  Database,
  BarChart3,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { name: "الرئيسية", name_ar: "الرئيسية", icon: Home, path: "/" },
  {
    name: "المستودع",
    name_ar: "المستودع",
    icon: Warehouse,
    path: "/warehouse",
  },
  { name: "الجودة", name_ar: "الجودة", icon: ClipboardCheck, path: "/quality" },
  {
    name: "التعريفات",
    name_ar: "التعريفات",
    icon: Database,
    path: "/definitions",
  },
];

export default function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.name} href={item.path}>
              <button
                className={`flex flex-col items-center p-2 min-w-0 ${
                  isActive ? "text-blue-600" : "text-gray-600"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs leading-tight">{item.name_ar}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
