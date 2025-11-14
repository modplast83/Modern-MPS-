import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Package, Weight, Clock, CheckCircle2 } from "lucide-react";

interface ProductionStageStatsProps {
  stage: "film" | "printing" | "cutting";
  data: any[];
}

export default function ProductionStageStats({ stage, data }: ProductionStageStatsProps) {
  const { t } = useTranslation();

  const calculateStats = () => {
    let totalOrders = 0;
    let totalRolls = 0;
    let totalWeight = 0;
    let completedRolls = 0;

    if (stage === "film") {
      const ordersSet = new Set();
      data.forEach((order: any) => {
        ordersSet.add(order.id);
        if (order.production_orders) {
          order.production_orders.forEach((po: any) => {
            if (po.rolls) {
              totalRolls += po.rolls.length;
              po.rolls.forEach((roll: any) => {
                totalWeight += parseFloat(roll.weight_kg) || 0;
                if (roll.stage !== "film") {
                  completedRolls++;
                }
              });
            }
          });
        }
      });
      totalOrders = ordersSet.size;
    } else if (stage === "printing") {
      const ordersSet = new Set();
      const productionOrdersSet = new Set();
      
      data.forEach((item: any) => {
        ordersSet.add(item.order_id);
        productionOrdersSet.add(item.production_order_id);
        totalRolls++;
        totalWeight += parseFloat(item.weight_kg) || 0;
        if (item.stage && (item.stage === "cutting" || item.stage === "done")) {
          completedRolls++;
        }
      });
      
      totalOrders = ordersSet.size;
    } else if (stage === "cutting") {
      const ordersSet = new Set();
      
      data.forEach((order: any) => {
        ordersSet.add(order.id);
        if (order.production_orders) {
          order.production_orders.forEach((po: any) => {
            if (po.rolls) {
              totalRolls += po.rolls.length;
              po.rolls.forEach((roll: any) => {
                totalWeight += parseFloat(roll.weight_kg) || 0;
                if (roll.stage === "done" || (roll.cut_weight_total_kg && parseFloat(roll.cut_weight_total_kg) > 0)) {
                  completedRolls++;
                }
              });
            }
          });
        }
      });
      totalOrders = ordersSet.size;
    }

    const progressPercentage = totalRolls > 0 
      ? Math.round((completedRolls / totalRolls) * 100) 
      : 0;

    return {
      totalOrders,
      totalRolls,
      totalWeight,
      completedRolls,
      progressPercentage,
    };
  };

  const stats = calculateStats();

  const getStageName = () => {
    switch (stage) {
      case "film":
        return t('production.filmStage');
      case "printing":
        return t('production.printingStage');
      case "cutting":
        return t('production.cuttingStage');
      default:
        return "";
    }
  };

  return (
    <div className={t("components.production.productionstagestats.name.grid_grid_cols_1_md_grid_cols_4_gap_4_mb_6")}>
      <Card>
        <CardHeader className={t("components.production.productionstagestats.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
          <CardTitle className={t("components.production.productionstagestats.name.text_sm_font_medium")}>
            {getStageName()}
          </CardTitle>
          <Package className={t("components.production.productionstagestats.name.h_4_w_4_text_muted_foreground")} />
        </CardHeader>
        <CardContent>
          <div className={t("components.production.productionstagestats.name.text_2xl_font_bold")}>{stats.totalOrders}</div>
          <p className={t("components.production.productionstagestats.name.text_xs_text_muted_foreground")}>{t('production.productionQueue')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={t("components.production.productionstagestats.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
          <CardTitle className={t("components.production.productionstagestats.name.text_sm_font_medium")}>{t('orders.rolls')}</CardTitle>
          <Package className={t("components.production.productionstagestats.name.h_4_w_4_text_muted_foreground")} />
        </CardHeader>
        <CardContent>
          <div className={t("components.production.productionstagestats.name.text_2xl_font_bold")}>{stats.totalRolls}</div>
          <p className={t("components.production.productionstagestats.name.text_xs_text_muted_foreground")}>{t('warehouse.roll')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={t("components.production.productionstagestats.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
          <CardTitle className={t("components.production.productionstagestats.name.text_sm_font_medium")}>{t('common.total')}</CardTitle>
          <Weight className={t("components.production.productionstagestats.name.h_4_w_4_text_muted_foreground")} />
        </CardHeader>
        <CardContent>
          <div className={t("components.production.productionstagestats.name.text_2xl_font_bold")}>
            {stats.totalWeight.toFixed(2)}
          </div>
          <p className={t("components.production.productionstagestats.name.text_xs_text_muted_foreground")}>{t('warehouse.kg')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={t("components.production.productionstagestats.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
          <CardTitle className={t("components.production.productionstagestats.name.text_sm_font_medium")}>{t('orders.completionRate')}</CardTitle>
          <CheckCircle2 className={t("components.production.productionstagestats.name.h_4_w_4_text_muted_foreground")} />
        </CardHeader>
        <CardContent>
          <div className={t("components.production.productionstagestats.name.text_2xl_font_bold")}>
            {stats.progressPercentage}%
          </div>
          <p className={t("components.production.productionstagestats.name.text_xs_text_muted_foreground")}>
            {stats.completedRolls} / {stats.totalRolls} {t('production.completed')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
