import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../hooks/use-toast";
import { Beaker, Plus, Trash2, Edit, CheckCircle2, Package, X, Copy, Eye, Search, Filter } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

type MixingFormula = {
  id: number;
  formula_name: string;
  machine_id: string;
  machine_name?: string;
  machine_name_ar?: string;
  screw_type?: string;
  width_min: string;
  width_max: string;
  thickness_min: string;
  thickness_max: string;
  master_batch_colors: string[];
  screw_assignment?: string;
  is_active: boolean;
  created_by?: number;
  created_at?: string;
  notes?: string;
  ingredients?: FormulaIngredient[];
};

type FormulaIngredient = {
  id: number;
  formula_id: number;
  item_id: number;
  item_name?: string;
  item_name_ar?: string;
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
  started_at: string;
  completed_at?: string;
  notes?: string;
  ingredients?: BatchIngredient[];
};

type BatchIngredient = {
  id: number;
  batch_id: number;
  item_id: number;
  item_name?: string;
  item_name_ar?: string;
  planned_weight_kg: string;
  actual_weight_kg?: string;
  variance_kg?: string;
  notes?: string;
};

type Item = {
  id: number;
  name: string;
  name_ar: string;
  category_id: string;
  status?: string;
  code?: string;
};

export default function MaterialMixing() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("formulas");
  const [isFormulaDialogOpen, setIsFormulaDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<MixingFormula | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editingFormula, setEditingFormula] = useState<MixingFormula | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyingFormula, setCopyingFormula] = useState<MixingFormula | null>(null);
  
  // البحث والفلترة
  const [searchTerm, setSearchTerm] = useState("");
  const [machineFilter, setMachineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // تصفية الأصناف للحصول على المواد الخام من فئة CAT10 فقط
  const rawMaterialItems = items.filter((item: any) => item.category_id === "CAT10");

  // فلترة الوصفات
  const filteredFormulas = formulas?.filter((formula) => {
    const matchesSearch = searchTerm === "" || 
      formula.formula_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (formula.machine_name_ar && formula.machine_name_ar.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMachine = machineFilter === "" || formula.machine_id === machineFilter;
    const matchesStatus = statusFilter === "" || 
      (statusFilter === "active" && formula.is_active) ||
      (statusFilter === "inactive" && !formula.is_active);
    
    return matchesSearch && matchesMachine && matchesStatus;
  }) || [];

  // دالة للتبديل بين توسيع الصفوف
  const toggleRowExpansion = (formulaId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(formulaId)) {
        newSet.delete(formulaId);
      } else {
        newSet.add(formulaId);
      }
      return newSet;
    });
  };

  // دالة لنسخ الوصفة
  const handleCopyFormula = (formula: MixingFormula) => {
    setCopyingFormula(formula);
    setCopyDialogOpen(true);
  };

  // دالة لتحرير الوصفة
  const handleEditFormula = (formula: MixingFormula) => {
    setSelectedFormula(formula);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar />
        <MobileNav />

        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4" dir="rtl">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Beaker className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">نظام خلط المواد</h1>
                <p className="text-gray-600">
                  إدارة وصفات الخلط وعمليات الخلط الفعلية
                </p>
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة وصفة خلط جديدة</DialogTitle>
                  </DialogHeader>
                  <FormulaForm
                    machines={machines || []}
                    items={rawMaterialItems}
                    onSuccess={() => {
                      setIsFormulaDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["/api/mixing-formulas"] });
                    }}
                  />
                </DialogContent>
              </Dialog>

              {/* dialog تحرير الوصفة */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>تحرير وصفة الخلط</DialogTitle>
                  </DialogHeader>
                  {selectedFormula && (
                    <EditFormulaForm
                      formula={selectedFormula}
                      machines={machines || []}
                      items={rawMaterialItems}
                      onSuccess={() => {
                        setIsEditDialogOpen(false);
                        setSelectedFormula(null);
                        queryClient.invalidateQueries({ queryKey: ["/api/mixing-formulas"] });
                      }}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* شريط البحث والفلترة */}
              <div className="mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="البحث في الوصفات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={machineFilter} onValueChange={setMachineFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="فلترة حسب الماكينة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الماكينات</SelectItem>
                      {machines
                        ?.filter((m: any) => m.section_id === "extruder" || m.type === "extruder")
                        .map((machine: any) => (
                          <SelectItem key={machine.id} value={machine.id}>
                            {machine.name_ar || machine.name || machine.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="فلترة حسب الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setMachineFilter("");
                        setStatusFilter("");
                      }}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      مسح الفلاتر
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  عرض {filteredFormulas.length} من أصل {formulas?.length || 0} وصفة
                </div>
              </div>

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
                        <TableHead className="text-right">المقاس (سم)</TableHead>
                        <TableHead className="text-right">السماكة (ميكرون)</TableHead>
                        <TableHead className="text-right">المكونات</TableHead>
                        <TableHead className="text-right">الألوان</TableHead>
                        <TableHead className="text-right">السكرو</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFormulas.map((formula: any) => (
                        <>
                          <TableRow key={formula.id} data-testid={`row-formula-${formula.id}`}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpansion(formula.id)}
                                  className="p-1 h-6 w-6"
                                >
                                  {expandedRows.has(formula.id) ? "−" : "+"}
                                </Button>
                                {formula.formula_name}
                              </div>
                            </TableCell>
                            <TableCell>{formula.machine_name_ar || formula.machine_id}</TableCell>
                            <TableCell>
                              {formula.width_min} - {formula.width_max}
                            </TableCell>
                            <TableCell>
                              {formula.thickness_min} - {formula.thickness_max}
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-sm">
                                      <Package className="h-4 w-4" />
                                      {formula.ingredients?.length || 0} مكون
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      {formula.ingredients?.map((ing: any) => (
                                        <div key={ing.id} className="text-xs">
                                          {ing.item_name_ar || ing.item_name}: {ing.percentage}%
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {formula.master_batch_colors?.map((color: any, idx: any) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                  {color}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formula.screw_assignment ? (
                              <Badge variant="secondary">{formula.screw_assignment}</Badge>
                            ) : (
                              "-"
                            )}
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
                                onClick={() => {
                                  setEditingFormula(formula);
                                  setEditDialogOpen(true);
                                }}
                                data-testid={`button-edit-formula-${formula.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCopyFormula(formula)}
                                data-testid={`button-copy-formula-${formula.id}`}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRowExpansion(formula.id)}
                                data-testid={`button-expand-formula-${formula.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* صف التفاصيل القابل للتوسيع */}
                        {expandedRows.has(formula.id) && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-gray-50 p-4">
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm text-gray-900">تفاصيل المكونات:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {formula.ingredients?.map((ingredient: any) => (
                                    <div key={ingredient.id} className="bg-white p-3 rounded border">
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">
                                          {ingredient.item_name_ar || ingredient.item_name}
                                        </span>
                                        <Badge variant="outline">
                                          {ingredient.percentage}%
                                        </Badge>
                                      </div>
                                      {ingredient.notes && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          {ingredient.notes}
                                        </p>
                                      )}
                                    </div>
                                  )) || (
                                    <div className="text-sm text-gray-500 col-span-2">
                                      لا توجد مكونات محددة
                                    </div>
                                  )}
                                </div>
                                {formula.notes && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded">
                                    <h5 className="font-medium text-sm text-blue-900 mb-2">ملاحظات:</h5>
                                    <p className="text-sm text-blue-800">{formula.notes}</p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        </>
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
                            {new Date(batch.started_at).toLocaleDateString("ar-EG")}
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

      {/* حوار تحرير الوصفة */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تحرير الوصفة</DialogTitle>
          </DialogHeader>
          {editingFormula && (
            <EditFormulaForm
              formula={editingFormula}
              machines={machines?.data || []}
              items={items?.data || []}
              onSuccess={() => {
                setEditDialogOpen(false);
                setEditingFormula(null);
                queryClient.invalidateQueries({ queryKey: ["mixing-formulas"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* حوار نسخ الوصفة */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>نسخ الوصفة</DialogTitle>
          </DialogHeader>
          {copyingFormula && (
            <CopyFormulaForm
              originalFormula={copyingFormula}
              machines={machines?.data || []}
              items={items?.data || []}
              onSuccess={() => {
                setCopyDialogOpen(false);
                setCopyingFormula(null);
                queryClient.invalidateQueries({ queryKey: ["mixing-formulas"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// قائمة ألوان الماستر باتش الشائعة
const MASTER_BATCH_COLORS = [
  "أبيض",
  "أسود",
  "أحمر",
  "أزرق",
  "أخضر",
  "أصفر",
  "برتقالي",
  "بني",
  "رمادي",
  "شفاف",
];

function FormulaForm({
  machines,
  items,
  onSuccess,
}: {
  machines: any[];
  items: Item[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    formula_name: "",
    machine_id: "",
    thickness_min: "",
    thickness_max: "",
    width_min: "",
    width_max: "",
    screw_assignment: "",
    notes: "",
  });
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<{ item_id: number; percentage: string }[]>([]);

  const selectedMachine = machines.find((m) => m.id === formData.machine_id);
  const isABAMachine = selectedMachine?.screw_type === "ABA";

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

  const updateFormula = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest(`/api/mixing-formulas/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث الوصفة بنجاح",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الوصفة",
        variant: "destructive",
      });
    },
  });

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { item_id: 0, percentage: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - check all ingredients have valid item_id
    const invalidIngredients = ingredients.filter(
      (ing) => !ing.item_id || Number(ing.item_id) === 0
    );
    if (invalidIngredients.length > 0) {
      toast({
        title: "خطأ في التحقق",
        description: "يجب اختيار صنف لجميع المكونات",
        variant: "destructive",
      });
      return;
    }

    // Validation - check all ingredients have percentage
    const missingPercentage = ingredients.filter(
      (ing) => !ing.percentage || parseFloat(ing.percentage) <= 0
    );
    if (missingPercentage.length > 0) {
      toast({
        title: "خطأ في التحقق",
        description: "يجب إدخال نسبة صحيحة لجميع المكونات",
        variant: "destructive",
      });
      return;
    }

    // Validation - check total percentage equals 100%
    const totalPercentage = ingredients.reduce(
      (sum, ing) => sum + (parseFloat(ing.percentage) || 0),
      0
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast({
        title: "خطأ في التحقق",
        description: "يجب أن يكون مجموع نسب المكونات 100%",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formData,
      master_batch_colors: selectedColors,
      screw_assignment: isABAMachine ? formData.screw_assignment : null,
      ingredients: ingredients.map((ing) => ({
        item_id: Number(ing.item_id),
        percentage: ing.percentage,
      })),
    };

    createFormula.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {/* المعلومات الأساسية */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg border-b pb-2">المعلومات الأساسية</h3>
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
            <Label htmlFor="machine_id">ماكينة الفيلم *</Label>
            <Select
              value={formData.machine_id}
              onValueChange={(value) =>
                setFormData({ ...formData, machine_id: value, screw_assignment: "" })
              }
            >
              <SelectTrigger data-testid="select-machine">
                <SelectValue placeholder="اختر الماكينة" />
              </SelectTrigger>
              <SelectContent>
                {machines
                  ?.filter((m) => m.section_id === "extruder" || m.type === "extruder")
                  .map((machine: any) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name_ar || machine.name || machine.id}
                      {machine.screw_type === "ABA" && " (ABA - سكروين)"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {isABAMachine && (
            <div className="space-y-2">
              <Label htmlFor="screw_assignment">السكرو المخصص *</Label>
              <Select
                value={formData.screw_assignment}
                onValueChange={(value) =>
                  setFormData({ ...formData, screw_assignment: value })
                }
              >
                <SelectTrigger data-testid="select-screw">
                  <SelectValue placeholder="اختر السكرو" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">سكرو A</SelectItem>
                  <SelectItem value="B">سكرو B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* نطاق المقاس والسماكة */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg border-b pb-2">المواصفات الفنية</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="width_min">الحد الأدنى للمقاس (سم) *</Label>
            <Input
              id="width_min"
              type="number"
              step="0.01"
              value={formData.width_min}
              onChange={(e) =>
                setFormData({ ...formData, width_min: e.target.value })
              }
              required
              data-testid="input-width-min"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width_max">الحد الأقصى للمقاس (سم) *</Label>
            <Input
              id="width_max"
              type="number"
              step="0.01"
              value={formData.width_max}
              onChange={(e) =>
                setFormData({ ...formData, width_max: e.target.value })
              }
              required
              data-testid="input-width-max"
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
        </div>
      </div>

      {/* ألوان الماستر باتش */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg border-b pb-2">ألوان الماستر باتش</h3>
        <div className="grid grid-cols-3 gap-3">
          {MASTER_BATCH_COLORS.map((color) => (
            <div
              key={color}
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Checkbox
                id={`color-${color}`}
                checked={selectedColors.includes(color)}
                onCheckedChange={() => handleColorToggle(color)}
                data-testid={`checkbox-color-${color}`}
              />
              <Label
                htmlFor={`color-${color}`}
                className="text-sm font-normal cursor-pointer"
              >
                {color}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* المكونات */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-medium text-lg">المكونات (مجموع النسب = 100%)</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addIngredient}
            data-testid="button-add-ingredient"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مكون
          </Button>
        </div>

        {ingredients.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4 border rounded-lg bg-muted/30">
            لم يتم إضافة مكونات بعد. انقر على "إضافة مكون" للبدء
          </div>
        ) : (
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label>المادة الخام *</Label>
                  <Select
                    value={ingredient.item_id.toString()}
                    onValueChange={(value) =>
                      updateIngredient(index, "item_id", Number(value))
                    }
                  >
                    <SelectTrigger data-testid={`select-ingredient-item-${index}`}>
                      <SelectValue placeholder="اختر المادة الخام" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name_ar || item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-32 space-y-2">
                  <Label>النسبة (%) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={ingredient.percentage}
                    onChange={(e) =>
                      updateIngredient(index, "percentage", e.target.value)
                    }
                    required
                    data-testid={`input-ingredient-percentage-${index}`}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(index)}
                  data-testid={`button-remove-ingredient-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              المجموع الحالي:{" "}
              <span className="font-medium">
                {ingredients
                  .reduce((sum, ing) => sum + (parseFloat(ing.percentage) || 0), 0)
                  .toFixed(2)}
                %
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ملاحظات */}
      <div className="space-y-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          data-testid="input-notes"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="submit"
          disabled={createFormula.isPending || ingredients.length === 0}
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

// مكون تحرير الوصفة
function EditFormulaForm({
  formula,
  machines,
  items,
  onSuccess,
}: {
  formula: MixingFormula;
  machines: any[];
  items: Item[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    formula_name: formula.formula_name,
    machine_id: formula.machine_id,
    width_min: formula.width_min,
    width_max: formula.width_max,
    thickness_min: formula.thickness_min,
    thickness_max: formula.thickness_max,
    screw_assignment: formula.screw_assignment || "",
    notes: formula.notes || "",
    is_active: formula.is_active,
  });
  const [ingredients, setIngredients] = useState<{ item_id: number; percentage: string }[]>(
    formula.ingredients?.map((ing: any) => ({
      item_id: ing.item_id,
      percentage: ing.percentage,
    })) || []
  );

  const updateFormula = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(`/api/mixing-formulas/${formula.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث الوصفة بنجاح",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الوصفة",
        variant: "destructive",
      });
    },
  });

  const addIngredient = () => {
    setIngredients([...ingredients, { item_id: 0, percentage: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_: any, i: any) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    // التحقق من صحة النسب
    const totalPercentage = ingredients.reduce(
      (sum: any, ing: any) => sum + parseFloat(ing.percentage || "0"),
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast({
        title: "خطأ في النسب",
        description: `إجمالي النسب يجب أن يساوي 100%. الإجمالي الحالي: ${totalPercentage.toFixed(2)}%`,
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formData,
      ingredients: ingredients.map((ing: any) => ({
        item_id: Number(ing.item_id),
        percentage: parseFloat(ing.percentage),
      })),
    };

    updateFormula.mutate(payload);
  };

  const getTotalPercentage = () => {
    return ingredients.reduce((sum: any, ing: any) => sum + parseFloat(ing.percentage || "0"), 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div className="space-y-4">
        <h3 className="font-medium text-lg border-b pb-2">تحديث الوصفة</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit_formula_name">اسم الوصفة *</Label>
            <Input
              id="edit_formula_name"
              value={formData.formula_name}
              onChange={(e: any) =>
                setFormData({ ...formData, formula_name: e.target.value })
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_machine_id">الماكينة *</Label>
            <Select
              value={formData.machine_id?.toString()}
              onValueChange={(value: any) =>
                setFormData({ ...formData, machine_id: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الماكينة" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((machine: any) => (
                  <SelectItem key={machine.id} value={machine.id.toString()}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit_width_min">أقل عرض (سم)</Label>
            <Input
              id="edit_width_min"
              type="number"
              step="0.1"
              value={formData.width_min || ""}
              onChange={(e: any) =>
                setFormData({ ...formData, width_min: e.target.value })
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_width_max">أكبر عرض (سم)</Label>
            <Input
              id="edit_width_max"
              type="number"
              step="0.1"
              value={formData.width_max || ""}
              onChange={(e: any) =>
                setFormData({ ...formData, width_max: e.target.value })
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_thickness_min">أقل سمك (مايكرون)</Label>
            <Input
              id="edit_thickness_min"
              type="number"
              step="0.1"
              value={formData.thickness_min || ""}
              onChange={(e: any) =>
                setFormData({ ...formData, thickness_min: e.target.value })
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit_thickness_max">أكبر سمك (مايكرون)</Label>
            <Input
              id="edit_thickness_max"
              type="number"
              step="0.1"
              value={formData.thickness_max || ""}
              onChange={(e: any) =>
                setFormData({ ...formData, thickness_max: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit_screw_assignment">تخصيص البراغي</Label>
            <Input
              id="edit_screw_assignment"
              value={formData.screw_assignment}
              onChange={(e: any) =>
                setFormData({ ...formData, screw_assignment: e.target.value })
              }
              placeholder="مثل: A+B, A+C, إلخ"
            />
          </div>
          
          <div className="space-y-2 flex items-center gap-2 pt-6">
            <Checkbox
              id="edit_is_active"
              checked={formData.is_active}
              onCheckedChange={(checked: any) =>
                setFormData({ ...formData, is_active: !!checked })
              }
            />
            <Label htmlFor="edit_is_active">وصفة نشطة</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit_notes">ملاحظات</Label>
          <Textarea
            id="edit_notes"
            value={formData.notes}
            onChange={(e: any) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="min-h-[60px]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">المكونات</h4>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${Math.abs(getTotalPercentage() - 100) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
              الإجمالي: {getTotalPercentage().toFixed(2)}%
            </span>
            <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة مكون
            </Button>
          </div>
        </div>

        {ingredients.map((ingredient: any, index: any) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6 space-y-1">
              <Label>المادة الخام</Label>
              <Select
                value={ingredient.item_id?.toString() || ""}
                onValueChange={(value: any) =>
                  updateIngredient(index, "item_id", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter((item: any) => item.item_type === "raw_material")
                    .map((item: any) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-4 space-y-1">
              <Label>النسبة المئوية</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={ingredient.percentage}
                onChange={(e: any) =>
                  updateIngredient(index, "percentage", e.target.value)
                }
                placeholder="0.00"
              />
            </div>
            
            <div className="col-span-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeIngredient(index)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="submit" disabled={updateFormula.isPending}>
          {updateFormula.isPending ? "جاري التحديث..." : "تحديث الوصفة"}
        </Button>
      </div>
    </form>
  );
}

// مكون نسخ الوصفة مع إمكانية التعديل
function CopyFormulaForm({
  originalFormula,
  machines,
  items,
  onSuccess,
}: {
  originalFormula: MixingFormula;
  machines: any[];
  items: Item[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    formula_name: `نسخة من ${originalFormula.formula_name}`,
    machine_id: originalFormula.machine_id,
    width_min: originalFormula.width_min,
    width_max: originalFormula.width_max,
    thickness_min: originalFormula.thickness_min,
    thickness_max: originalFormula.thickness_max,
    screw_assignment: originalFormula.screw_assignment || "",
    notes: originalFormula.notes || "",
    is_active: true, // الوصفة المنسوخة تكون نشطة افتراضياً
  });
  const [ingredients, setIngredients] = useState<{ item_id: number; percentage: string }[]>(
    originalFormula.ingredients?.map((ing: any) => ({
      item_id: ing.item_id,
      percentage: ing.percentage,
    })) || []
  );

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
        title: "تم النسخ",
        description: "تم نسخ الوصفة بنجاح",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في نسخ الوصفة",
        variant: "destructive",
      });
    },
  });

  const addIngredient = () => {
    setIngredients([...ingredients, { item_id: 0, percentage: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_: any, i: any) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    // التحقق من صحة النسب
    const totalPercentage = ingredients.reduce(
      (sum: any, ing: any) => sum + parseFloat(ing.percentage || "0"),
      0
    );

    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast({
        title: "خطأ في النسب",
        description: `إجمالي النسب يجب أن يساوي 100%. الإجمالي الحالي: ${totalPercentage.toFixed(2)}%`,
        variant: "destructive",
      });
      return;
    }

    // التحقق من أن اسم الوصفة مختلف عن الأصلية
    if (formData.formula_name.trim() === originalFormula.formula_name.trim()) {
      toast({
        title: "خطأ في الاسم",
        description: "يجب أن يكون اسم الوصفة المنسوخة مختلفاً عن الوصفة الأصلية",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formData,
      ingredients: ingredients.map((ing: any) => ({
        item_id: Number(ing.item_id),
        percentage: parseFloat(ing.percentage),
      })),
    };

    createFormula.mutate(payload);
  };

  const getTotalPercentage = () => {
    return ingredients.reduce((sum: any, ing: any) => sum + parseFloat(ing.percentage || "0"), 0);
  };

  const copyOriginalPercentages = () => {
    if (originalFormula.ingredients) {
      setIngredients(
        originalFormula.ingredients.map((ing: any) => ({
          item_id: ing.item_id,
          percentage: ing.percentage,
        }))
      );
      toast({
        title: "تم النسخ",
        description: "تم نسخ النسب الأصلية",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-lg border-b pb-2">نسخ الوصفة</h3>
          <div className="text-sm text-gray-500">
            نسخ من: <span className="font-medium">{originalFormula.formula_name}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="copy_formula_name">اسم الوصفة الجديدة *</Label>
            <Input
              id="copy_formula_name"
              value={formData.formula_name}
              onChange={(e: any) =>
                setFormData({ ...formData, formula_name: e.target.value })
              }
              required
              placeholder="أدخل اسم الوصفة الجديدة"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="copy_machine_id">الماكينة *</Label>
            <Select
              value={formData.machine_id?.toString()}
              onValueChange={(value: any) =>
                setFormData({ ...formData, machine_id: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الماكينة" />
              </SelectTrigger>
              <SelectContent>
                {machines.map((machine: any) => (
                  <SelectItem key={machine.id} value={machine.id.toString()}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="copy_notes">ملاحظات</Label>
          <Textarea
            id="copy_notes"
            value={formData.notes}
            onChange={(e: any) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="min-h-[60px]"
            placeholder="أي ملاحظات إضافية..."
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">المكونات</h4>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${Math.abs(getTotalPercentage() - 100) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
              الإجمالي: {getTotalPercentage().toFixed(2)}%
            </span>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={copyOriginalPercentages}
            >
              <Copy className="h-4 w-4 ml-1" />
              نسخ النسب الأصلية
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة مكون
            </Button>
          </div>
        </div>

        {ingredients.map((ingredient: any, index: any) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6 space-y-1">
              <Label>المادة الخام</Label>
              <Select
                value={ingredient.item_id?.toString() || ""}
                onValueChange={(value: any) =>
                  updateIngredient(index, "item_id", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {items
                    .filter((item: any) => item.item_type === "raw_material")
                    .map((item: any) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-4 space-y-1">
              <Label>النسبة المئوية</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={ingredient.percentage}
                onChange={(e: any) =>
                  updateIngredient(index, "percentage", e.target.value)
                }
                placeholder="0.00"
              />
            </div>
            
            <div className="col-span-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeIngredient(index)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {originalFormula.ingredients && originalFormula.ingredients.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <h5 className="font-medium text-sm text-blue-900 mb-2">المكونات الأصلية:</h5>
            <div className="text-sm space-y-1">
              {originalFormula.ingredients.map((ing: any, idx: any) => (
                <div key={idx} className="flex justify-between">
                  <span>{ing.item_name}</span>
                  <span className="font-medium">{ing.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => {
            // إعادة تعيين النموذج للوصفة الأصلية
            setFormData({
              formula_name: `نسخة من ${originalFormula.formula_name}`,
              machine_id: originalFormula.machine_id,
              width_min: originalFormula.width_min,
              width_max: originalFormula.width_max,
              thickness_min: originalFormula.thickness_min,
              thickness_max: originalFormula.thickness_max,
              screw_assignment: originalFormula.screw_assignment || "",
              notes: originalFormula.notes || "",
              is_active: true,
            });
            copyOriginalPercentages();
          }}
        >
          إعادة تعيين
        </Button>
        <Button type="submit" disabled={createFormula.isPending}>
          {createFormula.isPending ? "جاري الحفظ..." : "حفظ الوصفة المنسوخة"}
        </Button>
      </div>
    </form>
  );
}
