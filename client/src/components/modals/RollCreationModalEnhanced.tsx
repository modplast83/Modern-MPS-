import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Checkbox } from "../ui/checkbox";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "../../lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Machine } from "../../../../shared/schema";
import { safeParseFloat, formatNumberAr } from "../../../../shared/number-utils";
import { AlertTriangle, Clock, Package } from "lucide-react";
import { toastMessages } from "../../lib/toastMessages";
import { useTranslation } from 'react-i18next';

interface RollCreationModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  productionOrderId: number;
  productionOrderData?: any;
  isFinalRoll?: boolean;
}

const createRollFormSchema = (t: (key: string) => string) => z.object({
  weight_kg: z
    .string()
    .min(1, t('forms.enterWeight'))
    .refine((val) => {
      const num = safeParseFloat(val.replace(",", "."), -1);
      return num > 0;
    }, t('forms.weightMustBePositive')),
  film_machine_id: z.string().min(1, t('forms.selectFilmMachine')),
  is_final_roll: z.boolean().default(false),
});

export type RollFormData = {
  weight_kg: string;
  film_machine_id: string;
  is_final_roll: boolean;
};

export default function RollCreationModalEnhanced({
  isOpen,
  onClose,
  productionOrderId,
  productionOrderData,
  isFinalRoll = false,
}: RollCreationModalEnhancedProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [lastProductionTime, setLastProductionTime] = useState<number | null>(null);

  const rollFormSchema = useMemo(() =>{t('components.modals.RollCreationModalEnhanced.createrollformschema(t),_[t]);_const_form_=_useform')}<RollFormData>({
    resolver: zodResolver(rollFormSchema),
    defaultValues: {
      weight_kg: "",
      film_machine_id: "",
      is_final_roll: isFinalRoll,
    },
    mode: "onChange",
  });

  // Set final roll checkbox when prop changes
  useEffect(() => {
    form.setValue("is_final_roll", isFinalRoll);
  }, [isFinalRoll, form]);

  // Fetch machines
  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Filter film machines only (section_id = "SEC03" for film section)
  const filmMachines = useMemo(() => {
    return machines.filter(m => m.section_id === "SEC03" && m.status === "active");
  }, [machines]);

  // Calculate remaining quantity
  const remainingQuantity = useMemo(() => {
    if (!productionOrderData) return 0;
    const required = Number(productionOrderData.final_quantity_kg || productionOrderData.quantity_kg || 0);
    const produced = Number(productionOrderData.total_weight_produced || 0);
    return Math.max(0, required - produced);
  }, [productionOrderData]);

  // Suggest roll number
  const suggestedRollNumber = useMemo(() => {
    if (!productionOrderData) return "";
    const rollsCount = productionOrderData.rolls_count || 0;
    return `${productionOrderData.production_order_number}-R${String(rollsCount + 1).padStart(3, "0")}`;
  }, [productionOrderData]);

  // Calculate average production time
  const averageProductionTime = useMemo(() => {
    if (!productionOrderData?.production_start_time || !productionOrderData?.rolls_count) {
      return null;
    }
    const startTime = new Date(productionOrderData.production_start_time).getTime();
    const currentTime = Date.now();
    const totalMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
    return Math.floor(totalMinutes / productionOrderData.rolls_count);
  }, [productionOrderData]);

  // Set default weight to remaining quantity
  useEffect(() => {
    if (!form.getValues("weight_kg") && remainingQuantity > 0) {
      form.setValue("weight_kg", String(remainingQuantity));
    }
  }, [remainingQuantity, form]);

  // Create roll mutation
  const createRollMutation = useMutation({
    mutationFn: async (data: RollFormData) => {
      const weightParsed = Number.parseFloat(data.weight_kg.replace(",", "."));
      
      // Choose endpoint based on whether it's a final roll
      const endpoint = data.is_final_roll 
        ? "/api/rolls/create-final"
        : "/api/rolls/create-with-timing";
      
      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          production_order_id: productionOrderId,
          weight_kg: weightParsed,
          film_machine_id: data.film_machine_id,
          is_last_roll: data.is_final_roll,
        }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || t('toast.errorRollCreation'));
      }
      return response.json();
    },
    onSuccess: (data) => {
      const rollNumber = data.roll_number || "";
      const message = data.is_last_roll 
        ? toastMessages.rolls.finalRollCreated(rollNumber)
        : toastMessages.rolls.created(rollNumber);
        
      toast({ 
        title: message.title, 
        description: message.description,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders/active-for-operator"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-queues"] });
      
      onClose();
      form.reset();
    },
    onError: (error: unknown) => {
      console.error("Roll creation error:", error);
      toast({
        title: t('toast.errorRollCreation'),
        description: error instanceof Error ? error.message : t('toast.unexpectedError'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RollFormData) => {
    // Warn if creating final roll with significant remaining quantity
    if (data.is_final_roll && remainingQuantity > 50) {
      if (!confirm(t('modals.rollCreation.confirmFinalWithRemaining', { remaining: formatNumberAr(remainingQuantity) }))) {
        return;
      }
    }
    createRollMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={t("components.modals.name.sm_max_w_500px_")} dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isFinalRoll ? t('modals.rollCreation.titleFinal') : t('modals.rollCreation.title')}
          </DialogTitle>
          <DialogDescription>
            {productionOrderData && (
              <div className={t("components.modals.name.mt_2_space_y_1_text_sm")}>
                <p>{t('modals.rollCreation.productionOrder')}: {productionOrderData.production_order_number}</p>
                <p>{t('modals.rollCreation.product')}: {productionOrderData.product_name}</p>
                <p>{t('modals.rollCreation.customer')}: {productionOrderData.customer_name}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className={t("components.modals.name.space_y_4")}>
            {/* Suggested Roll Number */}
            <div className={t("components.modals.name.bg_blue_50_dark_bg_blue_900_20_p_3_rounded_lg")}>
              <p className={t("components.modals.name.text_sm_text_blue_900_dark_text_blue_100")}>
                {t('modals.rollCreation.suggestedRollNumber')}: <strong>{suggestedRollNumber}</strong>
              </p>
            </div>

            {/* Production Stats */}
            <div className={t("components.modals.name.grid_grid_cols_2_gap_4")}>
              <div className={t("components.modals.name.bg_gray_50_dark_bg_gray_800_p_3_rounded_lg")}>
                <div className={t("components.modals.name.flex_items_center_gap_2")}>
                  <Package className={t("components.modals.name.h_4_w_4_text_gray_600")} />
                  <p className={t("components.modals.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('modals.rollCreation.remainingQuantity')}</p>
                </div>
                <p className={t("components.modals.name.text_lg_font_bold_text_gray_900_dark_text_gray_100")}>
                  {formatNumberAr(remainingQuantity)} {t('units.kg')}
                </p>
                {remainingQuantity < 50 && (
                  <p className={t("components.modals.name.text_xs_text_orange_600_dark_text_orange_400_mt_1_flex_items_center_gap_1")}>
                    <AlertTriangle className={t("components.modals.name.h_3_w_3")} />
                    {t('modals.rollCreation.nearingCompletion')}
                  </p>
                )}
              </div>

              <div className={t("components.modals.name.bg_gray_50_dark_bg_gray_800_p_3_rounded_lg")}>
                <div className={t("components.modals.name.flex_items_center_gap_2")}>
                  <Clock className={t("components.modals.name.h_4_w_4_text_gray_600")} />
                  <p className={t("components.modals.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('modals.rollCreation.avgProductionTime')}</p>
                </div>
                <p className={t("components.modals.name.text_lg_font_bold_text_gray_900_dark_text_gray_100")}>
                  {averageProductionTime ? `${averageProductionTime} ${t('forms.minute')}` : t('modals.rollCreation.notAvailable')}
                </p>
              </div>
            </div>

            {/* Weight Input */}
            <FormField
              control={form.control}
              name="{t('components.modals.RollCreationModalEnhanced.name.weight_kg')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('modals.rollCreation.weightKg')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder={t('modals.rollCreation.enterWeight')}
                      className={t("components.modals.name.text_right")}
                      data-testid="input-weight"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Machine Selection */}
            <FormField
              control={form.control}
              name="{t('components.modals.RollCreationModalEnhanced.name.film_machine_id')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('modals.rollCreation.filmMachine')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={machinesLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-machine">
                        <SelectValue placeholder={t('modals.rollCreation.selectMachine')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filmMachines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name_ar || machine.name} - {machine.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Final Roll Checkbox */}
            {!isFinalRoll && productionOrderData?.rolls_count >{t('components.modals.RollCreationModalEnhanced.0_&&_(')}<FormField
                control={form.control}
                name="{t('components.modals.RollCreationModalEnhanced.name.is_final_roll')}"
                render={({ field }) => (
                  <FormItem className={t("components.modals.name.flex_items_center_space_x_2_space_y_0_bg_yellow_50_dark_bg_yellow_900_20_p_3_rounded_lg")}>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-final-roll"
                      />
                    </FormControl>
                    <div className={t("components.modals.name.space_y_1_leading_none_mr_2")}>
                      <FormLabel className={t("components.modals.name.cursor_pointer")}>
                        {t('modals.rollCreation.isFinalRoll')}
                      </FormLabel>
                      <p className={t("components.modals.name.text_xs_text_gray_600_dark_text_gray_400")}>
                        {t('modals.rollCreation.finalRollNote')}
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Warning for final roll */}
            {(form.watch("is_final_roll") || isFinalRoll) && (
              <div className={t("components.modals.name.bg_amber_50_dark_bg_amber_900_20_border_border_amber_200_dark_border_amber_800_p_3_rounded_lg")}>
                <div className={t("components.modals.name.flex_items_start_gap_2")}>
                  <AlertTriangle className={t("components.modals.name.h_4_w_4_text_amber_600_dark_text_amber_400_mt_0_5")} />
                  <div className={t("components.modals.name.text_sm_text_amber_900_dark_text_amber_100")}>
                    <p className={t("components.modals.name.font_semibold")}>{t('modals.rollCreation.finalRollWarning')}</p>
                    <p>{t('modals.rollCreation.finalRollWarningText')}</p>
                    <ul className={t("components.modals.name.list_disc_list_inside_mt_1_space_y_1")}>
                      <li>{t('modals.rollCreation.filmStageWillClose')}</li>
                      <li>{t('modals.rollCreation.noMoreRolls')}</li>
                      <li>{t('modals.rollCreation.productionTimeCalculated')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={t("components.modals.name.flex_justify_between")}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createRollMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createRollMutation.isPending}
                data-testid="button-submit-roll"
                variant={form.watch("is_final_roll") || isFinalRoll ? "destructive" : "default"}
              >
                {createRollMutation.isPending ? (
                  <>
                    <div className={t("components.modals.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_ml_2")}></div>
                    {t('modals.rollCreation.creating')}
                  </>
                ) : (
                  form.watch("is_final_roll") || isFinalRoll ? t('modals.rollCreation.createFinalRoll') : t('modals.rollCreation.createRoll')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}