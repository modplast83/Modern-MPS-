import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface ProductionOrderStatsCardProps {
  productionOrderId: number;
}

export default function ProductionOrderStatsCard({
  productionOrderId,
}: ProductionOrderStatsCardProps) {
  const { t } = useTranslation();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/production-orders/${productionOrderId}/stats`],
    queryFn: async () => {
      const response = await fetch(`/api/production-orders/${productionOrderId}/stats`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('productionStats.fetchError'));
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!stats?.data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          {t('productionStats.noStatsAvailable')}
        </CardContent>
      </Card>
    );
  }

  const data = stats.data;
  const completionPercentage = parseFloat(data.completion_percentage || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('productionStats.title')}</span>
          <Badge variant="outline">
            {data.production_order?.production_order_number}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* نسبة الإكمال */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">{t('productionStats.completionPercentage')}</span>
              <span className="font-medium">{completionPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* الإحصائيات الأساسية */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">{t('productionStats.totalRolls')}</div>
              <div className="text-xl font-bold">{data.total_rolls}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">{t('productionStats.totalWeight')}</div>
              <div className="text-xl font-bold">{data.total_weight} <span className="text-sm">{t('common.kg')}</span></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">{t('productionStats.remainingQuantity')}</div>
              <div className="text-xl font-bold">{data.remaining_quantity} <span className="text-sm">{t('common.kg')}</span></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">{t('productionStats.waste')}</div>
              <div className="text-xl font-bold">{data.total_waste} <span className="text-sm">{t('common.kg')}</span></div>
            </div>
          </div>

          {/* توزيع الرولات حسب المرحلة */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">{t('productionStats.rollDistribution')}</div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <div className="bg-blue-100 text-blue-800 rounded-lg p-2">
                  <div className="text-lg font-bold">{data.film_rolls}</div>
                  <div className="text-xs">{t('production.film')}</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 text-yellow-800 rounded-lg p-2">
                  <div className="text-lg font-bold">{data.printing_rolls}</div>
                  <div className="text-xs">{t('production.printing')}</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 text-orange-800 rounded-lg p-2">
                  <div className="text-lg font-bold">{data.cutting_rolls}</div>
                  <div className="text-xs">{t('production.cutting')}</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-green-100 text-green-800 rounded-lg p-2">
                  <div className="text-lg font-bold">{data.done_rolls}</div>
                  <div className="text-xs">{t('production.completed')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* معلومات الوقت */}
          {data.production_order?.production_start_time && (
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('productionStats.productionTime')}</span>
                <span className="font-medium">{data.production_time_hours} {t('common.hour')}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">{t('productionStats.startDate')}</span>
                <span className="font-medium">
                  {new Date(data.production_order.production_start_time).toLocaleString("ar-SA")}
                </span>
              </div>
              {data.production_order.production_end_time && (
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">{t('productionStats.endDate')}</span>
                  <span className="font-medium">
                    {new Date(data.production_order.production_end_time).toLocaleString("ar-SA")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* معلومات أمر الإنتاج */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('productionStats.requiredQuantity')}</span>
              <span className="font-medium">{data.production_order?.quantity_kg} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('productionStats.finalQuantity')}</span>
              <span className="font-medium">{data.production_order?.final_quantity_kg} {t('common.kg')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('productionStats.overrunPercentage')}</span>
              <span className="font-medium">{data.production_order?.overrun_percentage}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}