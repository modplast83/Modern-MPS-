// src/pages/production-monitoring.tsx
import { useState, useEffect } from "react";
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
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Factory,
  Timer,
  Zap,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

import { useRealtime } from "../hooks/useRealtime";
import MachineCard from "../components/MachineCard";

interface RealTimeStats {
  currentStats: {
    daily_rolls: number;
    daily_weight: number;
    active_orders: number;
    completed_today: number;
    current_waste: number;
    avg_efficiency: number;
  };
  machineStatus: Array<{
    machine_id: string;
    machine_name: string;
    status: string;
    current_rolls: number;
    utilization?: number;
    lastDowntime?: string | null;
    last24hUtilization?: number[];
    operatingTimeSec?: number;
    plannedProductionSec?: number;
    producedUnits?: number;
    goodUnits?: number;
    idealCycleTimeSec?: number;
  }>;
  queueStats: {
    film_queue: number;
    printing_queue: number;
    cutting_queue: number;
    pending_orders: number;
  };
  updateInterval: number;
  lastUpdated: string;
}

interface UserPerformance {
  user_id: number;
  username: string;
  display_name_ar: string;
  role_name: string;
  section_name: string;
  rolls_created: number;
  rolls_printed: number;
  rolls_cut: number;
  total_weight_kg: number;
  avg_roll_weight: number;
  hours_worked: number;
  efficiency_score: number;
}

interface RolePerformance {
  role_id: number;
  role_name: string;
  user_count: number;
  total_production_orders: number;
  total_rolls: number;
  total_weight_kg: number;
  avg_order_completion_time: number;
  quality_score: number;
  on_time_delivery_rate: number;
}

interface ProductionAlert {
  type: "warning" | "error" | "info";
  category: string;
  title: string;
  message: string;
  data: any[];
  priority: "critical" | "high" | "medium" | "low";
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function ProductionMonitoring() {
  const { t } = useTranslation();
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [dateFilter, setDateFilter] = useState("7");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();

  useEffect(() => {
    const now = new Date();
    const days = parseInt(dateFilter);

    if (days > 0) {
      const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      setDateFrom(fromDate.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    }
  }, [dateFilter]);

  // Queries
  const {
    data: realTimeStats,
    refetch: refetchRealTimeStats,
    isLoading: realTimeLoading,
  } = useQuery({
    queryKey: ["/api/production/real-time-stats"],
    // تعتمد الآن على WebSocket للتحديث الفعلي
    refetchInterval: false,
  });

  const {
    data: userPerformanceData,
    refetch: refetchUserPerformance,
    isLoading: userPerformanceLoading,
  } = useQuery({
    queryKey: [
      "/api/production/user-performance",
      selectedUserId,
      dateFrom,
      dateTo,
    ],
    enabled: !!dateFrom && !!dateTo,
    refetchInterval: isAutoRefreshEnabled ? 60000 : false, // تحديث اختياري للأداء
  });

  const {
    data: rolePerformanceData,
    refetch: refetchRolePerformance,
    isLoading: rolePerformanceLoading,
  } = useQuery({
    queryKey: ["/api/production/role-performance", dateFrom, dateTo],
    enabled: !!dateFrom && !!dateTo,
    refetchInterval: isAutoRefreshEnabled ? 60000 : false,
  });

  const {
    data: alertsData,
    refetch: refetchAlerts,
    isLoading: alertsLoading,
  } = useQuery({
    queryKey: ["/api/production/alerts"],
    // تعتمد التنبيهات على WebSocket أيضاً
    refetchInterval: false,
  });

  const { data: efficiencyData, isLoading: efficiencyLoading } = useQuery({
    queryKey: ["/api/production/efficiency-metrics", dateFrom, dateTo],
    enabled: !!dateFrom && !!dateTo,
    refetchInterval: isAutoRefreshEnabled ? 120000 : false,
  });

  const { data: machineUtilizationData, isLoading: machineUtilizationLoading } =
    useQuery({
      queryKey: ["/api/production/machine-utilization", dateFrom, dateTo],
      enabled: !!dateFrom && !!dateTo,
      // نعتمد على WebSocket لتحديثات الماكينات
      refetchInterval: false,
    });

  const defaultStats: RealTimeStats = {
    currentStats: {
      daily_rolls: 0,
      daily_weight: 0,
      active_orders: 0,
      completed_today: 0,
      current_waste: 0,
      avg_efficiency: 90,
    },
    machineStatus: [],
    queueStats: {
      film_queue: 0,
      printing_queue: 0,
      cutting_queue: 0,
      pending_orders: 0,
    },
    updateInterval: 30000,
    lastUpdated: new Date().toISOString(),
  };

  const stats: RealTimeStats = realTimeStats
    ? {
        currentStats:
          (realTimeStats as any)?.currentStats || defaultStats.currentStats,
        machineStatus:
          (realTimeStats as any)?.machineStatus || defaultStats.machineStatus,
        queueStats:
          (realTimeStats as any)?.queueStats || defaultStats.queueStats,
        updateInterval:
          (realTimeStats as any)?.updateInterval || defaultStats.updateInterval,
        lastUpdated:
          (realTimeStats as any)?.lastUpdated || defaultStats.lastUpdated,
      }
    : defaultStats;

  const userPerformance: UserPerformance[] =
    (userPerformanceData as any)?.data || [];
  const rolePerformance: RolePerformance[] =
    (rolePerformanceData as any)?.data || [];
  const alerts: ProductionAlert[] = (alertsData as any)?.alerts || [];

  const handleExport = async () => {
    try {
      const exportData = {
        realTimeStats: stats,
        userPerformance,
        rolePerformance,
        exportDate: new Date().toISOString(),
        period: { from: dateFrom, to: dateTo },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `production-monitoring-${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "down":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className={t("pages.production-monitoring.name.w_4_h_4_text_green_500")} />{t('pages.production-monitoring.;_case_"maintenance":_return')}<AlertCircle className={t("pages.production-monitoring.name.w_4_h_4_text_yellow_500")} />{t('pages.production-monitoring.;_case_"down":_return')}<XCircle className={t("pages.production-monitoring.name.w_4_h_4_text_red_500")} />{t('pages.production-monitoring.;_default:_return')}<Timer className={t("pages.production-monitoring.name.w_4_h_4_text_gray_500")} />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className={t("pages.production-monitoring.name.w_4_h_4_text_red_500")} />{t('pages.production-monitoring.;_case_"warning":_return')}<AlertTriangle className={t("pages.production-monitoring.name.w_4_h_4_text_yellow_500")} />{t('pages.production-monitoring.;_default:_return')}<AlertCircle className={t("pages.production-monitoring.name.w_4_h_4_text_blue_500")} />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-EG").format(num);
  };

  const formatWeight = (kg: number) => {
    return `${formatNumber(Math.round(kg))} كجم`;
  };

  const formatPercentage = (percent: number) => {
    return `${formatNumber(Math.round(percent))}%`;
  };

  // Prepare chart data
  const queueChartData = [
    { name: "فيلم", value: stats.queueStats.film_queue, fill: COLORS[0] },
    { name: "طباعة", value: stats.queueStats.printing_queue, fill: COLORS[1] },
    { name: "قطع", value: stats.queueStats.cutting_queue, fill: COLORS[2] },
    { name: "معلق", value: stats.queueStats.pending_orders, fill: COLORS[3] },
  ];

  const rolePerformanceChartData = rolePerformance.map((role) => ({
    name: role.role_name,
    production: role.total_weight_kg,
    efficiency: role.quality_score,
    orders: role.total_production_orders,
  }));

  // WebSocket realtime (optional feature for real-time production updates)
  // To enable: Set VITE_PROD_WS_URL environment variable to your WebSocket server URL
  // Example: VITE_PROD_WS_URL=ws://localhost:4000/ws
  // The app works fine without WebSocket - it uses regular HTTP polling instead
  const wsUrl = import.meta.env.VITE_PROD_WS_URL;
  useRealtime(wsUrl);

  return (
    <div className={t("pages.production-monitoring.name.min_h_screen_bg_gray_50")} dir="rtl">
      <Header />

      <div className={t("pages.production-monitoring.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.production-monitoring.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4_space_y_6")}>
          {/* Header Section */}
          <div className={t("pages.production-monitoring.name.flex_flex_col_lg_flex_row_lg_items_center_lg_justify_between_gap_4")}>
            <div>
              <h1 className={t("pages.production-monitoring.name.text_2xl_font_bold_text_gray_900_mb_2")}>
                {t('productionMonitoring.title')}
              </h1>
              <p className={t("pages.production-monitoring.name.text_gray_600")}>
                {t('productionMonitoring.description')}
              </p>
            </div>

            <div className={t("pages.production-monitoring.name.flex_flex_wrap_items_center_gap_2")}>
              <Button
                variant={isAutoRefreshEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                data-testid="button-auto-refresh"
              >
                {isAutoRefreshEnabled ? (
                  <Pause className={t("pages.production-monitoring.name.w_4_h_4_mr_2")} />{t('pages.production-monitoring.)_:_(')}<Play className={t("pages.production-monitoring.name.w_4_h_4_mr_2")} />
                )}
                {isAutoRefreshEnabled ? t('productionMonitoring.stopRefresh') : t('productionMonitoring.startRefresh')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refetchRealTimeStats();
                  refetchUserPerformance();
                  refetchRolePerformance();
                  refetchAlerts();
                }}
                data-testid="button-manual-refresh"
              >
                <RefreshCw className={t("pages.production-monitoring.name.w_4_h_4_mr_2")} />
                {t('productionMonitoring.refreshNow')}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className={t("pages.production-monitoring.name.w_4_h_4_mr_2")} />
                {t('productionMonitoring.exportReport')}
              </Button>
            </div>
          </div>

          {/* Date Filter Section */}
          <Card>
            <CardContent className={t("pages.production-monitoring.name.p_4")}>
              <div className={t("pages.production-monitoring.name.flex_flex_wrap_items_center_gap_4")}>
                <div className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                  <Filter className={t("pages.production-monitoring.name.w_4_h_4_text_gray_500")} />
                  <span className={t("pages.production-monitoring.name.text_sm_font_medium")}>{t('productionMonitoring.reportPeriod')}:</span>
                </div>

                <Select value={dateFilter || ""} onValueChange={setDateFilter}>
                  <SelectTrigger
                    className={t("pages.production-monitoring.name.w_32")}
                    data-testid="select-date-filter"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('productionMonitoring.today')}</SelectItem>
                    <SelectItem value="7">{t('productionMonitoring.lastWeek')}</SelectItem>
                    <SelectItem value="30">{t('productionMonitoring.lastMonth')}</SelectItem>
                    <SelectItem value="90">{t('productionMonitoring.last3Months')}</SelectItem>
                  </SelectContent>
                </Select>

                <div className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={t("pages.production-monitoring.name.w_36")}
                    data-testid="input-date-from"
                  />
                  <span className={t("pages.production-monitoring.name.text_sm_text_gray_500")}>{t('productionMonitoring.to')}</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={t("pages.production-monitoring.name.w_36")}
                    data-testid="input-date-to"
                  />
                </div>

                <Badge variant="outline" className={t("pages.production-monitoring.name.text_xs")}>
                  {t('productionMonitoring.lastUpdate')}:{" "}
                  {new Date(stats.lastUpdated).toLocaleString("ar-EG")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Statistics Cards */}
          <div className={t("pages.production-monitoring.name.grid_grid_cols_2_lg_grid_cols_6_gap_4")}>
            <Card>
              <CardContent className={t("pages.production-monitoring.name.p_4")}>
                <div className={t("pages.production-monitoring.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.production-monitoring.name.text_xs_text_gray_600")}>{t('productionMonitoring.dailyRolls')}</p>
                    <p
                      className={t("pages.production-monitoring.name.text_xl_font_bold_text_blue_600")}
                      data-testid="stat-daily-rolls"
                    >
                      {formatNumber(stats.currentStats.daily_rolls)}
                    </p>
                  </div>
                  <Factory className={t("pages.production-monitoring.name.w_8_h_8_text_blue_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.production-monitoring.name.p_4")}>
                <div className={t("pages.production-monitoring.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.production-monitoring.name.text_xs_text_gray_600")}>{t('productionMonitoring.dailyProduction')}</p>
                    <p
                      className={t("pages.production-monitoring.name.text_xl_font_bold_text_green_600")}
                      data-testid="stat-daily-weight"
                    >
                      {formatWeight(stats.currentStats.daily_weight)}
                    </p>
                  </div>
                  <Target className={t("pages.production-monitoring.name.w_8_h_8_text_green_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.production-monitoring.name.p_4")}>
                <div className={t("pages.production-monitoring.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.production-monitoring.name.text_xs_text_gray_600")}>{t('productionMonitoring.activeOrders')}</p>
                    <p
                      className={t("pages.production-monitoring.name.text_xl_font_bold_text_purple_600")}
                      data-testid="stat-active-orders"
                    >
                      {formatNumber(stats.currentStats.active_orders)}
                    </p>
                  </div>
                  <Activity className={t("pages.production-monitoring.name.w_8_h_8_text_purple_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.production-monitoring.name.p_4")}>
                <div className={t("pages.production-monitoring.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.production-monitoring.name.text_xs_text_gray_600")}>{t('productionMonitoring.completedToday')}</p>
                    <p
                      className={t("pages.production-monitoring.name.text_xl_font_bold_text_emerald_600")}
                      data-testid="stat-completed-today"
                    >
                      {formatNumber(stats.currentStats.completed_today)}
                    </p>
                  </div>
                  <CheckCircle className={t("pages.production-monitoring.name.w_8_h_8_text_emerald_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.production-monitoring.name.p_4")}>
                <div className={t("pages.production-monitoring.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.production-monitoring.name.text_xs_text_gray_600")}>{t('productionMonitoring.currentWaste')}</p>
                    <p
                      className={t("pages.production-monitoring.name.text_xl_font_bold_text_red_600")}
                      data-testid="stat-current-waste"
                    >
                      {formatWeight(stats.currentStats.current_waste)}
                    </p>
                  </div>
                  <AlertTriangle className={t("pages.production-monitoring.name.w_8_h_8_text_red_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.production-monitoring.name.p_4")}>
                <div className={t("pages.production-monitoring.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.production-monitoring.name.text_xs_text_gray_600")}>{t('productionMonitoring.avgEfficiency')}</p>
                    <p
                      className={t("pages.production-monitoring.name.text_xl_font_bold_text_indigo_600")}
                      data-testid="stat-avg-efficiency"
                    >
                      {formatPercentage(stats.currentStats.avg_efficiency)}
                    </p>
                  </div>
                  <Zap className={t("pages.production-monitoring.name.w_8_h_8_text_indigo_500")} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          {alerts.length >{t('pages.production-monitoring.0_&&_(')}<div className={t("pages.production-monitoring.name.space_y_2")}>
              <h3 className={t("pages.production-monitoring.name.text_lg_font_semibold_flex_items_center_gap_2")}>
                <AlertTriangle className={t("pages.production-monitoring.name.w_5_h_5_text_yellow_500")} />
                {t('productionMonitoring.productionAlerts')} ({alerts.length})
              </h3>
              {alerts.slice(0, 3).map((alert, index) => (
                <Alert
                  key={index}
                  variant={alert.type === "error" ? "destructive" : "default"}
                >
                  <div className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                    {getAlertIcon(alert.type)}
                    <AlertTitle>{alert.title}</AlertTitle>
                  </div>
                  <AlertDescription className={t("pages.production-monitoring.name.mt_2")}>
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Charts and Analytics */}
          <div className={t("pages.production-monitoring.name.grid_grid_cols_1_lg_grid_cols_2_gap_6")}>
            {/* Queue Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                  <PieChartIcon className={t("pages.production-monitoring.name.w_5_h_5")} />
                  {t('productionMonitoring.queueStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={queueChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {queueChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Role Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                  <BarChart3 className={t("pages.production-monitoring.name.w_5_h_5")} />
                  {t('productionMonitoring.departmentPerformance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={rolePerformanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="production"
                      fill="#8884d8"
                      name={t('productionMonitoring.productionKg')}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Machine Status */}
          <Card>
            <CardHeader>
              <CardTitle className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                <Settings className={t("pages.production-monitoring.name.w_5_h_5")} />
                {t('productionMonitoring.machineStatus')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={t("pages.production-monitoring.name.grid_grid_cols_2_lg_grid_cols_4_gap_4")}>
                {stats.machineStatus.length === 0 ? (
                  <div className={t("pages.production-monitoring.name.text_center_py_6_text_gray_500_col_span_full")}>{t('productionMonitoring.noMachineData')}</div>
                ) : (
                  stats.machineStatus.map((machine) => (
                    <MachineCard key={machine.machine_id} machine={machine} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Tables */}
          <Tabs defaultValue="users" className={t("pages.production-monitoring.name.w_full")}>
            <TabsList className={t("pages.production-monitoring.name.w_full_lg_w_auto")}>
              <TabsTrigger value="users" data-testid="tab-users">
                {t('productionMonitoring.userPerformance')}
              </TabsTrigger>
              <TabsTrigger value="roles" data-testid="tab-roles">
                {t('productionMonitoring.departmentPerformance')}
              </TabsTrigger>
              <TabsTrigger value="efficiency" data-testid="tab-efficiency">
                {t('productionMonitoring.efficiencyMetrics')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>{t('productionMonitoring.userPerformanceStats')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={t("pages.production-monitoring.name.overflow_x_auto")}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('productionMonitoring.user')}</TableHead>
                          <TableHead>{t('productionMonitoring.department')}</TableHead>
                          <TableHead>{t('productionMonitoring.rollsCreated')}</TableHead>
                          <TableHead>{t('productionMonitoring.rollsPrinted')}</TableHead>
                          <TableHead>{t('productionMonitoring.rollsCut')}</TableHead>
                          <TableHead>{t('productionMonitoring.totalWeight')}</TableHead>
                          <TableHead>{t('productionMonitoring.workHours')}</TableHead>
                          <TableHead>{t('productionMonitoring.efficiencyPoints')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userPerformance.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <div>
                                <div className={t("pages.production-monitoring.name.font_medium")}>
                                  {user.display_name_ar || user.username}
                                </div>
                                <div className={t("pages.production-monitoring.name.text_sm_text_gray_500")}>
                                  {user.role_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.section_name}</TableCell>
                            <TableCell
                              data-testid={`user-${user.user_id}-rolls-created`}
                            >
                              {formatNumber(user.rolls_created)}
                            </TableCell>
                            <TableCell
                              data-testid={`user-${user.user_id}-rolls-printed`}
                            >
                              {formatNumber(user.rolls_printed)}
                            </TableCell>
                            <TableCell
                              data-testid={`user-${user.user_id}-rolls-cut`}
                            >
                              {formatNumber(user.rolls_cut)}
                            </TableCell>
                            <TableCell
                              data-testid={`user-${user.user_id}-total-weight`}
                            >
                              {formatWeight(user.total_weight_kg)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(user.hours_worked)}
                            </TableCell>
                            <TableCell>
                              <div className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                                <Progress
                                  value={user.efficiency_score}
                                  className={t("pages.production-monitoring.name.w_16_h_2")}
                                />
                                <span className={t("pages.production-monitoring.name.text_sm")}>
                                  {formatPercentage(user.efficiency_score)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle>{t('productionMonitoring.departmentPerformanceStats')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={t("pages.production-monitoring.name.overflow_x_auto")}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('productionMonitoring.department')}</TableHead>
                          <TableHead>{t('productionMonitoring.userCount')}</TableHead>
                          <TableHead>{t('productionMonitoring.productionOrders')}</TableHead>
                          <TableHead>{t('productionMonitoring.totalRolls')}</TableHead>
                          <TableHead>{t('productionMonitoring.totalWeight')}</TableHead>
                          <TableHead>{t('productionMonitoring.avgCompletionTime')}</TableHead>
                          <TableHead>{t('productionMonitoring.qualityScore')}</TableHead>
                          <TableHead>{t('productionMonitoring.onTimeDelivery')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rolePerformance.map((role) => (
                          <TableRow key={role.role_id}>
                            <TableCell className={t("pages.production-monitoring.name.font_medium")}>
                              {role.role_name}
                            </TableCell>
                            <TableCell>
                              {formatNumber(role.user_count)}
                            </TableCell>
                            <TableCell
                              data-testid={`role-${role.role_id}-production-orders`}
                            >
                              {formatNumber(role.total_production_orders)}
                            </TableCell>
                            <TableCell
                              data-testid={`role-${role.role_id}-total-rolls`}
                            >
                              {formatNumber(role.total_rolls)}
                            </TableCell>
                            <TableCell
                              data-testid={`role-${role.role_id}-total-weight`}
                            >
                              {formatWeight(role.total_weight_kg)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(
                                Math.round(role.avg_order_completion_time),
                              )}{" "}
                              {t('productionMonitoring.hours')}
                            </TableCell>
                            <TableCell>
                              <div className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                                <Progress
                                  value={role.quality_score}
                                  className={t("pages.production-monitoring.name.w_16_h_2")}
                                />
                                <span className={t("pages.production-monitoring.name.text_sm")}>
                                  {formatPercentage(role.quality_score)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={t("pages.production-monitoring.name.flex_items_center_gap_2")}>
                                <Progress
                                  value={role.on_time_delivery_rate}
                                  className={t("pages.production-monitoring.name.w_16_h_2")}
                                />
                                <span className={t("pages.production-monitoring.name.text_sm")}>
                                  {formatPercentage(role.on_time_delivery_rate)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="efficiency">
              <Card>
                <CardHeader>
                  <CardTitle>{t('productionMonitoring.generalEfficiencyMetrics')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {efficiencyLoading ? (
                    <div className={t("pages.production-monitoring.name.text_center_py_8")}>
                      {t('productionMonitoring.loadingData')}
                    </div>{t('pages.production-monitoring.)_:_(efficiencydata_as_any)?.efficiency_?_(')}<div className={t("pages.production-monitoring.name.grid_grid_cols_2_lg_grid_cols_4_gap_4")}>
                      <div className={t("pages.production-monitoring.name.text_center_p_4_bg_blue_50_rounded_lg")}>
                        <div className={t("pages.production-monitoring.name.text_2xl_font_bold_text_blue_600")}>
                          {formatWeight(
                            (efficiencyData as any).efficiency
                              .total_production || 0,
                          )}
                        </div>
                        <div className={t("pages.production-monitoring.name.text_sm_text_gray_600")}>
                          {t('productionMonitoring.totalProduction')}
                        </div>
                      </div>

                      <div className={t("pages.production-monitoring.name.text_center_p_4_bg_red_50_rounded_lg")}>
                        <div className={t("pages.production-monitoring.name.text_2xl_font_bold_text_red_600")}>
                          {formatPercentage(
                            (efficiencyData as any).efficiency
                              .waste_percentage || 0,
                          )}
                        </div>
                        <div className={t("pages.production-monitoring.name.text_sm_text_gray_600")}>{t('productionMonitoring.wastePercentage')}</div>
                      </div>

                      <div className={t("pages.production-monitoring.name.text_center_p_4_bg_green_50_rounded_lg")}>
                        <div className={t("pages.production-monitoring.name.text_2xl_font_bold_text_green_600")}>
                          {formatPercentage(
                            (efficiencyData as any).efficiency.quality_score ||
                              0,
                          )}
                        </div>
                        <div className={t("pages.production-monitoring.name.text_sm_text_gray_600")}>{t('productionMonitoring.qualityScore')}</div>
                      </div>

                      <div className={t("pages.production-monitoring.name.text_center_p_4_bg_purple_50_rounded_lg")}>
                        <div className={t("pages.production-monitoring.name.text_2xl_font_bold_text_purple_600")}>
                          {formatPercentage(
                            (efficiencyData as any).efficiency
                              .machine_utilization || 0,
                          )}
                        </div>
                        <div className={t("pages.production-monitoring.name.text_sm_text_gray_600")}>
                          {t('productionMonitoring.machineUtilization')}
                        </div>
                      </div>
                    </div>{t('pages.production-monitoring.)_:_(')}<div className={t("pages.production-monitoring.name.text_center_py_8_text_gray_500")}>
                      {t('productionMonitoring.noDataAvailable')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
