import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Package, Clock } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface OrdersStatsProps {
  orders: any[];
  productionOrders: any[];
}

export default function OrdersStats({
  orders,
  productionOrders,
}: OrdersStatsProps) {
  const { t } = useTranslation();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('orders.totalOrders')}</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orders.length}</div>
          <p className="text-xs text-muted-foreground">{t('ordersStats.order')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('production.productionOrders')}</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{productionOrders.length}</div>
          <p className="text-xs text-muted-foreground">{t('ordersStats.productionOrder')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('ordersStats.inProgress')}</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {
              productionOrders.filter((po: any) => po.status === "in_progress")
                .length
            }
          </div>
          <p className="text-xs text-muted-foreground">{t('ordersStats.orderInProgress')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('ordersStats.completed')}</CardTitle>
          <Package className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {
              productionOrders.filter((po: any) => po.status === "completed")
                .length
            }
          </div>
          <p className="text-xs text-muted-foreground">{t('ordersStats.orderCompleted')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
