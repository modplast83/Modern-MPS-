import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { formatNumber, formatPercentage } from "../../lib/formatNumber";
import ErrorBoundary from "../ErrorBoundary";
import {
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
} from "lucide-react";

interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

function DashboardStatsContent() {
  const {
    data: stats = {},
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const dashboardStats: DashboardStat[] = [
    {
      label: "الطلبات النشطة",
      value: formatNumber((stats as any)?.activeOrders || 12),
      change: "+12% من الأسبوع الماضي",
      trend: "up",
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "text-blue-600",
    },
    {
      label: "معدل الإنتاج",
      value: formatPercentage((stats as any)?.productionRate || 85),
      change:
        ((stats as any)?.productionRate || 85) >= 85
          ? "أداء ممتاز"
          : ((stats as any)?.productionRate || 85) >= 70
            ? "أداء جيد"
            : "يحتاج تحسين",
      trend:
        ((stats as any)?.productionRate || 85) >= 85
          ? "up"
          : ((stats as any)?.productionRate || 85) >= 70
            ? "neutral"
            : "down",
      icon: <TrendingUp className="w-6 h-6" />,
      color:
        ((stats as any)?.productionRate || 85) >= 85
          ? "text-green-600"
          : ((stats as any)?.productionRate || 85) >= 70
            ? "text-yellow-600"
            : "text-red-600",
    },
    {
      label: "العمال الحاضرين",
      value: `${formatNumber((stats as any)?.presentEmployees || 18)}/${formatNumber((stats as any)?.totalEmployees || 22)}`,
      change: `${formatPercentage(Math.round((((stats as any)?.presentEmployees || 18) / ((stats as any)?.totalEmployees || 22)) * 100))} معدل الحضور`,
      trend: "neutral",
      icon: <Users className="w-6 h-6" />,
      color: "text-purple-600",
    },
    {
      label: "تنبيهات الصيانة",
      value: formatNumber((stats as any)?.maintenanceAlerts || 2),
      change:
        ((stats as any)?.maintenanceAlerts || 2) > 0
          ? "يتطلب انتباه"
          : "جميع المكائن تعمل بشكل طبيعي",
      trend: ((stats as any)?.maintenanceAlerts || 2) > 0 ? "down" : "up",
      icon: <AlertTriangle className="w-6 h-6" />,
      color:
        ((stats as any)?.maintenanceAlerts || 2) > 0
          ? "text-red-600"
          : "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {dashboardStats.map((stat, index) => (
        <Card
          key={index}
          className="hover:shadow-md transition-shadow"
          data-testid={`stat-card-${index}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p
                  className="text-sm font-medium text-gray-600 mb-1"
                  data-testid={`stat-label-${index}`}
                >
                  {stat.label}
                </p>
                <p
                  className={`text-2xl font-bold ${stat.color} mb-1`}
                  data-testid={`stat-value-${index}`}
                >
                  {stat.value}
                </p>
                <div className="flex items-center gap-1">
                  {stat.trend === "up" && (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  )}
                  {stat.trend === "down" && (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  {stat.trend === "neutral" && (
                    <Activity className="w-3 h-3 text-gray-500" />
                  )}
                  <p
                    className="text-xs text-gray-500"
                    data-testid={`stat-change-${index}`}
                  >
                    {stat.change}
                  </p>
                </div>
              </div>
              <div className={`${stat.color} opacity-20`}>{stat.icon}</div>
            </div>

            {/* Additional indicators */}
            <div className="mt-3 flex justify-between items-center">
              <Badge
                variant={
                  stat.trend === "up"
                    ? "default"
                    : stat.trend === "down"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs"
                data-testid={`stat-badge-${index}`}
              >
                {stat.trend === "up"
                  ? "ممتاز"
                  : stat.trend === "down"
                    ? "يحتاج انتباه"
                    : "مستقر"}
              </Badge>
              <Clock className="w-3 h-3 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardStats() {
  return (
    <ErrorBoundary
      fallback="component"
      title="خطأ في تحميل الإحصائيات"
      description="تعذر تحميل إحصائيات لوحة التحكم. يرجى المحاولة مرة أخرى."
      onError={(error, errorInfo) => {
        console.error("Dashboard stats error:", error, errorInfo);
      }}
    >
      <DashboardStatsContent />
    </ErrorBoundary>
  );
}
