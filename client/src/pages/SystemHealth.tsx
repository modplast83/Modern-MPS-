import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Activity,
  Database,
  Server,
  Cpu,
  HardDrive,
  Network,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Monitor,
  MemoryStick,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// أنواع البيانات
interface HealthCheck {
  id: number;
  check_name: string;
  check_name_ar: string;
  check_type: string;
  status: string;
  last_check_time: string;
  check_duration_ms: number;
  success_rate_24h: number;
  average_response_time: number;
  error_count_24h: number;
  check_details: Record<string, any>;
  is_critical: boolean;
}

interface PerformanceMetric {
  id: number;
  metric_name: string;
  metric_category: string;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
}

interface SystemOverview {
  overall_status: string;
  healthy_checks: number;
  warning_checks: number;
  critical_checks: number;
  last_check: string;
  uptime_percent: number;
  total_checks: number;
}

/**
 * لوحة مراقبة سلامة النظام
 */
export default function SystemHealth() {
  const { t } = useTranslation();
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");

  // جلب نظرة عامة على النظام - Optimized polling
  const { data: overview } = useQuery<SystemOverview>({
    queryKey: ["/api/system/health/overview"],
    refetchInterval: 120000, // Reduced from 30s to 2 minutes
    staleTime: 90000, // Cache for 1.5 minutes
  });

  // جلب فحوصات السلامة
  const { data: healthChecks = [] } = useQuery<HealthCheck[]>({
    queryKey: ["/api/system/health/checks"],
    refetchInterval: 120000, // Reduced from 30s to 2 minutes
    staleTime: 90000,
  });

  // جلب مؤشرات الأداء
  const { data: performanceMetrics = [] } = useQuery<PerformanceMetric[]>({
    queryKey: ["/api/system/performance", { timeRange: selectedTimeRange }],
    refetchInterval: 120000, // Reduced from 30s to 2 minutes
    staleTime: 90000,
  });

  // الحصول على لون الحالة
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // الحصول على أيقونة النوع
  const getTypeIcon = (type: string) => {
    const icons = {
      database: Database,
      api: Network,
      service: Server,
      memory: MemoryStick,
      cpu: Cpu,
      disk: HardDrive,
      system: Monitor,
    };
    return icons[type as keyof typeof icons] || Activity;
  };

  // تجميع البيانات للرسم البياني
  const chartData = performanceMetrics
    .filter((metric) => metric.metric_name === "memory_usage_percent")
    .slice(-24)
    .map((metric) => ({
      time: new Date(metric.timestamp).toLocaleTimeString("ar"),
      memory: parseFloat(metric.value.toString()),
      timestamp: metric.timestamp,
    }));

  // بيانات الرسم الدائري لحالة الفحوصات
  const healthStatusData = [
    { name: t('systemHealth.healthy'), value: overview?.healthy_checks || 0, color: "#10B981" },
    { name: t('systemHealth.warning'), value: overview?.warning_checks || 0, color: "#F59E0B" },
    { name: t('systemHealth.critical'), value: overview?.critical_checks || 0, color: "#EF4444" },
  ];

  return (
    <div className={t("pages.systemhealth.name.container_mx_auto_p_6_space_y_6")} dir="rtl">
      {/* رأس الصفحة */}
      <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
        <div>
          <h1 className={t("pages.systemhealth.name.text_3xl_font_bold_text_gray_900_dark_text_white")}>
            {t('systemHealth.title')}
          </h1>
          <p className={t("pages.systemhealth.name.text_gray_600_dark_text_gray_300_mt_2")}>
            {t('systemHealth.description')}
          </p>
        </div>
        <div className={t("pages.systemhealth.name.flex_items_center_gap_2")}>
          <Badge variant="outline" className={t("pages.systemhealth.name.text_sm")}>
            <Activity className={t("pages.systemhealth.name.w_4_h_4_ml_1")} />
            {t('systemHealth.liveMonitoring')}
          </Badge>
          {overview && (
            <Badge
              variant={
                overview.overall_status === "healthy"
                  ? "default"
                  : overview.overall_status === "warning"
                    ? "secondary"
                    : "destructive"
              }
            >
              <Shield className={t("pages.systemhealth.name.w_4_h_4_ml_1")} />
              {overview.overall_status === "healthy"
                ? t('systemHealth.systemHealthy')
                : overview.overall_status === "warning"
                  ? t('systemHealth.warning')
                  : t('systemHealth.critical')}
            </Badge>
          )}
        </div>
      </div>

      {/* نظرة عامة على الحالة */}
      {overview && (
        <div className={t("pages.systemhealth.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
          <Card className={t("pages.systemhealth.name.bg_gradient_to_br_from_green_50_to_green_100_dark_from_green_950_dark_to_green_900")}>
            <CardContent className={t("pages.systemhealth.name.p_6")}>
              <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
                <div>
                  <p className={t("pages.systemhealth.name.text_sm_font_medium_text_green_700_dark_text_green_300")}>
                    {t('systemHealth.healthyChecks')}
                  </p>
                  <p className={t("pages.systemhealth.name.text_3xl_font_bold_text_green_900_dark_text_green_100")}>
                    {overview.healthy_checks}
                  </p>
                </div>
                <CheckCircle2 className={t("pages.systemhealth.name.w_10_h_10_text_green_600")} />
              </div>
            </CardContent>
          </Card>

          <Card className={t("pages.systemhealth.name.bg_gradient_to_br_from_yellow_50_to_yellow_100_dark_from_yellow_950_dark_to_yellow_900")}>
            <CardContent className={t("pages.systemhealth.name.p_6")}>
              <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
                <div>
                  <p className={t("pages.systemhealth.name.text_sm_font_medium_text_yellow_700_dark_text_yellow_300")}>
                    {t('systemHealth.warnings')}
                  </p>
                  <p className={t("pages.systemhealth.name.text_3xl_font_bold_text_yellow_900_dark_text_yellow_100")}>
                    {overview.warning_checks}
                  </p>
                </div>
                <AlertTriangle className={t("pages.systemhealth.name.w_10_h_10_text_yellow_600")} />
              </div>
            </CardContent>
          </Card>

          <Card className={t("pages.systemhealth.name.bg_gradient_to_br_from_red_50_to_red_100_dark_from_red_950_dark_to_red_900")}>
            <CardContent className={t("pages.systemhealth.name.p_6")}>
              <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
                <div>
                  <p className={t("pages.systemhealth.name.text_sm_font_medium_text_red_700_dark_text_red_300")}>
                    {t('systemHealth.criticalChecks')}
                  </p>
                  <p className={t("pages.systemhealth.name.text_3xl_font_bold_text_red_900_dark_text_red_100")}>
                    {overview.critical_checks}
                  </p>
                </div>
                <AlertTriangle className={t("pages.systemhealth.name.w_10_h_10_text_red_600")} />
              </div>
            </CardContent>
          </Card>

          <Card className={t("pages.systemhealth.name.bg_gradient_to_br_from_blue_50_to_blue_100_dark_from_blue_950_dark_to_blue_900")}>
            <CardContent className={t("pages.systemhealth.name.p_6")}>
              <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
                <div>
                  <p className={t("pages.systemhealth.name.text_sm_font_medium_text_blue_700_dark_text_blue_300")}>
                    {t('systemHealth.uptimePercent')}
                  </p>
                  <p className={t("pages.systemhealth.name.text_3xl_font_bold_text_blue_900_dark_text_blue_100")}>
                    {overview.uptime_percent?.toFixed(1)}%
                  </p>
                </div>
                <Zap className={t("pages.systemhealth.name.w_10_h_10_text_blue_600")} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="checks" className={t("pages.systemhealth.name.w_full")}>
        <TabsList className={t("pages.systemhealth.name.grid_w_full_grid_cols_3")}>
          <TabsTrigger value="checks" data-testid="tab-health-checks">
            {t('systemHealth.healthChecks')}
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">
            {t('systemHealth.performanceMetrics')}
          </TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">
            {t('systemHealth.overview')}
          </TabsTrigger>
        </TabsList>

        {/* تبويب فحوصات السلامة */}
        <TabsContent value="checks" className={t("pages.systemhealth.name.space_y_4")}>
          <Card>
            <CardHeader>
              <CardTitle className={t("pages.systemhealth.name.flex_items_center_gap_2")}>
                <Database className={t("pages.systemhealth.name.w_5_h_5")} />
                {t('systemHealth.healthChecks')} ({healthChecks.length})
              </CardTitle>
              <CardDescription>
                {t('systemHealth.allHealthChecks')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={t("pages.systemhealth.name.space_y_4")}>
                {healthChecks.map((check) => {
                  const TypeIcon = getTypeIcon(check.check_type);

                  return (
                    <Card key={check.id} className={t("pages.systemhealth.name.p_4")}>
                      <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
                        <div className={t("pages.systemhealth.name.flex_items_center_gap_3")}>
                          <div className={t("pages.systemhealth.name.p_2_rounded_lg_bg_gray_100_dark_bg_gray_800")}>
                            <TypeIcon className={t("pages.systemhealth.name.w_5_h_5_text_gray_700_dark_text_gray_300")} />
                          </div>
                          <div>
                            <h3 className={t("pages.systemhealth.name.font_semibold_text_gray_900_dark_text_white")}>
                              {check.check_name_ar}
                            </h3>
                            <p className={t("pages.systemhealth.name.text_sm_text_gray_600_dark_text_gray_300")}>
                              {t(`systemHealth.checkType.${check.check_type}`, check.check_type)}
                            </p>
                          </div>
                        </div>

                        <div className={t("pages.systemhealth.name.flex_items_center_gap_4")}>
                          <div className={t("pages.systemhealth.name.text_right")}>
                            <div
                              className={`font-semibold ${getStatusColor(check.status)}`}
                            >
                              {check.status === "healthy"
                                ? t('systemHealth.healthy')
                                : check.status === "warning"
                                  ? t('systemHealth.warning')
                                  : check.status === "critical"
                                    ? t('systemHealth.critical')
                                    : check.status}
                            </div>
                            <div className={t("pages.systemhealth.name.text_sm_text_gray_600_dark_text_gray_300")}>
                              {check.check_duration_ms}ms
                            </div>
                          </div>

                          <div className={t("pages.systemhealth.name.w_20")}>
                            <Progress
                              value={check.success_rate_24h}
                              className={t("pages.systemhealth.name.h_2")}
                            />
                            <div className={t("pages.systemhealth.name.text_xs_text_center_mt_1_text_gray_600_dark_text_gray_300")}>
                              {check.success_rate_24h?.toFixed(1)}%
                            </div>
                          </div>

                          {check.is_critical && (
                            <Badge variant="destructive" className={t("pages.systemhealth.name.text_xs")}>
                              {t('systemHealth.critical')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* تفاصيل إضافية */}
                      <div className={t("pages.systemhealth.name.mt_3_pt_3_border_t_grid_grid_cols_3_gap_4_text_sm")}>
                        <div>
                          <span className={t("pages.systemhealth.name.text_gray_600_dark_text_gray_300")}>
                            {t('systemHealth.avgResponseTime')}:{" "}
                          </span>
                          <span className={t("pages.systemhealth.name.font_medium")}>
                            {check.average_response_time}ms
                          </span>
                        </div>
                        <div>
                          <span className={t("pages.systemhealth.name.text_gray_600_dark_text_gray_300")}>
                            {t('systemHealth.errors24h')}:{" "}
                          </span>
                          <span className={t("pages.systemhealth.name.font_medium")}>
                            {check.error_count_24h}
                          </span>
                        </div>
                        <div>
                          <span className={t("pages.systemhealth.name.text_gray_600_dark_text_gray_300")}>
                            {t('systemHealth.lastCheck')}:{" "}
                          </span>
                          <span className={t("pages.systemhealth.name.font_medium")}>
                            {new Date(check.last_check_time).toLocaleTimeString(
                              "ar",
                            )}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب مؤشرات الأداء */}
        <TabsContent value="performance" className={t("pages.systemhealth.name.space_y_4")}>
          <div className={t("pages.systemhealth.name.grid_grid_cols_1_lg_grid_cols_2_gap_6")}>
            {/* رسم بياني لاستخدام الذاكرة */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.systemhealth.name.flex_items_center_gap_2")}>
                  <MemoryStick className={t("pages.systemhealth.name.w_5_h_5")} />
                  {t('systemHealth.memoryUsage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => `${t('common.time')}: ${label}`}
                      formatter={(value) => [`${value}%`, t('systemHealth.memoryUsage')]}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* رسم دائري لحالة الفحوصات */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.systemhealth.name.flex_items_center_gap_2")}>
                  <Activity className={t("pages.systemhealth.name.w_5_h_5")} />
                  {t('systemHealth.checkDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={healthStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {healthStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* إحصائيات سريعة */}
          <div className={t("pages.systemhealth.name.grid_grid_cols_1_md_grid_cols_3_gap_4")}>
            <Card>
              <CardContent className={t("pages.systemhealth.name.p_6")}>
                <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.systemhealth.name.text_sm_font_medium_text_gray_600_dark_text_gray_300")}>
                      {t('systemHealth.avgResponseTime')}
                    </p>
                    <p className={t("pages.systemhealth.name.text_2xl_font_bold")}>
                      {healthChecks.reduce(
                        (acc, check) => acc + check.average_response_time,
                        0,
                      ) / (healthChecks.length || 1)}
                      ms
                    </p>
                  </div>
                  <Clock className={t("pages.systemhealth.name.w_8_h_8_text_blue_600")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.systemhealth.name.p_6")}>
                <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.systemhealth.name.text_sm_font_medium_text_gray_600_dark_text_gray_300")}>
                      {t('systemHealth.successRate')}
                    </p>
                    <p className={t("pages.systemhealth.name.text_2xl_font_bold_text_green_600")}>
                      {(
                        healthChecks.reduce(
                          (acc, check) => acc + check.success_rate_24h,
                          0,
                        ) / (healthChecks.length || 1)
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <TrendingUp className={t("pages.systemhealth.name.w_8_h_8_text_green_600")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.systemhealth.name.p_6")}>
                <div className={t("pages.systemhealth.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.systemhealth.name.text_sm_font_medium_text_gray_600_dark_text_gray_300")}>
                      {t('systemHealth.totalErrors')}
                    </p>
                    <p className={t("pages.systemhealth.name.text_2xl_font_bold_text_red_600")}>
                      {healthChecks.reduce(
                        (acc, check) => acc + check.error_count_24h,
                        0,
                      )}
                    </p>
                  </div>
                  <TrendingDown className={t("pages.systemhealth.name.w_8_h_8_text_red_600")} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className={t("pages.systemhealth.name.space_y_4")}>
          <div className={t("pages.systemhealth.name.grid_grid_cols_1_lg_grid_cols_2_gap_6")}>
            <Card>
              <CardHeader>
                <CardTitle>{t('systemHealth.systemInfo')}</CardTitle>
              </CardHeader>
              <CardContent className={t("pages.systemhealth.name.space_y_4")}>
                <div className={t("pages.systemhealth.name.flex_justify_between")}>
                  <span className={t("pages.systemhealth.name.text_gray_600_dark_text_gray_300")}>
                    {t('systemHealth.systemStatus')}:
                  </span>
                  <Badge
                    variant={
                      overview?.overall_status === "healthy"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {overview?.overall_status === "healthy"
                      ? t('systemHealth.healthy')
                      : t('systemHealth.needsAttention')}
                  </Badge>
                </div>
                <div className={t("pages.systemhealth.name.flex_justify_between")}>
                  <span className={t("pages.systemhealth.name.text_gray_600_dark_text_gray_300")}>
                    {t('systemHealth.totalChecks')}:
                  </span>
                  <span className={t("pages.systemhealth.name.font_medium")}>{overview?.total_checks}</span>
                </div>
                <div className={t("pages.systemhealth.name.flex_justify_between")}>
                  <span className={t("pages.systemhealth.name.text_gray_600_dark_text_gray_300")}>
                    {t('systemHealth.uptime')}:
                  </span>
                  <span className={t("pages.systemhealth.name.font_medium")}>
                    {overview?.uptime_percent?.toFixed(2)}%
                  </span>
                </div>
                <div className={t("pages.systemhealth.name.flex_justify_between")}>
                  <span className={t("pages.systemhealth.name.text_gray_600_dark_text_gray_300")}>
                    {t('systemHealth.lastCheck')}:
                  </span>
                  <span className={t("pages.systemhealth.name.font_medium")}>
                    {overview?.last_check
                      ? new Date(overview.last_check).toLocaleString("ar")
                      : t('systemHealth.notSpecified')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('systemHealth.recommendations')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.systemhealth.name.space_y_3")}>
                  {overview?.critical_checks &&
                    overview.critical_checks >{t('pages.SystemHealth.0_&&_(')}<div className={t("pages.systemhealth.name.p_3_bg_red_50_dark_bg_red_950_20_rounded_lg")}>
                        <p className={t("pages.systemhealth.name.text_sm_font_medium_text_red_900_dark_text_red_100")}>
                          ⚠️ {t('systemHealth.criticalAlert', { count: overview.critical_checks })}
                        </p>
                      </div>
                    )}

                  {overview?.warning_checks && overview.warning_checks >{t('pages.SystemHealth.0_&&_(')}<div className={t("pages.systemhealth.name.p_3_bg_yellow_50_dark_bg_yellow_950_20_rounded_lg")}>
                      <p className={t("pages.systemhealth.name.text_sm_font_medium_text_yellow_900_dark_text_yellow_100")}>
                        📋 {t('systemHealth.warningAlert', { count: overview.warning_checks })}
                      </p>
                    </div>
                  )}

                  {overview?.uptime_percent && overview.uptime_percent < 99 && (
                    <div className={t("pages.systemhealth.name.p_3_bg_blue_50_dark_bg_blue_950_20_rounded_lg")}>
                      <p className={t("pages.systemhealth.name.text_sm_font_medium_text_blue_900_dark_text_blue_100")}>
                        💡 {t('systemHealth.uptimeAlert')}
                      </p>
                    </div>
                  )}

                  {!overview?.critical_checks && !overview?.warning_checks && (
                    <div className={t("pages.systemhealth.name.p_3_bg_green_50_dark_bg_green_950_20_rounded_lg")}>
                      <p className={t("pages.systemhealth.name.text_sm_font_medium_text_green_900_dark_text_green_100")}>
                        ✅ {t('systemHealth.excellentStatus')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
