import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RollWithDetails } from "@/types";

export default function RecentRolls() {
  const { data: rolls = [], isLoading } = useQuery<RollWithDetails[]>({
    queryKey: ['/api/rolls'],
    select: (data) => data.slice(0, 5) // Get only recent 5 rolls
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'for_printing':
        return { label: 'جاهز للطباعة', variant: 'default' as const };
      case 'for_cutting': 
        return { label: 'جاهز للتقطيع', variant: 'secondary' as const };
      case 'done':
        return { label: 'مكتمل', variant: 'default' as const };
      default:
        return { label: status, variant: 'outline' as const };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${Math.floor(diffHours / 24)} يوم`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>آخر الرولات المنتجة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>آخر الرولات المنتجة</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            عرض الكل
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rolls.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">لا توجد رولات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rolls.map((roll) => {
              const statusInfo = getStatusInfo(roll.status);
              
              return (
                <div key={roll.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{roll.roll_number}</p>
                      <p className="text-xs text-gray-600">
                        {roll.product_name_ar || roll.product_name || "منتج غير محدد"}
                      </p>
                      <p className="text-xs text-gray-600">
                        الوزن: {roll.weight ? `${parseFloat(roll.weight).toFixed(1)} كجم` : "غير محدد"}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge variant={statusInfo.variant} className="mb-1">
                      {statusInfo.label}
                    </Badge>
                    <p className="text-xs text-gray-600">
                      {getTimeAgo(roll.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
