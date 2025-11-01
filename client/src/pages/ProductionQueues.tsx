import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
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
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import {
  GripVertical,
  Factory,
  Package,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface ProductionOrder {
  id: number;
  production_order_number: string;
  quantity_kg: string;
  final_quantity_kg: string;
  status: string;
  customer_product_id: number;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2"
    >
      <Card className="hover:shadow-md transition-shadow cursor-move">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab hover:cursor-grabbing text-muted-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">
                  {isQueueItem ? item.production_order_number : item.production_order_number}
                </span>
                {!isQueueItem && (
                  <Badge variant={item.status === "active" ? "default" : "secondary"}>
                    {item.status === "active" ? "نشط" : "معلق"}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                الكمية: {isQueueItem ? item.quantity_kg : item.final_quantity_kg} كجم
              </div>
              {isQueueItem && item.assigned_by_name && (
                <div className="text-xs text-muted-foreground mt-1">
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
    <Card className={`min-h-[600px] ${machine ? getMachineColor(machine.type) : "bg-gray-50"}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            <span>
              {machine ? machine.name_ar || machine.name : "أوامر غير مخصصة"}
            </span>
          </div>
          {machine && (
            <div className="flex items-center gap-2 text-sm">
              <span>{getMachineIcon(machine.status)}</span>
              <Badge variant="outline">{items.length} أمر</Badge>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <SortableContext
            items={sortableItems}
            strategy={verticalListSortingStrategy}
          >
            <div className="min-h-[50px]">
              {items.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد أوامر إنتاج</p>
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localQueues, setLocalQueues] = useState<{ [key: string]: any[] }>({});
  
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
      
      // Find unassigned active production orders
      const assignedOrderIds = new Set(queuesData.data.map(q => q.production_order_id));
      const unassignedOrders = productionOrders.filter(
        po => po.status === "active" && !assignedOrderIds.has(po.id)
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

      toast({
        title: "تم التوزيع",
        description: `تم توزيع ${suggestions.data.length} أمر إنتاج على المكائن`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/machine-queues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/machine-queues/suggest"] });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تطبيق التوزيع التلقائي",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الطوابير...</p>
        </div>
      </div>
    );
  }

  const activeMachines = machines.filter(m => m.status === "active");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">طوابير الإنتاج</h1>
            <p className="text-muted-foreground mt-1">
              قم بسحب وإفلات أوامر الإنتاج لتنظيم العمل على المكائن
            </p>
          </div>
          <Button
            onClick={applySuggestions}
            disabled={!suggestions?.data || suggestions.data.length === 0}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            توزيع تلقائي ذكي
            {suggestions?.data && suggestions.data.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {suggestions.data.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {activeMachines.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">لا توجد مكائن نشطة</h2>
          <p className="text-muted-foreground">
            يجب تفعيل مكينة واحدة على الأقل لإدارة طوابير الإنتاج
          </p>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <Card className="shadow-2xl opacity-90">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">
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
    </div>
  );
}