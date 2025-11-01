import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import RollCreationModalEnhanced from "../components/modals/RollCreationModalEnhanced";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatNumberAr } from "../../../shared/number-utils";
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Plus,
  Flag,
  Loader2,
  Info
} from "lucide-react";

// تعريف نوع البيانات لأمر الإنتاج النشط للعامل
interface ActiveProductionOrderDetails {
  id: number;
  production_order_number: string;
  order_id: number;
  customer_product_id: number;
  quantity_kg: string | number;
  final_quantity_kg: string | number;
  produced_quantity_kg?: string | number;
  status: string;
  created_at: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  rolls_count: number;
  total_weight_produced: string | number;
  remaining_quantity: string | number;
  is_final_roll_created: boolean;
  film_completed?: boolean;
  production_start_time?: string;
  production_end_time?: string;
  production_time_minutes?: number;
}

export default function FilmOperatorDashboard() {
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<ActiveProductionOrderDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinalRoll, setIsFinalRoll] = useState(false);

  // Fetch active production orders for operator
  const { data: productionOrders = [], isLoading } = useQuery<ActiveProductionOrderDetails[]>({
    queryKey: ["/api/production-orders/active-for-operator"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleCreateRoll = (order: ActiveProductionOrderDetails, final: boolean = false) => {
    setSelectedProductionOrder(order);
    setIsFinalRoll(final);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductionOrder(null);
    setIsFinalRoll(false);
  };

  // Calculate overall statistics
  const stats = {
    totalOrders: productionOrders.length,
    totalRequired: productionOrders.reduce((sum: number, order: ActiveProductionOrderDetails) => 
      sum + Number(order.final_quantity_kg || order.quantity_kg || 0), 0),
    totalProduced: productionOrders.reduce((sum: number, order: ActiveProductionOrderDetails) => 
      sum + Number(order.total_weight_produced || 0), 0),
    ordersNearCompletion: productionOrders.filter((order: ActiveProductionOrderDetails) => {
      const progress = (Number(order.total_weight_produced || 0) / Number(order.final_quantity_kg || 1)) * 100;
      return progress >= 80 && !order.is_final_roll_created;
    }).length,
  };

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
                <p className="text-gray-600">جاري تحميل أوامر الإنتاج...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="flex">
        <Sidebar />
        <MobileNav />

        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              لوحة عامل الفيلم
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              إدارة أوامر الإنتاج النشطة وإنشاء الرولات
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card data-testid="card-active-orders">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">الأوامر النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-active-orders">{stats.totalOrders}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">أمر إنتاج</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-required">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">الكمية المطلوبة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-required">{formatNumberAr(stats.totalRequired)}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">كيلوجرام</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-produced">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">الكمية المنتجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-produced">{formatNumberAr(stats.totalProduced)}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">كيلوجرام</p>
              </CardContent>
            </Card>

            <Card data-testid="card-near-completion">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">قريبة من الإكمال</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="stat-near-completion">
                  {stats.ordersNearCompletion}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">أمر إنتاج</p>
              </CardContent>
            </Card>
          </div>

          {/* Production Orders List */}
          {productionOrders.length === 0 ? (
            <Card className="p-8" data-testid="card-no-orders">
              <div className="text-center">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  لا توجد أوامر إنتاج نشطة
                </h3>
                <p className="text-gray-600 dark:text-gray-400" data-testid="text-no-orders">
                  لا توجد أوامر إنتاج نشطة في قسم الفيلم حالياً
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {productionOrders.map((order: ActiveProductionOrderDetails) => {
                const progress = (Number(order.total_weight_produced || 0) / Number(order.final_quantity_kg || 1)) * 100;
                const isNearCompletion = progress >= 80;
                const isComplete = order.is_final_roll_created;

                return (
                  <Card 
                    key={order.id} 
                    className={`${isComplete ? 'opacity-60' : ''} transition-all hover:shadow-lg`}
                    data-testid={`card-production-order-${order.id}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg" data-testid={`text-order-number-${order.id}`}>
                            {order.production_order_number}
                          </CardTitle>
                          <CardDescription data-testid={`text-order-ref-${order.id}`}>
                            الطلب: {order.order_number}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {isComplete && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800" data-testid={`badge-complete-${order.id}`}>
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                              مكتمل
                            </Badge>
                          )}
                          {isNearCompletion && !isComplete && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800" data-testid={`badge-near-completion-${order.id}`}>
                              <AlertTriangle className="h-3 w-3 ml-1" />
                              قريب من الإكمال
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Customer and Product Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">العميل</p>
                          <p className="font-medium" data-testid={`text-customer-${order.id}`}>{order.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">المنتج</p>
                          <p className="font-medium" data-testid={`text-product-${order.id}`}>{order.product_name}</p>
                        </div>
                      </div>

                      {/* Quantities */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">الكمية المطلوبة</span>
                          <span className="font-medium" data-testid={`text-required-qty-${order.id}`}>{formatNumberAr(Number(order.final_quantity_kg))} كجم</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">الكمية المنتجة</span>
                          <span className="font-medium" data-testid={`text-produced-qty-${order.id}`}>{formatNumberAr(Number(order.total_weight_produced))} كجم</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">الكمية المتبقية</span>
                          <span className="font-medium text-orange-600" data-testid={`text-remaining-qty-${order.id}`}>
                            {formatNumberAr(Number(order.remaining_quantity))} كجم
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">التقدم</span>
                          <span className="font-medium" data-testid={`text-progress-${order.id}`}>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" data-testid={`progress-bar-${order.id}`} />
                      </div>

                      {/* Rolls Info */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">عدد الرولات:</span>
                          <span className="font-medium" data-testid={`text-rolls-count-${order.id}`}>{order.rolls_count}</span>
                        </div>
                        {order.production_start_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">بدأ منذ:</span>
                            <span className="font-medium">
                              {(() => {
                                const startTime = new Date(order.production_start_time).getTime();
                                const now = Date.now();
                                const diffMinutes = Math.floor((now - startTime) / (1000 * 60));
                                if (diffMinutes < 60) return `${diffMinutes} دقيقة`;
                                const hours = Math.floor(diffMinutes / 60);
                                const minutes = diffMinutes % 60;
                                return `${hours}س ${minutes}د`;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {!isComplete && (
                          <>
                            <Button
                              onClick={() => handleCreateRoll(order, false)}
                              className="flex-1"
                              variant="default"
                              data-testid={`button-create-roll-${order.id}`}
                            >
                              <Plus className="h-4 w-4 ml-2" />
                              إنشاء رول جديد
                            </Button>
                            
                            {order.rolls_count > 0 && (
                              <Button
                                onClick={() => handleCreateRoll(order, true)}
                                variant="destructive"
                                data-testid={`button-final-roll-${order.id}`}
                              >
                                <Flag className="h-4 w-4 ml-2" />
                                آخر رول
                              </Button>
                            )}
                          </>
                        )}
                        
                        {isComplete && (
                          <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <div className="text-sm">
                                <p className="font-medium text-green-900 dark:text-green-100">
                                  تم إكمال مرحلة الفيلم
                                </p>
                                {order.production_time_minutes && (
                                  <p className="text-xs text-green-700 dark:text-green-300">
                                    وقت الإنتاج الكلي: {order.production_time_minutes} دقيقة
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Roll Creation Modal */}
      {selectedProductionOrder && (
        <RollCreationModalEnhanced
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          productionOrderId={selectedProductionOrder.id}
          productionOrderData={selectedProductionOrder}
          isFinalRoll={isFinalRoll}
        />
      )}
    </div>
  );
}