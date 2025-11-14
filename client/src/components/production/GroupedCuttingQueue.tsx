import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  QrCode,
  Scissors,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Printer,
} from "lucide-react";
import { formatWeight } from "../../lib/formatNumber";
import { Progress } from "../ui/progress";
import { useToast } from "../../hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { printRollLabel } from "./RollLabelPrint";
import { safeParseFloat, formatNumberAr } from "../../../../shared/number-utils";

const cutFormSchema = z.object({
  cut_weight_kg: z.coerce
    .number()
    .positive("الوزن الصافي يجب أن يكون أكبر من صفر"),
  pieces_count: z.coerce
    .number()
    .positive("عدد القطع يجب أن يكون أكبر من صفر")
    .optional(),
  cutting_machine_id: z.string().min(1, "يجب اختيار ماكينة القطع"),
});

type CutFormData = z.infer<typeof cutFormSchema>;

interface GroupedCuttingQueueProps {
  items: any[];
}

export default function GroupedCuttingQueue({
  items,
}: GroupedCuttingQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>(
    {},
  );
  const [expandedProductionOrders, setExpandedProductionOrders] = useState<
    Record<number, boolean>
  >({});
  const [selectedRoll, setSelectedRoll] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch machines and sections
  const { data: machines = [] } = useQuery<any[]>({
    queryKey: ["/api/machines"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ["/api/sections"],
    staleTime: 10 * 60 * 1000,
  });

  // Find cutting section
  const cuttingSection = sections.find(
    s => s.name_ar?.includes("تقطيع") || s.name?.toLowerCase().includes("cutting")
  );
  
  const cuttingMachines = machines.filter(m =>{t('components.production.GroupedCuttingQueue.m.status_===_"active"_&&_(m.type_===_"cutting"_||_m.section_id_===_cuttingsection?.id)_);_const_form_=_useform')}<CutFormData>({
    resolver: zodResolver(cutFormSchema),
    defaultValues: {
      cut_weight_kg: 0,
      pieces_count: 1,
      cutting_machine_id: "",
    },
  });

  const cutMutation = useMutation({
    mutationFn: async (data: {
      roll_id: number;
      cut_weight_kg: number;
      pieces_count?: number;
      cutting_machine_id: string;
    }) => {
      const response = await fetch("/api/cuts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل في تسجيل التقطيع");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل التقطيع وحساب الهدر",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/grouped-cutting-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/cutting-queue"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      setDialogOpen(false);
      setSelectedRoll(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCutSubmit = (data: CutFormData) => {
    if (!selectedRoll) return;

    cutMutation.mutate({
      roll_id: selectedRoll.id,
      cut_weight_kg: data.cut_weight_kg,
      pieces_count: data.pieces_count,
      cutting_machine_id: data.cutting_machine_id,
    });
  };

  const openCutDialog = (roll: any) => {
    setSelectedRoll(roll);
    form.setValue("cut_weight_kg", safeParseFloat(roll.weight_kg, 0));
    setDialogOpen(true);
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const toggleProductionOrderExpansion = (productionOrderId: number) => {
    setExpandedProductionOrders((prev) => ({
      ...prev,
      [productionOrderId]: !prev[productionOrderId],
    }));
  };

  const calculateWaste = (rollWeight: number, cutWeight: number) => {
    return rollWeight - cutWeight;
  };

  // Helper function to calculate completion percentage for cutting stage
  const calculateOrderProgress = (order: any) => {
    if (!order.production_orders || order.production_orders.length === 0)
      return 0;

    let totalRolls = 0;
    let cutRolls = 0;

    order.production_orders.forEach((po: any) => {
      if (po.rolls && po.rolls.length > 0) {
        totalRolls += po.rolls.length;
        // In cutting queue, all rolls are ready for cutting but not yet cut
        // cutRolls += po.rolls.filter((roll: any) => roll.cut_weight_total_kg > 0).length;
      }
    });

    return totalRolls > 0 ? Math.round((cutRolls / totalRolls) * 100) : 0;
  };

  const calculateProductionOrderProgress = (productionOrder: any) => {
    if (!productionOrder.rolls || productionOrder.rolls.length === 0) return 0;

    const totalRolls = productionOrder.rolls.length;
    // const cutRolls = productionOrder.rolls.filter((roll: any) => roll.cut_weight_total_kg > 0).length;
    const cutRolls = 0; // All rolls in cutting queue are pending cutting

    return Math.round((cutRolls / totalRolls) * 100);
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className={t("components.production.groupedcuttingqueue.name.p_6_text_center")}>
          <div className={t("components.production.groupedcuttingqueue.name.text_gray_500")}>
            <Clock className={t("components.production.groupedcuttingqueue.name.h_12_w_12_mx_auto_mb_2_opacity_50")} />
            <p>{t('components.production.GroupedCuttingQueue.لا_توجد_رولات_جاهزة_للتقطيع')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={t("components.production.groupedcuttingqueue.name.space_y_4")}>
      {items.map((order) => (
        <Card key={order.id} className={t("components.production.groupedcuttingqueue.name.border_l_4_border_l_blue_500")}>
          <CardHeader className={t("components.production.groupedcuttingqueue.name.pb_3")}>
            <div className={t("components.production.groupedcuttingqueue.name.flex_items_center_justify_between")}>
              <div className={t("components.production.groupedcuttingqueue.name.flex_items_center_gap_3")}>
                <Package className={t("components.production.groupedcuttingqueue.name.h_5_w_5_text_blue_600")} />
                <div>
                  <CardTitle className={t("components.production.groupedcuttingqueue.name.text_lg")}>
                    طلب رقم: {order.order_number}
                  </CardTitle>
                  <p className={t("components.production.groupedcuttingqueue.name.text_base_font_bold_text_blue_700")}>
                    العميل:{" "}
                    {order.customer_name_ar ||
                      order.customer_name ||
                      "غير محدد"}
                  </p>
                </div>
              </div>
              <div className={t("components.production.groupedcuttingqueue.name.flex_items_center_gap_3")}>
                <div className={t("components.production.groupedcuttingqueue.name.text_sm_text_muted_foreground")}>
                  <div className={t("components.production.groupedcuttingqueue.name.w_20")}>
                    <Progress
                      value={calculateOrderProgress(order)}
                      className={t("components.production.groupedcuttingqueue.name.h_2")}
                    />
                    <span className={t("components.production.groupedcuttingqueue.name.text_xs")}>
                      {calculateOrderProgress(order)}%
                    </span>
                  </div>
                </div>
                <Badge variant="outline">
                  {order.production_orders?.reduce(
                    (total: number, po: any) => total + (po.rolls?.length || 0),
                    0,
                  ) || 0}{" "}
                  رول
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleOrderExpansion(order.id)}
                  data-testid={`button-expand-order-${order.id}`}
                >
                  {expandedOrders[order.id] ? (
                    <ChevronUp className={t("components.production.groupedcuttingqueue.name.h_4_w_4")} />{t('components.production.GroupedCuttingQueue.)_:_(')}<ChevronDown className={t("components.production.groupedcuttingqueue.name.h_4_w_4")} />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <Collapsible open={expandedOrders[order.id]}>
            <CollapsibleContent>
              <CardContent className={t("components.production.groupedcuttingqueue.name.pt_0")}>
                <div className={t("components.production.groupedcuttingqueue.name.space_y_4")}>
                  {order.production_orders?.map((productionOrder: any) => (
                    <Card
                      key={productionOrder.id}
                      className={t("components.production.groupedcuttingqueue.name.bg_gray_50_border_l_2_border_l_green_400")}
                    >
                      <CardHeader className={t("components.production.groupedcuttingqueue.name.pb_2")}>
                        <div className={t("components.production.groupedcuttingqueue.name.flex_items_center_justify_between")}>
                          <div>
                            <h4 className={t("components.production.groupedcuttingqueue.name.font_medium_text_base")}>
                              {productionOrder.production_order_number}
                            </h4>
                            <p className={t("components.production.groupedcuttingqueue.name.text_sm_text_muted_foreground")}>
                              {productionOrder.item_name_ar ||
                                productionOrder.item_name ||
                                "غير محدد"}
                            </p>
                            <div className={t("components.production.groupedcuttingqueue.name.grid_grid_cols_3_gap_x_4_gap_y_1_mt_2_text_xs")}>
                              {productionOrder.size_caption && (
                                <div>
                                  <span className={t("components.production.groupedcuttingqueue.name.font_medium")}>{t('components.production.GroupedCuttingQueue.المقاس:')}</span>
                                  <span className={t("components.production.groupedcuttingqueue.name.text_muted_foreground")}>
                                    {productionOrder.size_caption}
                                  </span>
                                </div>
                              )}
                              {productionOrder.thickness && (
                                <div>
                                  <span className={t("components.production.groupedcuttingqueue.name.font_medium")}>{t('components.production.GroupedCuttingQueue.السماكة:')}</span>
                                  <span className={t("components.production.groupedcuttingqueue.name.text_muted_foreground")}>
                                    {productionOrder.thickness}
                                  </span>
                                </div>
                              )}
                              {productionOrder.raw_material && (
                                <div>
                                  <span className={t("components.production.groupedcuttingqueue.name.font_medium")}>{t('components.production.GroupedCuttingQueue.الخامة:')}</span>
                                  <span className={t("components.production.groupedcuttingqueue.name.text_muted_foreground")}>
                                    {productionOrder.raw_material}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={t("components.production.groupedcuttingqueue.name.flex_items_center_gap_3")}>
                            <div className={t("components.production.groupedcuttingqueue.name.text_sm_text_muted_foreground")}>
                              <div className={t("components.production.groupedcuttingqueue.name.w_16")}>
                                <Progress
                                  value={calculateProductionOrderProgress(
                                    productionOrder,
                                  )}
                                  className={t("components.production.groupedcuttingqueue.name.h_2")}
                                />
                                <span className={t("components.production.groupedcuttingqueue.name.text_xs")}>
                                  {calculateProductionOrderProgress(
                                    productionOrder,
                                  )}
                                  %
                                </span>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              {productionOrder.rolls?.length || 0} رول
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                toggleProductionOrderExpansion(
                                  productionOrder.id,
                                )
                              }
                              data-testid={`button-expand-production-${productionOrder.id}`}
                            >
                              {expandedProductionOrders[productionOrder.id] ? (
                                <ChevronUp className={t("components.production.groupedcuttingqueue.name.h_4_w_4")} />{t('components.production.GroupedCuttingQueue.)_:_(')}<ChevronDown className={t("components.production.groupedcuttingqueue.name.h_4_w_4")} />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <Collapsible
                        open={expandedProductionOrders[productionOrder.id]}
                      >
                        <CollapsibleContent>
                          <CardContent className={t("components.production.groupedcuttingqueue.name.pt_0")}>
                            <div className={t("components.production.groupedcuttingqueue.name.mt_4_ml_6_space_y_2")}>
                              <h5 className={t("components.production.groupedcuttingqueue.name.text_sm_font_medium_text_gray_700_mb_2")}>
                                الرولات ({productionOrder.rolls?.length || 0})
                              </h5>
                              {!productionOrder.rolls || productionOrder.rolls.length === 0 ? (
                                <p className={t("components.production.groupedcuttingqueue.name.text_sm_text_muted_foreground")}>{t('components.production.GroupedCuttingQueue.لا_توجد_رولات_بعد')}</p>{t('components.production.GroupedCuttingQueue.)_:_(')}<div className={t("components.production.groupedcuttingqueue.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_2")}>
                                  {productionOrder.rolls.map((roll: any) => (
                                    <div
                                      key={roll.id}
                                      className={t("components.production.groupedcuttingqueue.name.border_rounded_p_3_bg_gray_50_hover_bg_gray_100_transition_colors")}
                                      data-testid={`roll-item-${roll.id}`}
                                    >
                                      <div className={t("components.production.groupedcuttingqueue.name.flex_flex_col_gap_2")}>
                                        <div className={t("components.production.groupedcuttingqueue.name.flex_justify_between_items_start")}>
                                          <div className={t("components.production.groupedcuttingqueue.name.flex_1")}>
                                            <p className={t("components.production.groupedcuttingqueue.name.font_medium_text_sm")}>
                                              {roll.roll_number}
                                            </p>
                                            <p className={t("components.production.groupedcuttingqueue.name.text_xs_text_muted_foreground")}>
                                              الوزن: {formatWeight(safeParseFloat(roll.weight_kg, 0))}
                                            </p>
                                            {roll.cut_weight_total_kg >{t('components.production.GroupedCuttingQueue.0_&&_(')}<div className={t("components.production.groupedcuttingqueue.name.text_xs_space_y_1_mt_1")}>
                                                <p className={t("components.production.groupedcuttingqueue.name.text_green_600")}>
                                                  الوزن الصافي: {formatWeight(safeParseFloat(roll.cut_weight_total_kg, 0))}
                                                </p>
                                                <p className={t("components.production.groupedcuttingqueue.name.text_red_600")}>
                                                  الهدر: {formatWeight(safeParseFloat(roll.waste_kg, 0))}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                          <Button
                                            onClick={() => openCutDialog(roll)}
                                            disabled={cutMutation.isPending}
                                            size="sm"
                                            variant="default"
                                            data-testid={`button-cut-${roll.id}`}
                                          >
                                            <Scissors className={t("components.production.groupedcuttingqueue.name.h_3_w_3")} />
                                          </Button>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className={t("components.production.groupedcuttingqueue.name.w_full_text_xs")}
                                          onClick={() => {
                                            printRollLabel({
                                              roll: roll,
                                              productionOrder: {
                                                production_order_number: productionOrder.production_order_number,
                                                item_name_ar: productionOrder.item_name_ar,
                                                item_name: productionOrder.item_name,
                                                size_caption: productionOrder.size_caption
                                              },
                                              order: {
                                                order_number: order.order_number,
                                                customer_name_ar: order.customer_name_ar,
                                                customer_name: order.customer_name
                                              }
                                            });
                                          }}
                                          data-testid={`button-print-label-${roll.id}`}
                                        >
                                          <Printer className={t("components.production.groupedcuttingqueue.name.h_3_w_3_mr_1")} />{t('components.production.GroupedCuttingQueue.طباعة_ملصق')}</Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      {/* Dialog for cutting input */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={t("components.production.groupedcuttingqueue.name.max_w_md")}>
          <DialogHeader>
            <DialogTitle>{t('components.production.GroupedCuttingQueue.تقطيع_الرول')}</DialogTitle>
            <DialogDescription>{t('components.production.GroupedCuttingQueue.إدخال_بيانات_تقطيع_الرول_وتحديد_الكميات_المطلوبة')}</DialogDescription>
          </DialogHeader>

          {selectedRoll && (
            <div className={t("components.production.groupedcuttingqueue.name.space_y_4")}>
              <div className={t("components.production.groupedcuttingqueue.name.p_3_bg_gray_50_rounded_lg")}>
                <p className={t("components.production.groupedcuttingqueue.name.font_medium")}>{selectedRoll.roll_number}</p>
                <p className={t("components.production.groupedcuttingqueue.name.text_sm_text_gray_500")}>
                  الوزن الأصلي:{" "}
                  {formatNumberAr(safeParseFloat(selectedRoll.weight_kg, 0), 2)} كجم
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCutSubmit)}
                  className={t("components.production.groupedcuttingqueue.name.space_y_4")}
                >
                  <FormField
                    control={form.control}
                    name="{t('components.production.GroupedCuttingQueue.name.cutting_machine_id')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.production.GroupedCuttingQueue.ماكينة_القطع_*')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-cutting-machine">
                              <SelectValue placeholder="{t('components.production.GroupedCuttingQueue.placeholder.اختر_ماكينة_القطع')}" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cuttingMachines.length === 0 ? (
                              <div className={t("components.production.groupedcuttingqueue.name.p_2_text_sm_text_muted_foreground_text_center")}>{t('components.production.GroupedCuttingQueue.لا_توجد_ماكينات_قطع_نشطة')}</div>
                            ) : (
                              cuttingMachines.map((machine) => (
                                <SelectItem
                                  key={machine.id}
                                  value={machine.id}
                                  data-testid={`machine-option-${machine.id}`}
                                >
                                  {machine.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="{t('components.production.GroupedCuttingQueue.name.cut_weight_kg')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.production.GroupedCuttingQueue.الوزن_الصافي_المقطع_(كجم)')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="{t('components.production.GroupedCuttingQueue.placeholder.أدخل_الوزن_الصافي')}"
                            {...field}
                            data-testid="input-cut-weight"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="{t('components.production.GroupedCuttingQueue.name.pieces_count')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('components.production.GroupedCuttingQueue.عدد_القطع_(اختياري)')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="{t('components.production.GroupedCuttingQueue.placeholder.أدخل_عدد_القطع')}"
                            {...field}
                            data-testid="input-pieces-count"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("cut_weight_kg") >{t('components.production.GroupedCuttingQueue.0_&&_selectedroll_&&_(')}<div className={t("components.production.groupedcuttingqueue.name.p_3_bg_yellow_50_rounded_lg_border_border_yellow_200")}>
                      <p className={t("components.production.groupedcuttingqueue.name.text_sm")}>
                        <span className={t("components.production.groupedcuttingqueue.name.font_medium")}>{t('components.production.GroupedCuttingQueue.الهدر_المحسوب:')}</span>
                        <span
                          className={
                            calculateWaste(
                              safeParseFloat(selectedRoll.weight_kg, 0),
                              form.watch("cut_weight_kg"),
                            ) > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {formatNumberAr(calculateWaste(
                            safeParseFloat(selectedRoll.weight_kg, 0),
                            form.watch("cut_weight_kg"),
                          ), 2)}{" "}
                          كجم
                        </span>
                      </p>
                    </div>
                  )}

                  <div className={t("components.production.groupedcuttingqueue.name.flex_justify_end_space_x_2_space_x_reverse")}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel-cut"
                    >{t('components.production.GroupedCuttingQueue.إلغاء')}</Button>
                    <Button
                      type="submit"
                      disabled={cutMutation.isPending}
                      data-testid="button-confirm-cut"
                    >
                      {cutMutation.isPending
                        ? "جاري التقطيع..."
                        : "تأكيد التقطيع"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
