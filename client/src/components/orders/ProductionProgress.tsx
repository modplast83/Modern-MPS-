import { Progress } from "../ui/progress";

interface ProductionProgressProps {
  filmPercentage: number;
  printingPercentage: number;
  cuttingPercentage: number;
}

export default function ProductionProgress({
  filmPercentage,
  printingPercentage,
  cuttingPercentage,
}: ProductionProgressProps) {
  return (
    <div className={t("components.orders.productionprogress.name.flex_flex_col_space_y_2_w_full_min_w_120px_")}>
      {/* مؤشر الفيلم - أسود */}
      <div className={t("components.orders.productionprogress.name.flex_items_center_space_x_2")} data-testid="progress-film">
        <div className={t("components.orders.productionprogress.name.w_3_h_3_bg_black_rounded_full_flex_shrink_0")} />
        <Progress 
          value={filmPercentage} 
          className={t("components.orders.productionprogress.name.h_2_flex_1")}
          style={{
            "--progress-background": "#000000",
          } as React.CSSProperties}
        />
        <span className={t("components.orders.productionprogress.name.text_xs_text_gray_600_w_10_text_right")}>
          {Math.round(filmPercentage)}%
        </span>
      </div>
      
      {/* مؤشر الطباعة - أحمر */}
      <div className={t("components.orders.productionprogress.name.flex_items_center_space_x_2")} data-testid="progress-printing">
        <div className={t("components.orders.productionprogress.name.w_3_h_3_bg_red_500_rounded_full_flex_shrink_0")} />
        <Progress 
          value={printingPercentage} 
          className={t("components.orders.productionprogress.name.h_2_flex_1")}
          style={{
            "--progress-background": "#ef4444",
          } as React.CSSProperties}
        />
        <span className={t("components.orders.productionprogress.name.text_xs_text_gray_600_w_10_text_right")}>
          {Math.round(printingPercentage)}%
        </span>
      </div>
      
      {/* مؤشر التقطيع - أصفر */}
      <div className={t("components.orders.productionprogress.name.flex_items_center_space_x_2")} data-testid="progress-cutting">
        <div className={t("components.orders.productionprogress.name.w_3_h_3_bg_yellow_500_rounded_full_flex_shrink_0")} />
        <Progress 
          value={cuttingPercentage} 
          className={t("components.orders.productionprogress.name.h_2_flex_1")}
          style={{
            "--progress-background": "#eab308",
          } as React.CSSProperties}
        />
        <span className={t("components.orders.productionprogress.name.text_xs_text_gray_600_w_10_text_right")}>
          {Math.round(cuttingPercentage)}%
        </span>
      </div>
    </div>
  );
}