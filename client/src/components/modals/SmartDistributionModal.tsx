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
    icon: <Scale className="h-5 w-5" />,
    color: "bg-blue-100 border-blue-300",
  },
  {
    id: "load-based",
    name: "Load-Based Distribution",
    nameAr: "التوزيع حسب الحمولة",
    description: "توزيع الأوامر حسب الكمية الإجمالية والسعة المتاحة",
    icon: <Weight className="h-5 w-5" />,
    color: "bg-green-100 border-green-300",
  },
  {
    id: "priority",
    name: "Priority Distribution",
    nameAr: "التوزيع حسب الأولوية",
    description: "توزيع الأوامر العاجلة أولاً على المكائن الأقل حملاً",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "bg-red-100 border-red-300",
  },
  {
    id: "product-type",
    name: "Product Type Grouping",
    nameAr: "التوزيع حسب نوع المنتج",
    description: "تجميع المنتجات المشابهة على نفس الماكينة",
    icon: <Layers className="h-5 w-5" />,
    color: "bg-purple-100 border-purple-300",
  },
  {
    id: "hybrid",
    name: "Hybrid Optimization",
    nameAr: "التوزيع الهجين",
    description: "مزج جميع المعايير للحصول على أفضل توزيع",
    icon: <Zap className="h-5 w-5" />,
    color: "bg-orange-100 border-orange-300",
  },
];

export default function SmartDistributionModal({
  isOpen,
  onClose,
  onDistribute,
}: SmartDistributionModalProps) {
  const { toast } = useToast();
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
          title: "تم التوزيع بنجاح",
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
        title: "خطأ في التوزيع",
        description: error.message || "فشل تطبيق التوزيع الذكي",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-purple-600" />
            التوزيع الذكي لأوامر الإنتاج
          </DialogTitle>
          <DialogDescription>
            اختر خوارزمية التوزيع المناسبة وعاين النتائج قبل التطبيق
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="algorithm" className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="algorithm" data-testid="tab-algorithm">اختيار الخوارزمية</TabsTrigger>
            <TabsTrigger value="preview" data-testid="tab-preview">معاينة التوزيع</TabsTrigger>
            <TabsTrigger value="stats" data-testid="tab-stats">إحصائيات السعة</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 h-[500px] mt-4">
            <TabsContent value="algorithm" className="space-y-4">
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
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={algo.id} id={algo.id} data-testid={`radio-algorithm-${algo.id}`} />
                        <div className="flex-1">
                          <Label
                            htmlFor={algo.id}
                            className="flex items-center gap-2 text-base font-semibold cursor-pointer"
                          >
                            {algo.icon}
                            {algo.nameAr}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {algo.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>

              {selectedAlgorithm === "hybrid" && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">معايير التوزيع الهجين</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>وزن الحمولة</Label>
                        <span className="text-sm font-medium">
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
                      <div className="flex justify-between mb-2">
                        <Label>وزن السعة</Label>
                        <span className="text-sm font-medium">
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
                      <div className="flex justify-between mb-2">
                        <Label>وزن الأولوية</Label>
                        <span className="text-sm font-medium">
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
                      <div className="flex justify-between mb-2">
                        <Label>وزن نوع المنتج</Label>
                        <span className="text-sm font-medium">
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

            <TabsContent value="preview" className="space-y-4">
              {isPreviewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : preview?.data ? (
                <>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>
                          سيتم توزيع {preview.data.totalOrders} أمر على{" "}
                          {preview.data.machineCount} ماكينة
                        </span>
                        <Badge variant="outline">
                          كفاءة التوزيع: {preview.data.efficiency}%
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {preview.data.preview?.map((machine: any) => (
                      <Card key={machine.machineId}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Factory className="h-4 w-4" />
                              {machine.machineNameAr || machine.machineName}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getCapacityStatusColor(
                                  machine.newCapacityStatus
                                )}
                              >
                                {machine.newCapacityStatus === "low"
                                  ? "منخفض"
                                  : machine.newCapacityStatus === "moderate"
                                  ? "متوسط"
                                  : machine.newCapacityStatus === "high"
                                  ? "مرتفع"
                                  : "مُحمل بشدة"}
                              </Badge>
                              <Badge variant="outline">
                                {machine.proposedOrders?.length || 0} أمر جديد
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span>الحمولة الحالية:</span>
                              <span className="font-medium">
                                {machine.currentLoad?.toFixed(2)} كجم
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>الحمولة المقترحة:</span>
                              <span className="font-medium">
                                {machine.proposedLoad?.toFixed(2)} كجم
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>نسبة الاستخدام:</span>
                                <span>
                                  {machine.proposedUtilization?.toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={machine.proposedUtilization || 0}
                                className="h-2"
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
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                وقت الإنتاج المتوقع:{" "}
                                {((machine.currentLoad + machine.proposedLoad) /
                                  machine.productionRate).toFixed(1)}{" "}
                                ساعة
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    لا توجد أوامر غير مخصصة للتوزيع
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {capacityStats?.data ? (
                <div className="space-y-3">
                  {capacityStats.data.map((stat: any) => (
                    <Card key={stat.machineId}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
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
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              الحمولة الحالية:
                            </span>
                            <p className="font-medium">
                              {stat.currentLoad?.toFixed(2)} كجم
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              السعة القصوى:
                            </span>
                            <p className="font-medium">
                              {stat.maxCapacity?.toFixed(2)} كجم
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              عدد الأوامر:
                            </span>
                            <p className="font-medium">{stat.orderCount}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              معدل الإنتاج:
                            </span>
                            <p className="font-medium">
                              {stat.productionRate} كجم/ساعة
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <Progress
                            value={stat.utilizationPercentage || 0}
                            className="h-3"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">
                    جاري تحميل إحصائيات السعة...
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
            إلغاء
          </Button>
          <Button
            onClick={handleApply}
            disabled={distributeMutation.isPending || !preview?.data?.preview?.length}
            data-testid="button-apply-distribution"
          >
            {distributeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التطبيق...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                تطبيق التوزيع
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}