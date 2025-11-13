import { useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";

interface ProductionOrderActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (machineId?: string, operatorId?: number) => void;
  order: any;
  machines: any[];
  operators: any[];
  isUpdating?: boolean;
}

export default function ProductionOrderActivationModal({
  isOpen,
  onClose,
  onConfirm,
  order,
  machines,
  operators,
  isUpdating = false,
}: ProductionOrderActivationModalProps) {
  const { t } = useTranslation();
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");

  const handleConfirm = () => {
    const machineId = selectedMachineId || undefined;
    const operatorId = selectedOperatorId ? parseInt(selectedOperatorId) : undefined;
    onConfirm(machineId, operatorId);
  };

  const activeMachines = machines.filter(m => m.status === "active");

  const productionOperators = operators.filter(u => {
    return u.section_id && ['production', 'factory'].includes(u.section_id);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdating ? t('common.update') : t('production.activateOrder')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {order && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('production.productionOrderNumber')}:</span>
                  <span className="font-medium">{order.production_order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('orders.customer')}:</span>
                  <span className="font-medium">
                    {order.customer_name_ar || order.customer_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('orders.product')}:</span>
                  <span className="font-medium">{order.size_caption}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('common.quantity')}:</span>
                  <span className="font-medium">{order.quantity_kg} {t('warehouse.kg')}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="machine">{t('production.machine')} ({t('common.optional')})</Label>
            <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
              <SelectTrigger id="machine" data-testid="select-machine">
                <SelectValue placeholder={t('production.selectMachine')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" data-testid="option-no-machine">
                  {t('common.noData')}
                </SelectItem>
                {activeMachines.map((machine) => (
                  <SelectItem
                    key={machine.id}
                    value={machine.id}
                    data-testid={`option-machine-${machine.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {machine.name_ar || machine.name}
                      {machine.type && (
                        <Badge variant="outline" className="text-xs">
                          {machine.type}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMachineId && selectedMachineId !== "none" && (
              <p className="text-sm text-green-600 mt-1">
                {t('production.assignToMachine')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="operator">{t('production.operator')} ({t('common.optional')})</Label>
            <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
              <SelectTrigger id="operator" data-testid="select-operator">
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" data-testid="option-no-operator">
                  {t('common.noData')}
                </SelectItem>
                {productionOperators.map((operator) => (
                  <SelectItem
                    key={operator.id}
                    value={operator.id.toString()}
                    data-testid={`option-operator-${operator.id}`}
                  >
                    {operator.display_name_ar || operator.display_name || operator.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedOperatorId && selectedOperatorId !== "none" && (
              <p className="text-sm text-green-600 mt-1">
                {t('production.assignToMachine')}
              </p>
            )}
          </div>

          {!isUpdating && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>{t('common.notes')}:</strong> {t('production.activate')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} data-testid="button-confirm-activation">
            {isUpdating ? t('common.update') : t('production.activate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
