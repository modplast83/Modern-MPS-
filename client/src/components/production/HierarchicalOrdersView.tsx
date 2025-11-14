import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { ChevronDown, ChevronRight, Eye, Plus, Search, Printer } from "lucide-react";
import { formatNumber, formatWeight } from "../../lib/formatNumber";
import { printRollLabel } from "./RollLabelPrint";
import { useTranslation } from "react-i18next";

interface HierarchicalOrdersViewProps {
  stage: string;
  onCreateRoll: (productionOrderId?: number) => void;
}

const formatPercentage = (value: number): string => {
  return `${value}%`;
};

export default function HierarchicalOrdersView({
  stage,
  onCreateRoll,
}: HierarchicalOrdersViewProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>{t('components.production.HierarchicalOrdersView.(new_set());_const_[expandedproductionorders,_setexpandedproductionorders]_=_usestate')}<
    Set<number>
  >(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ordersData = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/production/hierarchical-orders"],
    refetchInterval: 90000, // Reduced from 30s to 90s (1.5 minutes)
    staleTime: 60000, // Cache for 1 minute to reduce server load
    gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
  });

  // تنظيف الاستعلامات عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      // Cancel all queries for this component when unmounting
      queryClient.cancelQueries({
        queryKey: ["/api/production/hierarchical-orders"],
      });
    };
  }, [queryClient]);

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const toggleProductionOrderExpansion = (productionOrderId: number) => {
    const newExpanded = new Set(expandedProductionOrders);
    if (newExpanded.has(productionOrderId)) {
      newExpanded.delete(productionOrderId);
    } else {
      newExpanded.add(productionOrderId);
    }
    setExpandedProductionOrders(newExpanded);
  };

  // Filter based on search term and stage requirements
  const filteredOrders = ordersData.filter((order) => {
    // For film stage, show only orders with "for_production" status
    if (stage === "film" && order.status !== "for_production") {
      return false;
    }

    // Apply search filter if search term is provided
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    // Search in order number and customer name
    const orderMatch =
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_name_ar?.toLowerCase().includes(searchLower);

    // Search in production orders
    const productionOrderMatch = order.production_orders?.some(
      (productionOrder: any) =>
        productionOrder.production_order_number
          ?.toLowerCase()
          .includes(searchLower) ||
        productionOrder.item_name?.toLowerCase().includes(searchLower) ||
        productionOrder.item_name_ar?.toLowerCase().includes(searchLower),
    );

    // Search in rolls
    const rollMatch = order.production_orders?.some((productionOrder: any) =>
      productionOrder.rolls?.some((roll: any) =>
        roll.roll_number?.toLowerCase().includes(searchLower),
      ),
    );

    return orderMatch || productionOrderMatch || rollMatch;
  });

  if (isLoading) {
    return (
      <div className={t("components.production.hierarchicalordersview.name.space_y_4")}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={t("components.production.hierarchicalordersview.name.h_24_bg_muted_animate_pulse_rounded")}></div>
        ))}
      </div>
    );
  }

  return (
    <div className={t("components.production.hierarchicalordersview.name.space_y_4")}>
      {/* Search Bar */}
      <div className={t("components.production.hierarchicalordersview.name.relative")}>
        <Search className={t("components.production.hierarchicalordersview.name.absolute_left_3_top_1_2_transform_translate_y_1_2_text_muted_foreground_h_4_w_4")} />
        <Input
          placeholder={t("production.searchOrdersProductionOrdersRollsOrCustomers")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={t("components.production.hierarchicalordersview.name.pl_10")}
          data-testid="input-search-orders"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className={t("components.production.hierarchicalordersview.name.text_center_py_8")}>
          <p className={t("components.production.hierarchicalordersview.name.text_muted_foreground")}>
            {searchTerm
              ? t("common.noSearchResults")
              : t("production.noOrdersInProduction")}
          </p>
        </div>
      ) : (
        filteredOrders.map((order) => (
          <Card key={order.id} className={t("components.production.hierarchicalordersview.name.border_l_4_border_l_blue_500")}>
            <CardHeader className={t("components.production.hierarchicalordersview.name.pb_3")}>
              <div className={t("components.production.hierarchicalordersview.name.flex_items_center_justify_between")}>
                <div className={t("components.production.hierarchicalordersview.name.flex_items_center_gap_3")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOrderExpansion(order.id)}
                    data-testid={`button-expand-order-${order.id}`}
                  >
                    {expandedOrders.has(order.id) ? (
                      <ChevronDown className={t("components.production.hierarchicalordersview.name.h_4_w_4")} />{t('components.production.HierarchicalOrdersView.)_:_(')}<ChevronRight className={t("components.production.hierarchicalordersview.name.h_4_w_4")} />
                    )}
                  </Button>
                  <div>
                    <CardTitle className={t("components.production.hierarchicalordersview.name.text_lg")}>
                      {order.order_number}
                    </CardTitle>
                    <p className={t("components.production.hierarchicalordersview.name.text_base_font_bold_text_blue_700")}>
                      {t("common.customer")}:{" "}
                      {order.customer_name_ar ||
                        order.customer_name ||
                        t("common.notSpecified")}
                    </p>
                  </div>
                </div>
                <div className={t("components.production.hierarchicalordersview.name.flex_items_center_gap_2")}>
                  <Badge variant="outline">
                    {order.production_orders?.length || 0} {t("production.productionOrders")}
                  </Badge>
                  <Badge
                    variant="secondary"
                    data-testid={`badge-order-status-${order.id}`}
                  >
                    {order.status === "for_production"
                      ? t("orders.forProduction")
                      : order.status === "pending"
                        ? t("common.pending")
                        : order.status === "in_production"
                          ? t("orders.inProduction")
                          : order.status === "completed"
                            ? t("common.completed")
                            : order.status === "cancelled"
                              ? t("common.cancelled")
                              : order.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {expandedOrders.has(order.id) && (
              <CardContent className={t("components.production.hierarchicalordersview.name.pt_0")}>
                {order.production_orders &&
                order.production_orders.length >{t('components.production.HierarchicalOrdersView.0_?_(')}<div className={t("components.production.hierarchicalordersview.name.space_y_3")}>
                    {order.production_orders.map((productionOrder: any) => {
                      const required =
                        parseFloat(productionOrder.quantity_kg) || 0;
                      const produced = productionOrder.rolls
                        ? productionOrder.rolls.reduce(
                            (sum: number, roll: any) =>
                              sum + (parseFloat(roll.weight_kg) || 0),
                            0,
                          )
                        : 0;
                      const progress =
                        required >{t('components.production.HierarchicalOrdersView.0_?_math.round((produced_/_required)_*_100)_:_0;_return_(')}<Card
                          key={productionOrder.id}
                          className={t("components.production.hierarchicalordersview.name.border_border_gray_200_ml_6")}
                        >
                          <CardContent className={t("components.production.hierarchicalordersview.name.p_4")}>
                            <div className={t("components.production.hierarchicalordersview.name.flex_items_center_justify_between")}>
                              <div className={t("components.production.hierarchicalordersview.name.flex_items_center_gap_3")}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleProductionOrderExpansion(
                                      productionOrder.id,
                                    )
                                  }
                                  data-testid={`button-expand-production-order-${productionOrder.id}`}
                                >
                                  {expandedProductionOrders.has(
                                    productionOrder.id,
                                  ) ? (
                                    <ChevronDown className={t("components.production.hierarchicalordersview.name.h_4_w_4")} />{t('components.production.HierarchicalOrdersView.)_:_(')}<ChevronRight className={t("components.production.hierarchicalordersview.name.h_4_w_4")} />
                                  )}
                                </Button>
                                <div>
                                  <h4 className={t("components.production.hierarchicalordersview.name.font_medium")}>
                                    {productionOrder.production_order_number}
                                  </h4>
                                  <p className={t("components.production.hierarchicalordersview.name.text_sm_text_muted_foreground")}>
                                    {productionOrder.item_name_ar ||
                                      productionOrder.item_name ||
                                      t("common.notSpecified")}
                                  </p>
                                  <div className={t("components.production.hierarchicalordersview.name.grid_grid_cols_2_gap_x_4_gap_y_1_mt_2_text_xs")}>
                                    {productionOrder.size_caption && (
                                      <div>
                                        <span className={t("components.production.hierarchicalordersview.name.font_medium")}>
                                          {t("production.size")}:{" "}
                                        </span>
                                        <span className={t("components.production.hierarchicalordersview.name.text_muted_foreground")}>
                                          {productionOrder.size_caption}
                                        </span>
                                      </div>
                                    )}
                                    {productionOrder.thickness && (
                                      <div>
                                        <span className={t("components.production.hierarchicalordersview.name.font_medium")}>
                                          {t("production.thickness")}:{" "}
                                        </span>
                                        <span className={t("components.production.hierarchicalordersview.name.text_muted_foreground")}>
                                          {productionOrder.thickness}
                                        </span>
                                      </div>
                                    )}
                                    {productionOrder.raw_material && (
                                      <div>
                                        <span className={t("components.production.hierarchicalordersview.name.font_medium")}>
                                          {t("production.rawMaterial")}:{" "}
                                        </span>
                                        <span className={t("components.production.hierarchicalordersview.name.text_muted_foreground")}>
                                          {productionOrder.raw_material}
                                        </span>
                                      </div>
                                    )}
                                    {productionOrder.master_batch_id && (
                                      <div>
                                        <span className={t("components.production.hierarchicalordersview.name.font_medium")}>
                                          {t("production.masterBatchColor")}:{" "}
                                        </span>
                                        <span className={t("components.production.hierarchicalordersview.name.text_muted_foreground")}>
                                          {productionOrder.master_batch_id}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <span className={t("components.production.hierarchicalordersview.name.font_medium")}>
                                        {t("production.printing")}:{" "}
                                      </span>
                                      <span className={t("components.production.hierarchicalordersview.name.text_muted_foreground")}>
                                        {productionOrder.is_printed
                                          ? t("common.yes")
                                          : t("common.no")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className={t("components.production.hierarchicalordersview.name.flex_items_center_gap_4")}>
                                <div className={t("components.production.hierarchicalordersview.name.text_sm")}>
                                  <span className={t("components.production.hierarchicalordersview.name.text_muted_foreground")}>
                                    {t("production.quantity")}:{" "}
                                  </span>
                                  {formatWeight(produced)} /{" "}
                                  {formatWeight(required)}
                                </div>
                                <div className={t("components.production.hierarchicalordersview.name.w_24")}>
                                  <Progress value={progress} className={t("components.production.hierarchicalordersview.name.h_2")} />
                                  <span className={t("components.production.hierarchicalordersview.name.text_xs_text_muted_foreground")}>
                                    {formatPercentage(progress)}
                                  </span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    onCreateRoll(productionOrder.id)
                                  }
                                  data-testid={`button-create-roll-${productionOrder.id}`}
                                >
                                  <Plus className={t("components.production.hierarchicalordersview.name.h_4_w_4")} />
                                </Button>
                              </div>
                            </div>

                            {expandedProductionOrders.has(productionOrder.id) &&
                              productionOrder.rolls && (
                                <div className={t("components.production.hierarchicalordersview.name.mt_4_ml_6_space_y_2")}>
                                  <h5 className={t("components.production.hierarchicalordersview.name.text_sm_font_medium_text_gray_700_mb_2")}>
                                    {t("production.rolls")} ({productionOrder.rolls.length})
                                  </h5>
                                  {productionOrder.rolls.length === 0 ? (
                                    <p className={t("components.production.hierarchicalordersview.name.text_sm_text_muted_foreground")}>
                                      {t("production.noRollsYet")}
                                    </p>{t('components.production.HierarchicalOrdersView.)_:_(')}<div className={t("components.production.hierarchicalordersview.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_2")}>
                                      {productionOrder.rolls.map(
                                        (roll: any) => (
                                          <div
                                            key={roll.id}
                                            className={t("components.production.hierarchicalordersview.name.border_rounded_p_3_bg_gray_50_hover_bg_gray_100_transition_colors")}
                                            data-testid={`roll-item-${roll.id}`}
                                          >
                                            <div className={t("components.production.hierarchicalordersview.name.flex_justify_between_items_start_mb_2")}>
                                              <div className={t("components.production.hierarchicalordersview.name.flex_1")}>
                                                <p className={t("components.production.hierarchicalordersview.name.font_medium_text_sm")}>
                                                  {roll.roll_number}
                                                </p>
                                                <p className={t("components.production.hierarchicalordersview.name.text_xs_text_muted_foreground")}>
                                                  {t("production.weight")}:{" "}
                                                  {formatWeight(
                                                    parseFloat(
                                                      roll.weight_kg,
                                                    ) || 0,
                                                  )}
                                                </p>
                                                <p className={t("components.production.hierarchicalordersview.name.text_xs_text_muted_foreground")}>
                                                  {t("production.stage")}:{" "}
                                                  {roll.stage === "film"
                                                    ? t("production.film")
                                                    : roll.stage === "printing"
                                                      ? t("production.printing")
                                                      : roll.stage === "cutting"
                                                        ? t("production.cutting")
                                                        : roll.stage}
                                                </p>
                                              </div>
                                              <Badge
                                                variant={
                                                  roll.stage === "done"
                                                    ? "default"
                                                    : "secondary"
                                                }
                                                className={t("components.production.hierarchicalordersview.name.text_xs")}
                                              >
                                                {roll.stage === "done"
                                                  ? t("common.completed")
                                                  : roll.stage === "film"
                                                    ? t("production.film")
                                                    : roll.stage === "printing"
                                                      ? t("production.printing")
                                                      : roll.stage === "cutting"
                                                        ? t("production.cutting")
                                                        : roll.stage}
                                              </Badge>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={t("components.production.hierarchicalordersview.name.w_full_text_xs")}
                                              onClick={() => printRollLabel({
                                                roll: roll,
                                                productionOrder: productionOrder,
                                                order: order
                                              })}
                                              data-testid={`button-print-label-${roll.id}`}
                                            >
                                              <Printer className={t("components.production.hierarchicalordersview.name.h_3_w_3_mr_1")} />
                                              {t("production.printLabel")}
                                            </Button>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>{t('components.production.HierarchicalOrdersView.)_:_(')}<p className={t("components.production.hierarchicalordersview.name.text_sm_text_muted_foreground_ml_6")}>
                    {t("production.noProductionOrdersForThisOrder")}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
