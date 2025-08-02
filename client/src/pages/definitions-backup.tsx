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
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickSearch, setQuickSearch] = useState("");

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

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/sections"],
  });

  const { data: materialGroups, isLoading: materialGroupsLoading } = useQuery({
    queryKey: ["/api/material-groups"],
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/items"],
  });

  const { data: customerProducts, isLoading: customerProductsLoading } = useQuery({
    queryKey: ["/api/customer-products"],
  });

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["/api/locations"],
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

  // Section form state
  const [sectionForm, setSectionForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    manager_id: null,
    status: 'active'
  });

  // Material Group form state
  const [materialGroupForm, setMaterialGroupForm] = useState({
    name: '',
    name_ar: '',
    code: '',
    description: '',
    status: 'active'
  });

  // Item form state
  const [itemForm, setItemForm] = useState({
    name: '',
    name_ar: '',
    code: '',
    material_group_id: null,
    unit: '',
    unit_ar: '',
    status: 'active'
  });

  // Customer Product form state
  const [customerProductForm, setCustomerProductForm] = useState({
    customer_id: '',
    product_id: '',
    customer_product_code: '',
    customer_product_name: '',
    customer_product_name_ar: '',
    specifications: '',
    price: '',
    status: 'active'
  });

  // Location form state
  const [locationForm, setLocationForm] = useState({
    name: '',
    name_ar: '',
    type: 'city',
    parent_id: null,
    coordinates: '',
    status: 'active'
  });

  // Mutations for CRUD operations
  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/customers', data),
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
    mutationFn: (data: any) => apiRequest('POST', '/api/products', data),
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

  const createItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({ title: "تم الحفظ بنجاح", description: "تم إضافة الصنف الجديد" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    }
  });

  const createMaterialGroupMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/material-groups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-groups'] });
      toast({ title: "تم الحفظ بنجاح", description: "تم إضافة مجموعة المواد الجديدة" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    }
  });

  const createMachineMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/machines', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      toast({ title: "تم الحفظ بنجاح", description: "تم إضافة الماكينة الجديدة" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "تم الحفظ بنجاح", description: "تم إضافة المستخدم الجديد" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    }
  });

  const createLocationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/locations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({ title: "تم الحفظ بنجاح", description: "تم إضافة الموقع الجديد" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    }
  });

  const createCustomerProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/customer-products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-products'] });
      toast({ title: "تم الحفظ بنجاح", description: "تم إضافة منتج العميل الجديد" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ endpoint, id }: { endpoint: string; id: number }) => 
      apiRequest('DELETE', `${endpoint}/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.endpoint] });
      toast({ title: "تم الحذف بنجاح", description: "تم حذف العنصر" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حذف العنصر", variant: "destructive" });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ endpoint, data }: { endpoint: string; data: any }) => 
      apiRequest('PUT', `${endpoint}/${data.id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.endpoint] });
      toast({ title: "تم التحديث بنجاح", description: "تم تحديث العنصر" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث العنصر", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setCustomerForm({ name: '', name_ar: '', phone: '', address: '', status: 'active' });
    setProductForm({ name: '', name_ar: '', code: '', type: 'hdpe', color: '', status: 'active' });
    setMachineForm({ name: '', name_ar: '', type: 'extrusion', speed_rating: '', status: 'active' });
    setUserForm({ username: '', display_name_ar: '', role_id: 3, section_id: 1, status: 'active' });
    setSectionForm({ name: '', name_ar: '', description: '', manager_id: null, status: 'active' });
    setMaterialGroupForm({ name: '', name_ar: '', code: '', description: '', status: 'active' });
    setItemForm({ name: '', name_ar: '', code: '', material_group_id: null, unit: '', unit_ar: '', status: 'active' });
    setCustomerProductForm({ customer_id: '', product_id: '', customer_product_code: '', customer_product_name: '', customer_product_name_ar: '', specifications: '', price: '', status: 'active' });
    setLocationForm({ name: '', name_ar: '', type: 'city', parent_id: null, coordinates: '', status: 'active' });
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
      case 'section':
        setSectionForm({
          name: item.name || '',
          name_ar: item.name_ar || '',
          description: item.description || '',
          manager_id: item.manager_id || null,
          status: item.status || 'active'
        });
        break;
      case 'material-group':
        setMaterialGroupForm({
          name: item.name || '',
          name_ar: item.name_ar || '',
          code: item.code || '',
          description: item.description || '',
          status: item.status || 'active'
        });
        break;
      case 'item':
        setItemForm({
          name: item.name || '',
          name_ar: item.name_ar || '',
          code: item.code || '',
          material_group_id: item.material_group_id || null,
          unit: item.unit || '',
          unit_ar: item.unit_ar || '',
          status: item.status || 'active'
        });
        break;
      case 'customer-product':
        setCustomerProductForm({
          customer_id: item.customer_id || '',
          product_id: item.product_id || '',
          customer_product_code: item.customer_product_code || '',
          customer_product_name: item.customer_product_name || '',
          customer_product_name_ar: item.customer_product_name_ar || '',
          specifications: item.specifications || '',
          price: item.price?.toString() || '',
          status: item.status || 'active'
        });
        break;
      case 'location':
        setLocationForm({
          name: item.name || '',
          name_ar: item.name_ar || '',
          type: item.type || 'city',
          parent_id: item.parent_id || null,
          coordinates: item.coordinates || '',
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
        user: '/api/users',
        section: '/api/sections',
        'material-group': '/api/material-groups',
        item: '/api/items',
        'customer-product': '/api/customer-products',
        location: '/api/locations'
      };
      deleteItemMutation.mutate({ 
        endpoint: endpoints[type as keyof typeof endpoints], 
        id 
      });
    }
  };

  const handleSubmit = () => {
    if (editingItem) {
      // Update mode
      const updateData = { ...getCurrentFormData(), id: editingItem.id };
      updateItemMutation.mutate({ 
        endpoint: getEndpointForTab(selectedTab), 
        data: updateData 
      });
    } else {
      // Create mode
      switch(selectedTab) {
        case 'customers':
          createCustomerMutation.mutate(customerForm);
          break;
        case 'products':
          createProductMutation.mutate(productForm);
          break;
        case 'machines':
          createMachineMutation.mutate(machineForm);
          break;
        case 'users':
          createUserMutation.mutate(userForm);
          break;
        case 'sections':
          createSectionMutation.mutate(sectionForm);
          break;
        case 'material-groups':
          createMaterialGroupMutation.mutate(materialGroupForm);
          break;
        case 'items':
          createItemMutation.mutate(itemForm);
          break;
        case 'customer-products':
          createCustomerProductMutation.mutate(customerProductForm);
          break;
        case 'locations':
          createLocationMutation.mutate(locationForm);
          break;
      }
    }
  };

  const getCurrentFormData = () => {
    switch(selectedTab) {
      case 'customers': return customerForm;
      case 'products': return productForm;
      case 'machines': return machineForm;
      case 'users': return userForm;
      case 'sections': return sectionForm;
      case 'material-groups': return materialGroupForm;
      case 'items': return itemForm;
      case 'customer-products': return customerProductForm;
      case 'locations': return locationForm;
      default: return {};
    }
  };

  const getEndpointForTab = (tab: string) => {
    const endpoints = {
      customers: '/api/customers',
      products: '/api/products',
      machines: '/api/machines',
      users: '/api/users',
      sections: '/api/sections',
      'material-groups': '/api/material-groups',
      items: '/api/items',
      'customer-products': '/api/customer-products',
      locations: '/api/locations'
    };
    return endpoints[tab as keyof typeof endpoints];
  };

  const handlePrint = (item: any) => {
    const printContent = `
      <div style="direction: rtl; font-family: Arial; padding: 20px;">
        <h2>تفاصيل العنصر</h2>
        <table style="border-collapse: collapse; width: 100%;">
          ${Object.entries(item).map(([key, value]) => 
            `<tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>${key}:</strong></td>
             <td style="border: 1px solid #ccc; padding: 8px;">${value}</td></tr>`
          ).join('')}
        </table>
      </div>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Filter function for search and status
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

  // Get filtered data for each tab
  const getFilteredCustomers = () => filterData(customers, ['name', 'name_ar', 'phone', 'address']);
  const getFilteredProducts = () => filterData(products, ['name', 'name_ar', 'code', 'type']);
  const getFilteredSections = () => filterData(sections, ['name', 'name_ar', 'description']);
  const getFilteredMaterialGroups = () => filterData(materialGroups, ['name', 'name_ar', 'code', 'description']);
  const getFilteredItems = () => filterData(items, ['name', 'name_ar', 'code', 'unit', 'unit_ar']);
  const getFilteredCustomerProducts = () => filterData(customerProducts, ['customer_product_name', 'customer_product_name_ar', 'customer_product_code']);
  const getFilteredLocations = () => filterData(locations, ['name', 'name_ar', 'type', 'coordinates']);
  const getFilteredMachines = () => filterData(machines, ['name', 'name_ar', 'type']);
  const getFilteredUsers = () => filterData(users, ['username', 'display_name_ar', 'display_name']);

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

  const renderItemForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item-name-ar">اسم الصنف بالعربية</Label>
          <Input
            id="item-name-ar"
            value={itemForm.name_ar}
            onChange={(e) => setItemForm(prev => ({ ...prev, name_ar: e.target.value }))}
            placeholder="اسم الصنف بالعربية"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-name">اسم الصنف بالإنجليزية</Label>
          <Input
            id="item-name"
            value={itemForm.name}
            onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Item Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-code">كود الصنف</Label>
          <Input
            id="item-code"
            value={itemForm.code}
            onChange={(e) => setItemForm(prev => ({ ...prev, code: e.target.value }))}
            placeholder="I-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-unit">الوحدة بالعربية</Label>
          <Input
            id="item-unit"
            value={itemForm.unit_ar}
            onChange={(e) => setItemForm(prev => ({ ...prev, unit_ar: e.target.value }))}
            placeholder="كيلو، قطعة، متر..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-unit-en">الوحدة بالإنجليزية</Label>
          <Input
            id="item-unit-en"
            value={itemForm.unit}
            onChange={(e) => setItemForm(prev => ({ ...prev, unit: e.target.value }))}
            placeholder="kg, pc, m..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="item-status">الحالة</Label>
          <Select value={itemForm.status} onValueChange={(value) => setItemForm(prev => ({ ...prev, status: value }))}>
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

  const renderMaterialGroupForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mg-name-ar">اسم مجموعة المواد بالعربية</Label>
          <Input
            id="mg-name-ar"
            value={materialGroupForm.name_ar}
            onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, name_ar: e.target.value }))}
            placeholder="اسم مجموعة المواد بالعربية"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mg-name">اسم مجموعة المواد بالإنجليزية</Label>
          <Input
            id="mg-name"
            value={materialGroupForm.name}
            onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Material Group Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mg-code">كود المجموعة</Label>
          <Input
            id="mg-code"
            value={materialGroupForm.code}
            onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, code: e.target.value }))}
            placeholder="MG-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mg-status">الحالة</Label>
          <Select value={materialGroupForm.status} onValueChange={(value) => setMaterialGroupForm(prev => ({ ...prev, status: value }))}>
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
        <Label htmlFor="mg-description">الوصف</Label>
        <Input
          id="mg-description"
          value={materialGroupForm.description}
          onChange={(e) => setMaterialGroupForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="وصف مجموعة المواد"
        />
      </div>
    </div>
  );

  const renderMachineForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="machine-name-ar">اسم الماكينة بالعربية</Label>
          <Input
            id="machine-name-ar"
            value={machineForm.name_ar}
            onChange={(e) => setMachineForm(prev => ({ ...prev, name_ar: e.target.value }))}
            placeholder="اسم الماكينة بالعربية"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="machine-name">اسم الماكينة بالإنجليزية</Label>
          <Input
            id="machine-name"
            value={machineForm.name}
            onChange={(e) => setMachineForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Machine Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="machine-type">نوع الماكينة</Label>
          <Select value={machineForm.type} onValueChange={(value) => setMachineForm(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="extrusion">بثق</SelectItem>
              <SelectItem value="printing">طباعة</SelectItem>
              <SelectItem value="cutting">قطع</SelectItem>
              <SelectItem value="packaging">تعبئة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="machine-speed">معدل السرعة</Label>
          <Input
            id="machine-speed"
            value={machineForm.speed_rating}
            onChange={(e) => setMachineForm(prev => ({ ...prev, speed_rating: e.target.value }))}
            placeholder="100 م/دقيقة"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="machine-status">الحالة</Label>
          <Select value={machineForm.status} onValueChange={(value) => setMachineForm(prev => ({ ...prev, status: value }))}>
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

  const renderUserForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="user-username">اسم المستخدم</Label>
          <Input
            id="user-username"
            value={userForm.username}
            onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
            placeholder="username"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-display-name">الاسم المعروض</Label>
          <Input
            id="user-display-name"
            value={userForm.display_name_ar}
            onChange={(e) => setUserForm(prev => ({ ...prev, display_name_ar: e.target.value }))}
            placeholder="الاسم المعروض بالعربية"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-role">الدور</Label>
          <Select value={userForm.role_id.toString()} onValueChange={(value) => setUserForm(prev => ({ ...prev, role_id: parseInt(value) }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">مدير عام</SelectItem>
              <SelectItem value="2">مشرف</SelectItem>
              <SelectItem value="3">عامل</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-section">القسم</Label>
          <Select value={userForm.section_id.toString()} onValueChange={(value) => setUserForm(prev => ({ ...prev, section_id: parseInt(value) }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">الإنتاج</SelectItem>
              <SelectItem value="2">الجودة</SelectItem>
              <SelectItem value="3">الصيانة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-status">الحالة</Label>
          <Select value={userForm.status} onValueChange={(value) => setUserForm(prev => ({ ...prev, status: value }))}>
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

  const renderSectionForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="section-name-ar">اسم القسم بالعربية</Label>
          <Input
            id="section-name-ar"
            value={sectionForm.name_ar}
            onChange={(e) => setSectionForm(prev => ({ ...prev, name_ar: e.target.value }))}
            placeholder="اسم القسم بالعربية"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="section-name">اسم القسم بالإنجليزية</Label>
          <Input
            id="section-name"
            value={sectionForm.name}
            onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Section Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="section-status">الحالة</Label>
          <Select value={sectionForm.status} onValueChange={(value) => setSectionForm(prev => ({ ...prev, status: value }))}>
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
        <Label htmlFor="section-description">الوصف</Label>
        <Input
          id="section-description"
          value={sectionForm.description}
          onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="وصف القسم"
        />
      </div>
    </div>
  );

  const renderLocationForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location-name-ar">اسم الموقع بالعربية</Label>
          <Input
            id="location-name-ar"
            value={locationForm.name_ar}
            onChange={(e) => setLocationForm(prev => ({ ...prev, name_ar: e.target.value }))}
            placeholder="اسم الموقع بالعربية"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location-name">اسم الموقع بالإنجليزية</Label>
          <Input
            id="location-name"
            value={locationForm.name}
            onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Location Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location-type">نوع الموقع</Label>
          <Select value={locationForm.type} onValueChange={(value) => setLocationForm(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="country">دولة</SelectItem>
              <SelectItem value="governorate">محافظة</SelectItem>
              <SelectItem value="city">مدينة</SelectItem>
              <SelectItem value="district">منطقة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location-coordinates">الإحداثيات</Label>
          <Input
            id="location-coordinates"
            value={locationForm.coordinates}
            onChange={(e) => setLocationForm(prev => ({ ...prev, coordinates: e.target.value }))}
            placeholder="33.3152, 44.3661"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location-status">الحالة</Label>
          <Select value={locationForm.status} onValueChange={(value) => setLocationForm(prev => ({ ...prev, status: value }))}>
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

  const renderCustomerProductForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cp-customer">العميل</Label>
          <Select value={customerProductForm.customer_id?.toString() || ""} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, customer_id: value }))}>
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
          <Label htmlFor="cp-code">كود المنتج عند العميل</Label>
          <Input
            id="cp-code"
            value={customerProductForm.customer_product_code}
            onChange={(e) => setCustomerProductForm(prev => ({ ...prev, customer_product_code: e.target.value }))}
            placeholder="CP-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-name-ar">اسم المنتج بالعربية</Label>
          <Input
            id="cp-name-ar"
            value={customerProductForm.customer_product_name_ar}
            onChange={(e) => setCustomerProductForm(prev => ({ ...prev, customer_product_name_ar: e.target.value }))}
            placeholder="اسم المنتج عند العميل"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-name">اسم المنتج بالإنجليزية</Label>
          <Input
            id="cp-name"
            value={customerProductForm.customer_product_name}
            onChange={(e) => setCustomerProductForm(prev => ({ ...prev, customer_product_name: e.target.value }))}
            placeholder="Customer Product Name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-price">السعر</Label>
          <Input
            id="cp-price"
            value={customerProductForm.price}
            onChange={(e) => setCustomerProductForm(prev => ({ ...prev, price: e.target.value }))}
            placeholder="1000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cp-status">الحالة</Label>
          <Select value={customerProductForm.status} onValueChange={(value) => setCustomerProductForm(prev => ({ ...prev, status: value }))}>
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
        <Label htmlFor="cp-specs">المواصفات</Label>
        <Input
          id="cp-specs"
          value={customerProductForm.specifications}
          onChange={(e) => setCustomerProductForm(prev => ({ ...prev, specifications: e.target.value }))}
          placeholder="مواصفات المنتج الخاصة بالعميل"
        />
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
            <TabsList className="grid w-full grid-cols-9 text-xs">
              <TabsTrigger value="customers" className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                العملاء
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                المنتجات
              </TabsTrigger>
              <TabsTrigger value="sections" className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                الأقسام
              </TabsTrigger>
              <TabsTrigger value="material-groups" className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                مجموعات المواد
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                الأصناف
              </TabsTrigger>
              <TabsTrigger value="customer-products" className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                منتجات العملاء
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                المواقع
              </TabsTrigger>
              <TabsTrigger value="machines" className="flex items-center gap-1">
                <Cog className="w-3 h-3" />
                المكائن
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
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

            <TabsContent value="sections" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(materialGroups) && materialGroups.length > 0 ? (
                            materialGroups.map((group) => (
                              <tr key={group.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {group.name_ar || group.name}
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المجموعة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوحدة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(items) && items.length > 0 ? (
                            items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {item.name_ar || item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.code || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.material_group_id ? `مجموعة ${item.material_group_id}` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.unit_ar || item.unit || '-'}
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

            <TabsContent value="customer-products" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنتج</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">كود العميل</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(customerProducts) && customerProducts.length > 0 ? (
                            customerProducts.map((cp) => (
                              <tr key={cp.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  عميل {cp.customer_id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {cp.customer_product_name_ar || cp.customer_product_name || `منتج ${cp.product_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {cp.customer_product_code || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {cp.price ? `${cp.price} د.ع` : '-'}
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

            <TabsContent value="locations" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      إدارة المواقع الجغرافية
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنطقة الأب</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإحداثيات</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(locations) && locations.length > 0 ? (
                            locations.map((location) => (
                              <tr key={location.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {location.name_ar || location.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {location.type === 'country' ? 'دولة' :
                                   location.type === 'governorate' ? 'محافظة' :
                                   location.type === 'city' ? 'مدينة' :
                                   location.type === 'district' ? 'منطقة' : location.type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {location.parent_id ? `منطقة ${location.parent_id}` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {location.coordinates || '-'}
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Cog className="w-5 h-5" />
                      إدارة المكائن
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">معدل الإنتاج</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(machines) && machines.length > 0 ? (
                            machines.map((machine) => (
                              <tr key={machine.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {machine.name_ar || machine.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {machine.type || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {machine.section_id ? `قسم ${machine.section_id}` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {machine.production_rate ? `${machine.production_rate}/ساعة` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge variant={machine.status === 'operational' ? 'default' : 'secondary'}>
                                    {machine.status === 'operational' ? 'يعمل' : 
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

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم المستخدم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">القسم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(users) && users.length > 0 ? (
                            users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {user.display_name_ar || user.display_name || user.username}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.username}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.role_id === 1 ? 'مدير عام' :
                                   user.role_id === 2 ? 'مشرف' :
                                   user.role_id === 3 ? 'عامل' : `دور ${user.role_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.section_id ? `قسم ${user.section_id}` : '-'}
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
          </Tabs>

          {/* Shared Dialog for All Tabs */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 
                    (selectedTab === 'items' ? 'تعديل الصنف' :
                     selectedTab === 'material-groups' ? 'تعديل مجموعة المواد' :
                     selectedTab === 'customer-products' ? 'تعديل منتج العميل' :
                     selectedTab === 'locations' ? 'تعديل الموقع' :
                     selectedTab === 'machines' ? 'تعديل الماكينة' :
                     selectedTab === 'users' ? 'تعديل المستخدم' :
                     selectedTab === 'sections' ? 'تعديل القسم' : 'تعديل العنصر') :
                    (selectedTab === 'items' ? 'إضافة صنف جديد' :
                     selectedTab === 'material-groups' ? 'إضافة مجموعة مواد جديدة' :
                     selectedTab === 'customer-products' ? 'إضافة منتج عميل جديد' :
                     selectedTab === 'locations' ? 'إضافة موقع جديد' :
                     selectedTab === 'machines' ? 'إضافة ماكينة جديدة' :
                     selectedTab === 'users' ? 'إضافة مستخدم جديد' :
                     selectedTab === 'sections' ? 'إضافة قسم جديد' : 'إضافة عنصر جديد')
                  }
                </DialogTitle>
              </DialogHeader>
              
              {selectedTab === 'items' && renderItemForm()}
              {selectedTab === 'material-groups' && renderMaterialGroupForm()}
              {selectedTab === 'customer-products' && renderCustomerProductForm()}
              {selectedTab === 'locations' && renderLocationForm()}
              {selectedTab === 'machines' && renderMachineForm()}
              {selectedTab === 'users' && renderUserForm()}
              {selectedTab === 'sections' && renderSectionForm()}
              
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
        </main>
      </div>
    </div>
  );
}