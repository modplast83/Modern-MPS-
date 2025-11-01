import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { formatWeight } from "../lib/formatNumber";
import { queryClient, apiRequest } from "../lib/queryClient";
import { toastMessages } from "../lib/toastMessages";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Printer,
  ChevronDown,
  ChevronRight,
  Clock,
  Package,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Hash,
  Calendar,
  Weight,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Roll {
  id: number;
  roll_number: string;
  roll_seq: number;
  weight_kg: number;
  stage: string;
  production_order_id: number;
  created_at: string;
  is_priority?: boolean;
  qr_code_text?: string;
}

interface ProductionOrder {
  id: number;
  production_order_number: string;
  quantity_kg: number;
  final_quantity_kg: number;
  produced_quantity_kg: number;
  printed_quantity_kg: number;
  printing_completion_percentage: number;
  rolls: Roll[];
  order_number: string;
  customer_name: string;
  customer_name_ar: string;
  item_name: string;
  item_name_ar: string;
  size_caption: string;
}

interface PrintingStats {
  todayPrintedCount: number;
  hourlyRate: number;
  pendingRolls: number;
  completedOrders: number;
}

export default function PrintingOperatorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [confirmPrintDialog, setConfirmPrintDialog] = useState<{
    isOpen: boolean;
    roll?: Roll;
    orderNumber?: string;
  }>({ isOpen: false });

  // جلب الرولات الجاهزة للطباعة حسب القسم
  const { data: printingQueue = [], isLoading } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/rolls/printing-queue-by-section"],
    refetchInterval: 30000, // تحديث كل 30 ثانية
    staleTime: 10000,
  });

  // جلب إحصائيات الطباعة
  const { data: stats = {} as PrintingStats } = useQuery<PrintingStats>({
    queryKey: ["/api/printing/stats"],
    refetchInterval: 60000, // تحديث كل دقيقة
  });

  // mutation لتأكيد الطباعة
  const markPrintedMutation = useMutation({
    mutationFn: async (rollId: number) => {
      return apiRequest(`/api/rolls/${rollId}/mark-printed`, {
        method: "POST",
      });
    },
    onSuccess: (data, rollId) => {
      const rollNumber = confirmPrintDialog.roll?.roll_number || `#${rollId}`;
      const message = toastMessages.rolls.printed(rollNumber);
      toast({
        title: message.title,
        description: message.description,
      });
      
      // تحديث البيانات
      queryClient.invalidateQueries({ queryKey: ["/api/rolls/printing-queue-by-section"] });
      queryClient.invalidateQueries({ queryKey: ["/api/printing/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      
      // إغلاق النافذة
      setConfirmPrintDialog({ isOpen: false });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ خطأ في الطباعة",
        description: error.message || toastMessages.rolls.errors.printing,
        variant: "destructive",
      });
    },
  });

  // حساب نسبة الإنجاز
  const calculateProgress = (order: ProductionOrder) => {
    const totalWeight = parseFloat(order.final_quantity_kg?.toString() || "0");
    const printedWeight = parseFloat(order.printed_quantity_kg?.toString() || "0");
    return totalWeight > 0 ? (printedWeight / totalWeight) * 100 : 0;
  };

  // تبديل حالة توسيع أمر الإنتاج
  const toggleOrderExpanded = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // فتح نافذة تأكيد الطباعة
  const handlePrintClick = (roll: Roll, orderNumber: string) => {
    setConfirmPrintDialog({
      isOpen: true,
      roll,
      orderNumber,
    });
  };

  // تأكيد الطباعة
  const handleConfirmPrint = () => {
    if (confirmPrintDialog.roll) {
      markPrintedMutation.mutate(confirmPrintDialog.roll.id);
    }
  };

  // حساب العدد الإجمالي للرولات الجاهزة
  const totalPendingRolls = printingQueue.reduce(
    (total, order) => total + (order.rolls?.length || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* رأس الصفحة مع الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-pending-rolls">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              رولات بانتظار الطباعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold" data-testid="stat-pending-rolls">{totalPendingRolls}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-printed-today">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              مطبوع اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold" data-testid="stat-printed-today">{stats.todayPrintedCount || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-hourly-rate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              معدل الإنتاج (رول/ساعة)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold" data-testid="stat-hourly-rate">{stats.hourlyRate?.toFixed(1) || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-orders">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              أوامر مكتملة اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold" data-testid="stat-completed-orders">{stats.completedOrders || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة أوامر الإنتاج */}
      <Card>
        <CardHeader>
          <CardTitle>أوامر الإنتاج الجاهزة للطباعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {printingQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>لا توجد رولات جاهزة للطباعة حالياً</p>
            </div>
          ) : (
            printingQueue.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-primary" data-testid={`card-order-${order.id}`}>
                <Collapsible
                  open={expandedOrders.has(order.id)}
                  onOpenChange={() => toggleOrderExpanded(order.id)}
                >
                  <CollapsibleTrigger className="w-full" data-testid={`trigger-expand-${order.id}`}>
                    <div className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedOrders.has(order.id) ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">
                                {order.production_order_number}
                              </span>
                              <Badge variant="outline">{order.order_number}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {order.customer_name_ar || order.customer_name}
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm font-medium">
                                {order.item_name_ar || order.item_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.size_caption}
                              </p>
                            </div>
                            <div className="text-center">
                              <Badge variant="secondary" className="mb-1">
                                {order.rolls?.length || 0} رول
                              </Badge>
                              <Progress
                                value={calculateProgress(order)}
                                className="w-24 h-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {calculateProgress(order).toFixed(0)}% مكتمل
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t px-4 py-3">
                      <div className="space-y-2">
                        {order.rolls?.map((roll) => (
                          <div
                            key={roll.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              roll.is_priority
                                ? "border-orange-300 bg-orange-50"
                                : "border-gray-200 bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {roll.is_priority && (
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                              )}
                              <div className="flex items-center gap-3">
                                <div className="text-center">
                                  <Hash className="h-4 w-4 text-muted-foreground mx-auto" />
                                  <span className="text-sm font-mono">
                                    {roll.roll_seq}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{roll.roll_number}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <Weight className="h-3 w-3" />
                                      {formatWeight(roll.weight_kg)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(roll.created_at), "dd/MM HH:mm", {
                                        locale: ar,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => handlePrintClick(roll, order.order_number)}
                              disabled={markPrintedMutation.isPending}
                              className="gap-2"
                              data-testid={`button-print-roll-${roll.id}`}
                            >
                              <Printer className="h-4 w-4" />
                              طباعة
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* نافذة تأكيد الطباعة */}
      <Dialog
        open={confirmPrintDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmPrintDialog({ isOpen: false });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد طباعة الرول</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>هل تريد تأكيد طباعة الرول التالي؟</p>
            {confirmPrintDialog.roll && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <p>
                  <span className="font-medium">رقم الرول:</span>{" "}
                  {confirmPrintDialog.roll.roll_number}
                </p>
                <p>
                  <span className="font-medium">الوزن:</span>{" "}
                  {formatWeight(confirmPrintDialog.roll.weight_kg)}
                </p>
                <p>
                  <span className="font-medium">رقم الطلب:</span>{" "}
                  {confirmPrintDialog.orderNumber}
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              سيتم تسجيل وقت الطباعة والعامل المسؤول تلقائياً
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmPrintDialog({ isOpen: false })}
              disabled={markPrintedMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmPrint}
              disabled={markPrintedMutation.isPending}
              className="gap-2"
              data-testid="button-confirm-print"
            >
              {markPrintedMutation.isPending ? (
                <>جاري التأكيد...</>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  تأكيد الطباعة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}