import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { Link } from "wouter";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  status: string;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();

  // Fetch user's notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: [`/api/notifications?user_id=${user?.id}`],
    enabled: !!user?.id,
  });

  // Filter out system notifications and count unread
  const filteredNotifications = notifications.filter(
    (n) => n.type !== "system"
  );
  
  const unreadCount = filteredNotifications.filter(
    (n) =>{t('components.notifications.NotificationBell.!n.read_at_&&_n.status_!==_"failed",_).length;_return_(')}<Link to="/notifications">
      <Button variant="ghost" size="sm" className={t("components.notifications.notificationbell.name.relative")}>
        <Bell className={t("components.notifications.notificationbell.name.h_5_w_5")} />
        {unreadCount >{t('components.notifications.NotificationBell.0_&&_(')}<Badge
            variant="destructive"
            className={t("components.notifications.notificationbell.name.absolute_top_1_right_1_h_5_w_5_flex_items_center_justify_center_text_xs_p_0")}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
