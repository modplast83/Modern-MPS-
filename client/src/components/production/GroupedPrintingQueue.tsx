import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { QrCode, Play, ChevronDown, ChevronRight } from "lucide-react";
import { Progress } from "../ui/progress";
import { useToast } from "../../hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

interface GroupedPrintingQueueProps {
  items: any[];
}

interface GroupedRoll {
  id: number;
  roll_seq: number;
  roll_number: string;
  weight_kg: number;
  machine_id: string;
  qr_code_text?: string;
}

interface ProductionOrderGroup {
  production_order_id: number;
  production_order_number: string;
  rolls: GroupedRoll[];
  total_weight: number;
  rolls_count: number;
}

interface OrderGroup {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_name_ar: string;
  item_name: string;
  item_name_ar: string;
  size_caption: string;
  production_orders: ProductionOrderGroup[];
  total_weight: number;
  total_rolls: number;
}

export default function GroupedPrintingQueue({
  items,
}: GroupedPrintingQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [expandedProductionOrders, setExpandedProductionOrders] = useState<
    Set<number>
  >(new Set());

  // Helper function to calculate completion percentage
  const calculateOrderProgress = (orderGroup: OrderGroup) => {
    const totalRolls = orderGroup.total_rolls;
    if (totalRolls === 0) return 0;

    // In printing stage, assume all rolls are ready for printing
    // Progress is based on rolls that are successfully printed
    // For now, we'll show that all rolls in the queue are pending printing
    return 0; // All rolls in queue are pending printing
  };

  const calculateProductionOrderProgress = (
    productionOrderGroup: ProductionOrderGroup,
  ) => {
    const totalRolls = productionOrderGroup.rolls_count;
    if (totalRolls === 0) return 0;

    // Similar logic - all rolls in printing queue are pending
    return 0; // All rolls are pending printing
  };

  // Group items by order and production order
  const groupedData: OrderGroup[] = items.reduce((acc: OrderGroup[], item) => {
    let orderGroup = acc.find(
      (group: OrderGroup) => group.order_id === item.order_id,
    );

    if (!orderGroup) {
      orderGroup = {
        order_id: item.order_id,
        order_number: item.order_number || `ORD-${item.order_id}`,
        customer_name: item.customer_name || "غير محدد",
        customer_name_ar:
          item.customer_name_ar || item.customer_name || "غير محدد",
        item_name: item.item_name || "غير محدد",
        item_name_ar: item.item_name_ar || item.item_name || "غير محدد",
        size_caption: item.size_caption || "",
        production_orders: [],
        total_weight: 0,
        total_rolls: 0,
      };
      acc.push(orderGroup);
    }

    let productionOrderGroup = orderGroup.production_orders.find(
      (po: ProductionOrderGroup) =>
        po.production_order_id === item.production_order_id,
    );

    if (!productionOrderGroup) {
      productionOrderGroup = {
        production_order_id: item.production_order_id,
        production_order_number:
          item.production_order_number || `PO-${item.production_order_id}`,
        rolls: [],
        total_weight: 0,
        rolls_count: 0,
      };
      orderGroup.production_orders.push(productionOrderGroup);
    }

    const roll: GroupedRoll = {
      id: item.id,
      roll_seq: item.roll_seq,
      roll_number: item.roll_number,
      weight_kg: parseFloat(item.weight_kg) || 0,
      machine_id: item.machine_id,
      qr_code_text: item.qr_code_text,
    };

    productionOrderGroup.rolls.push(roll);
    productionOrderGroup.total_weight += roll.weight_kg;
    productionOrderGroup.rolls_count += 1;

    orderGroup.total_weight += roll.weight_kg;
    orderGroup.total_rolls += 1;

    return acc;
  }, [] as OrderGroup[]);

  const processRollMutation = useMutation({
    mutationFn: async (rollId: number) => {
      const response = await fetch(`/api/rolls/${rollId}/print`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "فشل في تسجيل الطباعة");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الطباعة",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/production/printing-queue`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      setProcessingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
      setProcessingId(null);
    },
  });

  const handlePrint = (rollId: number) => {
    setProcessingId(rollId);
    processRollMutation.mutate(rollId);
  };

  const toggleOrderExpanded = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const toggleProductionOrderExpanded = (productionOrderId: number) => {
    const newExpanded = new Set(expandedProductionOrders);
    if (newExpanded.has(productionOrderId)) {
      newExpanded.delete(productionOrderId);
    } else {
      newExpanded.add(productionOrderId);
    }
    setExpandedProductionOrders(newExpanded);
  };

  if (groupedData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <Play className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد رولات في قائمة انتظار الطباعة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedData.map((orderGroup) => (
        <Card
          key={`order-${orderGroup.order_id}`}
          className="border-l-4 border-l-blue-500"
        >
          <Collapsible
            open={expandedOrders.has(orderGroup.order_id)}
            onOpenChange={() => toggleOrderExpanded(orderGroup.order_id)}
          >
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {expandedOrders.has(orderGroup.order_id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <div className="text-right">
                      <CardTitle className="text-lg">
                        {orderGroup.order_number} -{" "}
                        <span className="font-bold text-blue-700">
                          {orderGroup.customer_name_ar}
                        </span>
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {orderGroup.item_name_ar}{" "}
                        {orderGroup.size_caption &&
                          `- ${orderGroup.size_caption}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="text-sm text-muted-foreground">
                      <div className="w-20">
                        <Progress
                          value={calculateOrderProgress(orderGroup)}
                          className="h-2"
                        />
                        <span className="text-xs">
                          {calculateOrderProgress(orderGroup)}%
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {orderGroup.total_rolls} رول
                    </Badge>
                    <Badge variant="outline">
                      {orderGroup.total_weight.toFixed(2)} كجم
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {orderGroup.production_orders.map((productionOrderGroup) => (
                    <Card
                      key={`production-${productionOrderGroup.production_order_id}`}
                      className="bg-gray-50 border-l-2 border-l-orange-400"
                    >
                      <Collapsible
                        open={expandedProductionOrders.has(
                          productionOrderGroup.production_order_id,
                        )}
                        onOpenChange={() =>
                          toggleProductionOrderExpanded(
                            productionOrderGroup.production_order_id,
                          )
                        }
                      >
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {expandedProductionOrders.has(
                                  productionOrderGroup.production_order_id,
                                ) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <span className="font-medium">
                                  {productionOrderGroup.production_order_number}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="text-sm text-muted-foreground">
                                  <div className="w-16">
                                    <Progress
                                      value={calculateProductionOrderProgress(
                                        productionOrderGroup,
                                      )}
                                      className="h-2"
                                    />
                                    <span className="text-xs">
                                      {calculateProductionOrderProgress(
                                        productionOrderGroup,
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {productionOrderGroup.rolls_count} رول
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {productionOrderGroup.total_weight.toFixed(2)}{" "}
                                  كجم
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              {productionOrderGroup.rolls.map((roll) => (
                                <div
                                  key={`roll-${roll.id}`}
                                  className="flex items-center justify-between p-3 bg-white rounded border"
                                >
                                  <div className="flex items-center space-x-3 space-x-reverse">
                                    <QrCode className="h-4 w-4 text-gray-400" />
                                    <div>
                                      <p className="font-medium text-sm">
                                        {roll.roll_number}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        الوزن: {roll.weight_kg.toFixed(2)} كجم -
                                        المكينة: {roll.machine_id}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrint(roll.id);
                                    }}
                                    disabled={processingId === roll.id}
                                    data-testid={`button-print-roll-${roll.id}`}
                                  >
                                    <Play className="h-3 w-3 ml-1" />
                                    {processingId === roll.id
                                      ? "جاري الطباعة..."
                                      : "طباعة"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
