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
        description: updates.stage ? 
          `تم نقل الرول إلى ${stageLabels[updates.stage as keyof typeof stageLabels]}` :
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
          stage: 'done',
          cut_completed_at: new Date().toISOString()
        }
      });
    } else {
      updateRollMutation.mutate({
        id: rollId,
        updates: { 
          stage: next
        }
      });
    }
  };

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'cutting':
        return 'bg-blue-100 text-blue-800';
      case 'printing':
      case 'film':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (stage: string) => {
    switch (stage) {
      case 'done': return 'مكتمل';
      case 'cutting': return 'مرحلة التقطيع';
      case 'printing': return 'مرحلة الطباعة';
      case 'film': return 'مرحلة الفيلم';
      default: return stage;
    }
  };

  const getStatusIcon = (stage: string) => {
    switch (stage) {
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cutting':
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'printing':
      case 'film':
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
                    {roll.weight_kg ? parseFloat(roll.weight_kg.toString()).toFixed(1) : "غير محدد"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {roll.machine_name_ar || roll.machine_name || "غير محدد"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className={getStatusColor(roll.stage || "")}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(roll.stage || "")}
                        {getStatusText(roll.stage || "")}
                      </div>
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {(roll.stage || "") !== 'done' ? (
                        <Button
                          size="sm"
                          onClick={() => moveToNextStage(roll.id, roll.stage || "film")}
                          disabled={updateRollMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          {nextStage[(roll.stage || "film") as keyof typeof nextStage] ? (
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