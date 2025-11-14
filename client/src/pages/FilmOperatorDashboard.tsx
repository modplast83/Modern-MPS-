import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import RollCreationModalEnhanced from "../components/modals/RollCreationModalEnhanced";
import FilmMaterialMixingTab from "../components/production/FilmMaterialMixingTab";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatNumberAr } from "../../../shared/number-utils";
import { printRollLabel } from "../components/production/RollLabelPrint";
import { 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Plus,
  Flag,
  Loader2,
  Info,
  Printer,
  User,
  Beaker
} from "lucide-react";

// تعريف نوع البيانات لأمر الإنتاج النشط للعامل
interface ActiveProductionOrderDetails {
  id: number;
  production_order_number: string;
  order_id: number;
  customer_product_id: number;
  quantity_kg: string | number;
  final_quantity_kg: string | number;
  produced_quantity_kg?: string | number;
  status: string;
  created_at: string;
  order_number: string;
  customer_name: string;
  product_name: string;
  rolls_count: number;
  total_weight_produced: string | number;
  remaining_quantity: string | number;
  is_final_roll_created: boolean;
  film_completed?: boolean;
  production_start_time?: string;
  production_end_time?: string;
  production_time_minutes?: number;
}

interface Roll {
  id: number;
  roll_number: string;
  roll_seq: number;
  weight_kg: number | string;
  status: string;
  created_by_name?: string;
  created_at?: string;
  production_order_id: number;
  production_order_number?: string;
  machine_id?: string;
  film_machine_id?: string;
  film_machine_name?: string;
  qr_code_text?: string;
  qr_png_base64?: string;
}

export default function FilmOperatorDashboard() {
  const { t } = useTranslation();
  const [selectedProductionOrder, setSelectedProductionOrder] = useState<ActiveProductionOrderDetails | null>{t('pages.FilmOperatorDashboard.(null);_const_[ismodalopen,_setismodalopen]_=_usestate(false);_const_[isfinalroll,_setisfinalroll]_=_usestate(false);_const_[expandedorders,_setexpandedorders]_=_usestate')}<Set<number>>(new Set());

  // Fetch active production orders for operator
  const { data: productionOrders = [], isLoading } = useQuery<ActiveProductionOrderDetails[]>({
    queryKey: ["/api/production-orders/active-for-operator"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch all rolls data
  const { data: allRolls = [] } = useQuery<Roll[]>({
    queryKey: ["/api/rolls"],
    refetchInterval: 30000,
  });

  const handleCreateRoll = (order: ActiveProductionOrderDetails, final: boolean = false) => {
    setSelectedProductionOrder(order);
    setIsFinalRoll(final);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductionOrder(null);
    setIsFinalRoll(false);
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handlePrintLabel = async (roll: Roll) => {
    try {
      const response = await fetch(`/api/rolls/${roll.id}/label`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const labelData = await response.json();
      
      if (!labelData || !labelData.roll) {
        throw new Error("Invalid label data received");
      }
      
      printRollLabel({
        roll: labelData.roll,
        productionOrder: labelData.productionOrder,
        order: labelData.order
      });
    } catch (error) {
      console.error("Error printing label:", error);
      alert(`${t('toast.errorPrintLabel')}: ${error instanceof Error ? error.message : t('errors.unknownError')}`);
    }
  };

  // Calculate overall statistics
  const stats = {
    totalOrders: productionOrders.length,
    totalRequired: productionOrders.reduce((sum: number, order: ActiveProductionOrderDetails) => 
      sum + Number(order.final_quantity_kg || order.quantity_kg || 0), 0),
    totalProduced: productionOrders.reduce((sum: number, order: ActiveProductionOrderDetails) => 
      sum + Number(order.total_weight_produced || 0), 0),
    ordersNearCompletion: productionOrders.filter((order: ActiveProductionOrderDetails) => {
      const progress = (Number(order.total_weight_produced || 0) / Number(order.final_quantity_kg || 1)) * 100;
      return progress >= 80 && !order.is_final_roll_created;
    }).length,
  };

  if (isLoading) {
    return (
      <div className={t("pages.filmoperatordashboard.name.min_h_screen_bg_gray_50")}>
        <Header />
        <div className={t("pages.filmoperatordashboard.name.flex")}>
          <Sidebar />
          <MobileNav />
          <main className={t("pages.filmoperatordashboard.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
            <div className={t("pages.filmoperatordashboard.name.flex_items_center_justify_center_h_96")}>
              <div className={t("pages.filmoperatordashboard.name.text_center")}>
                <Loader2 className={t("pages.filmoperatordashboard.name.h_12_w_12_animate_spin_text_primary_mx_auto_mb_4")} />
                <p className={t("pages.filmoperatordashboard.name.text_gray_600")}>{t('filmOperator.loadingOrders')}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={t("pages.filmoperatordashboard.name.min_h_screen_bg_gray_50_dark_bg_gray_900")}>
      <Header />

      <div className={t("pages.filmoperatordashboard.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.filmoperatordashboard.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          {/* Page Header */}
          <div className={t("pages.filmoperatordashboard.name.mb_6")}>
            <h1 className={t("pages.filmoperatordashboard.name.text_2xl_font_bold_text_gray_900_dark_text_gray_100_mb_2")}>
              {t('filmOperator.title')}
            </h1>
            <p className={t("pages.filmoperatordashboard.name.text_gray_600_dark_text_gray_400")}>
              {t('filmOperator.description')}
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="production" className={t("pages.filmoperatordashboard.name.space_y_6")}>
            <TabsList className={t("pages.filmoperatordashboard.name.grid_w_full_max_w_md_grid_cols_2")}>
              <TabsTrigger value="production" className={t("pages.filmoperatordashboard.name.flex_items_center_gap_2")} data-testid="tab-production">
                <Package className={t("pages.filmoperatordashboard.name.h_4_w_4")} />
                {t('production.productionOrders')}
              </TabsTrigger>
              <TabsTrigger value="mixing" className={t("pages.filmoperatordashboard.name.flex_items_center_gap_2")} data-testid="tab-mixing">
                <Beaker className={t("pages.filmoperatordashboard.name.h_4_w_4")} />
                {t('production.filmMaterialMixing')}
              </TabsTrigger>
            </TabsList>

            {/* Production Tab */}
            <TabsContent value="production" className={t("pages.filmoperatordashboard.name.space_y_6")}>
          {/* Statistics Cards */}
          <div className={t("pages.filmoperatordashboard.name.grid_grid_cols_1_md_grid_cols_4_gap_4_mb_6")}>
            <Card data-testid="card-active-orders">
              <CardHeader className={t("pages.filmoperatordashboard.name.pb_3")}>
                <CardTitle className={t("pages.filmoperatordashboard.name.text_sm_font_medium")}>{t('filmOperator.activeOrders')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.filmoperatordashboard.name.text_2xl_font_bold")} data-testid="stat-active-orders">{stats.totalOrders}</div>
                <p className={t("pages.filmoperatordashboard.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('filmOperator.productionOrder')}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-required">
              <CardHeader className={t("pages.filmoperatordashboard.name.pb_3")}>
                <CardTitle className={t("pages.filmoperatordashboard.name.text_sm_font_medium")}>{t('filmOperator.requiredQuantity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.filmoperatordashboard.name.text_2xl_font_bold")} data-testid="stat-total-required">{formatNumberAr(stats.totalRequired)}</div>
                <p className={t("pages.filmoperatordashboard.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('warehouse.kg')}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-total-produced">
              <CardHeader className={t("pages.filmoperatordashboard.name.pb_3")}>
                <CardTitle className={t("pages.filmoperatordashboard.name.text_sm_font_medium")}>{t('filmOperator.producedQuantity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.filmoperatordashboard.name.text_2xl_font_bold")} data-testid="stat-total-produced">{formatNumberAr(stats.totalProduced)}</div>
                <p className={t("pages.filmoperatordashboard.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('warehouse.kg')}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-near-completion">
              <CardHeader className={t("pages.filmoperatordashboard.name.pb_3")}>
                <CardTitle className={t("pages.filmoperatordashboard.name.text_sm_font_medium")}>{t('filmOperator.nearCompletion')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("pages.filmoperatordashboard.name.text_2xl_font_bold_text_orange_600_dark_text_orange_400")} data-testid="stat-near-completion">
                  {stats.ordersNearCompletion}
                </div>
                <p className={t("pages.filmoperatordashboard.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('filmOperator.productionOrder')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Production Orders List */}
          {productionOrders.length === 0 ? (
            <Card className={t("pages.filmoperatordashboard.name.p_8")} data-testid="card-no-orders">
              <div className={t("pages.filmoperatordashboard.name.text_center")}>
                <Info className={t("pages.filmoperatordashboard.name.h_12_w_12_text_gray_400_mx_auto_mb_4")} />
                <h3 className={t("pages.filmoperatordashboard.name.text_lg_font_semibold_text_gray_900_dark_text_gray_100_mb_2")}>
                  {t('filmOperator.noActiveOrders')}
                </h3>
                <p className={t("pages.filmoperatordashboard.name.text_gray_600_dark_text_gray_400")} data-testid="text-no-orders">
                  {t('filmOperator.noActiveOrdersInFilm')}
                </p>
              </div>
            </Card>{t('pages.FilmOperatorDashboard.)_:_(')}<div className={t("pages.filmoperatordashboard.name.grid_grid_cols_1_lg_grid_cols_2_gap_4")}>
              {productionOrders.map((order: ActiveProductionOrderDetails) => {
                const progress = (Number(order.total_weight_produced || 0) / Number(order.final_quantity_kg || 1)) * 100;
                const isNearCompletion = progress >{t('pages.FilmOperatorDashboard.=_80;_const_iscomplete_=_order.is_final_roll_created;_return_(')}<Card 
                    key={order.id} 
                    className={`${isComplete ? 'opacity-60' : ''} transition-all hover:shadow-lg`}
                    data-testid={`card-production-order-${order.id}`}
                  >
                    <CardHeader>
                      <div className={t("pages.filmoperatordashboard.name.flex_justify_between_items_start")}>
                        <div>
                          <CardTitle className={t("pages.filmoperatordashboard.name.text_lg")} data-testid={`text-order-number-${order.id}`}>
                            {order.production_order_number}
                          </CardTitle>
                          <CardDescription data-testid={`text-order-ref-${order.id}`}>
                            {t('orders.orderNumber')}: {order.order_number}
                          </CardDescription>
                        </div>
                        <div className={t("pages.filmoperatordashboard.name.flex_gap_2")}>
                          {isComplete && (
                            <Badge variant="secondary" className={t("pages.filmoperatordashboard.name.bg_green_100_text_green_800")} data-testid={`badge-complete-${order.id}`}>
                              <CheckCircle2 className={t("pages.filmoperatordashboard.name.h_3_w_3_ml_1")} />
                              {t('production.completed')}
                            </Badge>
                          )}
                          {isNearCompletion && !isComplete && (
                            <Badge variant="secondary" className={t("pages.filmoperatordashboard.name.bg_orange_100_text_orange_800")} data-testid={`badge-near-completion-${order.id}`}>
                              <AlertTriangle className={t("pages.filmoperatordashboard.name.h_3_w_3_ml_1")} />
                              {t('filmOperator.nearCompletion')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className={t("pages.filmoperatordashboard.name.space_y_4")}>
                      {/* Customer and Product Info */}
                      <div className={t("pages.filmoperatordashboard.name.grid_grid_cols_2_gap_4_text_sm")}>
                        <div>
                          <p className={t("pages.filmoperatordashboard.name.text_gray_500_dark_text_gray_400")}>{t('orders.customer')}</p>
                          <p className={t("pages.filmoperatordashboard.name.font_medium")} data-testid={`text-customer-${order.id}`}>{order.customer_name}</p>
                        </div>
                        <div>
                          <p className={t("pages.filmoperatordashboard.name.text_gray_500_dark_text_gray_400")}>{t('orders.product')}</p>
                          <p className={t("pages.filmoperatordashboard.name.font_medium")} data-testid={`text-product-${order.id}`}>{order.product_name}</p>
                        </div>
                      </div>

                      {/* Quantities */}
                      <div className={t("pages.filmoperatordashboard.name.space_y_2")}>
                        <div className={t("pages.filmoperatordashboard.name.flex_justify_between_text_sm")}>
                          <span className={t("pages.filmoperatordashboard.name.text_gray_600_dark_text_gray_400")}>{t('filmOperator.requiredQuantity')}</span>
                          <span className={t("pages.filmoperatordashboard.name.font_medium")} data-testid={`text-required-qty-${order.id}`}>{formatNumberAr(Number(order.final_quantity_kg))} {t('warehouse.kg')}</span>
                        </div>
                        <div className={t("pages.filmoperatordashboard.name.flex_justify_between_text_sm")}>
                          <span className={t("pages.filmoperatordashboard.name.text_gray_600_dark_text_gray_400")}>{t('filmOperator.producedQuantity')}</span>
                          <span className={t("pages.filmoperatordashboard.name.font_medium")} data-testid={`text-produced-qty-${order.id}`}>{formatNumberAr(Number(order.total_weight_produced))} {t('warehouse.kg')}</span>
                        </div>
                        <div className={t("pages.filmoperatordashboard.name.flex_justify_between_text_sm")}>
                          <span className={t("pages.filmoperatordashboard.name.text_gray_600_dark_text_gray_400")}>{t('filmOperator.remainingQuantity')}</span>
                          <span className={t("pages.filmoperatordashboard.name.font_medium_text_orange_600")} data-testid={`text-remaining-qty-${order.id}`}>
                            {formatNumberAr(Number(order.remaining_quantity))} {t('warehouse.kg')}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className={t("pages.filmoperatordashboard.name.space_y_2")}>
                        <div className={t("pages.filmoperatordashboard.name.flex_justify_between_text_sm")}>
                          <span className={t("pages.filmoperatordashboard.name.text_gray_600_dark_text_gray_400")}>{t('filmOperator.progress')}</span>
                          <span className={t("pages.filmoperatordashboard.name.font_medium")} data-testid={`text-progress-${order.id}`}>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className={t("pages.filmoperatordashboard.name.h_2")} data-testid={`progress-bar-${order.id}`} />
                      </div>

                      {/* Rolls Info */}
                      <div className={t("pages.filmoperatordashboard.name.flex_items_center_gap_4_text_sm")}>
                        <div className={t("pages.filmoperatordashboard.name.flex_items_center_gap_2")}>
                          <Package className={t("pages.filmoperatordashboard.name.h_4_w_4_text_gray_400")} />
                          <span className={t("pages.filmoperatordashboard.name.text_gray_600_dark_text_gray_400")}>{t('filmOperator.rollsCount')}:</span>
                          <span className={t("pages.filmoperatordashboard.name.font_medium")} data-testid={`text-rolls-count-${order.id}`}>{order.rolls_count}</span>
                        </div>
                        {order.production_start_time && (
                          <div className={t("pages.filmoperatordashboard.name.flex_items_center_gap_2")}>
                            <Clock className={t("pages.filmoperatordashboard.name.h_4_w_4_text_gray_400")} />
                            <span className={t("pages.filmoperatordashboard.name.text_gray_600_dark_text_gray_400")}>{t('filmOperator.startedSince')}:</span>
                            <span className={t("pages.filmoperatordashboard.name.font_medium")}>
                              {(() => {
                                const startTime = new Date(order.production_start_time).getTime();
                                const now = Date.now();
                                const diffMinutes = Math.floor((now - startTime) / (1000 * 60));
                                if (diffMinutes < 60) return `${diffMinutes} ${t('filmOperator.minutes')}`;
                                const hours = Math.floor(diffMinutes / 60);
                                const minutes = diffMinutes % 60;
                                return `${hours}${t('filmOperator.hours')} ${minutes}${t('filmOperator.mins')}`;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Display Rolls for this order */}
                      {order.rolls_count >{t('pages.FilmOperatorDashboard.0_&&_(')}<div className={t("pages.filmoperatordashboard.name.space_y_2")}>
                          <div className={t("pages.filmoperatordashboard.name.flex_items_center_justify_between")}>
                            <button
                              onClick={() => toggleOrderExpansion(order.id)}
                              className={t("pages.filmoperatordashboard.name.text_sm_font_medium_text_blue_600_dark_text_blue_400_hover_underline_flex_items_center_gap_1")}
                              data-testid={`button-toggle-rolls-${order.id}`}
                            >
                              {expandedOrders.has(order.id) ? '▼' : '◀'} {t('filmOperator.viewRolls')} ({order.rolls_count})
                            </button>
                          </div>
                          
                          {expandedOrders.has(order.id) && (
                            <div className={t("pages.filmoperatordashboard.name.grid_grid_cols_2_md_grid_cols_3_gap_2_mt_2")}>
                              {allRolls
                                .filter(roll => roll.production_order_id === order.id)
                                .sort((a, b) => a.roll_seq - b.roll_seq)
                                .map((roll) => (
                                  <div
                                    key={roll.id}
                                    className={t("pages.filmoperatordashboard.name.bg_blue_50_dark_bg_blue_900_20_border_border_blue_200_dark_border_blue_800_rounded_lg_p_3_hover_shadow_md_transition_shadow")}
                                    data-testid={`roll-card-${roll.id}`}
                                  >
                                    <div className={t("pages.filmoperatordashboard.name.flex_items_start_justify_between_mb_2")}>
                                      <div className={t("pages.filmoperatordashboard.name.flex_1")}>
                                        <div className={t("pages.filmoperatordashboard.name.font_bold_text_sm_text_blue_900_dark_text_blue_100")} data-testid={`roll-number-${roll.id}`}>
                                          {roll.roll_number}
                                        </div>
                                        <div className={t("pages.filmoperatordashboard.name.text_xs_text_blue_700_dark_text_blue_300_mt_1")}>
                                          {t('filmOperator.rollHash')}{roll.roll_seq}
                                        </div>
                                      </div>
                                      <Badge 
                                        variant="secondary" 
                                        className={t("pages.filmoperatordashboard.name.text_xs_bg_blue_100_dark_bg_blue_800_text_blue_800_dark_text_blue_100")}
                                      >
                                        {roll.status}
                                      </Badge>
                                    </div>
                                    
                                    <div className={t("pages.filmoperatordashboard.name.space_y_1_text_xs")}>
                                      <div className={t("pages.filmoperatordashboard.name.flex_items_center_gap_1_text_blue_800_dark_text_blue_200")}>
                                        <Package className={t("pages.filmoperatordashboard.name.h_3_w_3")} />
                                        <span className={t("pages.filmoperatordashboard.name.font_medium")}>{formatNumberAr(Number(roll.weight_kg))} كجم</span>
                                      </div>
                                      
                                      {roll.created_by_name && (
                                        <div className={t("pages.filmoperatordashboard.name.flex_items_center_gap_1_text_blue_700_dark_text_blue_300")}>
                                          <User className={t("pages.filmoperatordashboard.name.h_3_w_3")} />
                                          <span>{roll.created_by_name}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <Button
                                      onClick={() => handlePrintLabel(roll)}
                                      size="sm"
                                      variant="outline"
                                      className={t("pages.filmoperatordashboard.name.w_full_mt_2_h_7_text_xs_bg_white_dark_bg_gray_800_border_blue_300_dark_border_blue_700_hover_bg_blue_50_dark_hover_bg_blue_900_30")}
                                      data-testid={`button-print-label-${roll.id}`}
                                    >
                                      <Printer className={t("pages.filmoperatordashboard.name.h_3_w_3_ml_1")} />
                                      {t('production.printLabel')}
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className={t("pages.filmoperatordashboard.name.flex_gap_2_pt_2")}>
                        {!isComplete && (
                          <>
                            <Button
                              onClick={() => handleCreateRoll(order, false)}
                              className={t("pages.filmoperatordashboard.name.flex_1")}
                              variant="default"
                              data-testid={`button-create-roll-${order.id}`}
                            >
                              <Plus className={t("pages.filmoperatordashboard.name.h_4_w_4_ml_2")} />
                              {t('filmOperator.createNewRoll')}
                            </Button>
                            
                            {order.rolls_count >{t('pages.FilmOperatorDashboard.0_&&_(')}<Button
                                onClick={() => handleCreateRoll(order, true)}
                                variant="destructive"
                                data-testid={`button-final-roll-${order.id}`}
                              >
                                <Flag className={t("pages.filmoperatordashboard.name.h_4_w_4_ml_2")} />
                                {t('filmOperator.finalRoll')}
                              </Button>
                            )}
                          </>
                        )}
                        
                        {isComplete && (
                          <div className={t("pages.filmoperatordashboard.name.flex_1_bg_green_50_dark_bg_green_900_20_border_border_green_200_dark_border_green_800_rounded_lg_p_3")}>
                            <div className={t("pages.filmoperatordashboard.name.flex_items_center_gap_2")}>
                              <CheckCircle2 className={t("pages.filmoperatordashboard.name.h_4_w_4_text_green_600_dark_text_green_400")} />
                              <div className={t("pages.filmoperatordashboard.name.text_sm")}>
                                <p className={t("pages.filmoperatordashboard.name.font_medium_text_green_900_dark_text_green_100")}>
                                  {t('production.filmComplete')}
                                </p>
                                {order.production_time_minutes && (
                                  <p className={t("pages.filmoperatordashboard.name.text_xs_text_green_700_dark_text_green_300")}>
                                    {t('filmOperator.totalProductionTime')}: {order.production_time_minutes} {t('filmOperator.minutes')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
            </TabsContent>

            {/* Material Mixing Tab */}
            <TabsContent value="mixing" className={t("pages.filmoperatordashboard.name.space_y_6")}>
              <FilmMaterialMixingTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Roll Creation Modal */}
      {selectedProductionOrder && (
        <RollCreationModalEnhanced
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          productionOrderId={selectedProductionOrder.id}
          productionOrderData={selectedProductionOrder}
          isFinalRoll={isFinalRoll}
        />
      )}
    </div>
  );
}