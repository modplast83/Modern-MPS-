import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageLayout from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatNumberAr } from "../../../shared/number-utils";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { 
  Package, 
  Printer,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Info,
  Clock
} from "lucide-react";

interface RollDetails {
  roll_id: number;
  roll_number: string;
  roll_seq: number;
  weight_kg: string | number;
  waste_kg: string | number;
  stage: string;
  roll_created_at: string;
  printed_at: string | null;
}

interface ProductionOrderWithRolls {
  production_order_id: number;
  production_order_number: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  rolls: RollDetails[];
  total_rolls: number;
  total_weight: number;
  // Product details for Printing section
  printing_cylinder?: string;
}

interface PrintingOperatorDashboardProps {
  hideLayout?: boolean;
}

export default function PrintingOperatorDashboard({ hideLayout = false }: PrintingOperatorDashboardProps) {
  const { toast } = useToast();
  const [processingRollIds, setProcessingRollIds] = useState<Set<number>>(new Set());

  const { data: productionOrders = [], isLoading } = useQuery<ProductionOrderWithRolls[]>({
    queryKey: ["/api/rolls/active-for-printing"],
    refetchInterval: 30000,
  });

  const moveToPrintingMutation = useMutation({
    mutationFn: async (rollId: number) => {
      return await apiRequest(`/api/rolls/${rollId}`, {
        method: "PATCH",
        body: JSON.stringify({ stage: "printing" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rolls/active-for-printing"] });
      toast({ title: "✓ تم بنجاح", description: "تم نقل الرول إلى مرحلة الطباعة", variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message || "فشل نقل الرول", variant: "destructive" });
    },
  });

  const handleMoveToPrinting = async (rollId: number) => {
    setProcessingRollIds(prev => new Set(prev).add(rollId));
    try {
      await moveToPrintingMutation.mutateAsync(rollId);
    } finally {
      setProcessingRollIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(rollId);
        return newSet;
      });
    }
  };

  const stats = {
    totalOrders: productionOrders.length,
    totalRolls: productionOrders.reduce((sum, order) => sum + order.total_rolls, 0),
    totalWeight: productionOrders.reduce((sum, order) => sum + order.total_weight, 0),
  };

  if (isLoading) {
    const loadingContent = (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 text-lg">جاري تحميل رولات الطباعة...</p>
        </div>
      </div>
    );

    if (hideLayout) {
      return loadingContent;
    }

    return (
      <PageLayout title="لوحة عامل الطباعة" description="إدارة رولات الطباعة ونقلها إلى التقطيع">
        {loadingContent}
      </PageLayout>
    );
  }

  const mainContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card data-testid="card-active-orders">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">الأوامر النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-active-orders">{stats.totalOrders}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">أمر إنتاج</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-rolls">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">إجمالي الرولات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-rolls">{stats.totalRolls}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">رول</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-weight">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">إجمالي الوزن</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-weight">{formatNumberAr(stats.totalWeight)}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">كيلوجرام</p>
              </CardContent>
            </Card>
          </div>

          {productionOrders.length === 0 ? (
            <Card className="p-8" data-testid="card-no-rolls">
              <div className="text-center">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  لا توجد رولات في مرحلة الطباعة
                </h3>
                <p className="text-gray-600 dark:text-gray-400" data-testid="text-no-rolls">
                  لا توجد رولات جاهزة للطباعة حالياً
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {productionOrders.map((order) => {
                const completedRolls = order.rolls.filter(r => r.printed_at).length;
                const progress = order.total_rolls > 0 ? (completedRolls / order.total_rolls) * 100 : 0;

                return (
                  <Card 
                    key={order.production_order_id} 
                    className="transition-all hover:shadow-lg"
                    data-testid={`card-production-order-${order.production_order_id}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg" data-testid={`text-order-number-${order.production_order_id}`}>
                            {order.production_order_number}
                          </CardTitle>
                          <CardDescription data-testid={`text-order-ref-${order.production_order_id}`}>
                            الطلب: {order.order_number}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Printer className="h-3 w-3 ml-1" />
                          {order.total_rolls} رول
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">العميل</p>
                          <p className="font-medium" data-testid={`text-customer-${order.production_order_id}`}>{order.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">المنتج</p>
                          <p className="font-medium" data-testid={`text-product-${order.production_order_id}`}>{order.product_name}</p>
                        </div>
                      </div>

                      {/* Product Details for Printing */}
                      {order.printing_cylinder && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm">
                          <p className="text-gray-500 dark:text-gray-400">مقاس السلندر</p>
                          <p className="font-medium" data-testid={`text-printing-cylinder-${order.production_order_id}`}>{order.printing_cylinder}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">التقدم</span>
                          <span className="font-medium" data-testid={`text-progress-${order.production_order_id}`}>
                            {completedRolls} / {order.total_rolls} رول
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" data-testid={`progress-bar-${order.production_order_id}`} />
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">الوزن الإجمالي:</span>
                        <span className="font-medium">{formatNumberAr(order.total_weight)} كجم</span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">الرولات المتاحة:</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {order.rolls.map((roll) => (
                            <div 
                              key={roll.roll_id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                              data-testid={`roll-item-${roll.roll_id}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm" data-testid={`text-roll-number-${roll.roll_id}`}>
                                    {roll.roll_number}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  الوزن: {formatNumberAr(Number(roll.weight_kg))} كجم
                                </div>
                              </div>
                              
                              <Button
                                onClick={() => handleMoveToPrinting(roll.roll_id)}
                                disabled={processingRollIds.has(roll.roll_id)}
                                size="sm"
                                data-testid={`button-move-to-printing-${roll.roll_id}`}
                              >
                                {processingRollIds.has(roll.roll_id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Printer className="h-4 w-4 ml-1" />
                                    <span className="hidden sm:inline">طباعة</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      );
  

  if (hideLayout) {
    return mainContent;
  }

  return (
    <PageLayout title="لوحة عامل الطباعة" description="إدارة رولات الطباعة ونقلها إلى التقطيع">
      {mainContent}
    </PageLayout>
  );
}
