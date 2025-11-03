import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { Beaker, Plus, Trash2, Edit, CheckCircle2, Package } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

type MixingFormula = {
  id: number;
  formula_name: string;
  machine_id: string;
  raw_material: string;
  thickness_min: string;
  thickness_max: string;
  width_min?: string;
  width_max?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  ingredients?: FormulaIngredient[];
};

type FormulaIngredient = {
  id: number;
  formula_id: number;
  raw_material_name: string;
  percentage: string;
  notes?: string;
};

type MixingBatch = {
  id: number;
  batch_number: string;
  formula_id: number;
  production_order_id?: number;
  roll_id?: number;
  machine_id: string;
  operator_id: number;
  status: string;
  total_weight_kg: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  ingredients?: BatchIngredient[];
};

type BatchIngredient = {
  id: number;
  batch_id: number;
  raw_material_name: string;
  planned_weight_kg: string;
  actual_weight_kg?: string;
  variance_kg?: string;
  notes?: string;
};

export default function MaterialMixing() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("formulas");
  const [isFormulaDialogOpen, setIsFormulaDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  // جلب البيانات
  const { data: formulas, isLoading: formulasLoading } = useQuery<MixingFormula[]>({
    queryKey: ["/api/mixing-formulas"],
  });

  const { data: batches, isLoading: batchesLoading } = useQuery<MixingBatch[]>({
    queryKey: ["/api/mixing-batches"],
  });

  const { data: machines = [] } = useQuery<any[]>({
    queryKey: ["/api/machines"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: productionOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/production-orders"],
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Beaker className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">نظام خلط المواد</h1>
                  <p className="text-muted-foreground">
                    إدارة وصفات الخلط وعمليات الخلط الفعلية
                  </p>
                </div>
              </div>
            </div>
          </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="formulas" className="gap-2" data-testid="tab-formulas">
            <Beaker className="h-4 w-4" />
            وصفات الخلط
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-2" data-testid="tab-batches">
            <Package className="h-4 w-4" />
            دفعات الخلط
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formulas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>وصفات الخلط</CardTitle>
              <Dialog open={isFormulaDialogOpen} onOpenChange={setIsFormulaDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-add-formula">
                    <Plus className="h-4 w-4" />
                    إضافة وصفة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة وصفة خلط جديدة</DialogTitle>
                  </DialogHeader>
                  <FormulaForm
                    machines={machines || []}
                    onSuccess={() => {
                      setIsFormulaDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["/api/mixing-formulas"] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {formulasLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : formulas && formulas.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم الوصفة</TableHead>
                        <TableHead className="text-right">الماكينة</TableHead>
                        <TableHead className="text-right">المادة الخام</TableHead>
                        <TableHead className="text-right">السماكة (ميكرون)</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formulas.map((formula) => (
                        <TableRow key={formula.id} data-testid={`row-formula-${formula.id}`}>
                          <TableCell className="font-medium">
                            {formula.formula_name}
                          </TableCell>
                          <TableCell>{formula.machine_id}</TableCell>
                          <TableCell>{formula.raw_material}</TableCell>
                          <TableCell>
                            {formula.thickness_min} - {formula.thickness_max}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={formula.is_active ? "default" : "secondary"}
                            >
                              {formula.is_active ? "نشط" : "غير نشط"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-view-formula-${formula.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Beaker className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    لا توجد وصفات خلط حالياً
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    قم بإضافة وصفة جديدة للبدء
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>دفعات الخلط</CardTitle>
              <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-add-batch">
                    <Plus className="h-4 w-4" />
                    إضافة دفعة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة دفعة خلط جديدة</DialogTitle>
                  </DialogHeader>
                  <BatchForm
                    formulas={formulas || []}
                    machines={machines || []}
                    users={users || []}
                    productionOrders={productionOrders || []}
                    onSuccess={() => {
                      setIsBatchDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["/api/mixing-batches"] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : batches && batches.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الدفعة</TableHead>
                        <TableHead className="text-right">الماكينة</TableHead>
                        <TableHead className="text-right">الوزن الكلي (كجم)</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ البدء</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch) => (
                        <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`}>
                          <TableCell className="font-medium">
                            {batch.batch_number}
                          </TableCell>
                          <TableCell>{batch.machine_id}</TableCell>
                          <TableCell>
                            {parseFloat(batch.total_weight_kg).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                batch.status === "completed"
                                  ? "default"
                                  : batch.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {batch.status === "completed"
                                ? "مكتمل"
                                : batch.status === "in_progress"
                                ? "قيد التنفيذ"
                                : "معلق"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(batch.start_time).toLocaleDateString("ar-EG")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {batch.status !== "completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-complete-batch-${batch.id}`}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    لا توجد دفعات خلط حالياً
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    قم بإضافة دفعة جديدة للبدء
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </main>
      </div>
    </div>
  );
}

function FormulaForm({
  machines,
  onSuccess,
}: {
  machines: any[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    formula_name: "",
    machine_id: "",
    raw_material: "",
    thickness_min: "",
    thickness_max: "",
    width_min: "",
    width_max: "",
  });

  const createFormula = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/mixing-formulas", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم إضافة الوصفة بنجاح",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الوصفة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFormula.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="formula_name">اسم الوصفة *</Label>
          <Input
            id="formula_name"
            value={formData.formula_name}
            onChange={(e) =>
              setFormData({ ...formData, formula_name: e.target.value })
            }
            required
            data-testid="input-formula-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="machine_id">الماكينة *</Label>
          <Select
            value={formData.machine_id}
            onValueChange={(value) =>
              setFormData({ ...formData, machine_id: value })
            }
          >
            <SelectTrigger data-testid="select-machine">
              <SelectValue placeholder="اختر الماكينة" />
            </SelectTrigger>
            <SelectContent>
              {machines?.map((machine: any) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name || machine.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="raw_material">المادة الخام الأساسية *</Label>
          <Input
            id="raw_material"
            value={formData.raw_material}
            onChange={(e) =>
              setFormData({ ...formData, raw_material: e.target.value })
            }
            required
            data-testid="input-raw-material"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thickness_min">الحد الأدنى للسماكة (ميكرون) *</Label>
          <Input
            id="thickness_min"
            type="number"
            step="0.01"
            value={formData.thickness_min}
            onChange={(e) =>
              setFormData({ ...formData, thickness_min: e.target.value })
            }
            required
            data-testid="input-thickness-min"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="thickness_max">الحد الأقصى للسماكة (ميكرون) *</Label>
          <Input
            id="thickness_max"
            type="number"
            step="0.01"
            value={formData.thickness_max}
            onChange={(e) =>
              setFormData({ ...formData, thickness_max: e.target.value })
            }
            required
            data-testid="input-thickness-max"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width_min">الحد الأدنى للعرض (سم)</Label>
          <Input
            id="width_min"
            type="number"
            step="0.01"
            value={formData.width_min}
            onChange={(e) =>
              setFormData({ ...formData, width_min: e.target.value })
            }
            data-testid="input-width-min"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width_max">الحد الأقصى للعرض (سم)</Label>
          <Input
            id="width_max"
            type="number"
            step="0.01"
            value={formData.width_max}
            onChange={(e) =>
              setFormData({ ...formData, width_max: e.target.value })
            }
            data-testid="input-width-max"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={createFormula.isPending}
          data-testid="button-save-formula"
        >
          {createFormula.isPending ? "جاري الحفظ..." : "حفظ الوصفة"}
        </Button>
      </div>
    </form>
  );
}

function BatchForm({
  formulas,
  machines,
  users,
  productionOrders,
  onSuccess,
}: {
  formulas: MixingFormula[];
  machines: any[];
  users: any[];
  productionOrders: any[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    batch_number: "",
    formula_id: "",
    machine_id: "",
    operator_id: "",
    production_order_id: "",
    total_weight_kg: "",
    notes: "",
  });

  const createBatch = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/mixing-batches", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم إضافة الدفعة بنجاح",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الدفعة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBatch.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="batch_number">رقم الدفعة *</Label>
          <Input
            id="batch_number"
            value={formData.batch_number}
            onChange={(e) =>
              setFormData({ ...formData, batch_number: e.target.value })
            }
            required
            data-testid="input-batch-number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="formula_id">الوصفة *</Label>
          <Select
            value={formData.formula_id}
            onValueChange={(value) =>
              setFormData({ ...formData, formula_id: value })
            }
          >
            <SelectTrigger data-testid="select-formula">
              <SelectValue placeholder="اختر الوصفة" />
            </SelectTrigger>
            <SelectContent>
              {formulas?.map((formula) => (
                <SelectItem key={formula.id} value={formula.id.toString()}>
                  {formula.formula_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="machine_id">الماكينة *</Label>
          <Select
            value={formData.machine_id}
            onValueChange={(value) =>
              setFormData({ ...formData, machine_id: value })
            }
          >
            <SelectTrigger data-testid="select-machine">
              <SelectValue placeholder="اختر الماكينة" />
            </SelectTrigger>
            <SelectContent>
              {machines?.map((machine: any) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name || machine.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operator_id">العامل *</Label>
          <Select
            value={formData.operator_id}
            onValueChange={(value) =>
              setFormData({ ...formData, operator_id: value })
            }
          >
            <SelectTrigger data-testid="select-operator">
              <SelectValue placeholder="اختر العامل" />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user: any) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.display_name_ar || user.display_name || user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="production_order_id">أمر الإنتاج (اختياري)</Label>
          <Select
            value={formData.production_order_id}
            onValueChange={(value) =>
              setFormData({ ...formData, production_order_id: value })
            }
          >
            <SelectTrigger data-testid="select-production-order">
              <SelectValue placeholder="اختر أمر الإنتاج" />
            </SelectTrigger>
            <SelectContent>
              {productionOrders?.map((order: any) => (
                <SelectItem key={order.id} value={order.id.toString()}>
                  {order.job_order_number || `أمر #${order.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_weight_kg">الوزن الكلي (كجم) *</Label>
          <Input
            id="total_weight_kg"
            type="number"
            step="0.01"
            value={formData.total_weight_kg}
            onChange={(e) =>
              setFormData({ ...formData, total_weight_kg: e.target.value })
            }
            required
            data-testid="input-total-weight"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">ملاحظات</Label>
          <Input
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            data-testid="input-notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={createBatch.isPending}
          data-testid="button-save-batch"
        >
          {createBatch.isPending ? "جاري الحفظ..." : "حفظ الدفعة"}
        </Button>
      </div>
    </form>
  );
}
