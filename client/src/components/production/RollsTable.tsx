import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  ArrowRight,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Tag,
  QrCode,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/use-auth";
import { apiRequest } from "../../lib/queryClient";
import type { Roll } from "../../../../shared/schema";

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
  cutting: "مرحلة التقطيع",
};

const nextStage = {
  film: "printing",
  printing: "cutting",
  cutting: null,
};

export default function RollsTable({ stage }: RollsTableProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rolls = [], isLoading } = useQuery<RollWithDetails[]>({
    queryKey: ["/api/rolls", stage],
    queryFn: () => fetch(`/api/rolls?stage=${stage}`).then((res) => res.json()),
  });

  const updateRollMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest(`/api/rolls/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: (_, { updates }) => {
      // Invalidate all production-related queries for instant updates
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/film-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/printing-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/cutting-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/grouped-cutting-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/hierarchical-orders"],
      });

      // Force immediate refetch for real-time updates
      queryClient.refetchQueries({ queryKey: ["/api/rolls"], type: "active" });

      toast({
        title: "تم تحديث الرول بنجاح",
        description: updates.stage
          ? `تم نقل الرول إلى ${stageLabels[updates.stage as keyof typeof stageLabels]}`
          : "تم تحديث بيانات الرول",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث الرول",
        variant: "destructive",
      });
    },
  });

  const moveToNextStage = (rollId: number, currentStage: string) => {
    const next = nextStage[currentStage as keyof typeof nextStage];
    if (!next) {
      // Mark as completed - server will set cut_completed_at and cut_by from session
      updateRollMutation.mutate({
        id: rollId,
        updates: {
          stage: "done",
        },
      });
    } else {
      // Just advance to next stage - server will handle employee tracking from session
      updateRollMutation.mutate({
        id: rollId,
        updates: {
          stage: next,
        },
      });
    }
  };

  const printLabel = async (rollId: number) => {
    try {
      const response = await fetch(`/api/rolls/${rollId}/label`);
      const labelData = await response.json();

      // إنشاء نافذة طباعة جديدة
      const printWindow = window.open("", "_blank", "width=400,height=500");
      if (!printWindow) {
        toast({
          title: "خطأ في فتح نافذة الطباعة",
          description: "تأكد من السماح للنوافذ المنبثقة",
          variant: "destructive",
        });
        return;
      }

      // HTML للليبل بمقاس 4" × 5"
      const labelHTML = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>ليبل الرول - ${labelData.roll_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              width: 4in;
              height: 5in;
              padding: 10px;
              background: white;
              color: black;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .subtitle {
              font-size: 12px;
              color: #666;
            }
            .content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .info-section {
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 11px;
            }
            .label {
              font-weight: bold;
              color: #333;
            }
            .value {
              text-align: left;
              direction: ltr;
            }
            .qr-section {
              text-align: center;
              border: 1px solid #ddd;
              padding: 8px;
              border-radius: 4px;
            }
            .qr-code {
              max-width: 80px;
              max-height: 80px;
              margin: 0 auto;
            }
            .footer {
              text-align: center;
              font-size: 8px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ليبل الرول</div>
            <div class="subtitle">${labelData.label_dimensions.width} × ${labelData.label_dimensions.height}</div>
          </div>
          
          <div class="content">
            <div class="info-section">
              <div class="info-row">
                <span class="label">رقم الرول:</span>
                <span class="value">${labelData.roll_number}</span>
              </div>
              <div class="info-row">
                <span class="label">أمر الإنتاج:</span>
                <span class="value">${labelData.production_order_number}</span>
              </div>
              <div class="info-row">
                <span class="label">العميل:</span>
                <span class="value">${labelData.customer_name}</span>
              </div>
              <div class="info-row">
                <span class="label">الوزن:</span>
                <span class="value">${labelData.weight_kg}</span>
              </div>
              <div class="info-row">
                <span class="label">المرحلة:</span>
                <span class="value">${labelData.stage}</span>
              </div>
              <div class="info-row">
                <span class="label">الماكينة:</span>
                <span class="value">${labelData.machine_name}</span>
              </div>
              <div class="info-row">
                <span class="label">تاريخ الإنتاج:</span>
                <span class="value">${labelData.created_at}</span>
              </div>
            </div>
            
            ${
              labelData.qr_png_base64
                ? `
            <div class="qr-section">
              <img src="data:image/png;base64,${labelData.qr_png_base64}" 
                   alt="QR Code" class="qr-code" />
              <div style="font-size: 8px; margin-top: 3px;">امسح للمعلومات</div>
            </div>
            `
                : ""
            }
          </div>
          
          <div class="footer">
            تاريخ الطباعة: ${new Date().toLocaleDateString("ar")} | نظام إدارة الإنتاج
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(labelHTML);
      printWindow.document.close();

      // انتظار تحميل الصور ثم طباعة
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast({
        title: "تم إرسال الليبل للطباعة",
        description: `ليبل الرول ${labelData.roll_number}`,
        variant: "default",
      });
      
      // تحديث البيانات بعد الطباعة
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/hierarchical-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/film-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/printing-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/cutting-queue"] });
    } catch (error) {
      console.error("Error printing label:", error);
      toast({
        title: "خطأ في طباعة الليبل",
        description: "حدث خطأ أثناء توليد الليبل للطباعة",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case "done":
        return "bg-green-100 text-green-800";
      case "cutting":
        return "bg-blue-100 text-blue-800";
      case "printing":
      case "film":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (stage: string) => {
    switch (stage) {
      case "done":
        return "مكتمل";
      case "cutting":
        return "مرحلة التقطيع";
      case "printing":
        return "مرحلة الطباعة";
      case "film":
        return "مرحلة الفيلم";
      default:
        return stage;
    }
  };

  const getStatusIcon = (stage: string) => {
    switch (stage) {
      case "done":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cutting":
        return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case "printing":
      case "film":
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
                  المسؤول/التوقيت
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
                    {roll.weight_kg
                      ? parseFloat(roll.weight_kg.toString()).toFixed(1)
                      : "غير محدد"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {roll.machine_name_ar || roll.machine_name || "غير محدد"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {/* إنتاج */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-medium text-blue-600">
                          إنتاج:
                        </span>
                        <span>{`مستخدم ${roll.created_by || "غير محدد"}`}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {roll.created_at
                          ? new Date(roll.created_at).toLocaleDateString("ar")
                          : ""}
                      </div>

                      {/* طباعة */}
                      {roll.printed_by && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-medium text-green-600">
                            طباعة:
                          </span>
                          <span>{`مستخدم ${roll.printed_by}`}</span>
                        </div>
                      )}
                      {roll.printed_at && (
                        <div className="text-xs text-gray-400">
                          {new Date(roll.printed_at).toLocaleDateString("ar")}
                        </div>
                      )}

                      {/* قص */}
                      {roll.cut_by && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-medium text-purple-600">
                            قص:
                          </span>
                          <span>{`مستخدم ${roll.cut_by}`}</span>
                        </div>
                      )}
                      {roll.cut_completed_at && (
                        <div className="text-xs text-gray-400">
                          {new Date(roll.cut_completed_at).toLocaleDateString(
                            "ar",
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="secondary"
                      className={getStatusColor(roll.stage || "")}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(roll.stage || "")}
                        {getStatusText(roll.stage || "")}
                      </div>
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {/* زر طباعة الليبل */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printLabel(roll.id)}
                        className="flex items-center gap-1"
                        data-testid={`button-print-label-${roll.id}`}
                      >
                        <Tag className="w-3 h-3" />
                        ليبل
                      </Button>

                      {/* زر QR */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(`/api/rolls/${roll.id}/qr`, "_blank")
                        }
                        className="flex items-center gap-1"
                        data-testid={`button-qr-${roll.id}`}
                      >
                        <QrCode className="w-3 h-3" />
                        QR
                      </Button>

                      {/* زر نقل المرحلة */}
                      {(roll.stage || "") !== "done" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            moveToNextStage(roll.id, roll.stage || "film")
                          }
                          disabled={updateRollMutation.isPending}
                          className="flex items-center gap-1"
                          data-testid={`button-next-stage-${roll.id}`}
                        >
                          {nextStage[
                            (roll.stage || "film") as keyof typeof nextStage
                          ] ? (
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
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
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
