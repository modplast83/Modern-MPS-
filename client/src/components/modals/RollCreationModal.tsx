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
import type { JobOrder, Machine, User } from "@shared/schema";

interface RollCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RollFormData {
  job_order_id: number;
  weight_kg: string;
  machine_id: string;
  final_roll: boolean;
}

export default function RollCreationModal({ isOpen, onClose }: RollCreationModalProps) {
  const [formData, setFormData] = useState<RollFormData>({
    job_order_id: 0,
    weight_kg: "",
    machine_id: "",
    final_roll: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobOrders = [] } = useQuery<JobOrder[]>({
    queryKey: ['/api/job-orders'],
  });

  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ['/api/machines'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createRollMutation = useMutation({
    mutationFn: async (data: RollFormData) => {
      const response = await fetch('/api/rolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_order_id: data.job_order_id,
          weight_kg: parseFloat(data.weight_kg),
          machine_id: data.machine_id,
          final_roll: data.final_roll
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في إنشاء الرول');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم إنشاء الرول بنجاح",
        description: `رقم الرول: ${data.roll_number}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-orders'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الرول",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      job_order_id: 0,
      weight_kg: "",
      machine_id: "",
      final_roll: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.job_order_id || !formData.weight_kg || !formData.machine_id) {
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
            إضافة رول جديد إلى أمر التشغيل المحدد
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobOrder">أمر التشغيل *</Label>
            <Select 
              value={formData.job_order_id.toString()} 
              onValueChange={(value) => setFormData({ ...formData, job_order_id: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر أمر التشغيل" />
              </SelectTrigger>
              <SelectContent>
                {jobOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id.toString()}>
                    {order.job_number} - {(order as any).customer_name_ar || (order as any).customer_name || "غير محدد"} - {(order as any).item_name_ar || (order as any).item_name || (order as any).size_caption || "غير محدد"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight_kg">الوزن (كجم) *</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              placeholder="45.2"
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
                {machines.filter(m => m.status === 'active').map((machine) => (
                  <SelectItem key={machine.id} value={machine.id}>
                    {machine.name_ar || machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              id="final_roll"
              checked={formData.final_roll}
              onChange={(e) => setFormData({ ...formData, final_roll: e.target.checked })}
              data-testid="checkbox-final_roll"
            />
            <Label htmlFor="final_roll" className="text-sm">رول نهائي (تجاهل حد التسامح)</Label>
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
