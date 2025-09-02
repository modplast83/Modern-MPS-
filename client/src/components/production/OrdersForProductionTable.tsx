import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, FileText, User } from "lucide-react";
import { format } from "date-fns";

interface OrdersForProductionTableProps {
  orders: any[];
}

export default function OrdersForProductionTable({ orders }: OrdersForProductionTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = {
      for_production: { label: "إلى الإنتاج", variant: "default" as const },
    };
    
    const info = statusInfo[status as keyof typeof statusInfo];
    return <Badge variant={info?.variant || "secondary"}>{info?.label || status}</Badge>;
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">لا توجد طلبات مخصصة للإنتاج</p>
        <p className="text-gray-500 text-sm mt-2">سيتم عرض الطلبات هنا عندما يتم تحويل حالتها إلى "إلى الإنتاج"</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">رقم الطلب</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">أيام التسليم</TableHead>
            <TableHead className="text-right">تاريخ التسليم</TableHead>
            <TableHead className="text-right">عدد أوامر الإنتاج</TableHead>
            <TableHead className="text-right">الكمية الإجمالية</TableHead>
            <TableHead className="text-right">تاريخ الإنشاء</TableHead>
            <TableHead className="text-right">الملاحظات</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
              <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                {order.order_number}
              </TableCell>
              <TableCell data-testid={`text-customer-${order.id}`}>
                <div className="flex flex-col">
                  <span className="font-medium">{order.customer_name_ar || order.customer_name}</span>
                  {order.customer_name_ar && order.customer_name !== order.customer_name_ar && (
                    <span className="text-xs text-gray-500">{order.customer_name}</span>
                  )}
                </div>
              </TableCell>
              <TableCell data-testid={`status-${order.id}`}>
                {getStatusBadge(order.status)}
              </TableCell>
              <TableCell data-testid={`text-delivery-days-${order.id}`}>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {order.delivery_days ? `${order.delivery_days} أيام` : '-'}
                </div>
              </TableCell>
              <TableCell data-testid={`text-delivery-date-${order.id}`}>
                {order.delivery_date ? formatDate(order.delivery_date) : '-'}
              </TableCell>
              <TableCell data-testid={`text-production-orders-count-${order.id}`}>
                <Badge variant="outline">{order.production_orders_count}</Badge>
              </TableCell>
              <TableCell data-testid={`text-total-quantity-${order.id}`}>
                {parseFloat(order.total_quantity || '0').toFixed(2)} كيلو
              </TableCell>
              <TableCell data-testid={`text-created-at-${order.id}`}>
                {formatDate(order.created_at)}
              </TableCell>
              <TableCell data-testid={`text-notes-${order.id}`}>
                {order.notes ? (
                  <div className="max-w-xs truncate" title={order.notes}>
                    {order.notes}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid={`button-view-details-${order.id}`}
                  >
                    <FileText className="h-4 w-4 ml-1" />
                    عرض التفاصيل
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}