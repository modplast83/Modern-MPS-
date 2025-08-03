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
import { Building2, Users, Cog, Package, Plus, Edit, Trash2, Printer, Search, Filter, MapPin, Settings, User } from "lucide-react";

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
  const [materialGroupForm, setMaterialGroupForm] = useState({
    name: '', name_ar: '', code: '', parent_id: '', description: ''
  });
  const [itemForm, setItemForm] = useState({
    name: '', name_ar: '', code: '', unit: '', unit_ar: '', material_group_id: '', status: 'active'
  });
  const [customerProductForm, setCustomerProductForm] = useState({
    customer_id: '', category_id: '', customer_product_code: '', customer_product_name: '', 
    customer_product_name_ar: '', specifications: '', price: '', status: 'active'
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
  const [productForm, setProductForm] = useState({
    name: '', name_ar: '', code: '', color: '', type: '', status: 'active'
  });

  // Data queries with forced refresh to ensure data integrity
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
    staleTime: 0, // Always fetch fresh data
  });
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    staleTime: 0,
  });
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/sections'],
    staleTime: 0,
  });
  const { data: materialGroups = [], isLoading: materialGroupsLoading } = useQuery({
    queryKey: ['/api/material-groups'],
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
  const getFilteredProducts = () => filterData(products as any[], ['name', 'name_ar', 'code', 'color', 'type']);
  const getFilteredSections = () => filterData(sections as any[], ['name', 'name_ar', 'description']);
  const getFilteredMaterialGroups = () => filterData(materialGroups as any[], ['name', 'name_ar', 'code', 'description']);
  const getFilteredItems = () => filterData(items as any[], ['name', 'name_ar', 'code', 'type', 'unit']);
  const getFilteredCustomerProducts = () => filterData(customerProducts as any[], ['customer_code', 'customer_name']);
  const getFilteredLocations = () => filterData(locations as any[], ['name', 'name_ar', 'code', 'description']);
  const getFilteredMachines = () => filterData(machines as any[], ['name', 'name_ar', 'code', 'type']);
  const getFilteredUsers = () => filterData(users as any[], ['username', 'name', 'name_ar', 'email', 'role']);

  // Event handlers
  const resetForm = () => {
    setCustomerForm({ name: '', name_ar: '', code: '', user_id: '', plate_drawer_code: '', city: '', address: '', tax_number: '', phone: '', sales_rep_id: '' });
    setSectionForm({ name: '', name_ar: '', description: '' });
    setMaterialGroupForm({ name: '', name_ar: '', code: '', parent_id: '', description: '' });
    setItemForm({ name: '', name_ar: '', code: '', unit: '', unit_ar: '', material_group_id: '', status: 'active' });
    setCustomerProductForm({ customer_id: '', category_id: '', customer_product_code: '', customer_product_name: '', customer_product_name_ar: '', specifications: '', price: '', status: 'active' });
    setLocationForm({ name: '', name_ar: '', type: 'city', parent_id: '', coordinates: '', status: 'active' });
    setMachineForm({ name: '', name_ar: '', type: 'extruder', section_id: '', status: 'active' });
    setUserForm({ username: '', display_name: '', display_name_ar: '', role_id: '', section_id: '', status: 'active' });
    setProductForm({ name: '', name_ar: '', code: '', color: '', type: '', status: 'active' });
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
    
    // Ensure all fields have string values to prevent null warnings
    if (type === 'customer') {
      setCustomerForm({
        name: item.name || '',
        name_ar: item.name_ar || '',
        code: item.code || '',
        user_id: item.user_id || '',
        plate_drawer_code: item.plate_drawer_code || '',
        city: item.city || '',
        address: item.address || '',
        tax_number: item.tax_number || '',
        phone: item.phone || '',
        sales_rep_id: item.sales_rep_id ? item.sales_rep_id.toString() : '',
      });
    } else if (type === 'section') {
      setSectionForm({
        name: item.name || '',
        name_ar: item.name_ar || '',
        description: item.description || '',
      });
    } else if (type === 'material-group') {
      setMaterialGroupForm({
        name: item.name || '',
        name_ar: item.name_ar || '',
        code: item.code || '',
        parent_id: item.parent_id ? item.parent_id.toString() : '',
        description: item.description || '',
      });
    } else if (type === 'item') {
      setItemForm({
        name: item.name || '',
        name_ar: item.name_ar || '',
        code: item.code || '',
        unit: item.unit || '',
        unit_ar: item.unit_ar || '',
        material_group_id: item.material_group_id ? item.material_group_id.toString() : '',
        status: item.status || 'active',
      });
    } else if (type === 'customer-product') {
      setCustomerProductForm({
        customer_id: item.customer_id || '',
        category_id: item.category_id ? item.category_id.toString() : '',
        customer_product_code: item.customer_product_code || '',
        customer_product_name: item.customer_product_name || '',
        customer_product_name_ar: item.customer_product_name_ar || '',
        specifications: item.specifications || '',
        price: item.price ? item.price.toString() : '',
        status: item.status || 'active',
      });
    } else if (type === 'location') {
      setLocationForm({
        name: item.name || '',
        name_ar: item.name_ar || '',
        type: item.type || 'city',
        parent_id: item.parent_id ? item.parent_id.toString() : '',
        coordinates: item.coordinates || '',
        status: item.status || 'active',
      });
    } else if (type === 'machine') {
      setMachineForm({
        name: item.name || '',
        name_ar: item.name_ar || '',
        type: item.type || 'extruder',
        section_id: item.section_id ? item.section_id.toString() : '',
        status: item.status || 'active',
      });
    } else if (type === 'user') {
      setUserForm({
        username: item.username || '',
        display_name: item.display_name || '',
        display_name_ar: item.display_name_ar || '',
        role_id: item.role_id ? item.role_id.toString() : '',
        section_id: item.section_id ? item.section_id.toString() : '',
        status: item.status || 'active',
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
      let endpoint = '';
      let queryKey = '';
      
      switch (type) {
        case 'customer':
          endpoint = `/api/customers/${id}`;
          queryKey = '/api/customers';
          break;
        case 'section':
          endpoint = `/api/sections/${id}`;
          queryKey = '/api/sections';
          break;
        case 'material-group':
          endpoint = `/api/material-groups/${id}`;
          queryKey = '/api/material-groups';
          break;
        case 'item':
          endpoint = `/api/items/${id}`;
          queryKey = '/api/items';
          break;
        case 'customer-product':
          endpoint = `/api/customer-products/${id}`;
          queryKey = '/api/customer-products';
          break;
        case 'location':
          endpoint = `/api/locations/${id}`;
          queryKey = '/api/locations';
          break;
        case 'machine':
          endpoint = `/api/machines/${id}`;
          queryKey = '/api/machines';
          break;
        case 'user':
          endpoint = `/api/users/${id}`;
          queryKey = '/api/users';
          break;
        default:
          endpoint = `/api/${type}s/${id}`;
          queryKey = `/api/${type}s`;
      }
      
      await apiRequest('DELETE', endpoint);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف العنصر بنجاح",
      });
      
      queryClient.invalidateQueries({ queryKey: [queryKey] });
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
    try {
      let endpoint = '';
      let data = {};
      
      switch (selectedTab) {
        case 'customers':
          endpoint = '/api/customers';
          data = customerForm;
          break;
        case 'sections':
          endpoint = '/api/sections';
          data = sectionForm;
          break;
        case 'material-groups':
          endpoint = '/api/material-groups';
          data = materialGroupForm;
          break;
        case 'items':
          endpoint = '/api/items';
          data = itemForm;
          break;
        case 'customer-products':
          endpoint = '/api/customer-products';
          data = customerProductForm;
          break;
        case 'locations':
          endpoint = '/api/locations';
          data = locationForm;
          break;
        case 'machines':
          endpoint = '/api/machines';
          data = machineForm;
          break;
        case 'users':
          endpoint = '/api/users';
          data = userForm;
          break;
      }

      if (editingItem) {
        await apiRequest('PUT', `${endpoint}/${editingItem.id}`, data);
      } else {
        await apiRequest('POST', endpoint, data);
      }

      toast({
        title: "تم الحفظ",
        description: editingItem ? "تم تحديث البيانات بنجاح" : "تم إضافة البيانات بنجاح",
      });

      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    }
  };

  // Form render functions
  const renderCustomerForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم (إنجليزي)</Label>
        <Input
          id="name"
          value={customerForm.name}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="اسم العميل"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name_ar">الاسم (عربي)</Label>
        <Input
          id="name_ar"
          value={customerForm.name_ar}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, name_ar: e.target.value }))}
          placeholder="اسم العميل بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">الكود</Label>
        <Input
          id="code"
          value={customerForm.code}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, code: e.target.value }))}
          placeholder="كود العميل"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="user_id">معرف المستخدم</Label>
        <Input
          id="user_id"
          value={customerForm.user_id}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, user_id: e.target.value }))}
          placeholder="معرف المستخدم"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="plate_drawer_code">كود اللوح الجرار</Label>
        <Input
          id="plate_drawer_code"
          value={customerForm.plate_drawer_code}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, plate_drawer_code: e.target.value }))}
          placeholder="كود اللوح الجرار"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">المدينة</Label>
        <Input
          id="city"
          value={customerForm.city}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, city: e.target.value }))}
          placeholder="المدينة"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="address">العنوان</Label>
        <Input
          id="address"
          value={customerForm.address}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
          placeholder="العنوان الكامل"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tax_number">الرقم الضريبي</Label>
        <Input
          id="tax_number"
          value={customerForm.tax_number}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, tax_number: e.target.value }))}
          placeholder="الرقم الضريبي"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">الهاتف</Label>
        <Input
          id="phone"
          value={customerForm.phone}
          onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="رقم الهاتف"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sales_rep_id">مندوب المبيعات</Label>
        <Select value={customerForm.sales_rep_id} onValueChange={(value) => setCustomerForm(prev => ({ ...prev, sales_rep_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر مندوب المبيعات" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(users) && users.map((user: any) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.display_name_ar || user.display_name || user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSectionForm = () => (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم (إنجليزي)</Label>
        <Input
          id="name"
          value={sectionForm.name}
          onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="اسم القسم"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name_ar">الاسم (عربي)</Label>
        <Input
          id="name_ar"
          value={sectionForm.name_ar}
          onChange={(e) => setSectionForm(prev => ({ ...prev, name_ar: e.target.value }))}
          placeholder="اسم القسم بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">الوصف</Label>
        <Input
          id="description"
          value={sectionForm.description}
          onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="وصف القسم"
        />
      </div>
    </div>
  );

  const renderMaterialGroupForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم (إنجليزي)</Label>
        <Input
          id="name"
          value={materialGroupForm.name}
          onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="اسم المجموعة"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name_ar">الاسم (عربي)</Label>
        <Input
          id="name_ar"
          value={materialGroupForm.name_ar}
          onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, name_ar: e.target.value }))}
          placeholder="اسم المجموعة بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">الكود</Label>
        <Input
          id="code"
          value={materialGroupForm.code}
          onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, code: e.target.value }))}
          placeholder="كود المجموعة"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent_id">المجموعة الأب</Label>
        <Select value={materialGroupForm.parent_id} onValueChange={(value) => setMaterialGroupForm(prev => ({ ...prev, parent_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر المجموعة الأب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">بدون مجموعة أب</SelectItem>
            {Array.isArray(materialGroups) && materialGroups.map((group: any) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name_ar || group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">الوصف</Label>
        <Input
          id="description"
          value={materialGroupForm.description || ''}
          onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="وصف مجموعة المواد"
        />
      </div>
    </div>
  );

  const renderItemForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم (إنجليزي)</Label>
        <Input
          id="name"
          value={itemForm.name}
          onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="اسم الصنف"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name_ar">الاسم (عربي)</Label>
        <Input
          id="name_ar"
          value={itemForm.name_ar}
          onChange={(e) => setItemForm(prev => ({ ...prev, name_ar: e.target.value }))}
          placeholder="اسم الصنف بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="code">الكود</Label>
        <Input
          id="code"
          value={itemForm.code}
          onChange={(e) => setItemForm(prev => ({ ...prev, code: e.target.value }))}
          placeholder="كود الصنف"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">الوحدة (إنجليزي)</Label>
        <Input
          id="unit"
          value={itemForm.unit}
          onChange={(e) => setItemForm(prev => ({ ...prev, unit: e.target.value }))}
          placeholder="وحدة القياس"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit_ar">الوحدة (عربي)</Label>
        <Input
          id="unit_ar"
          value={itemForm.unit_ar}
          onChange={(e) => setItemForm(prev => ({ ...prev, unit_ar: e.target.value }))}
          placeholder="وحدة القياس بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="material_group_id">مجموعة المواد</Label>
        <Select value={itemForm.material_group_id} onValueChange={(value) => setItemForm(prev => ({ ...prev, material_group_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر مجموعة المواد" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(materialGroups) && materialGroups.map((group: any) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name_ar || group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">الحالة</Label>
        <Select value={itemForm.status} onValueChange={(value) => setItemForm(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderCustomerProductForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="customer_id">العميل</Label>
        <Select value={customerProductForm.customer_id} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, customer_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر العميل" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(customers) && customers.map((customer: any) => (
              <SelectItem key={customer.id} value={customer.id.toString()}>
                {customer.name_ar || customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category_id">المجموعة</Label>
        <Select value={customerProductForm.category_id} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, category_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر المجموعة" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(materialGroups) && materialGroups.map((group: any) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name_ar || group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer_product_code">كود المنتج عند العميل</Label>
        <Input
          id="customer_product_code"
          value={customerProductForm.customer_product_code}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, customer_product_code: e.target.value }))}
          placeholder="كود المنتج"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer_product_name">اسم المنتج (إنجليزي)</Label>
        <Input
          id="customer_product_name"
          value={customerProductForm.customer_product_name}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, customer_product_name: e.target.value }))}
          placeholder="اسم المنتج"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customer_product_name_ar">اسم المنتج (عربي)</Label>
        <Input
          id="customer_product_name_ar"
          value={customerProductForm.customer_product_name_ar}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, customer_product_name_ar: e.target.value }))}
          placeholder="اسم المنتج بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">السعر</Label>
        <Input
          id="price"
          type="number"
          value={customerProductForm.price}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, price: e.target.value }))}
          placeholder="السعر"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="specifications">المواصفات</Label>
        <Input
          id="specifications"
          value={customerProductForm.specifications}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, specifications: e.target.value }))}
          placeholder="مواصفات المنتج"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">الحالة</Label>
        <Select value={customerProductForm.status} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderLocationForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم (إنجليزي)</Label>
        <Input
          id="name"
          value={locationForm.name}
          onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="اسم الموقع"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name_ar">الاسم (عربي)</Label>
        <Input
          id="name_ar"
          value={locationForm.name_ar}
          onChange={(e) => setLocationForm(prev => ({ ...prev, name_ar: e.target.value }))}
          placeholder="اسم الموقع بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">النوع</Label>
        <Select value={locationForm.type} onValueChange={(value) => setLocationForm(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع الموقع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="city">مدينة</SelectItem>
            <SelectItem value="factory">مصنع</SelectItem>
            <SelectItem value="warehouse">مستودع</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="parent_id">الموقع الأب</Label>
        <Select value={locationForm.parent_id} onValueChange={(value) => setLocationForm(prev => ({ ...prev, parent_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الموقع الأب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">بدون موقع أب</SelectItem>
            {Array.isArray(locations) && locations.map((location: any) => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.name_ar || location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="coordinates">الإحداثيات</Label>
        <Input
          id="coordinates"
          value={locationForm.coordinates}
          onChange={(e) => setLocationForm(prev => ({ ...prev, coordinates: e.target.value }))}
          placeholder="الإحداثيات الجغرافية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">الحالة</Label>
        <Select value={locationForm.status} onValueChange={(value) => setLocationForm(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderMachineForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">الاسم (إنجليزي)</Label>
        <Input
          id="name"
          value={machineForm.name}
          onChange={(e) => setMachineForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="اسم الماكينة"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name_ar">الاسم (عربي)</Label>
        <Input
          id="name_ar"
          value={machineForm.name_ar}
          onChange={(e) => setMachineForm(prev => ({ ...prev, name_ar: e.target.value }))}
          placeholder="اسم الماكينة بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">النوع</Label>
        <Select value={machineForm.type} onValueChange={(value) => setMachineForm(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع الماكينة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="extruder">بثق</SelectItem>
            <SelectItem value="printing">طباعة</SelectItem>
            <SelectItem value="cutting">قطع</SelectItem>
            <SelectItem value="sealing">لحام</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="section_id">القسم</Label>
        <Select value={machineForm.section_id} onValueChange={(value) => setMachineForm(prev => ({ ...prev, section_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر القسم" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(sections) && sections.map((section: any) => (
              <SelectItem key={section.id} value={section.id.toString()}>
                {section.name_ar || section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">الحالة</Label>
        <Select value={machineForm.status} onValueChange={(value) => setMachineForm(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operational">تشغيل</SelectItem>
            <SelectItem value="maintenance">صيانة</SelectItem>
            <SelectItem value="down">متوقف</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderUserForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="username">اسم المستخدم</Label>
        <Input
          id="username"
          value={userForm.username}
          onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
          placeholder="اسم المستخدم"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name">الاسم المعروض (إنجليزي)</Label>
        <Input
          id="display_name"
          value={userForm.display_name}
          onChange={(e) => setUserForm(prev => ({ ...prev, display_name: e.target.value }))}
          placeholder="الاسم المعروض"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_name_ar">الاسم المعروض (عربي)</Label>
        <Input
          id="display_name_ar"
          value={userForm.display_name_ar}
          onChange={(e) => setUserForm(prev => ({ ...prev, display_name_ar: e.target.value }))}
          placeholder="الاسم المعروض بالعربية"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role_id">الدور</Label>
        <Input
          id="role_id"
          value={userForm.role_id}
          onChange={(e) => setUserForm(prev => ({ ...prev, role_id: e.target.value }))}
          placeholder="معرف الدور"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="section_id">القسم</Label>
        <Select value={userForm.section_id} onValueChange={(value) => setUserForm(prev => ({ ...prev, section_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر القسم" />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(sections) && sections.map((section: any) => (
              <SelectItem key={section.id} value={section.id.toString()}>
                {section.name_ar || section.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">الحالة</Label>
        <Select value={userForm.status} onValueChange={(value) => setUserForm(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
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
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-8">
              <TabsTrigger value="customers">العملاء</TabsTrigger>
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

            {/* Material Groups Tab */}
            <TabsContent value="material-groups" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      إدارة مجموعات المواد
                    </CardTitle>
                    <Button onClick={() => { resetForm(); setSelectedTab('material-groups'); setIsDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة مجموعة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {materialGroupsLoading ? (
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المجموعة الأب</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const filteredGroups = getFilteredMaterialGroups();
                            return filteredGroups.length > 0 ? (
                              filteredGroups.map((group) => (
                                <tr key={group.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {group.name_ar || group.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {group.code || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {group.parent_id ? 'فرعية' : 'رئيسية'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(group, 'material-group')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(group.id, 'material-group')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(group)}
                                      >
                                        <Printer className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
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

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Cog className="w-5 h-5" />
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوحدة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المجموعة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const filteredItems = getFilteredItems();
                            return filteredItems.length > 0 ? (
                              filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.name_ar || item.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.code || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.unit || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.category_id || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                      {item.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(item, 'item')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(item.id, 'item')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(item)}
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

            {/* Customer Products Tab */}
            <TabsContent value="customer-products" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      إدارة منتجات العملاء
                    </CardTitle>
                    <Button onClick={() => { resetForm(); setSelectedTab('customer-products'); setIsDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة منتج عميل
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">كود المنتج</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم المنتج</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const filteredCP = getFilteredCustomerProducts();
                            return filteredCP.length > 0 ? (
                              filteredCP.map((cp) => (
                                <tr key={cp.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {cp.customer_id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.customer_product_code || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.customer_product_name_ar || cp.customer_product_name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.price || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={cp.status === 'active' ? 'default' : 'secondary'}>
                                      {cp.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(cp, 'customer-product')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(cp.id, 'customer-product')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(cp)}
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموقع الأب</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const filteredLocations = getFilteredLocations();
                            return filteredLocations.length > 0 ? (
                              filteredLocations.map((location) => (
                                <tr key={location.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {location.name_ar || location.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {location.type === 'city' ? 'مدينة' : 
                                     location.type === 'factory' ? 'مصنع' : 
                                     location.type === 'warehouse' ? 'مستودع' : location.type}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {location.parent_id || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                                      {location.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(location, 'location')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(location.id, 'location')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(location)}
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">القسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const filteredMachines = getFilteredMachines();
                            return filteredMachines.length > 0 ? (
                              filteredMachines.map((machine) => (
                                <tr key={machine.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {machine.name_ar || machine.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {machine.type === 'extruder' ? 'بثق' : 
                                     machine.type === 'printing' ? 'طباعة' : 
                                     machine.type === 'cutting' ? 'قطع' : machine.type}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {machine.section_id || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={machine.status === 'operational' ? 'default' : 'secondary'}>
                                      {machine.status === 'operational' ? 'تشغيل' : 
                                       machine.status === 'maintenance' ? 'صيانة' : 
                                       machine.status === 'down' ? 'متوقف' : machine.status}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(machine, 'machine')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(machine.id, 'machine')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(machine)}
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم المستخدم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم المعروض</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">القسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const filteredUsers = getFilteredUsers();
                            return filteredUsers.length > 0 ? (
                              filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {user.username}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.display_name_ar || user.display_name || user.username}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.role_id || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.section_id || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                      {user.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(user, 'user')}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(user.id, 'user')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(user)}
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

            {/* Add Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 
                      (selectedTab === 'customers' ? 'تعديل عميل' :
                       selectedTab === 'sections' ? 'تعديل قسم' :
                       selectedTab === 'material-groups' ? 'تعديل مجموعة مواد' :
                       selectedTab === 'items' ? 'تعديل صنف' :
                       selectedTab === 'customer-products' ? 'تعديل منتج عميل' :
                       selectedTab === 'locations' ? 'تعديل موقع' :
                       selectedTab === 'machines' ? 'تعديل ماكينة' :
                       selectedTab === 'users' ? 'تعديل مستخدم' : 'تعديل')
                      :
                      (selectedTab === 'customers' ? 'إضافة عميل جديد' :
                       selectedTab === 'sections' ? 'إضافة قسم جديد' :
                       selectedTab === 'material-groups' ? 'إضافة مجموعة مواد جديدة' :
                       selectedTab === 'items' ? 'إضافة صنف جديد' :
                       selectedTab === 'customer-products' ? 'إضافة منتج عميل جديد' :
                       selectedTab === 'locations' ? 'إضافة موقع جديد' :
                       selectedTab === 'machines' ? 'إضافة ماكينة جديدة' :
                       selectedTab === 'users' ? 'إضافة مستخدم جديد' : 'إضافة جديد')
                    }
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'تحديث بيانات العنصر المحدد' : 'إضافة عنصر جديد إلى النظام'}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {selectedTab === 'customers' && renderCustomerForm()}
                  {selectedTab === 'sections' && renderSectionForm()}
                  {selectedTab === 'material-groups' && renderMaterialGroupForm()}
                  {selectedTab === 'items' && renderItemForm()}
                  {selectedTab === 'customer-products' && renderCustomerProductForm()}
                  {selectedTab === 'locations' && renderLocationForm()}
                  {selectedTab === 'machines' && renderMachineForm()}
                  {selectedTab === 'users' && renderUserForm()}
                </div>
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

          </Tabs>
        </main>
      </div>
    </div>
  );
}