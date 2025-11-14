import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Eye, Plus } from "lucide-react";
import type { ProductionOrderWithDetails } from "@/types";
import { formatNumber, formatWeight } from "../../lib/formatNumber";

const formatPercentage = (value: number): string => {
  return `${value}%`;
};

interface ProductionOrdersTableProps {
  stage: string;
  onCreateRoll: (productionOrderId?: number) => void;
}

export default function ProductionOrdersTable({
  stage,
  onCreateRoll,
}: ProductionOrdersTableProps) {
  const { t } = useTranslation();
  const { data: productionOrders = [], isLoading } = useQuery<
    ProductionOrderWithDetails[]
  >({
    queryKey:
      stage === "film"
        ? ["/api/production/film-queue"]
        : ["/api/production-orders", stage],
  });

  if (isLoading) {
    return (
      <div className={t("components.production.productionorderstable.name.space_y_4")}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={t("components.production.productionorderstable.name.h_16_bg_muted_animate_pulse_rounded")}></div>
        ))}
      </div>
    );
  }

  if (productionOrders.length === 0) {
    return (
      <div className={t("components.production.productionorderstable.name.text_center_py_8")}>
        <p className={t("components.production.productionorderstable.name.text_muted_foreground")}>
          {t('common.noData')}
        </p>
      </div>
    );
  }

  return (
    <div className={t("components.production.productionorderstable.name.overflow_x_auto")}>
      <table className={t("components.production.productionorderstable.name.min_w_full_divide_y_divide_gray_200")}>
        <thead className={t("components.production.productionorderstable.name.bg_gray_50")}>
          <tr>
            <th className={t("components.production.productionorderstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
              {t('production.productionOrderNumber')}
            </th>
            <th className={t("components.production.productionorderstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
              {t('orders.customer')}
            </th>
            <th className={t("components.production.productionorderstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
              {t('orders.product')}
            </th>
            <th className={t("components.production.productionorderstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
              {t('common.quantity')}
            </th>
            <th className={t("components.production.productionorderstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
              {t('production.totalProduction')}
            </th>
            <th className={t("components.production.productionorderstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
              {t('orders.completionRate')}
            </th>
            <th className={t("components.production.productionorderstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
              {t('common.actions')}
            </th>
          </tr>
        </thead>
        <tbody className={t("components.production.productionorderstable.name.bg_white_divide_y_divide_gray_200")}>
          {productionOrders.map((order) => {
            const required = parseFloat(order.quantity_required) || 0;
            const produced = parseFloat(order.produced_quantity_kg) || 0;
            const progress =
              required >{t('components.production.ProductionOrdersTable.0_?_math.round((produced_/_required)_*_100)_:_0;_let_progresscolor_=_"bg-primary";_if_(progress')}< 30) progressColor = "bg-danger";
            else if (progress < 70) progressColor = "bg-warning";

            return (
              <tr key={order.id} className={t("components.production.productionorderstable.name.hover_bg_gray_50")}>
                <td className={t("components.production.productionorderstable.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900")}>
                  {order.production_order_number}
                </td>
                <td className={t("components.production.productionorderstable.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                  {order.customer_name_ar || order.customer_name || t('common.noData')}
                </td>
                <td className={t("components.production.productionorderstable.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                  {(order as any).item_name_ar ||
                    (order as any).item_name ||
                    (order as any).size_caption ||
                    t('common.noData')}
                </td>
                <td className={t("components.production.productionorderstable.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                  {formatWeight(required)}
                </td>
                <td className={t("components.production.productionorderstable.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                  {formatWeight(produced)}
                </td>
                <td className={t("components.production.productionorderstable.name.px_6_py_4_whitespace_nowrap")}>
                  <div className={t("components.production.productionorderstable.name.flex_items_center")}>
                    <div className={t("components.production.productionorderstable.name.w_full_bg_gray_200_rounded_full_h_2_ml_3")}>
                      <div
                        className={`h-2 rounded-full ${progressColor}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <span className={t("components.production.productionorderstable.name.text_sm_text_gray_900")}>
                      {formatPercentage(progress)}
                    </span>
                  </div>
                </td>
                <td className={t("components.production.productionorderstable.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium")}>
                  <div className={t("components.production.productionorderstable.name.flex_items_center_space_x_2_space_x_reverse")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCreateRoll(order.id)}
                      className={t("components.production.productionorderstable.name.text_primary_hover_text_primary_80")}
                      data-testid={`button-create-roll-${order.id}`}
                    >
                      <Plus className={t("components.production.productionorderstable.name.h_4_w_4")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={t("components.production.productionorderstable.name.text_gray_600_hover_text_gray_800")}
                    >
                      <Eye className={t("components.production.productionorderstable.name.h_4_w_4")} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
