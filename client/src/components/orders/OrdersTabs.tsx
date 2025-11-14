import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Plus, Trash2, RefreshCw, ChevronDown } from "lucide-react";
import OrdersSearch from "./OrdersSearch";
import OrdersTable from "./OrdersTable";
import OrdersForm from "./OrdersForm";
import { useTranslation } from 'react-i18next';

interface OrdersTabsProps {
  orders: any[];
  productionOrders: any[];
  customers: any[];
  customerProducts: any[];
  users: any[];
  items: any[];
  categories: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  productionSearchTerm: string;
  setProductionSearchTerm: (term: string) => void;
  productionStatusFilter: string;
  setProductionStatusFilter: (status: string) => void;
  filteredOrders: any[];
  filteredProductionOrders: any[];
  isOrderDialogOpen: boolean;
  setIsOrderDialogOpen: (open: boolean) => void;
  editingOrder: any;
  onAddOrder: () => void;
  onEditOrder: (order: any) => void;
  onDeleteOrder: (order: any) => void;
  onStatusChange: (order: any, status: string) => void;
  onViewOrder: (order: any) => void;
  onPrintOrder: (order: any) => void;
  onOrderSubmit: (data: any, productionOrders: any[]) => void;
  onBulkDelete?: (orderIds: number[]) =>{t('components.orders.OrdersTabs.promise')}<void>;
  onBulkStatusChange?: (orderIds: number[], status: string) =>{t('components.orders.OrdersTabs.promise')}<void>;
  currentUser?: any;
  isAdmin?: boolean;
}

export default function OrdersTabs({
  orders,
  productionOrders,
  customers,
  customerProducts,
  users,
  items,
  categories,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  productionSearchTerm,
  setProductionSearchTerm,
  productionStatusFilter,
  setProductionStatusFilter,
  filteredOrders,
  filteredProductionOrders,
  isOrderDialogOpen,
  setIsOrderDialogOpen,
  editingOrder,
  onAddOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onViewOrder,
  onPrintOrder,
  onOrderSubmit,
  onBulkDelete,
  onBulkStatusChange,
  currentUser,
  isAdmin = false,
}: OrdersTabsProps) {
  const { t } = useTranslation();
  
  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false);
  };

  // Bulk selection handlers
  const handleOrderSelect = (orderId: number, selected: boolean) => {
    if (selected) {
      setSelectedOrders((prev) => [...prev, orderId]);
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedOrders(filteredOrders.map((order: any) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedOrders.length === 0 || !isAdmin) return;

    const confirmMessage = t('orders.bulk.confirmDelete', { count: selectedOrders.length });
    if (!confirm(confirmMessage)) return;

    try {
      await onBulkDelete(selectedOrders);
      setSelectedOrders([]);
    } catch (error) {
      console.error(t('orders.bulk.deleteError'), error);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (!onBulkStatusChange || selectedOrders.length === 0) return;

    try {
      await onBulkStatusChange(selectedOrders, status);
      setSelectedOrders([]);
    } catch (error) {
      console.error(t('orders.bulk.statusChangeError'), error);
    }
  };

  return (
    <Tabs defaultValue="orders" className={t("components.orders.orderstabs.name.space_y_4")}>
      <TabsList>
        <TabsTrigger value="orders">{t('orders.orders')}</TabsTrigger>
        <TabsTrigger value="production-orders">{t('orders.productionOrders')}</TabsTrigger>
      </TabsList>

      <TabsContent value="orders" className={t("components.orders.orderstabs.name.space_y_4")}>
        <Card>
          <CardHeader>
            <div className={t("components.orders.orderstabs.name.flex_items_center_justify_between")}>
              <CardTitle>{t('orders.manageOrders')}</CardTitle>
              <div className={t("components.orders.orderstabs.name.flex_items_center_space_x_2_space_x_reverse")}>
                <OrdersSearch
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />
                <Dialog
                  open={isOrderDialogOpen}
                  onOpenChange={setIsOrderDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={onAddOrder} data-testid="button-add-order">
                      <Plus className={t("components.orders.orderstabs.name.h_4_w_4_mr_2")} />
                      {t('orders.addOrder')}
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions Bar */}
            {selectedOrders.length >{t('components.orders.OrdersTabs.0_&&_(')}<Alert className={t("components.orders.orderstabs.name.mb_4")}>
                <AlertDescription>
                  <div className={t("components.orders.orderstabs.name.flex_items_center_justify_between")}>
                    <span className={t("components.orders.orderstabs.name.font_medium")}>
                      {t('orders.bulk.selectedCount', { count: selectedOrders.length })}
                    </span>
                    <div className={t("components.orders.orderstabs.name.flex_items_center_space_x_2_space_x_reverse")}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={t("components.orders.orderstabs.name.text_orange_600_border_orange_600_hover_bg_orange_50")}
                            data-testid="button-bulk-status-change"
                          >
                            <RefreshCw className={t("components.orders.orderstabs.name.h_4_w_4_mr_1")} />
                            {t('orders.bulk.changeStatus')}
                            <ChevronDown className={t("components.orders.orderstabs.name.h_3_w_3_mr_1")} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className={t("components.orders.orderstabs.name.w_48")}>
                          <DropdownMenuItem
                            onClick={() =>
                              handleBulkStatusChange("for_production")
                            }
                          >
                            <div className={t("components.orders.orderstabs.name.flex_items_center_w_full")}>
                              <div className={t("components.orders.orderstabs.name.w_3_h_3_bg_blue_500_rounded_full_mr_2")}></div>
                              {t('orders.status.for_production')}
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkStatusChange("on_hold")}
                          >
                            <div className={t("components.orders.orderstabs.name.flex_items_center_w_full")}>
                              <div className={t("components.orders.orderstabs.name.w_3_h_3_bg_red_500_rounded_full_mr_2")}></div>
                              {t('orders.status.on_hold')}
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkStatusChange("pending")}
                          >
                            <div className={t("components.orders.orderstabs.name.flex_items_center_w_full")}>
                              <div className={t("components.orders.orderstabs.name.w_3_h_3_bg_yellow_500_rounded_full_mr_2")}></div>
                              {t('orders.status.pending')}
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleBulkStatusChange("completed")}
                          >
                            <div className={t("components.orders.orderstabs.name.flex_items_center_w_full")}>
                              <div className={t("components.orders.orderstabs.name.w_3_h_3_bg_green_500_rounded_full_mr_2")}></div>
                              {t('orders.status.completed')}
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDelete}
                          data-testid="button-bulk-delete"
                        >
                          <Trash2 className={t("components.orders.orderstabs.name.h_4_w_4_mr_2")} />
                          {t('orders.bulk.deleteSelected', { count: selectedOrders.length })}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrders([])}
                        data-testid="button-clear-selection"
                      >
                        {t('orders.bulk.clearSelection')}
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <OrdersTable
              orders={filteredOrders}
              customers={customers}
              users={users}
              productionOrders={productionOrders}
              onViewOrder={onViewOrder}
              onPrintOrder={onPrintOrder}
              onEditOrder={isAdmin ? onEditOrder : undefined}
              onDeleteOrder={onDeleteOrder}
              onStatusChange={onStatusChange}
              currentUser={currentUser}
              isAdmin={isAdmin}
              selectedOrders={selectedOrders}
              onOrderSelect={handleOrderSelect}
              onSelectAll={handleSelectAll}
            />
          </CardContent>
        </Card>

        {/* Orders Form Dialog */}
        <OrdersForm
          isOpen={isOrderDialogOpen}
          onClose={handleCloseOrderDialog}
          onSubmit={onOrderSubmit}
          customers={customers}
          customerProducts={customerProducts}
          items={items}
          editingOrder={editingOrder}
        />
      </TabsContent>

      <TabsContent value="production-orders" className={t("components.orders.orderstabs.name.space_y_4")}>
        <Card>
          <CardHeader>
            <div className={t("components.orders.orderstabs.name.flex_items_center_justify_between")}>
              <CardTitle>{t('orders.productionOrders')}</CardTitle>
              <OrdersSearch
                searchTerm={productionSearchTerm}
                setSearchTerm={setProductionSearchTerm}
                statusFilter={productionStatusFilter}
                setStatusFilter={setProductionStatusFilter}
                type="production"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredProductionOrders.length === 0 ? (
              <div className={t("components.orders.orderstabs.name.text_center_py_8_text_gray_500")}>
                {productionOrders.length === 0 
                  ? t('orders.noProductionOrders') 
                  : t('common.noSearchResults')}
              </div>{t('components.orders.OrdersTabs.)_:_(')}<div className={t("components.orders.orderstabs.name.overflow_x_auto")}>
                <table className={t("components.orders.orderstabs.name.min_w_full_divide_y_divide_gray_200")}>
                  <thead className={t("components.orders.orderstabs.name.bg_gray_50")}>
                    <tr>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('orders.productionOrderNumber')}
                      </th>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('orders.orderNumber')}
                      </th>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('orders.customer')}
                      </th>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('common.category')}
                      </th>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('common.product')}
                      </th>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('orders.quantityKg')}
                      </th>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('orders.overrunPercentage')}
                      </th>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('orders.finalQuantityKg')}
                      </th>
                      <th className={t("components.orders.orderstabs.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                        {t('common.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className={t("components.orders.orderstabs.name.bg_white_divide_y_divide_gray_200")}>
                    {filteredProductionOrders.map((po: any) => {
                      const order = orders.find((o: any) => o.id === po.order_id);
                      const customer = customers.find((c: any) => c.id === order?.customer_id);
                      const customerProduct = customerProducts.find((cp: any) => cp.id === po.customer_product_id);
                      const category = categories.find((cat: any) => cat.id === customerProduct?.category_id);
                      const item = items.find((itm: any) =>{t('components.orders.OrdersTabs.itm.id_===_customerproduct?.item_id);_return_(')}<tr key={po.id} className={t("components.orders.orderstabs.name.hover_bg_gray_50")} data-testid={`row-production-order-${po.id}`}>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900")}>
                            {po.production_order_number || po.id}
                          </td>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                            {order?.order_number || t('common.notSpecified')}
                          </td>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                            {customer?.name_ar || customer?.name || t('common.notSpecified')}
                          </td>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")} data-testid={`text-category-${po.id}`}>
                            {category?.name_ar || category?.name || t('common.notSpecified')}
                          </td>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_text_sm_text_gray_900")} data-testid={`text-product-${po.id}`}>
                            <div className={t("components.orders.orderstabs.name.text_right")}>
                              <div className={t("components.orders.orderstabs.name.font_medium_text_gray_900")}>
                                {item?.name_ar || item?.name || t('common.notSpecified')}
                              </div>
                              {customerProduct?.size_caption && (
                                <div className={t("components.orders.orderstabs.name.text_xs_text_gray_500_mt_0_5")}>
                                  {customerProduct.size_caption}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                            {po.quantity_kg || 0}
                          </td>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")} data-testid={`text-overrun-percentage-${po.id}`}>
                            <span className={t("components.orders.orderstabs.name.inline_flex_items_center_px_2_py_0_5_rounded_text_xs_font_medium_bg_blue_100_text_blue_800")}>
                              {po.overrun_percentage ?? 0}%
                            </span>
                          </td>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900")} data-testid={`text-final-quantity-${po.id}`}>
                            {po.final_quantity_kg || po.quantity_kg || 0}
                          </td>
                          <td className={t("components.orders.orderstabs.name.px_6_py_4_whitespace_nowrap")}>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              po.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              po.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              po.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {po.status === 'pending' ? t('orders.status.pending') :
                               po.status === 'in_progress' ? t('orders.status.in_progress') :
                               po.status === 'completed' ? t('orders.status.completed') :
                               po.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
