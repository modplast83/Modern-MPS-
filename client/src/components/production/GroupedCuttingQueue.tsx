import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { QrCode, Scissors, ChevronDown, ChevronUp, Clock, Package } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const cutFormSchema = z.object({
  cut_weight_kg: z.coerce.number().positive("الوزن الصافي يجب أن يكون أكبر من صفر"),
  pieces_count: z.coerce.number().positive("عدد القطع يجب أن يكون أكبر من صفر").optional()
});

type CutFormData = z.infer<typeof cutFormSchema>;

interface GroupedCuttingQueueProps {
  items: any[];
}

export default function GroupedCuttingQueue({ items }: GroupedCuttingQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const [expandedProductionOrders, setExpandedProductionOrders] = useState<Record<number, boolean>>({});
  const [selectedRoll, setSelectedRoll] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<CutFormData>({
    resolver: zodResolver(cutFormSchema),
    defaultValues: {
      cut_weight_kg: 0,
      pieces_count: 1
    }
  });

  const cutMutation = useMutation({
    mutationFn: async (data: { roll_id: number; cut_weight_kg: number; pieces_count?: number }) => {
      const response = await fetch('/api/cuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في تسجيل التقطيع');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل التقطيع وحساب الهدر"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/production/grouped-cutting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production/cutting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      setDialogOpen(false);
      setSelectedRoll(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCutSubmit = (data: CutFormData) => {
    if (!selectedRoll) return;
    
    cutMutation.mutate({
      roll_id: selectedRoll.id,
      cut_weight_kg: data.cut_weight_kg,
      pieces_count: data.pieces_count
    });
  };

  const openCutDialog = (roll: any) => {
    setSelectedRoll(roll);
    form.setValue('cut_weight_kg', parseFloat(roll.weight_kg) || 0);
    setDialogOpen(true);
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const toggleProductionOrderExpansion = (productionOrderId: number) => {
    setExpandedProductionOrders(prev => ({
      ...prev,
      [productionOrderId]: !prev[productionOrderId]
    }));
  };

  const calculateWaste = (rollWeight: number, cutWeight: number) => {
    return rollWeight - cutWeight;
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد رولات جاهزة للتقطيع</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((order) => (
        <Card key={order.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">
                    طلب رقم: {order.order_number}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    العميل: {order.customer_name_ar || order.customer_name || "غير محدد"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {order.production_orders?.reduce((total: number, po: any) => 
                    total + (po.rolls?.length || 0), 0) || 0} رول
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleOrderExpansion(order.id)}
                  data-testid={`button-expand-order-${order.id}`}
                >
                  {expandedOrders[order.id] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <Collapsible open={expandedOrders[order.id]}>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {order.production_orders?.map((productionOrder: any) => (
                    <Card key={productionOrder.id} className="bg-gray-50 border-l-2 border-l-green-400">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-base">
                              {productionOrder.production_order_number}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {productionOrder.item_name_ar || productionOrder.item_name || "غير محدد"}
                            </p>
                            <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs">
                              {productionOrder.size_caption && (
                                <div>
                                  <span className="font-medium">المقاس: </span>
                                  <span className="text-muted-foreground">{productionOrder.size_caption}</span>
                                </div>
                              )}
                              {productionOrder.thickness && (
                                <div>
                                  <span className="font-medium">السماكة: </span>
                                  <span className="text-muted-foreground">{productionOrder.thickness}</span>
                                </div>
                              )}
                              {productionOrder.raw_material && (
                                <div>
                                  <span className="font-medium">الخامة: </span>
                                  <span className="text-muted-foreground">{productionOrder.raw_material}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {productionOrder.rolls?.length || 0} رول
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleProductionOrderExpansion(productionOrder.id)}
                              data-testid={`button-expand-production-${productionOrder.id}`}
                            >
                              {expandedProductionOrders[productionOrder.id] ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <Collapsible open={expandedProductionOrders[productionOrder.id]}>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              {productionOrder.rolls?.map((roll: any) => (
                                <Card key={roll.id} className="bg-white border">
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3 space-x-reverse">
                                        <QrCode className="h-5 w-5 text-gray-400" />
                                        <div>
                                          <p className="font-medium text-sm">
                                            رول {roll.roll_seq}: {roll.roll_number}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            الوزن: {parseFloat(roll.weight_kg || 0).toFixed(2)} كجم
                                          </p>
                                          {roll.cut_weight_total_kg > 0 && (
                                            <div className="text-xs space-y-1 mt-1">
                                              <p className="text-green-600">
                                                الوزن الصافي: {parseFloat(roll.cut_weight_total_kg).toFixed(2)} كجم
                                              </p>
                                              <p className="text-red-600">
                                                الهدر: {parseFloat(roll.waste_kg).toFixed(2)} كجم
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2 space-x-reverse">
                                        <Badge variant="outline">جاهز للتقطيع</Badge>
                                        <Button
                                          onClick={() => openCutDialog(roll)}
                                          disabled={cutMutation.isPending}
                                          size="sm"
                                          data-testid={`button-cut-${roll.id}`}
                                        >
                                          <Scissors className="h-4 w-4 mr-1" />
                                          تقطيع
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
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

      {/* Dialog for cutting input */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تقطيع الرول</DialogTitle>
          </DialogHeader>
          
          {selectedRoll && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedRoll.roll_number}</p>
                <p className="text-sm text-gray-500">
                  الوزن الأصلي: {parseFloat(selectedRoll.weight_kg || 0).toFixed(2)} كجم
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCutSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cut_weight_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوزن الصافي المقطع (كجم)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="أدخل الوزن الصافي"
                            {...field}
                            data-testid="input-cut-weight"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pieces_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد القطع (اختياري)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="أدخل عدد القطع"
                            {...field}
                            data-testid="input-pieces-count"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('cut_weight_kg') > 0 && selectedRoll && (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm">
                        <span className="font-medium">الهدر المحسوب: </span>
                        <span className={calculateWaste(parseFloat(selectedRoll.weight_kg), form.watch('cut_weight_kg')) > 0 ? 'text-red-600' : 'text-green-600'}>
                          {calculateWaste(parseFloat(selectedRoll.weight_kg), form.watch('cut_weight_kg')).toFixed(2)} كجم
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      data-testid="button-cancel-cut"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={cutMutation.isPending}
                      data-testid="button-confirm-cut"
                    >
                      {cutMutation.isPending ? "جاري التقطيع..." : "تأكيد التقطيع"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}