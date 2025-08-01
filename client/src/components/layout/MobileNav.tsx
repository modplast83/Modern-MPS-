import { 
  Cog, 
  Warehouse, 
  ClipboardCheck, 
  Users, 
  Menu 
} from "lucide-react";

const navItems = [
  { name: "الإنتاج", icon: Cog, active: true },
  { name: "المستودع", icon: Warehouse, active: false },
  { name: "الجودة", icon: ClipboardCheck, active: false },
  { name: "الموارد", icon: Users, active: false },
  { name: "المزيد", icon: Menu, active: false },
];

export default function MobileNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button 
              key={item.name}
              className={`flex flex-col items-center p-2 ${
                item.active ? 'text-primary' : 'text-gray-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
