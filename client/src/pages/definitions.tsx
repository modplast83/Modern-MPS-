import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Users, Cog, Package, Plus, Edit, Trash2, Printer, Search } from "lucide-react";

export default function Definitions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("customers");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ["/api/machines"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: '',
    name_ar: '',
    phone: '',
    address: '',
    status: 'active'
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    name_ar: '',
    code: '',
    type: 'hdpe',
    color: '',
    status: 'active'
  });

  // Machine form state
  const [machineForm, setMachineForm] = useState({
    name: '',
    name_ar: '',
    type: 'extrusion',
    speed_rating: '',
    status: 'active'
  });

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    display_name_ar: '',
    role_id: 3,
    section_id: 1,
    status: 'active'
  });

  // Mutations for CRUD operations
  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/customers', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({ title: "تم الحفظ بنجاح", description: "تم إضافة العميل الجديد" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    }
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/products', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "تم الحفظ بنجاح", description: "تم إضافة المنتج الجديد" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ endpoint, id }: { endpoint: string; id: number }) => 
      apiRequest(`${endpoint}/${id}`, 'DELETE'),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.endpoint] });
      toast({ title: "تم الحذف بنجاح", description: "تم حذف العنصر" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حذف العنصر", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setCustomerForm({ name: '', name_ar: '', phone: '', address: '', status: 'active' });
    setProductForm({ name: '', name_ar: '', code: '', type: 'hdpe', color: '', status: 'active' });
    setMachineForm({ name: '', name_ar: '', type: 'extrusion', speed_rating: '', status: 'active' });
    setUserForm({ username: '', display_name_ar: '', role_id: 3, section_id: 1, status: 'active' });
    setEditingItem(null);
  };

  const handleEdit = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    switch(type) {
      case 'customer':
        setCustomerForm({
          name: item.name || '',
          name_ar: item.name_ar || '',
          phone: item.phone || '',
          address: item.address || '',
          status: item.status || 'active'
        });
        break;
      case 'product':
        setProductForm({
          name: item.name || '',
          name_ar: item.name_ar || '',
          code: item.code || '',
          type: item.type || 'hdpe',
          color: item.color || '',
          status: item.status || 'active'
        });
        break;
      case 'machine':
        setMachineForm({
          name: item.name || '',
          name_ar: item.name_ar || '',
          type: item.type || 'extrusion',
          speed_rating: item.speed_rating?.toString() || '',
          status: item.status || 'active'
        });
        break;
      case 'user':
        setUserForm({
          username: item.username || '',
          display_name_ar: item.display_name_ar || '',
          role_id: item.role_id || 3,
          section_id: item.section_id || 1,
          status: item.status || 'active'
        });
        break;
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number, type: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      const endpoints = {
        customer: '/api/customers',
        product: '/api/products',
        machine: '/api/machines',
        user: '/api/users'
      };
      deleteItemMutation.mutate({ 
        endpoint: endpoints[type as keyof typeof endpoints], 
        id 
      });
    }
  };

  const handleSubmit = () => {
    switch(selectedTab) {
      case 'customers':
        createCustomerMutation.mutate(customerForm);
        break;
      case 'products':
        createProductMutation.mutate(productForm);
        break;
      case 'machines':
        // Machine creation would need API endpoint
        toast({ title: "قريباً", description: "إضافة المكائن قيد التطوير" });
        break;
      case 'users':
        // User creation would need API endpoint
        toast({ title: "قريباً", description: "إضافة المستخدمين قيد التطوير" });
        break;
    }
  };

  const renderCustomerForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer-name-ar">الاسم بالعربية</Label>
          <Input
            id="customer-name-ar"
            value={customerForm.name_ar}
            onChange={(e) => setCustomerForm(prev => ({ ...prev, name_ar: e.target.value }))}
            placeholder="اسم العميل بالعربية"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-name">الاسم بالإنجليزية</Label>
          <Input
            id="customer-name"
            value={customerForm.name}
            onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Customer Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-phone">رقم الهاتف</Label>
          <Input
            id="customer-phone"
            value={customerForm.phone}
            onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+964 XXX XXX XXXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-status">الحالة</Label>
          <Select value={customerForm.status} onValueChange={(value) => setCustomerForm(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer-address">العنوان</Label>
        <Input
          id="customer-address"
          value={customerForm.address}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
          placeholder="عنوان العميل"
        />
      </div>
    </div>
  );

  const renderProductForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-name-ar">اسم المنتج بالعربية</Label>
          <Input
            id="product-name-ar"
            value={productForm.name_ar}
            onChange={(e) => setProductForm(prev => ({ ...prev, name_ar: e.target.value }))}
            placeholder="اسم المنتج بالعربية"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-name">اسم المنتج بالإنجليزية</Label>
          <Input
            id="product-name"
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Product Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-code">كود المنتج</Label>
          <Input
            id="product-code"
            value={productForm.code}
            onChange={(e) => setProductForm(prev => ({ ...prev, code: e.target.value }))}
            placeholder="P-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-type">نوع المنتج</Label>
          <Select value={productForm.type} onValueChange={(value) => setProductForm(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hdpe">HDPE</SelectItem>
              <SelectItem value="ldpe">LDPE</SelectItem>
              <SelectItem value="pp">PP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-color">اللون</Label>
          <Input
            id="product-color"
            value={productForm.color}
            onChange={(e) => setProductForm(prev => ({ ...prev, color: e.target.value }))}
            placeholder="أبيض، أسود، شفاف..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-status">الحالة</Label>
          <Select value={productForm.status} onValueChange={(value) => setProductForm(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">التعريفات الأساسية</h1>
            <p className="text-gray-600">إدارة البيانات الأساسية للنظام</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">العملاء</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(customers) ? customers.length : 0}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المنتجات</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(products) ? products.length : 0}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المكائن</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(machines) ? machines.length : 0}
                    </p>
                  </div>
                  <Cog className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المستخدمين</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(users) ? users.length : 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                العملاء
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                المنتجات
              </TabsTrigger>
              <TabsTrigger value="machines" className="flex items-center gap-2">
                <Cog className="w-4 h-4" />
                المكائن
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                المستخدمين
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      إدارة العملاء
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="البحث في العملاء..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pr-10 w-64"
                        />
                      </div>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { resetForm(); setSelectedTab('customers'); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            إضافة عميل
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {editingItem ? 'تعديل العميل' : 'إضافة عميل جديد'}
                            </DialogTitle>
                          </DialogHeader>
                          {renderCustomerForm()}
                          <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                              إلغاء
                            </Button>
                            <Button onClick={handleSubmit}>
                              {editingItem ? 'تحديث' : 'حفظ'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {customersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(customers) && customers.length > 0 ? (
                            customers
                              .filter(customer => 
                                !searchTerm || 
                                customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                customer.name_ar?.includes(searchTerm)
                              )
                              .map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {customer.name_ar || customer.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.phone || '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {customer.address || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                                      {customer.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(customer, 'customer')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(customer.id, 'customer')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Printer className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                لا توجد بيانات متاحة
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      إدارة المنتجات
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="البحث في المنتجات..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pr-10 w-64"
                        />
                      </div>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { resetForm(); setSelectedTab('products'); }}>
                            <Plus className="w-4 h-4 mr-2" />
                            إضافة منتج
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              {editingItem ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                            </DialogTitle>
                          </DialogHeader>
                          {renderProductForm()}
                          <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                              إلغاء
                            </Button>
                            <Button onClick={handleSubmit}>
                              {editingItem ? 'تحديث' : 'حفظ'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اللون</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(products) && products.length > 0 ? (
                            products
                              .filter(product => 
                                !searchTerm || 
                                product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                product.name_ar?.includes(searchTerm) ||
                                product.code?.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {product.name_ar || product.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.code}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.type === 'hdpe' ? 'HDPE' : 
                                     product.type === 'ldpe' ? 'LDPE' : 
                                     product.type === 'pp' ? 'PP' : product.type}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.color || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                      {product.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(product, 'product')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(product.id, 'product')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button variant="outline" size="sm">
                                        <Printer className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                لا توجد بيانات متاحة
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="machines" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="w-5 h-5" />
                    إدارة المكائن
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Cog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">إدارة المكائن قيد التطوير</p>
                    <p className="text-sm text-gray-500">سيتم إضافة هذه الميزة قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    إدارة المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">إدارة المستخدمين قيد التطوير</p>
                    <p className="text-sm text-gray-500">سيتم إضافة هذه الميزة قريباً</p>
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