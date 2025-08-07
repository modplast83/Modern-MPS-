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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, FileText, Clock, User, Edit, Trash2, Eye, Calendar } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const orderFormSchema = z.object({
  customer_id: z.string().min(1, "العميل مطلوب"),
  delivery_days: z.string().transform(val => parseInt(val)),
  notes: z.string().optional(),
  production_orders: z.array(z.object({
    customer_product_id: z.number(),
    quantity_kg: z.number(),
    status: z.string()
  })).min(1, "يجب إضافة أمر إنتاج واحد على الأقل")
});

const productionOrderFormSchema = z.object({
  order_id: z.string().transform(val => parseInt(val)),
  customer_product_id: z.string().transform(val => parseInt(val)),
  quantity_kg: z.string().transform(val => parseFloat(val)),
  status: z.string().min(1, "الحالة مطلوبة"),
});

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isProductionOrderDialogOpen, setIsProductionOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingProductionOrder, setEditingProductionOrder] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [productionOrdersInForm, setProductionOrdersInForm] = useState<any[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch orders data
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('فشل في جلب الطلبات');
      return response.json();
    }
  });

  // Fetch production orders
  const { data: productionOrders = [] } = useQuery({
    queryKey: ['/api/production-orders'],
    queryFn: async () => {
      const response = await fetch('/api/production-orders');
      if (!response.ok) throw new Error('فشل في جلب أوامر الإنتاج');
      return response.json();
    }
  });

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('فشل في جلب العملاء');
      return response.json();
    }
  });

  // Fetch customer products for dropdown
  const { data: customerProducts = [] } = useQuery({
    queryKey: ['/api/customer-products'],
    queryFn: async () => {
      const response = await fetch('/api/customer-products');
      if (!response.ok) throw new Error('فشل في جلب منتجات العملاء');
      return response.json();
    }
  });

  // Fetch users for dropdown
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('فشل في جلب المستخدمين');
      return response.json();
    }
  });

  // Order mutations
  const orderMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingOrder ? `/api/orders/${editingOrder.id}` : '/api/orders';
      const method = editingOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('فشل في حفظ البيانات');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsOrderDialogOpen(false);
      setEditingOrder(null);
      toast({
        title: "تم الحفظ بنجاح",
        description: editingOrder ? "تم تحديث الطلب" : "تم إضافة الطلب"
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

  // Production order mutations
  const productionOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingProductionOrder ? `/api/production-orders/${editingProductionOrder.id}` : '/api/production-orders';
      const method = editingProductionOrder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('فشل في حفظ البيانات');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders'] });
      setIsProductionOrderDialogOpen(false);
      setEditingProductionOrder(null);
      toast({
        title: "تم الحفظ بنجاح",
        description: editingProductionOrder ? "تم تحديث أمر الإنتاج" : "تم إضافة أمر الإنتاج"
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

  // Forms
  const orderForm = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer_id: "",
      delivery_days: "",
      notes: "",
      production_orders: []
    }
  });

  // Filter customer products by selected customer
  const filteredCustomerProducts = customerProducts.filter((product: any) => 
    product.customer_id === selectedCustomerId
  );



  // Filter customers for search
  const filteredCustomers = customers.filter((customer: any) =>
    customer.name_ar?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const productionOrderForm = useForm({
    resolver: zodResolver(productionOrderFormSchema),
    defaultValues: {
      order_id: "",
      production_order_number: "",
      customer_product_id: "",
      quantity_kg: "",
      status: "pending"
    }
  });

  // Filter orders
  const filteredOrders = orders.filter((order: any) =>
    (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter production orders for selected order
  const filteredProductionOrders = selectedOrderId
    ? productionOrders.filter((po: any) => po.order_id === selectedOrderId)
    : productionOrders;

  const handleAddOrder = () => {
    setEditingOrder(null);
    orderForm.reset({
      customer_id: "",
      delivery_days: "",
      notes: "",
      production_orders: []
    });
    setIsOrderDialogOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    orderForm.reset({
      customer_id: order.customer_id?.toString() || "",
      delivery_days: order.delivery_days?.toString() || "",
      notes: order.notes || "",
      production_orders: []
    });
    setIsOrderDialogOpen(true);
  };

  const handleAddProductionOrder = (orderId?: number) => {
    setEditingProductionOrder(null);
    productionOrderForm.reset({
      order_id: orderId ? orderId.toString() : "",
      production_order_number: "",
      customer_product_id: "",
      quantity_kg: "",
      status: "pending"
    });
    setIsProductionOrderDialogOpen(true);
  };

  const handleEditProductionOrder = (productionOrder: any) => {
    setEditingProductionOrder(productionOrder);
    productionOrderForm.reset({
      order_id: productionOrder.order_id?.toString() || "",
      production_order_number: productionOrder.production_order_number || "",
      customer_product_id: productionOrder.customer_product_id?.toString() || "",
      quantity_kg: productionOrder.quantity_kg?.toString() || "",
      status: productionOrder.status || "pending"
    });
    setIsProductionOrderDialogOpen(true);
  };

  const onOrderSubmit = async (data: any) => {
    try {
      // Create the order first
      const orderData = {
        customer_id: data.customer_id,
        delivery_days: data.delivery_days,
        notes: data.notes,
        created_by: 1
      };
      
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!orderResponse.ok) throw new Error('فشل في إنشاء الطلب');
      
      const newOrder = await orderResponse.json();
      
      // Create production orders
      for (const prodOrder of productionOrdersInForm) {
        await fetch('/api/production-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: newOrder.id,
            customer_product_id: prodOrder.customer_product_id,
            quantity_kg: prodOrder.quantity_kg,
            status: prodOrder.status || 'pending'
          })
        });
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders'] });
      
      // Reset form
      setIsOrderDialogOpen(false);
      setProductionOrdersInForm([]);
      setSelectedCustomerId("");
      setCustomerSearchTerm("");
      orderForm.reset();
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم إضافة الطلب وأوامر الإنتاج"
      });
      
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive"
      });
    }
  };

  const addProductionOrder = () => {
    if (!selectedCustomerId) {
      toast({
        title: "تحذير",
        description: "يجب اختيار العميل أولاً",
        variant: "destructive"
      });
      return;
    }
    
    setProductionOrdersInForm([
      ...productionOrdersInForm,
      {
        customer_product_id: "",
        quantity_kg: 0,
        status: "pending"
      }
    ]);
  };

  const removeProductionOrder = (index: number) => {
    const updated = productionOrdersInForm.filter((_, i) => i !== index);
    setProductionOrdersInForm(updated);
  };

  const updateProductionOrder = (index: number, field: string, value: any) => {
    const updated = [...productionOrdersInForm];
    updated[index] = { ...updated[index], [field]: value };
    setProductionOrdersInForm(updated);
  };

  const onProductionOrderSubmit = (data: any) => {
    productionOrderMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "في الانتظار", variant: "secondary" as const },
      in_progress: { label: "قيد التنفيذ", variant: "default" as const },
      completed: { label: "مكتمل", variant: "default" as const },
      cancelled: { label: "ملغي", variant: "destructive" as const }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الطلبات والإنتاج</h1>
            <p className="text-gray-600">متابعة وإدارة طلبات العملاء وأوامر الإنتاج</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">طلب نشط</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">أوامر الإنتاج</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productionOrders.length}</div>
                <p className="text-xs text-muted-foreground">أمر إنتاج</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">قيد التنفيذ</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {productionOrders.filter((po: any) => po.status === 'in_progress').length}
                </div>
                <p className="text-xs text-muted-foreground">أمر قيد التنفيذ</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مكتملة</CardTitle>
                <Package className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {productionOrders.filter((po: any) => po.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">أمر مكتمل</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">الطلبات</TabsTrigger>
              <TabsTrigger value="production-orders">أوامر الإنتاج</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>إدارة الطلبات</CardTitle>
                    <div className="flex space-x-2 space-x-reverse">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="البحث في الطلبات..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={handleAddOrder}>
                            <Plus className="h-4 w-4 mr-2" />
                            إضافة طلب
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>إضافة طلب جديد</DialogTitle>
                          </DialogHeader>
                          <Form {...orderForm}>
                            <form onSubmit={orderForm.handleSubmit(onOrderSubmit)} className="space-y-6">
                              {/* Order Info Section */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">رقم الطلب</label>
                                  <div className="text-lg font-bold text-blue-600">سيتم توليده تلقائياً</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">التاريخ</label>
                                  <div className="text-lg font-bold text-gray-900">
                                    {format(new Date(), 'dd/MM/yyyy')}
                                  </div>
                                </div>
                              </div>

                              {/* Customer Selection with Search */}
                              <FormField
                                control={orderForm.control}
                                name="customer_id"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>العميل</FormLabel>
                                    <div className="space-y-2">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                          placeholder="البحث بالاسم العربي أو الإنجليزي..."
                                          value={customerSearchTerm}
                                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                          className="pl-10"
                                        />
                                      </div>
                                      <Select 
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          setSelectedCustomerId(value);
                                        }} 
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="اختر العميل" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {filteredCustomers.map((customer: any) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                              {customer.name_ar || customer.name} ({customer.id})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={orderForm.control}
                                  name="delivery_days"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>مدة التسليم (بالأيام)</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="number" placeholder="عدد الأيام" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={orderForm.control}
                                  name="notes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>ملاحظات</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} placeholder="ملاحظات إضافية" rows={1} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {/* Production Orders Section */}
                              <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold">أوامر الإنتاج</h3>
                                  <Button
                                    type="button"
                                    onClick={addProductionOrder}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    إضافة أمر إنتاج
                                  </Button>
                                </div>
                                
                                {productionOrdersInForm.length === 0 && (
                                  <div className="text-center py-8 text-gray-500">
                                    يجب إضافة أمر إنتاج واحد على الأقل
                                  </div>
                                )}

                                <div className="space-y-4">
                                  {productionOrdersInForm.map((prodOrder, index) => (
                                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                      <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium">أمر إنتاج #{index + 1}</h4>
                                        <Button
                                          type="button"
                                          onClick={() => removeProductionOrder(index)}
                                          variant="ghost"
                                          size="sm"
                                        >
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">منتج العميل</label>
                                          <Select 
                                            onValueChange={(value) => updateProductionOrder(index, 'customer_product_id', parseInt(value))}
                                            value={prodOrder.customer_product_id?.toString() || ""}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="اختر المنتج" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {filteredCustomerProducts.map((product: any) => (
                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                  {product.customer_name_ar || product.customer_name || 'عميل غير محدد'} - {product.raw_material} {product.width}×{product.thickness} ({product.cutting_unit})
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">الكمية (كيلو)</label>
                                          <Input
                                            type="number"
                                            placeholder="الكمية"
                                            value={prodOrder.quantity_kg || ""}
                                            onChange={(e) => updateProductionOrder(index, 'quantity_kg', parseFloat(e.target.value) || 0)}
                                          />
                                        </div>
                                        
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">الحالة</label>
                                          <Select 
                                            onValueChange={(value) => updateProductionOrder(index, 'status', value)}
                                            value={prodOrder.status || "pending"}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">في الانتظار</SelectItem>
                                              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                                              <SelectItem value="completed">مكتمل</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex gap-4 pt-6 border-t">
                                <Button 
                                  type="submit" 
                                  className="flex-1"
                                  disabled={productionOrdersInForm.length === 0}
                                >
                                  إنشاء الطلب وأوامر الإنتاج
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setIsOrderDialogOpen(false)}
                                  className="flex-1"
                                >
                                  إلغاء
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>مدة التسليم</TableHead>
                        <TableHead>ملاحظات</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.customer_id}</TableCell>
                          <TableCell>
                            {order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell>{order.created_by}</TableCell>
                          <TableCell>{order.delivery_days} يوم</TableCell>
                          <TableCell>{order.notes || '-'}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  handleAddProductionOrder(order.id);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOrder(order)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="production-orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>أوامر الإنتاج</CardTitle>
                    <Dialog open={isProductionOrderDialogOpen} onOpenChange={setIsProductionOrderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleAddProductionOrder()}>
                          <Plus className="h-4 w-4 mr-2" />
                          إضافة أمر إنتاج
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{editingProductionOrder ? 'تعديل أمر الإنتاج' : 'إضافة أمر إنتاج جديد'}</DialogTitle>
                        </DialogHeader>
                        <Form {...productionOrderForm}>
                          <form onSubmit={productionOrderForm.handleSubmit(onProductionOrderSubmit)} className="space-y-4">
                            <FormField
                              control={productionOrderForm.control}
                              name="order_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>الطلب</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="اختر الطلب" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {orders.map((order: any) => (
                                        <SelectItem key={order.id} value={order.id.toString()}>
                                          {order.order_number} - {order.customer_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={productionOrderForm.control}
                              name="production_order_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>رقم أمر الإنتاج</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="رقم أمر الإنتاج" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={productionOrderForm.control}
                              name="customer_product_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>منتج العميل</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-auto min-h-[40px]">
                                        <SelectValue placeholder="اختر المنتج" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="max-w-[700px]">
                                      {customerProducts.map((product: any) => (
                                        <SelectItem key={product.id} value={product.id.toString()}>
                                          <div className="w-full text-right py-2">
                                            <div className="font-semibold text-gray-900 mb-1">
                                              {product.size_caption ? `${product.size_caption}` : 'منتج غير محدد'}
                                            </div>
                                            <div className="text-sm text-gray-600 space-y-1">
                                              {product.raw_material && (
                                                <div>المادة الخام: {product.raw_material}</div>
                                              )}
                                              {product.master_batch_id && (
                                                <div>الماستر باتش: {product.master_batch_id}</div>
                                              )}
                                              {product.punching && (
                                                <div>التخريم: {product.punching}</div>
                                              )}
                                              {product.thickness && (
                                                <div>السماكة: {product.thickness}</div>
                                              )}
                                            </div>
                                          </div>
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
                                control={productionOrderForm.control}
                                name="quantity_kg"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الكمية (كيلو)</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" placeholder="الكمية بالكيلو" className="w-full" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={productionOrderForm.control}
                                name="status"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الحالة</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="اختر الحالة" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="pending">في الانتظار</SelectItem>
                                        <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                                        <SelectItem value="completed">مكتمل</SelectItem>
                                        <SelectItem value="cancelled">ملغي</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex justify-end space-x-2 space-x-reverse">
                              <Button type="button" variant="outline" onClick={() => setIsProductionOrderDialogOpen(false)}>
                                إلغاء
                              </Button>
                              <Button type="submit">
                                {editingProductionOrder ? 'تحديث' : 'إضافة'}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الأمر</TableHead>
                        <TableHead>الطلب</TableHead>
                        <TableHead>المنتج</TableHead>
                        <TableHead>الكمية (كيلو)</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProductionOrders.map((productionOrder: any) => (
                        <TableRow key={productionOrder.id}>
                          <TableCell className="font-medium">{productionOrder.production_order_number}</TableCell>
                          <TableCell>{productionOrder.order_number}</TableCell>
                          <TableCell>{productionOrder.product_name_ar}</TableCell>
                          <TableCell>{productionOrder.quantity_kg}</TableCell>
                          <TableCell>{getStatusBadge(productionOrder.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2 space-x-reverse">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProductionOrder(productionOrder)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}