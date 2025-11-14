import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    <div className={t("pages.ml-analytics.name.container_mx_auto_p_6_space_y_6")} dir="rtl">
      <div className={t("pages.ml-analytics.name.flex_items_center_justify_between")}>
        <div className={t("pages.ml-analytics.name.flex_items_center_gap_2")}>
          <Brain className={t("pages.ml-analytics.name.h_8_w_8_text_blue_600")} />
          <div>
            <h1 className={t("pages.ml-analytics.name.text_3xl_font_bold")}>{t('mlAnalytics.title')}</h1>
            <p className={t("pages.ml-analytics.name.text_muted_foreground")}>
              {t('mlAnalytics.description')}
            </p>
          </div>
        </div>

        <div className={t("pages.ml-analytics.name.flex_items_center_gap_2")}>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(Number(e.target.value))}
            className={t("pages.ml-analytics.name.px_3_py_2_border_rounded_md")}
          >
            <option value={1}>{t('mlAnalytics.machine1')}</option>
            <option value={2}>{t('mlAnalytics.machine2')}</option>
            <option value={3}>{t('mlAnalytics.machine3')}</option>
          </select>

          <Button
            onClick={() => trainModelMutation.mutate(selectedMachine)}
            disabled={trainModelMutation.isPending}
            className={t("pages.ml-analytics.name.gap_2")}
          >
            <RefreshCw
              className={`h-4 w-4 ${trainModelMutation.isPending ? "animate-spin" : ""}`}
            />
            {t('mlAnalytics.trainModel')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="predictions" className={t("pages.ml-analytics.name.space_y_4")}>
        <TabsList className={t("pages.ml-analytics.name.grid_w_full_grid_cols_4")}>
          <TabsTrigger value="predictions" className={t("pages.ml-analytics.name.gap_2")}>
            <TrendingUp className={t("pages.ml-analytics.name.h_4_w_4")} />
            {t('mlAnalytics.predictions')}
          </TabsTrigger>
          <TabsTrigger value="anomalies" className={t("pages.ml-analytics.name.gap_2")}>
            <AlertTriangle className={t("pages.ml-analytics.name.h_4_w_4")} />
            {t('mlAnalytics.anomalyDetection')}
          </TabsTrigger>
          <TabsTrigger value="patterns" className={t("pages.ml-analytics.name.gap_2")}>
            <BarChart3 className={t("pages.ml-analytics.name.h_4_w_4")} />
            {t('mlAnalytics.patternAnalysis')}
          </TabsTrigger>
          <TabsTrigger value="optimization" className={t("pages.ml-analytics.name.gap_2")}>
            <Target className={t("pages.ml-analytics.name.h_4_w_4")} />
            {t('mlAnalytics.optimization')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className={t("pages.ml-analytics.name.space_y_4")}>
          <div className={t("pages.ml-analytics.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_4_gap_4")}>
            <Card>
              <CardHeader className={t("pages.ml-analytics.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.ml-analytics.name.text_sm_font_medium")}>
                  {t('mlAnalytics.predictedRate')}
                </CardTitle>
                <Activity className={t("pages.ml-analytics.name.h_4_w_4_text_muted_foreground")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_2xl_font_bold")}>
                  {predictionLoading
                    ? "..."
                    : `${predictions?.predictedRate.toFixed(1)}%`}
                </div>
                <p className={t("pages.ml-analytics.name.text_xs_text_muted_foreground")}>
                  {t('mlAnalytics.next24Hours')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.ml-analytics.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.ml-analytics.name.text_sm_font_medium")}>
                  {t('mlAnalytics.qualityForecast')}
                </CardTitle>
                <CheckCircle className={t("pages.ml-analytics.name.h_4_w_4_text_muted_foreground")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_2xl_font_bold")}>
                  {predictionLoading
                    ? "..."
                    : `${predictions?.qualityForecast.toFixed(1)}%`}
                </div>
                <p className={t("pages.ml-analytics.name.text_xs_text_muted_foreground")}>
                  {t('mlAnalytics.expectedQuality')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.ml-analytics.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.ml-analytics.name.text_sm_font_medium")}>
                  {t('mlAnalytics.maintenanceAlert')}
                </CardTitle>
                <Settings className={t("pages.ml-analytics.name.h_4_w_4_text_muted_foreground")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_2xl_font_bold")}>
                  {predictionLoading ? (
                    "..."
                  ) : predictions?.maintenanceAlert ? (
                    <XCircle className={t("pages.ml-analytics.name.h_8_w_8_text_red_500")} />{t('pages.ml-analytics.)_:_(')}<CheckCircle className={t("pages.ml-analytics.name.h_8_w_8_text_green_500")} />
                  )}
                </div>
                <p className={t("pages.ml-analytics.name.text_xs_text_muted_foreground")}>
                  {predictions?.maintenanceAlert
                    ? t('mlAnalytics.maintenanceRequired')
                    : t('mlAnalytics.noAlerts')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.ml-analytics.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.ml-analytics.name.text_sm_font_medium")}>
                  {t('mlAnalytics.confidenceLevel')}
                </CardTitle>
                <Brain className={t("pages.ml-analytics.name.h_4_w_4_text_muted_foreground")} />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getConfidenceColor(predictions?.confidence || 0)}`}
                >
                  {predictionLoading
                    ? "..."
                    : `${((predictions?.confidence || 0) * 100).toFixed(0)}%`}
                </div>
                <p className={t("pages.ml-analytics.name.text_xs_text_muted_foreground")}>{t('mlAnalytics.predictionAccuracy')}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('mlAnalytics.smartRecommendations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={t("pages.ml-analytics.name.space_y_2")}>
                {predictions?.recommendations?.map(
                  (rec: string, index: number) => (
                    <div
                      key={index}
                      className={t("pages.ml-analytics.name.flex_items_center_gap_2_p_2_bg_blue_50_rounded_md")}
                    >
                      <Zap className={t("pages.ml-analytics.name.h_4_w_4_text_blue_600")} />
                      <span className={t("pages.ml-analytics.name.text_sm")}>{rec}</span>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className={t("pages.ml-analytics.name.space_y_4")}>
          <div className={t("pages.ml-analytics.name.grid_grid_cols_1_md_grid_cols_3_gap_4")}>
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.ml-analytics.name.flex_items_center_gap_2")}>
                  <AlertTriangle className={t("pages.ml-analytics.name.h_5_w_5")} />
                  {t('mlAnalytics.anomalyStatus')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_center")}>
                  {anomalyLoading ? (
                    <div className={t("pages.ml-analytics.name.animate_pulse")}>{t('mlAnalytics.analyzing')}</div>{t('pages.ml-analytics.)_:_(')}<>
                      {anomalies?.isAnomaly ? (
                        <XCircle className={t("pages.ml-analytics.name.h_16_w_16_text_red_500_mx_auto_mb_2")} />{t('pages.ml-analytics.)_:_(')}<CheckCircle className={t("pages.ml-analytics.name.h_16_w_16_text_green_500_mx_auto_mb_2")} />
                      )}
                      <p className={t("pages.ml-analytics.name.font_medium")}>
                        {anomalies?.isAnomaly
                          ? t('mlAnalytics.anomalyDetected')
                          : t('mlAnalytics.noAnomaly')}
                      </p>
                      {anomalies?.isAnomaly && (
                        <Badge
                          variant={getSeverityColor(anomalies.severity)}
                          className={t("pages.ml-analytics.name.mt_2")}
                        >
                          {anomalies.severity === "high"
                            ? t('alertsCenter.highSeverity')
                            : anomalies.severity === "medium"
                              ? t('alertsCenter.mediumSeverity')
                              : t('alertsCenter.lowSeverity')}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('mlAnalytics.anomalyScore')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_3xl_font_bold_text_center")}>
                  {anomalyLoading ? "..." : anomalies?.anomalyScore.toFixed(2)}
                </div>
                <p className={t("pages.ml-analytics.name.text_center_text_muted_foreground")}>{t('mlAnalytics.outOf5')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('mlAnalytics.affectedMetrics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.space_y_1")}>
                  {anomalies?.affectedMetrics?.map(
                    (metric: string, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={t("pages.ml-analytics.name.block_text_center")}
                      >
                        {metric}
                      </Badge>
                    ),
                  )}
                  {(!anomalies?.affectedMetrics ||
                    anomalies?.affectedMetrics?.length === 0) && (
                    <p className={t("pages.ml-analytics.name.text_center_text_muted_foreground")}>{t('mlAnalytics.none')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {anomalies?.isAnomaly && (
            <Card>
              <CardHeader>
                <CardTitle>{t('mlAnalytics.suggestedActions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.space_y_2")}>
                  {anomalies?.recommendations?.map(
                    (rec: string, index: number) => (
                      <div
                        key={index}
                        className={t("pages.ml-analytics.name.flex_items_center_gap_2_p_2_bg_red_50_rounded_md")}
                      >
                        <AlertTriangle className={t("pages.ml-analytics.name.h_4_w_4_text_red_600")} />
                        <span className={t("pages.ml-analytics.name.text_sm")}>{rec}</span>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className={t("pages.ml-analytics.name.space_y_4")}>
          <div className={t("pages.ml-analytics.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
            <Card>
              <CardHeader>
                <CardTitle>{t('mlAnalytics.peakHours')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.grid_grid_cols_6_gap_2")}>
                  {patterns?.peakHours?.map((hour: number) => (
                    <Badge key={hour} variant="default" className={t("pages.ml-analytics.name.text_center")}>
                      {hour}:00
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('mlAnalytics.optimalShifts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.space_y_2")}>
                  {patterns?.optimalShifts?.map(
                    (shift: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={t("pages.ml-analytics.name.block_text_center")}
                      >
                        {t('mlAnalytics.shift')} {shift}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('mlAnalytics.efficiencyInsights')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={t("pages.ml-analytics.name.space_y_3")}>
                {patterns?.efficiencyInsights?.map(
                  (insight: string, index: number) => (
                    <div
                      key={index}
                      className={t("pages.ml-analytics.name.flex_items_center_gap_2_p_3_bg_green_50_rounded_md")}
                    >
                      <BarChart3 className={t("pages.ml-analytics.name.h_4_w_4_text_green_600")} />
                      <span className={t("pages.ml-analytics.name.text_sm")}>{insight}</span>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className={t("pages.ml-analytics.name.space_y_4")}>
          <div className={t("pages.ml-analytics.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_4_gap_4")}>
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.ml-analytics.name.text_sm")}>{t('mlAnalytics.recommendedSpeed')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_2xl_font_bold")}>
                  {optimizationLoading
                    ? "..."
                    : `${optimization?.recommendedSpeed}%`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={t("pages.ml-analytics.name.text_sm")}>{t('mlAnalytics.temperature')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_2xl_font_bold")}>
                  {optimizationLoading
                    ? "..."
                    : `${optimization?.recommendedTemperature}°C`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={t("pages.ml-analytics.name.text_sm")}>{t('mlAnalytics.recommendedPressure')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_2xl_font_bold")}>
                  {optimizationLoading
                    ? "..."
                    : `${optimization?.recommendedPressure} ${t('mlAnalytics.bar')}`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={t("pages.ml-analytics.name.text_sm")}>{t('mlAnalytics.expectedImprovement')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.ml-analytics.name.text_2xl_font_bold_text_green_600")}>
                  {optimizationLoading
                    ? "..."
                    : `+${optimization?.expectedImprovement.toFixed(1)}%`}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('mlAnalytics.applyRecommended')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={t("pages.ml-analytics.name.space_y_4")}>
                <div className={t("pages.ml-analytics.name.flex_items_center_justify_between_p_3_border_rounded_md")}>
                  <span>{t('mlAnalytics.optimizationConfidence')}</span>
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
                  className={t("pages.ml-analytics.name.w_full_gap_2")}
                >
                  <Target className={t("pages.ml-analytics.name.h_4_w_4")} />
                  {t('mlAnalytics.applyRecommended')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
