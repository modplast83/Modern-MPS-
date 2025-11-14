import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { queryClient, apiRequest } from "../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { Beaker, Plus, Trash2, Eye } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import { useAuth } from "../hooks/use-auth";

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
  }>{t('pages.material-mixing.;_ingredients?:_array')}<{
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
  
  // Map common codes to Arabic color names
  const colorMap: Record<string, string> = {
    'PT-000000': 'أبيض',
    'PT-111111': 'أسود',
    'PT-CLEAR': 'شفاف',
    'PT-MIX': 'خليط ألوان',
  };
  
  // Check exact match first
  if (colorMap[code]) return colorMap[code];
  
  // Pattern matching for codes
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
  
  // Return code if no match (fallback)
  return code;
};

export default function MaterialMixing() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [productionOrderId, setProductionOrderId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [screw, setScrew] = useState("A");
  const [materials, setMaterials] = useState<Material[]>{t('pages.material-mixing.([]);_const_[selectedbatch,_setselectedbatch]_=_usestate')}<BatchDetail | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch data - get in_production and pending production orders
  const { data: productionOrdersData, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ["/api/production-orders"],
  });
  
  // Handle both response formats: direct array or {data: array}
  const allProductionOrders = Array.isArray(productionOrdersData) 
    ? productionOrdersData 
    : (productionOrdersData?.data || []);
  const productionOrders = allProductionOrders.filter(
    (po: any) => po.status === 'in_production' || po.status === 'pending'
  );

  const { data: machinesData, isLoading: machinesLoading } = useQuery<any>({
    queryKey: ["/api/machines"],
  });
  
  // Handle both response formats: direct array or {data: array}
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
        title: t('common.error'),
        description: t('production.maxMaterialsReached'),
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
        title: t('common.success'),
        description: t('production.batchCreatedSuccess'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mixing-batches"] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('production.batchCreationFailed'),
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
      toast({ title: t('common.error'), description: t('production.selectProductionOrder'), variant: "destructive" });
      return;
    }
    if (!machineId) {
      toast({ title: t('common.error'), description: t('production.selectMachine'), variant: "destructive" });
      return;
    }
    if (materials.length === 0) {
      toast({ title: t('common.error'), description: t('production.atLeastOneMaterial'), variant: "destructive" });
      return;
    }
    if (materials.some(m =>{t('pages.material-mixing.!m.item_id_||_!m.weight_kg_||_parsefloat(m.weight_kg)')}<= 0)) {
      toast({ title: t('common.error'), description: t('production.checkMaterialData'), variant: "destructive" });
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
    <div className={t("pages.material-mixing.name.min_h_screen_bg_gray_50")} dir="rtl">
      <Header />
      
      <div className={t("pages.material-mixing.name.flex")}>
        <Sidebar />
        <MobileNav />
        
        <main className={t("pages.material-mixing.name.flex_1_p_4_lg_pr_64")}>
          <div className={t("pages.material-mixing.name.max_w_7xl_mx_auto_space_y_6")}>
            <div className={t("pages.material-mixing.name.flex_items_center_gap_2")}>
              <Beaker className={t("pages.material-mixing.name.h_8_w_8_text_primary")} />
              <h1 className={t("pages.material-mixing.name.text_3xl_font_bold")}>{t('sidebar.materialMixing')}</h1>
            </div>

            {/* Create New Batch Card */}
            <Card>
              <CardHeader>
                <CardTitle className={t("pages.material-mixing.name.flex_items_center_gap_2")}>
                  <Plus className={t("pages.material-mixing.name.h_5_w_5")} />
                  {t('production.createNewBatch')}
                </CardTitle>
              </CardHeader>
              <CardContent className={t("pages.material-mixing.name.space_y_4")}>
                {/* Production Order & Machine Selection */}
                <div className={t("pages.material-mixing.name.grid_grid_cols_1_md_grid_cols_3_gap_4")}>
                  <div className={t("pages.material-mixing.name.space_y_2")}>
                    <Label>{t('production.productionOrderNumber')}</Label>
                    {ordersLoading ? (
                      <Skeleton className={t("pages.material-mixing.name.h_10_w_full")} />{t('pages.material-mixing.)_:_(')}<Select value={productionOrderId} onValueChange={setProductionOrderId}>
                        <SelectTrigger data-testid="select-production-order">
                          <SelectValue placeholder={t('production.selectProductionOrder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {productionOrders.map((order: any) => (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              <div className={t("pages.material-mixing.name.flex_flex_col_gap_1")}>
                                <div className={t("pages.material-mixing.name.font_semibold")}>{order.production_order_number}</div>
                                <div className={t("pages.material-mixing.name.text_sm_text_gray_600")}>
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

                  <div className={t("pages.material-mixing.name.space_y_2")}>
                    <Label>{t('production.filmMachine')}</Label>
                    {machinesLoading ? (
                      <Skeleton className={t("pages.material-mixing.name.h_10_w_full")} />{t('pages.material-mixing.)_:_(')}<Select value={machineId} onValueChange={setMachineId}>
                        <SelectTrigger data-testid="select-machine">
                          <SelectValue placeholder={t('production.selectFilmMachine')} />
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

                  <div className={t("pages.material-mixing.name.space_y_2")}>
                    <Label>{t('production.screw')}</Label>
                    <RadioGroup value={screw} onValueChange={setScrew}>
                      <div className={t("pages.material-mixing.name.flex_gap_4")}>
                        <div className={t("pages.material-mixing.name.flex_items_center_space_x_2_space_x_reverse")}>
                          <RadioGroupItem value="A" id="screw-a" data-testid="radio-screw-a" />
                          <Label htmlFor="screw-a">A</Label>
                        </div>
                        <div className={t("pages.material-mixing.name.flex_items_center_space_x_2_space_x_reverse")}>
                          <RadioGroupItem value="B" id="screw-b" data-testid="radio-screw-b" />
                          <Label htmlFor="screw-b">B</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Materials Section */}
                <div className={t("pages.material-mixing.name.border_rounded_lg_p_4_space_y_3")}>
                  <div className={t("pages.material-mixing.name.flex_justify_between_items_center")}>
                    <Label className={t("pages.material-mixing.name.text_lg_font_semibold")}>{t('production.rawMaterials')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMaterial}
                      data-testid="button-add-material"
                    >
                      <Plus className={t("pages.material-mixing.name.h_4_w_4_ml_2")} />
                      {t('production.addMaterial')}
                    </Button>
                  </div>

                  {materials.length === 0 ? (
                    <p className={t("pages.material-mixing.name.text_muted_foreground_text_center_py_4")}>
                      {t('production.noMaterialsAdded')}
                    </p>{t('pages.material-mixing.)_:_(')}<div className={t("pages.material-mixing.name.space_y_2")}>
                      {materials.map((material, index) => (
                        <div
                          key={material.id}
                          className={t("pages.material-mixing.name.grid_grid_cols_12_gap_2_items_end")}
                          data-testid={`material-row-${index}`}
                        >
                          <div className={t("pages.material-mixing.name.col_span_5_space_y_1")}>
                            <Label className={t("pages.material-mixing.name.text_xs")}>{t('warehouse.item')}</Label>
                            {itemsLoading ? (
                              <Skeleton className={t("pages.material-mixing.name.h_10_w_full")} />{t('pages.material-mixing.)_:_(')}<Select
                                value={material.item_id}
                                onValueChange={(val) => updateMaterialItem(material.id, val)}
                              >
                                <SelectTrigger data-testid={`select-material-${index}`}>
                                  <SelectValue placeholder={t('production.selectMaterial')} />
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

                          <div className={t("pages.material-mixing.name.col_span_3_space_y_1")}>
                            <Label className={t("pages.material-mixing.name.text_xs")}>{t('production.materialWeight')} ({t('warehouse.kg')})</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={material.weight_kg}
                              onChange={(e) => updateMaterialWeight(material.id, e.target.value)}
                              placeholder="{t('pages.material-mixing.placeholder.0.00')}"
                              data-testid={`input-weight-${index}`}
                            />
                          </div>

                          <div className={t("pages.material-mixing.name.col_span_3_space_y_1")}>
                            <Label className={t("pages.material-mixing.name.text_xs")}>{t('production.percentage')}</Label>
                            <Input
                              type="text"
                              value={material.percentage.toFixed(2) + "%"}
                              disabled
                              className={t("pages.material-mixing.name.bg_gray_100")}
                              data-testid={`text-percentage-${index}`}
                            />
                          </div>

                          <div className={t("pages.material-mixing.name.col_span_1")}>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeMaterial(material.id)}
                              data-testid={`button-remove-${index}`}
                            >
                              <Trash2 className={t("pages.material-mixing.name.h_4_w_4")} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Weight */}
                  {materials.length >{t('pages.material-mixing.0_&&_(')}<div className={t("pages.material-mixing.name.pt_3_border_t")}>
                      <div className={t("pages.material-mixing.name.flex_justify_between_items_center_text_lg_font_semibold")}>
                        <span>{t('production.totalWeight')}:</span>
                        <span data-testid="text-total-weight">{totalWeight.toFixed(2)} {t('warehouse.kg')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={createBatchMutation.isPending}
                  className={t("pages.material-mixing.name.w_full")}
                  data-testid="button-save-batch"
                >
                  {createBatchMutation.isPending ? t('common.loading') : t('production.saveBatch')}
                </Button>
              </CardContent>
            </Card>

            {/* Batches List Table */}
            <Card>
              <CardHeader>
                <CardTitle>{t('production.batchHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {batchesLoading ? (
                  <div className={t("pages.material-mixing.name.space_y_2")}>
                    <Skeleton className={t("pages.material-mixing.name.h_12_w_full")} />
                    <Skeleton className={t("pages.material-mixing.name.h_12_w_full")} />
                    <Skeleton className={t("pages.material-mixing.name.h_12_w_full")} />
                  </div>{t('pages.material-mixing.)_:_batches.length_===_0_?_(')}<p className={t("pages.material-mixing.name.text_center_text_muted_foreground_py_8")}>
                    {t('production.noBatchesRecorded')}
                  </p>{t('pages.material-mixing.)_:_(')}<div className={t("pages.material-mixing.name.overflow_x_auto")}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.batchNumber')}</TableHead>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.productionOrderNumber')}</TableHead>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.machine')}</TableHead>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.screw')}</TableHead>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.totalWeight')}</TableHead>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('common.date')}</TableHead>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.operator')}</TableHead>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.composition')}</TableHead>
                          <TableHead className={t("pages.material-mixing.name.text_right")}>{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batches.map((batch) => {
                          const operator = users.find((u: any) =>{t('pages.material-mixing.u.id_===_batch.operator_id);_return_(')}<TableRow
                              key={batch.id}
                              className={t("pages.material-mixing.name.cursor_pointer_hover_bg_gray_50")}
                              data-testid={`row-batch-${batch.id}`}
                            >
                              <TableCell className={t("pages.material-mixing.name.font_medium")}>
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
                              <TableCell>{parseFloat(batch.total_weight_kg).toFixed(2)} كجم</TableCell>
                              <TableCell>
                                {new Date(batch.created_at).toLocaleDateString("ar-EG")}
                              </TableCell>
                              <TableCell>
                                {operator?.display_name_ar || operator?.display_name || "-"}
                              </TableCell>
                              <TableCell>
                                <div className={t("pages.material-mixing.name.text_sm_space_y_0_5")}>
                                  {batch.composition && batch.composition.length > 0 ? (
                                    batch.composition.map((comp: any, idx: number) => (
                                      <div key={idx} className={t("pages.material-mixing.name.text_xs")}>
                                        <span className={t("pages.material-mixing.name.font_medium")}>{comp.material_name_ar || comp.material_name}</span>
                                        <span className={t("pages.material-mixing.name.text_muted_foreground")}> ({comp.percentage})</span>
                                      </div>{t('pages.material-mixing.))_)_:_(')}<span className={t("pages.material-mixing.name.text_muted_foreground")}>-</span>
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
                                  <Eye className={t("pages.material-mixing.name.h_4_w_4")} />
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
          </div>
        </main>
      </div>

      {/* Batch Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className={t("pages.material-mixing.name.max_w_2xl")} dir="rtl">
          <DialogHeader>
            <DialogTitle>{t('production.batchDetails')}</DialogTitle>
          </DialogHeader>
          {selectedBatch && (
            <div className={t("pages.material-mixing.name.space_y_4")}>
              <div className={t("pages.material-mixing.name.grid_grid_cols_2_gap_4")}>
                <div>
                  <Label className={t("pages.material-mixing.name.text_muted_foreground")}>{t('production.batchNumber')}</Label>
                  <p className={t("pages.material-mixing.name.font_semibold")}>{selectedBatch.batch_number}</p>
                </div>
                <div>
                  <Label className={t("pages.material-mixing.name.text_muted_foreground")}>{t('production.productionOrderNumber')}</Label>
                  <p className={t("pages.material-mixing.name.font_semibold")}>
                    {selectedBatch.production_order_number || `PO-${selectedBatch.production_order_id}`}
                  </p>
                </div>
                <div>
                  <Label className={t("pages.material-mixing.name.text_muted_foreground")}>{t('production.machine')}</Label>
                  <p className={t("pages.material-mixing.name.font_semibold")}>
                    {selectedBatch.machine_name_ar || selectedBatch.machine_name || selectedBatch.machine_id}
                  </p>
                </div>
                <div>
                  <Label className={t("pages.material-mixing.name.text_muted_foreground")}>{t('production.screw')}</Label>
                  <p className={t("pages.material-mixing.name.font_semibold")}>{selectedBatch.screw_assignment}</p>
                </div>
                <div>
                  <Label className={t("pages.material-mixing.name.text_muted_foreground")}>{t('production.totalWeight')}</Label>
                  <p className={t("pages.material-mixing.name.font_semibold")}>{parseFloat(selectedBatch.total_weight_kg).toFixed(2)} {t('warehouse.kg')}</p>
                </div>
                <div>
                  <Label className={t("pages.material-mixing.name.text_muted_foreground")}>{t('common.date')}</Label>
                  <p className={t("pages.material-mixing.name.font_semibold")}>
                    {new Date(selectedBatch.created_at).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>

              {selectedBatch.ingredients && selectedBatch.ingredients.length >{t('pages.material-mixing.0_&&_(')}<div className={t("pages.material-mixing.name.space_y_2")}>
                  <Label className={t("pages.material-mixing.name.text_lg_font_semibold")}>{t('production.ingredients')}</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={t("pages.material-mixing.name.text_right")}>{t('warehouse.item')}</TableHead>
                        <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.materialWeight')} ({t('warehouse.kg')})</TableHead>
                        <TableHead className={t("pages.material-mixing.name.text_right")}>{t('production.percentage')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBatch.ingredients.map((ingredient, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {ingredient.item_name_ar || ingredient.item_name || ingredient.item_id}
                          </TableCell>
                          <TableCell>{parseFloat(ingredient.actual_weight_kg).toFixed(2)}</TableCell>
                          <TableCell>{parseFloat(ingredient.percentage).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedBatch.notes && (
                <div className={t("pages.material-mixing.name.space_y_2")}>
                  <Label className={t("pages.material-mixing.name.text_muted_foreground")}>{t('common.notes')}</Label>
                  <p className={t("pages.material-mixing.name.text_sm")}>{selectedBatch.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
