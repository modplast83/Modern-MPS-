import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  by_type: Record<string, number>{t('pages.AlertsCenter.;_by_severity:_record')}<string, number>;
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
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>{t('pages.AlertsCenter.("all");_const_[filterseverity,_setfilterseverity]_=_usestate')}<string>{t('pages.AlertsCenter.("all");_const_[filterstatus,_setfilterstatus]_=_usestate')}<string>("active");
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
        title: t('common.success'),
        description: t('alertsCenter.alertResolvedSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        title: t('common.success'),
        description: t('alertsCenter.alertDismissedSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
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
    <div className={t("pages.alertscenter.name.container_mx_auto_p_6_space_y_6")} dir="rtl">
      <div className={t("pages.alertscenter.name.flex_items_center_justify_between")}>
        <div>
          <h1 className={t("pages.alertscenter.name.text_3xl_font_bold_text_gray_900_dark_text_white")}>
            {t('sidebar.alerts')}
          </h1>
          <p className={t("pages.alertscenter.name.text_gray_600_dark_text_gray_300_mt_2")}>
            {t('systemHealth.overallStatus')}
          </p>
        </div>
        <div className={t("pages.alertscenter.name.flex_items_center_gap_2")}>
          <Badge variant="outline" className={t("pages.alertscenter.name.text_sm")}>
            <Activity className={t("pages.alertscenter.name.w_4_h_4_ml_1")} />
            {t('common.active')}
          </Badge>
        </div>
      </div>

      {/* ملخص حالة النظام */}
      {healthStatus && (
        <Card className={t("pages.alertscenter.name.border_2")}>
          <CardHeader className={t("pages.alertscenter.name.pb_3")}>
            <CardTitle className={t("pages.alertscenter.name.flex_items_center_gap_2")}>
              <Shield className={t("pages.alertscenter.name.w_5_h_5")} />
              {t('systemHealth.overallStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={t("pages.alertscenter.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
              <div className={t("pages.alertscenter.name.text_center")}>
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
                    ? t('systemHealth.healthy')
                    : healthStatus.overall_status === "warning"
                      ? t('systemHealth.warning')
                      : t('systemHealth.critical')}
                </div>
                <div className={t("pages.alertscenter.name.text_sm_text_gray_600_dark_text_gray_300")}>
                  {t('systemHealth.overallStatus')}
                </div>
              </div>
              <div className={t("pages.alertscenter.name.text_center")}>
                <div className={t("pages.alertscenter.name.text_2xl_font_bold_text_green_600")}>
                  {healthStatus.healthy_checks}
                </div>
                <div className={t("pages.alertscenter.name.text_sm_text_gray_600_dark_text_gray_300")}>
                  {t('systemHealth.healthyChecks')}
                </div>
              </div>
              <div className={t("pages.alertscenter.name.text_center")}>
                <div className={t("pages.alertscenter.name.text_2xl_font_bold_text_yellow_600")}>
                  {healthStatus.warning_checks}
                </div>
                <div className={t("pages.alertscenter.name.text_sm_text_gray_600_dark_text_gray_300")}>
                  {t('systemHealth.warningChecks')}
                </div>
              </div>
              <div className={t("pages.alertscenter.name.text_center")}>
                <div className={t("pages.alertscenter.name.text_2xl_font_bold_text_red_600")}>
                  {healthStatus.critical_checks}
                </div>
                <div className={t("pages.alertscenter.name.text_sm_text_gray_600_dark_text_gray_300")}>
                  {t('systemHealth.criticalChecks')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* إحصائيات التحذيرات */}
      {stats && (
        <div className={t("pages.alertscenter.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
          <Card>
            <CardContent className={t("pages.alertscenter.name.p_6")}>
              <div className={t("pages.alertscenter.name.flex_items_center_justify_between")}>
                <div>
                  <p className={t("pages.alertscenter.name.text_sm_font_medium_text_gray_600_dark_text_gray_300")}>
                    {t('alertsCenter.totalAlerts')}
                  </p>
                  <p className={t("pages.alertscenter.name.text_2xl_font_bold")}>{stats.total_alerts}</p>
                </div>
                <Bell className={t("pages.alertscenter.name.w_8_h_8_text_blue_600")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className={t("pages.alertscenter.name.p_6")}>
              <div className={t("pages.alertscenter.name.flex_items_center_justify_between")}>
                <div>
                  <p className={t("pages.alertscenter.name.text_sm_font_medium_text_gray_600_dark_text_gray_300")}>
                    {t('alertsCenter.activeAlerts')}
                  </p>
                  <p className={t("pages.alertscenter.name.text_2xl_font_bold_text_orange_600")}>
                    {stats.active_alerts}
                  </p>
                </div>
                <AlertTriangle className={t("pages.alertscenter.name.w_8_h_8_text_orange_600")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className={t("pages.alertscenter.name.p_6")}>
              <div className={t("pages.alertscenter.name.flex_items_center_justify_between")}>
                <div>
                  <p className={t("pages.alertscenter.name.text_sm_font_medium_text_gray_600_dark_text_gray_300")}>
                    {t('alertsCenter.criticalAlerts')}
                  </p>
                  <p className={t("pages.alertscenter.name.text_2xl_font_bold_text_red_600")}>
                    {stats.critical_alerts}
                  </p>
                </div>
                <AlertCircle className={t("pages.alertscenter.name.w_8_h_8_text_red_600")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className={t("pages.alertscenter.name.p_6")}>
              <div className={t("pages.alertscenter.name.flex_items_center_justify_between")}>
                <div>
                  <p className={t("pages.alertscenter.name.text_sm_font_medium_text_gray_600_dark_text_gray_300")}>
                    {t('alertsCenter.resolvedToday')}
                  </p>
                  <p className={t("pages.alertscenter.name.text_2xl_font_bold_text_green_600")}>
                    {stats.resolved_today}
                  </p>
                </div>
                <CheckCircle2 className={t("pages.alertscenter.name.w_8_h_8_text_green_600")} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* الفلاتر والبحث */}
      <Card>
        <CardContent className={t("pages.alertscenter.name.p_6")}>
          <div className={t("pages.alertscenter.name.flex_flex_col_md_flex_row_gap_4")}>
            <div className={t("pages.alertscenter.name.flex_1")}>
              <div className={t("pages.alertscenter.name.relative")}>
                <Search className={t("pages.alertscenter.name.absolute_right_3_top_1_2_transform_translate_y_1_2_text_gray_400_w_4_h_4")} />
                <Input
                  placeholder={t('alertsCenter.searchAlerts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={t("pages.alertscenter.name.pr_10")}
                  data-testid="input-search-alerts"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                className={t("pages.alertscenter.name.w_40")}
                data-testid="select-filter-status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="active">{t('alertsCenter.activeStatus')}</SelectItem>
                <SelectItem value="resolved">{t('alertsCenter.resolvedStatus')}</SelectItem>
                <SelectItem value="dismissed">{t('alertsCenter.dismissedStatus')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className={t("pages.alertscenter.name.w_40")} data-testid="select-filter-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('alertsCenter.allTypes')}</SelectItem>
                <SelectItem value="system">{t('alertsCenter.systemType')}</SelectItem>
                <SelectItem value="production">{t('alertsCenter.productionType')}</SelectItem>
                <SelectItem value="inventory">{t('alertsCenter.inventoryType')}</SelectItem>
                <SelectItem value="quality">{t('alertsCenter.qualityType')}</SelectItem>
                <SelectItem value="maintenance">{t('alertsCenter.maintenanceType')}</SelectItem>
                <SelectItem value="security">{t('alertsCenter.securityType')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger
                className={t("pages.alertscenter.name.w_40")}
                data-testid="select-filter-severity"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('alertsCenter.allSeverities')}</SelectItem>
                <SelectItem value="critical">{t('alertsCenter.criticalSeverity')}</SelectItem>
                <SelectItem value="high">{t('alertsCenter.highSeverity')}</SelectItem>
                <SelectItem value="medium">{t('alertsCenter.mediumSeverity')}</SelectItem>
                <SelectItem value="low">{t('alertsCenter.lowSeverity')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة التحذيرات */}
      <Card>
        <CardHeader>
          <CardTitle className={t("pages.alertscenter.name.flex_items_center_gap_2")}>
            <AlertTriangle className={t("pages.alertscenter.name.w_5_h_5")} />
            {t('sidebar.alerts')} ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className={t("pages.alertscenter.name.h_600px_")}>
            {alertsLoading ? (
              <div className={t("pages.alertscenter.name.flex_items_center_justify_center_h_32")}>
                <div className={t("pages.alertscenter.name.text_center")}>
                  <div className={t("pages.alertscenter.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
                  <p className={t("pages.alertscenter.name.mt_2_text_sm_text_gray_600_dark_text_gray_300")}>
                    {t('alertsCenter.loading')}
                  </p>
                </div>
              </div>{t('pages.AlertsCenter.)_:_filteredalerts.length_===_0_?_(')}<div className={t("pages.alertscenter.name.text_center_py_8")}>
                <CheckCircle2 className={t("pages.alertscenter.name.w_16_h_16_text_green_600_mx_auto_mb_4")} />
                <h3 className={t("pages.alertscenter.name.text_lg_font_medium_text_gray_900_dark_text_white_mb_2")}>
                  {t('alertsCenter.noAlertsFound')}
                </h3>
                <p className={t("pages.alertscenter.name.text_gray_600_dark_text_gray_300")}>
                  {t('alertsCenter.noActiveAlerts')}
                </p>
              </div>{t('pages.AlertsCenter.)_:_(')}<div className={t("pages.alertscenter.name.space_y_4")}>
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
                      <CardContent className={t("pages.alertscenter.name.p_4")}>
                        <div className={t("pages.alertscenter.name.flex_items_start_justify_between")}>
                          <div className={t("pages.alertscenter.name.flex_items_start_gap_3_flex_1")}>
                            <div className={t("pages.alertscenter.name.p_2_rounded_lg_bg_gray_100_dark_bg_gray_800")}>
                              <TypeIcon className={t("pages.alertscenter.name.w_5_h_5_text_gray_700_dark_text_gray_300")} />
                            </div>

                            <div className={t("pages.alertscenter.name.flex_1")}>
                              <div className={t("pages.alertscenter.name.flex_items_center_gap_2_mb_2")}>
                                <h3 className={t("pages.alertscenter.name.font_semibold_text_gray_900_dark_text_white")}>
                                  {alert.title_ar}
                                </h3>
                                <Badge
                                  variant={getSeverityColor(alert.severity)}
                                >
                                  {alert.severity === "critical"
                                    ? t('alertsCenter.criticalSeverity')
                                    : alert.severity === "high"
                                      ? t('alertsCenter.highSeverity')
                                      : alert.severity === "medium"
                                        ? t('alertsCenter.mediumSeverity')
                                        : t('alertsCenter.lowSeverity')}
                                </Badge>
                                <Badge variant="outline">
                                  {alert.type === "system"
                                    ? t('alertsCenter.systemType')
                                    : alert.type === "production"
                                      ? t('alertsCenter.productionType')
                                      : alert.type === "inventory"
                                        ? t('alertsCenter.inventoryType')
                                        : alert.type === "quality"
                                          ? t('alertsCenter.qualityType')
                                          : alert.type === "maintenance"
                                            ? t('alertsCenter.maintenanceType')
                                            : alert.type === "security"
                                              ? t('alertsCenter.securityType')
                                              : alert.type}
                                </Badge>
                              </div>

                              <p className={t("pages.alertscenter.name.text_gray_600_dark_text_gray_300_mb_3")}>
                                {alert.message_ar}
                              </p>

                              <div className={t("pages.alertscenter.name.flex_items_center_gap_4_text_sm_text_gray_500_dark_text_gray_400")}>
                                <div className={t("pages.alertscenter.name.flex_items_center_gap_1")}>
                                  <StatusIcon className={t("pages.alertscenter.name.w_4_h_4")} />
                                  {alert.status === "active"
                                    ? t('alertsCenter.activeStatus')
                                    : alert.status === "resolved"
                                      ? t('alertsCenter.resolvedStatus')
                                      : alert.status === "dismissed"
                                        ? t('alertsCenter.dismissedStatus')
                                        : alert.status}
                                </div>
                                <div className={t("pages.alertscenter.name.flex_items_center_gap_1")}>
                                  <Clock className={t("pages.alertscenter.name.w_4_h_4")} />
                                  {formatDistanceToNow(
                                    new Date(alert.created_at),
                                    {
                                      addSuffix: true,
                                      locale: ar,
                                    },
                                  )}
                                </div>
                                {alert.occurrences >{t('pages.AlertsCenter.1_&&_(')}<div className={t("pages.alertscenter.name.flex_items_center_gap_1")}>
                                    <TrendingUp className={t("pages.alertscenter.name.w_4_h_4")} />
                                    {alert.occurrences} {t('common.times')}
                                  </div>
                                )}
                              </div>

                              {alert.suggested_actions &&
                                alert.suggested_actions.length >{t('pages.AlertsCenter.0_&&_(')}<div className={t("pages.alertscenter.name.mt_3_p_3_bg_blue_50_dark_bg_blue_950_20_rounded_lg")}>
                                    <p className={t("pages.alertscenter.name.text_sm_font_medium_text_blue_900_dark_text_blue_100_mb_2")}>
                                      {t('alertsCenter.suggestedActions')}:
                                    </p>
                                    <ul className={t("pages.alertscenter.name.text_sm_text_blue_800_dark_text_blue_200_space_y_1")}>
                                      {alert.suggested_actions.map(
                                        (action, index) => (
                                          <li
                                            key={index}
                                            className={t("pages.alertscenter.name.flex_items_center_gap_2")}
                                          >
                                            <ChevronRight className={t("pages.alertscenter.name.w_3_h_3")} />
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

                          {alert.status === "active" && (
                            <div className={t("pages.alertscenter.name.flex_gap_2")}>
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
                                <CheckCircle2 className={t("pages.alertscenter.name.w_4_h_4_ml_1")} />
                                {t('alertsCenter.resolveAlert')}
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
                                <XCircle className={t("pages.alertscenter.name.w_4_h_4_ml_1")} />
                                {t('alertsCenter.dismissAlert')}
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
