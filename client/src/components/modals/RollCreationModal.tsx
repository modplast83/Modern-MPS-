import { useState } from "react";
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
import type { ProductionOrder, Machine, User } from "@shared/schema";

interface RollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProductionOrderId?: number;
}

interface RollFormData {
  production_order_id: number;
  weight_kg: string;
  machine_id: string;
}

export default function RollCreationModal({ isOpen, onClose, selectedProductionOrderId }: RollCreationModalProps) {
  const [formData, setFormData] = useState<RollFormData>({
    production_order_id: selectedProductionOrderId || 0,
    weight_kg: "",
    machine_id: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ['/api/production-orders'],
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ['/api/machines'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createRollMutation = useMutation({
    mutationFn: async (data: RollFormData) => {
      const response = await apiRequest('/api/rolls', {
        method: 'POST',
        body: JSON.stringify({
          production_order_id: data.production_order_id,
          weight_kg: parseFloat(data.weight_kg),
          machine_id: data.machine_id
        })
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء الرول بنجاح",
        description: `رقم الرول: ${data.roll_number}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Roll creation error:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في إنشاء الرول",
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
    
    if (!formData.production_order_id || formData.production_order_id === 0 || !formData.weight_kg || !formData.machine_id) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" aria-describedby="roll-creation-description">
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
                value={formData.production_order_id.toString()} 
                onValueChange={(value) => setFormData({ ...formData, production_order_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر أمر الإنتاج" />
                </SelectTrigger>
                <SelectContent>
                  {productionOrders.filter(order => order.id).map((order) => (
                    <SelectItem key={order.id} value={order.id.toString()}>
                      {order.production_order_number} - {(order as any).customer_name_ar || (order as any).customer_name || "غير محدد"} - {(order as any).item_name_ar || (order as any).item_name || (order as any).size_caption || "غير محدد"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedProductionOrderId && (
            <div className="space-y-2">
              <Label>أمر الإنتاج المحدد</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="font-medium text-sm">
                  {productionOrders.find(order => order.id === selectedProductionOrderId)?.production_order_number || `PO-${selectedProductionOrderId}`}
                </p>
                <p className="text-xs text-gray-600">
                  {(() => {
                    const selectedOrder = productionOrders.find(order => order.id === selectedProductionOrderId);
                    return `${(selectedOrder as any)?.customer_name_ar || (selectedOrder as any)?.customer_name || "غير محدد"} - ${(selectedOrder as any)?.item_name_ar || (selectedOrder as any)?.item_name || (selectedOrder as any)?.size_caption || "غير محدد"}`;
                  })()}
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
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              placeholder="150"
              className="text-right"
              data-testid="input-weight_kg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine">المكينة *</Label>
            <Select
              value={formData.machine_id}
              onValueChange={(value) => setFormData({ ...formData, machine_id: value })}
            >
              <SelectTrigger data-testid="select-machine">
                <SelectValue placeholder="اختر المكينة" />
              </SelectTrigger>
              <SelectContent>
                {machines.filter(m => m.status === 'active' && m.id).map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name_ar || machine.name}
                  </SelectItem>
                ))}
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
