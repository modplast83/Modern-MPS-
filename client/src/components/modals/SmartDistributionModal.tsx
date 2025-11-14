import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import {
  Sparkles,
  Scale,
  Package,
  AlertTriangle,
  Layers,
  Zap,
  TrendingUp,
  Loader2,
  Info,
  CheckCircle,
  XCircle,
  Factory,
  BarChart3,
  Clock,
  Weight,
} from "lucide-react";
import { useTranslation } from 'react-i18next';

interface SmartDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDistribute: () => void;
}

interface DistributionAlgorithm {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface MachinePreview {
  machineId: number;
  machineName: string;
  machineNameAr: string;
  currentLoad: number;
  proposedLoad: number;
  proposedUtilization: number;
  newCapacityStatus: string;
  proposedOrders: any[];
  productionRate: number;
}

interface DistributionPreviewData {
  totalOrders: number;
  machineCount: number;
  efficiency: number;
  preview: MachinePreview[];
}

interface DistributionPreviewResponse {
  data: DistributionPreviewData;
}

interface MachineCapacityStat {
  machineId: number;
  machineName: string;
  machineNameAr: string;
  currentLoad: number;
  maxCapacity: number;
  utilizationPercentage: number;
  capacityStatus: string;
  orderCount: number;
  productionRate: number;
}

interface CapacityStatsResponse {
  data: MachineCapacityStat[];
}

interface DistributionResult {
  success: boolean;
  message: string;
}

const algorithms: DistributionAlgorithm[] = [
  {
    id: "balanced",
    name: "Balanced Distribution",
    nameAr: "التوزيع المتوازن",
    description: "توزيع متساوٍ حسب عدد الأوامر على جميع المكائن",
    icon: <Scale className={t("components.modals.smartdistributionmodal.name.h_5_w_5")} />,
    color: "bg-blue-100 border-blue-300",
  },
  {
    id: "load-based",
    name: "Load-Based Distribution",
    nameAr: "التوزيع حسب الحمولة",
    description: "توزيع الأوامر حسب الكمية الإجمالية والسعة المتاحة",
    icon: <Weight className={t("components.modals.smartdistributionmodal.name.h_5_w_5")} />,
    color: "bg-green-100 border-green-300",
  },
  {
    id: "priority",
    name: "Priority Distribution",
    nameAr: "التوزيع حسب الأولوية",
    description: "توزيع الأوامر العاجلة أولاً على المكائن الأقل حملاً",
    icon: <AlertTriangle className={t("components.modals.smartdistributionmodal.name.h_5_w_5")} />,
    color: "bg-red-100 border-red-300",
  },
  {
    id: "product-type",
    name: "Product Type Grouping",
    nameAr: "التوزيع حسب نوع المنتج",
    description: "تجميع المنتجات المشابهة على نفس الماكينة",
    icon: <Layers className={t("components.modals.smartdistributionmodal.name.h_5_w_5")} />,
    color: "bg-purple-100 border-purple-300",
  },
  {
    id: "hybrid",
    name: "Hybrid Optimization",
    nameAr: "التوزيع الهجين",
    description: "مزج جميع المعايير للحصول على أفضل توزيع",
    icon: <Zap className={t("components.modals.smartdistributionmodal.name.h_5_w_5")} />,
    color: "bg-orange-100 border-orange-300",
  },
];

export default function SmartDistributionModal({
  isOpen,
  onClose,
  onDistribute,
}: SmartDistributionModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("balanced");
  const [hybridParams, setHybridParams] = useState({
    loadWeight: 30,
    capacityWeight: 30,
    priorityWeight: 20,
    typeWeight: 20,
  });

  // Fetch distribution preview
  const { data: preview, isLoading: isPreviewLoading } = useQuery<DistributionPreviewResponse>({
    queryKey: ["/api/machine-queues/distribution-preview", selectedAlgorithm, hybridParams],
    queryFn: async () => {
      const params = new URLSearchParams({
        algorithm: selectedAlgorithm,
        ...(selectedAlgorithm === "hybrid" 
          ? {
              loadWeight: String(hybridParams.loadWeight),
              capacityWeight: String(hybridParams.capacityWeight),
              priorityWeight: String(hybridParams.priorityWeight),
              typeWeight: String(hybridParams.typeWeight),
            }
          : {}),
      });
      const response = await fetch(`/api/machine-queues/distribution-preview?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch preview");
      return response.json();
    },
    enabled: isOpen,
  });

  // Fetch machine capacity stats
  const { data: capacityStats } = useQuery<CapacityStatsResponse>({
    queryKey: ["/api/machines/capacity-stats"],
    enabled: isOpen,
  });

  // Apply distribution mutation
  const distributeMutation = useMutation({
    mutationFn: async (): Promise<DistributionResult> => {
      const response = await apiRequest("/api/machine-queues/smart-distribute", {
        method: "POST",
        body: JSON.stringify({
          algorithm: selectedAlgorithm,
          params: selectedAlgorithm === "hybrid" ? hybridParams : {},
        }),
      });
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: t('modals.smartDistribution.successTitle'),
          description: result.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/machine-queues"] });
        queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
        onDistribute();
        onClose();
      }
    },
    onError: (error: any) => {
      toast({
        title: t('modals.smartDistribution.errorTitle'),
        description: error.message || t('modals.smartDistribution.errorDescription'),
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    distributeMutation.mutate();
  };

  const getCapacityStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "text-green-600 bg-green-100";
      case "moderate":
        return "text-blue-600 bg-blue-100";
      case "high":
        return "text-yellow-600 bg-yellow-100";
      case "overloaded":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 90) return "bg-red-500";
    if (utilization > 70) return "bg-yellow-500";
    if (utilization > 40) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={t("components.modals.smartdistributionmodal.name.max_w_4xl_max_h_90vh_overflow_hidden_flex_flex_col")}>
        <DialogHeader>
          <DialogTitle className={t("components.modals.smartdistributionmodal.name.flex_items_center_gap_2_text_xl")}>
            <Sparkles className={t("components.modals.smartdistributionmodal.name.h_6_w_6_text_purple_600")} />
            {t('modals.smartDistribution.title')}
          </DialogTitle>
          <DialogDescription>
            {t('modals.smartDistribution.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="algorithm" className={t("components.modals.smartdistributionmodal.name.flex_1_overflow_hidden")}>
          <TabsList className={t("components.modals.smartdistributionmodal.name.grid_grid_cols_3_w_full")}>
            <TabsTrigger value="algorithm" data-testid="tab-algorithm">{t('modals.smartDistribution.selectAlgorithm')}</TabsTrigger>
            <TabsTrigger value="preview" data-testid="tab-preview">{t('modals.smartDistribution.previewDistribution')}</TabsTrigger>
            <TabsTrigger value="stats" data-testid="tab-stats">{t('modals.smartDistribution.capacityStats')}</TabsTrigger>
          </TabsList>

          <ScrollArea className={t("components.modals.smartdistributionmodal.name.flex_1_h_500px_mt_4")}>
            <TabsContent value="algorithm" className={t("components.modals.smartdistributionmodal.name.space_y_4")}>
              <RadioGroup
                value={selectedAlgorithm}
                onValueChange={setSelectedAlgorithm}
              >
                {algorithms.map((algo) => (
                  <Card
                    key={algo.id}
                    className={`cursor-pointer transition-all ${
                      selectedAlgorithm === algo.id
                        ? `${algo.color} border-2`
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedAlgorithm(algo.id)}
                    data-testid={`card-algorithm-${algo.id}`}
                  >
                    <CardContent className={t("components.modals.smartdistributionmodal.name.p_4")}>
                      <div className={t("components.modals.smartdistributionmodal.name.flex_items_start_gap_3")}>
                        <RadioGroupItem value={algo.id} id={algo.id} data-testid={`radio-algorithm-${algo.id}`} />
                        <div className={t("components.modals.smartdistributionmodal.name.flex_1")}>
                          <Label
                            htmlFor={algo.id}
                            className={t("components.modals.smartdistributionmodal.name.flex_items_center_gap_2_text_base_font_semibold_cursor_pointer")}
                          >
                            {algo.icon}
                            {t(`modals.smartDistribution.algorithms.${algo.id}.name`)}
                          </Label>
                          <p className={t("components.modals.smartdistributionmodal.name.text_sm_text_muted_foreground_mt_1")}>
                            {t(`modals.smartDistribution.algorithms.${algo.id}.description`)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>

              {selectedAlgorithm === "hybrid" && (
                <Card className={t("components.modals.smartdistributionmodal.name.mt_4")}>
                  <CardHeader>
                    <CardTitle className={t("components.modals.smartdistributionmodal.name.text_sm")}>{t('modals.smartDistribution.hybridCriteria')}</CardTitle>
                  </CardHeader>
                  <CardContent className={t("components.modals.smartdistributionmodal.name.space_y_4")}>
                    <div>
                      <div className={t("components.modals.smartdistributionmodal.name.flex_justify_between_mb_2")}>
                        <Label>{t('modals.smartDistribution.loadWeight')}</Label>
                        <span className={t("components.modals.smartdistributionmodal.name.text_sm_font_medium")}>
                          {hybridParams.loadWeight}%
                        </span>
                      </div>
                      <Slider
                        value={[hybridParams.loadWeight]}
                        onValueChange={([value]) =>
                          setHybridParams({ ...hybridParams, loadWeight: value })
                        }
                        max={100}
                        step={10}
                      />
                    </div>

                    <div>
                      <div className={t("components.modals.smartdistributionmodal.name.flex_justify_between_mb_2")}>
                        <Label>{t('modals.smartDistribution.capacityWeight')}</Label>
                        <span className={t("components.modals.smartdistributionmodal.name.text_sm_font_medium")}>
                          {hybridParams.capacityWeight}%
                        </span>
                      </div>
                      <Slider
                        value={[hybridParams.capacityWeight]}
                        onValueChange={([value]) =>
                          setHybridParams({ ...hybridParams, capacityWeight: value })
                        }
                        max={100}
                        step={10}
                      />
                    </div>

                    <div>
                      <div className={t("components.modals.smartdistributionmodal.name.flex_justify_between_mb_2")}>
                        <Label>{t('modals.smartDistribution.priorityWeight')}</Label>
                        <span className={t("components.modals.smartdistributionmodal.name.text_sm_font_medium")}>
                          {hybridParams.priorityWeight}%
                        </span>
                      </div>
                      <Slider
                        value={[hybridParams.priorityWeight]}
                        onValueChange={([value]) =>
                          setHybridParams({ ...hybridParams, priorityWeight: value })
                        }
                        max={100}
                        step={10}
                      />
                    </div>

                    <div>
                      <div className={t("components.modals.smartdistributionmodal.name.flex_justify_between_mb_2")}>
                        <Label>{t('modals.smartDistribution.productTypeWeight')}</Label>
                        <span className={t("components.modals.smartdistributionmodal.name.text_sm_font_medium")}>
                          {hybridParams.typeWeight}%
                        </span>
                      </div>
                      <Slider
                        value={[hybridParams.typeWeight]}
                        onValueChange={([value]) =>
                          setHybridParams({ ...hybridParams, typeWeight: value })
                        }
                        max={100}
                        step={10}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className={t("components.modals.smartdistributionmodal.name.space_y_4")}>
              {isPreviewLoading ? (
                <div className={t("components.modals.smartdistributionmodal.name.flex_items_center_justify_center_h_64")}>
                  <Loader2 className={t("components.modals.smartdistributionmodal.name.h_8_w_8_animate_spin")} />
                </div>{t('components.modals.SmartDistributionModal.)_:_preview?.data_?_(')}<>
                  <Alert>
                    <Info className={t("components.modals.smartdistributionmodal.name.h_4_w_4")} />
                    <AlertDescription>
                      <div className={t("components.modals.smartdistributionmodal.name.flex_items_center_justify_between")}>
                        <span>
                          {t('modals.smartDistribution.willDistribute', { orders: preview.data.totalOrders, machines: preview.data.machineCount })}
                        </span>
                        <Badge variant="outline">
                          {t('modals.smartDistribution.distributionEfficiency')}: {preview.data.efficiency}%
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className={t("components.modals.smartdistributionmodal.name.space_y_3")}>
                    {preview.data.preview?.map((machine: any) => (
                      <Card key={machine.machineId}>
                        <CardHeader className={t("components.modals.smartdistributionmodal.name.pb_3")}>
                          <div className={t("components.modals.smartdistributionmodal.name.flex_items_center_justify_between")}>
                            <CardTitle className={t("components.modals.smartdistributionmodal.name.text_sm_flex_items_center_gap_2")}>
                              <Factory className={t("components.modals.smartdistributionmodal.name.h_4_w_4")} />
                              {machine.machineNameAr || machine.machineName}
                            </CardTitle>
                            <div className={t("components.modals.smartdistributionmodal.name.flex_items_center_gap_2")}>
                              <Badge
                                className={getCapacityStatusColor(
                                  machine.newCapacityStatus
                                )}
                              >
                                {t(`modals.smartDistribution.capacityStatus.${machine.newCapacityStatus}`)}
                              </Badge>
                              <Badge variant="outline">
                                {machine.proposedOrders?.length || 0} {t('modals.smartDistribution.newOrders')}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className={t("components.modals.smartdistributionmodal.name.space_y_3")}>
                            <div className={t("components.modals.smartdistributionmodal.name.flex_items_center_justify_between_text_sm")}>
                              <span>{t('modals.smartDistribution.currentLoad')}:</span>
                              <span className={t("components.modals.smartdistributionmodal.name.font_medium")}>
                                {machine.currentLoad?.toFixed(2)} {t('units.kg')}
                              </span>
                            </div>
                            <div className={t("components.modals.smartdistributionmodal.name.flex_items_center_justify_between_text_sm")}>
                              <span>{t('modals.smartDistribution.proposedLoad')}:</span>
                              <span className={t("components.modals.smartdistributionmodal.name.font_medium")}>
                                {machine.proposedLoad?.toFixed(2)} {t('units.kg')}
                              </span>
                            </div>
                            <div className={t("components.modals.smartdistributionmodal.name.space_y_1")}>
                              <div className={t("components.modals.smartdistributionmodal.name.flex_justify_between_text_sm")}>
                                <span>{t('modals.smartDistribution.utilizationRate')}:</span>
                                <span>
                                  {machine.proposedUtilization?.toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={machine.proposedUtilization || 0}
                                className={t("components.modals.smartdistributionmodal.name.h_2")}
                                style={{
                                  backgroundColor: "#e5e5e5",
                                }}
                              >
                                <div
                                  className={`h-full transition-all ${getUtilizationColor(
                                    machine.proposedUtilization || 0
                                  )}`}
                                  style={{
                                    width: `${machine.proposedUtilization || 0}%`,
                                  }}
                                />
                              </Progress>
                            </div>
                            <div className={t("components.modals.smartdistributionmodal.name.flex_items_center_gap_2_text_sm_text_muted_foreground")}>
                              <Clock className={t("components.modals.smartdistributionmodal.name.h_3_w_3")} />
                              <span>
                                {t('modals.smartDistribution.expectedProductionTime')}:{" "}
                                {((machine.currentLoad + machine.proposedLoad) /
                                  machine.productionRate).toFixed(1)}{" "}
                                {t('units.hour')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>{t('components.modals.SmartDistributionModal.)_:_(')}<Alert>
                  <AlertTriangle className={t("components.modals.smartdistributionmodal.name.h_4_w_4")} />
                  <AlertDescription>
                    {t('modals.smartDistribution.noUnassignedOrders')}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="stats" className={t("components.modals.smartdistributionmodal.name.space_y_4")}>
              {capacityStats?.data ? (
                <div className={t("components.modals.smartdistributionmodal.name.space_y_3")}>
                  {capacityStats.data.map((stat: any) => (
                    <Card key={stat.machineId}>
                      <CardHeader className={t("components.modals.smartdistributionmodal.name.pb_3")}>
                        <div className={t("components.modals.smartdistributionmodal.name.flex_items_center_justify_between")}>
                          <CardTitle className={t("components.modals.smartdistributionmodal.name.text_sm_flex_items_center_gap_2")}>
                            <BarChart3 className={t("components.modals.smartdistributionmodal.name.h_4_w_4")} />
                            {stat.machineNameAr || stat.machineName}
                          </CardTitle>
                          <Badge
                            className={getCapacityStatusColor(stat.capacityStatus)}
                          >
                            {stat.utilizationPercentage?.toFixed(1)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className={t("components.modals.smartdistributionmodal.name.grid_grid_cols_2_gap_4_text_sm")}>
                          <div>
                            <span className={t("components.modals.smartdistributionmodal.name.text_muted_foreground")}>
                              {t('modals.smartDistribution.currentLoad')}:
                            </span>
                            <p className={t("components.modals.smartdistributionmodal.name.font_medium")}>
                              {stat.currentLoad?.toFixed(2)} {t('units.kg')}
                            </p>
                          </div>
                          <div>
                            <span className={t("components.modals.smartdistributionmodal.name.text_muted_foreground")}>
                              {t('modals.smartDistribution.maxCapacity')}:
                            </span>
                            <p className={t("components.modals.smartdistributionmodal.name.font_medium")}>
                              {stat.maxCapacity?.toFixed(2)} {t('units.kg')}
                            </p>
                          </div>
                          <div>
                            <span className={t("components.modals.smartdistributionmodal.name.text_muted_foreground")}>
                              {t('modals.smartDistribution.orderCount')}:
                            </span>
                            <p className={t("components.modals.smartdistributionmodal.name.font_medium")}>{stat.orderCount}</p>
                          </div>
                          <div>
                            <span className={t("components.modals.smartdistributionmodal.name.text_muted_foreground")}>
                              {t('modals.smartDistribution.productionRate')}:
                            </span>
                            <p className={t("components.modals.smartdistributionmodal.name.font_medium")}>
                              {stat.productionRate} {t('modals.smartDistribution.kgPerHour')}
                            </p>
                          </div>
                        </div>
                        <div className={t("components.modals.smartdistributionmodal.name.mt_3_pt_3_border_t")}>
                          <Progress
                            value={stat.utilizationPercentage || 0}
                            className={t("components.modals.smartdistributionmodal.name.h_3")}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>{t('components.modals.SmartDistributionModal.)_:_(')}<div className={t("components.modals.smartdistributionmodal.name.flex_items_center_justify_center_h_64")}>
                  <p className={t("components.modals.smartdistributionmodal.name.text_muted_foreground")}>
                    {t('modals.smartDistribution.loadingCapacityStats')}
                  </p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={distributeMutation.isPending}
            data-testid="button-cancel-distribution"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleApply}
            disabled={distributeMutation.isPending || !preview?.data?.preview?.length}
            data-testid="button-apply-distribution"
          >
            {distributeMutation.isPending ? (
              <>
                <Loader2 className={t("components.modals.smartdistributionmodal.name.mr_2_h_4_w_4_animate_spin")} />
                {t('modals.smartDistribution.applying')}
              </>{t('components.modals.SmartDistributionModal.)_:_(')}<>
                <CheckCircle className={t("components.modals.smartdistributionmodal.name.mr_2_h_4_w_4")} />
                {t('modals.smartDistribution.applyDistribution')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}