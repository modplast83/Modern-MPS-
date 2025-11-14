import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useToast } from "../../hooks/use-toast";
import { Beaker, Plus, Trash2, Eye } from "lucide-react";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { useAuth } from "../../hooks/use-auth";
import { useTranslation } from "react-i18next";

type Material = {
  id: string;
  item_id: string;
  item_name: string;
  item_name_ar: string;
  weight_kg: string;
  percentage: number;
};

type BatchDetail = {
  id: number;
  batch_number: string;
  production_order_id: number;
  production_order_number?: string;
  machine_id: string;
  machine_name?: string;
  machine_name_ar?: string;
  screw_assignment: string;
  operator_id: number;
  operator_name?: string;
  total_weight_kg: string;
  status: string;
  created_at: string;
  notes?: string;
  composition?: Array<{
    material_name?: string;
    material_name_ar?: string;
    percentage: string;
  }>{t('components.production.FilmMaterialMixingTab.;_ingredients?:_array')}<{
    item_id: string;
    item_name?: string;
    item_name_ar?: string;
    actual_weight_kg: string;
    percentage: string;
  }>;
};

// Helper function to convert master batch code to color name
const getMasterBatchColor = (code: string | null | undefined): string => {
  if (!code) return '';
  
  const colorMap: Record<string, string> = {
    'PT-000000': 'أبيض',
    'PT-111111': 'أسود',
    'PT-CLEAR': 'شفاف',
    'PT-MIX': 'خليط ألوان',
  };
  
  if (colorMap[code]) return colorMap[code];
  
  if (code.startsWith('PT-00')) return 'أبيض';
  if (code.startsWith('PT-11')) return 'أسود';
  if (code.startsWith('PT-12')) return 'أحمر';
  if (code.startsWith('PT-13')) return 'أزرق';
  if (code.startsWith('PT-14')) return 'أخضر';
  if (code.startsWith('PT-15')) return 'أصفر';
  if (code.startsWith('PT-16')) return 'برتقالي';
  if (code.startsWith('PT-17')) return 'بنفسجي';
  if (code.startsWith('PT-18')) return 'بني';
  if (code.startsWith('PT-10')) return 'رمادي';
  
  return code;
};

export default function FilmMaterialMixingTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [productionOrderId, setProductionOrderId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [screw, setScrew] = useState("A");
  const [materials, setMaterials] = useState<Material[]>{t('components.production.FilmMaterialMixingTab.([]);_const_[selectedbatch,_setselectedbatch]_=_usestate')}<BatchDetail | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch data - get in_production and pending production orders
  const { data: productionOrdersData, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ["/api/production-orders"],
  });
  
  const allProductionOrders = Array.isArray(productionOrdersData) 
    ? productionOrdersData 
    : (productionOrdersData?.data || []);
  const productionOrders = allProductionOrders.filter(
    (po: any) => po.status === 'in_production' || po.status === 'pending'
  );

  const { data: machinesData, isLoading: machinesLoading } = useQuery<any>({
    queryKey: ["/api/machines"],
  });
  
  const allMachines = Array.isArray(machinesData)
    ? machinesData
    : (machinesData?.data || []);
  const machines = allMachines.filter(
    (machine: any) => machine.type === 'extruder'
  );

  const { data: itemsData, isLoading: itemsLoading } = useQuery<any>({
    queryKey: ["/api/items"],
  });
  const rawMaterials = (itemsData?.data || itemsData || []).filter(
    (item: any) => item.category_id === "CAT10"
  );

  const { data: batchesData, isLoading: batchesLoading } = useQuery<{ data: BatchDetail[] }>({
    queryKey: ["/api/mixing-batches"],
  });
  const batches = batchesData?.data || [];

  const { data: usersData } = useQuery<any>({ queryKey: ["/api/users"] });
  const users = usersData?.data || usersData || [];

  // Calculate total weight and auto-update percentages
  const totalWeight = materials.reduce(
    (sum, m) => sum + (parseFloat(m.weight_kg) || 0),
    0
  );

  const updatePercentages = (mats: Material[]) => {
    const total = mats.reduce((sum, m) => sum + (parseFloat(m.weight_kg) || 0), 0);
    return mats.map(m => ({
      ...m,
      percentage: total > 0 ? (parseFloat(m.weight_kg) / total) * 100 : 0
    }));
  };

  // Add material
  const addMaterial = () => {
    if (materials.length >= 10) {
      toast({
        title: t("toast.warning"),
        description: t("production.maxMaterialsWarning"),
        variant: "destructive",
      });
      return;
    }
    const newMaterial: Material = {
      id: Math.random().toString(36).substr(2, 9),
      item_id: "",
      item_name: "",
      item_name_ar: "",
      weight_kg: "",
      percentage: 0,
    };
    setMaterials([...materials, newMaterial]);
  };

  // Remove material
  const removeMaterial = (id: string) => {
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updatePercentages(updated));
  };

  // Update material item
  const updateMaterialItem = (id: string, itemId: string) => {
    const item = rawMaterials.find((i: any) => i.id === itemId);
    const updated = materials.map(m =>
      m.id === id
        ? {
            ...m,
            item_id: itemId,
            item_name: item?.name || "",
            item_name_ar: item?.name_ar || "",
          }
        : m
    );
    setMaterials(updated);
  };

  // Update material weight
  const updateMaterialWeight = (id: string, weight: string) => {
    const updated = materials.map(m => (m.id === id ? { ...m, weight_kg: weight } : m));
    setMaterials(updatePercentages(updated));
  };

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/mixing-batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: t("toast.saveSuccess"),
        description: t("production.batchCreatedSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mixing-batches"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("production.batchCreationFailed"),
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setProductionOrderId("");
    setMachineId("");
    setScrew("A");
    setMaterials([]);
  };

  // Handle save
  const handleSave = () => {
    if (!productionOrderId) {
      toast({ title: t("common.error"), description: t("production.selectProductionOrder"), variant: "destructive" });
      return;
    }
    if (!machineId) {
      toast({ title: t("common.error"), description: t("production.selectMachine"), variant: "destructive" });
      return;
    }
    if (materials.length === 0) {
      toast({ title: t("common.error"), description: t("production.atLeastOneMaterial"), variant: "destructive" });
      return;
    }
    if (materials.some(m =>{t('components.production.FilmMaterialMixingTab.!m.item_id_||_!m.weight_kg_||_parsefloat(m.weight_kg)')}<= 0)) {
      toast({ title: t("common.error"), description: t("production.validateMaterialData"), variant: "destructive" });
      return;
    }

    const batch = {
      production_order_id: parseInt(productionOrderId),
      machine_id: machineId,
      screw_assignment: screw,
      operator_id: user?.id || 1,
      total_weight_kg: totalWeight.toString(),
      status: "completed",
    };

    const ingredients = materials.map(m => ({
      item_id: m.item_id,
      actual_weight_kg: m.weight_kg,
      percentage: m.percentage.toFixed(2),
    }));

    createBatchMutation.mutate({ batch, ingredients });
  };

  // View batch details
  const viewBatchDetails = (batch: BatchDetail) => {
    setSelectedBatch(batch);
    setDetailsDialogOpen(true);
  };

  return (
    <div className={t("components.production.filmmaterialmixingtab.name.space_y_6")}>
      {/* Create New Batch Card */}
      <Card>
        <CardHeader>
          <CardTitle className={t("components.production.filmmaterialmixingtab.name.flex_items_center_gap_2")}>
            <Beaker className={t("components.production.filmmaterialmixingtab.name.h_5_w_5")} />
            {t("production.createNewBatch")}
          </CardTitle>
        </CardHeader>
        <CardContent className={t("components.production.filmmaterialmixingtab.name.space_y_4")}>
          {/* Production Order & Machine Selection */}
          <div className={t("components.production.filmmaterialmixingtab.name.grid_grid_cols_1_md_grid_cols_3_gap_4")}>
            <div className={t("components.production.filmmaterialmixingtab.name.space_y_2")}>
              <Label>{t("production.productionOrder")}</Label>
              {ordersLoading ? (
                <Skeleton className={t("components.production.filmmaterialmixingtab.name.h_10_w_full")} />{t('components.production.FilmMaterialMixingTab.)_:_(')}<Select value={productionOrderId} onValueChange={setProductionOrderId}>
                  <SelectTrigger data-testid="select-production-order">
                    <SelectValue placeholder={t("production.selectProductionOrder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {productionOrders.map((order: any) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        <div className={t("components.production.filmmaterialmixingtab.name.flex_flex_col_gap_1")}>
                          <div className={t("components.production.filmmaterialmixingtab.name.font_semibold")}>{order.production_order_number}</div>
                          <div className={t("components.production.filmmaterialmixingtab.name.text_sm_text_gray_600")}>
                            {order.item_name_ar || order.item_name} | 
                            {' '}{order.raw_material}
                            {order.master_batch_id && ` | ${getMasterBatchColor(order.master_batch_id)}`} | 
                            {' '}{parseFloat(order.final_quantity_kg || order.quantity_kg || 0).toFixed(2)} كجم |
                            {' '}{order.customer_name_ar || order.customer_name}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className={t("components.production.filmmaterialmixingtab.name.space_y_2")}>
              <Label>{t("production.filmMachine")}</Label>
              {machinesLoading ? (
                <Skeleton className={t("components.production.filmmaterialmixingtab.name.h_10_w_full")} />{t('components.production.FilmMaterialMixingTab.)_:_(')}<Select value={machineId} onValueChange={setMachineId}>
                  <SelectTrigger data-testid="select-machine">
                    <SelectValue placeholder={t("production.selectMachine")} />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine: any) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name_ar || machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className={t("components.production.filmmaterialmixingtab.name.space_y_2")}>
              <Label>{t("production.screw")}</Label>
              <RadioGroup value={screw} onValueChange={setScrew}>
                <div className={t("components.production.filmmaterialmixingtab.name.flex_gap_4")}>
                  <div className={t("components.production.filmmaterialmixingtab.name.flex_items_center_space_x_2_space_x_reverse")}>
                    <RadioGroupItem value="A" id="screw-a" data-testid="radio-screw-a" />
                    <Label htmlFor="screw-a">A</Label>
                  </div>
                  <div className={t("components.production.filmmaterialmixingtab.name.flex_items_center_space_x_2_space_x_reverse")}>
                    <RadioGroupItem value="B" id="screw-b" data-testid="radio-screw-b" />
                    <Label htmlFor="screw-b">B</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Materials Section */}
          <div className={t("components.production.filmmaterialmixingtab.name.border_rounded_lg_p_4_space_y_3")}>
            <div className={t("components.production.filmmaterialmixingtab.name.flex_justify_between_items_center")}>
              <Label className={t("components.production.filmmaterialmixingtab.name.text_lg_font_semibold")}>{t("production.rawMaterials")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterial}
                data-testid="button-add-material"
              >
                <Plus className={t("components.production.filmmaterialmixingtab.name.h_4_w_4_ml_2")} />
                {t("production.addMaterial")}
              </Button>
            </div>

            {materials.length === 0 ? (
              <p className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground_text_center_py_4")}>
                {t("production.noMaterialsAddToStart")}
              </p>{t('components.production.FilmMaterialMixingTab.)_:_(')}<div className={t("components.production.filmmaterialmixingtab.name.space_y_2")}>
                {materials.map((material, index) => (
                  <div
                    key={material.id}
                    className={t("components.production.filmmaterialmixingtab.name.grid_grid_cols_12_gap_2_items_end")}
                    data-testid={`material-row-${index}`}
                  >
                    <div className={t("components.production.filmmaterialmixingtab.name.col_span_5_space_y_1")}>
                      <Label className={t("components.production.filmmaterialmixingtab.name.text_xs")}>{t("production.material")}</Label>
                      {itemsLoading ? (
                        <Skeleton className={t("components.production.filmmaterialmixingtab.name.h_10_w_full")} />{t('components.production.FilmMaterialMixingTab.)_:_(')}<Select
                          value={material.item_id}
                          onValueChange={(val) => updateMaterialItem(material.id, val)}
                        >
                          <SelectTrigger data-testid={`select-material-${index}`}>
                            <SelectValue placeholder={t("production.selectMaterial")} />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterials.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name_ar || item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className={t("components.production.filmmaterialmixingtab.name.col_span_3_space_y_1")}>
                      <Label className={t("components.production.filmmaterialmixingtab.name.text_xs")}>{t("production.weightKg")}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={material.weight_kg}
                        onChange={(e) => updateMaterialWeight(material.id, e.target.value)}
                        placeholder="{t('components.production.FilmMaterialMixingTab.placeholder.0.00')}"
                        data-testid={`input-weight-${index}`}
                      />
                    </div>

                    <div className={t("components.production.filmmaterialmixingtab.name.col_span_3_space_y_1")}>
                      <Label className={t("components.production.filmmaterialmixingtab.name.text_xs")}>{t("production.percentage")}</Label>
                      <Input
                        type="text"
                        value={material.percentage.toFixed(2) + "%"}
                        disabled
                        className={t("components.production.filmmaterialmixingtab.name.bg_gray_100_dark_bg_gray_800")}
                        data-testid={`text-percentage-${index}`}
                      />
                    </div>

                    <div className={t("components.production.filmmaterialmixingtab.name.col_span_1")}>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeMaterial(material.id)}
                        data-testid={`button-remove-${index}`}
                      >
                        <Trash2 className={t("components.production.filmmaterialmixingtab.name.h_4_w_4")} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total Weight */}
            {materials.length >{t('components.production.FilmMaterialMixingTab.0_&&_(')}<div className={t("components.production.filmmaterialmixingtab.name.pt_3_border_t")}>
                <div className={t("components.production.filmmaterialmixingtab.name.flex_justify_between_items_center_text_lg_font_semibold")}>
                  <span>{t("production.totalWeight")}:</span>
                  <span data-testid="text-total-weight">{totalWeight.toFixed(2)} {t("warehouse.kg")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={createBatchMutation.isPending}
            className={t("components.production.filmmaterialmixingtab.name.w_full")}
            data-testid="button-save-batch"
          >
            {createBatchMutation.isPending ? t("common.saving") : t("production.saveBatch")}
          </Button>
        </CardContent>
      </Card>

      {/* Batches List Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("production.batchesHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {batchesLoading ? (
            <div className={t("components.production.filmmaterialmixingtab.name.space_y_2")}>
              <Skeleton className={t("components.production.filmmaterialmixingtab.name.h_12_w_full")} />
              <Skeleton className={t("components.production.filmmaterialmixingtab.name.h_12_w_full")} />
              <Skeleton className={t("components.production.filmmaterialmixingtab.name.h_12_w_full")} />
            </div>{t('components.production.FilmMaterialMixingTab.)_:_batches.length_===_0_?_(')}<p className={t("components.production.filmmaterialmixingtab.name.text_center_text_muted_foreground_py_8")}>
              {t("production.noBatchesRecorded")}
            </p>{t('components.production.FilmMaterialMixingTab.)_:_(')}<div className={t("components.production.filmmaterialmixingtab.name.overflow_x_auto")}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.batchNumber")}</TableHead>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.productionOrder")}</TableHead>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.machine")}</TableHead>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.screw")}</TableHead>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.totalWeight")}</TableHead>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("common.date")}</TableHead>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.operator")}</TableHead>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.mixture")}</TableHead>
                    <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => {
                    const operator = users.find((u: any) =>{t('components.production.FilmMaterialMixingTab.u.id_===_batch.operator_id);_return_(')}<TableRow
                        key={batch.id}
                        className={t("components.production.filmmaterialmixingtab.name.cursor_pointer_hover_bg_gray_50_dark_hover_bg_gray_800")}
                        data-testid={`row-batch-${batch.id}`}
                      >
                        <TableCell className={t("components.production.filmmaterialmixingtab.name.font_medium")}>
                          {batch.batch_number}
                        </TableCell>
                        <TableCell>
                          {batch.production_order_number || `PO-${batch.production_order_id}`}
                        </TableCell>
                        <TableCell>
                          {batch.machine_name_ar || batch.machine_name || batch.machine_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{batch.screw_assignment}</Badge>
                        </TableCell>
                        <TableCell>{parseFloat(batch.total_weight_kg).toFixed(2)} {t("warehouse.kg")}</TableCell>
                        <TableCell>
                          {new Date(batch.created_at).toLocaleDateString("ar-EG")}
                        </TableCell>
                        <TableCell>
                          {operator?.display_name_ar || operator?.display_name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className={t("components.production.filmmaterialmixingtab.name.text_sm_space_y_0_5")}>
                            {batch.composition && batch.composition.length > 0 ? (
                              batch.composition.map((comp: any, idx: number) => (
                                <div key={idx} className={t("components.production.filmmaterialmixingtab.name.text_xs")}>
                                  <span className={t("components.production.filmmaterialmixingtab.name.font_medium")}>{comp.material_name_ar || comp.material_name}</span>
                                  <span className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}> ({comp.percentage})</span>
                                </div>{t('components.production.FilmMaterialMixingTab.))_)_:_(')}<span className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}>-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewBatchDetails(batch)}
                            data-testid={`button-view-${batch.id}`}
                          >
                            <Eye className={t("components.production.filmmaterialmixingtab.name.h_4_w_4")} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className={t("components.production.filmmaterialmixingtab.name.max_w_2xl")} dir="rtl">
          <DialogHeader>
            <DialogTitle>{t("production.batchDetails")}</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className={t("components.production.filmmaterialmixingtab.name.space_y_4")}>
              <div className={t("components.production.filmmaterialmixingtab.name.grid_grid_cols_2_gap_4")}>
                <div>
                  <Label className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}>{t("production.batchNumber")}</Label>
                  <p className={t("components.production.filmmaterialmixingtab.name.font_semibold")}>{selectedBatch.batch_number}</p>
                </div>
                <div>
                  <Label className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}>{t("production.productionOrder")}</Label>
                  <p className={t("components.production.filmmaterialmixingtab.name.font_semibold")}>
                    {selectedBatch.production_order_number || `PO-${selectedBatch.production_order_id}`}
                  </p>
                </div>
                <div>
                  <Label className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}>{t("production.machine")}</Label>
                  <p className={t("components.production.filmmaterialmixingtab.name.font_semibold")}>
                    {selectedBatch.machine_name_ar || selectedBatch.machine_name || selectedBatch.machine_id}
                  </p>
                </div>
                <div>
                  <Label className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}>{t("production.screw")}</Label>
                  <p className={t("components.production.filmmaterialmixingtab.name.font_semibold")}>{selectedBatch.screw_assignment}</p>
                </div>
                <div>
                  <Label className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}>{t("production.totalWeight")}</Label>
                  <p className={t("components.production.filmmaterialmixingtab.name.font_semibold")}>{parseFloat(selectedBatch.total_weight_kg).toFixed(2)} {t("warehouse.kg")}</p>
                </div>
                <div>
                  <Label className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}>{t("common.date")}</Label>
                  <p className={t("components.production.filmmaterialmixingtab.name.font_semibold")}>
                    {new Date(selectedBatch.created_at).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>

              {selectedBatch.ingredients && selectedBatch.ingredients.length >{t('components.production.FilmMaterialMixingTab.0_&&_(')}<div className={t("components.production.filmmaterialmixingtab.name.space_y_2")}>
                  <Label className={t("components.production.filmmaterialmixingtab.name.text_lg_font_semibold")}>{t("production.ingredients")}</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.material")}</TableHead>
                        <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.weightKg")}</TableHead>
                        <TableHead className={t("components.production.filmmaterialmixingtab.name.text_right")}>{t("production.percentage")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBatch.ingredients.map((ing, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{ing.item_name_ar || ing.item_name || ing.item_id}</TableCell>
                          <TableCell>{parseFloat(ing.actual_weight_kg).toFixed(2)}</TableCell>
                          <TableCell>{parseFloat(ing.percentage).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedBatch.notes && (
                <div>
                  <Label className={t("components.production.filmmaterialmixingtab.name.text_muted_foreground")}>{t("common.notes")}</Label>
                  <p className={t("components.production.filmmaterialmixingtab.name.font_medium")}>{selectedBatch.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
