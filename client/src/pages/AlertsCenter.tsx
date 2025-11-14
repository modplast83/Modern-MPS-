import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import {
  AlertTriangle,
  Shield,
  Activity,
  Database,
  Factory,
  Package,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  TrendingUp,
  Users,
  Bell,
  Filter,
  Search,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";

// أنواع البيانات
interface SystemAlert {
  id: number;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  type: string;
  category: string;
  severity: string;
  source: string;
  source_id?: string;
  status: string;
  requires_action: boolean;
  context_data?: Record<string, any>;
  suggested_actions?: {
    action: string;
    priority: number;
    description?: string;
  }[];
  target_users?: number[];
  target_roles?: number[];
  occurrences: number;
  first_occurrence: string;
  last_occurrence: string;
  resolved_by?: number;
  resolved_at?: string;
  created_at: string;
}

interface AlertStats {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  resolved_today: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
}

interface HealthStatus {
  overall_status: string;
  healthy_checks: number;
  warning_checks: number;
  critical_checks: number;
  last_check: string;
}

/**
 * مركز التحذيرات الذكية الشامل
 */
export default function AlertsCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب التحذيرات
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<
    SystemAlert[]
  >({
    queryKey: [
      "/api/alerts",
      {
        status: filterStatus,
        type: filterType === "all" ? undefined : filterType,
        severity: filterSeverity === "all" ? undefined : filterSeverity,
      },
    ],
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // جلب إحصائيات التحذيرات
  const { data: stats } = useQuery<AlertStats>({
    queryKey: ["/api/alerts/stats"],
    refetchInterval: 60000, // تحديث كل دقيقة
  });

  // جلب حالة النظام
  const { data: healthStatus } = useQuery<HealthStatus>({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000,
  });

  // حل التحذير
  const resolveAlertMutation = useMutation({
    mutationFn: async ({
      alertId,
      notes,
    }: {
      alertId: number;
      notes?: string;
    }) => {
      return apiRequest(`/api/alerts/${alertId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/stats"] });
      toast({
        title: "تم حل التحذير بنجاح",
        description: "تم تحديث حالة التحذير",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حل التحذير",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // إغلاق التحذير
  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest(`/api/alerts/${alertId}/dismiss`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/stats"] });
      toast({
        title: "تم إغلاق التحذير",
        description: "تم إغلاق التحذير بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إغلاق التحذير",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // فلترة التحذيرات
  const filteredAlerts = alerts.filter((alert: SystemAlert) => {
    const matchesSearch =
      searchQuery === "" ||
      alert.title_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message_ar.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // الحصول على أيقونة النوع
  const getTypeIcon = (type: string) => {
    const icons = {
      system: Database,
      production: Factory,
      inventory: Package,
      quality: CheckCircle2,
      maintenance: Settings,
      security: Shield,
      performance: Activity,
    };
    return icons[type as keyof typeof icons] || AlertTriangle;
  };

  // الحصول على أيقونة الخطورة
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return AlertTriangle;
      case "resolved":
        return CheckCircle2;
      case "dismissed":
        return XCircle;
      default:
        return Clock;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            مركز التحذيرات الذكية
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            مراقبة شاملة لحالة النظام والتحذيرات الاستباقية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Activity className="w-4 h-4 ml-1" />
            مراقبة مباشرة
          </Badge>
        </div>
      </div>

      {/* ملخص حالة النظام */}
      {healthStatus && (
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              حالة النظام العامة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    healthStatus.overall_status === "healthy"
                      ? "text-green-600"
                      : healthStatus.overall_status === "warning"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {healthStatus.overall_status === "healthy"
                    ? "سليم"
                    : healthStatus.overall_status === "warning"
                      ? "تحذير"
                      : "خطر"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  الحالة العامة
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {healthStatus.healthy_checks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  فحوصات سليمة
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {healthStatus.warning_checks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  تحذيرات
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {healthStatus.critical_checks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  حالات خطرة
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* إحصائيات التحذيرات */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    إجمالي التحذيرات
                  </p>
                  <p className="text-2xl font-bold">{stats.total_alerts}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    تحذيرات نشطة
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.active_alerts}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    تحذيرات حرجة
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.critical_alerts}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    تم حلها اليوم
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.resolved_today}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* الفلاتر والبحث */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في التحذيرات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  data-testid="input-search-alerts"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                className="w-40"
                data-testid="select-filter-status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="resolved">محلولة</SelectItem>
                <SelectItem value="dismissed">مغلقة</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40" data-testid="select-filter-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="system">نظام</SelectItem>
                <SelectItem value="production">إنتاج</SelectItem>
                <SelectItem value="inventory">مخزون</SelectItem>
                <SelectItem value="quality">جودة</SelectItem>
                <SelectItem value="maintenance">صيانة</SelectItem>
                <SelectItem value="security">أمان</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger
                className="w-40"
                data-testid="select-filter-severity"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المستويات</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">عالي</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة التحذيرات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            التحذيرات ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {alertsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    جاري تحميل التحذيرات...
                  </p>
                </div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  لا توجد تحذيرات
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  رائع! لا توجد تحذيرات تطابق المعايير المحددة
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert: SystemAlert) => {
                  const TypeIcon = getTypeIcon(alert.type);
                  const StatusIcon = getStatusIcon(alert.status);

                  return (
                    <Card
                      key={alert.id}
                      className={`border-r-4 ${
                        alert.severity === "critical"
                          ? "border-r-red-500"
                          : alert.severity === "high"
                            ? "border-r-orange-500"
                            : alert.severity === "medium"
                              ? "border-r-yellow-500"
                              : "border-r-blue-500"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                              <TypeIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {alert.title_ar}
                                </h3>
                                <Badge
                                  variant={getSeverityColor(alert.severity)}
                                >
                                  {alert.severity === "critical"
                                    ? "حرج"
                                    : alert.severity === "high"
                                      ? "عالي"
                                      : alert.severity === "medium"
                                        ? "متوسط"
                                        : "منخفض"}
                                </Badge>
                                <Badge variant="outline">
                                  {alert.type === "system"
                                    ? "نظام"
                                    : alert.type === "production"
                                      ? "إنتاج"
                                      : alert.type === "inventory"
                                        ? "مخزون"
                                        : alert.type === "quality"
                                          ? "جودة"
                                          : alert.type === "maintenance"
                                            ? "صيانة"
                                            : alert.type === "security"
                                              ? "أمان"
                                              : alert.type}
                                </Badge>
                              </div>

                              <p className="text-gray-600 dark:text-gray-300 mb-3">
                                {alert.message_ar}
                              </p>

                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <StatusIcon className="w-4 h-4" />
                                  {alert.status === "active"
                                    ? "نشط"
                                    : alert.status === "resolved"
                                      ? "محلول"
                                      : alert.status === "dismissed"
                                        ? "مغلق"
                                        : alert.status}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatDistanceToNow(
                                    new Date(alert.created_at),
                                    {
                                      addSuffix: true,
                                      locale: ar,
                                    },
                                  )}
                                </div>
                                {alert.occurrences > 1 && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {alert.occurrences} مرة
                                  </div>
                                )}
                              </div>

                              {/* الإجراءات المقترحة */}
                              {alert.suggested_actions &&
                                alert.suggested_actions.length > 0 && (
                                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                      إجراءات مقترحة:
                                    </p>
                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                      {alert.suggested_actions.map(
                                        (action, index) => (
                                          <li
                                            key={index}
                                            className="flex items-center gap-2"
                                          >
                                            <ChevronRight className="w-3 h-3" />
                                            {action.description ||
                                              action.action}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* أزرار الإجراءات */}
                          {alert.status === "active" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  resolveAlertMutation.mutate({
                                    alertId: alert.id,
                                  })
                                }
                                disabled={resolveAlertMutation.isPending}
                                data-testid={`button-resolve-${alert.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 ml-1" />
                                حل
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  dismissAlertMutation.mutate(alert.id)
                                }
                                disabled={dismissAlertMutation.isPending}
                                data-testid={`button-dismiss-${alert.id}`}
                              >
                                <XCircle className="w-4 h-4 ml-1" />
                                إغلاق
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
