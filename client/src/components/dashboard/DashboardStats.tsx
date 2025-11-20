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
import { useTranslation } from "react-i18next";

interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

function DashboardStatsContent() {
  const { t } = useTranslation();
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
        label: t('dashboard_active_orders', 'الطلبات النشطة'),
        value: formatNumber((stats as any)?.activeOrders || 12),
        change: t('dashboard_active_orders_change', '+12% من الأسبوع الماضي'),
        trend: "up",
        icon: <ShoppingCart className="w-6 h-6" />,
        color: "bg-blue-100 text-blue-800",
      },
      {
        label: t('dashboard_in_production', 'قيد الإنتاج'),
        value: formatNumber((stats as any)?.inProduction || 8),
        change: t('dashboard_in_production_change', '+8% من الأسبوع الماضي'),
        trend: "up",
        icon: <Package className="w-6 h-6" />,
        color: "bg-green-100 text-green-800",
      },
      {
        label: t('dashboard_customers', 'العملاء'),
        value: formatNumber((stats as any)?.customers || 120),
        change: t('dashboard_customers_change', '+5 عملاء جدد'),
        trend: "neutral",
        icon: <Users className="w-6 h-6" />,
        color: "bg-yellow-100 text-yellow-800",
      },
      {
        label: t('dashboard_alerts', 'التنبيهات'),
        value: formatNumber((stats as any)?.alerts || 2),
        change: t('dashboard_alerts_change', 'تنبيه جديد'),
        trend: "down",
        icon: <AlertTriangle className="w-6 h-6" />,
        color: "bg-red-100 text-red-800",
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
