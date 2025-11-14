import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatNumberAr } from "../../../shared/number-utils";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { 
  Package, 
  Printer,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Info,
  Clock
} from "lucide-react";

interface RollDetails {
  roll_id: number;
  roll_number: string;
  roll_seq: number;
  weight_kg: string | number;
  waste_kg: string | number;
  stage: string;
  roll_created_at: string;
  printed_at: string | null;
}

interface ProductionOrderWithRolls {
  production_order_id: number;
  production_order_number: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  rolls: RollDetails[];
  total_rolls: number;
  total_weight: number;
}

export default function PrintingOperatorDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [processingRollIds, setProcessingRollIds] = useState<Set<number>>(new Set());

  const { data: productionOrders = [], isLoading } = useQuery<ProductionOrderWithRolls[]>({
    queryKey: ["/api/rolls/active-for-printing"],
    refetchInterval: 30000,
  });

  const moveToPrintingMutation = useMutation({
    mutationFn: async (rollId: number) => {
      return await apiRequest(`/api/rolls/${rollId}`, {
        method: "PATCH",
        body: JSON.stringify({ stage: "printing" }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rolls/active-for-printing"] });
      toast({ title: t('toast.successGeneric'), description: t('toast.rollPrintedDesc'), variant: "default" });
    },
    onError: (error: Error) => {
      toast({ title: t('errors.genericError'), description: error.message || t('toast.errorMoveToPrinting'), variant: "destructive" });
    },
  });

  const handleMoveToPrinting = async (rollId: number) => {
    setProcessingRollIds(prev => new Set(prev).add(rollId));
    try {
      await moveToPrintingMutation.mutateAsync(rollId);
    } finally {
      setProcessingRollIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(rollId);
        return newSet;
      });
    }
  };

  const stats = {
    totalOrders: productionOrders.length,
    totalRolls: productionOrders.reduce((sum, order) => sum + order.total_rolls, 0),
    totalWeight: productionOrders.reduce((sum, order) => sum + order.total_weight, 0),
  };

  if (isLoading) {
    return (
      <div className={t("pages.name.min_h_screen_bg_gray_50")}>
        <Header />
        <div className={t("pages.name.flex")}>
          <Sidebar />
          <MobileNav />
          <main className={t("pages.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
            <div className={t("pages.name.flex_items_center_justify_center_h_96")}>
              <div className={t("pages.name.text_center")}>
                <Loader2 className={t("pages.name.h_12_w_12_animate_spin_text_primary_mx_auto_mb_4")} />
                <p className={t("pages.name.text_gray_600_text_lg")}>{t('printingOperator.loadingRolls')}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={t("pages.name.min_h_screen_bg_gray_50_dark_bg_gray_900")}>
      <Header />

      <div className={t("pages.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          <div className={t("pages.name.mb_6")}>
            <h1 className={t("pages.name.text_2xl_font_bold_text_gray_900_dark_text_gray_100_mb_2")}>{t('printingOperator.title')}</h1>
            <p className={t("pages.name.text_gray_600_dark_text_gray_400")}>{t('printingOperator.description')}</p>
          </div>

          <div className={t("pages.name.grid_grid_cols_1_md_grid_cols_3_gap_4_mb_6")}>
            <Card data-testid="card-active-orders">
              <CardHeader className={t("pages.name.pb_3")}>
                <CardTitle className={t("pages.name.text_sm_font_medium")}>{t('printingOperator.activeOrders')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.name.text_2xl_font_bold")} data-testid="stat-active-orders">{stats.totalOrders}</div>
                <p className={t("pages.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('filmOperator.productionOrder')}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-rolls">
              <CardHeader className={t("pages.name.pb_3")}>
                <CardTitle className={t("pages.name.text_sm_font_medium")}>{t('printingOperator.totalRolls')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.name.text_2xl_font_bold")} data-testid="stat-total-rolls">{stats.totalRolls}</div>
                <p className={t("pages.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('printingOperator.roll')}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-weight">
              <CardHeader className={t("pages.name.pb_3")}>
                <CardTitle className={t("pages.name.text_sm_font_medium")}>{t('printingOperator.totalWeight')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.name.text_2xl_font_bold")} data-testid="stat-total-weight">{formatNumberAr(stats.totalWeight)}</div>
                <p className={t("pages.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('warehouse.kg')}</p>
              </CardContent>
            </Card>
          </div>

          {productionOrders.length === 0 ? (
            <Card className={t("pages.name.p_8")} data-testid="card-no-rolls">
              <div className={t("pages.name.text_center")}>
                <Info className={t("pages.name.h_12_w_12_text_gray_400_mx_auto_mb_4")} />
                <h3 className={t("pages.name.text_lg_font_semibold_text_gray_900_dark_text_gray_100_mb_2")}>
                  {t('printingOperator.noActiveRolls')}
                </h3>
                <p className={t("pages.name.text_gray_600_dark_text_gray_400")} data-testid="text-no-rolls">
                  {t('printingOperator.noRollsDesc')}
                </p>
              </div>
            </Card>{t('pages.PrintingOperatorDashboard.)_:_(')}<div className={t("pages.name.grid_grid_cols_1_lg_grid_cols_2_gap_4")}>
              {productionOrders.map((order) => {
                const completedRolls = order.rolls.filter(r => r.printed_at).length;
                const progress = order.total_rolls >{t('pages.PrintingOperatorDashboard.0_?_(completedrolls_/_order.total_rolls)_*_100_:_0;_return_(')}<Card 
                    key={order.production_order_id} 
                    className={t("pages.name.transition_all_hover_shadow_lg")}
                    data-testid={`card-production-order-${order.production_order_id}`}
                  >
                    <CardHeader>
                      <div className={t("pages.name.flex_justify_between_items_start")}>
                        <div>
                          <CardTitle className={t("pages.name.text_lg")} data-testid={`text-order-number-${order.production_order_id}`}>
                            {order.production_order_number}
                          </CardTitle>
                          <CardDescription data-testid={`text-order-ref-${order.production_order_id}`}>
                            {t('orders.orderNumber')}: {order.order_number}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className={t("pages.name.bg_purple_100_text_purple_800")}>
                          <Printer className={t("pages.name.h_3_w_3_ml_1")} />
                          {order.total_rolls} {t('printingOperator.roll')}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className={t("pages.name.space_y_4")}>
                      <div className={t("pages.name.grid_grid_cols_2_gap_4_text_sm")}>
                        <div>
                          <p className={t("pages.name.text_gray_500_dark_text_gray_400")}>{t('orders.customer')}</p>
                          <p className={t("pages.name.font_medium")} data-testid={`text-customer-${order.production_order_id}`}>{order.customer_name}</p>
                        </div>
                        <div>
                          <p className={t("pages.name.text_gray_500_dark_text_gray_400")}>{t('orders.product')}</p>
                          <p className={t("pages.name.font_medium")} data-testid={`text-product-${order.production_order_id}`}>{order.product_name}</p>
                        </div>
                      </div>

                      <div className={t("pages.name.space_y_2")}>
                        <div className={t("pages.name.flex_justify_between_text_sm")}>
                          <span className={t("pages.name.text_gray_600_dark_text_gray_400")}>{t('filmOperator.progress')}</span>
                          <span className={t("pages.name.font_medium")} data-testid={`text-progress-${order.production_order_id}`}>
                            {completedRolls} / {order.total_rolls} {t('printingOperator.roll')}
                          </span>
                        </div>
                        <Progress value={progress} className={t("pages.name.h_2")} data-testid={`progress-bar-${order.production_order_id}`} />
                      </div>

                      <div className={t("pages.name.flex_items_center_gap_2_text_sm")}>
                        <Package className={t("pages.name.h_4_w_4_text_gray_400")} />
                        <span className={t("pages.name.text_gray_600_dark_text_gray_400")}>{t('production.totalWeight')}:</span>
                        <span className={t("pages.name.font_medium")}>{formatNumberAr(order.total_weight)} {t('warehouse.kg')}</span>
                      </div>

                      <div className={t("pages.name.space_y_2")}>
                        <p className={t("pages.name.text_sm_font_medium_text_gray_900_dark_text_gray_100")}>{t('printingOperator.rollsReadyForPrinting')}:</p>
                        <div className={t("pages.name.space_y_2_max_h_48_overflow_y_auto")}>
                          {order.rolls.map((roll) => (
                            <div 
                              key={roll.roll_id}
                              className={t("pages.name.flex_items_center_justify_between_p_3_bg_gray_50_dark_bg_gray_800_rounded_lg_border_border_gray_200_dark_border_gray_700")}
                              data-testid={`roll-item-${roll.roll_id}`}
                            >
                              <div className={t("pages.name.flex_1")}>
                                <div className={t("pages.name.flex_items_center_gap_2")}>
                                  <span className={t("pages.name.font_medium_text_sm")} data-testid={`text-roll-number-${roll.roll_id}`}>
                                    {roll.roll_number}
                                  </span>
                                </div>
                                <div className={t("pages.name.text_xs_text_gray_600_dark_text_gray_400_mt_1")}>
                                  {t('production.weight')}: {formatNumberAr(Number(roll.weight_kg))} {t('warehouse.kg')}
                                </div>
                              </div>
                              
                              <Button
                                onClick={() => handleMoveToPrinting(roll.roll_id)}
                                disabled={processingRollIds.has(roll.roll_id)}
                                size="sm"
                                data-testid={`button-move-to-printing-${roll.roll_id}`}
                              >
                                {processingRollIds.has(roll.roll_id) ? (
                                  <Loader2 className={t("pages.name.h_4_w_4_animate_spin")} />{t('pages.PrintingOperatorDashboard.)_:_(')}<>
                                    <Printer className={t("pages.name.h_4_w_4_ml_1")} />
                                    <span className={t("pages.name.hidden_sm_inline")}>{t('production.printing')}</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
