import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  
  // Check if all orders are selected
  const allOrdersSelected =
    orders.length > 0 &&
    orders.every((order: any) => selectedOrders.includes(order.id));
  const someOrdersSelected =
    selectedOrders.length >{t('components.orders.OrdersTable.0_&&_selectedorders.length')}< orders.length;

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
      [key: string]: { labelKey: string; variant: any; color: string };
    } = {
      waiting: {
        labelKey: "production.waiting",
        variant: "secondary",
        color: "bg-yellow-100 text-yellow-800",
      },
      pending: {
        labelKey: "production.pending",
        variant: "secondary",
        color: "bg-yellow-100 text-yellow-800",
      },
      in_production: {
        labelKey: "production.inProduction",
        variant: "default",
        color: "bg-blue-100 text-blue-800",
      },
      for_production: {
        labelKey: "production.forProduction",
        variant: "default",
        color: "bg-blue-100 text-blue-800",
      },
      paused: {
        labelKey: "production.paused",
        variant: "destructive",
        color: "bg-red-100 text-red-800",
      },
      on_hold: {
        labelKey: "production.onHold",
        variant: "destructive",
        color: "bg-red-100 text-red-800",
      },
      completed: {
        labelKey: "production.completed",
        variant: "default",
        color: "bg-green-100 text-green-800",
      },
      received: {
        labelKey: "production.received",
        variant: "default",
        color: "bg-purple-100 text-purple-800",
      },
      delivered: {
        labelKey: "production.delivered",
        variant: "default",
        color: "bg-gray-100 text-gray-800",
      },
      cancelled: {
        labelKey: "production.cancelled",
        variant: "destructive",
        color: "bg-red-100 text-red-800",
      },
    };

    const statusInfo = statusMap[status] || {
      labelKey: null,
      variant: "outline",
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={statusInfo.color} data-testid={`status-${status}`}>
        {statusInfo.labelKey ? t(statusInfo.labelKey) : status}
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
            <TableHead className={t("components.orders.orderstable.name.w_12")}>
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
          <TableHead className={t("components.orders.orderstable.name.text_right")}>{t("orders.orderNumber")}</TableHead>
          <TableHead className={t("components.orders.orderstable.name.text_right")}>{t("orders.customer")}</TableHead>
          <TableHead className={t("components.orders.orderstable.name.text_right")}>{t("orders.createdAt")}</TableHead>
          <TableHead className={t("components.orders.orderstable.name.text_right")}>{t("orders.creator")}</TableHead>
          <TableHead className={t("components.orders.orderstable.name.text_right")}>{t("orders.delivery")}</TableHead>
          <TableHead className={t("components.orders.orderstable.name.text_right")}>{t("orders.completionRate")}</TableHead>
          <TableHead className={t("components.orders.orderstable.name.text_right")}>{t("orders.notes")}</TableHead>
          <TableHead className={t("components.orders.orderstable.name.text_center")}>{t("orders.status")}</TableHead>
          <TableHead className={t("components.orders.orderstable.name.text_center_w_10_md_w_14")}>{t("orders.actions")}</TableHead>
          
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
          
          // حساب متوسط مرجح لنسبة الإكمال لكل مرحلة بناءً على الكميات الفعلية
          let avgFilmPercentage = 0;
          let avgPrintingPercentage = 0;
          let avgCuttingPercentage = 0;
          
          if (orderProductionOrders.length > 0) {
            // حساب الكمية الإجمالية لجميع أوامر الإنتاج
            const totalQuantity = orderProductionOrders.reduce(
              (sum: number, po: any) => sum + parseFloat(po.final_quantity_kg || po.quantity_kg || 0),
              0
            );
            
            if (totalQuantity > 0) {
              // حساب المتوسط المرجح لكل مرحلة
              const weightedFilm = orderProductionOrders.reduce(
                (sum: number, po: any) => {
                  const quantity = parseFloat(po.final_quantity_kg || po.quantity_kg || 0);
                  const percentage = parseFloat(po.film_completion_percentage || 0);
                  return sum + (quantity * percentage);
                },
                0
              );
              
              const weightedPrinting = orderProductionOrders.reduce(
                (sum: number, po: any) => {
                  const quantity = parseFloat(po.final_quantity_kg || po.quantity_kg || 0);
                  const percentage = parseFloat(po.printing_completion_percentage || 0);
                  return sum + (quantity * percentage);
                },
                0
              );
              
              const weightedCutting = orderProductionOrders.reduce(
                (sum: number, po: any) => {
                  const quantity = parseFloat(po.final_quantity_kg || po.quantity_kg || 0);
                  const percentage = parseFloat(po.cutting_completion_percentage || 0);
                  return sum + (quantity * percentage);
                },
                0
              );
              
              avgFilmPercentage = weightedFilm / totalQuantity;
              avgPrintingPercentage = weightedPrinting / totalQuantity;
              avgCuttingPercentage = weightedCutting / totalQuantity;
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
                className={t("components.orders.orderstable.name.font_medium")}
                data-testid={`order-number-${order.id}`}
              >
                {order.order_number}
              </TableCell>
              <TableCell data-testid={`customer-${order.id}`}>
                <div className={t("components.orders.orderstable.name.text_right")}>
                  <div className={t("components.orders.orderstable.name.font_medium")}>
                    {customer?.name_ar || customer?.name}
                  </div>
                  <div className={t("components.orders.orderstable.name.text_sm_text_gray_500")}>{customer?.id}</div>
                </div>
              </TableCell>
              <TableCell data-testid={`created-date-${order.id}`}>
                {order.created_at
                  ? format(new Date(order.created_at), "dd/MM/yyyy")
                  : "-"}
              </TableCell>
              <TableCell data-testid={`created-by-${order.id}`}>
                <div className={t("components.orders.orderstable.name.text_right")}>
                  <div className={t("components.orders.orderstable.name.font_medium")}>{user?.display_name_ar || user?.display_name || user?.username || '-'}</div>
                  <div className={t("components.orders.orderstable.name.text_sm_text_gray_500")}>#{user?.id}</div>
                </div>
              </TableCell>
              <TableCell data-testid={`delivery-${order.id}`}>
                <div className={t("components.orders.orderstable.name.text_right")}>
                  {deliveryDate && daysRemaining !== null ? (
                    <>
                      <div className={t("components.orders.orderstable.name.font_medium")}>
                        {daysRemaining >{t('components.orders.OrdersTable.0_?_(')}<span className={t("components.orders.orderstable.name.text_green_600")}>
                            {daysRemaining} {t("orders.day")} {t("orders.daysRemaining")}
                          </span>{t('components.orders.OrdersTable.)_:_daysremaining_===_0_?_(')}<span className={t("components.orders.orderstable.name.text_orange_600")}>
                            {t("orders.deliverToday")}
                          </span>{t('components.orders.OrdersTable.)_:_(')}<span className={t("components.orders.orderstable.name.text_red_600")}>
                            {t("orders.late")} {Math.abs(daysRemaining)} {t("orders.day")}
                          </span>
                        )}
                      </div>
                      <div className={t("components.orders.orderstable.name.text_sm_text_gray_500")}>
                        {t("orders.deliveryDate")}: {format(deliveryDate, "dd/MM/yyyy")}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </div>
              </TableCell>
              <TableCell data-testid={`production-progress-${order.id}`}>
                {orderProductionOrders.length >{t('components.orders.OrdersTable.0_?_(')}<ProductionProgress
                    filmPercentage={avgFilmPercentage}
                    printingPercentage={avgPrintingPercentage}
                    cuttingPercentage={avgCuttingPercentage}
                  />{t('components.orders.OrdersTable.)_:_(')}<div className={t("components.orders.orderstable.name.text_gray_400_text_center")}>-</div>
                )}
              </TableCell>
              <TableCell data-testid={`notes-${order.id}`}>
                {order.notes || "-"}
              </TableCell>
              <TableCell className={t("components.orders.orderstable.name.text_center")}>
                {getStatusBadge(order.status || "pending")}
              </TableCell>
              <TableCell>
                <div className={t("components.orders.orderstable.name.grid_grid_cols_3_gap_1")}>
                  <Button
                    variant="outline"
                    size="sm"
                    className={t("components.orders.orderstable.name.text_blue_600_border_blue_600_hover_bg_blue_50_p_1")}
                    onClick={() => onViewOrder(order)}
                    title={t("common.view")}
                    data-testid={`button-view-${order.id}`}
                  >
                    <Eye className={t("components.orders.orderstable.name.h_4_w_4")} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={t("components.orders.orderstable.name.text_green_600_border_green_600_hover_bg_green_50_p_1")}
                    onClick={() => onPrintOrder(order)}
                    title={t("common.print")}
                    data-testid={`button-print-${order.id}`}
                  >
                    <FileText className={t("components.orders.orderstable.name.h_4_w_4")} />
                  </Button>
                  {isAdmin && onEditOrder && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={t("components.orders.orderstable.name.text_purple_600_border_purple_600_hover_bg_purple_50_p_1")}
                      onClick={() => onEditOrder(order)}
                      title={t("common.edit")}
                      data-testid={`button-edit-${order.id}`}
                    >
                      <Edit className={t("components.orders.orderstable.name.h_4_w_4")} />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={t("components.orders.orderstable.name.text_orange_600_border_orange_600_hover_bg_orange_50_p_1")}
                        title={t("orders.changeStatus")}
                        data-testid={`button-status-${order.id}`}
                      >
                        <RefreshCw className={t("components.orders.orderstable.name.h_3_w_3")} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={t("components.orders.orderstable.name.w_48")}>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order, "for_production")}
                      >
                        <div className={t("components.orders.orderstable.name.flex_items_center_w_full")}>
                          <div className={t("components.orders.orderstable.name.w_3_h_3_bg_blue_500_rounded_full_mr_2")}></div>
                          {t("production.forProduction")}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order, "on_hold")}
                      >
                        <div className={t("components.orders.orderstable.name.flex_items_center_w_full")}>
                          <div className={t("components.orders.orderstable.name.w_3_h_3_bg_red_500_rounded_full_mr_2")}></div>
                          {t("production.onHold")}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order, "pending")}
                      >
                        <div className={t("components.orders.orderstable.name.flex_items_center_w_full")}>
                          <div className={t("components.orders.orderstable.name.w_3_h_3_bg_yellow_500_rounded_full_mr_2")}></div>
                          {t("production.pending")}
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusChange(order, "completed")}
                      >
                        <div className={t("components.orders.orderstable.name.flex_items_center_w_full")}>
                          <div className={t("components.orders.orderstable.name.w_3_h_3_bg_green_500_rounded_full_mr_2")}></div>
                          {t("production.completed")}
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={t("components.orders.orderstable.name.text_red_600_border_red_600_hover_bg_red_50_p_1")}
                      onClick={() => onDeleteOrder(order)}
                      title={t("common.delete")}
                      data-testid={`button-delete-${order.id}`}
                    >
                      <Trash2 className={t("components.orders.orderstable.name.h_4_w_4")} />
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
