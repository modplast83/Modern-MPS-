import { useState } from "react";
import * as React from "react";
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
import { Beaker, Plus, Trash2, Edit, CheckCircle2, Package, X, Copy, Eye, Search, Filter, Calculator, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Target, Activity, PieChart, LineChart, Users, Calendar, DollarSign, Warehouse, ShoppingCart, Clock, AlertCircle } from "lucide-react";
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

type InventoryConsumption = {
  id: number;
  batch_id: number;
  item_id: number;
  quantity_consumed: number;
  cost_at_consumption: number;
  consumed_at: string;
  created_by: number;
};

type InventoryTransaction = {
  id: number;
  item_id: number;
  transaction_type: "in" | "out" | "adjustment";
  quantity: number;
  cost_per_unit?: number;
  reference_type: string;
  reference_id: number;
  notes?: string;
  created_at: string;
  created_by: number;
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
  const [selectedBatch, setSelectedBatch] = useState<MixingBatch | null>(null);
  const [isBatchDetailDialogOpen, setIsBatchDetailDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [selectedBatchForInventory, setSelectedBatchForInventory] = useState<MixingBatch | null>(null);
  
  // البحث والفلترة
  const [searchTerm, setSearchTerm] = useState("");
  const [machineFilter, setMachineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // جلب البيانات
  const { data: formulasData, isLoading: formulasLoading } = useQuery<{ data: MixingFormula[] }>({
    queryKey: ["/api/mixing-formulas"],
  });
  const formulas = formulasData?.data || [];

  const { data: batchesData, isLoading: batchesLoading } = useQuery<{ data: MixingBatch[] }>({
    queryKey: ["/api/mixing-batches"],
  });
  const batches = batchesData?.data || [];

  const { data: machines, isLoading: machinesLoading } = useQuery<any[]>({
    queryKey: ["/api/machines"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: productionOrders } = useQuery<any[]>({
    queryKey: ["/api/production-orders"],
  });

  const { data: items, isLoading: itemsLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // جلب بيانات المخزون للحصول على الأسعار
  const { data: inventory } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  // جلب معاملات المخزون
  const { data: inventoryTransactionsData } = useQuery<{ data: InventoryTransaction[] }>({
    queryKey: ["/api/inventory-transactions"],
    enabled: false, // تعطيل مؤقتاً لأن الـ endpoint غير موجود بعد
  });
  const inventoryTransactions = inventoryTransactionsData?.data || [];

  // تصفية الأصناف للحصول على المواد الخام من فئة CAT10 فقط
  const rawMaterialItems = items?.filter((item: any) => item.category_id === "CAT10") || [];

  // فلترة الدفعات
  const filteredBatches = batches?.filter(batch => {
    const variance = analyzeBatchVariance(batch);
    const formula = formulas?.find(f => f.id === batch.formula_id);
    
    // فلترة البحث
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const batchMatch = batch.batch_number.toLowerCase().includes(searchLower);
      const formulaMatch = formula?.formula_name.toLowerCase().includes(searchLower);
      if (!batchMatch && !formulaMatch) return false;
    }
    
    // فلترة الحالة
    if (statusFilter && batch.status !== statusFilter) return false;
    
    // فلترة الماكينة
    if (machineFilter && batch.machine_id !== machineFilter) return false;
    
    return true;
  }) || [];

  // دالة حساب التكلفة التقديرية للوصفة
  const calculateFormulaCost = (formula: MixingFormula, weightKg: number = 1) => {
    if (!formula.ingredients || formula.ingredients.length === 0) return null;
    
    let totalCost = 0;
    let missingPrices = 0;
    
    formula.ingredients.forEach((ingredient: any) => {
      const inventoryItem = inventory?.find((inv: any) => inv.item_id === ingredient.item_id);
      const costPerUnit = inventoryItem?.cost_per_unit;
      
      if (costPerUnit && parseFloat(costPerUnit) > 0) {
        const ingredientWeight = (weightKg * parseFloat(ingredient.percentage)) / 100;
        totalCost += ingredientWeight * parseFloat(costPerUnit);
      } else {
        missingPrices++;
      }
    });
    
    return {
      totalCost: totalCost,
      costPerKg: totalCost / weightKg,
      missingPrices: missingPrices,
      isComplete: missingPrices === 0
    };
  };

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

  // دالة للتحقق من توفر المخزون للدفعة
  const checkInventoryAvailability = (batch: MixingBatch) => {
    const formula = formulas?.find(f => f.id === batch.formula_id);
    if (!formula?.ingredients) return { available: false, shortages: [] };

    const shortages: any[] = [];
    let allAvailable = true;

    formula.ingredients.forEach(ingredient => {
      const requiredWeight = (parseFloat(batch.total_weight_kg) * parseFloat(ingredient.percentage)) / 100;
      const inventoryItem = inventory?.find((inv: any) => inv.item_id === ingredient.item_id);
      const availableQuantity = inventoryItem?.quantity || 0;

      if (availableQuantity < requiredWeight) {
        allAvailable = false;
        shortages.push({
          item_id: ingredient.item_id,
          item_name: ingredient.item_name_ar || ingredient.item_name,
          required: requiredWeight,
          available: availableQuantity,
          shortage: requiredWeight - availableQuantity
        });
      }
    });

    return { available: allAvailable, shortages };
  };

  // دالة تسجيل استهلاك المواد
  const recordMaterialConsumption = useMutation({
    mutationFn: async (data: { batchId: number; consumptions: any[] }) => {
      return apiRequest("/api/inventory/consumption", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تسجيل الاستهلاك",
        description: "تم تحديث المخزون بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الاستهلاك",
        description: error.message || "حدث خطأ أثناء تحديث المخزون",
        variant: "destructive",
      });
    },
  });

  // دالة لعرض تفاصيل استهلاك المخزون للدفعة
  const handleViewInventoryConsumption = (batch: MixingBatch) => {
    setSelectedBatchForInventory(batch);
    setIsInventoryDialogOpen(true);
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="formulas" className="gap-2" data-testid="tab-formulas">
            <Beaker className="h-4 w-4" />
            وصفات الخلط
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-2" data-testid="tab-batches">
            <Package className="h-4 w-4" />
            دفعات الخلط
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2" data-testid="tab-inventory">
            <Warehouse className="h-4 w-4" />
            مراقبة المخزون
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4" />
            التحليلات والتقارير
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
                  {machinesLoading || itemsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
                      </div>
                    </div>
                  ) : (
                    <FormulaForm
                      machines={machines || []}
                      items={rawMaterialItems}
                      onSuccess={() => {
                        setIsFormulaDialogOpen(false);
                        queryClient.invalidateQueries({ queryKey: ["/api/mixing-formulas"] });
                      }}
                    />
                  )}
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
                      inventory={inventory || []}
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
                  <Select value={machineFilter || undefined} onValueChange={setMachineFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الماكينات" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines
                        ?.filter((m: any) => m.type === "extruder")
                        .map((machine: any) => (
                          <SelectItem key={machine.id} value={machine.id}>
                            {machine.name_ar || machine.name || machine.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter || undefined} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الحالات" />
                    </SelectTrigger>
                    <SelectContent>
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
                        <TableHead className="text-right">التكلفة التقديرية</TableHead>
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
                              {(() => {
                                const costData = calculateFormulaCost(formula, 1);
                                if (!costData) {
                                  return <span className="text-gray-400 text-sm">غير محدد</span>;
                                }
                                
                                if (!costData.isComplete) {
                                  return (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 text-amber-600">
                                            <span className="text-sm">
                                              {costData.costPerKg.toFixed(2)} ر.س/كجم
                                            </span>
                                            <span className="text-xs">⚠️</span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs">
                                            تقدير جزئي - {costData.missingPrices} مكون بدون سعر
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                
                                return (
                                  <div className="text-sm font-medium text-green-600">
                                    {costData.costPerKg.toFixed(2)} ر.س/كجم
                                  </div>
                                );
                              })()}
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
                                
                                {/* تفاصيل التكلفة */}
                                {(() => {
                                  const costData = calculateFormulaCost(formula, 1);
                                  if (costData) {
                                    return (
                                      <div className="mt-4 p-3 bg-green-50 rounded">
                                        <h5 className="font-medium text-sm text-green-900 mb-2">تحليل التكلفة التقديرية (لكل كيلوجرام):</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <div className="text-sm">
                                              <span className="font-medium">التكلفة الإجمالية: </span>
                                              <span className="text-green-700">{costData.costPerKg.toFixed(2)} ر.س/كجم</span>
                                            </div>
                                            {!costData.isComplete && (
                                              <div className="text-xs text-amber-600">
                                                ⚠️ تقدير جزئي - {costData.missingPrices} مكون بدون سعر محدد
                                              </div>
                                            )}
                                            
                                            {/* حاسبة الوزن السريعة */}
                                            <div className="mt-2 p-2 bg-white rounded border">
                                              <label className="text-xs font-medium text-gray-600">حساب التكلفة لوزن مختلف:</label>
                                              <div className="flex items-center gap-2 mt-1">
                                                <input
                                                  type="number"
                                                  min="0.1"
                                                  step="0.1"
                                                  defaultValue="1"
                                                  className="w-16 px-1 py-1 text-xs border rounded"
                                                  onChange={(e) => {
                                                    const weight = parseFloat(e.target.value) || 1;
                                                    const newCost = calculateFormulaCost(formula, weight);
                                                    const display = e.target.nextElementSibling as HTMLElement;
                                                    if (newCost && display) {
                                                      display.textContent = `${newCost.totalCost.toFixed(2)} ر.س`;
                                                    }
                                                  }}
                                                />
                                                <span className="text-xs text-gray-500">كجم =</span>
                                                <span className="text-xs font-medium text-green-600">
                                                  {costData.totalCost.toFixed(2)} ر.س
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <h6 className="text-xs font-medium text-green-800">تفصيل المكونات:</h6>
                                            {formula.ingredients?.map((ingredient: any) => {
                                              const inventoryItem = inventory?.find((inv: any) => inv.item_id === ingredient.item_id);
                                              const costPerUnit = inventoryItem?.cost_per_unit;
                                              const ingredientCost = costPerUnit ? 
                                                (parseFloat(ingredient.percentage) / 100) * parseFloat(costPerUnit) : null;
                                              
                                              return (
                                                <div key={ingredient.id} className="flex justify-between text-xs">
                                                  <span>{ingredient.item_name_ar || ingredient.item_name} ({ingredient.percentage}%)</span>
                                                  <span className={ingredientCost ? "text-green-600" : "text-gray-400"}>
                                                    {ingredientCost ? `${ingredientCost.toFixed(2)} ر.س` : "غير محدد"}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
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
              {/* شريط البحث والفلترة للدفعات */}
              <div className="mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-search">البحث في الدفعات</Label>
                    <div className="relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="batch-search"
                        placeholder="رقم الدفعة أو الوصفة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="batch-status-filter">فلترة حسب الحالة</Label>
                    <Select value={statusFilter || undefined} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الحالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">معلق</SelectItem>
                        <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                        <SelectItem value="completed">مكتمل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="variance-filter">فلترة حسب الانحراف</Label>
                    <Select value={machineFilter || undefined} onValueChange={setMachineFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع المستويات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">ممتاز (أقل من 1%)</SelectItem>
                        <SelectItem value="good">جيد (1-3%)</SelectItem>
                        <SelectItem value="warning">تحذير (3-5%)</SelectItem>
                        <SelectItem value="critical">حرج (أكثر من 5%)</SelectItem>
                        <SelectItem value="no_data">لا توجد بيانات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="machine-filter">فلترة حسب الماكينة</Label>
                    <Select value={machineFilter || undefined} onValueChange={setMachineFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الماكينات" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines && machines.map((machine) => (
                          <SelectItem key={machine.id} value={machine.id}>
                            {machine.name_ar || machine.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* إحصائيات سريعة */}
                {batches && batches.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{batches.length}</div>
                      <div className="text-sm text-gray-500">إجمالي الدفعات</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {batches.filter(b => b.status === "completed").length}
                      </div>
                      <div className="text-sm text-gray-500">مكتملة</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {batches.filter(b => b.status === "in_progress").length}
                      </div>
                      <div className="text-sm text-gray-500">قيد التنفيذ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {batches.filter(b => {
                          const variance = analyzeBatchVariance(b);
                          return variance.warningLevel === "high";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-500">انحراف حرج</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {batches.filter(b => {
                          const variance = analyzeBatchVariance(b);
                          return variance.warningLevel === "none";
                        }).length}
                      </div>
                      <div className="text-sm text-gray-500">دقة ممتازة</div>
                    </div>
                  </div>
                )}
              </div>

              {batchesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredBatches && filteredBatches.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الدفعة</TableHead>
                        <TableHead className="text-right">الوصفة</TableHead>
                        <TableHead className="text-right">الماكينة</TableHead>
                        <TableHead className="text-right">الوزن الكلي (كجم)</TableHead>
                        <TableHead className="text-right">تحليل الانحراف</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ البدء</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBatches.map((batch) => {
                        const variance = analyzeBatchVariance(batch);
                        const formula = formulas?.find(f => f.id === batch.formula_id);
                        
                        return (
                        <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`}>
                          <TableCell className="font-medium">
                            {batch.batch_number}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{formula?.formula_name || `وصفة #${batch.formula_id}`}</div>
                              <div className="text-gray-500">{formula?.machine_name_ar || formula?.machine_name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{batch.machine_id}</TableCell>
                          <TableCell>
                            {parseFloat(batch.total_weight_kg).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {variance.status === "no_data" || variance.status === "pending" ? (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Activity className="h-3 w-3" />
                                  <span className="text-xs">لا توجد بيانات</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  {variance.warningLevel === "none" && (
                                    <Target className="h-3 w-3 text-green-600" />
                                  )}
                                  {variance.warningLevel === "low" && (
                                    <TrendingUp className="h-3 w-3 text-yellow-600" />
                                  )}
                                  {variance.warningLevel === "medium" && (
                                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                                  )}
                                  {variance.warningLevel === "high" && (
                                    <TrendingDown className="h-3 w-3 text-red-600" />
                                  )}
                                  <div className="text-xs">
                                    <div className={`font-medium ${
                                      variance.warningLevel === "none" ? "text-green-600" :
                                      variance.warningLevel === "low" ? "text-yellow-600" :
                                      variance.warningLevel === "medium" ? "text-orange-600" :
                                      "text-red-600"
                                    }`}>
                                      {variance.variancePercentage > 0 ? "+" : ""}{variance.variancePercentage.toFixed(1)}%
                                    </div>
                                    <div className="text-gray-500">
                                      دقة {variance.accuracy.toFixed(0)}%
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setIsBatchDetailDialogOpen(true);
                                }}
                                data-testid={`button-view-batch-${batch.id}`}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewInventoryConsumption(batch)}
                                className="gap-1"
                                data-testid={`button-inventory-batch-${batch.id}`}
                              >
                                <Warehouse className="h-4 w-4" />
                              </Button>
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
                        );
                      })}
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

          {/* نافذة تفاصيل الدفعة */}
          <Dialog open={isBatchDetailDialogOpen} onOpenChange={setIsBatchDetailDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  تحليل تفصيلي للدفعة {selectedBatch?.batch_number}
                </DialogTitle>
              </DialogHeader>
              {selectedBatch && (
                <BatchDetailAnalysis 
                  batch={selectedBatch} 
                  formula={formulas?.find(f => f.id === selectedBatch.formula_id)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* نافذة تفاصيل استهلاك المخزون */}
          <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  تفاصيل استهلاك المخزون - الدفعة {selectedBatchForInventory?.batch_number}
                </DialogTitle>
              </DialogHeader>
              {selectedBatchForInventory && (
                <BatchInventoryDetails 
                  batch={selectedBatchForInventory}
                  formula={formulas?.find(f => f.id === selectedBatchForInventory.formula_id)}
                  inventory={inventory || []}
                  inventoryTransactions={inventoryTransactions}
                  onRecordConsumption={recordMaterialConsumption}
                />
              )}
            </DialogContent>
          </Dialog>

        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <InventoryMonitoring 
            formulas={formulas || []}
            batches={batches || []}
            inventory={inventory || []}
            inventoryTransactions={inventoryTransactions || []}
            items={rawMaterialItems}
            onRecordConsumption={recordMaterialConsumption}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <MixingAnalytics 
            formulas={formulas || []}
            batches={batches || []}
            inventory={inventory || []}
            machines={machines || []}
          />
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
              machines={machines || []}
              items={items || []}
              inventory={inventory || []}
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
              machines={machines || []}
              items={items || []}
              inventory={inventory || []}
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

// دالة مساعدة لحساب التكلفة خارج المكون الرئيسي
const calculateCostForIngredients = (ingredients: any[], inventory: any[], weightKg: number = 1) => {
  if (!ingredients || ingredients.length === 0) return null;
  
  let totalCost = 0;
  let missingPrices = 0;
  
  ingredients.forEach((ingredient: any) => {
    const inventoryItem = inventory.find((inv: any) => inv.item_id === ingredient.item_id);
    const costPerUnit = inventoryItem?.cost_per_unit;
    
    if (costPerUnit && parseFloat(costPerUnit) > 0) {
      const ingredientWeight = (weightKg * parseFloat(ingredient.percentage)) / 100;
      totalCost += ingredientWeight * parseFloat(costPerUnit);
    } else {
      missingPrices++;
    }
  });
  
  return {
    totalCost: totalCost,
    costPerKg: totalCost / weightKg,
    missingPrices: missingPrices,
    isComplete: missingPrices === 0
  };
};

// دالة حساب التكلفة للوصفة
const calculateFormulaCostExternal = (formula: MixingFormula, inventory: any[], weightKg: number = 1) => {
  return calculateCostForIngredients(formula.ingredients || [], inventory, weightKg);
};

// مكون التحليلات والتقارير الشامل
function MixingAnalytics({ 
  formulas, 
  batches, 
  inventory, 
  machines 
}: { 
  formulas: MixingFormula[];
  batches: MixingBatch[];
  inventory: any[];
  machines: any[];
}) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("30");
  const [selectedReport, setSelectedReport] = useState("overview");

  // حساب الإحصائيات العامة
  const totalFormulas = formulas.length;
  const activeFormulas = formulas.filter(f => f.is_active).length;
  const totalBatches = batches.length;
  const completedBatches = batches.filter(b => b.status === "completed").length;
  const inProgressBatches = batches.filter(b => b.status === "in_progress").length;

  // حساب إجمالي الإنتاج
  const totalProduction = batches.reduce((sum, batch) => {
    return sum + parseFloat(batch.total_weight_kg || "0");
  }, 0);

  // حساب معدل الدقة
  const batchesWithVariance = batches.filter(b => b.ingredients && b.ingredients.length > 0);
  const accuracyRates = batchesWithVariance.map(batch => {
    const variance = analyzeBatchVariance(batch);
    return variance.accuracy;
  });
  const averageAccuracy = accuracyRates.length > 0 ? 
    accuracyRates.reduce((sum, acc) => sum + acc, 0) / accuracyRates.length : 0;

  // تحليل استخدام المواد
  const materialUsage = batches.reduce((usage: any, batch) => {
    if (batch.ingredients) {
      batch.ingredients.forEach(ingredient => {
        const materialId = ingredient.item_id;
        const actualWeight = parseFloat(ingredient.actual_weight_kg || "0");
        
        if (actualWeight > 0) {
          if (!usage[materialId]) {
            usage[materialId] = {
              item_name: ingredient.item_name_ar || ingredient.item_name,
              total_used: 0,
              batch_count: 0
            };
          }
          usage[materialId].total_used += actualWeight;
          usage[materialId].batch_count += 1;
        }
      });
    }
    return usage;
  }, {});

  const topMaterials = Object.entries(materialUsage)
    .map(([id, data]: [string, any]) => ({ id, ...data }))
    .sort((a, b) => b.total_used - a.total_used)
    .slice(0, 10);

  // تحليل كفاءة الوصفات
  const formulaEfficiency = formulas.map(formula => {
    const formulaBatches = batches.filter(b => b.formula_id === formula.id);
    const completedFormulaBatches = formulaBatches.filter(b => b.status === "completed");
    
    const averageVariance = formulaBatches.length > 0 ? 
      formulaBatches.reduce((sum, batch) => {
        const variance = analyzeBatchVariance(batch);
        return sum + Math.abs(variance.variancePercentage);
      }, 0) / formulaBatches.length : 0;

    const costData = calculateFormulaCostExternal(formula, inventory, 1);
    
    return {
      ...formula,
      batch_count: formulaBatches.length,
      completed_batches: completedFormulaBatches.length,
      average_variance: averageVariance,
      cost_per_kg: costData?.costPerKg || 0,
      efficiency_score: Math.max(0, 100 - averageVariance)
    };
  }).sort((a, b) => b.efficiency_score - a.efficiency_score);

  // حساب التكاليف
  const totalCosts = batches.reduce((sum, batch) => {
    const formula = formulas.find(f => f.id === batch.formula_id);
    if (formula) {
      const costData = calculateFormulaCostExternal(formula, inventory, parseFloat(batch.total_weight_kg || "0"));
      return sum + (costData?.totalCost || 0);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* شريط اختيار التقرير والفترة الزمنية */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <Label>نوع التقرير</Label>
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">نظرة عامة</SelectItem>
              <SelectItem value="materials">تحليل المواد</SelectItem>
              <SelectItem value="formulas">كفاءة الوصفات</SelectItem>
              <SelectItem value="costs">تحليل التكاليف</SelectItem>
              <SelectItem value="quality">تقرير الجودة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>الفترة الزمنية</Label>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="90">آخر 3 أشهر</SelectItem>
              <SelectItem value="365">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* التقرير العام */}
      {selectedReport === "overview" && (
        <div className="space-y-6">
          {/* بطاقات الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Beaker className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الوصفات النشطة</p>
                    <p className="text-2xl font-bold">{activeFormulas}</p>
                    <p className="text-xs text-gray-400">من أصل {totalFormulas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الدفعات المكتملة</p>
                    <p className="text-2xl font-bold">{completedBatches}</p>
                    <p className="text-xs text-gray-400">من أصل {totalBatches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">إجمالي الإنتاج</p>
                    <p className="text-2xl font-bold">{totalProduction.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">كيلوجرام</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Target className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">معدل الدقة</p>
                    <p className="text-2xl font-bold">{averageAccuracy.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">متوسط عام</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* حالة الدفعات والتكاليف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع حالة الدفعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">مكتملة</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{completedBatches}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">قيد التنفيذ</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: `${totalBatches > 0 ? (inProgressBatches / totalBatches) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{inProgressBatches}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">معلقة</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-600 h-2 rounded-full" 
                          style={{ width: `${totalBatches > 0 ? ((totalBatches - completedBatches - inProgressBatches) / totalBatches) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{totalBatches - completedBatches - inProgressBatches}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  ملخص التكاليف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">إجمالي التكاليف التقديرية</span>
                    <span className="font-bold text-lg">{totalCosts.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">متوسط التكلفة/كجم</span>
                    <span className="font-medium">{totalProduction > 0 ? (totalCosts / totalProduction).toFixed(2) : "0.00"} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">متوسط التكلفة/دفعة</span>
                    <span className="font-medium">{totalBatches > 0 ? (totalCosts / totalBatches).toFixed(2) : "0.00"} ر.س</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* تحليل المواد */}
      {selectedReport === "materials" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              أكثر المواد استخداماً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المادة</TableHead>
                  <TableHead className="text-right">إجمالي الاستخدام (كجم)</TableHead>
                  <TableHead className="text-right">عدد الدفعات</TableHead>
                  <TableHead className="text-right">متوسط الاستخدام/دفعة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMaterials.map((material, index) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        {material.item_name}
                      </div>
                    </TableCell>
                    <TableCell>{material.total_used.toFixed(2)}</TableCell>
                    <TableCell>{material.batch_count}</TableCell>
                    <TableCell>{(material.total_used / material.batch_count).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* كفاءة الوصفات */}
      {selectedReport === "formulas" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              ترتيب الوصفات حسب الكفاءة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الوصفة</TableHead>
                  <TableHead className="text-right">عدد الدفعات</TableHead>
                  <TableHead className="text-right">متوسط الانحراف (%)</TableHead>
                  <TableHead className="text-right">نقاط الكفاءة</TableHead>
                  <TableHead className="text-right">التكلفة/كجم</TableHead>
                  <TableHead className="text-right">التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulaEfficiency.slice(0, 10).map((formula, index) => (
                  <TableRow key={formula.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        {formula.formula_name}
                      </div>
                    </TableCell>
                    <TableCell>{formula.batch_count}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        formula.average_variance <= 1 ? "text-green-600" :
                        formula.average_variance <= 3 ? "text-yellow-600" :
                        formula.average_variance <= 5 ? "text-orange-600" :
                        "text-red-600"
                      }`}>
                        {formula.average_variance.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              formula.efficiency_score >= 95 ? "bg-green-600" :
                              formula.efficiency_score >= 90 ? "bg-yellow-600" :
                              formula.efficiency_score >= 80 ? "bg-orange-600" :
                              "bg-red-600"
                            }`}
                            style={{ width: `${Math.min(100, formula.efficiency_score)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{formula.efficiency_score.toFixed(0)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formula.cost_per_kg.toFixed(2)} ر.س</TableCell>
                    <TableCell>
                      <Badge variant={
                        formula.efficiency_score >= 95 ? "default" :
                        formula.efficiency_score >= 90 ? "secondary" :
                        formula.efficiency_score >= 80 ? "outline" :
                        "destructive"
                      }>
                        {formula.efficiency_score >= 95 ? "ممتاز" :
                         formula.efficiency_score >= 90 ? "جيد جداً" :
                         formula.efficiency_score >= 80 ? "جيد" :
                         "يحتاج تحسين"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* تحليل التكاليف */}
      {selectedReport === "costs" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">إجمالي التكاليف</p>
                    <p className="text-2xl font-bold">{totalCosts.toFixed(2)} ر.س</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">متوسط التكلفة/كجم</p>
                    <p className="text-2xl font-bold">
                      {totalProduction > 0 ? (totalCosts / totalProduction).toFixed(2) : "0.00"} ر.س
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الوصفة الأغلى</p>
                    <p className="text-lg font-bold">
                      {formulaEfficiency.length > 0 ? 
                        Math.max(...formulaEfficiency.map(f => f.cost_per_kg)).toFixed(2) : "0.00"} ر.س
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تفصيل التكاليف حسب الوصفة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الوصفة</TableHead>
                    <TableHead className="text-right">التكلفة/كجم</TableHead>
                    <TableHead className="text-right">إجمالي الإنتاج (كجم)</TableHead>
                    <TableHead className="text-right">إجمالي التكلفة</TableHead>
                    <TableHead className="text-right">النسبة من الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulaEfficiency.map((formula) => {
                    const formulaTotalWeight = batches
                      .filter(b => b.formula_id === formula.id)
                      .reduce((sum, b) => sum + parseFloat(b.total_weight_kg || "0"), 0);
                    const formulaTotalCost = formulaTotalWeight * formula.cost_per_kg;
                    const costPercentage = totalCosts > 0 ? (formulaTotalCost / totalCosts) * 100 : 0;

                    return (
                      <TableRow key={formula.id}>
                        <TableCell className="font-medium">{formula.formula_name}</TableCell>
                        <TableCell>{formula.cost_per_kg.toFixed(2)} ر.س</TableCell>
                        <TableCell>{formulaTotalWeight.toFixed(2)}</TableCell>
                        <TableCell>{formulaTotalCost.toFixed(2)} ر.س</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, costPercentage)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{costPercentage.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* تقرير الجودة */}
      {selectedReport === "quality" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">دقة ممتازة</p>
                    <p className="text-2xl font-bold">
                      {batches.filter(b => {
                        const variance = analyzeBatchVariance(b);
                        return variance.warningLevel === "none";
                      }).length}
                    </p>
                    <p className="text-xs text-gray-400">دفعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">تحتاج مراجعة</p>
                    <p className="text-2xl font-bold">
                      {batches.filter(b => {
                        const variance = analyzeBatchVariance(b);
                        return variance.warningLevel === "low" || variance.warningLevel === "medium";
                      }).length}
                    </p>
                    <p className="text-xs text-gray-400">دفعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">انحراف حرج</p>
                    <p className="text-2xl font-bold">
                      {batches.filter(b => {
                        const variance = analyzeBatchVariance(b);
                        return variance.warningLevel === "high";
                      }).length}
                    </p>
                    <p className="text-xs text-gray-400">دفعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">متوسط الدقة</p>
                    <p className="text-2xl font-bold">{averageAccuracy.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تفصيل الجودة حسب الوصفة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الوصفة</TableHead>
                    <TableHead className="text-right">عدد الدفعات</TableHead>
                    <TableHead className="text-right">دفعات ممتازة</TableHead>
                    <TableHead className="text-right">دفعات جيدة</TableHead>
                    <TableHead className="text-right">دفعات تحتاج مراجعة</TableHead>
                    <TableHead className="text-right">معدل النجاح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulas.map((formula) => {
                    const formulaBatches = batches.filter(b => b.formula_id === formula.id);
                    const excellentBatches = formulaBatches.filter(b => {
                      const variance = analyzeBatchVariance(b);
                      return variance.warningLevel === "none";
                    }).length;
                    const goodBatches = formulaBatches.filter(b => {
                      const variance = analyzeBatchVariance(b);
                      return variance.warningLevel === "low";
                    }).length;
                    const needsReview = formulaBatches.filter(b => {
                      const variance = analyzeBatchVariance(b);
                      return variance.warningLevel === "medium" || variance.warningLevel === "high";
                    }).length;
                    const successRate = formulaBatches.length > 0 ? 
                      ((excellentBatches + goodBatches) / formulaBatches.length) * 100 : 0;

                    return (
                      <TableRow key={formula.id}>
                        <TableCell className="font-medium">{formula.formula_name}</TableCell>
                        <TableCell>{formulaBatches.length}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{excellentBatches}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-yellow-600 font-medium">{goodBatches}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">{needsReview}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  successRate >= 90 ? "bg-green-600" :
                                  successRate >= 70 ? "bg-yellow-600" :
                                  "bg-red-600"
                                }`}
                                style={{ width: `${Math.min(100, successRate)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{successRate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// دالة تحليل انحرافات الدفعة
const analyzeBatchVariance = (batch: MixingBatch) => {
  if (!batch.ingredients || batch.ingredients.length === 0) {
    return {
      totalVariance: 0,
      variancePercentage: 0,
      status: "no_data" as const,
      accuracy: 0,
      warningLevel: "none" as const
    };
  }

  let totalPlanned = 0;
  let totalActual = 0;
  let ingredientsWithData = 0;

  batch.ingredients.forEach(ingredient => {
    const planned = parseFloat(ingredient.planned_weight_kg || "0");
    const actual = parseFloat(ingredient.actual_weight_kg || "0");
    
    if (planned > 0) {
      totalPlanned += planned;
      if (actual > 0) {
        totalActual += actual;
        ingredientsWithData++;
      }
    }
  });

  if (ingredientsWithData === 0) {
    return {
      totalVariance: 0,
      variancePercentage: 0,
      status: "pending" as const,
      accuracy: 0,
      warningLevel: "none" as const
    };
  }

  const totalVariance = totalActual - totalPlanned;
  const variancePercentage = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0;
  const accuracy = totalPlanned > 0 ? 100 - Math.abs(variancePercentage) : 0;

  let warningLevel: "none" | "low" | "medium" | "high" = "none";
  let status: "excellent" | "good" | "warning" | "critical" | "pending" | "no_data" = "excellent";

  const absVariancePercentage = Math.abs(variancePercentage);

  if (absVariancePercentage <= 1) {
    status = "excellent";
    warningLevel = "none";
  } else if (absVariancePercentage <= 3) {
    status = "good";
    warningLevel = "low";
  } else if (absVariancePercentage <= 5) {
    status = "warning";
    warningLevel = "medium";
  } else {
    status = "critical";
    warningLevel = "high";
  }

  return {
    totalVariance,
    variancePercentage,
    status,
    accuracy,
    warningLevel,
    ingredientsWithData,
    totalIngredients: batch.ingredients.length
  };
};

// مكون تحليل تفاصيل الدفعة
function BatchDetailAnalysis({ 
  batch, 
  formula 
}: { 
  batch: MixingBatch; 
  formula?: MixingFormula 
}) {
  const variance = analyzeBatchVariance(batch);
  
  return (
    <div className="space-y-6">
      {/* ملخص الدفعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">الوزن الكلي</p>
                <p className="text-xl font-bold">{parseFloat(batch.total_weight_kg).toFixed(2)} كجم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">دقة الخلط</p>
                <p className="text-xl font-bold text-green-600">{variance.accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {variance.variancePercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-orange-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-blue-600" />
              )}
              <div>
                <p className="text-sm text-gray-500">الانحراف الكلي</p>
                <p className={`text-xl font-bold ${
                  variance.variancePercentage >= 0 ? "text-orange-600" : "text-blue-600"
                }`}>
                  {variance.variancePercentage > 0 ? "+" : ""}{variance.variancePercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {variance.warningLevel === "none" && <Target className="h-4 w-4 text-green-600" />}
              {variance.warningLevel === "low" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
              {variance.warningLevel === "medium" && <AlertTriangle className="h-4 w-4 text-orange-600" />}
              {variance.warningLevel === "high" && <AlertTriangle className="h-4 w-4 text-red-600" />}
              <div>
                <p className="text-sm text-gray-500">حالة الجودة</p>
                <p className={`text-sm font-bold ${
                  variance.warningLevel === "none" ? "text-green-600" :
                  variance.warningLevel === "low" ? "text-yellow-600" :
                  variance.warningLevel === "medium" ? "text-orange-600" :
                  "text-red-600"
                }`}>
                  {variance.status === "excellent" ? "ممتاز" :
                   variance.status === "good" ? "جيد" :
                   variance.status === "warning" ? "تحذير" :
                   variance.status === "critical" ? "حرج" : "لا توجد بيانات"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل المكونات */}
      {batch.ingredients && batch.ingredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              تفاصيل المكونات والانحرافات
              {batch.status !== "completed" && (
                <Button 
                  size="sm" 
                  className="mr-auto"
                  onClick={() => {
                    // TODO: فتح نافذة تحديث الأوزان الفعلية
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  تحديث الأوزان الفعلية
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* إنذارات الانحراف */}
            {variance.warningLevel !== "none" && (variance.status === "warning" || variance.status === "critical") && (
              <div className={`mb-4 p-3 rounded-lg border ${
                variance.warningLevel === "low" ? "bg-yellow-50 border-yellow-200" :
                variance.warningLevel === "medium" ? "bg-orange-50 border-orange-200" :
                "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${
                    variance.warningLevel === "low" ? "text-yellow-600" :
                    variance.warningLevel === "medium" ? "text-orange-600" :
                    "text-red-600"
                  }`} />
                  <span className={`font-medium ${
                    variance.warningLevel === "low" ? "text-yellow-800" :
                    variance.warningLevel === "medium" ? "text-orange-800" :
                    "text-red-800"
                  }`}>
                    {variance.warningLevel === "low" ? "تحذير: انحراف طفيف في الأوزان" :
                     variance.warningLevel === "medium" ? "تحذير: انحراف متوسط يتطلب المراجعة" :
                     "تحذير حرج: انحراف كبير يتطلب إجراء فوري"}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${
                  variance.warningLevel === "low" ? "text-yellow-700" :
                  variance.warningLevel === "medium" ? "text-orange-700" :
                  "text-red-700"
                }`}>
                  الانحراف الكلي: {variance.variancePercentage > 0 ? "+" : ""}{variance.variancePercentage.toFixed(2)}% 
                  • دقة الخلط: {variance.accuracy.toFixed(1)}%
                  {variance.warningLevel === "high" && " • يُنصح بمراجعة المعايرة والإجراءات"}
                </p>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المادة</TableHead>
                  <TableHead className="text-right">النسبة المئوية</TableHead>
                  <TableHead className="text-right">الوزن المخطط (كجم)</TableHead>
                  <TableHead className="text-right">الوزن الفعلي (كجم)</TableHead>
                  <TableHead className="text-right">الانحراف (كجم)</TableHead>
                  <TableHead className="text-right">الانحراف (%)</TableHead>
                  <TableHead className="text-right">التقييم</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.ingredients.map((ingredient) => {
                  const planned = parseFloat(ingredient.planned_weight_kg || "0");
                  const actual = parseFloat(ingredient.actual_weight_kg || "0");
                  const variance = actual - planned;
                  const variancePercentage = planned > 0 ? (variance / planned) * 100 : 0;
                  
                  // حساب النسبة المئوية للمكون
                  const totalPlannedWeight = parseFloat(batch.total_weight_kg);
                  const ingredientPercentage = totalPlannedWeight > 0 ? (planned / totalPlannedWeight) * 100 : 0;
                  
                  let status = "معلق";
                  let statusColor = "text-gray-500";
                  let statusIcon = <Activity className="h-3 w-3" />;
                  
                  if (actual > 0) {
                    const absVariancePercentage = Math.abs(variancePercentage);
                    if (absVariancePercentage <= 1) {
                      status = "ممتاز";
                      statusColor = "text-green-600";
                      statusIcon = <Target className="h-3 w-3" />;
                    } else if (absVariancePercentage <= 3) {
                      status = "جيد";
                      statusColor = "text-yellow-600";
                      statusIcon = <TrendingUp className="h-3 w-3" />;
                    } else if (absVariancePercentage <= 5) {
                      status = "تحذير";
                      statusColor = "text-orange-600";
                      statusIcon = <AlertTriangle className="h-3 w-3" />;
                    } else {
                      status = "حرج";
                      statusColor = "text-red-600";
                      statusIcon = <AlertTriangle className="h-3 w-3" />;
                    }
                  }

                  return (
                    <TableRow key={ingredient.id} className={
                      actual > 0 && Math.abs(variancePercentage) > 5 ? "bg-red-50" :
                      actual > 0 && Math.abs(variancePercentage) > 3 ? "bg-orange-50" :
                      actual > 0 && Math.abs(variancePercentage) > 1 ? "bg-yellow-50" :
                      actual > 0 ? "bg-green-50" : ""
                    }>
                      <TableCell className="font-medium">
                        <div>
                          <div>{ingredient.item_name_ar || ingredient.item_name}</div>
                          <div className="text-xs text-gray-500">ID: {ingredient.item_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{ingredientPercentage.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{planned.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        {actual > 0 ? (
                          <span className="font-medium">{actual.toFixed(2)}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">غير محدد</span>
                            {batch.status !== "completed" && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  // TODO: فتح نافذة إدخال الوزن الفعلي
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {actual > 0 ? (
                          <span className={`font-medium ${variance >= 0 ? "text-orange-600" : "text-blue-600"}`}>
                            {variance > 0 ? "+" : ""}{variance.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {actual > 0 ? (
                          <span className={`font-medium ${variancePercentage >= 0 ? "text-orange-600" : "text-blue-600"}`}>
                            {variancePercentage > 0 ? "+" : ""}{variancePercentage.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${statusColor}`}>
                          {statusIcon}
                          <span className="text-sm font-medium">{status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* ملخص إحصائي */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">المكونات الكلي:</span>
                  <span className="font-medium mr-2">{batch.ingredients.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">مع بيانات فعلية:</span>
                  <span className="font-medium mr-2">{variance.ingredientsWithData}</span>
                </div>
                <div>
                  <span className="text-gray-500">مكونات ممتازة:</span>
                  <span className="font-medium mr-2 text-green-600">
                    {batch.ingredients.filter(ing => {
                      const planned = parseFloat(ing.planned_weight_kg || "0");
                      const actual = parseFloat(ing.actual_weight_kg || "0");
                      const variance = planned > 0 && actual > 0 ? Math.abs((actual - planned) / planned) * 100 : 0;
                      return actual > 0 && variance <= 1;
                    }).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">مكونات تحتاج مراجعة:</span>
                  <span className="font-medium mr-2 text-orange-600">
                    {batch.ingredients.filter(ing => {
                      const planned = parseFloat(ing.planned_weight_kg || "0");
                      const actual = parseFloat(ing.actual_weight_kg || "0");
                      const variance = planned > 0 && actual > 0 ? Math.abs((actual - planned) / planned) * 100 : 0;
                      return actual > 0 && variance > 3;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* معلومات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>معلومات الوصفة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">اسم الوصفة:</span>
              <span className="font-medium">{formula?.formula_name || `وصفة #${batch.formula_id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الماكينة:</span>
              <span className="font-medium">{batch.machine_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">المشغل:</span>
              <span className="font-medium">المشغل #{batch.operator_id}</span>
            </div>
            {formula && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">نطاق العرض:</span>
                  <span className="font-medium">{formula.width_min} - {formula.width_max} سم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">السماكة:</span>
                  <span className="font-medium">{formula.thickness_min} - {formula.thickness_max} ميكرون</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>معلومات التشغيل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">تاريخ البدء:</span>
              <span className="font-medium">{new Date(batch.started_at).toLocaleString("ar-EG")}</span>
            </div>
            {batch.completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">تاريخ الانتهاء:</span>
                <span className="font-medium">{new Date(batch.completed_at).toLocaleString("ar-EG")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">الحالة:</span>
              <Badge variant={
                batch.status === "completed" ? "default" :
                batch.status === "in_progress" ? "secondary" : "outline"
              }>
                {batch.status === "completed" ? "مكتمل" :
                 batch.status === "in_progress" ? "قيد التنفيذ" : "معلق"}
              </Badge>
            </div>
            {batch.notes && (
              <div>
                <span className="text-gray-500">ملاحظات:</span>
                <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{batch.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
                  ?.filter((m) => m.type === "extruder")
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
  inventory,
  onSuccess,
}: {
  formula: MixingFormula;
  machines: any[];
  items: Item[];
  inventory: any[];
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
                setFormData({ ...formData, machine_id: value })
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
  inventory,
  onSuccess,
}: {
  originalFormula: MixingFormula;
  machines: any[];
  items: Item[];
  inventory: any[];
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
                setFormData({ ...formData, machine_id: value })
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

        {/* تقدير التكلفة للوصفة الجديدة */}
        {ingredients.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded">
            <h5 className="font-medium text-sm text-green-900 mb-2">تقدير التكلفة للوصفة الجديدة:</h5>
            {(() => {
              const costData = calculateCostForIngredients(ingredients, inventory, 1);
              if (costData) {
                return (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">التكلفة المتوقعة: </span>
                      <span className="text-green-700">{costData.costPerKg.toFixed(2)} ر.س/كجم</span>
                    </div>
                    {!costData.isComplete && (
                      <div className="text-xs text-amber-600">
                        ⚠️ تقدير جزئي - {costData.missingPrices} مكون بدون سعر محدد
                      </div>
                    )}
                  </div>
                );
              }
              return <div className="text-sm text-gray-500">لا يمكن حساب التكلفة</div>;
            })()}
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

// مكون مراقبة المخزون
function InventoryMonitoring({ 
  formulas, 
  batches, 
  inventory, 
  inventoryTransactions,
  items,
  onRecordConsumption 
}: { 
  formulas: MixingFormula[];
  batches: MixingBatch[];
  inventory: any[];
  inventoryTransactions: InventoryTransaction[];
  items: Item[];
  onRecordConsumption: any;
}) {
  const [selectedView, setSelectedView] = useState("overview");

  // حساب إجمالي استهلاك المواد من الدفعات
  const materialConsumptionData = items.map(item => {
    const totalConsumed = batches.reduce((sum, batch) => {
      if (batch.ingredients) {
        const ingredient = batch.ingredients.find(ing => ing.item_id === item.id);
        if (ingredient && ingredient.actual_weight_kg) {
          return sum + parseFloat(ingredient.actual_weight_kg);
        }
      }
      return sum;
    }, 0);

    const inventoryItem = inventory.find(inv => inv.item_id === item.id);
    const currentStock = inventoryItem?.quantity || 0;
    const reorderPoint = inventoryItem?.reorder_point || 0;
    const isLowStock = currentStock <= reorderPoint;

    // حساب الاستهلاك في آخر 30 يوم
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentConsumption = batches
      .filter(batch => new Date(batch.started_at) >= thirtyDaysAgo && batch.status === "completed")
      .reduce((sum, batch) => {
        if (batch.ingredients) {
          const ingredient = batch.ingredients.find(ing => ing.item_id === item.id);
          if (ingredient && ingredient.actual_weight_kg) {
            return sum + parseFloat(ingredient.actual_weight_kg);
          }
        }
        return sum;
      }, 0);

    // تقدير عدد الأيام المتبقية بناءً على معدل الاستهلاك
    const dailyConsumption = recentConsumption / 30;
    const daysRemaining = dailyConsumption > 0 ? Math.floor(currentStock / dailyConsumption) : Infinity;

    return {
      ...item,
      totalConsumed,
      currentStock,
      reorderPoint,
      isLowStock,
      recentConsumption,
      dailyConsumption,
      daysRemaining: daysRemaining === Infinity ? "غير محدد" : daysRemaining
    };
  });

  // المواد منخفضة المخزون
  const lowStockItems = materialConsumptionData.filter(item => item.isLowStock);

  // المواد الأكثر استهلاكاً
  const topConsumedItems = materialConsumptionData
    .sort((a, b) => b.totalConsumed - a.totalConsumed)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            مراقبة المخزون للمواد الخام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* شريط اختيار العرض */}
            <div className="flex gap-2">
              <Button
                variant={selectedView === "overview" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView("overview")}
              >
                نظرة عامة
              </Button>
              <Button
                variant={selectedView === "low-stock" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView("low-stock")}
              >
                مخزون منخفض
              </Button>
              <Button
                variant={selectedView === "consumption" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView("consumption")}
              >
                تحليل الاستهلاك
              </Button>
              <Button
                variant={selectedView === "transactions" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView("transactions")}
              >
                سجل المعاملات
              </Button>
            </div>

            {/* النظرة العامة */}
            {selectedView === "overview" && (
              <div className="space-y-4">
                {/* إحصائيات سريعة */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{items.length}</div>
                      <div className="text-sm text-gray-500">إجمالي المواد</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
                      <div className="text-sm text-gray-500">مخزون منخفض</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {materialConsumptionData.reduce((sum, item) => sum + item.totalConsumed, 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">إجمالي الاستهلاك (كجم)</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {materialConsumptionData.reduce((sum, item) => sum + item.recentConsumption, 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">استهلاك آخر 30 يوم (كجم)</div>
                    </CardContent>
                  </Card>
                </div>

                {/* جدول المواد */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">المخزون الحالي</TableHead>
                        <TableHead className="text-right">نقطة إعادة الطلب</TableHead>
                        <TableHead className="text-right">إجمالي الاستهلاك</TableHead>
                        <TableHead className="text-right">استهلاك 30 يوم</TableHead>
                        <TableHead className="text-right">الأيام المتبقية</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialConsumptionData.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name_ar || item.name}
                          </TableCell>
                          <TableCell>{item.currentStock.toFixed(2)} كجم</TableCell>
                          <TableCell>{item.reorderPoint.toFixed(2)} كجم</TableCell>
                          <TableCell>{item.totalConsumed.toFixed(2)} كجم</TableCell>
                          <TableCell>{item.recentConsumption.toFixed(2)} كجم</TableCell>
                          <TableCell>
                            {typeof item.daysRemaining === "number" ? 
                              `${item.daysRemaining} يوم` : item.daysRemaining}
                          </TableCell>
                          <TableCell>
                            {item.isLowStock ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                مخزون منخفض
                              </Badge>
                            ) : (
                              <Badge variant="default">متوفر</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* المخزون المنخفض */}
            {selectedView === "low-stock" && (
              <div className="space-y-4">
                {lowStockItems.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">المادة</TableHead>
                          <TableHead className="text-right">المخزون الحالي</TableHead>
                          <TableHead className="text-right">نقطة إعادة الطلب</TableHead>
                          <TableHead className="text-right">النقص</TableHead>
                          <TableHead className="text-right">الأيام المتبقية</TableHead>
                          <TableHead className="text-right">مستوى الخطر</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockItems.map(item => {
                          const shortage = item.reorderPoint - item.currentStock;
                          const riskLevel = 
                            item.currentStock <= 0 ? "critical" :
                            item.currentStock <= item.reorderPoint * 0.5 ? "high" : "medium";
                          
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.name_ar || item.name}
                              </TableCell>
                              <TableCell>
                                <span className="text-red-600 font-medium">
                                  {item.currentStock.toFixed(2)} كجم
                                </span>
                              </TableCell>
                              <TableCell>{item.reorderPoint.toFixed(2)} كجم</TableCell>
                              <TableCell>
                                <span className="text-red-600">
                                  {shortage.toFixed(2)} كجم
                                </span>
                              </TableCell>
                              <TableCell>
                                {typeof item.daysRemaining === "number" ? 
                                  `${item.daysRemaining} يوم` : item.daysRemaining}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    riskLevel === "critical" ? "destructive" :
                                    riskLevel === "high" ? "destructive" : "secondary"
                                  }
                                >
                                  {riskLevel === "critical" ? "حرج" :
                                   riskLevel === "high" ? "عالي" : "متوسط"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-green-600 font-medium">ممتاز! جميع المواد متوفرة بكميات كافية</p>
                  </div>
                )}
              </div>
            )}

            {/* تحليل الاستهلاك */}
            {selectedView === "consumption" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">المواد الأكثر استهلاكاً</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">إجمالي الاستهلاك</TableHead>
                        <TableHead className="text-right">استهلاك آخر 30 يوم</TableHead>
                        <TableHead className="text-right">المعدل اليومي</TableHead>
                        <TableHead className="text-right">عدد الدفعات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topConsumedItems.map(item => {
                        const batchesUsed = batches.filter(batch => 
                          batch.ingredients?.some(ing => ing.item_id === item.id)
                        ).length;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name_ar || item.name}
                            </TableCell>
                            <TableCell>{item.totalConsumed.toFixed(2)} كجم</TableCell>
                            <TableCell>{item.recentConsumption.toFixed(2)} كجم</TableCell>
                            <TableCell>{item.dailyConsumption.toFixed(2)} كجم/يوم</TableCell>
                            <TableCell>{batchesUsed} دفعة</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* سجل المعاملات */}
            {selectedView === "transactions" && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">سجل معاملات المخزون</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">نوع المعاملة</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">المرجع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryTransactions
                        .filter(t => t.reference_type === "mixing_batch")
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 50)
                        .map(transaction => {
                          const item = items.find(i => i.id === transaction.item_id);
                          const batch = batches.find(b => b.id === transaction.reference_id);
                          
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell>
                                {new Date(transaction.created_at).toLocaleDateString("ar-EG")}
                              </TableCell>
                              <TableCell>{item?.name_ar || item?.name}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={transaction.transaction_type === "out" ? "destructive" : "default"}
                                >
                                  {transaction.transaction_type === "out" ? "استهلاك" : "إضافة"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={transaction.transaction_type === "out" ? "text-red-600" : "text-green-600"}>
                                  {transaction.transaction_type === "out" ? "-" : "+"}{transaction.quantity.toFixed(2)} كجم
                                </span>
                              </TableCell>
                              <TableCell>
                                دفعة خلط: {batch?.batch_number || transaction.reference_id}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// مكون تفاصيل استهلاك المخزون للدفعة
function BatchInventoryDetails({ 
  batch, 
  formula, 
  inventory, 
  inventoryTransactions,
  onRecordConsumption 
}: { 
  batch: MixingBatch;
  formula?: MixingFormula;
  inventory: any[];
  inventoryTransactions: InventoryTransaction[];
  onRecordConsumption: any;
}) {
  const [consumptionData, setConsumptionData] = useState<any[]>([]);

  // تحضير بيانات الاستهلاك عند تحميل المكون
  React.useEffect(() => {
    if (batch.ingredients && formula?.ingredients) {
      const data = batch.ingredients.map(batchIngredient => {
        const formulaIngredient = formula.ingredients?.find(fi => fi.item_id === batchIngredient.item_id);
        const inventoryItem = inventory.find(inv => inv.item_id === batchIngredient.item_id);
        const plannedWeight = parseFloat(batchIngredient.planned_weight_kg || "0");
        const actualWeight = parseFloat(batchIngredient.actual_weight_kg || "0");
        
        return {
          item_id: batchIngredient.item_id,
          item_name: batchIngredient.item_name_ar || batchIngredient.item_name,
          percentage: formulaIngredient?.percentage || "0",
          planned_weight: plannedWeight,
          actual_weight: actualWeight,
          current_stock: inventoryItem?.quantity || 0,
          cost_per_unit: inventoryItem?.cost_per_unit || 0,
          total_cost: actualWeight * (inventoryItem?.cost_per_unit || 0),
          is_sufficient: (inventoryItem?.quantity || 0) >= actualWeight,
          variance: actualWeight - plannedWeight,
          variance_percentage: plannedWeight > 0 ? ((actualWeight - plannedWeight) / plannedWeight * 100) : 0
        };
      });
      setConsumptionData(data);
    }
  }, [batch, formula, inventory]);

  // دالة تسجيل الاستهلاك
  const handleRecordConsumption = () => {
    const consumptions = consumptionData
      .filter(item => item.actual_weight > 0)
      .map(item => ({
        item_id: item.item_id,
        quantity_consumed: item.actual_weight,
        cost_at_consumption: item.cost_per_unit
      }));

    onRecordConsumption.mutate({
      batchId: batch.id,
      consumptions
    });
  };

  // التحقق من إمكانية تسجيل الاستهلاك
  const canRecordConsumption = consumptionData.every(item => item.is_sufficient) && 
    consumptionData.some(item => item.actual_weight > 0);

  // البحث عن المعاملات المسجلة للدفعة
  const existingTransactions = inventoryTransactions.filter(
    t => t.reference_type === "mixing_batch" && t.reference_id === batch.id
  );

  const isAlreadyRecorded = existingTransactions.length > 0;

  return (
    <div className="space-y-6">
      {/* معلومات الدفعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">رقم الدفعة</div>
            <div className="text-lg font-medium">{batch.batch_number}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">الوزن الكلي</div>
            <div className="text-lg font-medium">{parseFloat(batch.total_weight_kg).toFixed(2)} كجم</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">حالة التسجيل</div>
            <div className="text-lg font-medium">
              {isAlreadyRecorded ? (
                <Badge variant="default">مسجل في المخزون</Badge>
              ) : (
                <Badge variant="secondary">غير مسجل</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول تفاصيل الاستهلاك */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل استهلاك المواد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المادة</TableHead>
                  <TableHead className="text-right">النسبة</TableHead>
                  <TableHead className="text-right">المخطط (كجم)</TableHead>
                  <TableHead className="text-right">الفعلي (كجم)</TableHead>
                  <TableHead className="text-right">الانحراف</TableHead>
                  <TableHead className="text-right">المخزون الحالي</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptionData.map(item => (
                  <TableRow key={item.item_id}>
                    <TableCell className="font-medium">
                      {item.item_name}
                    </TableCell>
                    <TableCell>{item.percentage}%</TableCell>
                    <TableCell>{item.planned_weight.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={item.actual_weight > 0 ? "font-medium" : "text-gray-400"}>
                        {item.actual_weight.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={
                        Math.abs(item.variance_percentage) < 1 ? "text-green-600" :
                        Math.abs(item.variance_percentage) < 3 ? "text-yellow-600" :
                        "text-red-600"
                      }>
                        {item.variance > 0 ? "+" : ""}{item.variance.toFixed(2)} 
                        ({item.variance_percentage.toFixed(1)}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={item.is_sufficient ? "text-green-600" : "text-red-600"}>
                        {item.current_stock.toFixed(2)} كجم
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.total_cost.toFixed(2)} ر.س
                    </TableCell>
                    <TableCell>
                      {item.is_sufficient ? (
                        <Badge variant="default">متوفر</Badge>
                      ) : (
                        <Badge variant="destructive">نقص في المخزون</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ملخص التكلفة الإجمالية */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">إجمالي الوزن المستهلك</div>
                <div className="text-lg font-medium">
                  {consumptionData.reduce((sum, item) => sum + item.actual_weight, 0).toFixed(2)} كجم
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">إجمالي التكلفة</div>
                <div className="text-lg font-medium text-green-600">
                  {consumptionData.reduce((sum, item) => sum + item.total_cost, 0).toFixed(2)} ر.س
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">متوسط التكلفة</div>
                <div className="text-lg font-medium">
                  {batch.total_weight_kg ? 
                    (consumptionData.reduce((sum, item) => sum + item.total_cost, 0) / parseFloat(batch.total_weight_kg)).toFixed(2) : 
                    "0.00"} ر.س/كجم
                </div>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="mt-4 flex gap-2">
            {!isAlreadyRecorded && canRecordConsumption && (
              <Button 
                onClick={handleRecordConsumption}
                className="gap-2"
                disabled={onRecordConsumption.isPending}
              >
                <ShoppingCart className="h-4 w-4" />
                {onRecordConsumption.isPending ? "جاري التسجيل..." : "تسجيل الاستهلاك في المخزون"}
              </Button>
            )}
            
            {!canRecordConsumption && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">لا يمكن تسجيل الاستهلاك - نقص في المخزون أو بيانات غير مكتملة</span>
              </div>
            )}

            {isAlreadyRecorded && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">تم تسجيل الاستهلاك بنجاح في {new Date(existingTransactions[0]?.created_at).toLocaleDateString("ar-EG")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* المعاملات المسجلة */}
      {existingTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المعاملات المسجلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المادة</TableHead>
                    <TableHead className="text-right">الكمية المستهلكة</TableHead>
                    <TableHead className="text-right">سعر الوحدة</TableHead>
                    <TableHead className="text-right">التكلفة الإجمالية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingTransactions.map(transaction => {
                    const item = consumptionData.find(cd => cd.item_id === transaction.item_id);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString("ar-EG")}
                        </TableCell>
                        <TableCell>{item?.item_name}</TableCell>
                        <TableCell className="text-red-600">
                          -{transaction.quantity.toFixed(2)} كجم
                        </TableCell>
                        <TableCell>
                          {transaction.cost_per_unit?.toFixed(2)} ر.س/كجم
                        </TableCell>
                        <TableCell>
                          {((transaction.cost_per_unit || 0) * transaction.quantity).toFixed(2)} ر.س
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
