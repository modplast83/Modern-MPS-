import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Search, AlertTriangle, TrendingUp, TrendingDown, Edit, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const inventoryFormSchema = z.object({
  item_id: z.string().min(1, "الصنف مطلوب"),
  location_id: z.string().transform(val => parseInt(val)),
  current_stock: z.string().transform(val => parseFloat(val)),
  min_stock: z.string().transform(val => parseFloat(val)),
  max_stock: z.string().transform(val => parseFloat(val)),
  unit: z.string().min(1, "الوحدة مطلوبة"),
  cost_per_unit: z.string().transform(val => parseFloat(val))
});

export default function Warehouse() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch inventory data
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error('فشل في جلب بيانات المخزون');
      return response.json();
    }
  });

  // Fetch inventory stats
  const { data: stats } = useQuery({
    queryKey: ['/api/inventory/stats'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/stats');
      if (!response.ok) throw new Error('فشل في جلب إحصائيات المخزون');
      return response.json();
    }
  });

  // Fetch items for dropdown
  const { data: items = [] } = useQuery({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('فشل في جلب الأصناف');
      return response.json();
    }
  });

  // Fetch locations for dropdown
  const { data: locations = [] } = useQuery({
    queryKey: ['/api/locations'],
    queryFn: async () => {
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('فشل في جلب المواقع');
      return response.json();
    }
  });

  // Add/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('فشل في حفظ البيانات');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/stats'] });
      setIsAddDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "تم الحفظ بنجاح",
        description: editingItem ? "تم تحديث صنف المخزون" : "تم إضافة صنف المخزون"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('فشل في الحذف');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory/stats'] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف صنف المخزون"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الصنف",
        variant: "destructive"
      });
    }
  });

  const form = useForm({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      item_id: "",
      location_id: "",
      current_stock: "",
      min_stock: "",
      max_stock: "",
      unit: "كيلو",
      cost_per_unit: ""
    }
  });

  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return { status: "منخفض", color: "destructive", icon: AlertTriangle };
    if (current >= max) return { status: "مرتفع", color: "warning", icon: TrendingUp };
    return { status: "طبيعي", color: "success", icon: Package };
  };

  const filteredItems = inventoryItems.filter((item: any) => 
    (item.item_name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.item_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category_name_ar || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      item_id: item.item_id,
      location_id: item.location_id?.toString() || "",
      current_stock: item.current_stock?.toString() || "0",
      min_stock: item.min_stock?.toString() || "0",
      max_stock: item.max_stock?.toString() || "0",
      unit: item.unit || "كيلو",
      cost_per_unit: item.cost_per_unit?.toString() || "0"
    });
    setIsAddDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({
      item_id: "",
      location_id: "",
      current_stock: "",
      min_stock: "",
      max_stock: "",
      unit: "كيلو",
      cost_per_unit: ""
    });
    setIsAddDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة المستودع</h1>
            <p className="text-gray-600">متابعة وإدارة المخزون والمواد الخام والمنتجات النهائية</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الأصناف</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
                <p className="text-xs text-muted-foreground">صنف نشط</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أصناف منخفضة</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats?.lowStockItems || 0}</div>
                <p className="text-xs text-muted-foreground">تحتاج إعادة تموين</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalValue ? `${Number(stats.totalValue).toLocaleString()} د.ع` : '0 د.ع'}</div>
                <p className="text-xs text-muted-foreground">القيمة الإجمالية</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">حركات اليوم</CardTitle>
                <TrendingDown className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.movementsToday || 0}</div>
                <p className="text-xs text-muted-foreground">عملية دخول وخروج</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="inventory">المخزون الحالي</TabsTrigger>
              <TabsTrigger value="movements">حركات المخزون</TabsTrigger>
              <TabsTrigger value="locations">المواقع</TabsTrigger>
              <TabsTrigger value="reports">التقارير</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>بيانات المخزون</CardTitle>
                    <div className="flex space-x-2 space-x-reverse">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="البحث في المخزون..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={handleAdd}>
                            <Plus className="h-4 w-4 mr-2" />
                            إضافة صنف
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{editingItem ? 'تعديل صنف المخزون' : 'إضافة صنف جديد للمخزون'}</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="item_id"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الصنف</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="اختر الصنف" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {items.map((item: any) => (
                                          <SelectItem key={item.id} value={item.id}>
                                            {item.name_ar} ({item.code})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="location_id"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الموقع</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="اختر الموقع" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {locations.map((location: any) => (
                                          <SelectItem key={location.id} value={location.id.toString()}>
                                            {location.name_ar}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="current_stock"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>المخزون الحالي</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" step="0.01" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="unit"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الوحدة</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="كيلو">كيلو</SelectItem>
                                          <SelectItem value="قطعة">قطعة</SelectItem>
                                          <SelectItem value="طن">طن</SelectItem>
                                          <SelectItem value="متر">متر</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="min_stock"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الحد الأدنى</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" step="0.01" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="max_stock"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الحد الأقصى</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" step="0.01" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="cost_per_unit"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>التكلفة لكل وحدة</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex justify-end space-x-2 space-x-reverse">
                                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                  إلغاء
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                  {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="text-center py-8">جاري التحميل...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصنف</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المخزون الحالي</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحد الأدنى</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحد الأقصى</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموقع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد أصناف في المخزون'}
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map((item: any) => {
                              const currentStock = parseFloat(item.current_stock || 0);
                              const minStock = parseFloat(item.min_stock || 0);
                              const maxStock = parseFloat(item.max_stock || 0);
                              const stockInfo = getStockStatus(currentStock, minStock, maxStock);
                              const StatusIcon = stockInfo.icon;
                              
                              return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{item.item_name_ar || item.item_name}</div>
                                      <div className="text-sm text-gray-500">{item.item_code}</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">{item.category_name_ar || item.category_name || '-'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {currentStock.toLocaleString()} {item.unit}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {minStock.toLocaleString()} {item.unit}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {maxStock.toLocaleString()} {item.unit}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">{item.location_name_ar || item.location_name || '-'}</td>
                                  <td className="px-6 py-4">
                                    <Badge variant={stockInfo.color === 'success' ? 'default' : stockInfo.color === 'warning' ? 'secondary' : 'destructive'} className="flex items-center space-x-1 w-fit">
                                      <StatusIcon className="h-3 w-3" />
                                      <span>{stockInfo.status}</span>
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex space-x-2 space-x-reverse">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(item)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => deleteMutation.mutate(item.id)}
                                        disabled={deleteMutation.isPending}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="movements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>حركات المخزون</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">سيتم إضافة تتبع حركات المخزون قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة المواقع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">سيتم إضافة إدارة مواقع المستودعات قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تقارير المستودع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">سيتم إضافة تقارير المستودع قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}