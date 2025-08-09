import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Users, Cog, Package, Plus, Edit, Trash2, Printer, Search, Filter, MapPin, Settings, User, Copy } from "lucide-react";
import { formatNumber } from "@/lib/formatNumber";

export default function Definitions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Clear cache on component mount to ensure fresh data
  useEffect(() => {
    queryClient.clear();
  }, []);

  const [selectedTab, setSelectedTab] = useState("customers");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickSearch, setQuickSearch] = useState("");

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '', name_ar: '', code: '', user_id: '', plate_drawer_code: '', city: '', address: '', 
    tax_number: '', phone: '', sales_rep_id: ''
  });
  const [sectionForm, setSectionForm] = useState({
    name: '', name_ar: '', description: ''
  });
  const [itemForm, setItemForm] = useState({
    name: '', name_ar: '', code: '', category_id: 'none', status: 'active'
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '', name_ar: '', code: '', parent_id: 'none', description: '', status: 'active'
  });
  const [customerProductForm, setCustomerProductForm] = useState({
    customer_id: 'none', 
    category_id: 'none',
    item_id: 'none', 
    size_caption: '', 
    width: '', 
    left_facing: '', 
    right_facing: '', 
    thickness: '', 
    printing_cylinder: 'بدون طباعة', 
    cutting_length_cm: '', 
    raw_material: '', 
    master_batch_id: '', 
    is_printed: false, 
    cutting_unit: '', 
    punching: '', 
    unit_weight_kg: '', 
    unit_quantity: '', 
    package_weight_kg: '', 
    cliche_front_design: '', 
    cliche_back_design: '', 
    notes: '', 
    status: 'active'
  });
  const [locationForm, setLocationForm] = useState({
    name: '', name_ar: '', type: 'city', parent_id: '', coordinates: '', status: 'active'
  });
  const [machineForm, setMachineForm] = useState({
    name: '', name_ar: '', type: 'extruder', section_id: '', status: 'active'
  });
  const [userForm, setUserForm] = useState({
    username: '', display_name: '', display_name_ar: '', role_id: '', section_id: '', status: 'active'
  });

  // Data queries
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
    staleTime: 0,
  });
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/sections'],
    staleTime: 0,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 0,
  });
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items'],
    staleTime: 0,
  });
  const { data: customerProducts = [], isLoading: customerProductsLoading } = useQuery({
    queryKey: ['/api/customer-products'],
    staleTime: 0,
  });
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/locations'],
    staleTime: 0,
  });
  const { data: machines = [], isLoading: machinesLoading } = useQuery({
    queryKey: ['/api/machines'],
    staleTime: 0,
  });
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 0,
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
  const getFilteredCustomers = () => filterData(customers as any[], ['name', 'name_ar', 'phone', 'email', 'address']);
  const getFilteredSections = () => filterData(sections as any[], ['name', 'name_ar', 'description']);
  const getFilteredCategories = () => filterData(categories as any[], ['name', 'name_ar', 'code', 'description']);
  const getFilteredItems = () => filterData(items as any[], ['name', 'name_ar', 'code']);
  const getFilteredCustomerProducts = () => filterData(customerProducts as any[], ['customer_code', 'customer_name']);
  const getFilteredLocations = () => filterData(locations as any[], ['name', 'name_ar', 'code', 'description']);
  const getFilteredMachines = () => filterData(machines as any[], ['name', 'name_ar', 'code', 'type']);
  const getFilteredUsers = () => filterData(users as any[], ['username', 'name', 'name_ar', 'email', 'role']);

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء الفئة بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في إنشاء الفئة:', error);
      toast({ title: "خطأ في إنشاء الفئة", variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث الفئة بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث الفئة:', error);
      toast({ title: "خطأ في تحديث الفئة", variant: "destructive" });
    }
  });

  // Event handlers
  const resetForm = () => {
    setCustomerForm({ name: '', name_ar: '', code: '', user_id: '', plate_drawer_code: '', city: '', address: '', tax_number: '', phone: '', sales_rep_id: '' });
    setSectionForm({ name: '', name_ar: '', description: '' });
    setCategoryForm({ name: '', name_ar: '', code: '', parent_id: 'none', description: '', status: 'active' });
    setItemForm({ name: '', name_ar: '', code: '', category_id: 'none', status: 'active' });
    setCustomerProductForm({ 
      customer_id: 'none', 
      category_id: 'none',
      item_id: 'none', 
      size_caption: '', 
      width: '', 
      left_facing: '', 
      right_facing: '', 
      thickness: '', 
      printing_cylinder: 'بدون طباعة', 
      cutting_length_cm: '', 
      raw_material: '', 
      master_batch_id: '', 
      is_printed: false, 
      cutting_unit: '', 
      punching: '', 
      unit_weight_kg: '', 
      unit_quantity: '', 
      package_weight_kg: '', 
      cliche_front_design: '', 
      cliche_back_design: '', 
      notes: '', 
      status: 'active' 
    });
    setLocationForm({ name: '', name_ar: '', type: 'city', parent_id: '', coordinates: '', status: 'active' });
    setMachineForm({ name: '', name_ar: '', type: 'extruder', section_id: '', status: 'active' });
    setUserForm({ username: '', display_name: '', display_name_ar: '', role_id: '', section_id: '', status: 'active' });
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-screen">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:mr-64 p-4 lg:p-6"
              style={{ marginRight: 'calc(16rem + 0.5rem)' }}>
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">التعريفات الأساسية</h1>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="البحث السريع..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="فلترة الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="w-full">
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 w-full">
                <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full h-auto p-1 bg-white rounded-lg border border-gray-200 shadow-sm gap-1"
                  dir="rtl">
                  <TabsTrigger 
                    value="customers" 
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                             text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium
                             transition-all duration-200 rounded-md min-w-0 flex-1"
                  >
                    العملاء
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sections"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                             text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium
                             transition-all duration-200 rounded-md min-w-0 flex-1"
                  >
                    الأقسام
                  </TabsTrigger>
                  <TabsTrigger 
                    value="categories"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                             text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium
                             transition-all duration-200 rounded-md min-w-0 flex-1"
                  >
                    الفئات
                  </TabsTrigger>
                  <TabsTrigger 
                    value="items"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                             text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium
                             transition-all duration-200 rounded-md min-w-0 flex-1"
                  >
                    الأصناف
                  </TabsTrigger>
                  <TabsTrigger 
                    value="customer-products"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                             text-gray-600 hover:text-blue-600 px-2 py-2 text-xs font-medium
                             transition-all duration-200 rounded-md min-w-0 flex-1"
                  >
                    منتجات العملاء
                  </TabsTrigger>
                  <TabsTrigger 
                    value="locations"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                             text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium
                             transition-all duration-200 rounded-md min-w-0 flex-1"
                  >
                    المواقع
                  </TabsTrigger>
                  <TabsTrigger 
                    value="machines"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                             text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium
                             transition-all duration-200 rounded-md min-w-0 flex-1"
                  >
                    الماكينات
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users"
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 
                             text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium
                             transition-all duration-200 rounded-md min-w-0 flex-1"
                  >
                    المستخدمين
                  </TabsTrigger>
                </TabsList>

              {/* Customers Tab */}
              <TabsContent value="customers" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        إدارة العملاء
                      </CardTitle>
                      <Button onClick={() => { resetForm(); setSelectedTab('customers'); setIsDialogOpen(true); }}>
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
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم العربي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الإنجليزي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المدينة</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const filteredCustomers = getFilteredCustomers();
                              return filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer: any) => (
                                  <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {customer.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {customer.name_ar || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {customer.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {customer.phone || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {customer.city || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => console.log('Edit customer', customer)}
                                        >
                                          <Edit className="w-4 h-4" />
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

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        إدارة الفئات
                      </CardTitle>
                      <Button onClick={() => { resetForm(); setSelectedTab('categories'); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة فئة
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {categoriesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم العربي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الإنجليزي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const filteredCategories = getFilteredCategories();
                              return filteredCategories.length > 0 ? (
                                filteredCategories.map((category: any) => (
                                  <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {category.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {category.name_ar || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {category.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {category.code || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => {
                                            setEditingItem(category);
                                            setCategoryForm({
                                              name: category.name || '',
                                              name_ar: category.name_ar || '',
                                              code: category.code || '',
                                              parent_id: category.parent_id || 'none',
                                              description: category.description || '',
                                              status: category.status || 'active'
                                            });
                                            setIsDialogOpen(true);
                                          }}
                                        >
                                          <Edit className="w-4 h-4" />
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
              
              {/* Sections Tab */}
              <TabsContent value="sections" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Cog className="w-5 h-5" />
                        إدارة الأقسام
                      </CardTitle>
                      <Button onClick={() => { resetForm(); setSelectedTab('sections'); setIsDialogOpen(true); }}>
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
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم العربي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الإنجليزي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const filteredSections = getFilteredSections();
                              return filteredSections.length > 0 ? (
                                filteredSections.map((section: any) => (
                                  <tr key={section.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {section.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {section.name_ar || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {section.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {section.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => console.log('Edit section', section)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    لا توجد أقسام مطابقة للبحث
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

              {/* Items Tab */}
              <TabsContent value="items" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        إدارة الأصناف
                      </CardTitle>
                      <Button onClick={() => { resetForm(); setSelectedTab('items'); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة صنف
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {itemsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم العربي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الإنجليزي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const filteredItems = getFilteredItems();
                              return filteredItems.length > 0 ? (
                                filteredItems.map((item: any) => (
                                  <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {item.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {item.name_ar || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {item.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {item.category_id || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => console.log('Edit item', item)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    لا توجد أصناف مطابقة للبحث
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

              {/* Customer Products Tab */}
              <TabsContent value="customer-products" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        منتجات العملاء
                      </CardTitle>
                      <Button onClick={() => { resetForm(); setSelectedTab('customer-products'); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة منتج
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {customerProductsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحجم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const filteredCustomerProducts = getFilteredCustomerProducts();
                              return filteredCustomerProducts.length > 0 ? (
                                filteredCustomerProducts.map((product: any) => (
                                  <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {product.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {product.customer_id || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {product.category_id || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {product.size_caption || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => console.log('Edit customer product', product)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    لا توجد منتجات مطابقة للبحث
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

              {/* Locations Tab */}
              <TabsContent value="locations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        إدارة المواقع
                      </CardTitle>
                      <Button onClick={() => { resetForm(); setSelectedTab('locations'); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة موقع
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {locationsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم العربي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الإنجليزي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const filteredLocations = getFilteredLocations();
                              return filteredLocations.length > 0 ? (
                                filteredLocations.map((location: any) => (
                                  <tr key={location.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {location.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {location.name_ar || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {location.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {location.type || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => console.log('Edit location', location)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    لا توجد مواقع مطابقة للبحث
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

              {/* Machines Tab */}
              <TabsContent value="machines" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        إدارة الماكينات
                      </CardTitle>
                      <Button onClick={() => { resetForm(); setSelectedTab('machines'); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة ماكينة
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {machinesLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم العربي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الإنجليزي</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const filteredMachines = getFilteredMachines();
                              return filteredMachines.length > 0 ? (
                                filteredMachines.map((machine: any) => (
                                  <tr key={machine.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {machine.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {machine.name_ar || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {machine.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {machine.type || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => console.log('Edit machine', machine)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    لا توجد ماكينات مطابقة للبحث
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

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        إدارة المستخدمين
                      </CardTitle>
                      <Button onClick={() => { resetForm(); setSelectedTab('users'); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة مستخدم
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم المستخدم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(() => {
                              const filteredUsers = getFilteredUsers();
                              return filteredUsers.length > 0 ? (
                                filteredUsers.map((user: any) => (
                                  <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {user.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {user.username || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {user.display_name || user.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {user.role || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => console.log('Edit user', user)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    لا توجد مستخدمين مطابقة للبحث
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
              </Tabs>
            </div>
            
            {/* Category Add/Edit Dialog */}
            {selectedTab === 'categories' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث الفئة" : "إضافة فئة جديدة"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={categoryForm.name_ar}
                          onChange={(e) => setCategoryForm({...categoryForm, name_ar: e.target.value})}
                          placeholder="اسم الفئة بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                          placeholder="Category Name"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="code">الكود</Label>
                        <Input
                          id="code"
                          value={categoryForm.code}
                          onChange={(e) => setCategoryForm({...categoryForm, code: e.target.value})}
                          placeholder="كود الفئة (اختياري)"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="parent_id">الفئة الرئيسية</Label>
                        <Select 
                          value={categoryForm.parent_id} 
                          onValueChange={(value) => setCategoryForm({...categoryForm, parent_id: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الفئة الرئيسية" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون فئة رئيسية</SelectItem>
                            {Array.isArray(categories) && categories.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name_ar || cat.name} ({cat.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Input
                        id="description"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        placeholder="وصف الفئة (اختياري)"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status">الحالة</Label>
                      <Select 
                        value={categoryForm.status} 
                        onValueChange={(value) => setCategoryForm({...categoryForm, status: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="inactive">غير نشط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateCategoryMutation.mutate({ 
                            id: editingItem.id, 
                            data: categoryForm 
                          });
                        } else {
                          createCategoryMutation.mutate(categoryForm);
                        }
                      }}
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {createCategoryMutation.isPending || updateCategoryMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : (
                        editingItem ? "تحديث" : "حفظ"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}