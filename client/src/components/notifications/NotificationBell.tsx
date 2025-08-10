import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

type Notification = {
  id: number;
  title: string;
  message: string;
  status: string;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();

  // Fetch user's notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user?.id,
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read_at && n.status !== 'failed').length;

  return (
    <Link to="/notifications">
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}