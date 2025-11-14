import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
    { name: "سليم", value: overview?.healthy_checks || 0, color: "#10B981" },
    { name: "تحذير", value: overview?.warning_checks || 0, color: "#F59E0B" },
    { name: "خطر", value: overview?.critical_checks || 0, color: "#EF4444" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            مراقبة سلامة النظام
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            مراقبة شاملة لأداء وسلامة النظام في الوقت الفعلي
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Activity className="w-4 h-4 ml-1" />
            مراقبة مباشرة
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
              <Shield className="w-4 h-4 ml-1" />
              {overview.overall_status === "healthy"
                ? "النظام سليم"
                : overview.overall_status === "warning"
                  ? "تحذير"
                  : "خطر"}
            </Badge>
          )}
        </div>
      </div>

      {/* نظرة عامة على الحالة */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    فحوصات سليمة
                  </p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {overview.healthy_checks}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    تحذيرات
                  </p>
                  <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                    {overview.warning_checks}
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    حالات خطرة
                  </p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {overview.critical_checks}
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    نسبة التشغيل
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {overview.uptime_percent?.toFixed(1)}%
                  </p>
                </div>
                <Zap className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="checks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checks" data-testid="tab-health-checks">
            فحوصات السلامة
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">
            مؤشرات الأداء
          </TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">
            نظرة عامة
          </TabsTrigger>
        </TabsList>

        {/* تبويب فحوصات السلامة */}
        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                فحوصات السلامة ({healthChecks.length})
              </CardTitle>
              <CardDescription>
                جميع فحوصات سلامة النظام وحالتها الحالية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthChecks.map((check) => {
                  const TypeIcon = getTypeIcon(check.check_type);

                  return (
                    <Card key={check.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                            <TypeIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {check.check_name_ar}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {check.check_type === "database"
                                ? "قاعدة بيانات"
                                : check.check_type === "api"
                                  ? "واجهة برمجية"
                                  : check.check_type === "memory"
                                    ? "ذاكرة"
                                    : check.check_type === "cpu"
                                      ? "معالج"
                                      : check.check_type === "disk"
                                        ? "قرص صلب"
                                        : "نظام"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div
                              className={`font-semibold ${getStatusColor(check.status)}`}
                            >
                              {check.status === "healthy"
                                ? "سليم"
                                : check.status === "warning"
                                  ? "تحذير"
                                  : check.status === "critical"
                                    ? "خطر"
                                    : "غير معروف"}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {check.check_duration_ms}ms
                            </div>
                          </div>

                          <div className="w-20">
                            <Progress
                              value={check.success_rate_24h}
                              className="h-2"
                            />
                            <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-300">
                              {check.success_rate_24h?.toFixed(1)}%
                            </div>
                          </div>

                          {check.is_critical && (
                            <Badge variant="destructive" className="text-xs">
                              حرج
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* تفاصيل إضافية */}
                      <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">
                            متوسط الاستجابة:{" "}
                          </span>
                          <span className="font-medium">
                            {check.average_response_time}ms
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">
                            أخطاء 24س:{" "}
                          </span>
                          <span className="font-medium">
                            {check.error_count_24h}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">
                            آخر فحص:{" "}
                          </span>
                          <span className="font-medium">
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
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* رسم بياني لاستخدام الذاكرة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="w-5 h-5" />
                  استخدام الذاكرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => `الوقت: ${label}`}
                      formatter={(value) => [`${value}%`, "استخدام الذاكرة"]}
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
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  توزيع حالة الفحوصات
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      متوسط زمن الاستجابة
                    </p>
                    <p className="text-2xl font-bold">
                      {healthChecks.reduce(
                        (acc, check) => acc + check.average_response_time,
                        0,
                      ) / (healthChecks.length || 1)}
                      ms
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      معدل النجاح
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {(
                        healthChecks.reduce(
                          (acc, check) => acc + check.success_rate_24h,
                          0,
                        ) / (healthChecks.length || 1)
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      إجمالي الأخطاء
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {healthChecks.reduce(
                        (acc, check) => acc + check.error_count_24h,
                        0,
                      )}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويب النظرة العامة */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    حالة النظام:
                  </span>
                  <Badge
                    variant={
                      overview?.overall_status === "healthy"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {overview?.overall_status === "healthy"
                      ? "سليم"
                      : "يحتاج انتباه"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    إجمالي الفحوصات:
                  </span>
                  <span className="font-medium">{overview?.total_checks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    نسبة التشغيل:
                  </span>
                  <span className="font-medium">
                    {overview?.uptime_percent?.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    آخر فحص:
                  </span>
                  <span className="font-medium">
                    {overview?.last_check
                      ? new Date(overview.last_check).toLocaleString("ar")
                      : "غير محدد"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التوصيات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overview?.critical_checks &&
                    overview.critical_checks > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          ⚠️ يوجد {overview.critical_checks} فحص في حالة خطرة
                          يحتاج انتباه فوري
                        </p>
                      </div>
                    )}

                  {overview?.warning_checks && overview.warning_checks > 0 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        📋 يوجد {overview.warning_checks} فحص يحتاج مراجعة
                      </p>
                    </div>
                  )}

                  {overview?.uptime_percent && overview.uptime_percent < 99 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        💡 نسبة التشغيل يمكن تحسينها - راجع سجلات الأخطاء
                      </p>
                    </div>
                  )}

                  {!overview?.critical_checks && !overview?.warning_checks && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        ✅ جميع الأنظمة تعمل بشكل طبيعي
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
