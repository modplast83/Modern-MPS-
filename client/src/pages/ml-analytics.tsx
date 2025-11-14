import { useState } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  Settings,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";

interface MLPrediction {
  predictedRate: number;
  qualityForecast: number;
  maintenanceAlert: boolean;
  confidence: number;
  recommendations: string[];
}

interface AnomalyDetection {
  isAnomaly: boolean;
  anomalyScore: number;
  affectedMetrics: string[];
  severity: "low" | "medium" | "high";
  recommendations: string[];
}

interface ProductionPatterns {
  peakHours: number[];
  optimalShifts: string[];
  seasonalTrends: any[];
  efficiencyInsights: string[];
}

interface OptimizationResult {
  recommendedSpeed: number;
  recommendedTemperature: number;
  recommendedPressure: number;
  expectedImprovement: number;
  confidence: number;
}

export default function MLAnalytics() {
  const [selectedMachine, setSelectedMachine] = useState<number>(1);
  const queryClient = useQueryClient();

  // جلب التنبؤات - استخدام default queryFn
  const {
    data: predictions,
    isLoading: predictionLoading,
    refetch: refetchPredictions,
  } = useQuery<MLPrediction>({
    queryKey: ["/api/ml/predictions", selectedMachine],
    // Use default queryFn from queryClient config instead of custom one
    enabled: !!selectedMachine, // Only fetch when machine is selected
  });

  // جلب اكتشاف الشذوذ - استخدام default queryFn
  const { data: anomalies, isLoading: anomalyLoading } =
    useQuery<AnomalyDetection>({
      queryKey: ["/api/ml/anomalies", selectedMachine],
      // Use default queryFn from queryClient config
      enabled: !!selectedMachine,
    });

  // جلب تحليل الأنماط - استخدام default queryFn
  const { data: patterns, isLoading: patternsLoading } =
    useQuery<ProductionPatterns>({
      queryKey: ["/api/ml/patterns"],
      // Use default queryFn - no machine dependency needed for patterns
    });

  // جلب التحسينات المقترحة - استخدام default queryFn
  const { data: optimization, isLoading: optimizationLoading } =
    useQuery<OptimizationResult>({
      queryKey: ["/api/ml/optimization", selectedMachine],
      // Use default queryFn from queryClient config
      enabled: !!selectedMachine,
    });

  // تدريب النموذج - استخدام apiRequest
  const trainModelMutation = useMutation({
    mutationFn: async (machineId: number) => {
      const response = await apiRequest(`/api/ml/train/${machineId}`, {
        method: "POST",
      });
      return response.json();
    },
    onSuccess: () => {
      // Use more specific invalidation to reduce unnecessary cancellations
      queryClient.invalidateQueries({ queryKey: ["/api/ml/predictions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ml/anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ml/patterns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ml/optimization"] });
    },
  });

  // تطبيق التحسينات - استخدام apiRequest
  const applyOptimizationMutation = useMutation({
    mutationFn: async (optimization: OptimizationResult) => {
      const response = await apiRequest(
        `/api/ml/apply-optimization/${selectedMachine}`,
        {
          method: "POST",
          body: JSON.stringify(optimization),
        },
      );
      return response.json();
    },
    onSuccess: () => {
      // Specific invalidation to avoid broad cancellations
      queryClient.invalidateQueries({
        queryKey: ["/api/ml/optimization", selectedMachine],
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">تحليلات التعلم الآلي</h1>
            <p className="text-muted-foreground">
              تحليل ذكي للإنتاج والتنبؤ بالأداء
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={1}>مكينة الإنتاج 1</option>
            <option value={2}>مكينة الإنتاج 2</option>
            <option value={3}>مكينة الإنتاج 3</option>
          </select>

          <Button
            onClick={() => trainModelMutation.mutate(selectedMachine)}
            disabled={trainModelMutation.isPending}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${trainModelMutation.isPending ? "animate-spin" : ""}`}
            />
            تدريب النموذج
          </Button>
        </div>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            التنبؤات
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            اكتشاف الشذوذ
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            تحليل الأنماط
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2">
            <Target className="h-4 w-4" />
            التحسين
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  معدل الإنتاج المتوقع
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {predictionLoading
                    ? "..."
                    : `${predictions?.predictedRate.toFixed(1)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  للـ 24 ساعة القادمة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  توقع الجودة
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {predictionLoading
                    ? "..."
                    : `${predictions?.qualityForecast.toFixed(1)}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  نسبة الجودة المتوقعة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  تنبيه الصيانة
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {predictionLoading ? (
                    "..."
                  ) : predictions?.maintenanceAlert ? (
                    <XCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {predictions?.maintenanceAlert
                    ? "صيانة مطلوبة"
                    : "لا يوجد تنبيهات"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  مستوى الثقة
                </CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getConfidenceColor(predictions?.confidence || 0)}`}
                >
                  {predictionLoading
                    ? "..."
                    : `${((predictions?.confidence || 0) * 100).toFixed(0)}%`}
                </div>
                <p className="text-xs text-muted-foreground">دقة التنبؤ</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>التوصيات الذكية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {predictions?.recommendations?.map(
                  (rec: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-blue-50 rounded-md"
                    >
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  حالة الشذوذ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {anomalyLoading ? (
                    <div className="animate-pulse">جاري التحليل...</div>
                  ) : (
                    <>
                      {anomalies?.isAnomaly ? (
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-2" />
                      ) : (
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
                      )}
                      <p className="font-medium">
                        {anomalies?.isAnomaly
                          ? "تم اكتشاف شذوذ"
                          : "لا يوجد شذوذ"}
                      </p>
                      {anomalies?.isAnomaly && (
                        <Badge
                          variant={getSeverityColor(anomalies.severity)}
                          className="mt-2"
                        >
                          {anomalies.severity === "high"
                            ? "عالي"
                            : anomalies.severity === "medium"
                              ? "متوسط"
                              : "منخفض"}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>درجة الشذوذ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">
                  {anomalyLoading ? "..." : anomalies?.anomalyScore.toFixed(2)}
                </div>
                <p className="text-center text-muted-foreground">من أصل 5.0</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المقاييس المتأثرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {anomalies?.affectedMetrics?.map(
                    (metric: string, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="block text-center"
                      >
                        {metric}
                      </Badge>
                    ),
                  )}
                  {(!anomalies?.affectedMetrics ||
                    anomalies?.affectedMetrics?.length === 0) && (
                    <p className="text-center text-muted-foreground">لا يوجد</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {anomalies?.isAnomaly && (
            <Card>
              <CardHeader>
                <CardTitle>إجراءات مقترحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {anomalies?.recommendations?.map(
                    (rec: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-red-50 rounded-md"
                      >
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>ساعات الذروة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {patterns?.peakHours?.map((hour: number) => (
                    <Badge key={hour} variant="default" className="text-center">
                      {hour}:00
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أفضل نوبات العمل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {patterns?.optimalShifts?.map(
                    (shift: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="block text-center"
                      >
                        النوبة {shift}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>رؤى الكفاءة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patterns?.efficiencyInsights?.map(
                  (insight: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-green-50 rounded-md"
                    >
                      <BarChart3 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{insight}</span>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">السرعة المقترحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {optimizationLoading
                    ? "..."
                    : `${optimization?.recommendedSpeed}%`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">درجة الحرارة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {optimizationLoading
                    ? "..."
                    : `${optimization?.recommendedTemperature}°C`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">الضغط المقترح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {optimizationLoading
                    ? "..."
                    : `${optimization?.recommendedPressure} بار`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">التحسن المتوقع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {optimizationLoading
                    ? "..."
                    : `+${optimization?.expectedImprovement.toFixed(1)}%`}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تطبيق التحسينات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <span>مستوى الثقة في التحسينات</span>
                  <Badge variant="secondary">
                    {optimization
                      ? `${(optimization.confidence * 100).toFixed(0)}%`
                      : "..."}
                  </Badge>
                </div>

                <Button
                  onClick={() =>
                    optimization &&
                    applyOptimizationMutation.mutate(optimization)
                  }
                  disabled={
                    applyOptimizationMutation.isPending || !optimization
                  }
                  className="w-full gap-2"
                >
                  <Target className="h-4 w-4" />
                  تطبيق التحسينات المقترحة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
