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
  weight: string;
  machine_id: number;
  employee_id: number;
}

export default function RollCreationModal({ isOpen, onClose }: RollCreationModalProps) {
  const [formData, setFormData] = useState<RollFormData>({
    job_order_id: 0,
    weight: "",
    machine_id: 0,
    employee_id: 0,
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
      const response = await apiRequest('/api/rolls', {
        method: 'POST',
        body: JSON.stringify({
          job_order_id: data.job_order_id,
          weight: parseFloat(data.weight),
          machine_id: data.machine_id,
          employee_id: data.employee_id,
          status: 'for_printing',
          current_stage: 'film'
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
      weight: "",
      machine_id: 0,
      employee_id: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.job_order_id || !formData.weight || !formData.machine_id || !formData.employee_id) {
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
                    {order.job_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">الوزن (كجم) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="45.2"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine">المكينة *</Label>
            <Select
              value={formData.machine_id.toString()}
              onValueChange={(value) => setFormData({ ...formData, machine_id: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المكينة" />
              </SelectTrigger>
              <SelectContent>
                {machines.filter(m => m.status === 'active').map((machine) => (
                  <SelectItem key={machine.id} value={machine.id.toString()}>
                    {machine.name_ar || machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee">العامل *</Label>
            <Select
              value={formData.employee_id.toString()}
              onValueChange={(value) => setFormData({ ...formData, employee_id: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر العامل" />
              </SelectTrigger>
              <SelectContent>
                {users.filter(u => u.status === 'active').map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.display_name_ar || user.display_name || user.username}
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
