import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Roll } from "@shared/schema";

interface RollsTableProps {
  stage: string;
}

interface RollWithDetails extends Roll {
  production_order_number?: string;
  customer_name?: string;
  customer_name_ar?: string;
  machine_name?: string;
  machine_name_ar?: string;
  employee_name?: string;
}

const stageLabels = {
  film: "مرحلة الفيلم",
  printing: "مرحلة الطباعة", 
  cutting: "مرحلة التقطيع"
};

const nextStage = {
  film: "printing",
  printing: "cutting",
  cutting: null
};

export default function RollsTable({ stage }: RollsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rolls = [], isLoading } = useQuery<RollWithDetails[]>({
    queryKey: ['/api/rolls', stage],
    queryFn: () => fetch(`/api/rolls?stage=${stage}`).then(res => res.json())
  });

  const updateRollMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest(`/api/rolls/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: (_, { updates }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders'] });
      toast({
        title: "تم تحديث الرول بنجاح",
        description: updates.current_stage ? 
          `تم نقل الرول إلى ${stageLabels[updates.current_stage as keyof typeof stageLabels]}` :
          "تم تحديث بيانات الرول"
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث الرول",
        variant: "destructive"
      });
    }
  });

  const moveToNextStage = (rollId: number, currentStage: string) => {
    const next = nextStage[currentStage as keyof typeof nextStage];
    if (!next) {
      // Mark as completed
      updateRollMutation.mutate({
        id: rollId,
        updates: { 
          status: 'completed',
          completed_at: new Date().toISOString()
        }
      });
    } else {
      updateRollMutation.mutate({
        id: rollId,
        updates: { 
          current_stage: next,
          status: next === 'cutting' ? 'in_progress' : 'for_' + next
        }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'for_printing':
      case 'for_cutting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'in_progress': return 'قيد التنفيذ';
      case 'for_printing': return 'في انتظار الطباعة';
      case 'for_cutting': return 'في انتظار التقطيع';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'for_printing':
      case 'for_cutting':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            الرولات - {stageLabels[stage as keyof typeof stageLabels]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rolls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            الرولات - {stageLabels[stage as keyof typeof stageLabels]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد رولات في هذه المرحلة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          الرولات - {stageLabels[stage as keyof typeof stageLabels]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الرول
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  أمر التشغيل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوزن (كجم)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المكينة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rolls.map((roll) => (
                <tr key={roll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {roll.roll_number || "غير محدد"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {roll.production_order_number || "غير محدد"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {roll.weight ? parseFloat(roll.weight.toString()).toFixed(1) : "غير محدد"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {roll.machine_name_ar || roll.machine_name || "غير محدد"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className={getStatusColor(roll.status || "")}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(roll.status || "")}
                        {getStatusText(roll.status || "")}
                      </div>
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {(roll.current_stage || "") !== 'cutting' || (roll.status || "") !== 'completed' ? (
                        <Button
                          size="sm"
                          onClick={() => moveToNextStage(roll.id, roll.current_stage || "film")}
                          disabled={updateRollMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          {nextStage[(roll.current_stage || "film") as keyof typeof nextStage] ? (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              نقل للمرحلة التالية
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              إنهاء
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          مكتمل
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}