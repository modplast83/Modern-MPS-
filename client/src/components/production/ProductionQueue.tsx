import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Play, Scissors, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductionQueueProps {
  queueType: "printing" | "cutting";
  items: any[];
}

export default function ProductionQueue({ queueType, items }: ProductionQueueProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const processItemMutation = useMutation({
    mutationFn: async (rollId: number) => {
      if (queueType === "printing") {
        const response = await fetch(`/api/rolls/${rollId}/print`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'فشل في تسجيل الطباعة');
        }
        
        return response.json();
      } else if (queueType === "cutting") {
        // For cutting, we'll need to show a cutting form
        // For now, just mark as cut with full weight
        const response = await fetch('/api/cuts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roll_id: rollId,
            cut_weight_kg: items.find(item => item.id === rollId)?.weight_kg || 0,
            pieces_count: 1
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'فشل في تسجيل التقطيع');
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "تم بنجاح",
        description: queueType === "printing" ? "تم تسجيل الطباعة" : "تم تسجيل التقطيع"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/production/${queueType}-queue`] });
      queryClient.invalidateQueries({ queryKey: ['/api/rolls'] });
      setProcessingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive"
      });
      setProcessingId(null);
    }
  });

  const handleProcess = (rollId: number) => {
    setProcessingId(rollId);
    processItemMutation.mutate(rollId);
  };

  const getStatusBadge = (item: any) => {
    if (queueType === "printing") {
      return <Badge variant="outline">جاهز للطباعة</Badge>;
    } else if (queueType === "cutting") {
      return <Badge variant="outline">جاهز للتقطيع</Badge>;
    }
    return null;
  };

  const getActionButton = (item: any) => {
    const isProcessing = processingId === item.id;
    
    if (queueType === "printing") {
      return (
        <Button
          onClick={() => handleProcess(item.id)}
          disabled={isProcessing || processItemMutation.isPending}
          size="sm"
          data-testid={`button-print-${item.id}`}
        >
          <Play className="h-4 w-4 mr-1" />
          {isProcessing ? "جاري الطباعة..." : "طباعة"}
        </Button>
      );
    } else if (queueType === "cutting") {
      return (
        <Button
          onClick={() => handleProcess(item.id)}
          disabled={isProcessing || processItemMutation.isPending}
          size="sm"
          data-testid={`button-cut-${item.id}`}
        >
          <Scissors className="h-4 w-4 mr-1" />
          {isProcessing ? "جاري التقطيع..." : "تقطيع"}
        </Button>
      );
    }
    return null;
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد عناصر في قائمة الانتظار</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <QrCode className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="font-medium" data-testid={`text-roll-number-${item.id}`}>
                    {item.roll_number || `رول ${item.id}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    الوزن: {parseFloat(item.weight_kg || item.weight || 0).toFixed(2)} كجم
                  </p>
                  {item.machine_id && (
                    <p className="text-xs text-gray-400">المكينة: {item.machine_id}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                {getStatusBadge(item)}
                {getActionButton(item)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}