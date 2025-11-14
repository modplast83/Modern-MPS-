import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Package, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface OrdersStatsProps {
  orders: any[];
  productionOrders: any[];
}

export default function OrdersStats({
  orders,
  productionOrders,
}: OrdersStatsProps) {
  const { t } = useTranslation();
  
  return (
    <div className={t("components.orders.ordersstats.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
      <Card>
        <CardHeader className={t("components.orders.ordersstats.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
          <CardTitle className={t("components.orders.ordersstats.name.text_sm_font_medium")}>{t('orders.totalOrders')}</CardTitle>
          <Package className={t("components.orders.ordersstats.name.h_4_w_4_text_muted_foreground")} />
        </CardHeader>
        <CardContent>
          <div className={t("components.orders.ordersstats.name.text_2xl_font_bold")}>{orders.length}</div>
          <p className={t("components.orders.ordersstats.name.text_xs_text_muted_foreground")}>{t('ordersStats.order')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={t("components.orders.ordersstats.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
          <CardTitle className={t("components.orders.ordersstats.name.text_sm_font_medium")}>{t('production.productionOrders')}</CardTitle>
          <Package className={t("components.orders.ordersstats.name.h_4_w_4_text_muted_foreground")} />
        </CardHeader>
        <CardContent>
          <div className={t("components.orders.ordersstats.name.text_2xl_font_bold")}>{productionOrders.length}</div>
          <p className={t("components.orders.ordersstats.name.text_xs_text_muted_foreground")}>{t('ordersStats.productionOrder')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={t("components.orders.ordersstats.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
          <CardTitle className={t("components.orders.ordersstats.name.text_sm_font_medium")}>{t('ordersStats.inProgress')}</CardTitle>
          <Clock className={t("components.orders.ordersstats.name.h_4_w_4_text_yellow_500")} />
        </CardHeader>
        <CardContent>
          <div className={t("components.orders.ordersstats.name.text_2xl_font_bold_text_yellow_600")}>
            {
              productionOrders.filter((po: any) => po.status === "in_progress")
                .length
            }
          </div>
          <p className={t("components.orders.ordersstats.name.text_xs_text_muted_foreground")}>{t('ordersStats.orderInProgress')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={t("components.orders.ordersstats.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
          <CardTitle className={t("components.orders.ordersstats.name.text_sm_font_medium")}>{t('ordersStats.completed')}</CardTitle>
          <Package className={t("components.orders.ordersstats.name.h_4_w_4_text_green_500")} />
        </CardHeader>
        <CardContent>
          <div className={t("components.orders.ordersstats.name.text_2xl_font_bold_text_green_600")}>
            {
              productionOrders.filter((po: any) => po.status === "completed")
                .length
            }
          </div>
          <p className={t("components.orders.ordersstats.name.text_xs_text_muted_foreground")}>{t('ordersStats.orderCompleted')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
