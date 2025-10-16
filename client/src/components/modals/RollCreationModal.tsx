// src/components/RollCreationModal.tsx
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
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProductionOrder, Machine } from "../../../../shared/schema";
import ErrorBoundary from "../ErrorBoundary";

interface RollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductionOrderId?: number;
}

const rollFormSchema = z.object({
  production_order_id: z.number().min(1, "يرجى اختيار أمر الإنتاج"),
  weight_kg: z
    .string()
    .min(1, "يرجى إدخال الوزن")
    .refine((val) => {
      const num = Number.parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "الوزن يجب أن يكون رقمًا أكبر من 0"),
  machine_id: z.string().min(1, "يرجى اختيار المكينة"),
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
      production_order_id: selectedProductionOrderId || 1, // Default to 1 instead of 0
      weight_kg: "",
      machine_id: "",
    },
  });

  const { data: productionOrders = [], isLoading: productionOrdersLoading } =
    useQuery<ProductionOrder[]>({
      queryKey: ["/api/production-orders"],
    });

  const { data: machines = [], isLoading: machinesLoading } = useQuery<
    Machine[]
  >({
    queryKey: ["/api/machines"],
  });

  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ["/api/sections"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: rolls = [] } = useQuery<any[]>({
    queryKey: ["/api/rolls"],
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const selectedOrder = useMemo(
    () =>
      productionOrders.find((o) => o.id === selectedProductionOrderId) || null,
    [productionOrders, selectedProductionOrderId],
  );

  // مزامنة قيمة أمر الإنتاج المختار من الـprop عند تغييره/فتح المودال
  useEffect(() => {
    if (isOpen) {
      // Only set production_order_id if a valid one is provided
      if (selectedProductionOrderId && selectedProductionOrderId > 0) {
        form.setValue("production_order_id", selectedProductionOrderId);
      } else if (productionOrders.length > 0) {
        // If no valid ID provided, default to the first available production order
        form.setValue("production_order_id", productionOrders[0].id);
      }

      // Set default weight to remaining quantity if a production order is selected
      if (selectedProductionOrderId && selectedOrder) {
        const remainingQuantity = calculateRemainingQuantity(selectedOrder);
        form.setValue(
          "weight_kg",
          remainingQuantity > 0 ? remainingQuantity.toString() : "",
        );
      }
    }
  }, [
    isOpen,
    selectedProductionOrderId,
    selectedOrder,
    rolls,
    form,
    productionOrders,
  ]);

  const createRollMutation = useMutation({
    mutationFn: async (data: RollFormData) => {
      const weightParsed = Number.parseFloat(data.weight_kg);

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
      // تحديث جميع البيانات المرتبطة بالرولات والإنتاج
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/film-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/hierarchical-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/printing-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/cutting-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/grouped-cutting-queue"] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      console.error("Roll creation error:", error);

      let errorMessage = "فشل في إنشاء الرول";

      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle specific error types with better user messages
        if (
          errorMessage.includes("Network error") ||
          errorMessage.includes("Failed to fetch")
        ) {
          errorMessage =
            "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.";
        } else if (
          errorMessage.includes("Validation") ||
          errorMessage.includes("Invalid")
        ) {
          errorMessage =
            "البيانات المدخلة غير صحيحة. يرجى مراجعة الحقول والمحاولة مرة أخرى.";
        } else if (
          errorMessage.includes("Conflict") ||
          errorMessage.includes("already exists")
        ) {
          errorMessage = "الرول موجود مسبقاً أو يوجد تضارب في البيانات.";
        }
      }

      toast({
        title: "خطأ في إنشاء الرول",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RollFormData) => {
    createRollMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createRollMutation.isPending) {
      onClose();
      form.reset();
    }
  };

  // Calculate remaining quantity for a production order
  const calculateRemainingQuantity = (order: any) => {
    if (!order || !order.quantity_kg) return 0;

    const required = parseFloat(order.quantity_kg) || 0;
    const orderRolls = rolls.filter(
      (roll: any) => roll.production_order_id === order.id,
    );
    const produced = orderRolls.reduce(
      (sum: number, roll: any) => sum + (parseFloat(roll.weight_kg) || 0),
      0,
    );

    return Math.max(0, required - produced);
  };

  // Filter machines to show only film section machines
  const filmSectionMachines = useMemo(() => {
    if (!sections.length || !machines.length) return machines;

    // Find film section
    const filmSection = sections.find(
      (section: any) =>
        section.name?.toLowerCase().includes("film") ||
        section.name?.toLowerCase().includes("فيلم") ||
        section.name_ar?.toLowerCase().includes("فيلم") ||
        section.name_ar?.toLowerCase().includes("film"),
    );

    if (!filmSection) return machines;

    // Filter machines that belong to film section
    return machines.filter(
      (machine: any) => machine.section_id === filmSection.id,
    );
  }, [machines, sections]);

  // قيمة Select لأمر الإنتاج عند عدم تمرير selectedProductionOrderId
  const productionOrderValue =
    form.watch("production_order_id") && !selectedProductionOrderId
      ? String(form.watch("production_order_id"))
      : undefined;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose(); // لماذا: لا نغلق إلا عند محاولة الإغلاق
      }}
    >
      <DialogContent
        className="max-w-md"
        aria-describedby="roll-creation-description"
      >
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
                      value={
                        field.value != null ? String(field.value) : undefined
                      }
                      onValueChange={(value) =>
                        field.onChange(Number.parseInt(value, 10))
                      }
                      disabled={productionOrdersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر أمر الإنتاج" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productionOrdersLoading ? (
                          <SelectItem value="loading" disabled>
                            جارِ التحميل...
                          </SelectItem>
                        ) : productionOrders.length ? (
                          productionOrders
                            .filter((order) => order.id)
                            .map((order) => (
                              <SelectItem
                                key={order.id}
                                value={String(order.id)}
                              >
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
                          <SelectItem value="empty" disabled>
                            لا توجد أوامر إنتاج متاحة
                          </SelectItem>
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
                    {selectedOrder?.production_order_number ||
                      `PO-${selectedProductionOrderId}`}
                  </p>
                  <p className="text-xs text-gray-600">
                    {`${
                      (selectedOrder as any)?.customer_name_ar ||
                      (selectedOrder as any)?.customer_name ||
                      "غير محدد"
                    } - ${
                      (selectedOrder as any)?.item_name_ar ||
                      (selectedOrder as any)?.item_name ||
                      (selectedOrder as any)?.size_caption ||
                      "غير محدد"
                    }`}
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
                      data-testid="input-weight_kg"
                      {...field}
                    />
                  </FormControl>
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
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                    disabled={machinesLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-machine">
                        <SelectValue placeholder="اختر المكينة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {machinesLoading ? (
                        <SelectItem value="loading" disabled>
                          جارِ التحميل...
                        </SelectItem>
                      ) : filmSectionMachines.length ? (
                        filmSectionMachines
                          .filter(
                            (m) =>
                              (m as any).status === "active" && (m as any).id,
                          )
                          .map((machine) => (
                            <SelectItem
                              key={String((machine as any).id)}
                              value={String((machine as any).id)}
                            >
                              {(machine as any).name_ar ||
                                (machine as any).name}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="empty" disabled>
                          لا توجد مكائن متاحة في قسم الفيلم
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 space-x-reverse pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createRollMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="btn-primary"
                disabled={createRollMutation.isPending}
              >
                {createRollMutation.isPending ? "جاري الإنشاء..." : "إنشاء رول"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
