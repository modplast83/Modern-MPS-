import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import {
  Card,
  CardContent,
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
import {
  formatNumber,
  formatPercentage,
  formatNumberWithCommas,
} from "../lib/formatNumber";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Filter,
  Calendar as CalendarIcon,
  FileText,
  Users,
  Settings,
  Package,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Zap,
  Clock,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  InteractiveBarChart,
  InteractiveLineChart,
  InteractivePieChart,
  InteractiveAreaChart,
  ComboChart,
  MetricsGrid,
} from "../components/charts";

export default function Reports() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [reportType, setReportType] = useState("production");

  // Get date range for API calls
  const getDateRange = () => {
    const now = new Date();
    let from: string, to: string;

    switch (selectedPeriod) {
      case "week":
        from = format(
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd",
        );
        to = format(now, "yyyy-MM-dd");
        break;
      case "quarter":
        from = format(
          new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
          "yyyy-MM-dd",
        );
        to = format(now, "yyyy-MM-dd");
        break;
      case "year":
        from = format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd");
        to = format(now, "yyyy-MM-dd");
        break;
      case "custom":
        from = dateRange.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : format(
              new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              "yyyy-MM-dd",
            );
        to = dateRange.to
          ? format(dateRange.to, "yyyy-MM-dd")
          : format(now, "yyyy-MM-dd");
        break;
      default: // month
        from = format(
          new Date(now.getFullYear(), now.getMonth(), 1),
          "yyyy-MM-dd",
        );
        to = format(now, "yyyy-MM-dd");
    }

    return { from, to };
  };

  const { from, to } = getDateRange();

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/reports/dashboard", from, to],
    queryFn: () =>
      fetch(`/api/reports/dashboard?date_from=${from}&date_to=${to}`).then(
        (res) => res.json(),
      ),
  });

  // Fetch order reports
  const { data: orderReports, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/reports/orders", from, to],
    queryFn: () =>
      fetch(`/api/reports/orders?date_from=${from}&date_to=${to}`).then((res) =>
        res.json(),
      ),
  });

  // Fetch advanced metrics
  const { data: advancedMetrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ["/api/reports/advanced-metrics", from, to],
    queryFn: () =>
      fetch(
        `/api/reports/advanced-metrics?date_from=${from}&date_to=${to}`,
      ).then((res) => res.json()),
  });

  // Fetch HR reports
  const { data: hrReports, isLoading: isHRLoading } = useQuery({
    queryKey: ["/api/reports/hr", from, to],
    queryFn: () =>
      fetch(`/api/reports/hr?date_from=${from}&date_to=${to}`).then((res) =>
        res.json(),
      ),
  });

  // Fetch maintenance reports
  const { data: maintenanceReports, isLoading: isMaintenanceLoading } =
    useQuery({
      queryKey: ["/api/reports/maintenance", from, to],
      queryFn: () =>
        fetch(`/api/reports/maintenance?date_from=${from}&date_to=${to}`).then(
          (res) => res.json(),
        ),
    });

  const isLoading =
    isDashboardLoading ||
    isOrdersLoading ||
    isMetricsLoading ||
    isHRLoading ||
    isMaintenanceLoading;

  const reportTypes = [
    {
      value: "production",
      label: t('reports.productionReports'),
      icon: <Package className={t("pages.reports.name.w_4_h_4")} />,
    },
    {
      value: "quality",
      label: t('reports.qualityReports'),
      icon: <CheckCircle2 className={t("pages.reports.name.w_4_h_4")} />,
    },
    {
      value: "maintenance",
      label: t('reports.maintenanceReports'),
      icon: <Settings className={t("pages.reports.name.w_4_h_4")} />,
    },
    {
      value: "hr",
      label: t('reports.hrReports'),
      icon: <Users className={t("pages.reports.name.w_4_h_4")} />,
    },
    {
      value: "financial",
      label: t('reports.financialReports'),
      icon: <BarChart3 className={t("pages.reports.name.w_4_h_4")} />,
    },
  ];

  const exportReport = async (format: string) => {
    try {
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          report_type: reportType,
          format,
          date_from: from,
          date_to: to,
          filters: { period: selectedPeriod },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (format === "json") {
          // Download JSON data
          const blob = new Blob([JSON.stringify(data.data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${reportType}-${from}-${to}.json`;
          a.click();
        } else {
          console.log(`تم تجهيز التقرير: ${data.download_url}`);
          // TODO: Implement actual PDF/Excel download
        }
      }
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  // Format chart data helpers
  const safeToFixed = (value: any, decimals: number = 1): string => {
    const numValue =
      typeof value === "number" && !isNaN(value)
        ? value
        : typeof value === "string"
          ? parseFloat(value)
          : 0;
    const safeValue = isNaN(numValue) ? 0 : numValue;
    return safeValue.toFixed(decimals);
  };

  const formatChartValue = (
    value: any,
    type: "number" | "percentage" | "currency" = "number",
  ) => {
    // Ensure value is a valid number
    const numValue =
      typeof value === "number" && !isNaN(value)
        ? value
        : typeof value === "string"
          ? parseFloat(value)
          : 0;

    const safeValue = isNaN(numValue) ? 0 : numValue;

    switch (type) {
      case "percentage":
        return `${safeValue.toFixed(1)}%`;
      case "currency":
        return `${formatNumberWithCommas(safeValue)} ريال`;
      default:
        return formatNumberWithCommas(safeValue);
    }
  };

  return (
    <div className={t("pages.reports.name.min_h_screen_bg_gray_50")}>
      <Header />

      <div className={t("pages.reports.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.reports.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          <div className={t("pages.reports.name.mb_6")}>
            <h1 className={t("pages.reports.name.text_2xl_font_bold_text_gray_900_mb_2")}>
              {t('reports.title')}
            </h1>
            <p className={t("pages.reports.name.text_gray_600")}>{t('reports.reportsManagement')}</p>
          </div>

          {/* Report Controls */}
          <Card className={t("pages.reports.name.mb_6")}>
            <CardHeader>
              <CardTitle className={t("pages.reports.name.flex_items_center_gap_2")}>
                <Filter className={t("pages.reports.name.w_5_h_5")} />
                {t('reports.reportOptions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={t("pages.reports.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
                <div>
                  <label className={t("pages.reports.name.text_sm_font_medium_text_gray_700_mb_1_block")}>
                    {t('reports.reportType')}
                  </label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value || "unknown"}
                        >
                          <div className={t("pages.reports.name.flex_items_center_gap_2")}>
                            {type.icon}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={t("pages.reports.name.text_sm_font_medium_text_gray_700_mb_1_block")}>
                    {t('reports.reportPeriod')}
                  </label>
                  <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">{t('reports.lastWeek')}</SelectItem>
                      <SelectItem value="month">{t('reports.thisMonth')}</SelectItem>
                      <SelectItem value="quarter">{t('reports.lastQuarter')}</SelectItem>
                      <SelectItem value="year">{t('reports.thisYear')}</SelectItem>
                      <SelectItem value="custom">{t('reports.customReport')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className={t("pages.reports.name.text_sm_font_medium_text_gray_700_mb_1_block")}>
                    {t('reports.startDate')}
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={t("pages.reports.name.w_full_justify_start_text_left")}
                      >
                        <CalendarIcon className={t("pages.reports.name.mr_2_h_4_w_4")} />
                        {dateRange.from
                          ? format(dateRange.from, "PPP", { locale: ar })
                          : t('reports.selectDateRange')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={t("pages.reports.name.w_auto_p_0")}>
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) =>
                          setDateRange({ ...dateRange, from: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className={t("pages.reports.name.flex_items_end_gap_2")}>
                  <Button
                    onClick={() => exportReport("pdf")}
                    className={t("pages.reports.name.flex_1")}
                  >
                    <Download className={t("pages.reports.name.w_4_h_4_mr_2")} />
                    {t('reports.exportToPDF')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportReport("excel")}
                  >
                    <FileText className={t("pages.reports.name.w_4_h_4")} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <Tabs value={reportType} onValueChange={setReportType}>
            <TabsList className={t("pages.reports.name.grid_w_full_grid_cols_5")}>
              {reportTypes.map((type) => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className={t("pages.reports.name.text_xs")}
                >
                  <div className={t("pages.reports.name.flex_items_center_gap_1")}>
                    {type.icon}
                    <span className={t("pages.reports.name.hidden_sm_inline")}>
                      {type.label.split(" ")[1]}
                    </span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Production Reports */}
            <TabsContent value="production">
              {isLoading ? (
                <div
                  className={t("pages.reports.name.text_center_py_8")}
                  data-testid="loading-production"
                >
                  <div className={t("pages.reports.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
                  <p className={t("pages.reports.name.mt_2_text_gray_600")}>{t('common.loading')}</p>
                </div>{t('pages.reports.)_:_(')}<>
                  {/* Production KPI Metrics */}
                  {dashboardData?.success && (
                    <MetricsGrid
                      columns={4}
                      className={t("pages.reports.name.mb_6")}
                      metrics={[
                        {
                          title: "إجمالي الإنتاج",
                          value: formatNumberWithCommas(
                            dashboardData.data.realTime?.currentStats
                              ?.daily_weight || 0,
                          ),
                          description: "كيلوجرام",
                          icon: <Package className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 5.2,
                            isPositive: true,
                            label: "من الأسبوع الماضي",
                          },
                        },
                        {
                          title: "كفاءة الإنتاج",
                          value: `${safeToFixed(dashboardData.data.realTime?.currentStats?.avg_efficiency || 90)}%`,
                          description: "متوسط الكفاءة",
                          icon: <Target className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 3.1,
                            isPositive: true,
                            label: "تحسن",
                          },
                        },
                        {
                          title: "الطلبات النشطة",
                          value: formatNumber(
                            dashboardData.data.realTime?.currentStats
                              ?.active_orders || 0,
                          ),
                          description: "طلبات قيد التنفيذ",
                          icon: <Activity className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 0,
                            isPositive: true,
                            label: "مستقر",
                          },
                        },
                        {
                          title: "معدل الهدر",
                          value: `${safeToFixed(((dashboardData.data.realTime?.currentStats?.current_waste || 0) / Math.max(dashboardData.data.realTime?.currentStats?.daily_weight || 1, 1)) * 100)}%`,
                          description: "نسبة الهدر",
                          icon: <AlertTriangle className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 1.8,
                            isPositive: false,
                            label: "يحتاج تحسين",
                          },
                        },
                      ]}
                    />
                  )}

                  <div className={t("pages.reports.name.grid_grid_cols_1_lg_grid_cols_2_gap_6_mb_6")}>
                    {/* Machine Utilization Chart */}
                    {dashboardData?.success &&
                      dashboardData.data.machineUtilization && (
                        <InteractiveBarChart
                          data={dashboardData.data.machineUtilization}
                          title="{t('pages.reports.title.{t('pages.reports.title.إنتاجية_المكائن')}')}"
                          description={t("pages.reports.description._")}
                          xAxisKey="machine_name"
                          yAxisKey="total_weight"
                          barColor="#3b82f6"
                          height={350}
                          formatValue={(value) =>
                            formatChartValue(value, "number") + " كج"
                          }
                          className={t("pages.reports.name.h_full")}
                        />
                      )}

                    {/* Production Efficiency Trends */}
                    {dashboardData?.success &&
                      dashboardData.data.productionEfficiency?.trends && (
                        <InteractiveLineChart
                          data={dashboardData.data.productionEfficiency.trends}
                          title="{t('pages.reports.title.{t('pages.reports.title.اتجاهات_الكفاءة_اليومية')}')}"
                          description={t("pages.reports.description._")}
                          xAxisKey="date"
                          lines={[
                            {
                              key: "daily_efficiency",
                              name: "الكفاءة اليومية",
                              color: "#10b981",
                            },
                          ]}
                          height={350}
                          formatValue={(value) =>
                            formatChartValue(value, "percentage")
                          }
                          className={t("pages.reports.name.h_full")}
                        />
                      )}
                  </div>

                  <div className={t("pages.reports.name.grid_grid_cols_1_lg_grid_cols_3_gap_6_mb_6")}>
                    {/* Machine Status Distribution */}
                    {dashboardData?.success &&
                      dashboardData.data.realTime?.machineStatus && (
                        <InteractivePieChart
                          data={dashboardData.data.realTime.machineStatus.reduce(
                            (acc: any[], machine: any) => {
                              const existing = acc.find(
                                (item) => item.status === machine.status,
                              );
                              if (existing) {
                                existing.count += 1;
                              } else {
                                acc.push({
                                  status:
                                    machine.status === "active"
                                      ? "نشطة"
                                      : machine.status === "idle"
                                        ? "متوقفة"
                                        : "تحت الصيانة",
                                  count: 1,
                                });
                              }
                              return acc;
                            },
                            [],
                          )}
                          title="{t('pages.reports.title.{t('pages.reports.title.حالة_المكائن')}')}"
                          description={t("pages.reports.description._")}
                          nameKey="status"
                          valueKey="count"
                          height={300}
                          colors={["#10b981", "#f59e0b", "#ef4444"]}
                        />
                      )}

                    {/* Production Queue Status */}
                    {dashboardData?.success &&
                      dashboardData.data.realTime?.queueStats && (
                        <InteractiveBarChart
                          data={[
                            {
                              stage: "البثق",
                              count:
                                dashboardData.data.realTime.queueStats
                                  .film_queue,
                            },
                            {
                              stage: "الطباعة",
                              count:
                                dashboardData.data.realTime.queueStats
                                  .printing_queue,
                            },
                            {
                              stage: "القطع",
                              count:
                                dashboardData.data.realTime.queueStats
                                  .cutting_queue,
                            },
                            {
                              stage: "في الانتظار",
                              count:
                                dashboardData.data.realTime.queueStats
                                  .pending_orders,
                            },
                          ]}
                          title="{t('pages.reports.title.{t('pages.reports.title.طوابير_الإنتاج')}')}"
                          description={t("pages.reports.description._")}
                          xAxisKey="stage"
                          yAxisKey="count"
                          barColor="#8b5cf6"
                          height={300}
                          formatValue={(value) => formatNumber(value)}
                        />
                      )}

                    {/* Advanced Metrics - OEE */}
                    {advancedMetrics?.success &&
                      advancedMetrics.data.oeeMetrics &&
                      advancedMetrics.data.oeeMetrics.length >{t('pages.reports.0_&&_(')}<ComboChart
                          data={advancedMetrics.data.oeeMetrics}
                          title="{t('pages.reports.title.{t('pages.reports.title.مؤشر_فعالية_المعدات_(oee)')}')}"
                          description={t("pages.reports.description._")}
                          xAxisKey="machine_name"
                          elements={[
                            {
                              type: "bar",
                              key: "availability",
                              name: "التوفر",
                              color: "#3b82f6",
                              yAxisId: "left",
                            },
                            {
                              type: "bar",
                              key: "performance",
                              name: "الأداء",
                              color: "#10b981",
                              yAxisId: "left",
                            },
                            {
                              type: "line",
                              key: "oee",
                              name: "OEE الإجمالي",
                              color: "#f59e0b",
                              yAxisId: "right",
                            },
                          ]}
                          height={300}
                          formatValue={(value) =>
                            formatChartValue(value, "percentage")
                          }
                          leftAxisLabel={t("pages.reports.label._")}
                          rightAxisLabel={t("pages.reports.label.oee_")}
                        />
                      )}
                  </div>

                  {/* Production Alerts */}
                  {dashboardData?.success &&
                    dashboardData.data.alerts &&
                    dashboardData.data.alerts.length >{t('pages.reports.0_&&_(')}<Card>
                        <CardHeader>
                          <CardTitle className={t("pages.reports.name.flex_items_center_gap_2")}>
                            <AlertTriangle className={t("pages.reports.name.w_5_h_5_text_amber_500")} />{t('pages.reports.تنبيهات_الإنتاج')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={t("pages.reports.name.space_y_3")}>
                            {dashboardData.data.alerts
                              .slice(0, 5)
                              .map((alert: any, index: number) => (
                                <div
                                  key={index}
                                  className={t("pages.reports.name.flex_items_center_justify_between_p_3_bg_amber_50_rounded_lg_border_border_amber_200")}
                                >
                                  <div className={t("pages.reports.name.flex_items_center_gap_3")}>
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        alert.priority === "critical"
                                          ? "bg-red-500"
                                          : alert.priority === "high"
                                            ? "bg-amber-500"
                                            : "bg-blue-500"
                                      }`}
                                    ></div>
                                    <div>
                                      <p className={t("pages.reports.name.font_medium_text_gray_900")}>
                                        {alert.title}
                                      </p>
                                      <p className={t("pages.reports.name.text_sm_text_gray_600")}>
                                        {alert.message}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      alert.priority === "critical"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {alert.priority === "critical"
                                      ? "حرج"
                                      : alert.priority === "high"
                                        ? "عالي"
                                        : "متوسط"}
                                  </Badge>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </>
              )}
            </TabsContent>

            {/* Quality Reports - Advanced Metrics */}
            <TabsContent value="quality">
              {isLoading ? (
                <div className={t("pages.reports.name.text_center_py_8")} data-testid="loading-quality">
                  <div className={t("pages.reports.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
                  <p className={t("pages.reports.name.mt_2_text_gray_600")}>{t('pages.reports.جاري_تحميل_تقارير_الجودة...')}</p>
                </div>{t('pages.reports.)_:_(')}<>
                  {/* Quality KPI Metrics */}
                  {advancedMetrics?.success && (
                    <MetricsGrid
                      columns={4}
                      className={t("pages.reports.name.mb_6")}
                      metrics={[
                        {
                          title: "معدل الجودة",
                          value: `${safeToFixed(advancedMetrics.data.qualityMetrics?.quality_rate || 95)}%`,
                          description: "نسبة الإنتاج السليم",
                          icon: <CheckCircle2 className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 2.1,
                            isPositive: true,
                            label: "تحسن",
                          },
                        },
                        {
                          title: "إجمالي الرولات",
                          value: formatNumber(
                            advancedMetrics.data.qualityMetrics?.total_rolls ||
                              0,
                          ),
                          description: "رولات مفحوصة",
                          icon: <Package className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 15.3,
                            isPositive: true,
                            label: "زيادة",
                          },
                        },
                        {
                          title: "الرولات المعيبة",
                          value: formatNumber(
                            advancedMetrics.data.qualityMetrics
                              ?.defective_rolls || 0,
                          ),
                          description: "تحتاج إعادة عمل",
                          icon: <AlertTriangle className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 3.2,
                            isPositive: false,
                            label: "انخفاض",
                          },
                        },
                        {
                          title: "متوسط الهدر",
                          value: `${safeToFixed(advancedMetrics.data.qualityMetrics?.avg_waste_percentage || 0)}%`,
                          description: "نسبة الهدر",
                          icon: <Activity className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 1.5,
                            isPositive: false,
                            label: "يحتاج تحسين",
                          },
                        },
                      ]}
                    />
                  )}

                  <div className={t("pages.reports.name.grid_grid_cols_1_lg_grid_cols_2_gap_6_mb_6")}>
                    {/* Quality Rate vs Defect Rate */}
                    {advancedMetrics?.success && (
                      <ComboChart
                        data={[
                          {
                            period: "هذا الشهر",
                            quality_rate:
                              advancedMetrics.data.qualityMetrics
                                ?.quality_rate || 95,
                            defect_rate:
                              100 -
                              (advancedMetrics.data.qualityMetrics
                                ?.quality_rate || 95),
                            rework_rate:
                              advancedMetrics.data.qualityMetrics
                                ?.rework_rate || 2,
                          },
                        ]}
                        title="{t('pages.reports.title.{t('pages.reports.title.مؤشرات_الجودة_الشاملة')}')}"
                        description={t("pages.reports.description._")}
                        xAxisKey="period"
                        elements={[
                          {
                            type: "bar",
                            key: "quality_rate",
                            name: "معدل الجودة",
                            color: "#10b981",
                          },
                          {
                            type: "bar",
                            key: "defect_rate",
                            name: "معدل العيوب",
                            color: "#ef4444",
                          },
                          {
                            type: "line",
                            key: "rework_rate",
                            name: "معدل إعادة العمل",
                            color: "#f59e0b",
                          },
                        ]}
                        height={350}
                        formatValue={(value) =>
                          formatChartValue(value, "percentage")
                        }
                        leftAxisLabel={t("pages.reports.label._")}
                      />
                    )}

                    {/* Cycle Time Analysis */}
                    {advancedMetrics?.success &&
                      advancedMetrics.data.cycleTimeStats && (
                        <InteractiveBarChart
                          data={[
                            {
                              stage: "البثق → الطباعة",
                              time: advancedMetrics.data.cycleTimeStats
                                .avg_film_to_printing,
                            },
                            {
                              stage: "الطباعة → القطع",
                              time: advancedMetrics.data.cycleTimeStats
                                .avg_printing_to_cutting,
                            },
                            {
                              stage: "إجمالي الدورة",
                              time: advancedMetrics.data.cycleTimeStats
                                .avg_total_cycle_time,
                            },
                          ]}
                          title="{t('pages.reports.title.{t('pages.reports.title.تحليل_أوقات_الدورة')}')}"
                          description={t("pages.reports.description._")}
                          xAxisKey="stage"
                          yAxisKey="time"
                          barColor="#6366f1"
                          height={350}
                          formatValue={(value) => `${safeToFixed(value)} ساعة`}
                        />
                      )}
                  </div>

                  {/* Machine OEE Performance */}
                  {advancedMetrics?.success &&
                    advancedMetrics.data.oeeMetrics &&
                    advancedMetrics.data.oeeMetrics.length >{t('pages.reports.0_&&_(')}<Card className={t("pages.reports.name.mb_6")}>
                        <CardHeader>
                          <CardTitle>{t('pages.reports.أداء_المكائن_-_فعالية_المعدات_الشاملة_(oee)')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <InteractiveBarChart
                            data={advancedMetrics.data.oeeMetrics}
                            title=""
                            xAxisKey="machine_name"
                            yAxisKey="oee"
                            barColor="#10b981"
                            height={300}
                            formatValue={(value) =>
                              formatChartValue(value, "percentage")
                            }
                          />
                        </CardContent>
                      </Card>
                    )}
                </>
              )}
            </TabsContent>

            {/* Maintenance Reports */}
            <TabsContent value="maintenance">
              {isLoading ? (
                <div
                  className={t("pages.reports.name.text_center_py_8")}
                  data-testid="loading-maintenance"
                >
                  <div className={t("pages.reports.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
                  <p className={t("pages.reports.name.mt_2_text_gray_600")}>{t('pages.reports.جاري_تحميل_تقارير_الصيانة...')}</p>
                </div>{t('pages.reports.)_:_(')}<>
                  {/* Maintenance KPI Metrics */}
                  {maintenanceReports?.success && (
                    <MetricsGrid
                      columns={4}
                      className={t("pages.reports.name.mb_6")}
                      metrics={[
                        {
                          title: "طلبات الصيانة",
                          value: formatNumber(
                            maintenanceReports.data.maintenanceStats
                              ?.total_requests || 0,
                          ),
                          description: "إجمالي الطلبات",
                          icon: <Settings className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 8.3,
                            isPositive: false,
                            label: "انخفاض",
                          },
                        },
                        {
                          title: "الطلبات المكتملة",
                          value: formatNumber(
                            maintenanceReports.data.maintenanceStats
                              ?.completed_requests || 0,
                          ),
                          description: "تم الانتهاء",
                          icon: <CheckCircle2 className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 12.5,
                            isPositive: true,
                            label: "تحسن",
                          },
                        },
                        {
                          title: "متوسط وقت الإصلاح",
                          value: `${safeToFixed(maintenanceReports.data.maintenanceStats?.avg_resolution_time || 0)}`,
                          description: "ساعة",
                          icon: <Clock className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 5.7,
                            isPositive: false,
                            label: "تقليل الوقت",
                          },
                        },
                        {
                          title: "الطلبات الحرجة",
                          value: formatNumber(
                            maintenanceReports.data.maintenanceStats
                              ?.critical_requests || 0,
                          ),
                          description: "تحتاج انتباه",
                          icon: <AlertTriangle className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 15.2,
                            isPositive: false,
                            label: "انخفاض",
                          },
                        },
                      ]}
                    />
                  )}

                  <div className={t("pages.reports.name.grid_grid_cols_1_lg_grid_cols_2_gap_6_mb_6")}>
                    {/* Maintenance Cost Analysis */}
                    {maintenanceReports?.success &&
                      maintenanceReports.data.costAnalysis && (
                        <InteractiveBarChart
                          data={maintenanceReports.data.costAnalysis}
                          title="{t('pages.reports.title.{t('pages.reports.title.تحليل_تكاليف_الصيانة')}')}"
                          description={t("pages.reports.description._")}
                          xAxisKey="machine_name"
                          yAxisKey="estimated_cost"
                          barColor="#f59e0b"
                          height={350}
                          formatValue={(value) =>
                            formatChartValue(value, "currency")
                          }
                        />
                      )}

                    {/* Downtime Analysis */}
                    {maintenanceReports?.success &&
                      maintenanceReports.data.downtimeAnalysis && (
                        <InteractiveAreaChart
                          data={[
                            {
                              type: "التوقف المخطط",
                              hours:
                                maintenanceReports.data.downtimeAnalysis
                                  .planned_downtime,
                            },
                            {
                              type: "التوقف الطارئ",
                              hours:
                                maintenanceReports.data.downtimeAnalysis
                                  .unplanned_downtime,
                            },
                            {
                              type: "الإجمالي",
                              hours:
                                maintenanceReports.data.downtimeAnalysis
                                  .total_downtime,
                            },
                          ]}
                          title="{t('pages.reports.title.{t('pages.reports.title.تحليل_فترات_التوقف')}')}"
                          description={t("pages.reports.description._")}
                          xAxisKey="type"
                          areas={[
                            {
                              key: "hours",
                              name: "الساعات",
                              color: "#ef4444",
                            },
                          ]}
                          height={350}
                          formatValue={(value) => `${safeToFixed(value)} ساعة`}
                        />
                      )}
                  </div>

                  {/* MTBF (Mean Time Between Failures) */}
                  {maintenanceReports?.success && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('pages.reports.متوسط_الوقت_بين_الأعطال_(mtbf)')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={t("pages.reports.name.flex_items_center_justify_center_p_8")}>
                          <div className={t("pages.reports.name.text_center")}>
                            <div className={t("pages.reports.name.text_4xl_font_bold_text_blue_600_mb_2")}>
                              {safeToFixed(
                                maintenanceReports.data.downtimeAnalysis
                                  ?.mtbf || 168,
                                0,
                              )}
                            </div>
                            <div className={t("pages.reports.name.text_lg_text_gray_600")}>{t('pages.reports.ساعة')}</div>
                            <div className={t("pages.reports.name.text_sm_text_gray_500_mt_2")}>{t('pages.reports.متوسط_الوقت_بين_الأعطال_للمكائن')}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* HR Reports */}
            <TabsContent value="hr">
              {isLoading ? (
                <div className={t("pages.reports.name.text_center_py_8")} data-testid="loading-hr">
                  <div className={t("pages.reports.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
                  <p className={t("pages.reports.name.mt_2_text_gray_600")}>{t('pages.reports.جاري_تحميل_تقارير_الموارد_البشرية...')}</p>
                </div>{t('pages.reports.)_:_(')}<>
                  {/* HR KPI Metrics */}
                  {hrReports?.success && (
                    <MetricsGrid
                      columns={4}
                      className={t("pages.reports.name.mb_6")}
                      metrics={[
                        {
                          title: "معدل الحضور",
                          value: "94.5%",
                          description: "نسبة الحضور العامة",
                          icon: <Users className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 2.1,
                            isPositive: true,
                            label: "تحسن",
                          },
                        },
                        {
                          title: "برامج التدريب",
                          value: formatNumber(
                            hrReports.data.trainingStats?.total_programs || 0,
                          ),
                          description: "برامج نشطة",
                          icon: <Package className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 15.3,
                            isPositive: true,
                            label: "زيادة",
                          },
                        },
                        {
                          title: "معدل الإكمال",
                          value: `${safeToFixed(hrReports.data.trainingStats?.completion_rate || 0)}%`,
                          description: "إكمال التدريب",
                          icon: <Target className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 8.7,
                            isPositive: true,
                            label: "ممتاز",
                          },
                        },
                        {
                          title: "كفاءة الفريق",
                          value: "91.2%",
                          description: "متوسط الأداء",
                          icon: <Zap className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 4.3,
                            isPositive: true,
                            label: "تحسن مستمر",
                          },
                        },
                      ]}
                    />
                  )}

                  <div className={t("pages.reports.name.grid_grid_cols_1_lg_grid_cols_2_gap_6_mb_6")}>
                    {/* Attendance Analysis */}
                    {hrReports?.success && hrReports.data.attendanceStats && (
                      <InteractiveBarChart
                        data={hrReports.data.attendanceStats.slice(0, 10)}
                        title="{t('pages.reports.title.{t('pages.reports.title.تحليل_الحضور_والغياب')}')}"
                        description={t("pages.reports.description._")}
                        xAxisKey="display_name_ar"
                        yAxisKey="attendance_rate"
                        barColor="#10b981"
                        height={350}
                        formatValue={(value) =>
                          formatChartValue(value, "percentage")
                        }
                      />
                    )}

                    {/* Performance vs Training */}
                    {hrReports?.success && hrReports.data.performanceStats && (
                      <ComboChart
                        data={hrReports.data.performanceStats.slice(0, 8)}
                        title="{t('pages.reports.title.{t('pages.reports.title.الأداء_مقابل_التدريب')}')}"
                        description={t("pages.reports.description._")}
                        xAxisKey="display_name_ar"
                        elements={[
                          {
                            type: "bar",
                            key: "production_efficiency",
                            name: "كفاءة الإنتاج",
                            color: "#3b82f6",
                            yAxisId: "left",
                          },
                          {
                            type: "line",
                            key: "error_rate",
                            name: "معدل الأخطاء",
                            color: "#ef4444",
                            yAxisId: "right",
                          },
                        ]}
                        height={350}
                        formatValue={(value) =>
                          formatChartValue(value, "percentage")
                        }
                        formatRightAxis={(value) =>
                          formatChartValue(value, "percentage")
                        }
                        leftAxisLabel={t("pages.reports.label._")}
                        rightAxisLabel={t("pages.reports.label._")}
                      />
                    )}
                  </div>

                  {/* Training Program Progress */}
                  {hrReports?.success && hrReports.data.trainingStats && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('pages.reports.تقدم_برامج_التدريب')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={t("pages.reports.name.grid_grid_cols_1_md_grid_cols_3_gap_4")}>
                          <div className={t("pages.reports.name.text_center_p_4_bg_blue_50_rounded_lg")}>
                            <div className={t("pages.reports.name.text_2xl_font_bold_text_blue_600")}>
                              {hrReports.data.trainingStats.total_programs}
                            </div>
                            <div className={t("pages.reports.name.text_sm_text_gray_600")}>{t('pages.reports.إجمالي_البرامج')}</div>
                          </div>
                          <div className={t("pages.reports.name.text_center_p_4_bg_green_50_rounded_lg")}>
                            <div className={t("pages.reports.name.text_2xl_font_bold_text_green_600")}>
                              {hrReports.data.trainingStats.completed_trainings}
                            </div>
                            <div className={t("pages.reports.name.text_sm_text_gray_600")}>{t('pages.reports.تدريبات_مكتملة')}</div>
                          </div>
                          <div className={t("pages.reports.name.text_center_p_4_bg_amber_50_rounded_lg")}>
                            <div className={t("pages.reports.name.text_2xl_font_bold_text_amber_600")}>
                              {hrReports.data.trainingStats.total_enrollments -
                                hrReports.data.trainingStats
                                  .completed_trainings}
                            </div>
                            <div className={t("pages.reports.name.text_sm_text_gray_600")}>{t('pages.reports.قيد_التنفيذ')}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Financial/Orders Reports */}
            <TabsContent value="financial">
              {isLoading ? (
                <div
                  className={t("pages.reports.name.text_center_py_8")}
                  data-testid="loading-financial"
                >
                  <div className={t("pages.reports.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
                  <p className={t("pages.reports.name.mt_2_text_gray_600")}>{t('pages.reports.جاري_تحميل_التقارير_المالية...')}</p>
                </div>{t('pages.reports.)_:_(')}<>
                  {/* Financial KPI Metrics */}
                  {orderReports?.success && (
                    <MetricsGrid
                      columns={4}
                      className={t("pages.reports.name.mb_6")}
                      metrics={[
                        {
                          title: "إجمالي الطلبات",
                          value: formatNumber(
                            orderReports.data.revenueStats?.total_orders || 0,
                          ),
                          description: "طلب مكتمل",
                          icon: <Package className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 12.5,
                            isPositive: true,
                            label: "نمو",
                          },
                        },
                        {
                          title: "الإيرادات المقدرة",
                          value: formatChartValue(
                            orderReports.data.revenueStats?.estimated_revenue ||
                              0,
                            "currency",
                          ),
                          description: "ريال سعودي",
                          icon: <BarChart3 className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 18.3,
                            isPositive: true,
                            label: "زيادة",
                          },
                        },
                        {
                          title: "متوسط قيمة الطلب",
                          value: formatChartValue(
                            orderReports.data.revenueStats?.avg_order_value ||
                              0,
                            "currency",
                          ),
                          description: "ريال للطلب",
                          icon: <Target className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 5.7,
                            isPositive: true,
                            label: "نمو",
                          },
                        },
                        {
                          title: "الطلبات في الوقت",
                          value: `${safeToFixed(((orderReports.data.deliveryPerformance?.on_time_orders || 0) / Math.max(orderReports.data.revenueStats?.total_orders || 1, 1)) * 100)}%`,
                          description: "أداء التسليم",
                          icon: <CheckCircle2 className={t("pages.reports.name.w_5_h_5")} />,
                          trend: {
                            value: 8.9,
                            isPositive: true,
                            label: "تحسن",
                          },
                        },
                      ]}
                    />
                  )}

                  <div className={t("pages.reports.name.grid_grid_cols_1_lg_grid_cols_2_gap_6_mb_6")}>
                    {/* Order Status Distribution */}
                    {orderReports?.success &&
                      orderReports.data.orderStatusStats && (
                        <InteractivePieChart
                          data={orderReports.data.orderStatusStats.map(
                            (status: any) => ({
                              status:
                                status.status === "completed"
                                  ? "مكتمل"
                                  : status.status === "in_production"
                                    ? "قيد الإنتاج"
                                    : status.status === "pending"
                                      ? "في الانتظار"
                                      : status.status === "cancelled"
                                        ? "ملغي"
                                        : status.status,
                              count: status.count,
                            }),
                          )}
                          title="{t('pages.reports.title.{t('pages.reports.title.توزيع_حالة_الطلبات')}')}"
                          description={t("pages.reports.description._")}
                          nameKey="status"
                          valueKey="count"
                          height={350}
                          colors={["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]}
                        />
                      )}

                    {/* Top Customers */}
                    {orderReports?.success &&
                      orderReports.data.topCustomers && (
                        <InteractiveBarChart
                          data={orderReports.data.topCustomers.slice(0, 8)}
                          title="{t('pages.reports.title.{t('pages.reports.title.أكثر_العملاء_طلباً')}')}"
                          description={t("pages.reports.description._")}
                          xAxisKey="customer_name"
                          yAxisKey="order_count"
                          barColor="#8b5cf6"
                          height={350}
                          formatValue={(value) => formatNumber(value) + " طلب"}
                        />
                      )}
                  </div>

                  {/* Revenue vs Quantity Trend */}
                  {orderReports?.success && orderReports.data.topCustomers && (
                    <ComboChart
                      data={orderReports.data.topCustomers.slice(0, 6)}
                      title="{t('pages.reports.title.{t('pages.reports.title.الإيرادات_مقابل_الكمية')}')}"
                      description={t("pages.reports.description._")}
                      xAxisKey="customer_name"
                      elements={[
                        {
                          type: "bar",
                          key: "total_quantity",
                          name: "الكمية (كج)",
                          color: "#3b82f6",
                          yAxisId: "left",
                        },
                        {
                          type: "line",
                          key: "total_value",
                          name: "القيمة (ريال)",
                          color: "#10b981",
                          yAxisId: "right",
                        },
                      ]}
                      height={350}
                      formatValue={(value) =>
                        formatChartValue(value, "number") + " كج"
                      }
                      formatRightAxis={(value) =>
                        formatChartValue(value, "currency")
                      }
                      leftAxisLabel={t("pages.reports.label._")}
                      rightAxisLabel={t("pages.reports.label._")}
                    />
                  )}

                  {/* Delivery Performance */}
                  {orderReports?.success &&
                    orderReports.data.deliveryPerformance && (
                      <Card className={t("pages.reports.name.mt_6")}>
                        <CardHeader>
                          <CardTitle>{t('pages.reports.أداء_التسليم')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className={t("pages.reports.name.grid_grid_cols_1_md_grid_cols_3_gap_4")}>
                            <div className={t("pages.reports.name.text_center_p_4_bg_green_50_rounded_lg")}>
                              <div className={t("pages.reports.name.text_2xl_font_bold_text_green_600")}>
                                {
                                  orderReports.data.deliveryPerformance
                                    .on_time_orders
                                }
                              </div>
                              <div className={t("pages.reports.name.text_sm_text_gray_600")}>{t('pages.reports.طلبات_في_الوقت')}</div>
                            </div>
                            <div className={t("pages.reports.name.text_center_p_4_bg_red_50_rounded_lg")}>
                              <div className={t("pages.reports.name.text_2xl_font_bold_text_red_600")}>
                                {
                                  orderReports.data.deliveryPerformance
                                    .late_orders
                                }
                              </div>
                              <div className={t("pages.reports.name.text_sm_text_gray_600")}>{t('pages.reports.طلبات_متأخرة')}</div>
                            </div>
                            <div className={t("pages.reports.name.text_center_p_4_bg_blue_50_rounded_lg")}>
                              <div className={t("pages.reports.name.text_2xl_font_bold_text_blue_600")}>
                                {safeToFixed(
                                  orderReports.data.deliveryPerformance
                                    .avg_delivery_days || 0,
                                )}
                              </div>
                              <div className={t("pages.reports.name.text_sm_text_gray_600")}>{t('pages.reports.متوسط_أيام_التسليم')}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
