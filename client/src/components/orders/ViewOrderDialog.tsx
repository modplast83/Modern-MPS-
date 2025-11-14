import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';

interface ViewOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  customer: any;
  productionOrders: any[];
  customerProducts: any[];
  items: any[];
  onPrint?: (order: any) => void;
}

export default function ViewOrderDialog({
  isOpen,
  onClose,
  order,
  customer,
  productionOrders,
  customerProducts,
  items,
  onPrint,
}: ViewOrderDialogProps) {
  const { t } = useTranslation();
  
  if (!order) return null;

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      waiting: t('orders.status.waiting'),
      for_production: t('orders.status.for_production'),
      in_production: t('orders.status.in_production'),
      completed: t('orders.status.completed'),
      cancelled: t('orders.status.cancelled'),
      on_hold: t('orders.status.on_hold'),
      pending: t('orders.status.pending'),
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      waiting: "bg-yellow-100 text-yellow-800",
      for_production: "bg-blue-100 text-blue-800",
      in_production: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      on_hold: "bg-orange-100 text-orange-800",
      pending: "bg-gray-100 text-gray-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const orderProductionOrders = productionOrders.filter(
    (po: any) =>{t('components.orders.ViewOrderDialog.po.order_id_===_order.id_);_return_(')}<Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={t("components.orders.vieworderdialog.name.max_w_3xl_max_h_85vh_overflow_y_auto")}>
        <DialogHeader>
          <div className={t("components.orders.vieworderdialog.name.flex_items_center_justify_between")}>
            <DialogTitle className={t("components.orders.vieworderdialog.name.text_xl")}>
              {t('orders.orderDetails')} {order.order_number}
            </DialogTitle>
            {onPrint && (
              <Button
                onClick={() => onPrint(order)}
                variant="outline"
                size="sm"
                className={t("components.orders.vieworderdialog.name.gap_2")}
                data-testid="button-print-order-dialog"
              >
                <Printer className={t("components.orders.vieworderdialog.name.h_4_w_4")} />
                {t('common.print')}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className={t("components.orders.vieworderdialog.name.space_y_6")}>
          {/* Order Info */}
          <div className={t("components.orders.vieworderdialog.name.grid_grid_cols_2_gap_4")}>
            <div className={t("components.orders.vieworderdialog.name.space_y_3")}>
              <div>
                <span className={t("components.orders.vieworderdialog.name.text_sm_font_medium_text_gray_500")}>{t('orders.orderNumber')}</span>
                <p className={t("components.orders.vieworderdialog.name.text_base_font_semibold")}>{order.order_number}</p>
              </div>
              <div>
                <span className={t("components.orders.vieworderdialog.name.text_sm_font_medium_text_gray_500")}>{t('orders.customer')}</span>
                <p className={t("components.orders.vieworderdialog.name.text_base")}>{customer?.name_ar || customer?.name || t('common.notSpecified')}</p>
              </div>
              <div>
                <span className={t("components.orders.vieworderdialog.name.text_sm_font_medium_text_gray_500")}>{t('common.status')}</span>
                <div className={t("components.orders.vieworderdialog.name.mt_1")}>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className={t("components.orders.vieworderdialog.name.space_y_3")}>
              <div>
                <span className={t("components.orders.vieworderdialog.name.text_sm_font_medium_text_gray_500")}>{t('common.createdAt')}</span>
                <p className={t("components.orders.vieworderdialog.name.text_base")}>
                  {order.created_at
                    ? format(new Date(order.created_at), "dd/MM/yyyy")
                    : t('common.notSpecified')}
                </p>
              </div>
              <div>
                <span className={t("components.orders.vieworderdialog.name.text_sm_font_medium_text_gray_500")}>{t('orders.deliveryDays')}</span>
                <p className={t("components.orders.vieworderdialog.name.text_base")}>{order.delivery_days || t('common.notSpecified')} {t('common.day')}</p>
              </div>
              <div>
                <span className={t("components.orders.vieworderdialog.name.text_sm_font_medium_text_gray_500")}>{t('orders.expectedDeliveryDate')}</span>
                <p className={t("components.orders.vieworderdialog.name.text_base")}>
                  {order.delivery_date
                    ? format(new Date(order.delivery_date), "dd/MM/yyyy")
                    : t('common.notSpecified')}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <span className={t("components.orders.vieworderdialog.name.text_sm_font_medium_text_gray_500")}>{t('common.notes')}</span>
              <p className={t("components.orders.vieworderdialog.name.text_base_mt_1_bg_gray_50_p_3_rounded")}>{order.notes}</p>
            </div>
          )}

          {/* Production Orders */}
          <div>
            <h3 className={t("components.orders.vieworderdialog.name.text_base_font_semibold_mb_3")}>{t('orders.productionOrders')} ({orderProductionOrders.length})</h3>
            {orderProductionOrders.length === 0 ? (
              <div className={t("components.orders.vieworderdialog.name.text_center_py_6_text_sm_text_gray_500")}>
                {t('orders.noProductionOrdersForOrder')}
              </div>{t('components.orders.ViewOrderDialog.)_:_(')}<div className={t("components.orders.vieworderdialog.name.space_y_3")}>
                {orderProductionOrders.map((po: any) => {
                  const customerProduct = customerProducts.find(
                    (cp: any) => cp.id === po.customer_product_id
                  );
                  const item = items.find(
                    (i: any) =>{t('components.orders.ViewOrderDialog.i.id_===_customerproduct?.item_id_);_return_(')}<div
                      key={po.id}
                      className={t("components.orders.vieworderdialog.name.border_rounded_lg_p_4_bg_gray_50")}
                      data-testid={`production-order-detail-${po.id}`}
                    >
                      <div className={t("components.orders.vieworderdialog.name.flex_items_start_justify_between_mb_2")}>
                        <div>
                          <h4 className={t("components.orders.vieworderdialog.name.font_medium_text_sm")}>
                            {po.production_order_number || `PO-${po.id}`}
                          </h4>
                          <p className={t("components.orders.vieworderdialog.name.text_xs_text_gray_600_mt_1")}>
                            {item?.name_ar || item?.name || t('orders.productNotSpecified')}
                            {customerProduct?.size_caption && ` - ${customerProduct.size_caption}`}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(po.status)}`}>
                          {getStatusText(po.status)}
                        </span>
                      </div>

                      <div className={t("components.orders.vieworderdialog.name.grid_grid_cols_3_gap_3_mt_3_text_sm")}>
                        <div>
                          <span className={t("components.orders.vieworderdialog.name.text_gray_500")}>{t('orders.baseQuantity')}:</span>
                          <p className={t("components.orders.vieworderdialog.name.font_medium")}>{po.quantity_kg} {t('common.kg')}</p>
                        </div>
                        <div>
                          <span className={t("components.orders.vieworderdialog.name.text_gray_500")}>{t('orders.overrunPercentage')}:</span>
                          <p className={t("components.orders.vieworderdialog.name.font_medium")}>{po.overrun_percentage ?? 0}%</p>
                        </div>
                        <div>
                          <span className={t("components.orders.vieworderdialog.name.text_gray_500")}>{t('orders.finalQuantity')}:</span>
                          <p className={t("components.orders.vieworderdialog.name.font_medium_text_blue_600")}>{po.final_quantity_kg || po.quantity_kg} {t('common.kg')}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
