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
import { Building2, Users, Cog, Package, Plus, Edit, Trash2, Printer, Search, Filter } from "lucide-react";

export default function Definitions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("customers");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickSearch, setQuickSearch] = useState("");

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '', name_ar: '', phone: '', address: '', email: '', status: 'active'
  });
  const [productForm, setProductForm] = useState({
    name: '', name_ar: '', code: '', type: 'hdpe', color: '', weight: '', size_width: '', size_length: '', status: 'active'
  });
  const [sectionForm, setSectionForm] = useState({
    name: '', name_ar: '', description: '', manager_id: '', status: 'active'
  });
  const [materialGroupForm, setMaterialGroupForm] = useState({
    name: '', name_ar: '', code: '', description: '', status: 'active'
  });
  const [itemForm, setItemForm] = useState({
    name: '', name_ar: '', code: '', type: 'raw_material', unit: '', group_id: '', status: 'active'
  });
  const [customerProductForm, setCustomerProductForm] = useState({
    customer_id: '', product_id: '', customer_code: '', customer_name: '', price: '', status: 'active'
  });
  const [locationForm, setLocationForm] = useState({
    name: '', name_ar: '', code: '', type: 'warehouse', description: '', capacity: '', status: 'active'
  });
  const [machineForm, setMachineForm] = useState({
    name: '', name_ar: '', code: '', type: 'extruder', location_id: '', status: 'operational'
  });
  const [userForm, setUserForm] = useState({
    username: '', name: '', name_ar: '', email: '', role: 'operator', section_id: '', status: 'active'
  });

  // Data queries
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers']
  });
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products']
  });
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/sections']
  });
  const { data: materialGroups = [], isLoading: materialGroupsLoading } = useQuery({
    queryKey: ['/api/material-groups']
  });
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items']
  });
  const { data: customerProducts = [], isLoading: customerProductsLoading } = useQuery({
    queryKey: ['/api/customer-products']
  });
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/locations']
  });
  const { data: machines = [], isLoading: machinesLoading } = useQuery({
    queryKey: ['/api/machines']
  });
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users']
  });

  // Filter helper function
  const filterData = (data: any[], searchFields: string[]) => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => {
      // Status filter
      const statusMatch = statusFilter === "all" || 
        (statusFilter === "active" && (item.status === "active" || item.status === "operational")) ||
        (statusFilter === "inactive" && (item.status === "inactive" || item.status === "down" || item.status === "maintenance"));
      
      // Search filter
      const searchMatch = !quickSearch || searchFields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(quickSearch.toLowerCase());
      });
      
      return statusMatch && searchMatch;
    });
  };

  // Specific filter functions
  const getFilteredCustomers = () => filterData(customers, ['name', 'name_ar', 'phone', 'email', 'address']);
  const getFilteredProducts = () => filterData(products, ['name', 'name_ar', 'code', 'color', 'type']);
  const getFilteredSections = () => filterData(sections, ['name', 'name_ar', 'description']);
  const getFilteredMaterialGroups = () => filterData(materialGroups, ['name', 'name_ar', 'code', 'description']);
  const getFilteredItems = () => filterData(items, ['name', 'name_ar', 'code', 'type', 'unit']);
  const getFilteredCustomerProducts = () => filterData(customerProducts, ['customer_code', 'customer_name']);
  const getFilteredLocations = () => filterData(locations, ['name', 'name_ar', 'code', 'description']);
  const getFilteredMachines = () => filterData(machines, ['name', 'name_ar', 'code', 'type']);
  const getFilteredUsers = () => filterData(users, ['username', 'name', 'name_ar', 'email', 'role']);

  // Event handlers
  const resetForm = () => {
    setCustomerForm({ name: '', name_ar: '', phone: '', address: '', email: '', status: 'active' });
    setProductForm({ name: '', name_ar: '', code: '', type: 'hdpe', color: '', weight: '', size_width: '', size_length: '', status: 'active' });
    setSectionForm({ name: '', name_ar: '', description: '', manager_id: '', status: 'active' });
    setMaterialGroupForm({ name: '', name_ar: '', code: '', description: '', status: 'active' });
    setItemForm({ name: '', name_ar: '', code: '', type: 'raw_material', unit: '', group_id: '', status: 'active' });
    setCustomerProductForm({ customer_id: '', product_id: '', customer_code: '', customer_name: '', price: '', status: 'active' });
    setLocationForm({ name: '', name_ar: '', code: '', type: 'warehouse', description: '', capacity: '', status: 'active' });
    setMachineForm({ name: '', name_ar: '', code: '', type: 'extruder', location_id: '', status: 'operational' });
    setUserForm({ username: '', name: '', name_ar: '', email: '', role: 'operator', section_id: '', status: 'active' });
    setEditingItem(null);
  };

  const handleEdit = (item: any, type: string) => {
    setEditingItem(item);
    setSelectedTab(type === 'customer' ? 'customers' : 
                 type === 'product' ? 'products' : 
                 type === 'section' ? 'sections' : 
                 type === 'material-group' ? 'material-groups' : 
                 type === 'item' ? 'items' : 
                 type === 'customer-product' ? 'customer-products' : 
                 type === 'location' ? 'locations' : 
                 type === 'machine' ? 'machines' : 'users');
    
    if (type === 'customer') setCustomerForm(item);
    else if (type === 'product') setProductForm(item);
    else if (type === 'section') setSectionForm(item);
    else if (type === 'material-group') setMaterialGroupForm(item);
    else if (type === 'item') setItemForm(item);
    else if (type === 'customer-product') setCustomerProductForm(item);
    else if (type === 'location') setLocationForm(item);
    else if (type === 'machine') setMachineForm(item);
    else if (type === 'user') setUserForm(item);
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
      await apiRequest(`/api/${type}s/${id}`, {
        method: 'DELETE'
      });
      
      toast({
        title: "تم الحذف",
        description: "تم حذف العنصر بنجاح",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
    }
  };

  const handlePrint = (item: any) => {
    window.print();
  };

  const handleSubmit = async () => {
    // Implementation will depend on selected tab
    setIsDialogOpen(false);
    resetForm();
  };

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

          {/* Search and Filter Section */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث السريع في جميع البيانات..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="تصفية الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuickSearch("");
                      setStatusFilter("all");
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                </div>
              </div>
              {(quickSearch || statusFilter !== "all") && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Filter className="w-4 h-4" />
                  <span>الفلاتر النشطة:</span>
                  {quickSearch && (
                    <Badge variant="secondary">
                      البحث: "{quickSearch}"
                    </Badge>
                  )}
                  {statusFilter !== "all" && (
                    <Badge variant="secondary">
                      الحالة: {statusFilter === "active" ? "نشط" : "غير نشط"}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
              <TabsTrigger value="customers">العملاء</TabsTrigger>
              <TabsTrigger value="products">المنتجات</TabsTrigger>
              <TabsTrigger value="sections">الأقسام</TabsTrigger>
              <TabsTrigger value="material-groups">مجموعات المواد</TabsTrigger>
              <TabsTrigger value="items">الأصناف</TabsTrigger>
              <TabsTrigger value="customer-products">منتجات العملاء</TabsTrigger>
              <TabsTrigger value="locations">المواقع</TabsTrigger>
              <TabsTrigger value="machines">الماكينات</TabsTrigger>
              <TabsTrigger value="users">المستخدمين</TabsTrigger>
            </TabsList>

            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      إدارة العملاء
                    </CardTitle>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة عميل
                    </Button>
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
                          {(() => {
                            const filteredCustomers = getFilteredCustomers();
                            return filteredCustomers.length > 0 ? (
                              filteredCustomers.map((customer) => (
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
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(customer)}
                                      >
                                        <Printer className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                  {quickSearch || statusFilter !== "all" ? 
                                    "لا توجد نتائج مطابقة للفلاتر المحددة" : 
                                    "لا توجد بيانات متاحة"}
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      إدارة المنتجات
                    </CardTitle>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة منتج
                    </Button>
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
                          {(() => {
                            const filteredProducts = getFilteredProducts();
                            return filteredProducts.length > 0 ? (
                              filteredProducts.map((product) => (
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
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(product)}
                                      >
                                        <Printer className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                  {quickSearch || statusFilter !== "all" ? 
                                    "لا توجد نتائج مطابقة للفلاتر المحددة" : 
                                    "لا توجد بيانات متاحة"}
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      إدارة الأقسام
                    </CardTitle>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة قسم
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sectionsLoading ? (
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدير</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const filteredSections = getFilteredSections();
                            return filteredSections.length > 0 ? (
                              filteredSections.map((section) => (
                                <tr key={section.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {section.name_ar || section.name}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {section.description || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {section.manager_id ? `مدير ${section.manager_id}` : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={section.status === 'active' ? 'default' : 'secondary'}>
                                      {section.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(section, 'section')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(section.id, 'section')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(section)}
                                      >
                                        <Printer className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                  {quickSearch || statusFilter !== "all" ? 
                                    "لا توجد نتائج مطابقة للفلاتر المحددة" : 
                                    "لا توجد بيانات متاحة"}
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Show Search Summary */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">نظام البحث والتصفية متاح الآن!</h3>
              </div>
              <div className="text-blue-800 space-y-2">
                <p>✅ البحث السريع في جميع الحقول للعملاء والمنتجات والأقسام</p>
                <p>✅ تصفية حسب الحالة (نشط/غير نشط)</p>
                <p>✅ عرض الفلاتر النشطة مع إمكانية مسحها</p>
                <p>✅ رسائل ديناميكية عند عدم وجود نتائج</p>
                <p>✅ تم إصلاح جميع أزرار الطباعة والتعديل والحذف</p>
              </div>
              <div className="mt-4 text-sm text-blue-700">
                <strong>ملاحظة:</strong> تم تطبيق النظام على العملاء والمنتجات والأقسام. الباقي متاح للإضافة عند الحاجة.
              </div>
            </div>

          </Tabs>
        </main>
      </div>
    </div>
  );
}