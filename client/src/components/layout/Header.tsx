import { Bell, Bot, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MPBF Next</h1>
            <p className="text-sm text-gray-600">نظام إدارة مصنع الأكياس البلاستيكية</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse">
          <Button variant="default" size="sm" className="btn-primary">
            <Bot className="h-4 w-4 ml-2" />
            <span className="hidden sm:inline">المساعد الذكي</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              3
            </Badge>
          </Button>

          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.display_name_ar || user?.display_name || user?.username}
              </p>
              <p className="text-xs text-gray-600">مدير الإنتاج</p>
            </div>
            <button 
              onClick={logout}
              className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              {(user?.display_name_ar || user?.display_name || user?.username || 'م').charAt(0)}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
