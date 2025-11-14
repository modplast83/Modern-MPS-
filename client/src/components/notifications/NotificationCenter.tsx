import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Switch } from "../ui/switch";
import {
  Bell,
  MessageSquare,
  Send,
  TestTube,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Settings,
  Users,
  AlertCircle,
  Zap,
  Loader2,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useSSE, type SSENotification } from "../../hooks/use-sse";

interface Notification {
  id: number;
  title: string;
  title_ar?: string;
  message: string;
  message_ar?: string;
  type: string;
  priority: string;
  status: string;
  phone_number?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
  twilio_sid?: string;
  error_message?: string;
  context_type?: string;
  context_id?: string;
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("normal");

  // System notification form states
  const [systemTitle, setSystemTitle] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [systemType, setSystemType] = useState<
    "system" | "order" | "production" | "maintenance" | "quality" | "hr"
  >{t('components.notifications.NotificationCenter.("system");_const_[systempriority,_setsystempriority]_=_usestate')}<
    "low" | "normal" | "high" | "urgent"
  >{t('components.notifications.NotificationCenter.("normal");_const_[recipienttype,_setrecipienttype]_=_usestate')}<"user" | "role" | "all">{t('components.notifications.NotificationCenter.(_"all",_);_const_[recipientid,_setrecipientid]_=_usestate("");_const_[notificationsound,_setnotificationsound]_=_usestate(false);_//_real-time_notifications_state_const_[realtimenotifications,_setrealtimenotifications]_=_usestate')}<
    SSENotification[]
  >([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch initial notifications (for WhatsApp history)
  const { data: whatsappNotifications, isLoading: whatsappLoading } = useQuery<
    Notification[]
  >({
    queryKey: ["/api/notifications"],
  });

  // Fetch user notifications with real-time support
  const {
    data: userNotificationsData,
    isLoading: userNotificationsLoading,
    refetch: refetchUserNotifications,
  } = useQuery({
    queryKey: ["/api/notifications/user", { unread_only: showUnreadOnly }],
    queryFn: async () => {
      const response = await fetch(
        `/api/notifications/user?unread_only=${showUnreadOnly}&limit=100`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user notifications");
      }
      return response.json() as Promise<{
        notifications: Notification[];
        unread_count: number;
      }>;
    },
  });

  // SSE event handlers
  const handleNewNotification = useCallback(
    (notification: SSENotification) => {
      // Filter out system notifications
      if (notification.type === "system") {
        return;
      }
      
      // Add to realtime notifications
      setRealtimeNotifications((prev) => [notification, ...prev]);

      // Show toast for new notification
      toast({
        title:
          notification.icon +
          " " +
          (notification.title_ar || notification.title),
        description: notification.message_ar || notification.message,
        duration:
          notification.priority === "urgent"
            ? 10000
            : notification.priority === "high"
              ? 7000
              : 5000,
      });

      // Invalidate query to automatically refetch - more efficient than manual refetch
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user"] });
    },
    [toast, queryClient],
  );

  const handleRecentNotifications = useCallback(
    (data: { notifications: SSENotification[]; count: number }) => {
      // Filter out system notifications
      const filteredNotifications = data.notifications.filter(
        n => n.type !== "system"
      );
      setRealtimeNotifications(filteredNotifications);
      console.log(
        `[NotificationCenter] Received ${filteredNotifications.length} non-system notifications`,
      );
    },
    [],
  );

  const handleSSEConnected = useCallback(() => {
    console.log("[NotificationCenter] SSE connected successfully");
  }, []);

  const handleSSEError = useCallback((error: Event) => {
    console.error("[NotificationCenter] SSE connection error:", error);
  }, []);

  // Memoize event handlers object to prevent infinite re-renders
  const sseEventHandlers = useMemo(
    () => ({
      onNotification: handleNewNotification,
      onRecentNotifications: handleRecentNotifications,
      onConnected: handleSSEConnected,
      onError: handleSSEError,
    }),
    [
      handleNewNotification,
      handleRecentNotifications,
      handleSSEConnected,
      handleSSEError,
    ],
  );

  // Initialize SSE connection
  const { connectionState, reconnect } = useSSE(sseEventHandlers);

  // Create system notification mutation
  const createSystemNotificationMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      message: string;
      type: string;
      priority: string;
      recipient_type: string;
      recipient_id?: string;
      sound?: boolean;
    }) => {
      return await apiRequest("/api/notifications/system", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: t('notifications.sent'),
        description: t('notifications.sent'),
      });
      setSystemTitle("");
      setSystemMessage("");
      setRecipientId("");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user"] });
    },
    onError: (error: any) => {
      toast({
        title: t('notifications.sendError'),
        description: error.message || t('notifications.sendError'),
        variant: "destructive",
      });
    },
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest(
        `/api/notifications/mark-read/${notificationId}`,
        {
          method: "PATCH",
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: any) => {
      toast({
        title: t('notifications.markReadError'),
        description: error.message || t('notifications.markReadErrorMessage'),
        variant: "destructive",
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/notifications/mark-all-read", {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user"] });
      setRealtimeNotifications([]);
      toast({
        title: t('notifications.updated'),
        description: t('notifications.allMarkedRead'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('notifications.markReadError'),
        description: error.message || t('notifications.markAllReadError'),
        variant: "destructive",
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest(`/api/notifications/delete/${notificationId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: t('notifications.deleted'),
        description: t('notifications.deletedSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('notifications.deleteError'),
        description: error.message || t('notifications.deleteErrorMessage'),
        variant: "destructive",
      });
    },
  });

  // Send WhatsApp message mutation
  const sendWhatsAppMutation = useMutation({
    mutationFn: async (data: {
      phone_number: string;
      message: string;
      title?: string;
      priority?: string;
    }) => {
      return await apiRequest("/api/notifications/whatsapp", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: t('notifications.messageSent'),
        description: t('notifications.messageSentSuccess'),
      });
      setMessage("");
      setTitle("");
      setPhoneNumber("");
    },
    onError: (error: any) => {
      toast({
        title: t('notifications.sendError'),
        description: error.message || t('notifications.sendErrorMessage'),
        variant: "destructive",
      });
    },
  });

  // Send test message mutation
  const sendTestMutation = useMutation({
    mutationFn: async (phone_number: string) => {
      return await apiRequest("/api/notifications/test", {
        method: "POST",
        body: JSON.stringify({ phone_number }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: t('notifications.testSent'),
        description: t('notifications.testSentSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('notifications.testError'),
        description: error.message || t('notifications.testErrorMessage'),
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleSendMessage = () => {
    if (!phoneNumber || !message) {
      toast({
        title: t('notifications.missingData'),
        description: t('notifications.missingPhoneMessage'),
        variant: "destructive",
      });
      return;
    }

    sendWhatsAppMutation.mutate({
      phone_number: phoneNumber,
      message,
      title,
      priority,
    });
  };

  const handleSendSystemNotification = () => {
    if (!systemTitle || !systemMessage) {
      toast({
        title: t('notifications.missingData'),
        description: t('notifications.missingTitleMessage'),
        variant: "destructive",
      });
      return;
    }

    if (recipientType !== "all" && !recipientId) {
      toast({
        title: t('notifications.recipientIdRequired'),
        description: t('notifications.recipientIdRequiredMessage'),
        variant: "destructive",
      });
      return;
    }

    createSystemNotificationMutation.mutate({
      title: systemTitle,
      message: systemMessage,
      type: systemType,
      priority: systemPriority,
      recipient_type: recipientType,
      recipient_id: recipientType === "all" ? undefined : recipientId,
      sound: notificationSound,
    });
  };

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleReconnectSSE = () => {
    reconnect();
  };

  // Effect to update filter when showUnreadOnly changes
  useEffect(() => {
    refetchUserNotifications();
  }, [showUnreadOnly, refetchUserNotifications]);

  const handleSendTest = () => {
    if (!phoneNumber) {
      toast({
        title: t('notifications.phoneRequired'),
        description: t('notifications.phoneRequiredMessage'),
        variant: "destructive",
      });
      return;
    }

    sendTestMutation.mutate(phoneNumber);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Send className={t("components.notifications.notificationcenter.name.h_4_w_4_text_blue_500")} />{t('components.notifications.NotificationCenter.;_case_"delivered":_return')}<CheckCircle className={t("components.notifications.notificationcenter.name.h_4_w_4_text_green_500")} />{t('components.notifications.NotificationCenter.;_case_"failed":_return')}<XCircle className={t("components.notifications.notificationcenter.name.h_4_w_4_text_red_500")} />{t('components.notifications.NotificationCenter.;_default:_return')}<Clock className={t("components.notifications.notificationcenter.name.h_4_w_4_text_yellow_500")} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className={t("components.notifications.notificationcenter.name.space_y_6")}>
      <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2_mb_6")}>
        <Bell className={t("components.notifications.notificationcenter.name.h_6_w_6_text_blue_600")} />
        <h1 className={t("components.notifications.notificationcenter.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
          {t('notifications.center')}
        </h1>
      </div>

      {/* SSE Connection Status */}
      <Card className={t("components.notifications.notificationcenter.name.mb_6")}>
        <CardContent className={t("components.notifications.notificationcenter.name.p_4")}>
          <div className={t("components.notifications.notificationcenter.name.flex_items_center_justify_between")}>
            <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}>
              {connectionState.isConnected ? (
                <Wifi className={t("components.notifications.notificationcenter.name.h_5_w_5_text_green_500")} />{t('components.notifications.NotificationCenter.)_:_connectionstate.isconnecting_?_(')}<Loader2 className={t("components.notifications.notificationcenter.name.h_5_w_5_text_yellow_500_animate_spin")} />{t('components.notifications.NotificationCenter.)_:_(')}<WifiOff className={t("components.notifications.notificationcenter.name.h_5_w_5_text_red_500")} />
              )}
              <span className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>
                {connectionState.isConnected
                  ? t('notifications.connected')
                  : connectionState.isConnecting
                    ? t('notifications.connecting')
                    : t('notifications.disconnected')}
              </span>
            </div>
            {connectionState.error && (
              <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}>
                <span className={t("components.notifications.notificationcenter.name.text_xs_text_red_600")}>
                  {connectionState.error}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReconnectSSE}
                >
                  {t('notifications.reconnect')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="realtime" className={t("components.notifications.notificationcenter.name.space_y_6")}>
        <TabsList className={t("components.notifications.notificationcenter.name.grid_w_full_grid_cols_4")}>
          <TabsTrigger
            value="realtime"
            className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}
            data-testid="tab-realtime"
          >
            <Bell className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
            {t('notifications.realtime')}
          </TabsTrigger>
          <TabsTrigger
            value="send"
            className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}
            data-testid="tab-send"
          >
            <MessageSquare className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
            {t('notifications.sendMessages')}
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}
            data-testid="tab-system"
          >
            <Settings className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
            {t('notifications.systemNotifications')}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}
            data-testid="tab-history"
          >
            <Clock className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
            {t('notifications.history')}
          </TabsTrigger>
        </TabsList>

        {/* Real-time Notifications Tab */}
        <TabsContent value="realtime" className={t("components.notifications.notificationcenter.name.space_y_6")}>
          <Card>
            <CardHeader>
              <div className={t("components.notifications.notificationcenter.name.flex_items_center_justify_between")}>
                <CardTitle className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}>
                  <Zap className={t("components.notifications.notificationcenter.name.h_5_w_5_text_blue_600")} />
                  {t('notifications.realtime')}
                  {userNotificationsData?.unread_count &&
                    userNotificationsData.unread_count >{t('components.notifications.NotificationCenter.0_&&_(')}<Badge variant="destructive" className={t("components.notifications.notificationcenter.name.ml_2")}>
                        {userNotificationsData.unread_count}
                      </Badge>
                    )}
                </CardTitle>
                <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}>
                  <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}>
                    <Switch
                      checked={showUnreadOnly}
                      onCheckedChange={setShowUnreadOnly}
                      data-testid="switch-unread-only"
                    />
                    <span className={t("components.notifications.notificationcenter.name.text_sm_text_gray_600")}>
                      {t('notifications.unreadOnly')}
                    </span>
                  </div>
                  {(userNotificationsData?.unread_count || 0) >{t('components.notifications.NotificationCenter.0_&&_(')}<Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkAllAsRead}
                      disabled={markAllAsReadMutation.isPending}
                      data-testid="button-mark-all-read"
                    >
                      {markAllAsReadMutation.isPending && (
                        <Loader2 className={t("components.notifications.notificationcenter.name.h_4_w_4_animate_spin_ml_1")} />
                      )}
                      {t('notifications.markAllRead')}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {userNotificationsLoading ? (
                <div className={t("components.notifications.notificationcenter.name.flex_items_center_justify_center_py_8")}>
                  <Loader2 className={t("components.notifications.notificationcenter.name.h_6_w_6_animate_spin_text_blue_600")} />
                  <span className={t("components.notifications.notificationcenter.name.ml_2")}>{t('notifications.loading')}</span>
                </div>{t('components.notifications.NotificationCenter.)_:_(')}<div className={t("components.notifications.notificationcenter.name.space_y_4_max_h_96_overflow_y_auto")}>
                  {userNotificationsData?.notifications &&
                  userNotificationsData.notifications.filter(n => n.type !== "system").length > 0 ? (
                    userNotificationsData.notifications
                      .filter(n => n.type !== "system")
                      .map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg transition-all ${
                          !notification.read_at
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        }`}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className={t("components.notifications.notificationcenter.name.flex_items_start_justify_between")}>
                          <div className={t("components.notifications.notificationcenter.name.flex_1")}>
                            <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2_mb_1")}>
                              <span className={t("components.notifications.notificationcenter.name.font_medium_text_gray_900_dark_text_white")}>
                                {notification.title_ar || notification.title}
                              </span>
                              <Badge
                                className={getPriorityColor(
                                  notification.priority,
                                )}
                              >
                                {notification.priority}
                              </Badge>
                              <Badge
                                className={getStatusColor(notification.status)}
                              >
                                {getStatusIcon(notification.status)}
                                {notification.status}
                              </Badge>
                              {!notification.read_at && (
                                <Badge
                                  variant="secondary"
                                  className={t("components.notifications.notificationcenter.name.bg_blue_100_text_blue_800")}
                                >
                                  {t('notifications.new')}
                                </Badge>
                              )}
                            </div>
                            <p className={t("components.notifications.notificationcenter.name.text_gray_700_dark_text_gray_300_text_sm_mb_2")}>
                              {notification.message_ar || notification.message}
                            </p>
                            <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_4_text_xs_text_gray_500")}>
                              <span>{t('notifications.type')}: {notification.type}</span>
                              <span>
                                {t('notifications.date')}:{" "}
                                {new Date(
                                  notification.created_at,
                                ).toLocaleString("ar")}
                              </span>
                              {notification.context_type && (
                                <span>{t('common.details')}: {notification.context_type}</span>
                              )}
                            </div>
                          </div>
                          <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_1")}>
                            {!notification.read_at && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                disabled={markAsReadMutation.isPending}
                                data-testid={`button-mark-read-${notification.id}`}
                              >
                                <Eye className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className={t("components.notifications.notificationcenter.name.text_red_600_hover_text_red_700")}
                              onClick={() =>
                                handleDeleteNotification(notification.id)
                              }
                              disabled={deleteNotificationMutation.isPending}
                              data-testid={`button-delete-${notification.id}`}
                            >
                              <Trash2 className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
                            </Button>
                          </div>
                        </div>
                      </div>{t('components.notifications.NotificationCenter.))_)_:_(')}<div className={t("components.notifications.notificationcenter.name.text_center_py_8_text_gray_500")}>
                      <Bell className={t("components.notifications.notificationcenter.name.h_12_w_12_mx_auto_mb_4_text_gray_300")} />
                      <p>{t('notifications.noNotificationsYet')}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Notifications Tab */}
        <TabsContent value="system" className={t("components.notifications.notificationcenter.name.space_y_6")}>
          <Card>
            <CardHeader>
              <CardTitle className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}>
                <Settings className={t("components.notifications.notificationcenter.name.h_5_w_5_text_purple_600")} />
                {t('notifications.systemNotificationForm')}
              </CardTitle>
            </CardHeader>
            <CardContent className={t("components.notifications.notificationcenter.name.space_y_4")}>
              <div className={t("components.notifications.notificationcenter.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
                <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                  <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.title')} *</label>
                  <Input
                    placeholder={t('notifications.titlePlaceholder')}
                    value={systemTitle}
                    onChange={(e) => setSystemTitle(e.target.value)}
                    data-testid="input-system-title"
                  />
                </div>
                <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                  <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.notificationType')}</label>
                  <Select
                    value={systemType ?? ""}
                    onValueChange={(value: any) => setSystemType(value)}
                  >
                    <SelectTrigger data-testid="select-system-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">{t('components.notifications.NotificationCenter.نظام')}</SelectItem>
                      <SelectItem value="order">{t('components.notifications.NotificationCenter.طلب')}</SelectItem>
                      <SelectItem value="production">{t('components.notifications.NotificationCenter.إنتاج')}</SelectItem>
                      <SelectItem value="maintenance">{t('components.notifications.NotificationCenter.صيانة')}</SelectItem>
                      <SelectItem value="quality">{t('components.notifications.NotificationCenter.جودة')}</SelectItem>
                      <SelectItem value="hr">{t('components.notifications.NotificationCenter.موارد_بشرية')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.message')} *</label>
                <Textarea
                  placeholder={t('notifications.messagePlaceholder')}
                  value={systemMessage}
                  onChange={(e) => setSystemMessage(e.target.value)}
                  rows={3}
                  data-testid="textarea-system-message"
                />
              </div>

              <div className={t("components.notifications.notificationcenter.name.grid_grid_cols_1_md_grid_cols_3_gap_4")}>
                <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                  <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.priority')}</label>
                  <Select
                    value={systemPriority ?? ""}
                    onValueChange={(value: any) => setSystemPriority(value)}
                  >
                    <SelectTrigger data-testid="select-system-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('components.notifications.NotificationCenter.منخفضة')}</SelectItem>
                      <SelectItem value="normal">{t('components.notifications.NotificationCenter.عادية')}</SelectItem>
                      <SelectItem value="high">{t('components.notifications.NotificationCenter.عالية')}</SelectItem>
                      <SelectItem value="urgent">{t('components.notifications.NotificationCenter.عاجلة')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                  <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.recipientType')}</label>
                  <Select
                    value={recipientType ?? ""}
                    onValueChange={(value: any) => setRecipientType(value)}
                  >
                    <SelectTrigger data-testid="select-recipient-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('components.notifications.NotificationCenter.جميع_المستخدمين')}</SelectItem>
                      <SelectItem value="user">{t('components.notifications.NotificationCenter.مستخدم_محدد')}</SelectItem>
                      <SelectItem value="role">{t('components.notifications.NotificationCenter.دور_محدد')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recipientType !== "all" && (
                  <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                    <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.recipientId')}</label>
                    <Input
                      placeholder={t('notifications.recipientIdPlaceholder')}
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      type="number"
                      data-testid="input-recipient-id"
                    />
                  </div>
                )}
              </div>

              <div className={t("components.notifications.notificationcenter.name.flex_items_center_space_x_2")}>
                <Switch
                  checked={notificationSound}
                  onCheckedChange={setNotificationSound}
                  data-testid="switch-notification-sound"
                />
                <label className={t("components.notifications.notificationcenter.name.text_sm")}>{t('notifications.notificationSound')}</label>
              </div>

              <div className={t("components.notifications.notificationcenter.name.flex_gap_2_pt_4")}>
                <Button
                  onClick={handleSendSystemNotification}
                  disabled={createSystemNotificationMutation.isPending}
                  className={t("components.notifications.notificationcenter.name.flex_1")}
                  data-testid="button-send-system-notification"
                >
                  {createSystemNotificationMutation.isPending && (
                    <Loader2 className={t("components.notifications.notificationcenter.name.h_4_w_4_animate_spin_ml_1")} />
                  )}
                  <Send className={t("components.notifications.notificationcenter.name.h_4_w_4_ml_1")} />
                  {t('notifications.sendSystemNotification')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className={t("components.notifications.notificationcenter.name.space_y_6")}>
          <Card>
            <CardHeader>
              <CardTitle className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}>
                <MessageSquare className={t("components.notifications.notificationcenter.name.h_5_w_5_text_green_600")} />
                {t('notifications.sendMessages')}
              </CardTitle>
            </CardHeader>
            <CardContent className={t("components.notifications.notificationcenter.name.space_y_4")}>
              <div className={t("components.notifications.notificationcenter.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
                <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                  <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.phoneNumber')} *</label>
                  <div className={t("components.notifications.notificationcenter.name.flex_gap_2")}>
                    <Input
                      placeholder="{t('components.notifications.NotificationCenter.placeholder.+966501234567')}"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={t("components.notifications.notificationcenter.name.flex_1")}
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendTest}
                      disabled={sendTestMutation.isPending}
                    >
                      <TestTube className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
                    </Button>
                  </div>
                  <p className={t("components.notifications.notificationcenter.name.text_xs_text_gray_500")}>{t('components.notifications.NotificationCenter.مثال:_+966501234567_(يجب_أن_يبدأ_برمز_الدولة)')}</p>
                </div>

                <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                  <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.titleOptional')}</label>
                  <Input
                    placeholder={t('notifications.titlePlaceholder')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.message')} *</label>
                <Textarea
                  placeholder={t('notifications.messagePlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className={t("components.notifications.notificationcenter.name.resize_none")}
                />
              </div>

              <div className={t("components.notifications.notificationcenter.name.space_y_2")}>
                <label className={t("components.notifications.notificationcenter.name.text_sm_font_medium")}>{t('notifications.priority')}</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={t("components.notifications.notificationcenter.name.w_full_p_2_border_border_gray_300_rounded_md_dark_border_gray_600_dark_bg_gray_800")}
                >
                  <option value="low">{t('components.notifications.NotificationCenter.منخفضة')}</option>
                  <option value="normal">{t('components.notifications.NotificationCenter.عادية')}</option>
                  <option value="high">{t('components.notifications.NotificationCenter.عالية')}</option>
                  <option value="urgent">{t('components.notifications.NotificationCenter.عاجلة')}</option>
                </select>
              </div>

              <div className={t("components.notifications.notificationcenter.name.flex_gap_2")}>
                <Button
                  onClick={handleSendMessage}
                  disabled={sendWhatsAppMutation.isPending}
                  className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}
                >
                  <Send className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
                  {sendWhatsAppMutation.isPending
                    ? t('notifications.sending')
                    : t('notifications.sendMessage')}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={sendTestMutation.isPending || !phoneNumber}
                  className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2")}
                >
                  <TestTube className={t("components.notifications.notificationcenter.name.h_4_w_4")} />
                  {t('notifications.sendTest')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className={t("components.notifications.notificationcenter.name.space_y_6")}>
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.whatsappHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              {whatsappLoading ? (
                <div className={t("components.notifications.notificationcenter.name.text_center_py_8")}>
                  <div className={t("components.notifications.notificationcenter.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
                  <p className={t("components.notifications.notificationcenter.name.text_gray_600_mt_2")}>{t('notifications.loading')}</p>
                </div>
              ) : whatsappNotifications && whatsappNotifications.length >{t('components.notifications.NotificationCenter.0_?_(')}<div className={t("components.notifications.notificationcenter.name.space_y_3")}>
                  {whatsappNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={t("components.notifications.notificationcenter.name.border_border_gray_200_dark_border_gray_700_rounded_lg_p_4_space_y_3")}
                    >
                      <div className={t("components.notifications.notificationcenter.name.flex_items_start_justify_between")}>
                        <div className={t("components.notifications.notificationcenter.name.flex_1")}>
                          <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_2_mb_2")}>
                            {getStatusIcon(notification.status)}
                            <h3 className={t("components.notifications.notificationcenter.name.font_medium_text_gray_900_dark_text_white")}>
                              {notification.title_ar || notification.title}
                            </h3>
                            <Badge
                              className={getStatusColor(notification.status)}
                            >
                              {notification.status === "sent"
                                ? "مُرسل"
                                : notification.status === "delivered"
                                  ? "مُسلم"
                                  : notification.status === "failed"
                                    ? "فاشل"
                                    : "معلق"}
                            </Badge>
                            <Badge
                              className={getPriorityColor(
                                notification.priority,
                              )}
                            >
                              {notification.priority === "urgent"
                                ? "عاجل"
                                : notification.priority === "high"
                                  ? "عالي"
                                  : notification.priority === "low"
                                    ? "منخفض"
                                    : "عادي"}
                            </Badge>
                          </div>
                          <p className={t("components.notifications.notificationcenter.name.text_gray_600_dark_text_gray_400_mb_2")}>
                            {notification.message_ar || notification.message}
                          </p>
                          <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_4_text_sm_text_gray_500")}>
                            {notification.phone_number && (
                              <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_1")}>
                                <Phone className={t("components.notifications.notificationcenter.name.h_3_w_3")} />
                                {notification.phone_number}
                              </div>
                            )}
                            <div className={t("components.notifications.notificationcenter.name.flex_items_center_gap_1")}>
                              <Clock className={t("components.notifications.notificationcenter.name.h_3_w_3")} />
                              {new Date(notification.created_at).toLocaleString(
                                "ar",
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {notification.error_message && (
                        <div className={t("components.notifications.notificationcenter.name.bg_red_50_dark_bg_red_900_20_border_border_red_200_dark_border_red_800_rounded_p_2")}>
                          <p className={t("components.notifications.notificationcenter.name.text_red_700_dark_text_red_300_text_sm")}>
                            {t('notifications.error')}: {notification.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>{t('components.notifications.NotificationCenter.)_:_(')}<div className={t("components.notifications.notificationcenter.name.text_center_py_8")}>
                  <Bell className={t("components.notifications.notificationcenter.name.h_12_w_12_text_gray_400_mx_auto_mb_4")} />
                  <p className={t("components.notifications.notificationcenter.name.text_gray_600_dark_text_gray_400")}>{t('components.notifications.NotificationCenter.لا_توجد_إشعارات_بعد')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
