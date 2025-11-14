import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { formatNumber, formatPercentage } from "../../lib/formatNumber";
import ErrorBoundary from "../ErrorBoundary";
import { useTranslation } from 'react-i18next';
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
      <div className={t("components.dashboard.dashboardstats.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_4_gap_4_mb_6")}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className={t("components.dashboard.dashboardstats.name.p_6")}>
              <div className={t("components.dashboard.dashboardstats.name.animate_pulse")}>
                <div className={t("components.dashboard.dashboardstats.name.h_4_bg_gray_200_rounded_mb_2")}></div>
                <div className={t("components.dashboard.dashboardstats.name.h_8_bg_gray_200_rounded_mb_2")}></div>
                <div className={t("components.dashboard.dashboardstats.name.h_3_bg_gray_200_rounded")}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const dashboardStats: DashboardStat[] = [
    {
      label: t('dashboard.activeOrders'),
      value: formatNumber((stats as any)?.activeOrders || 12),
      change: `+12% ${t('dashboard.weeklyChange')}`,
      trend: "up",
      icon: <ShoppingCart className={t("components.dashboard.dashboardstats.name.w_6_h_6")} />,
      color: "text-blue-600",
    },
    {
      label: t('dashboard.productionRate'),
      value: formatPercentage((stats as any)?.productionRate || 85),
      change:
        ((stats as any)?.productionRate || 85) >= 85
          ? t('dashboard.excellentPerformance')
          : ((stats as any)?.productionRate || 85) >= 70
            ? t('dashboard.goodPerformance')
            : t('dashboard.needsImprovement'),
      trend:
        ((stats as any)?.productionRate || 85) >= 85
          ? "up"
          : ((stats as any)?.productionRate || 85) >{t('components.dashboard.DashboardStats.=_70_?_"neutral"_:_"down",_icon:')}<TrendingUp className={t("components.dashboard.dashboardstats.name.w_6_h_6")} />,
      color:
        ((stats as any)?.productionRate || 85) >= 85
          ? "text-green-600"
          : ((stats as any)?.productionRate || 85) >= 70
            ? "text-yellow-600"
            : "text-red-600",
    },
    {
      label: t('dashboard.presentEmployees'),
      value: `${formatNumber((stats as any)?.presentEmployees || 18)}/${formatNumber((stats as any)?.totalEmployees || 22)}`,
      change: `${formatPercentage(Math.round((((stats as any)?.presentEmployees || 18) / ((stats as any)?.totalEmployees || 22)) * 100))} ${t('dashboard.attendanceRate')}`,
      trend: "neutral",
      icon: <Users className={t("components.dashboard.dashboardstats.name.w_6_h_6")} />,
      color: "text-purple-600",
    },
    {
      label: t('dashboard.maintenanceAlerts'),
      value: formatNumber((stats as any)?.maintenanceAlerts || 2),
      change:
        ((stats as any)?.maintenanceAlerts || 2) > 0
          ? t('dashboard.requiresAttention')
          : t('dashboard.allMachinesNormal'),
      trend: ((stats as any)?.maintenanceAlerts || 2) >{t('components.dashboard.DashboardStats.0_?_"down"_:_"up",_icon:')}<AlertTriangle className={t("components.dashboard.dashboardstats.name.w_6_h_6")} />,
      color:
        ((stats as any)?.maintenanceAlerts || 2) > 0
          ? "text-red-600"
          : "text-green-600",
    },
  ];

  return (
    <div className={t("components.dashboard.dashboardstats.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_4_gap_4_mb_6")}>
      {dashboardStats.map((stat, index) => (
        <Card
          key={index}
          className={t("components.dashboard.dashboardstats.name.hover_shadow_md_transition_shadow")}
          data-testid={`stat-card-${index}`}
        >
          <CardContent className={t("components.dashboard.dashboardstats.name.p_6")}>
            <div className={t("components.dashboard.dashboardstats.name.flex_items_center_justify_between")}>
              <div className={t("components.dashboard.dashboardstats.name.flex_1")}>
                <p
                  className={t("components.dashboard.dashboardstats.name.text_sm_font_medium_text_gray_600_mb_1")}
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
                <div className={t("components.dashboard.dashboardstats.name.flex_items_center_gap_1")}>
                  {stat.trend === "up" && (
                    <TrendingUp className={t("components.dashboard.dashboardstats.name.w_3_h_3_text_green_500")} />
                  )}
                  {stat.trend === "down" && (
                    <TrendingDown className={t("components.dashboard.dashboardstats.name.w_3_h_3_text_red_500")} />
                  )}
                  {stat.trend === "neutral" && (
                    <Activity className={t("components.dashboard.dashboardstats.name.w_3_h_3_text_gray_500")} />
                  )}
                  <p
                    className={t("components.dashboard.dashboardstats.name.text_xs_text_gray_500")}
                    data-testid={`stat-change-${index}`}
                  >
                    {stat.change}
                  </p>
                </div>
              </div>
              <div className={`${stat.color} opacity-20`}>{stat.icon}</div>
            </div>

            {/* Additional indicators */}
            <div className={t("components.dashboard.dashboardstats.name.mt_3_flex_justify_between_items_center")}>
              <Badge
                variant={
                  stat.trend === "up"
                    ? "default"
                    : stat.trend === "down"
                      ? "destructive"
                      : "secondary"
                }
                className={t("components.dashboard.dashboardstats.name.text_xs")}
                data-testid={`stat-badge-${index}`}
              >
                {stat.trend === "up"
                  ? t('dashboard.excellent')
                  : stat.trend === "down"
                    ? t('dashboard.needsAttention')
                    : t('dashboard.stable')}
              </Badge>
              <Clock className={t("components.dashboard.dashboardstats.name.w_3_h_3_text_gray_400")} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardStats() {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      fallback="component"
      title={t('dashboard.errorLoadingStats')}
      description={t('dashboard.errorDescription')}
      onError={(error, errorInfo) => {
        console.error("Dashboard stats error:", error, errorInfo);
      }}
    >
      <DashboardStatsContent />
    </ErrorBoundary>
  );
}
