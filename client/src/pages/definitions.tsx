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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [customerProductForm, setCustomerProductForm] = useState({
    customer_id: 'none', 
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
  const getFilteredItems = () => filterData(items as any[], ['name', 'name_ar', 'code']);
  const getFilteredCustomerProducts = () => filterData(customerProducts as any[], ['customer_code', 'customer_name']);
  const getFilteredLocations = () => filterData(locations as any[], ['name', 'name_ar', 'code', 'description']);
  const getFilteredMachines = () => filterData(machines as any[], ['name', 'name_ar', 'code', 'type']);
  const getFilteredUsers = () => filterData(users as any[], ['username', 'name', 'name_ar', 'email', 'role']);

  // Event handlers
  const resetForm = () => {
    setCustomerForm({ name: '', name_ar: '', code: '', user_id: '', plate_drawer_code: '', city: '', address: '', tax_number: '', phone: '', sales_rep_id: '' });
    setSectionForm({ name: '', name_ar: '', description: '' });
    setItemForm({ name: '', name_ar: '', code: '', category_id: 'none', status: 'active' });
    setCustomerProductForm({ 
      customer_id: 'none', 
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
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:mr-64 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">التعريفات الأساسية</h1>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow">
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
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="customers">العملاء</TabsTrigger>
                <TabsTrigger value="sections">الأقسام</TabsTrigger>
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

              {/* Other tabs would follow similar pattern... */}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}