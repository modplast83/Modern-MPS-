import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  FileText,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import ProductionProgress from "./ProductionProgress";

interface OrdersTableProps {
  orders: any[];
  customers: any[];
  users: any[];
  productionOrders?: any[];
  onViewOrder: (order: any) => void;
  onPrintOrder: (order: any) => void;
  onEditOrder?: (order: any) => void;
  onDeleteOrder: (order: any) => void;
  onStatusChange: (order: any, status: string) => void;
  currentUser?: any;
  isAdmin?: boolean;
  selectedOrders?: number[];
  onOrderSelect?: (orderId: number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

export default function OrdersTable({
  orders,
  customers,
  users,
  productionOrders = [],
  onViewOrder,
  onPrintOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  currentUser,
  isAdmin = false,
  selectedOrders = [],
  onOrderSelect,
  onSelectAll,
}: OrdersTableProps) {
  // Check if all orders are selected
  const allOrdersSelected =
    orders.length > 0 &&
    orders.every((order: any) => selectedOrders.includes(order.id));
  const someOrdersSelected =
    selectedOrders.length > 0 && selectedOrders.length < orders.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const handleOrderSelect = (orderId: number, checked: boolean) => {
    if (onOrderSelect) {
      onOrderSelect(orderId, checked);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: {
      [key: string]: { label: string; variant: any; color: string };
    } = {
      waiting: {
        label: "انتظار",
        variant: "secondary",
        color: "bg-yellow-100 text-yellow-800",
      },
      pending: {
        label: "معلق",
        variant: "secondary",
        color: "bg-yellow-100 text-yellow-800",
      },
      in_production: {
        label: "قيد الإنتاج",
        variant: "default",
        color: "bg-blue-100 text-blue-800",
      },
      for_production: {
        label: "للإنتاج",
        variant: "default",
        color: "bg-blue-100 text-blue-800",
      },
      paused: {
        label: "معلق",
        variant: "destructive",
        color: "bg-red-100 text-red-800",
      },
      on_hold: {
        label: "إيقاف مؤقت",
        variant: "destructive",
        color: "bg-red-100 text-red-800",
      },
      completed: {
        label: "مكتمل",
        variant: "default",
        color: "bg-green-100 text-green-800",
      },
      received: {
        label: "مستلم",
        variant: "default",
        color: "bg-purple-100 text-purple-800",
      },
      delivered: {
        label: "تم التوصيل",
        variant: "default",
        color: "bg-gray-100 text-gray-800",
      },
      cancelled: {
        label: "ملغي",
        variant: "destructive",
        color: "bg-red-100 text-red-800",
      },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      variant: "outline",
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={statusInfo.color} data-testid={`status-${status}`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const calculateDeliveryInfo = (order: any) => {
    if (!order.created_at || !order.delivery_days) {
      return { deliveryDate: null, daysRemaining: null };
    }

    const createdDate = new Date(order.created_at);
    const deliveryDate = new Date(createdDate);
    deliveryDate.setDate(
      deliveryDate.getDate() + parseInt(order.delivery_days),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deliveryDate.setHours(0, 0, 0, 0);

    const timeDiff = deliveryDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return { deliveryDate, daysRemaining };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {onOrderSelect && onSelectAll && (
            <TableHead className="w-12">
              <Checkbox
                checked={
                  allOrdersSelected
                    ? true
                    : someOrdersSelected
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={handleSelectAll}
                data-testid="checkbox-select-all"
              />
            </TableHead>
          )}
          <TableHead className="text-right">رقم الطلب</TableHead>
          <TableHead className="text-right">العميل</TableHead>
          <TableHead className="text-right">تاريخ الإنشاء</TableHead>
          <TableHead className="text-right">المنشئ</TableHead>
          <TableHead className="text-right">التسليم</TableHead>
          <TableHead className="text-right">نسبة الإكمال</TableHead>
          <TableHead className="text-right">ملاحظات</TableHead>
          <TableHead className="text-center">الحالة</TableHead>
          <TableHead className="text-center w-10 md:w-14">الإجراءات</TableHead>
          
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order: any) => {
          const customer = customers.find(
            (c: any) => c.id === order.customer_id,
          );
          const user = users.find(
            (u: any) => u.id === parseInt(order.created_by),
          );
          const { deliveryDate, daysRemaining } = calculateDeliveryInfo(order);
          
          // حساب نسب الإكمال من أوامر الإنتاج المرتبطة بهذا الطلب
          const orderProductionOrders = productionOrders.filter(
            (po: any) => po.order_id === order.id
          );
          
          // حساب متوسط مرجح لنسبة الإكمال لكل مرحلة بناءً على الكمية المنتجة مقارنة بالكمية المطلوبة
          let avgFilmPercentage = 0;
          let avgPrintingPercentage = 0;
          let avgCuttingPercentage = 0;
          
          if (orderProductionOrders.length > 0) {
            // حساب الكمية المطلوبة الإجمالية لجميع أوامر الإنتاج
            const totalOrderedQuantity = orderProductionOrders.reduce(
              (sum: number, po: any) => sum + parseFloat(po.ordered_quantity_kg || 0),
              0
            );
            
            if (totalOrderedQuantity > 0) {
              // حساب المتوسط المرجح لكل مرحلة: (الكمية المنتجة ÷ الكمية المطلوبة) × 100
              const weightedFilm = orderProductionOrders.reduce(
                (sum: number, po: any) => {
                  const producedQty = parseFloat(po.produced_quantity_kg || 0);
                  const orderedQty = parseFloat(po.ordered_quantity_kg || 0);
                  const percentage = orderedQty > 0 ? (producedQty / orderedQty) * 100 : 0;
                  return sum + (orderedQty * percentage);
                },
                0
              );
              
              const weightedPrinting = orderProductionOrders.reduce(
                (sum: number, po: any) => {
                  const producedQty = parseFloat(po.produced_quantity_kg || 0);
                  const orderedQty = parseFloat(po.ordered_quantity_kg || 0);
                  const percentage = orderedQty > 0 ? (producedQty / orderedQty) * 100 : 0;
                  return sum + (orderedQty * percentage);
                },
                0
              );
              
              const weightedCutting = orderProductionOrders.reduce(
                (sum: number, po: any) => {
                  const producedQty = parseFloat(po.produced_quantity_kg || 0);
                  const orderedQty = parseFloat(po.ordered_quantity_kg || 0);
                  const percentage = orderedQty > 0 ? (producedQty / orderedQty) * 100 : 0;
                  return sum + (orderedQty * percentage);
                },
                0
              );
              
              avgFilmPercentage = weightedFilm / totalOrderedQuantity;
              avgPrintingPercentage = weightedPrinting / totalOrderedQuantity;
              avgCuttingPercentage = weightedCutting / totalOrderedQuantity;
            }
          }

          return (
            <TableRow
              key={order.id}
              data-testid={`order-row-${order.id}`}
              className={selectedOrders.includes(order.id) ? "bg-blue-50" : ""}
            >
              {onOrderSelect && onSelectAll && (
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order.id)}
                    onCheckedChange={(checked) =>
                      handleOrderSelect(order.id, !!checked)
                    }
                    data-testid={`checkbox-select-order-${order.id}`}
                  />
                </TableCell>
              )}
              <TableCell
                className="font-medium"
                data-testid={`order-number-${order.id}`}
              >
                {order.order_number}
              </TableCell>
              <TableCell data-testid={`customer-${order.id}`}>
                <div className="text-right">
                  <div className="font-medium">
                    {customer?.name_ar || customer?.name}
                  </div>
                  <div className="text-sm text-gray-500">{customer?.id}</div>
                </div>
              </TableCell>
              <TableCell data-testid={`created-date-${order.id}`}>
                {order.created_at
                  ? format(new Date(order.created_at), "dd/MM/yyyy")
                  : "-"}
              </TableCell>
              <TableCell data-testid={`created-by-${order.id}`}>
                <div className="text-right">
                  <div className="font-medium">{user?.display_name_ar || user?.display_name || user?.username || '-'}</div>
                  <div className="text-sm text-gray-500">#{user?.id}</div>
                </div>
              </TableCell>
              <TableCell data-testid={`delivery-${order.id}`}>
                <div className="text-right">
                  {deliveryDate && daysRemaining !== null ? (
                    <>
                      <div className="font-medium">
                        {daysRemaining > 0 ? (
                          <span className="text-green-600">
                            {daysRemaining} يوم متبقي
                          </span>
                        ) : daysRemaining === 0 ? (
                          <span className="text-orange-600">
                            يجب التسليم اليوم
                          </span>
                        ) : (
                          <span className="text-red-600">
                            متأخر {Math.abs(daysRemaining)} يوم
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        التسليم: {format(deliveryDate, "dd/MM/yyyy")}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </div>
              </TableCell>
              <TableCell data-testid={`production-progress-${order.id}`}>
                {orderProductionOrders.length > 0 ? (
                  <ProductionProgress
                    filmPercentage={avgFilmPercentage}
                    printingPercentage={avgPrintingPercentage}
                    cuttingPercentage={avgCuttingPercentage}
                  />
                ) : (
                  <div className="text-gray-400 text-center">-</div>
                )}
              </TableCell>
              <TableCell data-testid={`notes-${order.id}`}>
                {order.notes || "-"}
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(order.status || "pending")}
              </TableCell>
              <TableCell>
                <div className="grid grid-cols-3 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50 p-1"
                    onClick={() => onViewOrder(order)}
                    title="عرض"
                    data-testid={`button-view-${order.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-600 hover:bg-green-50 p-1"
                    onClick={() => onPrintOrder(order)}
                    title="طباعة"
                    data-testid={`button-print-${order.id}`}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  {isAdmin && onEditOrder && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-600 hover:bg-purple-50 p-1"
                      onClick={() => onEditOrder(order)}
                      title="تعديل"
                      data-testid={`button-edit-${order.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50 p-1"
                        title="تغيير الحالة"
                        data-testid={`button-status-${order.id}`}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order, "for_production")}
                      >
                        <div className="flex items-center w-full">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          إلى الإنتاج
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order, "on_hold")}
                      >
                        <div className="flex items-center w-full">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          إيقاف مؤقت
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order, "pending")}
                      >
                        <div className="flex items-center w-full">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                          في الانتظار
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order, "completed")}
                      >
                        <div className="flex items-center w-full">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          مكتمل
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50 p-1"
                      onClick={() => onDeleteOrder(order)}
                      title="حذف"
                      data-testid={`button-delete-${order.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
