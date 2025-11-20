import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Eye, Plus } from "lucide-react";
import type { ProductionOrderWithDetails } from "@/types";
import { formatNumber, formatWeight } from "../../lib/formatNumber";

const formatPercentage = (value: number): string => {
  return `${value}%`;
};

interface ProductionOrdersTableProps {
  stage: string;
  onCreateRoll: (productionOrderId?: number) => void;
}

export default function ProductionOrdersTable({
  stage,
  onCreateRoll,
}: ProductionOrdersTableProps) {
  const { data: productionOrders = [], isLoading } = useQuery<
    ProductionOrderWithDetails[]
  >({
    queryKey:
      stage === "film"
        ? ["/api/production/film-queue"]
        : ["/api/production-orders", stage],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (productionOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          لا توجد أوامر إنتاج في هذه المرحلة
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              رقم الأمر
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              العميل
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              المنتج
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              الكمية المطلوبة
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              الكمية المنتجة
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              التقدم
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              الإجراءات
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {productionOrders.map((order) => {
            const required = parseFloat(order.quantity_required) || 0;
            const produced = parseFloat(order.produced_quantity_kg) || 0;
            const progress =
              required > 0 ? Math.round((produced / required) * 100) : 0;

            let progressColor = "bg-primary";
            if (progress < 30) progressColor = "bg-danger";
            else if (progress < 70) progressColor = "bg-warning";

            return (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.production_order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.customer_name_ar || order.customer_name || "غير محدد"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(order as any).item_name_ar ||
                    (order as any).item_name ||
                    (order as any).size_caption ||
                    "غير محدد"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatWeight(required)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatWeight(produced)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 ml-3">
                      <div
                        className={`h-2 rounded-full ${progressColor}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">
                      {formatPercentage(progress)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCreateRoll(order.id)}
                      className="text-primary hover:text-primary/80"
                      data-testid={`button-create-roll-${order.id}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
