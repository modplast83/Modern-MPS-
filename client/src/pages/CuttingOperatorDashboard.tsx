import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { toastMessages } from "../lib/toastMessages";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Skeleton } from "../components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Scissors,
  Package,
  AlertCircle,
  TrendingDown,
  Activity,
  Clock,
  User,
  ChevronRight,
  BarChart3,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Roll {
  id: number;
  roll_number: string;
  production_order_id: number;
  weight_kg: string;
  cut_weight_total_kg?: string;
  waste_kg?: string;
  stage: string;
  printed_at?: string;
  cut_completed_at?: string;
  printed_by?: number;
  cut_by?: number;
  production_order?: {
    id: number;
    production_order_number: string;
    customer_product?: {
      product_name: string;
      product_code: string;
      customer?: {
        name_ar: string;
      };
    };
    quantity_kg: string;
    final_quantity_kg: string;
    net_quantity_kg: string;
    waste_quantity_kg: string;
  };
}

interface CuttingQueueResponse {
  rolls: Roll[];
  stats: {
    totalRolls: number;
    totalWeight: number;
    todayWaste: number;
    todayWastePercentage: number;
    averageWastePercentage: number;
  };
}

interface WasteStats {
  totalWaste: number;
  wastePercentage: number;
  operatorStats: {
    operatorId: number;
    operatorName: string;
    rollsCut: number;
    totalWaste: number;
    averageWastePercentage: number;
  }[];
  dailyStats: {
    date: string;
    totalWaste: number;
    wastePercentage: number;
    rollsCount: number;
  }[];
}

interface CompleteCuttingResponse {
  waste_percentage: number;
}

export default function CuttingOperatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRoll, setSelectedRoll] = useState<Roll | null>(null);
  const [netWeight, setNetWeight] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // جلب قائمة الرولات الجاهزة للتقطيع
  const { data: cuttingData, isLoading } = useQuery<CuttingQueueResponse>({
    queryKey: ["/api/rolls/cutting-queue-by-section"],
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // جلب إحصائيات الهدر لأمر إنتاج محدد
  const { data: wasteStats, isLoading: loadingStats } = useQuery<WasteStats>({
    queryKey: [`/api/production-orders/${selectedOrderId}/waste-stats`],
    enabled: !!selectedOrderId,
  });

  // إكمال التقطيع
  const completeCuttingMutation = useMutation({
    mutationFn: async (data: { rollId: number; netWeight: number }) => {
      const response = await apiRequest(`/api/rolls/${data.rollId}/complete-cutting`, {
        method: "POST",
        body: JSON.stringify({ net_weight: data.netWeight }),
      });
      return response.json() as Promise<CompleteCuttingResponse>;
    },
    onSuccess: (data, variables) => {
      const rollNumber = selectedRoll?.roll_number || `#${variables.rollId}`;
      const netWeightDisplay = variables.netWeight.toFixed(2);
      const message = toastMessages.rolls.cut(rollNumber, netWeightDisplay);
      
      const isHighWaste = data.waste_percentage > 15;
      toast({
        title: isHighWaste ? "⚠️ تم التقطيع مع هدر عالي" : message.title,
        description: isHighWaste 
          ? `${message.description} - نسبة الهدر: ${data.waste_percentage.toFixed(2)}% (عالية!)`
          : `${message.description} - نسبة الهدر: ${data.waste_percentage.toFixed(2)}%`,
      });

      // تحديث البيانات
      queryClient.invalidateQueries({ 
        queryKey: ["/api/rolls/cutting-queue-by-section"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/production/cutting-queue"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/production-orders"] 
      });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/production-orders/${selectedOrderId}/waste-stats`] 
        });
      }

      // إغلاق النافذة وإعادة تعيين القيم
      setShowDialog(false);
      setSelectedRoll(null);
      setNetWeight("");
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ في التقطيع",
        description: error.message || toastMessages.rolls.errors.cutting,
        variant: "destructive",
      });
    },
  });

  // تجميع الرولات حسب أمر الإنتاج
  const groupedRolls = cuttingData?.rolls.reduce((acc, roll) => {
    const orderId = roll.production_order_id;
    if (!acc[orderId]) {
      acc[orderId] = {
        production_order: roll.production_order!,
        rolls: [],
      };
    }
    acc[orderId].rolls.push(roll);
    return acc;
  }, {} as Record<number, { production_order: any; rolls: Roll[] }>);

  const handleOpenCuttingDialog = (roll: Roll) => {
    setSelectedRoll(roll);
    setNetWeight("");
    setShowDialog(true);
  };

  const handleCompleteCutting = () => {
    if (!selectedRoll || !netWeight) return;

    const netWeightNum = parseFloat(netWeight);
    const grossWeight = parseFloat(selectedRoll.weight_kg);

    if (netWeightNum <= 0) {
      toast({
        title: "❌ خطأ في الوزن",
        description: "الوزن الصافي يجب أن يكون أكبر من صفر",
        variant: "destructive",
      });
      return;
    }

    if (netWeightNum >= grossWeight) {
      toast({
        title: "❌ خطأ في الوزن",
        description: `الوزن الصافي (${netWeightNum} كجم) يجب أن يكون أقل من الوزن الخام (${grossWeight} كجم)`,
        variant: "destructive",
      });
      return;
    }

    const wastePercentage = ((grossWeight - netWeightNum) / grossWeight) * 100;

    // عرض تحذير إذا كانت نسبة الهدر عالية
    if (wastePercentage > 15) {
      const confirmCutting = window.confirm(
        `نسبة الهدر عالية (${wastePercentage.toFixed(2)}%)!\nهل تريد المتابعة؟`
      );
      if (!confirmCutting) return;
    }

    completeCuttingMutation.mutate({
      rollId: selectedRoll.id,
      netWeight: netWeightNum,
    });
  };

  const calculateWaste = () => {
    if (!selectedRoll || !netWeight) return null;

    const netWeightNum = parseFloat(netWeight);
    const grossWeight = parseFloat(selectedRoll.weight_kg);

    if (isNaN(netWeightNum) || isNaN(grossWeight)) return null;

    const waste = grossWeight - netWeightNum;
    const wastePercentage = (waste / grossWeight) * 100;

    return {
      waste: waste.toFixed(2),
      percentage: wastePercentage.toFixed(2),
      isHigh: wastePercentage > 15,
    };
  };

  const wasteInfo = calculateWaste();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <MobileNav />
          <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600">جاري تحميل طابور التقطيع...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          <div className="space-y-6">
            {/* رأس الصفحة */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            لوحة عامل التقطيع
          </h1>
          <p className="text-gray-600">
            إدخال الأوزان الصافية وحساب الهدر للرولات المطبوعة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <User className="h-3 w-3 ml-1" />
            {user?.display_name_ar || user?.display_name}
          </Badge>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      {cuttingData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-waiting-rolls">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                الرولات المنتظرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-waiting-rolls">{cuttingData.stats.totalRolls}</div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-weight">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                إجمالي الوزن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-weight">
                {cuttingData.stats.totalWeight.toFixed(2)} كجم
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-today-waste">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                هدر اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="stat-today-waste">
                {cuttingData.stats.todayWaste.toFixed(2)} كجم
              </div>
              <p className="text-sm text-gray-500" data-testid="stat-today-waste-percent">
                {cuttingData.stats.todayWastePercentage.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-average-waste">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                متوسط الهدر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-average-waste">
                {cuttingData.stats.averageWastePercentage.toFixed(2)}%
              </div>
              {cuttingData.stats.averageWastePercentage > 10 && (
                <Badge variant="destructive" className="mt-1" data-testid="badge-high-waste">
                  <AlertCircle className="h-3 w-3 ml-1" />
                  فوق المعدل
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* قائمة الرولات مجمعة حسب أمر الإنتاج */}
      {groupedRolls && Object.keys(groupedRolls).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>الرولات الجاهزة للتقطيع</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(groupedRolls).map(([orderId, group]) => (
                <AccordionItem key={orderId} value={orderId}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pl-4">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">
                          أمر الإنتاج: {group.production_order.production_order_number}
                        </span>
                        <Badge variant="outline">
                          {group.production_order.customer_product?.product_name}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {group.production_order.customer_product?.customer?.name_ar}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge>{group.rolls.length} رول</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(Number(orderId));
                            setShowStatsDialog(true);
                          }}
                          data-testid={`button-stats-${orderId}`}
                        >
                          <BarChart3 className="h-4 w-4" />
                          إحصائيات
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-4">
                      {group.rolls.map((roll) => (
                        <div
                          key={roll.id}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Package className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="font-medium">{roll.roll_number}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>الوزن: {roll.weight_kg} كجم</span>
                                {roll.printed_at && (
                                  <span>
                                    طُبع: {format(new Date(roll.printed_at), "dd/MM HH:mm", { locale: ar })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleOpenCuttingDialog(roll)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-cut-${roll.id}`}
                          >
                            <Scissors className="h-4 w-4 ml-2" />
                            بدء التقطيع
                          </Button>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد رولات جاهزة للتقطيع حالياً</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نافذة إدخال الوزن الصافي */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إدخال الوزن الصافي للرول</DialogTitle>
          </DialogHeader>
          {selectedRoll && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">رقم الرول</Label>
                  <p className="font-medium">{selectedRoll.roll_number}</p>
                </div>
                <div>
                  <Label className="text-gray-500">الوزن الخام</Label>
                  <p className="font-medium">{selectedRoll.weight_kg} كجم</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500">المنتج</Label>
                  <p className="font-medium">
                    {selectedRoll.production_order?.customer_product?.product_name}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="netWeight">الوزن الصافي (كجم)</Label>
                <Input
                  id="netWeight"
                  type="number"
                  step="0.01"
                  value={netWeight}
                  onChange={(e) => setNetWeight(e.target.value)}
                  placeholder="أدخل الوزن الصافي بعد التقطيع"
                  className="text-lg"
                  data-testid="input-net-weight"
                />
              </div>

              {wasteInfo && (
                <Alert className={wasteInfo.isHigh ? "border-orange-500" : ""}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>الهدر: {wasteInfo.waste} كجم</p>
                      <p className={wasteInfo.isHigh ? "text-orange-600 font-semibold" : ""}>
                        نسبة الهدر: {wasteInfo.percentage}%
                        {wasteInfo.isHigh && " (مرتفع!)"}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              data-testid="button-cancel-cutting"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCompleteCutting}
              disabled={!netWeight || completeCuttingMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-cutting"
            >
              {completeCuttingMutation.isPending ? (
                <>جاري الحفظ...</>
              ) : (
                <>
                  <Scissors className="h-4 w-4 ml-2" />
                  تأكيد التقطيع
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة الإحصائيات */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>إحصائيات الهدر</DialogTitle>
          </DialogHeader>
          {loadingStats ? (
            <div className="py-8">
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : wasteStats ? (
            <div className="space-y-6 py-4">
              {/* إحصائيات عامة */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">إجمالي الهدر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">
                      {wasteStats.totalWaste.toFixed(2)} كجم
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">نسبة الهدر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {wasteStats.wastePercentage.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* إحصائيات العاملين */}
              {wasteStats.operatorStats.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">أداء العاملين</h3>
                  <div className="space-y-2">
                    {wasteStats.operatorStats.map((stat: WasteStats['operatorStats'][0]) => (
                      <div
                        key={stat.operatorId}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium">{stat.operatorName}</p>
                          <p className="text-sm text-gray-500">
                            {stat.rollsCut} رول
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">
                            {stat.averageWastePercentage.toFixed(2)}%
                          </p>
                          <p className="text-sm text-gray-500">
                            {stat.totalWaste.toFixed(2)} كجم
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* الإحصائيات اليومية */}
              {wasteStats.dailyStats.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">الهدر اليومي</h3>
                  <div className="space-y-2">
                    {wasteStats.dailyStats.slice(0, 7).map((stat: WasteStats['dailyStats'][0]) => (
                      <div
                        key={stat.date}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium">
                            {format(new Date(stat.date), "dd MMMM", { locale: ar })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {stat.rollsCount} رول
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">
                            {stat.wastePercentage.toFixed(2)}%
                          </p>
                          <p className="text-sm text-gray-500">
                            {stat.totalWaste.toFixed(2)} كجم
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">
              لا توجد إحصائيات متاحة
            </p>
          )}
          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)} variant="outline">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}