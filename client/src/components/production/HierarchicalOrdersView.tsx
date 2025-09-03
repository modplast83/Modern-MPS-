import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  Plus, 
  Search 
} from "lucide-react";
import { formatNumber, formatWeight } from '@/lib/formatNumber';

interface HierarchicalOrdersViewProps {
  stage: string;
  onCreateRoll: (jobOrderId?: number) => void;
}

const formatPercentage = (value: number): string => {
  return `${value}%`;
};

export default function HierarchicalOrdersView({ stage, onCreateRoll }: HierarchicalOrdersViewProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [expandedJobOrders, setExpandedJobOrders] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ordersData = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/production/hierarchical-orders'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const toggleJobOrderExpansion = (jobOrderId: number) => {
    const newExpanded = new Set(expandedJobOrders);
    if (newExpanded.has(jobOrderId)) {
      newExpanded.delete(jobOrderId);
    } else {
      newExpanded.add(jobOrderId);
    }
    setExpandedJobOrders(newExpanded);
  };

  // Filter based on search term
  const filteredOrders = ordersData.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in order number and customer name
    const orderMatch = order.order_number?.toLowerCase().includes(searchLower) ||
                      order.customer_name?.toLowerCase().includes(searchLower) ||
                      order.customer_name_ar?.toLowerCase().includes(searchLower);
    
    // Search in job orders
    const jobOrderMatch = order.job_orders?.some((jobOrder: any) => 
      jobOrder.job_number?.toLowerCase().includes(searchLower) ||
      jobOrder.item_name?.toLowerCase().includes(searchLower) ||
      jobOrder.item_name_ar?.toLowerCase().includes(searchLower)
    );
    
    // Search in rolls
    const rollMatch = order.job_orders?.some((jobOrder: any) =>
      jobOrder.rolls?.some((roll: any) =>
        roll.roll_number?.toLowerCase().includes(searchLower)
      )
    );
    
    return orderMatch || jobOrderMatch || rollMatch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="البحث في الطلبات، أوامر العمل، الرولات، أو أسماء العملاء..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-orders"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لا توجد طلبات في الإنتاج"}
          </p>
        </div>
      ) : (
        filteredOrders.map((order) => (
          <Card key={order.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleOrderExpansion(order.id)}
                    data-testid={`button-expand-order-${order.id}`}
                  >
                    {expandedOrders.has(order.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      العميل: {order.customer_name_ar || order.customer_name || "غير محدد"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {order.job_orders?.length || 0} أوامر عمل
                  </Badge>
                  <Badge variant="secondary" data-testid={`badge-order-status-${order.id}`}>
                    {order.status === 'for_production' ? 'للإنتاج' : order.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {expandedOrders.has(order.id) && (
              <CardContent className="pt-0">
                {order.job_orders && order.job_orders.length > 0 ? (
                  <div className="space-y-3">
                    {order.job_orders.map((jobOrder: any) => {
                      const required = parseFloat(jobOrder.quantity_required) || 0;
                      const produced = parseFloat(jobOrder.quantity_produced) || 0;
                      const progress = required > 0 ? Math.round((produced / required) * 100) : 0;

                      return (
                        <Card key={jobOrder.id} className="border border-gray-200 ml-6">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleJobOrderExpansion(jobOrder.id)}
                                  data-testid={`button-expand-job-order-${jobOrder.id}`}
                                >
                                  {expandedJobOrders.has(jobOrder.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div>
                                  <h4 className="font-medium">{jobOrder.job_number}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {jobOrder.item_name_ar || jobOrder.item_name || jobOrder.size_caption || "غير محدد"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">الكمية: </span>
                                  {formatWeight(produced)} / {formatWeight(required)}
                                </div>
                                <div className="w-24">
                                  <Progress value={progress} className="h-2" />
                                  <span className="text-xs text-muted-foreground">{formatPercentage(progress)}</span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onCreateRoll(jobOrder.id)}
                                  data-testid={`button-create-roll-${jobOrder.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {expandedJobOrders.has(jobOrder.id) && jobOrder.rolls && (
                              <div className="mt-4 ml-6 space-y-2">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">الرولات ({jobOrder.rolls.length})</h5>
                                {jobOrder.rolls.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">لا توجد رولات بعد</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {jobOrder.rolls.map((roll: any) => (
                                      <div 
                                        key={roll.id} 
                                        className="border rounded p-3 bg-gray-50"
                                        data-testid={`roll-item-${roll.id}`}
                                      >
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium text-sm">{roll.roll_number}</p>
                                            <p className="text-xs text-muted-foreground">
                                              الوزن: {formatWeight(parseFloat(roll.weight_kg) || 0)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              المرحلة: {roll.stage === 'film' ? 'فيلم' : 
                                                       roll.stage === 'printing' ? 'طباعة' :
                                                       roll.stage === 'cutting' ? 'تقطيع' : roll.stage}
                                            </p>
                                          </div>
                                          <Badge 
                                            variant={roll.status === 'completed' ? 'default' : 'secondary'}
                                            className="text-xs"
                                          >
                                            {roll.status === 'completed' ? 'مكتمل' :
                                             roll.status === 'in_progress' ? 'قيد التنفيذ' :
                                             roll.status === 'pending' ? 'في الانتظار' : roll.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground ml-6">لا توجد أوامر عمل لهذا الطلب</p>
                )}
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}