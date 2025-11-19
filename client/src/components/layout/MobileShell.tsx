import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { useAuth } from "../../hooks/use-auth";
import { canAccessRoute } from "../../utils/roleUtils";
import { navigationItems, getQuickAccessItems, groupNavigationItems } from "../../config/navigationConfig";

export default function MobileShell() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Filter accessible items based on user permissions
  const accessibleItems = navigationItems.filter(item => canAccessRoute(user, item.path));
  
  // Get quick access items (top 4 priority items)
  const quickAccessItems = getQuickAccessItems(accessibleItems);
  
  // Group items for drawer
  const groupedItems = groupNavigationItems(accessibleItems);

  const renderNavItem = (item: typeof navigationItems[0], testIdPrefix: string = "") => {
    const Icon = item.icon;
    const isActive = location === item.path;

    return (
      <Link key={item.path} href={item.path}>
        <button
          onClick={() => setIsOpen(false)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
          data-testid={`${testIdPrefix}nav-item-${item.path.replace(/\//g, '-')}`}
        >
          <Icon className="h-5 w-5" />
          <span className="font-medium">{item.name_ar}</span>
        </button>
      </Link>
    );
  };

  return (
    <>
      {/* Quick Actions Bar - Fixed Bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 shadow-lg">
        <div className="flex items-center justify-around py-2 px-2">
          {/* Hamburger Menu Button */}
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <button
                className="flex flex-col items-center p-2 min-w-0 text-gray-600 dark:text-gray-400 hover:text-primary"
                data-testid="mobile-menu-trigger"
              >
                <Menu className="h-5 w-5 mb-1" />
                <span className="text-xs leading-tight">القائمة</span>
              </button>
            </DrawerTrigger>

            <DrawerContent className="max-h-[85vh]" data-testid="mobile-drawer">
              <DrawerHeader className="border-b">
                <div className="flex items-center justify-between">
                  <DrawerTitle className="text-xl font-bold">القائمة الرئيسية</DrawerTitle>
                  <DrawerClose asChild>
                    <Button variant="ghost" size="icon" data-testid="close-drawer">
                      <X className="h-5 w-5" />
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerHeader>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {/* Primary Operations */}
                  {groupedItems.primary.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-4">
                        العمليات الرئيسية
                      </h3>
                      <div className="space-y-1">
                        {groupedItems.primary.map(item => renderNavItem(item, "drawer-primary-"))}
                      </div>
                    </div>
                  )}

                  {/* Support Functions */}
                  {groupedItems.support.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-4">
                          الدعم والمتابعة
                        </h3>
                        <div className="space-y-1">
                          {groupedItems.support.map(item => renderNavItem(item, "drawer-support-"))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Admin Functions */}
                  {groupedItems.admin.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-4">
                          الإدارة والإعدادات
                        </h3>
                        <div className="space-y-1">
                          {groupedItems.admin.map(item => renderNavItem(item, "drawer-admin-"))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* User Info at bottom */}
                {user && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.display_name_ar || user.display_name || user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.role_name_ar || user.role_name || 'مستخدم'}
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </DrawerContent>
          </Drawer>

          {/* Quick Access Buttons (Top 3 items after menu) */}
          {quickAccessItems.slice(0, 3).map(item => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center p-2 min-w-0 transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-gray-600 dark:text-gray-400 hover:text-primary"
                  }`}
                  data-testid={`quick-action-${item.path.replace(/\//g, '-')}`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs leading-tight truncate max-w-[60px]">
                    {item.name_ar}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
