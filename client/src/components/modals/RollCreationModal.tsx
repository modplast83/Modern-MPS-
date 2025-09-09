// src/components/RollCreationModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProductionOrder, Machine } from "@shared/schema";

interface RollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductionOrderId?: number;
}

interface RollFormData {
  production_order_id: number;
  weight_kg: string; // إبقاءه نصيًا لتجميع الإدخال ثم التحويل عند الإرسال
  machine_id: string; // Select يُرجِع string؛ نحافظ عليه كذلك
}

export default function RollCreationModal({
  isOpen,
  onClose,
  selectedProductionOrderId,
}: RollCreationModalProps) {
  const [formData, setFormData] = useState<RollFormData>({
    production_order_id: selectedProductionOrderId || 0,
    weight_kg: "",
    machine_id: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: productionOrders = [],
    isLoading: productionOrdersLoading,
  } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/production-orders"],
  });

  const { data: machines = [], isLoading: machinesLoading } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ["/api/sections"],
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  const { data: rolls = [] } = useQuery<any[]>({
    queryKey: ["/api/rolls"],
    staleTime: 1 * 60 * 1000 // 1 minute
  });

  // مزامنة قيمة أمر الإنتاج المختار من الـprop عند تغييره/فتح المودال
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        production_order_id: selectedProductionOrderId || 0,
      }));
      
      // Set default weight to remaining quantity if a production order is selected
      if (selectedProductionOrderId && selectedOrder) {
        const remainingQuantity = calculateRemainingQuantity(selectedOrder);
        setFormData((prev) => ({
          ...prev,
          weight_kg: remainingQuantity > 0 ? remainingQuantity.toString() : "",
        }));
      }
    }
  }, [isOpen, selectedProductionOrderId, selectedOrder, rolls]);

  const createRollMutation = useMutation({
    mutationFn: async (data: RollFormData) => {
      const weightParsed = Number.parseFloat(data.weight_kg);
      if (!Number.isFinite(weightParsed) || weightParsed <= 0) {
        throw new Error("قيمة الوزن غير صحيحة"); // لماذا: منع إرسال بيانات غير صالحة
      }

      const response = await apiRequest("/api/rolls", {
        method: "POST",
        body: JSON.stringify({
          production_order_id: data.production_order_id,
          weight_kg: weightParsed,
          machine_id: data.machine_id, // احتفظ بها كنص (قد تكون UUID)
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
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error("Roll creation error:", error);
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "فشل في إنشاء الرول",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      production_order_id: selectedProductionOrderId || 0,
      weight_kg: "",
      machine_id: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.production_order_id) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار أمر الإنتاج",
        variant: "destructive",
      });
      return;
    }

    if (!formData.weight_kg.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الوزن",
        variant: "destructive",
      });
      return;
    }

    if (!formData.machine_id) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المكينة",
        variant: "destructive",
      });
      return;
    }

    const weightParsed = Number.parseFloat(formData.weight_kg);
    if (!Number.isFinite(weightParsed) || weightParsed <= 0) {
      toast({
        title: "خطأ",
        description: "الوزن يجب أن يكون رقمًا أكبر من 0",
        variant: "destructive",
      });
      return;
    }

    createRollMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!createRollMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  const selectedOrder = useMemo(
    () =>
      productionOrders.find((o) => o.id === selectedProductionOrderId) || null,
    [productionOrders, selectedProductionOrderId]
  );

  // Calculate remaining quantity for a production order
  const calculateRemainingQuantity = (order: any) => {
    if (!order || !order.quantity_kg) return 0;
    
    const required = parseFloat(order.quantity_kg) || 0;
    const orderRolls = rolls.filter((roll: any) => roll.production_order_id === order.id);
    const produced = orderRolls.reduce((sum: number, roll: any) => sum + (parseFloat(roll.weight_kg) || 0), 0);
    
    return Math.max(0, required - produced);
  };

  // Filter machines to show only film section machines
  const filmSectionMachines = useMemo(() => {
    if (!sections.length || !machines.length) return machines;
    
    // Find film section
    const filmSection = sections.find((section: any) => 
      section.name?.toLowerCase().includes('film') || 
      section.name?.toLowerCase().includes('فيلم') ||
      section.name_ar?.toLowerCase().includes('فيلم') ||
      section.name_ar?.toLowerCase().includes('film')
    );
    
    if (!filmSection) return machines;
    
    // Filter machines that belong to film section
    return machines.filter((machine: any) => machine.section_id === filmSection.id);
  }, [machines, sections]);

  // قيمة Select لأمر الإنتاج عند عدم تمرير selectedProductionOrderId
  const productionOrderValue =
    formData.production_order_id && !selectedProductionOrderId
      ? String(formData.production_order_id)
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {!selectedProductionOrderId && (
            <div className="space-y-2">
              <Label htmlFor="productionOrder">أمر الإنتاج *</Label>
              <Select
                value={productionOrderValue}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    production_order_id: Number.parseInt(value, 10),
                  })
                }
                disabled={productionOrdersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر أمر الإنتاج" />
                </SelectTrigger>
                <SelectContent>
                  {productionOrdersLoading ? (
                    <SelectItem value="loading" disabled>
                      جارِ التحميل...
                    </SelectItem>
                  ) : productionOrders.length ? (
                    productionOrders
                      .filter((order) => order.id)
                      .map((order) => (
                        <SelectItem key={order.id} value={String(order.id)}>
                          {order.production_order_number} -
                          {" "}
                          {(order as any).customer_name_ar ||
                            (order as any).customer_name ||
                            "غير محدد"}
                          {" "}- {" "}
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
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="weight_kg">الوزن (كجم) *</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              min="0.1"
              inputMode="decimal"
              value={formData.weight_kg}
              onChange={(e) =>
                setFormData({ ...formData, weight_kg: e.target.value })
              }
              placeholder="45.2"
              className="text-right"
              data-testid="input-weight_kg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine">المكينة *</Label>
            <Select
              value={formData.machine_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, machine_id: value })}
              disabled={machinesLoading}
            >
              <SelectTrigger data-testid="select-machine">
                <SelectValue placeholder="اختر المكينة" />
              </SelectTrigger>
              <SelectContent>
                {machinesLoading ? (
                  <SelectItem value="loading" disabled>
                    جارِ التحميل...
                  </SelectItem>
                ) : filmSectionMachines.length ? (
                  filmSectionMachines
                    .filter((m) => (m as any).status === "active" && (m as any).id)
                    .map((machine) => (
                      <SelectItem
                        key={String((machine as any).id)}
                        value={String((machine as any).id)}
                      >
                        {(machine as any).name_ar || (machine as any).name}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem value="empty" disabled>
                    لا توجد مكائن متاحة في قسم الفيلم
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

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
      </DialogContent>
    </Dialog>
  );
}
