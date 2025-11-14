// src/pages/production-monitoring.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "maintenance":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "down":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Timer className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header />

      <div className="flex">
        <Sidebar />
        <MobileNav />

        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                لوحة مراقبة الإنتاج
              </h1>
              <p className="text-gray-600">
                مراقبة شاملة وفورية لعمليات الإنتاج والأداء
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={isAutoRefreshEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                data-testid="button-auto-refresh"
              >
                {isAutoRefreshEnabled ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isAutoRefreshEnabled ? "إيقاف التحديث" : "تشغيل التحديث"}
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
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث الآن
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                تصدير التقرير
              </Button>
            </div>
          </div>

          {/* Date Filter Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">فترة التقرير:</span>
                </div>

                <Select value={dateFilter || ""} onValueChange={setDateFilter}>
                  <SelectTrigger
                    className="w-32"
                    data-testid="select-date-filter"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">اليوم</SelectItem>
                    <SelectItem value="7">آخر أسبوع</SelectItem>
                    <SelectItem value="30">آخر شهر</SelectItem>
                    <SelectItem value="90">آخر 3 أشهر</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-36"
                    data-testid="input-date-from"
                  />
                  <span className="text-sm text-gray-500">إلى</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-36"
                    data-testid="input-date-to"
                  />
                </div>

                <Badge variant="outline" className="text-xs">
                  آخر تحديث:{" "}
                  {new Date(stats.lastUpdated).toLocaleString("ar-EG")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">رولات اليوم</p>
                    <p
                      className="text-xl font-bold text-blue-600"
                      data-testid="stat-daily-rolls"
                    >
                      {formatNumber(stats.currentStats.daily_rolls)}
                    </p>
                  </div>
                  <Factory className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">الإنتاج اليومي</p>
                    <p
                      className="text-xl font-bold text-green-600"
                      data-testid="stat-daily-weight"
                    >
                      {formatWeight(stats.currentStats.daily_weight)}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">الطلبات النشطة</p>
                    <p
                      className="text-xl font-bold text-purple-600"
                      data-testid="stat-active-orders"
                    >
                      {formatNumber(stats.currentStats.active_orders)}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">مكتمل اليوم</p>
                    <p
                      className="text-xl font-bold text-emerald-600"
                      data-testid="stat-completed-today"
                    >
                      {formatNumber(stats.currentStats.completed_today)}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">الهدر الحالي</p>
                    <p
                      className="text-xl font-bold text-red-600"
                      data-testid="stat-current-waste"
                    >
                      {formatWeight(stats.currentStats.current_waste)}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">متوسط الكفاءة</p>
                    <p
                      className="text-xl font-bold text-indigo-600"
                      data-testid="stat-avg-efficiency"
                    >
                      {formatPercentage(stats.currentStats.avg_efficiency)}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                تنبيهات الإنتاج ({alerts.length})
              </h3>
              {alerts.slice(0, 3).map((alert, index) => (
                <Alert
                  key={index}
                  variant={alert.type === "error" ? "destructive" : "default"}
                >
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <AlertTitle>{alert.title}</AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Queue Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  حالة الطوابير
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
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  أداء الأقسام
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
                      name="الإنتاج (كجم)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Machine Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                حالة المكائن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.machineStatus.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 col-span-full">لا توجد بيانات للمكائن</div>
                ) : (
                  stats.machineStatus.map((machine) => (
                    <MachineCard key={machine.machine_id} machine={machine} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Tables */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="w-full lg:w-auto">
              <TabsTrigger value="users" data-testid="tab-users">
                أداء المستخدمين
              </TabsTrigger>
              <TabsTrigger value="roles" data-testid="tab-roles">
                أداء الأقسام
              </TabsTrigger>
              <TabsTrigger value="efficiency" data-testid="tab-efficiency">
                مؤشرات الكفاءة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات أداء المستخدمين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المستخدم</TableHead>
                          <TableHead>القسم</TableHead>
                          <TableHead>الرولات المُنشأة</TableHead>
                          <TableHead>الرولات المطبوعة</TableHead>
                          <TableHead>الرولات المقطوعة</TableHead>
                          <TableHead>إجمالي الوزن</TableHead>
                          <TableHead>ساعات العمل</TableHead>
                          <TableHead>نقاط الكفاءة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userPerformance.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {user.display_name_ar || user.username}
                                </div>
                                <div className="text-sm text-gray-500">
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
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={user.efficiency_score}
                                  className="w-16 h-2"
                                />
                                <span className="text-sm">
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
                  <CardTitle>إحصائيات أداء الأقسام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>القسم</TableHead>
                          <TableHead>عدد المستخدمين</TableHead>
                          <TableHead>أوامر الإنتاج</TableHead>
                          <TableHead>إجمالي الرولات</TableHead>
                          <TableHead>إجمالي الوزن</TableHead>
                          <TableHead>متوسط وقت الإنجاز</TableHead>
                          <TableHead>نقاط الجودة</TableHead>
                          <TableHead>معدل التسليم في الوقت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rolePerformance.map((role) => (
                          <TableRow key={role.role_id}>
                            <TableCell className="font-medium">
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
                              ساعة
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={role.quality_score}
                                  className="w-16 h-2"
                                />
                                <span className="text-sm">
                                  {formatPercentage(role.quality_score)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={role.on_time_delivery_rate}
                                  className="w-16 h-2"
                                />
                                <span className="text-sm">
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
                  <CardTitle>مؤشرات الكفاءة العامة</CardTitle>
                </CardHeader>
                <CardContent>
                  {efficiencyLoading ? (
                    <div className="text-center py-8">
                      جاري تحميل البيانات...
                    </div>
                  ) : (efficiencyData as any)?.efficiency ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatWeight(
                            (efficiencyData as any).efficiency
                              .total_production || 0,
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          إجمالي الإنتاج
                        </div>
                      </div>

                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {formatPercentage(
                            (efficiencyData as any).efficiency
                              .waste_percentage || 0,
                          )}
                        </div>
                        <div className="text-sm text-gray-600">نسبة الهدر</div>
                      </div>

                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatPercentage(
                            (efficiencyData as any).efficiency.quality_score ||
                              0,
                          )}
                        </div>
                        <div className="text-sm text-gray-600">نقاط الجودة</div>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatPercentage(
                            (efficiencyData as any).efficiency
                              .machine_utilization || 0,
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          استخدام المكائن
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد بيانات متاحة
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
