import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown, ClipboardList, TrendingUp, Star, Trash2 } from "lucide-react";
import type { DashboardStats as StatsType } from "@/types";

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<StatsType>({
    queryKey: ['/api/dashboard/stats'],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "الطلبات النشطة",
      value: stats?.activeOrders || 0,
      change: 12,
      trend: "up",
      icon: ClipboardList,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "معدل الإنتاج",
      value: `${stats?.productionRate || 0}%`,
      change: 5,
      trend: "up",  
      icon: TrendingUp,
      bgColor: "bg-success/10",
      iconColor: "text-success",
    },
    {
      title: "نسبة الجودة",
      value: `${stats?.qualityScore || 0}%`,
      change: 2,
      trend: "up",
      icon: Star,
      bgColor: "bg-warning/10", 
      iconColor: "text-warning",
    },
    {
      title: "نسبة الهدر",
      value: `${stats?.wastePercentage || 0}%`,
      change: 1.1,
      trend: "down",
      icon: Trash2,
      bgColor: "bg-danger/10",
      iconColor: "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? ArrowUp : ArrowDown;
        
        return (
          <Card key={stat.title} className="card-stats">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <span className={`flex items-center ${
                      stat.trend === "up" ? "text-success" : "text-danger"
                    }`}>
                      <TrendIcon className="h-3 w-3 ml-1" />
                      {stat.change}%
                    </span>
                    <span className="text-muted-foreground mr-2">عن الأسبوع الماضي</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
