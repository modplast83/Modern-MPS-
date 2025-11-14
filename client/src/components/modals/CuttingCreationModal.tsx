// src/components/modals/CuttingCreationModal.tsx
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import NumberInput from "@shared/NumberInput";
import { ProductionOrderSelect } from "@shared/ProductionOrderSelect";
import { MachineSelect } from "@shared/MachineSelect";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import type { ProductionOrder, Machine } from "../../../../shared/schema";
import { useRemainingQuantity } from "../../hooks/useRemainingQuantity";
import { useTranslation } from 'react-i18next';

const createCuttingFormSchema = (t: (key: string) => string) => z.object({
  production_order_id: z.number().min(1, t('forms.selectProductionOrder')),
  machine_id: z.number().int().positive(t('forms.selectMachine')),
  weight_kg: z
    .string()
    .min(1, t('forms.enterWeight'))
    .refine((val) => {
      const num = Number.parseFloat(val.replace(",", "."));
      return !Number.isNaN(num) && num > 0;
    }, t('forms.weightMustBePositive')),
  blade_setup_id: z.number().int().positive(t('forms.bladeSetupRequired')),
});

export type CuttingFormData = {
  production_order_id: number;
  machine_id: number;
  weight_kg: string;
  blade_setup_id: number;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedProductionOrderId?: number;
}

export default function CuttingCreationModal({ isOpen, onClose, selectedProductionOrderId }: Props) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const cuttingFormSchema = useMemo(() =>{t('components.modals.CuttingCreationModal.createcuttingformschema(t),_[t]);_const_form_=_useform')}<CuttingFormData>({
    resolver: zodResolver(cuttingFormSchema),
    defaultValues: {
      production_order_id: selectedProductionOrderId,
      machine_id: undefined as unknown as number,
      blade_setup_id: undefined as unknown as number,
      weight_kg: "",
    },
    mode: "onChange",
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/production-orders"],
    enabled: isOpen,
  });
  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ["/api/sections"],
    enabled: isOpen,
    staleTime: 10 * 60 * 1000,
  });
  const { data: rolls = [] } = useQuery<any[]>({
    queryKey: ["/api/rolls"],
    enabled: isOpen,
    staleTime: 60 * 1000,
  });

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === (selectedProductionOrderId ?? form.getValues("production_order_id"))) || null,
    [orders, selectedProductionOrderId]
  );

  const remaining = useRemainingQuantity(selectedOrder as any, rolls);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedProductionOrderId && selectedProductionOrderId > 0) {
      form.setValue("production_order_id", selectedProductionOrderId, { shouldValidate: true });
    } else if (!form.getValues("production_order_id") && orders.length > 0) {
      form.setValue("production_order_id", orders[0].id, { shouldValidate: true });
    }
    if (!form.getValues("weight_kg") && remaining > 0) {
      form.setValue("weight_kg", String(remaining));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedProductionOrderId, orders.length, remaining]);

  const createMutation = useMutation({
    mutationFn: async (data: CuttingFormData) => {
      const weightParsed = Number.parseFloat(data.weight_kg.replace(",", "."));
      const response = await apiRequest("/api/cutting-jobs", {
        method: "POST",
        body: JSON.stringify({ ...data, weight_kg: weightParsed }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || t('toast.requestFailed'));
      }
      return response.json();
    },
    onSuccess: () => {
      ["/api/rolls", "/api/production-orders", "/api/production/cutting-queue", "/api/production/grouped-cutting-queue"].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      );
      toast({ title: t('modals.cuttingJob.successTitle'), description: t('modals.cuttingJob.successDescription') });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      const msg = String(error?.message || "");
      toast({
        title: t('modals.cuttingJob.errorTitle'),
        description: /REMAINING_QUANTITY_EXCEEDED/.test(msg)
          ? t('modals.cuttingJob.errorQuantityExceeded')
          : /Network error|Failed to fetch/i.test(msg)
          ? t('toast.networkError')
          : msg,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CuttingFormData) => {
    const weightParsed = Number.parseFloat(data.weight_kg.replace(",", "."));
    if (remaining > 0 && weightParsed > remaining + 0.0001) {
      toast({ title: t('modals.cuttingJob.weightExceedsRemaining'), description: t('modals.cuttingJob.remainingLabel', { remaining: remaining.toFixed(2) }), variant: "destructive" });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={t("components.modals.cuttingcreationmodal.name.max_w_md")} aria-describedby="cutting-creation-description">
        <DialogHeader>
          <DialogTitle>{t('modals.cuttingJob.title')}</DialogTitle>
          <DialogDescription id="cutting-creation-description">{t('modals.cuttingJob.description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={t("components.modals.cuttingcreationmodal.name.space_y_4")}>
            {!selectedProductionOrderId && (
              <FormField
                control={form.control}
                name="{t('components.modals.CuttingCreationModal.name.production_order_id')}"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('modals.cuttingJob.productionOrder')} *</FormLabel>
                    <ProductionOrderSelect value={field.value} onChange={field.onChange} loading={ordersLoading} orders={orders} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedProductionOrderId && (
              <div className={t("components.modals.cuttingcreationmodal.name.space_y_2")}>
                <Label>{t('modals.cuttingJob.selectedProductionOrder')}</Label>
                <div className={t("components.modals.cuttingcreationmodal.name.p_3_bg_gray_50_rounded_md_border")}>
                  <p className={t("components.modals.cuttingcreationmodal.name.font_medium_text_sm")}>
                    {selectedOrder?.production_order_number || `PO-${selectedProductionOrderId}`}
                  </p>
                  <p className={t("components.modals.cuttingcreationmodal.name.text_xs_text_gray_600")}>
                    {`${(selectedOrder as any)?.customer_name_ar || (selectedOrder as any)?.customer_name || t('common.notSpecified')} - ${(selectedOrder as any)?.item_name_ar || (selectedOrder as any)?.item_name || (selectedOrder as any)?.size_caption || t('common.notSpecified')}`}
                  </p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="{t('components.modals.CuttingCreationModal.name.weight_kg')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('modals.cuttingJob.weightKg')} *</FormLabel>
                  <FormControl>
                    <NumberInput value={field.value} onChange={field.onChange} placeholder="{t('components.modals.CuttingCreationModal.placeholder.45.2')}" />
                  </FormControl>
                  {selectedOrder && <p className={t("components.modals.cuttingcreationmodal.name.text_xs_text_gray_600")}>{t('modals.cuttingJob.remaining')}: <span className={t("components.modals.cuttingcreationmodal.name.font_medium")}>{remaining.toFixed(2)} {t('units.kg')}</span></p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="{t('components.modals.CuttingCreationModal.name.machine_id')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('modals.cuttingJob.machine')} *</FormLabel>
                  <MachineSelect value={field.value} onChange={field.onChange} loading={machinesLoading} machines={machines} sections={sections} sectionKeyword="cutting" />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="{t('components.modals.CuttingCreationModal.name.blade_setup_id')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('modals.cuttingJob.bladeSetup')} *</FormLabel>
                  {/* TODO: Replace with real Select when API is ready */}
                  <NumberInput value={String(field.value ?? "")} onChange={(v: string) => field.onChange(Number.parseInt(v || "0", 10))} placeholder={t('modals.cuttingJob.bladeSetupIdPlaceholder')} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={t("components.modals.cuttingcreationmodal.name.flex_justify_end_gap_3_pt_4_rtl_space_x_reverse")}>
              <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>{t('common.cancel')}</Button>
              <Button type="submit" className={t("components.modals.cuttingcreationmodal.name.btn_primary")} disabled={createMutation.isPending || remaining === 0}>
                {createMutation.isPending ? t('modals.cuttingJob.creating') : remaining === 0 ? t('modals.cuttingJob.quantityCompleted') : t('modals.cuttingJob.createTask')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
