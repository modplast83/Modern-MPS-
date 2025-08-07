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
    name: '', name_ar: '', code: '', parent_id: 'none', description: '', status: 'active'
  });
  const [itemForm, setItemForm] = useState({
    name: '', name_ar: '', code: '', category_id: 'none', status: 'active'
  });
  const [customerProductForm, setCustomerProductForm] = useState({
    customer_id: 'none', 
    material_group_id: 'none', 
    item_id: 'none', 
    size_caption: '', 
    width: '', 
    left_facing: '', 
    right_facing: '', 
    thickness: '', 
    printing_cylinder: '', 
    length_cm: '', 
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
    setMaterialGroupForm({ name: '', name_ar: '', code: '', parent_id: 'none', description: '', status: 'active' });
    setItemForm({ name: '', name_ar: '', code: '', category_id: 'none', status: 'active' });
    setCustomerProductForm({ 
      customer_id: 'none', 
      material_group_id: 'none', 
      item_id: 'none', 
      size_caption: '', 
      width: '', 
      left_facing: '', 
      right_facing: '', 
      thickness: '', 
      printing_cylinder: '', 
      length_cm: '', 
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
        parent_id: item.parent_id ? item.parent_id.toString() : 'none',
        description: item.description || '',
        status: item.status || 'active',
      });
    } else if (type === 'item') {
      setItemForm({
        name: item.name || '',
        name_ar: item.name_ar || '',
        code: item.code || '',
        category_id: item.category_id ? item.category_id.toString() : 'none',
        status: item.status || 'active',
      });
    } else if (type === 'customer-product') {
      setCustomerProductForm({
        customer_id: item.customer_id || 'none',
        material_group_id: item.material_group_id ? item.material_group_id.toString() : 'none',
        item_id: item.item_id ? item.item_id.toString() : 'none',
        size_caption: item.size_caption || '',
        width: item.width?.toString() || '',
        left_facing: item.left_facing?.toString() || '',
        right_facing: item.right_facing?.toString() || '',
        thickness: item.thickness?.toString() || '',
        printing_cylinder: item.printing_cylinder || '',
        length_cm: item.length_cm?.toString() || '',
        cutting_length_cm: item.cutting_length_cm?.toString() || '',
        raw_material: item.raw_material || '',
        master_batch_id: item.master_batch_id || '',
        is_printed: item.is_printed || false,
        cutting_unit: item.cutting_unit || '',
        punching: item.punching || '',
        unit_weight_kg: item.unit_weight_kg?.toString() || '',
        unit_quantity: item.unit_quantity?.toString() || '',
        package_weight_kg: item.package_weight_kg?.toString() || '',
        cliche_front_design: item.cliche_front_design || '',
        cliche_back_design: item.cliche_back_design || '',
        notes: item.notes || '',
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
      
      await apiRequest(endpoint, { method: 'DELETE' });
      
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

  const handleCopy = (item: any) => {
    // Set the form data with the copied item's values (excluding id)
    setCustomerProductForm({
      customer_id: item.customer_id || 'none',
      material_group_id: item.material_group_id ? item.material_group_id.toString() : 'none',
      item_id: item.item_id ? item.item_id.toString() : 'none',
      size_caption: item.size_caption || '',
      width: item.width?.toString() || '',
      left_facing: item.left_facing?.toString() || '',
      right_facing: item.right_facing?.toString() || '',
      thickness: item.thickness?.toString() || '',
      printing_cylinder: item.printing_cylinder || '',
      length_cm: item.length_cm?.toString() || '',
      cutting_length_cm: item.cutting_length_cm?.toString() || '',
      raw_material: item.raw_material || '',
      master_batch_id: item.master_batch_id || '',
      is_printed: item.is_printed || false,
      cutting_unit: item.cutting_unit || '',
      punching: item.punching || '',
      unit_weight_kg: item.unit_weight_kg?.toString() || '',
      unit_quantity: item.unit_quantity?.toString() || '',
      package_weight_kg: item.package_weight_kg?.toString() || '',
      cliche_front_design: item.cliche_front_design || '',
      cliche_back_design: item.cliche_back_design || '',
      notes: item.notes || '',
      status: item.status || 'active'
    });
    
    // Clear editing item to create a new entry
    setEditingItem(null);
    
    // Switch to customer-products tab and open dialog
    setSelectedTab('customer-products');
    setIsDialogOpen(true);
    
    toast({
      title: "تم النسخ",
      description: "تم نسخ بيانات المنتج بنجاح. يمكنك الآن تعديلها وحفظها كمنتج جديد.",
      className: "text-right",
    });
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
          data = {
            ...materialGroupForm,
            parent_id: materialGroupForm.parent_id === 'none' || materialGroupForm.parent_id === '' || !materialGroupForm.parent_id 
              ? null 
              : parseInt(materialGroupForm.parent_id)
          };
          console.log('Submitting material group data:', data);
          break;
        case 'items':
          endpoint = '/api/items';
          data = {
            ...itemForm,
            category_id: itemForm.category_id === 'none' ? null : itemForm.category_id
          };
          break;
        case 'customer-products':
          endpoint = '/api/customer-products';
          data = {
            ...customerProductForm,
            customer_id: customerProductForm.customer_id === 'none' ? null : customerProductForm.customer_id,
            material_group_id: customerProductForm.material_group_id === 'none' ? null : parseInt(customerProductForm.material_group_id),
            item_id: customerProductForm.item_id === 'none' ? null : customerProductForm.item_id,
            width: customerProductForm.width ? parseFloat(customerProductForm.width) : null,
            left_facing: customerProductForm.left_facing ? parseFloat(customerProductForm.left_facing) : null,
            right_facing: customerProductForm.right_facing ? parseFloat(customerProductForm.right_facing) : null,
            thickness: customerProductForm.thickness ? parseFloat(customerProductForm.thickness) : null,
            length_cm: customerProductForm.length_cm ? parseFloat(customerProductForm.length_cm) : null,
            cutting_length_cm: customerProductForm.cutting_length_cm ? parseInt(customerProductForm.cutting_length_cm) : null,
            unit_weight_kg: customerProductForm.unit_weight_kg ? parseFloat(customerProductForm.unit_weight_kg) : null,
            unit_quantity: customerProductForm.unit_quantity ? parseInt(customerProductForm.unit_quantity) : null,
            package_weight_kg: customerProductForm.package_weight_kg ? parseFloat(customerProductForm.package_weight_kg) : null
          };
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
        await apiRequest(`${endpoint}/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) });
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
        <Label htmlFor="plate_drawer_code">رقم الدرج</Label>
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
            <SelectItem value="none">بدون مجموعة أب</SelectItem>
            {Array.isArray(materialGroups) && materialGroups.map((group: any) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name_ar || group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-1">
        <Label htmlFor="description">الوصف</Label>
        <Input
          id="description"
          value={materialGroupForm.description || ''}
          onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="وصف مجموعة المواد"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">الحالة</Label>
        <Select value={materialGroupForm.status || 'active'} onValueChange={(value) => setMaterialGroupForm(prev => ({ ...prev, status: value }))}>
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
        <Label htmlFor="category_id">مجموعة المواد</Label>
        <Select value={itemForm.category_id} onValueChange={(value) => setItemForm(prev => ({ ...prev, category_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر مجموعة المواد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">بدون مجموعة</SelectItem>
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

  // Filter items based on selected material group
  const filteredItems = Array.isArray(items) && customerProductForm.material_group_id !== 'none'
    ? items.filter((item: any) => item.category_id && item.category_id.toString() === customerProductForm.material_group_id)
    : [];

  const renderCustomerProductForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
      {/* اسم العميل */}
      <div className="space-y-2">
        <Label htmlFor="customer_id">العميل *</Label>
        <Select value={customerProductForm.customer_id} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, customer_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر العميل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">اختر العميل</SelectItem>
            {Array.isArray(customers) && customers.map((customer: any) => (
              <SelectItem key={customer.id} value={customer.id.toString()}>
                {customer.name_ar || customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* مجموعة المواد */}
      <div className="space-y-2">
        <Label htmlFor="category_id">مجموعة المواد *</Label>
        <Select 
          value={customerProductForm.material_group_id} 
          onValueChange={(value) => setCustomerProductForm(prev => ({ 
            ...prev, 
            material_group_id: value,
            item_id: 'none'
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر مجموعة المواد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">اختر مجموعة المواد</SelectItem>
            {Array.isArray(materialGroups) && materialGroups.length > 0 && materialGroups.map((group: any) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name_ar || group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* الصنف */}
      <div className="space-y-2">
        <Label htmlFor="item_id">الصنف *</Label>
        <Select 
          value={customerProductForm.item_id} 
          onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, item_id: value }))}
          disabled={customerProductForm.material_group_id === 'none'}
        >
          <SelectTrigger>
            <SelectValue placeholder={customerProductForm.material_group_id === 'none' ? "اختر مجموعة المواد أولاً" : "اختر الصنف"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">اختر الصنف</SelectItem>
            {filteredItems.map((item: any) => (
              <SelectItem key={item.id} value={item.id.toString()}>
                {item.name_ar || item.name} ({item.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* دخلات الجانب الأيمن */}
      <div className="space-y-2">
        <Label htmlFor="right_facing">دخلات الجانب الأيمن (سم)</Label>
        <Input
          id="right_facing"
          type="number"
          step="0.01"
          value={customerProductForm.right_facing || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, right_facing: e.target.value }))}
          placeholder="دخلات الجانب الأيمن"
        />
      </div>

      {/* العرض */}
      <div className="space-y-2">
        <Label htmlFor="width">العرض (سم)</Label>
        <Input
          id="width"
          type="number"
          step="0.01"
          value={customerProductForm.width || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, width: e.target.value }))}
          placeholder="العرض بالسنتيمتر"
        />
      </div>

      {/* دخلات الجانب الأيسر */}
      <div className="space-y-2">
        <Label htmlFor="left_facing">دخلات الجانب الأيسر (سم)</Label>
        <Input
          id="left_facing"
          type="number"
          step="0.01"
          value={customerProductForm.left_facing || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, left_facing: e.target.value }))}
          placeholder="دخلات الجانب الأيسر"
        />
      </div>

      {/* مقاس المنتج */}
      <div className="space-y-2">
        <Label htmlFor="size_caption">مقاس المنتج</Label>
        <Input
          id="size_caption"
          value={customerProductForm.size_caption || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, size_caption: e.target.value }))}
          placeholder="مثال: 20x30 cm"
        />
      </div>

      {/* طول القطع */}
      <div className="space-y-2">
        <Label htmlFor="cutting_length_cm">طول القطع (سم) *</Label>
        <Input
          id="cutting_length_cm"
          type="number"
          value={customerProductForm.cutting_length_cm || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, cutting_length_cm: e.target.value }))}
          placeholder="طول القطع (أرقام صحيحة فقط)"
        />
      </div>

      {/* أسطوانة الطباعة */}
      <div className="space-y-2">
        <Label htmlFor="printing_cylinder">أسطوانة الطباعة</Label>
        <Select value={customerProductForm.printing_cylinder} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, printing_cylinder: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر أسطوانة الطباعة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="8">8"</SelectItem>
            <SelectItem value="10">10"</SelectItem>
            <SelectItem value="12">12"</SelectItem>
            <SelectItem value="14">14"</SelectItem>
            <SelectItem value="16">16"</SelectItem>
            <SelectItem value="18">18"</SelectItem>
            <SelectItem value="20">20"</SelectItem>
            <SelectItem value="22">22"</SelectItem>
            <SelectItem value="24">24"</SelectItem>
            <SelectItem value="26">26"</SelectItem>
            <SelectItem value="28">28"</SelectItem>
            <SelectItem value="30">30"</SelectItem>
            <SelectItem value="32">32"</SelectItem>
            <SelectItem value="34">34"</SelectItem>
            <SelectItem value="36">36"</SelectItem>
            <SelectItem value="38">38"</SelectItem>
            <SelectItem value="39">39"</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* الطول (سم) - محسوب تلقائياً */}
      <div className="space-y-2">
        <Label htmlFor="length_cm">الطول (سم) - محسوب تلقائياً</Label>
        <Input
          id="length_cm"
          type="number"
          step="0.01"
          value={customerProductForm.length_cm || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, length_cm: e.target.value }))}
          placeholder="يحسب تلقائياً"
          className="bg-gray-50"
        />
      </div>

      {/* السماكة */}
      <div className="space-y-2">
        <Label htmlFor="thickness">السماكة (مايكرون)</Label>
        <Input
          id="thickness"
          type="number"
          step="0.001"
          value={customerProductForm.thickness || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, thickness: e.target.value }))}
          placeholder="السماكة بالمايكرون"
        />
      </div>

      {/* هل يطبع */}
      <div className="space-y-2">
        <Label htmlFor="is_printed">هل يطبع؟</Label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_printed"
            checked={customerProductForm.is_printed || false}
            onChange={(e) => setCustomerProductForm(prev => ({ ...prev, is_printed: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <Label htmlFor="is_printed" className="text-sm">نعم، يطبع</Label>
        </div>
      </div>

      {/* ماستر باتش */}
      <div className="space-y-2">
        <Label htmlFor="master_batch_id">ماستر باتش *</Label>
        <Select value={customerProductForm.master_batch_id} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, master_batch_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر ماستر باتش" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLEAR">CLEAR</SelectItem>
            <SelectItem value="WHITE">WHITE</SelectItem>
            <SelectItem value="BLACK">BLACK</SelectItem>
            <SelectItem value="RED">RED</SelectItem>
            <SelectItem value="BLUE">BLUE</SelectItem>
            <SelectItem value="GREEN">GREEN</SelectItem>
            <SelectItem value="YELLOW">YELLOW</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* المادة الخام */}
      <div className="space-y-2">
        <Label htmlFor="raw_material">المادة الخام *</Label>
        <Select value={customerProductForm.raw_material} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, raw_material: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر المادة الخام" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HDPE">HDPE</SelectItem>
            <SelectItem value="LDPE">LDPE</SelectItem>
            <SelectItem value="Regrind">Regrind</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* وحدة القطع */}
      <div className="space-y-2">
        <Label htmlFor="cutting_unit">وحدة القطع *</Label>
        <Select value={customerProductForm.cutting_unit} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, cutting_unit: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر وحدة القطع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="KG">KG</SelectItem>
            <SelectItem value="ROLL">ROLL</SelectItem>
            <SelectItem value="PKT">PKT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* نوع التخريم */}
      <div className="space-y-2">
        <Label htmlFor="punching">نوع التخريم</Label>
        <Select value={customerProductForm.punching} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, punching: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع التخريم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NON">NON</SelectItem>
            <SelectItem value="T-Shirt">T-Shirt</SelectItem>
            <SelectItem value="T-shirt\Hook">T-shirt\Hook</SelectItem>
            <SelectItem value="Banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* وزن الوحدة */}
      <div className="space-y-2">
        <Label htmlFor="unit_weight_kg">وزن الوحدة (كيلو)</Label>
        <Input
          id="unit_weight_kg"
          type="number"
          step="0.01"
          value={customerProductForm.unit_weight_kg || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, unit_weight_kg: e.target.value }))}
          placeholder="وزن الوحدة بالكيلوجرام"
        />
      </div>

      {/* كمية الوحدة */}
      <div className="space-y-2">
        <Label htmlFor="unit_quantity">كمية الوحدة</Label>
        <Input
          id="unit_quantity"
          type="number"
          value={customerProductForm.unit_quantity || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, unit_quantity: e.target.value }))}
          placeholder="كمية الوحدة"
        />
      </div>

      {/* وزن الحزمة - محسوب تلقائياً */}
      <div className="space-y-2">
        <Label htmlFor="package_weight_kg">وزن الحزمة (كيلو) - محسوب تلقائياً</Label>
        <Input
          id="package_weight_kg"
          type="number"
          step="0.01"
          value={customerProductForm.package_weight_kg || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, package_weight_kg: e.target.value }))}
          placeholder="يحسب تلقائياً"
          className="bg-gray-50"
        />
      </div>

      {/* تصميم الكليشة الأمامية */}
      <div className="space-y-2">
        <Label htmlFor="cliche_front_design">تصميم الكليشة الأمامية</Label>
        <Input
          id="cliche_front_design"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Here you would typically upload the file and get a URL
              // For now, we'll just store the file name
              setCustomerProductForm(prev => ({ ...prev, cliche_front_design: file.name }));
            }
          }}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* تصميم الكليشة الخلفية */}
      <div className="space-y-2">
        <Label htmlFor="cliche_back_design">تصميم الكليشة الخلفية</Label>
        <Input
          id="cliche_back_design"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Here you would typically upload the file and get a URL
              // For now, we'll just store the file name
              setCustomerProductForm(prev => ({ ...prev, cliche_back_design: file.name }));
            }
          }}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* ملاحظات */}
      <div className="space-y-2 md:col-span-2 lg:col-span-3">
        <Label htmlFor="notes">ملاحظات</Label>
        <Input
          id="notes"
          value={customerProductForm.notes || ''}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="أي ملاحظات إضافية"
        />
      </div>

      {/* الحالة */}
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم العميل (عربي)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم العميل (إنجليزي)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المندوب</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الدرج</th>
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
                                    {customer.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {customer.name_ar || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.name || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(() => {
                                      if (Array.isArray(users) && customer.sales_rep_id) {
                                        const salesRep = users.find(user => user.id === customer.sales_rep_id);
                                        return salesRep ? (salesRep.display_name_ar || salesRep.display_name || salesRep.username) : '-';
                                      }
                                      return '-';
                                    })()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.plate_drawer_code || '-'}
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
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
                                    {section.id}
                                  </td>
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم العربي</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الإنجليزي</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
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
                                    {group.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {group.name_ar || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {group.name || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {group.code || '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {group.description || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                                      {group.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
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
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم العربي</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم الإنجليزي</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">مجموعة المواد</th>
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
                                    {item.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.name_ar || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.name || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.code || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(() => {
                                      const materialGroup = Array.isArray(materialGroups) && materialGroups.find((mg: any) => mg.id.toString() === item.category_id);
                                      return materialGroup ? (materialGroup.name_ar || materialGroup.name) : (item.category_id || '-');
                                    })()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                      {item.status === 'active' ? 'نشط' : item.status === 'inactive' ? 'غير نشط' : (item.status || 'غير محدد')}
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
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
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
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">مجموعة المواد</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصنف</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">مقاس المنتج</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">أسطوانة الطباعة</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">السماكة (مايكرون)</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">طول القطع (سم)</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">المادة الخام</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">ماستر باتش</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع التخريم</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">وزن الوحدة (كيلو)</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">كمية الوحدة</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">وزن الحزمة (كيلو)</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            const filteredCP = getFilteredCustomerProducts();
                            return filteredCP.length > 0 ? (
                              filteredCP.map((cp) => (
                                <tr key={cp.id} className="hover:bg-gray-50">
                                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {cp.id}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {(() => {
                                      const customer = Array.isArray(customers) && customers.find((c: any) => c.id === cp.customer_id);
                                      return customer ? (customer.name_ar || customer.name) : cp.customer_id;
                                    })()}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(() => {
                                      const materialGroup = Array.isArray(materialGroups) && materialGroups.find((mg: any) => mg.id === cp.material_group_id);
                                      return materialGroup ? (materialGroup.name_ar || materialGroup.name) : cp.material_group_id || '-';
                                    })()}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(() => {
                                      const item = Array.isArray(items) && items.find((i: any) => i.id === cp.item_id);
                                      return item ? (item.name_ar || item.name) : cp.item_id;
                                    })()}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(() => {
                                      const width = parseFloat(cp.width) || 0;
                                      const leftFacing = parseFloat(cp.left_facing) || 0;
                                      const rightFacing = parseFloat(cp.right_facing) || 0;
                                      
                                      if (width > 0 || leftFacing > 0 || rightFacing > 0) {
                                        return `${width} + ${leftFacing} + ${rightFacing} سم`;
                                      }
                                      
                                      return cp.size_caption || '-';
                                    })()}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.printing_cylinder ? `${cp.printing_cylinder}"` : '-'}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.thickness || '-'}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.cutting_length_cm || '-'}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.raw_material || '-'}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.master_batch_id || '-'}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.punching || '-'}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.unit_weight_kg || '-'}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {cp.unit_quantity || '-'}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {(() => {
                                      const unitWeight = parseFloat(cp.unit_weight_kg) || 0;
                                      const unitQuantity = parseInt(cp.unit_quantity) || 0;
                                      
                                      if (unitWeight > 0 && unitQuantity > 0) {
                                        const calculatedWeight = (unitWeight * unitQuantity).toFixed(2);
                                        return `${calculatedWeight} كيلو`;
                                      }
                                      
                                      return cp.package_weight_kg ? `${cp.package_weight_kg} كيلو` : '-';
                                    })()}
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEdit(cp, 'customer-product')}
                                        title="تعديل"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleCopy(cp)}
                                        title="نسخ المنتج"
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDelete(cp.id, 'customer-product')}
                                        title="حذف"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handlePrint(cp)}
                                        title="طباعة"
                                      >
                                        <Printer className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={15} className="px-6 py-4 text-center text-gray-500">
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
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
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                    {location.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                    {location.name_ar || location.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                                      {location.status === 'active' ? 'نشط' : 'غير نشط'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center gap-2 justify-end">
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
                                    {machine.id}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {machine.name_ar || machine.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {machine.type === 'extruder' ? 'بثق' : 
                                     machine.type === 'printing' ? 'طباعة' : 
                                     machine.type === 'cutting' ? 'قطع' : machine.type}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {machine.section_id ? 
                                      sections?.find(s => s.id === machine.section_id)?.name_ar || 
                                      sections?.find(s => s.id === machine.section_id)?.name || 
                                      machine.section_id 
                                      : '-'}
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
                                    {user.id}
                                  </td>
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
                                    {user.section_id ? 
                                      sections?.find(s => s.id === user.section_id)?.name_ar || 
                                      sections?.find(s => s.id === user.section_id)?.name || 
                                      user.section_id 
                                      : '-'}
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
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
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