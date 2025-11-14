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
  const [processingId, setProcessingId] = useState<number | null>{t('components.production.ProductionQueue.(null);_const_[printingmodalopen,_setprintingmodalopen]_=_usestate(false);_const_[selectedrollid,_setselectedrollid]_=_usestate')}<number | null>{t('components.production.ProductionQueue.(null);_const_[selectedprintingmachine,_setselectedprintingmachine]_=_usestate')}<string>("");

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
          <Play className={t("components.production.productionqueue.name.h_4_w_4_mr_1")} />
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
          <Scissors className={t("components.production.productionqueue.name.h_4_w_4_mr_1")} />
          {isProcessing ? t('common.loading') : t('common.cut')}
        </Button>
      );
    }
    return null;
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className={t("components.production.productionqueue.name.p_6_text_center")}>
          <div className={t("components.production.productionqueue.name.text_gray_500")}>
            <Clock className={t("components.production.productionqueue.name.h_12_w_12_mx_auto_mb_2_opacity_50")} />
            <p>{t('common.noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className={t("components.production.productionqueue.name.space_y_4")}>
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className={t("components.production.productionqueue.name.p_4")}>
              <div className={t("components.production.productionqueue.name.flex_items_center_justify_between")}>
                <div className={t("components.production.productionqueue.name.flex_items_center_space_x_4_space_x_reverse")}>
                  <QrCode className={t("components.production.productionqueue.name.h_6_w_6_text_gray_400")} />
                  <div>
                    <p
                      className={t("components.production.productionqueue.name.font_medium")}
                      data-testid={`text-roll-number-${item.id}`}
                    >
                      {item.roll_number || `${t('warehouse.roll')} ${item.id}`}
                    </p>
                    <p className={t("components.production.productionqueue.name.text_sm_text_gray_500")}>
                      {t('production.rollWeight')}:{" "}
                      {parseFloat(item.weight_kg || item.weight || 0).toFixed(2)}{" "}
                      {t('warehouse.kg')}
                    </p>
                    {item.film_machine_id && (
                      <p className={t("components.production.productionqueue.name.text_xs_text_gray_400")}>
                        {t('production.filmMachine')}: {item.film_machine_id}
                      </p>
                    )}
                  </div>
                </div>

                <div className={t("components.production.productionqueue.name.flex_items_center_space_x_2_space_x_reverse")}>
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
        <DialogContent className={t("components.production.productionqueue.name.max_w_md")} aria-describedby="printing-machine-description">
          <DialogHeader>
            <DialogTitle>{t('production.selectPrintingMachine')}</DialogTitle>
            <DialogDescription id="printing-machine-description">
              {t('production.selectPrintingMachine')}
            </DialogDescription>
          </DialogHeader>

          <div className={t("components.production.productionqueue.name.space_y_4_py_4")}>
            <div className={t("components.production.productionqueue.name.space_y_2")}>
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
                      </SelectItem>{t('components.production.ProductionQueue.))_)_:_(')}<SelectItem value="none" disabled>
                      {t('common.noData')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {printingMachines.length === 0 && (
                <p className={t("components.production.productionqueue.name.text_sm_text_amber_600")}>
                  {t('common.noData')}
                </p>
              )}
            </div>
          </div>

          <div className={t("components.production.productionqueue.name.flex_justify_end_space_x_2_space_x_reverse")}>
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
