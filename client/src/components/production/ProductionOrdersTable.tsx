import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ProductionOrderData {
  id: number;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_name_ar: string;
  delivery_days: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  delivery_date: string | null;
}

export default function ProductionOrdersTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productionOrders = [], isLoading } = useQuery<ProductionOrderData[]>({
    queryKey: ['/api/orders', 'for_production'],
    queryFn: () => fetch('/api/orders?status=for_production').then(res => res.json())
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return await apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "تم تحديث حالة الطلب بنجاح",
        description: "تم تحديث حالة الطلب"
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive"
      });
    }
  });

  const startProduction = (orderId: number) => {
    updateOrderStatusMutation.mutate({ orderId, status: 'in_progress' });
  };

  const completeOrder = (orderId: number) => {
    updateOrderStatusMutation.mutate({ orderId, status: 'completed' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'for_production':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">للإنتاج</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">قيد التنفيذ</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">مكتمل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (productionOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-muted-foreground">لا توجد طلبات جاهزة للإنتاج حالياً</p>
        <p className="text-sm text-gray-500 mt-2">سيتم عرض الطلبات عند تحويل حالتها إلى "للإنتاج"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          الطلبات الجاهزة للإنتاج ({productionOrders.length})
        </h3>
        <div className="text-sm text-gray-500">
          الطلبات التي تم تحويل حالتها للإنتاج
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                رقم الطلب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                العميل
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاريخ الطلب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                أيام التسليم
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productionOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{order.customer_name_ar || order.customer_name}</div>
                    <div className="text-gray-500">{order.customer_id}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.delivery_days ? `${order.delivery_days} يوم` : 'غير محدد'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      onClick={() => startProduction(order.id)}
                      disabled={updateOrderStatusMutation.isPending}
                      size="sm"
                      className="btn-primary"
                    >
                      <PlayCircle className="h-4 w-4 ml-2" />
                      بدء الإنتاج
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}