import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { QrCode, Play, Scissors, Clock } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import type { Machine } from "../../../../shared/schema";

interface ProductionQueueProps {
  queueType: "printing" | "cutting";
  items: any[];
}

export default function ProductionQueue({
  queueType,
  items,
}: ProductionQueueProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [printingModalOpen, setPrintingModalOpen] = useState(false);
  const [selectedRollId, setSelectedRollId] = useState<number | null>(null);
  const [selectedPrintingMachine, setSelectedPrintingMachine] = useState<string>("");

  // Fetch machines for printing selection
  const { data: machines = [] } = useQuery<Machine[]>({
    queryKey: ["/api/machines"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: sections = [] } = useQuery<any[]>({
    queryKey: ["/api/sections"],
    staleTime: 10 * 60 * 1000,
  });

  // Filter printing machines
  const printingMachines = (() => {
    if (!sections.length || !machines.length) return [];
    const printingSection = sections.find((s: any) =>
      [s.name, s.name_ar]
        .filter(Boolean)
        .map((x: string) => x.toLowerCase())
        .some((n: string) => n.includes("print") || n.includes("طباع"))
    );
    if (!printingSection) return [];
    return machines.filter(
      (m: Machine) => m.section_id === printingSection.id && m.status === "active"
    );
  })();

  const processItemMutation = useMutation({
    mutationFn: async ({ rollId, printingMachineId }: { rollId: number; printingMachineId?: string }) => {
      if (queueType === "printing") {
        const response = await fetch(`/api/rolls/${rollId}/print`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            printing_machine_id: printingMachineId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || t('common.error'));
        }

        return response.json();
      } else if (queueType === "cutting") {
        // For cutting, we'll need to show a cutting form
        // For now, just mark as cut with full weight
        const response = await fetch("/api/cuts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roll_id: rollId,
            cut_weight_kg:
              items.find((item) => item.id === rollId)?.weight_kg || 0,
            pieces_count: 1,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || t('common.error'));
        }

        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description:
          queueType === "printing" ? t('production.confirmPrinting') : t('production.confirmCutting'),
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/production/${queueType}-queue`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/hierarchical-orders"] });
      setProcessingId(null);
      setPrintingModalOpen(false);
      setSelectedRollId(null);
      setSelectedPrintingMachine("");
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
      setProcessingId(null);
    },
  });

  const handlePrintClick = (rollId: number) => {
    setSelectedRollId(rollId);
    setPrintingModalOpen(true);
  };

  const handlePrintConfirm = () => {
    if (!selectedPrintingMachine) {
      toast({
        title: t('common.error'),
        description: t('production.selectPrintingMachine'),
        variant: "destructive",
      });
      return;
    }
    if (selectedRollId) {
      setProcessingId(selectedRollId);
      processItemMutation.mutate({
        rollId: selectedRollId,
        printingMachineId: selectedPrintingMachine,
      });
    }
  };

  const handleProcess = (rollId: number) => {
    setProcessingId(rollId);
    processItemMutation.mutate({ rollId });
  };

  const getStatusBadge = (item: any) => {
    if (queueType === "printing") {
      return <Badge variant="outline">{t('production.waiting')}</Badge>;
    } else if (queueType === "cutting") {
      return <Badge variant="outline">{t('production.waiting')}</Badge>;
    }
    return null;
  };

  const getActionButton = (item: any) => {
    const isProcessing = processingId === item.id;

    if (queueType === "printing") {
      return (
        <Button
          onClick={() => handlePrintClick(item.id)}
          disabled={isProcessing || processItemMutation.isPending}
          size="sm"
          data-testid={`button-print-${item.id}`}
        >
          <Play className="h-4 w-4 mr-1" />
          {isProcessing ? t('common.loading') : t('common.print')}
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
          {isProcessing ? t('common.loading') : t('common.cut')}
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
            <p>{t('common.noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <QrCode className="h-6 w-6 text-gray-400" />
                  <div>
                    <p
                      className="font-medium"
                      data-testid={`text-roll-number-${item.id}`}
                    >
                      {item.roll_number || `${t('warehouse.roll')} ${item.id}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('production.rollWeight')}:{" "}
                      {parseFloat(item.weight_kg || item.weight || 0).toFixed(2)}{" "}
                      {t('warehouse.kg')}
                    </p>
                    {item.film_machine_id && (
                      <p className="text-xs text-gray-400">
                        {t('production.filmMachine')}: {item.film_machine_id}
                      </p>
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

      {/* Printing Machine Selection Modal */}
      <Dialog open={printingModalOpen} onOpenChange={setPrintingModalOpen}>
        <DialogContent className="max-w-md" aria-describedby="printing-machine-description">
          <DialogHeader>
            <DialogTitle>{t('production.selectPrintingMachine')}</DialogTitle>
            <DialogDescription id="printing-machine-description">
              {t('production.selectPrintingMachine')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="printing-machine">{t('production.printingMachine')} *</Label>
              <Select
                value={selectedPrintingMachine}
                onValueChange={setSelectedPrintingMachine}
                disabled={printingMachines.length === 0}
              >
                <SelectTrigger id="printing-machine" data-testid="select-printing-machine">
                  <SelectValue placeholder={printingMachines.length === 0 ? t('common.noData') : t('production.selectPrintingMachine')} />
                </SelectTrigger>
                <SelectContent>
                  {printingMachines.length > 0 ? (
                    printingMachines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name_ar || machine.name} - {machine.id}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      {t('common.noData')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {printingMachines.length === 0 && (
                <p className="text-sm text-amber-600">
                  {t('common.noData')}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => {
                setPrintingModalOpen(false);
                setSelectedPrintingMachine("");
              }}
              data-testid="button-cancel-printing"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handlePrintConfirm}
              disabled={!selectedPrintingMachine || processItemMutation.isPending}
              data-testid="button-confirm-printing"
            >
              {processItemMutation.isPending ? t('common.loading') : t('production.confirmPrinting')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
