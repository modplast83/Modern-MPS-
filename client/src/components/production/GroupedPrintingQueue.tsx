import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { QrCode, Play, ChevronDown, ChevronRight, Plus, Printer } from "lucide-react";
import { Progress } from "../ui/progress";
import { useToast } from "../../hooks/use-toast";
import { formatWeight } from "../../lib/formatNumber";
import { useTranslation } from "react-i18next";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { printRollLabel } from "./RollLabelPrint";

interface GroupedPrintingQueueProps {
  items: any[];
}

interface GroupedRoll {
  id: number;
  roll_seq: number;
  roll_number: string;
  weight_kg: number;
  machine_id: string;
  qr_code_text?: string;
  qr_png_base64?: string;
}

interface ProductionOrderGroup {
  production_order_id: number;
  production_order_number: string;
  rolls: GroupedRoll[];
  total_weight: number;
  rolls_count: number;
}

interface OrderGroup {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_name_ar: string;
  item_name: string;
  item_name_ar: string;
  size_caption: string;
  production_orders: ProductionOrderGroup[];
  total_weight: number;
  total_rolls: number;
}

interface Machine {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  section_id: number;
  status: string;
}

export default function GroupedPrintingQueue({
  items,
}: GroupedPrintingQueueProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>{t('components.production.GroupedPrintingQueue.(null);_const_[expandedorders,_setexpandedorders]_=_usestate')}<Set<number>>{t('components.production.GroupedPrintingQueue.(new_set());_const_[expandedproductionorders,_setexpandedproductionorders]_=_usestate')}<
    Set<number>
  >{t('components.production.GroupedPrintingQueue.(new_set());_//_state_for_machine_selection_dialog_const_[selectedrollforprinting,_setselectedrollforprinting]_=_usestate')}<GroupedRoll | null>{t('components.production.GroupedPrintingQueue.(null);_const_[selectedprintingmachine,_setselectedprintingmachine]_=_usestate')}<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch machines
  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sections to get printing section ID
  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ["/api/sections"],
    staleTime: 10 * 60 * 1000,
  });

  // Filter printing machines (active only)
  const printingSection = sections.find(s => 
    s.name?.toLowerCase().includes("طباعة") || 
    s.name?.toLowerCase().includes("printing") ||
    s.name_ar?.includes("طباعة")
  );
  
  const printingMachines = machines.filter(m => 
    m.status === "active" && 
    (m.type === "printing" || m.section_id === printingSection?.id)
  );

  // Helper function to calculate completion percentage
  const calculateOrderProgress = (orderGroup: OrderGroup) => {
    const totalRolls = orderGroup.total_rolls;
    if (totalRolls === 0) return 0;

    // In printing stage, assume all rolls are ready for printing
    // Progress is based on rolls that are successfully printed
    // For now, we'll show that all rolls in the queue are pending printing
    return 0; // All rolls in queue are pending printing
  };

  const calculateProductionOrderProgress = (
    productionOrderGroup: ProductionOrderGroup,
  ) => {
    const totalRolls = productionOrderGroup.rolls_count;
    if (totalRolls === 0) return 0;

    // Similar logic - all rolls in printing queue are pending
    return 0; // All rolls are pending printing
  };

  // Group items by order and production order
  const groupedData: OrderGroup[] = items.reduce((acc: OrderGroup[], item) => {
    let orderGroup = acc.find(
      (group: OrderGroup) => group.order_id === item.order_id,
    );

    if (!orderGroup) {
      orderGroup = {
        order_id: item.order_id,
        order_number: item.order_number || `ORD-${item.order_id}`,
        customer_name: item.customer_name || t("common.notSpecified"),
        customer_name_ar:
          item.customer_name_ar || item.customer_name || t("common.notSpecified"),
        item_name: item.item_name || t("common.notSpecified"),
        item_name_ar: item.item_name_ar || item.item_name || t("common.notSpecified"),
        size_caption: item.size_caption || "",
        production_orders: [],
        total_weight: 0,
        total_rolls: 0,
      };
      acc.push(orderGroup);
    }

    let productionOrderGroup = orderGroup.production_orders.find(
      (po: ProductionOrderGroup) =>
        po.production_order_id === item.production_order_id,
    );

    if (!productionOrderGroup) {
      productionOrderGroup = {
        production_order_id: item.production_order_id,
        production_order_number:
          item.production_order_number || `PO-${item.production_order_id}`,
        rolls: [],
        total_weight: 0,
        rolls_count: 0,
      };
      orderGroup.production_orders.push(productionOrderGroup);
    }

    const roll: GroupedRoll = {
      id: item.id,
      roll_seq: item.roll_seq,
      roll_number: item.roll_number,
      weight_kg: parseFloat(item.weight_kg) || 0,
      machine_id: item.machine_id,
      qr_code_text: item.qr_code_text,
      qr_png_base64: item.qr_png_base64,
    };

    productionOrderGroup.rolls.push(roll);
    productionOrderGroup.total_weight += roll.weight_kg;
    productionOrderGroup.rolls_count += 1;

    orderGroup.total_weight += roll.weight_kg;
    orderGroup.total_rolls += 1;

    return acc;
  }, [] as OrderGroup[]);

  const processRollMutation = useMutation({
    mutationFn: async ({ rollId, printingMachineId }: { rollId: number; printingMachineId: string }) => {
      const response = await fetch(`/api/rolls/${rollId}/print`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printing_machine_id: printingMachineId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t("production.printingRegistrationFailed"));
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("production.printingRegisteredSuccess"),
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/production/printing-queue`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      setProcessingId(null);
      setIsDialogOpen(false);
      setSelectedRollForPrinting(null);
      setSelectedPrintingMachine("");
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
      setProcessingId(null);
    },
  });

  const handleOpenPrintDialog = (roll: GroupedRoll) => {
    setSelectedRollForPrinting(roll);
    setSelectedPrintingMachine("");
    setIsDialogOpen(true);
  };

  const handleConfirmPrint = () => {
    if (!selectedRollForPrinting || !selectedPrintingMachine) {
      toast({
        title: t("common.error"),
        description: t("production.selectPrintingMachine"),
        variant: "destructive",
      });
      return;
    }

    setProcessingId(selectedRollForPrinting.id);
    processRollMutation.mutate({
      rollId: selectedRollForPrinting.id,
      printingMachineId: selectedPrintingMachine,
    });
  };

  const toggleOrderExpanded = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const toggleProductionOrderExpanded = (productionOrderId: number) => {
    const newExpanded = new Set(expandedProductionOrders);
    if (newExpanded.has(productionOrderId)) {
      newExpanded.delete(productionOrderId);
    } else {
      newExpanded.add(productionOrderId);
    }
    setExpandedProductionOrders(newExpanded);
  };

  if (groupedData.length === 0) {
    return (
      <Card>
        <CardContent className={t("components.production.groupedprintingqueue.name.p_6_text_center")}>
          <div className={t("components.production.groupedprintingqueue.name.text_gray_500")}>
            <Play className={t("components.production.groupedprintingqueue.name.h_12_w_12_mx_auto_mb_2_opacity_50")} />
            <p>{t("production.noRollsInPrintingQueue")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className={t("components.production.groupedprintingqueue.name.space_y_4")}>
        {groupedData.map((orderGroup) => (
          <Card
            key={`order-${orderGroup.order_id}`}
            className={t("components.production.groupedprintingqueue.name.border_l_4_border_l_blue_500")}
          >
            <Collapsible
              open={expandedOrders.has(orderGroup.order_id)}
              onOpenChange={() => toggleOrderExpanded(orderGroup.order_id)}
            >
              <CollapsibleTrigger className={t("components.production.groupedprintingqueue.name.w_full")}>
                <CardHeader className={t("components.production.groupedprintingqueue.name.pb_3")}>
                  <div className={t("components.production.groupedprintingqueue.name.flex_items_center_justify_between")}>
                    <div className={t("components.production.groupedprintingqueue.name.flex_items_center_space_x_3_space_x_reverse")}>
                      {expandedOrders.has(orderGroup.order_id) ? (
                        <ChevronDown className={t("components.production.groupedprintingqueue.name.h_5_w_5")} />{t('components.production.GroupedPrintingQueue.)_:_(')}<ChevronRight className={t("components.production.groupedprintingqueue.name.h_5_w_5")} />
                      )}
                      <div className={t("components.production.groupedprintingqueue.name.text_right")}>
                        <CardTitle className={t("components.production.groupedprintingqueue.name.text_lg")}>
                          {orderGroup.order_number} -{" "}
                          <span className={t("components.production.groupedprintingqueue.name.font_bold_text_blue_700")}>
                            {orderGroup.customer_name_ar}
                          </span>
                        </CardTitle>
                        <p className={t("components.production.groupedprintingqueue.name.text_sm_text_gray_600")}>
                          {orderGroup.item_name_ar}{" "}
                          {orderGroup.size_caption &&
                            `- ${orderGroup.size_caption}`}
                        </p>
                      </div>
                    </div>
                    <div className={t("components.production.groupedprintingqueue.name.flex_items_center_space_x_3_space_x_reverse")}>
                      <div className={t("components.production.groupedprintingqueue.name.text_sm_text_muted_foreground")}>
                        <div className={t("components.production.groupedprintingqueue.name.w_20")}>
                          <Progress
                            value={calculateOrderProgress(orderGroup)}
                            className={t("components.production.groupedprintingqueue.name.h_2")}
                          />
                          <span className={t("components.production.groupedprintingqueue.name.text_xs")}>
                            {calculateOrderProgress(orderGroup)}%
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {orderGroup.total_rolls} {t("production.roll")}
                      </Badge>
                      <Badge variant="outline">
                        {orderGroup.total_weight.toFixed(2)} {t("warehouse.kg")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className={t("components.production.groupedprintingqueue.name.pt_0")}>
                  <div className={t("components.production.groupedprintingqueue.name.space_y_3")}>
                    {orderGroup.production_orders.map((productionOrderGroup) => (
                      <Card
                        key={`production-${productionOrderGroup.production_order_id}`}
                        className={t("components.production.groupedprintingqueue.name.bg_gray_50_border_l_2_border_l_orange_400")}
                      >
                        <Collapsible
                          open={expandedProductionOrders.has(
                            productionOrderGroup.production_order_id,
                          )}
                          onOpenChange={() =>
                            toggleProductionOrderExpanded(
                              productionOrderGroup.production_order_id,
                            )
                          }
                        >
                          <CollapsibleTrigger className={t("components.production.groupedprintingqueue.name.w_full")}>
                            <CardHeader className={t("components.production.groupedprintingqueue.name.pb_2")}>
                              <div className={t("components.production.groupedprintingqueue.name.flex_items_center_justify_between")}>
                                <div className={t("components.production.groupedprintingqueue.name.flex_items_center_space_x_2_space_x_reverse")}>
                                  {expandedProductionOrders.has(
                                    productionOrderGroup.production_order_id,
                                  ) ? (
                                    <ChevronDown className={t("components.production.groupedprintingqueue.name.h_4_w_4")} />{t('components.production.GroupedPrintingQueue.)_:_(')}<ChevronRight className={t("components.production.groupedprintingqueue.name.h_4_w_4")} />
                                  )}
                                  <span className={t("components.production.groupedprintingqueue.name.font_medium")}>
                                    {productionOrderGroup.production_order_number}
                                  </span>
                                </div>
                                <div className={t("components.production.groupedprintingqueue.name.flex_items_center_space_x_3_space_x_reverse")}>
                                  <div className={t("components.production.groupedprintingqueue.name.text_sm_text_muted_foreground")}>
                                    <div className={t("components.production.groupedprintingqueue.name.w_16")}>
                                      <Progress
                                        value={calculateProductionOrderProgress(
                                          productionOrderGroup,
                                        )}
                                        className={t("components.production.groupedprintingqueue.name.h_2")}
                                      />
                                      <span className={t("components.production.groupedprintingqueue.name.text_xs")}>
                                        {calculateProductionOrderProgress(
                                          productionOrderGroup,
                                        )}
                                        %
                                      </span>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className={t("components.production.groupedprintingqueue.name.text_xs")}>
                                    {productionOrderGroup.rolls_count} {t("production.roll")}
                                  </Badge>
                                  <Badge variant="outline" className={t("components.production.groupedprintingqueue.name.text_xs")}>
                                    {productionOrderGroup.total_weight.toFixed(2)}{" "}
                                    {t("warehouse.kg")}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <CardContent className={t("components.production.groupedprintingqueue.name.pt_0")}>
                              <div className={t("components.production.groupedprintingqueue.name.mt_4_ml_6_space_y_2")}>
                                <h5 className={t("components.production.groupedprintingqueue.name.text_sm_font_medium_text_gray_700_mb_2")}>
                                  {t("production.rolls")} ({productionOrderGroup.rolls_count})
                                </h5>
                                {productionOrderGroup.rolls.length === 0 ? (
                                  <p className={t("components.production.groupedprintingqueue.name.text_sm_text_muted_foreground")}>
                                    {t("production.noRollsYet")}
                                  </p>{t('components.production.GroupedPrintingQueue.)_:_(')}<div className={t("components.production.groupedprintingqueue.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_gap_2")}>
                                    {productionOrderGroup.rolls.map((roll) => (
                                      <div
                                        key={`roll-${roll.id}`}
                                        className={t("components.production.groupedprintingqueue.name.border_rounded_p_3_bg_gray_50_hover_bg_gray_100_transition_colors")}
                                        data-testid={`roll-item-${roll.id}`}
                                      >
                                        <div className={t("components.production.groupedprintingqueue.name.flex_flex_col_gap_2")}>
                                          <div className={t("components.production.groupedprintingqueue.name.flex_justify_between_items_start")}>
                                            <div className={t("components.production.groupedprintingqueue.name.flex_1")}>
                                              <p className={t("components.production.groupedprintingqueue.name.font_medium_text_sm")}>
                                                {roll.roll_number}
                                              </p>
                                              <p className={t("components.production.groupedprintingqueue.name.text_xs_text_muted_foreground")}>
                                                {t("production.weight")}: {formatWeight(roll.weight_kg)}
                                              </p>
                                              <p className={t("components.production.groupedprintingqueue.name.text_xs_text_muted_foreground")}>
                                                {t("production.machine")}: {roll.machine_id}
                                              </p>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="default"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (processingId !== null) return;
                                                handleOpenPrintDialog(roll);
                                              }}
                                              disabled={processingId !== null}
                                              data-testid={`button-print-roll-${roll.id}`}
                                            >
                                              {processingId === roll.id ? (
                                                <span className={t("components.production.groupedprintingqueue.name.text_xs")}>{t("common.processing")}</span>{t('components.production.GroupedPrintingQueue.)_:_(')}<Play className={t("components.production.groupedprintingqueue.name.h_3_w_3")} />
                                              )}
                                            </Button>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className={t("components.production.groupedprintingqueue.name.w_full_text_xs")}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              printRollLabel({
                                                roll: roll,
                                                productionOrder: {
                                                  production_order_number: productionOrderGroup.production_order_number,
                                                  item_name_ar: orderGroup.item_name_ar,
                                                  item_name: orderGroup.item_name,
                                                  size_caption: orderGroup.size_caption
                                                },
                                                order: {
                                                  order_number: orderGroup.order_number,
                                                  customer_name_ar: orderGroup.customer_name_ar,
                                                  customer_name: orderGroup.customer_name
                                                }
                                              });
                                            }}
                                            data-testid={`button-print-label-${roll.id}`}
                                          >
                                            <Printer className={t("components.production.groupedprintingqueue.name.h_3_w_3_mr_1")} />
                                            {t("production.printLabel")}
                                          </Button>
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
      </div>

      {/* Machine Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={t("components.production.groupedprintingqueue.name.max_w_md")} dir="rtl">
          <DialogHeader>
            <DialogTitle>{t("production.selectPrintingMachine")}</DialogTitle>
            <DialogDescription>
              {t("production.mustSelectPrintingMachineBeforeRegistering")}
            </DialogDescription>
          </DialogHeader>

          <div className={t("components.production.groupedprintingqueue.name.space_y_4_py_4")}>
            {selectedRollForPrinting && (
              <div className={t("components.production.groupedprintingqueue.name.p_3_bg_gray_50_rounded_md_border")}>
                <p className={t("components.production.groupedprintingqueue.name.text_sm_font_medium")}>{t("production.selectedRoll")}:</p>
                <p className={t("components.production.groupedprintingqueue.name.text_sm_text_gray_600")}>{selectedRollForPrinting.roll_number}</p>
                <p className={t("components.production.groupedprintingqueue.name.text_xs_text_gray_500")}>
                  {t("production.weight")}: {formatWeight(selectedRollForPrinting.weight_kg)}
                </p>
              </div>
            )}

            <div className={t("components.production.groupedprintingqueue.name.space_y_2")}>
              <Label htmlFor="printing-machine">{t("production.printingMachine")} *</Label>
              {printingMachines.length === 0 ? (
                <div className={t("components.production.groupedprintingqueue.name.p_3_bg_yellow_50_border_border_yellow_200_rounded_md")}>
                  <p className={t("components.production.groupedprintingqueue.name.text_sm_text_yellow_800")}>
                    {t("production.noActivePrintingMachinesAvailable")}
                  </p>
                </div>{t('components.production.GroupedPrintingQueue.)_:_(')}<Select value={selectedPrintingMachine} onValueChange={setSelectedPrintingMachine}>
                  <SelectTrigger id="printing-machine" data-testid="select-printing-machine">
                    <SelectValue placeholder={t("production.selectPrintingMachine")} />
                  </SelectTrigger>
                  <SelectContent>
                    {printingMachines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name_ar || machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter className={t("components.production.groupedprintingqueue.name.gap_2")}>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedRollForPrinting(null);
                setSelectedPrintingMachine("");
              }}
              data-testid="button-cancel-print"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleConfirmPrint}
              disabled={!selectedPrintingMachine || processRollMutation.isPending}
              data-testid="button-confirm-print"
            >
              {processRollMutation.isPending ? t("production.registering") : t("production.registerPrinting")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
