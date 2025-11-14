import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Package, Scissors, Archive, Plus, QrCode, Play } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface ProductionOrder {
  id: number;
  production_order: any; // Add proper type based on your schema
}

interface ProgressData {
  production_order: any;
  progress: {
    printing?: { completed: number; total: number };
    lamination?: { completed: number; total: number };
    cutting?: { completed: number; total: number };
    packaging?: { completed: number; total: number };
    film_weight?: number;
    film_percentage?: number;
    printed_weight?: number;
    printed_percentage?: number;
    cut_weight?: number;
    cut_percentage?: number;
    warehouse_weight?: number;
    warehouse_percentage?: number;
  };
  rolls: any[];
  warehouse_receipts: any[];
}

interface AvailableCut {
  id: string;
  name: string;
}

export default function OrderProgress() {
  const { t } = useTranslation();
  const [selectedProductionOrderId, setSelectedProductionOrderId] = useState<
    number | null
  >(null);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState({
    production_order_id: 0,
    cut_id: "",
    received_weight_kg: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all production orders
  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/production-orders"],
    refetchInterval: false, // Disabled polling - use manual refresh
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  // Fetch progress for selected production order
  const { data: progress, isLoading: progressLoading } = useQuery<ProgressData>(
    {
      queryKey: ["/api/production/order-progress", selectedProductionOrderId],
      enabled: !!selectedProductionOrderId,
      refetchInterval: false, // Disabled polling - use manual refresh
      staleTime: 3 * 60 * 1000, // 3 minutes stale time
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    },
  );

  // Fetch available cuts for warehouse receipt
  const { data: availableCuts = [] } = useQuery<AvailableCut[]>({
    queryKey: ["/api/cuts/available"],
    enabled: warehouseDialogOpen,
  });

  const warehouseReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/warehouse/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('orderProgress.receiptFailed'));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('orderProgress.receiptSuccess'),
        description: t('orderProgress.warehouseReceiptRegistered'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/receipts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/order-progress"],
      });
      setWarehouseDialogOpen(false);
      setReceiptData({
        production_order_id: 0,
        cut_id: "",
        received_weight_kg: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWarehouseReceipt = () => {
    if (!receiptData.production_order_id || !receiptData.received_weight_kg) {
      toast({
        title: t('common.error'),
        description: t('orderProgress.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    warehouseReceiptMutation.mutate({
      production_order_id: receiptData.production_order_id,
      cut_id: receiptData.cut_id ? parseInt(receiptData.cut_id) : null,
      received_weight_kg: parseFloat(receiptData.received_weight_kg),
    });
  };

  return (
    <div className={t("components.production.orderprogress.name.space_y_6")}>
      {/* Job Order Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('orderProgress.selectProductionOrder')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProductionOrderId?.toString() ?? ""}
            onValueChange={(value) =>
              setSelectedProductionOrderId(parseInt(value))
            }
          >
            <SelectTrigger data-testid="select-job-order">
              <SelectValue placeholder={t('orderProgress.selectOrderPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {productionOrders
                .filter((order: any) => order.status === "in_production")
                .map((order: any) => (
                  <SelectItem key={order.id} value={order.id.toString()}>
                    {order.production_order_number} - {order.quantity_required}{" "}
                    {t('common.kg')}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {selectedProductionOrderId && progress && (
        <div className={t("components.production.orderprogress.name.space_y_4")}>
          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('orderProgress.orderProgress')} -{" "}
                {progress.production_order?.production_order_number}
              </CardTitle>
            </CardHeader>
            <CardContent className={t("components.production.orderprogress.name.space_y_4")}>
              <div className={t("components.production.orderprogress.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
                <div className={t("components.production.orderprogress.name.text_center")}>
                  <Package className={t("components.production.orderprogress.name.h_8_w_8_mx_auto_mb_2_text_blue_500")} />
                  <p className={t("components.production.orderprogress.name.text_sm_text_gray_600")}>{t('production.film')}</p>
                  <p className={t("components.production.orderprogress.name.font_bold_text_lg")}>
                    {progress.progress?.film_weight?.toFixed(2) || 0} {t('common.kg')}
                  </p>
                  <div className={t("components.production.orderprogress.name.w_full_bg_gray_200_rounded_full_h_2_mt_2")}>
                    <div
                      className={t("components.production.orderprogress.name.bg_blue_500_h_2_rounded_full_transition_all_duration_300")}
                      style={{
                        width: `${Math.min(progress.progress?.film_percentage || 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className={t("components.production.orderprogress.name.text_center")}>
                  <Play className={t("components.production.orderprogress.name.h_8_w_8_mx_auto_mb_2_text_green_500")} />
                  <p className={t("components.production.orderprogress.name.text_sm_text_gray_600")}>{t('production.printing')}</p>
                  <p className={t("components.production.orderprogress.name.font_bold_text_lg")}>
                    {progress.progress?.printed_weight?.toFixed(2) || 0} {t('common.kg')}
                  </p>
                  <div className={t("components.production.orderprogress.name.w_full_bg_gray_200_rounded_full_h_2_mt_2")}>
                    <div
                      className={t("components.production.orderprogress.name.bg_green_500_h_2_rounded_full_transition_all_duration_300")}
                      style={{
                        width: `${Math.min(progress.progress?.printed_percentage || 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className={t("components.production.orderprogress.name.text_center")}>
                  <Scissors className={t("components.production.orderprogress.name.h_8_w_8_mx_auto_mb_2_text_orange_500")} />
                  <p className={t("components.production.orderprogress.name.text_sm_text_gray_600")}>{t('production.cutting')}</p>
                  <p className={t("components.production.orderprogress.name.font_bold_text_lg")}>
                    {progress.progress?.cut_weight?.toFixed(2) || 0} {t('common.kg')}
                  </p>
                  <div className={t("components.production.orderprogress.name.w_full_bg_gray_200_rounded_full_h_2_mt_2")}>
                    <div
                      className={t("components.production.orderprogress.name.bg_orange_500_h_2_rounded_full_transition_all_duration_300")}
                      style={{
                        width: `${Math.min(progress.progress?.cut_percentage || 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className={t("components.production.orderprogress.name.text_center")}>
                  <Archive className={t("components.production.orderprogress.name.h_8_w_8_mx_auto_mb_2_text_purple_500")} />
                  <p className={t("components.production.orderprogress.name.text_sm_text_gray_600")}>{t('orderProgress.warehouse')}</p>
                  <p className={t("components.production.orderprogress.name.font_bold_text_lg")}>
                    {progress.progress?.warehouse_weight?.toFixed(2) || 0} {t('common.kg')}
                  </p>
                  <div className={t("components.production.orderprogress.name.w_full_bg_gray_200_rounded_full_h_2_mt_2")}>
                    <div
                      className={t("components.production.orderprogress.name.bg_purple_500_h_2_rounded_full_transition_all_duration_300")}
                      style={{
                        width: `${Math.min(progress.progress?.warehouse_percentage || 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rolls Details */}
          <Card>
            <CardHeader>
              <div className={t("components.production.orderprogress.name.flex_items_center_justify_between")}>
                <CardTitle>{t('orderProgress.rolls')}</CardTitle>
                <Dialog
                  open={warehouseDialogOpen}
                  onOpenChange={setWarehouseDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() =>
                        setReceiptData({
                          ...receiptData,
                          production_order_id: selectedProductionOrderId,
                        })
                      }
                    >
                      <Plus className={t("components.production.orderprogress.name.h_4_w_4_mr_2")} />
                      {t('orderProgress.warehouseReceipt')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={t("components.production.orderprogress.name.max_w_md")}>
                    <DialogHeader>
                      <DialogTitle>{t('orderProgress.registerWarehouseReceipt')}</DialogTitle>
                      <DialogDescription>
                        {t('orderProgress.registerWarehouseReceiptDesc')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className={t("components.production.orderprogress.name.space_y_4")}>
                      <div className={t("components.production.orderprogress.name.space_y_2")}>
                        <Label>{t('orderProgress.receivedWeight')} *</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={receiptData.received_weight_kg}
                          onChange={(e) =>
                            setReceiptData({
                              ...receiptData,
                              received_weight_kg: e.target.value,
                            })
                          }
                          placeholder="{t('components.production.OrderProgress.placeholder.45.2')}"
                          className={t("components.production.orderprogress.name.text_right")}
                          data-testid="input-received-weight"
                        />
                      </div>

                      <div className={t("components.production.orderprogress.name.flex_justify_end_space_x_3_space_x_reverse_pt_4")}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setWarehouseDialogOpen(false)}
                          disabled={warehouseReceiptMutation.isPending}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          onClick={handleWarehouseReceipt}
                          disabled={warehouseReceiptMutation.isPending}
                          data-testid="button-confirm-receipt"
                        >
                          {warehouseReceiptMutation.isPending
                            ? t('orderProgress.registering')
                            : t('orderProgress.registerReceipt')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className={t("components.production.orderprogress.name.space_y_3")}>
                {progress.rolls?.map((roll: any) => (
                  <div
                    key={roll.id}
                    className={t("components.production.orderprogress.name.flex_items_center_justify_between_p_3_border_rounded_lg")}
                  >
                    <div className={t("components.production.orderprogress.name.flex_items_center_space_x_3_space_x_reverse")}>
                      <QrCode className={t("components.production.orderprogress.name.h_5_w_5_text_gray_400")} />
                      <div>
                        <p
                          className={t("components.production.orderprogress.name.font_medium")}
                          data-testid={`text-roll-${roll.id}`}
                        >
                          {roll.roll_number}
                        </p>
                        <p className={t("components.production.orderprogress.name.text_sm_text_gray_500")}>
                          {roll.weight_kg?.toFixed(2)} {t('common.kg')} - {roll.machine_id}
                        </p>
                      </div>
                    </div>

                    <div className={t("components.production.orderprogress.name.flex_items_center_space_x_2_space_x_reverse")}>
                      <Badge
                        variant={
                          roll.stage === "film"
                            ? "secondary"
                            : roll.stage === "printing"
                              ? "default"
                              : "outline"
                        }
                      >
                        {roll.stage === "film"
                          ? t('production.film')
                          : roll.stage === "printing"
                            ? t('orderProgress.printed')
                            : t('orderProgress.cut')}
                      </Badge>

                      {roll.printed_at && (
                        <span className={t("components.production.orderprogress.name.text_xs_text_gray_400")}>
                          {t('orderProgress.printedOn')}:{" "}
                          {new Date(roll.printed_at).toLocaleDateString("ar")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Receipts */}
          {progress.warehouse_receipts?.length >{t('components.production.OrderProgress.0_&&_(')}<Card>
              <CardHeader>
                <CardTitle>{t('orderProgress.warehouseReceipts')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={t("components.production.orderprogress.name.space_y_3")}>
                  {progress.warehouse_receipts.map((receipt: any) => (
                    <div
                      key={receipt.id}
                      className={t("components.production.orderprogress.name.flex_items_center_justify_between_p_3_border_rounded_lg")}
                    >
                      <div>
                        <p className={t("components.production.orderprogress.name.font_medium")}>{t('orderProgress.receipt')} #{receipt.id}</p>
                        <p className={t("components.production.orderprogress.name.text_sm_text_gray_500")}>
                          {receipt.received_weight_kg?.toFixed(2)} {t('common.kg')}
                        </p>
                      </div>
                      <div className={t("components.production.orderprogress.name.text_xs_text_gray_400")}>
                        {new Date(receipt.created_at).toLocaleDateString("ar")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {progressLoading && (
        <Card>
          <CardContent className={t("components.production.orderprogress.name.p_6_text_center")}>
            <div className={t("components.production.orderprogress.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
            <p className={t("components.production.orderprogress.name.mt_2_text_sm_text_gray_500")}>{t('orderProgress.loadingProgress')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
