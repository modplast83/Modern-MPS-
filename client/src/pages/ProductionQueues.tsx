import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import SmartDistributionModal from "../components/modals/SmartDistributionModal";
import { toastMessages } from "../lib/toastMessages";
import {
  GripVertical,
  Factory,
  Package,
  AlertCircle,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Info,
  BarChart3,
  Loader2,
} from "lucide-react";

interface ProductionOrder {
  id: number;
  production_order_number: string;
  quantity_kg: string;
  final_quantity_kg: string;
  status: string;
  customer_product_id: number;
  customer_name?: string;
  customer_name_ar?: string;
  item_name?: string;
  item_name_ar?: string;
  size_caption?: string;
  raw_material?: string;
  color?: string;
}

interface QueueItem {
  queue_id: number;
  machine_id: string;
  machine_name: string;
  machine_name_ar: string;
  machine_status: string;
  production_order_id: number;
  production_order_number: string;
  quantity_kg: string;
  queue_position: number;
  assigned_at: string;
  assigned_by_name?: string;
  customer_name?: string;
  customer_name_ar?: string;
  item_name?: string;
  item_name_ar?: string;
  size_caption?: string;
  raw_material?: string;
}

interface Machine {
  id: string;
  name: string;
  name_ar: string;
  type: string;
  status: string;
}

// Sortable Item Component
function SortableItem({ 
  item, 
  machineId 
}: { 
  item: QueueItem | ProductionOrder; 
  machineId: string | null;
}) {
  const isQueueItem = "queue_id" in item;
  const id = isQueueItem ? `queue-${item.queue_id}` : `order-${item.id}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: {
      item,
      machineId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const itemId = isQueueItem ? item.production_order_id : item.id;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={t("pages.productionqueues.name.mb_2")}
    >
      <Card className={t("pages.productionqueues.name.hover_shadow_md_transition_shadow_cursor_move")} data-testid={`card-queue-item-${itemId}`}>
        <CardContent className={t("pages.productionqueues.name.p_3")}>
          <div className={t("pages.productionqueues.name.flex_items_start_gap_2")}>
            <div
              {...attributes}
              {...listeners}
              className={t("pages.productionqueues.name.mt_1_cursor_grab_hover_cursor_grabbing_text_muted_foreground")}
              data-testid={`drag-handle-${itemId}`}
            >
              <GripVertical className={t("pages.productionqueues.name.h_4_w_4")} />
            </div>
            <div className={t("pages.productionqueues.name.flex_1")}>
              <div className={t("pages.productionqueues.name.flex_items_center_justify_between_mb_1")}>
                <span className={t("pages.productionqueues.name.font_medium_text_sm")} data-testid={`text-order-number-${itemId}`}>
                  {isQueueItem ? item.production_order_number : item.production_order_number}
                </span>
                {!isQueueItem && (
                  <Badge variant={item.status === "active" ? "default" : "secondary"} data-testid={`badge-status-${itemId}`}>
                    {item.status === "active" ? "نشط" : item.status === "in_production" ? "قيد الإنتاج" : "معلق"}
                  </Badge>
                )}
              </div>
              
              {/* معلومات العميل */}
              {(isQueueItem ? item.customer_name_ar || item.customer_name : (item as ProductionOrder).customer_name_ar || (item as ProductionOrder).customer_name) && (
                <div className={t("pages.productionqueues.name.text_xs_text_muted_foreground_mb_1")} data-testid={`text-customer-${itemId}`}>
                  العميل: {isQueueItem ? item.customer_name_ar || item.customer_name : (item as ProductionOrder).customer_name_ar || (item as ProductionOrder).customer_name}
                </div>
              )}
              
              {/* معلومات المنتج */}
              {(isQueueItem ? item.size_caption : (item as ProductionOrder).size_caption) && (
                <div className={t("pages.productionqueues.name.text_xs_text_muted_foreground_mb_1")} data-testid={`text-product-${itemId}`}>
                  المنتج: {isQueueItem ? item.size_caption : (item as ProductionOrder).size_caption}
                </div>
              )}
              
              {/* المادة الخام */}
              {(isQueueItem ? item.raw_material : (item as ProductionOrder).raw_material) && (
                <div className={t("pages.productionqueues.name.text_xs_text_muted_foreground_mb_1")} data-testid={`text-material-${itemId}`}>
                  المادة: {isQueueItem ? item.raw_material : (item as ProductionOrder).raw_material}
                </div>
              )}
              
              <div className={t("pages.productionqueues.name.text_xs_text_muted_foreground")} data-testid={`text-quantity-${itemId}`}>
                الكمية: {isQueueItem ? item.quantity_kg : item.final_quantity_kg} كجم
              </div>
              
              {isQueueItem && item.assigned_by_name && (
                <div className={t("pages.productionqueues.name.text_xs_text_muted_foreground_mt_1")} data-testid={`text-assigned-by-${itemId}`}>
                  بواسطة: {item.assigned_by_name}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Machine Column Component
function MachineColumn({ 
  machine, 
  items,
  onItemsChange 
}: { 
  machine: Machine | null; 
  items: (QueueItem | ProductionOrder)[];
  onItemsChange?: (items: any[]) => void;
}) {
  const machineId = machine?.id || "unassigned";
  const sortableItems = items.map(item => {
    const isQueueItem = "queue_id" in item;
    return isQueueItem ? `queue-${item.queue_id}` : `order-${item.id}`;
  });

  const { setNodeRef } = useDroppable({
    id: machineId,
    data: {
      machineId: machineId,
    }
  });

  const getMachineColor = (type: string) => {
    switch (type) {
      case "extruder": return "bg-blue-50 border-blue-200";
      case "printer": return "bg-green-50 border-green-200";
      case "cutter": return "bg-purple-50 border-purple-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getMachineIcon = (status: string) => {
    return status === "active" ? "🟢" : status === "maintenance" ? "🟠" : "🔴";
  };

  return (
    <Card 
      className={`min-h-[600px] ${machine ? getMachineColor(machine.type) : "bg-gray-50"}`}
      data-testid={`column-machine-${machineId}`}
    >
      <CardHeader className={t("pages.productionqueues.name.pb_3")}>
        <CardTitle className={t("pages.productionqueues.name.text_lg_flex_items_center_justify_between")}>
          <div className={t("pages.productionqueues.name.flex_items_center_gap_2")}>
            <Factory className={t("pages.productionqueues.name.h_5_w_5")} />
            <span data-testid={`text-machine-name-${machineId}`}>
              {machine ? machine.name_ar || machine.name : "أوامر غير مخصصة"}
            </span>
          </div>
          {machine && (
            <div className={t("pages.productionqueues.name.flex_items_center_gap_2_text_sm")}>
              <span data-testid={`icon-machine-status-${machineId}`}>{getMachineIcon(machine.status)}</span>
              <Badge variant="outline" data-testid={`badge-order-count-${machineId}`}>{items.length} أمر</Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={t("pages.productionqueues.name.h_500px_")}>
          <SortableContext
            items={sortableItems}
            strategy={verticalListSortingStrategy}
          >
            <div ref={setNodeRef} className={t("pages.productionqueues.name.min_h_50px_")} data-testid={`dropzone-${machineId}`}>
              {items.length === 0 ? (
                <div className={t("pages.productionqueues.name.text_center_text_muted_foreground_py_8")} data-testid={`text-no-orders-${machineId}`}>
                  <Package className={t("pages.productionqueues.name.h_12_w_12_mx_auto_mb_2_opacity_30")} />
                  <p className={t("pages.productionqueues.name.text_sm")}>{t('pages.ProductionQueues.لا_توجد_أوامر_إنتاج')}</p>
                </div>
              ) : (
                items.map((item) => (
                  <SortableItem
                    key={"queue_id" in item ? `queue-${item.queue_id}` : `order-${item.id}`}
                    item={item}
                    machineId={machineId}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function ProductionQueues() {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>{t('pages.ProductionQueues.(null);_const_[localqueues,_setlocalqueues]_=_usestate')}<{ [key: string]: any[] }>({});
  const [isDistributionModalOpen, setIsDistributionModalOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch machines
  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
  });

  // Fetch production orders
  const { data: productionOrders = [] } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/production-orders"],
  });

  // Fetch machine queues
  const { data: queuesData, isLoading } = useQuery<{ data: QueueItem[] }>({
    queryKey: ["/api/machine-queues"],
  });

  // Fetch distribution suggestions
  const { data: suggestions } = useQuery<{ data: any[] }>({
    queryKey: ["/api/machine-queues/suggest"],
  });

  // Fetch machine capacity stats  
  const { data: capacityStats } = useQuery<{ data: any[] }>({
    queryKey: ["/api/machines/capacity-stats"],
  });

  // Organize data into queues
  useEffect(() => {
    if (queuesData?.data && machines && productionOrders) {
      const queues: { [key: string]: any[] } = {};
      
      // Initialize queues for active machines
      const activeMachines = machines.filter(m => m.status === "active");
      activeMachines.forEach(machine => {
        queues[machine.id] = [];
      });
      
      // Add queue items to their respective machines
      queuesData.data.forEach((item: QueueItem) => {
        if (queues[item.machine_id]) {
          queues[item.machine_id].push(item);
        }
      });
      
      // Sort items by queue position
      Object.keys(queues).forEach(machineId => {
        queues[machineId].sort((a, b) => a.queue_position - b.queue_position);
      });
      
      // Find unassigned production orders (active or in_production without queue assignment)
      const assignedOrderIds = new Set(queuesData.data.map(q => q.production_order_id));
      const unassignedOrders = productionOrders.filter(
        po => (po.status === "active" || po.status === "in_production" || po.status === "pending") && !assignedOrderIds.has(po.id)
      );
      
      queues["unassigned"] = unassignedOrders;
      
      setLocalQueues(queues);
    }
  }, [queuesData, machines, productionOrders]);

  // Assign to queue mutation
  const assignMutation = useMutation({
    mutationFn: async ({ productionOrderId, machineId, position }: any) => {
      return apiRequest("/api/machine-queues/assign", {
        method: "POST",
        body: JSON.stringify({ productionOrderId, machineId, position }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machine-queues"] });
      toast({
        title: "تم التخصيص",
        description: "تم تخصيص أمر الإنتاج للماكينة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل تخصيص أمر الإنتاج",
        variant: "destructive",
      });
    },
  });

  // Reorder queue mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ queueId, newPosition }: any) => {
      return apiRequest("/api/machine-queues/reorder", {
        method: "PUT",
        body: JSON.stringify({ queueId, newPosition }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machine-queues"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل إعادة الترتيب",
        variant: "destructive",
      });
    },
  });

  // Remove from queue mutation
  const removeMutation = useMutation({
    mutationFn: async (queueId: number) => {
      return apiRequest(`/api/machine-queues/${queueId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machine-queues"] });
      toast({
        title: "تمت الإزالة",
        description: "تم إزالة أمر الإنتاج من الطابور",
      });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    const sourceMachineId = activeData?.machineId;
    const targetMachineId = overData?.machineId || over.id;

    // Handle moving items
    if (sourceMachineId !== targetMachineId) {
      // Moving to different machine
      const activeItem = activeData?.item;
      
      if (!activeItem) {
        setActiveId(null);
        return;
      }

      const isQueueItem = "queue_id" in activeItem;
      
      if (targetMachineId === "unassigned") {
        // Moving back to unassigned
        if (isQueueItem) {
          removeMutation.mutate(activeItem.queue_id);
        }
      } else {
        // Moving to a machine
        const targetQueue = localQueues[targetMachineId] || [];
        const position = targetQueue.length;
        
        if (isQueueItem) {
          // Moving from one machine to another - remove and reassign
          removeMutation.mutate(activeItem.queue_id);
          setTimeout(() => {
            assignMutation.mutate({
              productionOrderId: activeItem.production_order_id,
              machineId: targetMachineId,
              position,
            });
          }, 200);
        } else {
          // Assigning unassigned order to machine
          assignMutation.mutate({
            productionOrderId: activeItem.id,
            machineId: targetMachineId,
            position,
          });
        }
      }
    } else if (sourceMachineId && sourceMachineId !== "unassigned") {
      // Reordering within same machine
      const queue = localQueues[sourceMachineId] || [];
      const activeIndex = queue.findIndex(item => {
        const isQueue = "queue_id" in item;
        const itemId = isQueue ? `queue-${item.queue_id}` : `order-${item.id}`;
        return itemId === active.id;
      });
      
      const overIndex = queue.findIndex(item => {
        const isQueue = "queue_id" in item;
        const itemId = isQueue ? `queue-${item.queue_id}` : `order-${item.id}`;
        return itemId === over.id;
      });

      if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
        const newQueue = arrayMove(queue, activeIndex, overIndex);
        
        // Update local state optimistically
        setLocalQueues(prev => ({
          ...prev,
          [sourceMachineId]: newQueue,
        }));

        // Update server
        const activeItem = queue[activeIndex];
        if ("queue_id" in activeItem) {
          reorderMutation.mutate({
            queueId: activeItem.queue_id,
            newPosition: overIndex,
          });
        }
      }
    }

    setActiveId(null);
  };

  // Apply suggestions
  const applySuggestions = async () => {
    if (!suggestions?.data || suggestions.data.length === 0) {
      toast({
        title: "لا توجد اقتراحات",
        description: "جميع أوامر الإنتاج مخصصة بالفعل",
      });
      return;
    }

    try {
      // Apply each suggestion
      for (const suggestion of suggestions.data) {
        await assignMutation.mutateAsync({
          productionOrderId: suggestion.production_order_id,
          machineId: suggestion.suggested_machine_id,
          position: suggestion.current_queue_size,
        });
      }

      const message = toastMessages.queue.smartDistribution(suggestions.data.length);
      toast({
        title: message.title,
        description: message.description,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/machine-queues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machine-queues/suggest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
    } catch (error) {
      toast({
        title: "❌ خطأ في التوزيع",
        description: toastMessages.queue.errors.distribution,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className={t("pages.productionqueues.name.min_h_screen_bg_gray_50")}>
        <Header />
        <div className={t("pages.productionqueues.name.flex")}>
          <Sidebar />
          <MobileNav />
          <main className={t("pages.productionqueues.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
            <div className={t("pages.productionqueues.name.flex_items_center_justify_center_h_96")}>
              <div className={t("pages.productionqueues.name.text_center")}>
                <Loader2 className={t("pages.productionqueues.name.h_12_w_12_animate_spin_text_primary_mx_auto_mb_4")} />
                <p className={t("pages.productionqueues.name.text_gray_600")}>{t('pages.ProductionQueues.جاري_تحميل_الطوابير...')}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const activeMachines = machines.filter(m => m.status === "active");
  const unassignedCount = localQueues["unassigned"]?.length || 0;

  // Calculate total capacity statistics
  const totalCapacityStats = capacityStats?.data?.reduce((acc, stat) => {
    acc.totalLoad += stat.currentLoad || 0;
    acc.totalCapacity += stat.maxCapacity || 0;
    acc.totalOrders += stat.orderCount || 0;
    return acc;
  }, { totalLoad: 0, totalCapacity: 0, totalOrders: 0 });

  const overallUtilization = totalCapacityStats 
    ? (totalCapacityStats.totalLoad / totalCapacityStats.totalCapacity) * 100
    : 0;

  return (
    <div className={t("pages.productionqueues.name.min_h_screen_bg_gray_50")}>
      <Header />
      <div className={t("pages.productionqueues.name.flex")}>
        <Sidebar />
        <MobileNav />
        <main className={t("pages.productionqueues.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          {/* Smart Distribution Modal */}
          <SmartDistributionModal
            isOpen={isDistributionModalOpen}
            onClose={() => setIsDistributionModalOpen(false)}
            onDistribute={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/machine-queues"] });
              queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
            }}
          />

          <div className={t("pages.productionqueues.name.mb_6")}>
            <div className={t("pages.productionqueues.name.flex_items_center_justify_between_mb_4")}>
              <div>
                <h1 className={t("pages.productionqueues.name.text_2xl_font_bold_text_gray_900")}>{t('pages.ProductionQueues.طوابير_الإنتاج')}</h1>
                <p className={t("pages.productionqueues.name.text_gray_600_mt_1")}>{t('pages.ProductionQueues.قم_بسحب_وإفلات_أوامر_الإنتاج_لتنظيم_العمل_على_المكائن')}</p>
              </div>
          <div className={t("pages.productionqueues.name.flex_gap_2")}>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/machine-queues"] });
                queryClient.invalidateQueries({ queryKey: ["/api/machines/capacity-stats"] });
                toast({
                  title: "✅ تم التحديث",
                  description: "تم تحديث بيانات الطوابير بنجاح",
                });
              }}
              data-testid="button-refresh-queues"
            >
              <RefreshCw className={t("pages.productionqueues.name.h_4_w_4")} />
            </Button>
            <Button
              onClick={() => setIsDistributionModalOpen(true)}
              disabled={unassignedCount === 0}
              className={t("pages.productionqueues.name.gap_2")}
              data-testid="button-smart-distribution"
            >
              <Sparkles className={t("pages.productionqueues.name.h_4_w_4")} />
              توزيع ذكي متقدم
              {unassignedCount >{t('pages.ProductionQueues.0_&&_(')}<Badge variant="secondary" className={t("pages.productionqueues.name.ml_2")} data-testid="badge-unassigned-count">
                  {unassignedCount} أمر
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Capacity Statistics Bar */}
        {totalCapacityStats && totalCapacityStats.totalCapacity >{t('pages.ProductionQueues.0_&&_(')}<Card className={t("pages.productionqueues.name.mb_4")} data-testid="card-capacity-stats">
            <CardContent className={t("pages.productionqueues.name.p_4")}>
              <div className={t("pages.productionqueues.name.flex_items_center_justify_between_mb_2")}>
                <div className={t("pages.productionqueues.name.flex_items_center_gap_2")}>
                  <BarChart3 className={t("pages.productionqueues.name.h_4_w_4_text_muted_foreground")} />
                  <span className={t("pages.productionqueues.name.text_sm_font_medium")}>{t('pages.ProductionQueues.إحصائيات_السعة_الإجمالية')}</span>
                </div>
                <div className={t("pages.productionqueues.name.flex_items_center_gap_4_text_sm")}>
                  <div className={t("pages.productionqueues.name.flex_items_center_gap_1")}>
                    <span className={t("pages.productionqueues.name.text_muted_foreground")}>{t('pages.ProductionQueues.الحمولة:')}</span>
                    <span className={t("pages.productionqueues.name.font_medium")} data-testid="text-total-load">
                      {totalCapacityStats.totalLoad.toFixed(0)} / {totalCapacityStats.totalCapacity.toFixed(0)} كجم
                    </span>
                  </div>
                  <Badge variant="outline" data-testid="badge-active-orders">
                    {totalCapacityStats.totalOrders} أمر نشط
                  </Badge>
                </div>
              </div>
              <Progress
                value={overallUtilization}
                className={t("pages.productionqueues.name.h_2")}
                data-testid="progress-utilization"
              />
              <div className={t("pages.productionqueues.name.flex_items_center_justify_between_mt_2_text_xs_text_muted_foreground")}>
                <span data-testid="text-utilization-percentage">نسبة الاستخدام: {overallUtilization.toFixed(1)}%</span>
                <span 
                  className={
                    overallUtilization > 90 ? "text-red-600" :
                    overallUtilization > 70 ? "text-yellow-600" :
                    overallUtilization > 40 ? "text-blue-600" :
                    "text-green-600"
                  }
                  data-testid="text-load-status"
                >
                  {overallUtilization > 90 ? "حمولة زائدة" :
                   overallUtilization > 70 ? "حمولة عالية" :
                   overallUtilization > 40 ? "حمولة متوسطة" :
                   "حمولة منخفضة"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {activeMachines.length === 0 ? (
        <Card className={t("pages.productionqueues.name.p_8_text_center")}>
          <AlertCircle className={t("pages.productionqueues.name.h_12_w_12_text_muted_foreground_mx_auto_mb_4")} />
          <h2 className={t("pages.productionqueues.name.text_xl_font_semibold_mb_2")}>{t('pages.ProductionQueues.لا_توجد_مكائن_نشطة')}</h2>
          <p className={t("pages.productionqueues.name.text_muted_foreground")}>{t('pages.ProductionQueues.يجب_تفعيل_مكينة_واحدة_على_الأقل_لإدارة_طوابير_الإنتاج')}</p>
        </Card>{t('pages.ProductionQueues.)_:_(')}<DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={t("pages.productionqueues.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_xl_grid_cols_4_gap_4")}>
            {/* Unassigned orders column */}
            <MachineColumn
              machine={null}
              items={localQueues["unassigned"] || []}
            />
            
            {/* Machine columns */}
            {activeMachines.map((machine) => (
              <MachineColumn
                key={machine.id}
                machine={machine}
                items={localQueues[machine.id] || []}
              />
            ))}
          </div>

          <DragOverlay>
            {activeId && (() => {
              // Find the active item
              let activeItem: any = null;
              Object.values(localQueues).forEach(queue => {
                const found = queue.find(item => {
                  const isQueue = "queue_id" in item;
                  const itemId = isQueue ? `queue-${item.queue_id}` : `order-${item.id}`;
                  return itemId === activeId;
                });
                if (found) activeItem = found;
              });

              return activeItem ? (
                <Card className={t("pages.productionqueues.name.shadow_2xl_opacity_90")}>
                  <CardContent className={t("pages.productionqueues.name.p_3")}>
                    <div className={t("pages.productionqueues.name.flex_items_center_gap_2")}>
                      <Package className={t("pages.productionqueues.name.h_4_w_4")} />
                      <span className={t("pages.productionqueues.name.font_medium")}>
                        {"production_order_number" in activeItem 
                          ? activeItem.production_order_number 
                          : "أمر إنتاج"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </DragOverlay>
        </DndContext>
      )}
        </main>
      </div>
    </div>
  );
}