import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import PageLayout from "../components/layout/PageLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Loader2, Play, Settings, BarChart3, Printer } from "lucide-react";
import ProductionOrderActivationModal from "../components/production/ProductionOrderActivationModal";
import ProductionOrderStatsCard from "../components/production/ProductionOrderStatsCard";
import ProductionOrderFilters from "../components/production/ProductionOrderFilters";
import ProductionOrderPrintTemplate from "../components/production/ProductionOrderPrintTemplate";
import { toastMessages } from "../lib/toastMessages";
import { IconWithTooltip } from "../components/ui/icon-with-tooltip";

export default function ProductionOrdersManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [showStats, setShowStats] = useState<number | null>(null);
  const [printingProductionOrder, setPrintingProductionOrder] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: "all",
    customerId: "",
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
  });

  // جلب أوامر الإنتاج مع التفاصيل
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/production-orders/management"],
    queryFn: async () => {
      const response = await fetch("/api/production-orders/management");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطأ في جلب أوامر الإنتاج");
      }
      return response.json();
    },
  });

  // جلب المكائن
  const { data: machines = [] } = useQuery({
    queryKey: ["/api/machines"],
    queryFn: async () => {
      const response = await fetch("/api/machines");
      if (!response.ok) throw new Error("فشل في جلب المكائن");
      return response.json();
    },
  });

  // جلب المستخدمين
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("فشل في جلب المستخدمين");
      const result = await response.json();
      return result.data || result;
    },
  });

  // تفعيل أمر الإنتاج
  const activateMutation = useMutation({
    mutationFn: async ({ id, machineId, operatorId }: any) => {
      const response = await apiRequest(`/api/production-orders/${id}/activate`, {
        method: "PATCH",
        body: JSON.stringify({ machineId, operatorId }),
      });
      return response;
    },
    onSuccess: (data, variables) => {
      const orderNumber = selectedOrder?.production_order_number || `#${variables.id}`;
      const message = toastMessages.productionOrders.activated(orderNumber);
      toast({
        title: message.title,
        description: message.description,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders/management"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-queues"] });
      setIsActivationModalOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ في التفعيل",
        description: error.message || toastMessages.productionOrders.errors.activation,
        variant: "destructive",
      });
    },
  });

  // تحديث التخصيص
  const assignMutation = useMutation({
    mutationFn: async ({ id, machineId, operatorId }: any) => {
      const response = await apiRequest(`/api/production-orders/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ machineId, operatorId }),
      });
      return response;
    },
    onSuccess: (data, variables) => {
      const orderNumber = selectedOrder?.production_order_number || `#${variables.id}`;
      const message = toastMessages.productionOrders.assigned(orderNumber);
      toast({
        title: message.title,
        description: message.description,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders/management"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-queues"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ في التخصيص",
        description: error.message || toastMessages.productionOrders.errors.assignment,
        variant: "destructive",
      });
    },
  });

  // معالج الطباعة
  const handlePrintProductionOrder = (order: any) => {
    setPrintingProductionOrder(order);
  };

  const handleActivate = (order: any) => {
    setSelectedOrder(order);
    setIsActivationModalOpen(true);
  };

  const handleActivationConfirm = (machineId?: string, operatorId?: number) => {
    if (selectedOrder) {
      activateMutation.mutate({
        id: selectedOrder.id,
        machineId,
        operatorId,
      });
    }
  };

  // فلترة الأوامر
  const filteredOrders = ordersData?.data?.filter((order: any) => {
    // فلتر الحالة
    if (filters.status !== "all" && order.status !== filters.status) {
      return false;
    }

    // فلتر العميل
    if (filters.customerId && order.customer_id !== filters.customerId) {
      return false;
    }

    // فلتر البحث
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        order.production_order_number?.toLowerCase().includes(searchLower) ||
        order.order_number?.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.customer_name_ar?.toLowerCase().includes(searchLower) ||
        order.size_caption?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // فلتر التاريخ
    if (filters.dateFrom) {
      const orderDate = new Date(order.created_at);
      const fromDate = new Date(filters.dateFrom);
      if (orderDate < fromDate) return false;
    }

    if (filters.dateTo) {
      const orderDate = new Date(order.created_at);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (orderDate > toDate) return false;
    }

    return true;
  }) || [];

  // دالة عرض الحالة
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            ⏳ انتظار
          </Badge>
        );
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            ▶️ نشط
          </Badge>
        );
      case "in_production":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            🔄 قيد الإنتاج
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            ✅ مكتمل
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800">
            ❌ ملغي
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // دالة عرض التخصيص
  const getAssignmentBadges = (order: any) => {
    const badges = [];
    if (order.assigned_machine_id) {
      badges.push(
        <Badge key="machine" variant="secondary" className="mr-1">
          🏭 {order.machine_name_ar || order.machine_name || order.assigned_machine_id}
        </Badge>
      );
    }
    if (order.assigned_operator_id) {
      badges.push(
        <Badge key="operator" variant="secondary">
          👷 {order.operator_name_ar || order.operator_name || `عامل #${order.assigned_operator_id}`}
        </Badge>
      );
    }
    return badges;
  };

  // حساب الإحصائيات الإجمالية
  const totalStats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter((o: any) => o.status === "pending").length,
    active: filteredOrders.filter((o: any) => o.status === "active").length,
    completed: filteredOrders.filter((o: any) => o.status === "completed").length,
  };

  if (ordersLoading) {
    return (
      <PageLayout title="إدارة أوامر الإنتاج" description="مراقبة وإدارة جميع أوامر الإنتاج وتحويلها للإنتاج">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="إدارة أوامر الإنتاج" description="مراقبة وإدارة جميع أوامر الإنتاج وتحويلها للإنتاج">
      {/* الإحصائيات الإجمالية */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4" data-testid="card-total-orders">
              <div className="text-sm text-gray-600">إجمالي الأوامر</div>
              <div className="text-2xl font-bold" data-testid="stat-total-orders">{totalStats.total}</div>
            </Card>
            <Card className="p-4" data-testid="card-pending-orders">
              <div className="text-sm text-gray-600">في الانتظار</div>
              <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-orders">{totalStats.pending}</div>
            </Card>
            <Card className="p-4" data-testid="card-active-orders">
              <div className="text-sm text-gray-600">نشطة</div>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-active-orders">{totalStats.active}</div>
            </Card>
            <Card className="p-4" data-testid="card-completed-orders">
              <div className="text-sm text-gray-600">مكتملة</div>
              <div className="text-2xl font-bold text-gray-600" data-testid="stat-completed-orders">{totalStats.completed}</div>
            </Card>
          </div>

          {/* الفلاتر */}
          <ProductionOrderFilters
            filters={filters}
            onFiltersChange={setFilters}
            customers={Array.from(new Map(filteredOrders.map((o: any) => [o.customer_id, { id: o.customer_id, name_ar: o.customer_name_ar, name: o.customer_name }])).values())}
          />

          {/* جدول أوامر الإنتاج */}
          <Card data-testid="card-production-orders-table">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-order-number">رقم الطلب</TableHead>
                    <TableHead data-testid="header-production-order">رقم أمر الإنتاج</TableHead>
                    <TableHead data-testid="header-customer">العميل</TableHead>
                    <TableHead data-testid="header-product">المنتج</TableHead>
                    <TableHead className="text-center" data-testid="header-quantity">الكمية (كجم)</TableHead>
                    <TableHead className="text-center" data-testid="header-status">الحالة</TableHead>
                    <TableHead data-testid="header-assignment">التخصيص</TableHead>
                    <TableHead className="text-center" data-testid="header-actions">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8" data-testid="text-no-orders">
                        لا توجد أوامر إنتاج
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order: any) => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-medium" data-testid={`cell-order-number-${order.id}`}>
                          {order.order_number}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`cell-production-order-${order.id}`}>
                          {order.production_order_number}
                        </TableCell>
                        <TableCell data-testid={`cell-customer-${order.id}`}>
                          {order.customer_name_ar || order.customer_name}
                        </TableCell>
                        <TableCell data-testid={`cell-product-${order.id}`}>
                          <div className="text-sm">
                            {order.size_caption}
                            {order.is_printed && (
                              <Badge variant="outline" className="mr-1 text-xs" data-testid={`badge-printed-${order.id}`}>
                                🎨 مطبوع
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center" data-testid={`cell-quantity-${order.id}`}>
                          <div>
                            <div className="font-medium">{order.quantity_kg}</div>
                            <div className="text-xs text-gray-500">
                              نهائي: {order.final_quantity_kg}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center" data-testid={`cell-status-${order.id}`}>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell data-testid={`cell-assignment-${order.id}`}>
                          <div className="flex flex-wrap gap-1">
                            {getAssignmentBadges(order)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-center">
                            {order.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => handleActivate(order)}
                                data-testid={`button-activate-${order.id}`}
                              >
                                <Play className="h-4 w-4 ml-1" />
                                تفعيل
                              </Button>
                            )}
                            {order.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsActivationModalOpen(true);
                                }}
                                data-testid={`button-reassign-${order.id}`}
                              >
                                <Settings className="h-4 w-4 ml-1" />
                                تخصيص
                              </Button>
                            )}
                            <IconWithTooltip
                              icon={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowStats(showStats === order.id ? null : order.id)}
                                  data-testid={`button-stats-${order.id}`}
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                              }
                              tooltip="عرض الإحصائيات التفصيلية"
                            />
                            <IconWithTooltip
                              icon={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintProductionOrder(order)}
                                  data-testid={`button-print-${order.id}`}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              }
                              tooltip="طباعة أمر الإنتاج"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* عرض إحصائيات أمر الإنتاج */}
          {showStats && (
            <div className="mt-4">
              <ProductionOrderStatsCard productionOrderId={showStats} />
            </div>
          )}
        </main>
      </div>

      {/* نافذة التفعيل والتخصيص */}
      <ProductionOrderActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => {
          setIsActivationModalOpen(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleActivationConfirm}
        order={selectedOrder}
        machines={machines}
        operators={users.filter((u: any) => 
          u.role_id && ["operator", "production_worker"].includes(u.role_id)
        )}
        isUpdating={selectedOrder?.status === "active"}
      />

      {/* قالب طباعة أمر الإنتاج */}
      {printingProductionOrder && (
        <PrintProductionOrderWrapper
          productionOrder={printingProductionOrder}
          onClose={() => setPrintingProductionOrder(null)}
        />
      )}
    </PageLayout>
  );
}

// مكون مساعد لجلب البيانات وعرض قالب الطباعة
function PrintProductionOrderWrapper({ productionOrder, onClose }: { productionOrder: any, onClose: () => void }) {
  const { data: ordersData } = useQuery({
    queryKey: ["/api/orders", productionOrder.order_id],
    queryFn: async () => {
      const response = await fetch(`/api/orders`);
      if (!response.ok) throw new Error("فشل في جلب الطلبات");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("فشل في جلب العملاء");
      const result = await response.json();
      return result.data || result;
    },
  });

  const { data: customerProductsData } = useQuery({
    queryKey: ["/api/customer-products"],
    queryFn: async () => {
      const response = await fetch("/api/customer-products");
      if (!response.ok) throw new Error("فشل في جلب منتجات العملاء");
      const result = await response.json();
      return result.data || result;
    },
  });

  const { data: itemsData } = useQuery({
    queryKey: ["/api/items"],
    queryFn: async () => {
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error("فشل في جلب العناصر");
      const result = await response.json();
      return result.data || result;
    },
  });

  const { data: machinesData } = useQuery({
    queryKey: ["/api/machines"],
    queryFn: async () => {
      const response = await fetch("/api/machines");
      if (!response.ok) throw new Error("فشل في جلب المكائن");
      return response.json();
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("فشل في جلب المستخدمين");
      const result = await response.json();
      return result.data || result;
    },
  });

  const { data: rollsData } = useQuery({
    queryKey: ["/api/rolls", productionOrder.id],
    queryFn: async () => {
      const response = await fetch("/api/rolls");
      if (!response.ok) throw new Error("فشل في جلب الرولات");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data.filter((r: any) => r.production_order_id === productionOrder.id) : [];
    },
  });

  // Wait for all data to load
  if (!ordersData || !customersData || !customerProductsData || !itemsData || !machinesData || !usersData || !rollsData) {
    return null;
  }

  const order = ordersData.find((o: any) => o.id === productionOrder.order_id);
  const customer = customersData.find((c: any) => c.id === order?.customer_id);
  const customerProduct = customerProductsData.find((cp: any) => cp.id === productionOrder.customer_product_id);
  const item = itemsData.find((i: any) => i.id === customerProduct?.item_id);
  const machine = machinesData.find((m: any) => m.id === productionOrder.assigned_machine_id);
  const operator = usersData.find((u: any) => u.id === productionOrder.assigned_operator_id);

  return (
    <ProductionOrderPrintTemplate
      productionOrder={productionOrder}
      order={order}
      customer={customer}
      customerProduct={customerProduct}
      item={item}
      machine={machine}
      operator={operator}
      rolls={rollsData}
      onClose={onClose}
    />
  );
}