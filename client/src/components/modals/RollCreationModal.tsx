import React, { useEffect, useMemo } from "react";
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
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProductionOrder, Machine } from "../../../../shared/schema";

interface RollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductionOrderId?: number;
}

// المخطط للتحقق من صحة الإدخال
const rollFormSchema = z.object({
  production_order_id: z.number().min(1, "يرجى اختيار أمر الإنتاج"),
  weight_kg: z
    .string()
    .min(1, "يرجى إدخال الوزن")
    .refine((val) => {
      const num = Number.parseFloat(val.replace(",", "."));
      return !Number.isNaN(num) && num > 0;
    }, "الوزن يجب أن يكون رقمًا أكبر من 0"),
  machine_id: z.preprocess(
    (v) => (typeof v === "string" ? Number.parseInt(v, 10) : v),
    z.number().int().positive("يرجى اختيار المكينة"),
  ),
});

type RollFormData = z.infer<typeof rollFormSchema>;

export default function RollCreationModal({
  isOpen,
  onClose,
  selectedProductionOrderId,
}: RollCreationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RollFormData>({
    resolver: zodResolver(rollFormSchema),
    defaultValues: {
      production_order_id:
        selectedProductionOrderId && selectedProductionOrderId > 0
          ? selectedProductionOrderId
          : undefined,
      weight_kg: "",
      machine_id: undefined as unknown as number,
    },
    mode: "onChange",
  });

  // الجلب عند فتح المودال فقط لتحسين الأداء
  const { data: productionOrders = [], isLoading: productionOrdersLoading } =
    useQuery<ProductionOrder[]>({
      queryKey: ["/api/production-orders"],
      enabled: isOpen,
    });

  const { data: machines = [], isLoading: machinesLoading } = useQuery<
    Machine[]
  >({
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
    () =>
      productionOrders.find(
        (o) =>
          o.id ===
          (selectedProductionOrderId ?? form.getValues("production_order_id")),
      ) || null,
    [productionOrders, selectedProductionOrderId],
  );

  const remainingQuantity = useMemo(() => {
    if (!selectedOrder || !selectedOrder.quantity_kg) return 0;
    const required = Number.parseFloat(String(selectedOrder.quantity_kg)) || 0;
    const orderRolls = rolls.filter(
      (r: any) => r.production_order_id === selectedOrder.id,
    );
    const produced = orderRolls.reduce(
      (sum: number, r: any) =>
        sum + (Number.parseFloat(String(r.weight_kg)) || 0),
      0,
    );
    return Math.max(0, required - produced);
  }, [selectedOrder, rolls]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedProductionOrderId && selectedProductionOrderId > 0) {
      form.setValue("production_order_id", selectedProductionOrderId, {
        shouldValidate: true,
      });
    } else if (!form.getValues("production_order_id") && productionOrders.length > 0) {
      form.setValue("production_order_id", productionOrders[0].id, {
        shouldValidate: true,
      });
    }

    if (!form.getValues("weight_kg") && remainingQuantity > 0) {
      form.setValue("weight_kg", String(remainingQuantity));
    }
  }, [isOpen, selectedProductionOrderId, productionOrders.length, remainingQuantity]);

  const createRollMutation = useMutation({
    mutationFn: async (data: RollFormData) => {
      const weightParsed = Number.parseFloat(data.weight_kg.replace(",", "."));
      const response = await apiRequest("/api/rolls", {
        method: "POST",
        body: JSON.stringify({
          production_order_id: data.production_order_id,
          weight_kg: weightParsed,
          machine_id: data.machine_id,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "فشل الطلب");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء الرول بنجاح",
        description: `رقم الرول: ${data.roll_number}`,
      });
      [
        "/api/rolls",
        "/api/production-orders",
        "/api/production/film-queue",
        "/api/production/hierarchical-orders",
        "/api/production/printing-queue",
        "/api/production/cutting-queue",
        "/api/production/grouped-cutting-queue",
      ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      let msg = "فشل في إنشاء الرول";
      if (error instanceof Error) {
        const e = error.message || "";
        if (/Network error|Failed to fetch/i.test(e))
          msg = "تعذر الاتصال بالخادم. تحقق من الإنترنت.";
        else if (/Validation|Invalid/i.test(e))
          msg = "البيانات غير صحيحة. تحقق من الحقول.";
        else if (/Conflict|exists/i.test(e))
          msg = "الرول موجود مسبقاً أو يوجد تضارب.";
        else if (/REMAINING_QUANTITY_EXCEEDED/.test(e))
          msg = "الوزن المطلوب يتجاوز الكمية المتبقية (تحقق الخادم).";
        else msg = e;
      }
      toast({ title: "خطأ في إنشاء الرول", description: msg, variant: "destructive" });
    },
  });

  const onSubmit = (data: RollFormData) => {
    const weightParsed = Number.parseFloat(data.weight_kg.replace(",", "."));
    if (remainingQuantity > 0 && weightParsed > remainingQuantity + 0.0001) {
      toast({
        title: "قيمة الوزن تتجاوز المتبقي",
        description: `المتبقي من الكمية: ${remainingQuantity.toFixed(2)} كجم`,
        variant: "destructive",
      });
      return;
    }
    createRollMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createRollMutation.isPending) {
      onClose();
      form.reset();
    }
  };

  const filmSectionMachines = useMemo(() => {
    if (!sections.length || !machines.length) return machines;
    const filmSection = sections.find((s: any) =>
      [s.name, s.name_ar]
        .filter(Boolean)
        .map((x: string) => x.toLowerCase())
        .some((n: string) => n.includes("film") || n.includes("فيلم")),
    );
    if (!filmSection) return machines;
    return machines.filter(
      (m: any) => m.section_id === filmSection.id && m.status === "active" && m.id,
    );
  }, [machines, sections]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md" aria-describedby="roll-creation-description">
        <DialogHeader>
          <DialogTitle>إنشاء رول جديد</DialogTitle>
          <DialogDescription id="roll-creation-description">
            إضافة رول جديد إلى أمر الإنتاج المحدد
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!selectedProductionOrderId && (
              <FormField
                control={form.control}
                name="production_order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>أمر الإنتاج *</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number.parseInt(v, 10))}
                      disabled={productionOrdersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر أمر الإنتاج" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productionOrdersLoading ? (
                          <SelectItem value="loading" disabled>جارِ التحميل...</SelectItem>
                        ) : productionOrders.length ? (
                          productionOrders.map((order) => (
                            <SelectItem key={order.id} value={String(order.id)}>
                              {order.production_order_number} -{" "}
                              {(order as any).customer_name_ar ||
                                (order as any).customer_name ||
                                "غير محدد"}{" "}
                              -{" "}
                              {(order as any).item_name_ar ||
                                (order as any).item_name ||
                                (order as any).size_caption ||
                                "غير محدد"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="empty" disabled>لا توجد أوامر إنتاج</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedProductionOrderId && (
              <div className="space-y-2">
                <Label>أمر الإنتاج المحدد</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="font-medium text-sm">
                    {selectedOrder?.production_order_number || `PO-${selectedProductionOrderId}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    {`${(selectedOrder as any)?.customer_name_ar ||
                      (selectedOrder as any)?.customer_name ||
                      "غير محدد"} - ${(selectedOrder as any)?.item_name_ar ||
                      (selectedOrder as any)?.item_name ||
                      (selectedOrder as any)?.size_caption ||
                      "غير محدد"}`}
                  </p>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوزن (كجم) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      inputMode="decimal"
                      placeholder="45.2"
                      className="text-right"
                      {...field}
                    />
                  </FormControl>
                  {selectedOrder && (
                    <p className="text-xs text-gray-600">
                      المتبقي من الكمية:{" "}
                      <span className="font-medium">{remainingQuantity.toFixed(2)} كجم</span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المكينة *</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(v) => field.onChange(Number.parseInt(v, 10))}
                    disabled={machinesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المكينة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {machinesLoading ? (
                        <SelectItem value="loading" disabled>جارِ التحميل...</SelectItem>
                      ) : filmSectionMachines.length ? (
                        filmSectionMachines.map((machine: any) => (
                          <SelectItem key={String(machine.id)} value={String(machine.id)}>
                            {machine.name_ar || machine.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>لا توجد مكائن متاحة في قسم الفيلم</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 rtl:space-x-reverse">
              <Button type="button" variant="outline" onClick={handleClose} disabled={createRollMutation.isPending}>
                إلغاء
              </Button>
              <Button type="submit" className="btn-primary" disabled={createRollMutation.isPending || remainingQuantity === 0}>
                {createRollMutation.isPending
                  ? "جاري الإنشاء..."
                  : remainingQuantity === 0
                  ? "اكتملت الكمية"
                  : "إنشاء رول"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
