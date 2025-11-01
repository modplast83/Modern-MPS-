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

  // WebSocket realtime (use env or default)
  const wsUrl = process.env.REACT_APP_PROD_WS_URL || "ws://localhost:4000/ws";
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
