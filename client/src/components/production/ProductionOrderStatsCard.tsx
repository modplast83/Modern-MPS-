import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface ProductionOrderStatsCardProps {
  productionOrderId: number;
}

export default function ProductionOrderStatsCard({
  productionOrderId,
}: ProductionOrderStatsCardProps) {
  const { t } = useTranslation();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/production-orders/${productionOrderId}/stats`],
    queryFn: async () => {
      const response = await fetch(`/api/production-orders/${productionOrderId}/stats`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('productionStats.fetchError'));
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className={t("components.production.productionorderstatscard.name.flex_items_center_justify_center_p_8")}>
          <Loader2 className={t("components.production.productionorderstatscard.name.h_8_w_8_animate_spin_text_primary")} />
        </CardContent>
      </Card>
    );
  }

  if (!stats?.data) {
    return (
      <Card>
        <CardContent className={t("components.production.productionorderstatscard.name.p_8_text_center_text_gray_500")}>
          {t('productionStats.noStatsAvailable')}
        </CardContent>
      </Card>
    );
  }

  const data = stats.data;
  const completionPercentage = parseFloat(data.completion_percentage || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className={t("components.production.productionorderstatscard.name.flex_items_center_justify_between")}>
          <span>{t('productionStats.title')}</span>
          <Badge variant="outline">
            {data.production_order?.production_order_number}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={t("components.production.productionorderstatscard.name.space_y_4")}>
          {/* نسبة الإكمال */}
          <div>
            <div className={t("components.production.productionorderstatscard.name.flex_justify_between_text_sm_mb_2")}>
              <span className={t("components.production.productionorderstatscard.name.text_gray_600")}>{t('productionStats.completionPercentage')}</span>
              <span className={t("components.production.productionorderstatscard.name.font_medium")}>{completionPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={completionPercentage} className={t("components.production.productionorderstatscard.name.h_2")} />
          </div>

          {/* الإحصائيات الأساسية */}
          <div className={t("components.production.productionorderstatscard.name.grid_grid_cols_2_md_grid_cols_4_gap_4")}>
            <div className={t("components.production.productionorderstatscard.name.bg_gray_50_rounded_lg_p_3")}>
              <div className={t("components.production.productionorderstatscard.name.text_xs_text_gray_600")}>{t('productionStats.totalRolls')}</div>
              <div className={t("components.production.productionorderstatscard.name.text_xl_font_bold")}>{data.total_rolls}</div>
            </div>
            <div className={t("components.production.productionorderstatscard.name.bg_gray_50_rounded_lg_p_3")}>
              <div className={t("components.production.productionorderstatscard.name.text_xs_text_gray_600")}>{t('productionStats.totalWeight')}</div>
              <div className={t("components.production.productionorderstatscard.name.text_xl_font_bold")}>{data.total_weight} <span className={t("components.production.productionorderstatscard.name.text_sm")}>{t('common.kg')}</span></div>
            </div>
            <div className={t("components.production.productionorderstatscard.name.bg_gray_50_rounded_lg_p_3")}>
              <div className={t("components.production.productionorderstatscard.name.text_xs_text_gray_600")}>{t('productionStats.remainingQuantity')}</div>
              <div className={t("components.production.productionorderstatscard.name.text_xl_font_bold")}>{data.remaining_quantity} <span className={t("components.production.productionorderstatscard.name.text_sm")}>{t('common.kg')}</span></div>
            </div>
            <div className={t("components.production.productionorderstatscard.name.bg_gray_50_rounded_lg_p_3")}>
              <div className={t("components.production.productionorderstatscard.name.text_xs_text_gray_600")}>{t('productionStats.waste')}</div>
              <div className={t("components.production.productionorderstatscard.name.text_xl_font_bold")}>{data.total_waste} <span className={t("components.production.productionorderstatscard.name.text_sm")}>{t('common.kg')}</span></div>
            </div>
          </div>

          {/* توزيع الرولات حسب المرحلة */}
          <div>
            <div className={t("components.production.productionorderstatscard.name.text_sm_font_medium_text_gray_700_mb_2")}>{t('productionStats.rollDistribution')}</div>
            <div className={t("components.production.productionorderstatscard.name.grid_grid_cols_4_gap_2")}>
              <div className={t("components.production.productionorderstatscard.name.text_center")}>
                <div className={t("components.production.productionorderstatscard.name.bg_blue_100_text_blue_800_rounded_lg_p_2")}>
                  <div className={t("components.production.productionorderstatscard.name.text_lg_font_bold")}>{data.film_rolls}</div>
                  <div className={t("components.production.productionorderstatscard.name.text_xs")}>{t('production.film')}</div>
                </div>
              </div>
              <div className={t("components.production.productionorderstatscard.name.text_center")}>
                <div className={t("components.production.productionorderstatscard.name.bg_yellow_100_text_yellow_800_rounded_lg_p_2")}>
                  <div className={t("components.production.productionorderstatscard.name.text_lg_font_bold")}>{data.printing_rolls}</div>
                  <div className={t("components.production.productionorderstatscard.name.text_xs")}>{t('production.printing')}</div>
                </div>
              </div>
              <div className={t("components.production.productionorderstatscard.name.text_center")}>
                <div className={t("components.production.productionorderstatscard.name.bg_orange_100_text_orange_800_rounded_lg_p_2")}>
                  <div className={t("components.production.productionorderstatscard.name.text_lg_font_bold")}>{data.cutting_rolls}</div>
                  <div className={t("components.production.productionorderstatscard.name.text_xs")}>{t('production.cutting')}</div>
                </div>
              </div>
              <div className={t("components.production.productionorderstatscard.name.text_center")}>
                <div className={t("components.production.productionorderstatscard.name.bg_green_100_text_green_800_rounded_lg_p_2")}>
                  <div className={t("components.production.productionorderstatscard.name.text_lg_font_bold")}>{data.done_rolls}</div>
                  <div className={t("components.production.productionorderstatscard.name.text_xs")}>{t('production.completed')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الوقت */}
          {data.production_order?.production_start_time && (
            <div className={t("components.production.productionorderstatscard.name.border_t_pt_4")}>
              <div className={t("components.production.productionorderstatscard.name.flex_justify_between_text_sm")}>
                <span className={t("components.production.productionorderstatscard.name.text_gray_600")}>{t('productionStats.productionTime')}</span>
                <span className={t("components.production.productionorderstatscard.name.font_medium")}>{data.production_time_hours} {t('common.hour')}</span>
              </div>
              <div className={t("components.production.productionorderstatscard.name.flex_justify_between_text_sm_mt_2")}>
                <span className={t("components.production.productionorderstatscard.name.text_gray_600")}>{t('productionStats.startDate')}</span>
                <span className={t("components.production.productionorderstatscard.name.font_medium")}>
                  {new Date(data.production_order.production_start_time).toLocaleString("ar-SA")}
                </span>
              </div>
              {data.production_order.production_end_time && (
                <div className={t("components.production.productionorderstatscard.name.flex_justify_between_text_sm_mt_2")}>
                  <span className={t("components.production.productionorderstatscard.name.text_gray_600")}>{t('productionStats.endDate')}</span>
                  <span className={t("components.production.productionorderstatscard.name.font_medium")}>
                    {new Date(data.production_order.production_end_time).toLocaleString("ar-SA")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* معلومات أمر الإنتاج */}
          <div className={t("components.production.productionorderstatscard.name.border_t_pt_4_space_y_2")}>
            <div className={t("components.production.productionorderstatscard.name.flex_justify_between_text_sm")}>
              <span className={t("components.production.productionorderstatscard.name.text_gray_600")}>{t('productionStats.requiredQuantity')}</span>
              <span className={t("components.production.productionorderstatscard.name.font_medium")}>{data.production_order?.quantity_kg} {t('common.kg')}</span>
            </div>
            <div className={t("components.production.productionorderstatscard.name.flex_justify_between_text_sm")}>
              <span className={t("components.production.productionorderstatscard.name.text_gray_600")}>{t('productionStats.finalQuantity')}</span>
              <span className={t("components.production.productionorderstatscard.name.font_medium")}>{data.production_order?.final_quantity_kg} {t('common.kg')}</span>
            </div>
            <div className={t("components.production.productionorderstatscard.name.flex_justify_between_text_sm")}>
              <span className={t("components.production.productionorderstatscard.name.text_gray_600")}>{t('productionStats.overrunPercentage')}</span>
              <span className={t("components.production.productionorderstatscard.name.font_medium")}>{data.production_order?.overrun_percentage}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}