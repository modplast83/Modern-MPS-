import React, { useState, useEffect } from "react";
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
    name: '', name_ar: '', type: 'extruder', section_id: 'none', status: 'active'
  });
  const [userForm, setUserForm] = useState({
    username: '', display_name: '', display_name_ar: '', role_id: '', section_id: 'none', status: 'active'
  });

  // Master Batch Colors
  const masterBatchColors = [
    { id: 'white', name: 'أبيض', name_ar: 'أبيض', color: '#FFFFFF', textColor: '#000000' },
    { id: 'black', name: 'أسود', name_ar: 'أسود', color: '#000000', textColor: '#FFFFFF' },
    { id: 'red', name: 'أحمر', name_ar: 'أحمر', color: '#DC2626', textColor: '#FFFFFF' },
    { id: 'blue', name: 'أزرق', name_ar: 'أزرق', color: '#2563EB', textColor: '#FFFFFF' },
    { id: 'green', name: 'أخضر', name_ar: 'أخضر', color: '#16A34A', textColor: '#FFFFFF' },
    { id: 'yellow', name: 'أصفر', name_ar: 'أصفر', color: '#EAB308', textColor: '#000000' },
    { id: 'orange', name: 'برتقالي', name_ar: 'برتقالي', color: '#EA580C', textColor: '#FFFFFF' },
    { id: 'purple', name: 'بنفسجي', name_ar: 'بنفسجي', color: '#9333EA', textColor: '#FFFFFF' },
    { id: 'brown', name: 'بني', name_ar: 'بني', color: '#92400E', textColor: '#FFFFFF' },
    { id: 'pink', name: 'وردي', name_ar: 'وردي', color: '#EC4899', textColor: '#FFFFFF' },
    { id: 'gray', name: 'رمادي', name_ar: 'رمادي', color: '#6B7280', textColor: '#FFFFFF' },
    { id: 'navy', name: 'كحلي', name_ar: 'كحلي', color: '#1E3A8A', textColor: '#FFFFFF' },
    { id: 'gold', name: 'ذهبي', name_ar: 'ذهبي', color: '#D97706', textColor: '#FFFFFF' },
    { id: 'silver', name: 'فضي', name_ar: 'فضي', color: '#9CA3AF', textColor: '#000000' },
    { id: 'lime', name: 'ليموني', name_ar: 'ليموني', color: '#65A30D', textColor: '#FFFFFF' },
    { id: 'transparent', name: 'شفاف', name_ar: 'شفاف', color: 'transparent', textColor: '#000000' },
  ];

  // Automatic calculations
  React.useEffect(() => {
    // Auto-calculate cutting length based on printing cylinder
    if (customerProductForm.printing_cylinder && customerProductForm.printing_cylinder !== 'بدون طباعة') {
      const cylinderNumber = parseInt(customerProductForm.printing_cylinder.replace(/\D/g, ''));
      if (cylinderNumber) {
        const calculatedLength = Math.round(cylinderNumber * 3.14159); // Cylinder circumference approximation
        setCustomerProductForm(prev => ({
          ...prev,
          cutting_length_cm: calculatedLength.toString()
        }));
      }
    }
  }, [customerProductForm.printing_cylinder]);

  React.useEffect(() => {
    // Auto-generate size caption based on dimensions
    const { width, left_facing, right_facing, cutting_length_cm } = customerProductForm;
    if (width && left_facing && right_facing && cutting_length_cm) {
      const w = parseFloat(width);
      const lf = parseFloat(left_facing);
      const rf = parseFloat(right_facing);
      const cl = parseFloat(cutting_length_cm);
      
      if (w && lf && rf && cl) {
        const totalWidth = lf + rf;
        const sizeCaption = `${totalWidth}x${cl} سم (${w} عرض)`;
        setCustomerProductForm(prev => ({
          ...prev,
          size_caption: sizeCaption
        }));
      }
    }
  }, [customerProductForm.width, customerProductForm.left_facing, customerProductForm.right_facing, customerProductForm.cutting_length_cm]);

  React.useEffect(() => {
    // Auto-calculate unit weight based on dimensions and thickness
    const { width, left_facing, right_facing, thickness } = customerProductForm;
    if (width && left_facing && right_facing && thickness) {
      const w = parseFloat(width);
      const lf = parseFloat(left_facing);
      const rf = parseFloat(right_facing);
      const th = parseFloat(thickness);
      
      if (w && lf && rf && th) {
        const totalArea = (lf + rf) * w; // cm²
        const volume = totalArea * (th / 10000); // Convert microns to cm
        const density = 0.92; // PE density g/cm³
        const weight = (volume * density) / 1000; // Convert to kg
        
        setCustomerProductForm(prev => ({
          ...prev,
          unit_weight_kg: weight.toFixed(4)
        }));
      }
    }
  }, [customerProductForm.width, customerProductForm.left_facing, customerProductForm.right_facing, customerProductForm.thickness]);

  React.useEffect(() => {
    // Auto-calculate package weight based on unit weight and quantity
    const { unit_weight_kg, unit_quantity } = customerProductForm;
    if (unit_weight_kg && unit_quantity) {
      const unitWeight = parseFloat(unit_weight_kg);
      const quantity = parseInt(unit_quantity);
      
      if (unitWeight && quantity) {
        const packageWeight = unitWeight * quantity;
        setCustomerProductForm(prev => ({
          ...prev,
          package_weight_kg: packageWeight.toFixed(3)
        }));
      }
    }
  }, [customerProductForm.unit_weight_kg, customerProductForm.unit_quantity]);

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

  // Auto-calculations after data is loaded
  React.useEffect(() => {
    // Auto-set cutting unit based on item category
    const { category_id } = customerProductForm;
    if (category_id && category_id !== 'none' && categories.length > 0) {
      const category = categories.find((cat: any) => cat.id === category_id);
      if (category) {
        let cuttingUnit = 'قطعة';
        if (category.name_ar?.includes('أكياس')) {
          cuttingUnit = 'كيس';
        } else if (category.name_ar?.includes('رولات')) {
          cuttingUnit = 'رول';
        } else if (category.name_ar?.includes('أغطية')) {
          cuttingUnit = 'غطاء';
        }
        
        setCustomerProductForm(prev => ({
          ...prev,
          cutting_unit: cuttingUnit
        }));
      }
    }
  }, [customerProductForm.category_id, categories]);

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

  // All mutations for different entities
  
  // Customer mutations
  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في إنشاء العميل:', error);
      toast({ title: "خطأ في إنشاء العميل", variant: "destructive" });
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث العميل:', error);
      toast({ title: "خطأ في تحديث العميل", variant: "destructive" });
    }
  });

  // Section mutations
  const createSectionMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/sections", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء القسم بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في إنشاء القسم:', error);
      toast({ title: "خطأ في إنشاء القسم", variant: "destructive" });
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/sections/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث القسم بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث القسم:', error);
      toast({ title: "خطأ في تحديث القسم", variant: "destructive" });
    }
  });

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

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/items", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء الصنف بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في إنشاء الصنف:', error);
      toast({ title: "خطأ في إنشاء الصنف", variant: "destructive" });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث الصنف بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث الصنف:', error);
      toast({ title: "خطأ في تحديث الصنف", variant: "destructive" });
    }
  });

  // Customer Product mutations
  const createCustomerProductMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/customer-products", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-products'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء منتج العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في إنشاء منتج العميل:', error);
      toast({ title: "خطأ في إنشاء منتج العميل", variant: "destructive" });
    }
  });

  const updateCustomerProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/customer-products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-products'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث منتج العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث منتج العميل:', error);
      toast({ title: "خطأ في تحديث منتج العميل", variant: "destructive" });
    }
  });

  // Location mutations
  const createLocationMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/locations", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء الموقع بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في إنشاء الموقع:', error);
      toast({ title: "خطأ في إنشاء الموقع", variant: "destructive" });
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/locations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث الموقع بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث الموقع:', error);
      toast({ title: "خطأ في تحديث الموقع", variant: "destructive" });
    }
  });

  // Machine mutations
  const createMachineMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/machines", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء الماكينة بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في إنشاء الماكينة:', error);
      toast({ title: "خطأ في إنشاء الماكينة", variant: "destructive" });
    }
  });

  const updateMachineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/machines/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/machines'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث الماكينة بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث الماكينة:', error);
      toast({ title: "خطأ في تحديث الماكينة", variant: "destructive" });
    }
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء المستخدم بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في إنشاء المستخدم:', error);
      toast({ title: "خطأ في إنشاء المستخدم", variant: "destructive" });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث المستخدم بنجاح" });
    },
    onError: (error: any) => {
      console.error('خطأ في تحديث المستخدم:', error);
      toast({ title: "خطأ في تحديث المستخدم", variant: "destructive" });
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
    setMachineForm({ name: '', name_ar: '', type: 'extruder', section_id: 'none', status: 'active' });
    setUserForm({ username: '', display_name: '', display_name_ar: '', role_id: '', section_id: 'none', status: 'active' });
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-screen">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:mr-64 p-4 lg:p-6"
              style={{ marginRight: '16rem' }}>
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
                                          onClick={() => {
                                            setEditingItem(customer);
                                            setCustomerForm({
                                              name: customer.name || '',
                                              name_ar: customer.name_ar || '',
                                              code: customer.code || '',
                                              user_id: customer.user_id || '',
                                              plate_drawer_code: customer.plate_drawer_code || '',
                                              city: customer.city || '',
                                              address: customer.address || '',
                                              tax_number: customer.tax_number || '',
                                              phone: customer.phone || '',
                                              sales_rep_id: customer.sales_rep_id || ''
                                            });
                                            setSelectedTab('customers');
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
                                          onClick={() => {
                                            setEditingItem(section);
                                            setSectionForm({
                                              name: section.name || '',
                                              name_ar: section.name_ar || '',
                                              description: section.description || ''
                                            });
                                            setSelectedTab('sections');
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
                                          onClick={() => {
                                            setEditingItem(item);
                                            setItemForm({
                                              name: item.name || '',
                                              name_ar: item.name_ar || '',
                                              code: item.code || '',
                                              category_id: item.category_id || 'none',
                                              status: item.status || 'active'
                                            });
                                            setSelectedTab('items');
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
                                          onClick={() => {
                                            setEditingItem(product);
                                            setCustomerProductForm({
                                              customer_id: product.customer_id || 'none',
                                              category_id: product.category_id || 'none',
                                              item_id: product.item_id || 'none',
                                              size_caption: product.size_caption || '',
                                              width: product.width || '',
                                              left_facing: product.left_facing || '',
                                              right_facing: product.right_facing || '',
                                              thickness: product.thickness || '',
                                              printing_cylinder: product.printing_cylinder || 'بدون طباعة',
                                              cutting_length_cm: product.cutting_length_cm || '',
                                              raw_material: product.raw_material || '',
                                              master_batch_id: product.master_batch_id || '',
                                              is_printed: product.is_printed || false,
                                              cutting_unit: product.cutting_unit || '',
                                              punching: product.punching || '',
                                              unit_weight_kg: product.unit_weight_kg || '',
                                              unit_quantity: product.unit_quantity || '',
                                              package_weight_kg: product.package_weight_kg || '',
                                              cliche_front_design: product.cliche_front_design || '',
                                              cliche_back_design: product.cliche_back_design || '',
                                              notes: product.notes || '',
                                              status: product.status || 'active'
                                            });
                                            setSelectedTab('customer-products');
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
                                          onClick={() => {
                                            setEditingItem(location);
                                            setLocationForm({
                                              name: location.name || '',
                                              name_ar: location.name_ar || '',
                                              type: location.type || 'city',
                                              parent_id: location.parent_id || '',
                                              coordinates: location.coordinates || '',
                                              status: location.status || 'active'
                                            });
                                            setSelectedTab('locations');
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
                                          onClick={() => {
                                            setEditingItem(machine);
                                            setMachineForm({
                                              name: machine.name || '',
                                              name_ar: machine.name_ar || '',
                                              type: machine.type || 'extruder',
                                              section_id: machine.section_id || '',
                                              status: machine.status || 'active'
                                            });
                                            setSelectedTab('machines');
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
                                          onClick={() => {
                                            setEditingItem(user);
                                            setUserForm({
                                              username: user.username || '',
                                              display_name: user.display_name || '',
                                              display_name_ar: user.display_name_ar || '',
                                              role_id: user.role_id || '',
                                              section_id: user.section_id || '',
                                              status: user.status || 'active'
                                            });
                                            setSelectedTab('users');
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
            
            {/* All Dialogs for different entities */}
            
            {/* Customer Add/Edit Dialog */}
            {selectedTab === 'customers' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث العميل" : "إضافة عميل جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={customerForm.name_ar}
                          onChange={(e) => setCustomerForm({...customerForm, name_ar: e.target.value})}
                          placeholder="اسم العميل بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={customerForm.name}
                          onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                          placeholder="Customer Name"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="code">كود العميل</Label>
                        <Input
                          id="code"
                          value={customerForm.code}
                          onChange={(e) => setCustomerForm({...customerForm, code: e.target.value})}
                          placeholder="كود العميل"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">الهاتف</Label>
                        <Input
                          id="phone"
                          value={customerForm.phone}
                          onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                          placeholder="رقم الهاتف"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">المدينة</Label>
                        <Input
                          id="city"
                          value={customerForm.city}
                          onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})}
                          placeholder="المدينة"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">العنوان</Label>
                      <Input
                        id="address"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                        placeholder="العنوان كاملاً"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateCustomerMutation.mutate({ id: editingItem.id, data: customerForm });
                        } else {
                          createCustomerMutation.mutate(customerForm);
                        }
                      }}
                      disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                    >
                      {createCustomerMutation.isPending || updateCustomerMutation.isPending ? (
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

            {/* Section Add/Edit Dialog */}
            {selectedTab === 'sections' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث القسم" : "إضافة قسم جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={sectionForm.name_ar}
                          onChange={(e) => setSectionForm({...sectionForm, name_ar: e.target.value})}
                          placeholder="اسم القسم بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={sectionForm.name}
                          onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                          placeholder="Section Name"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Input
                        id="description"
                        value={sectionForm.description}
                        onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                        placeholder="وصف القسم (اختياري)"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateSectionMutation.mutate({ id: editingItem.id, data: sectionForm });
                        } else {
                          createSectionMutation.mutate(sectionForm);
                        }
                      }}
                      disabled={createSectionMutation.isPending || updateSectionMutation.isPending}
                    >
                      {createSectionMutation.isPending || updateSectionMutation.isPending ? (
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

            {/* Items Add/Edit Dialog */}
            {selectedTab === 'items' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث الصنف" : "إضافة صنف جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={itemForm.name_ar}
                          onChange={(e) => setItemForm({...itemForm, name_ar: e.target.value})}
                          placeholder="اسم الصنف بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={itemForm.name}
                          onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                          placeholder="Item Name"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="code">كود الصنف</Label>
                        <Input
                          id="code"
                          value={itemForm.code}
                          onChange={(e) => setItemForm({...itemForm, code: e.target.value})}
                          placeholder="كود الصنف"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category_id">الفئة</Label>
                        <Select 
                          value={itemForm.category_id} 
                          onValueChange={(value) => setItemForm({...itemForm, category_id: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون فئة</SelectItem>
                            {Array.isArray(categories) && categories.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name_ar || cat.name} ({cat.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateItemMutation.mutate({ id: editingItem.id, data: itemForm });
                        } else {
                          createItemMutation.mutate(itemForm);
                        }
                      }}
                      disabled={createItemMutation.isPending || updateItemMutation.isPending}
                    >
                      {createItemMutation.isPending || updateItemMutation.isPending ? (
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

            {/* Customer Products Add/Edit Dialog */}
            {selectedTab === 'customer-products' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث منتج العميل" : "إضافة منتج عميل جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {/* العميل والفئة والصنف */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="customer_id">العميل *</Label>
                        <Select 
                          value={customerProductForm.customer_id} 
                          onValueChange={(value) => setCustomerProductForm({...customerProductForm, customer_id: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر العميل" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">اختر العميل</SelectItem>
                            {Array.isArray(customers) && customers.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name_ar || customer.name} ({customer.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="category_id">الفئة</Label>
                        <Select 
                          value={customerProductForm.category_id} 
                          onValueChange={(value) => setCustomerProductForm({...customerProductForm, category_id: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">اختر الفئة</SelectItem>
                            {Array.isArray(categories) && categories.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name_ar || cat.name} ({cat.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item_id">الصنف</Label>
                        <Select 
                          value={customerProductForm.item_id} 
                          onValueChange={(value) => setCustomerProductForm({...customerProductForm, item_id: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الصنف" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">اختر الصنف</SelectItem>
                            {Array.isArray(items) && items.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name_ar || item.name} ({item.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* وصف الحجم والأبعاد */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">مواصفات المنتج</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="size_caption">وصف الحجم</Label>
                          <Input
                            id="size_caption"
                            value={customerProductForm.size_caption}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, size_caption: e.target.value})}
                            placeholder="مثال: صغير، متوسط، كبير"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="status">الحالة</Label>
                          <Select 
                            value={customerProductForm.status} 
                            onValueChange={(value) => setCustomerProductForm({...customerProductForm, status: value})}
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
                    </div>

                    {/* الأبعاد الأساسية */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">الأبعاد والقياسات</h4>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="width">العرض (سم)</Label>
                          <Input
                            id="width"
                            type="number"
                            step="0.01"
                            value={customerProductForm.width}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, width: e.target.value})}
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="left_facing">الوجه الأيسر (سم)</Label>
                          <Input
                            id="left_facing"
                            type="number"
                            step="0.01"
                            value={customerProductForm.left_facing}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, left_facing: e.target.value})}
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="right_facing">الوجه الأيمن (سم)</Label>
                          <Input
                            id="right_facing"
                            type="number"
                            step="0.01"
                            value={customerProductForm.right_facing}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, right_facing: e.target.value})}
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="thickness">السماكة (ميكرون)</Label>
                          <Input
                            id="thickness"
                            type="number"
                            step="0.01"
                            value={customerProductForm.thickness}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, thickness: e.target.value})}
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* الطباعة والقطع */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">مواصفات الطباعة والقطع</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="printing_cylinder">أسطوانة الطباعة</Label>
                          <Input
                            id="printing_cylinder"
                            value={customerProductForm.printing_cylinder}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, printing_cylinder: e.target.value})}
                            placeholder="رقم الأسطوانة أو بدون طباعة"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cutting_length_cm">طول القطع (سم)</Label>
                          <Input
                            id="cutting_length_cm"
                            type="number"
                            value={customerProductForm.cutting_length_cm}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, cutting_length_cm: e.target.value})}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cutting_unit">وحدة القطع</Label>
                          <Input
                            id="cutting_unit"
                            value={customerProductForm.cutting_unit}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, cutting_unit: e.target.value})}
                            placeholder="قطعة، متر، كيس"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="punching">التثقيب</Label>
                          <Input
                            id="punching"
                            value={customerProductForm.punching}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, punching: e.target.value})}
                            placeholder="نوع التثقيب أو بدون"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2 mt-6">
                          <input
                            type="checkbox"
                            id="is_printed"
                            checked={customerProductForm.is_printed}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, is_printed: e.target.checked})}
                            className="rounded"
                          />
                          <Label htmlFor="is_printed">منتج مطبوع</Label>
                        </div>
                      </div>
                    </div>

                    {/* المواد والخامات */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">المواد والخامات</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="raw_material">المادة الخام</Label>
                          <Input
                            id="raw_material"
                            value={customerProductForm.raw_material}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, raw_material: e.target.value})}
                            placeholder="نوع المادة الخام"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="master_batch_id">لون الماستر باتش</Label>
                          <Select 
                            value={customerProductForm.master_batch_id} 
                            onValueChange={(value) => setCustomerProductForm({...customerProductForm, master_batch_id: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="اختر اللون" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">بدون لون</SelectItem>
                              {masterBatchColors.map((color) => (
                                <SelectItem key={color.id} value={color.id}>
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center"
                                      style={{ 
                                        backgroundColor: color.color,
                                        border: color.id === 'transparent' ? '2px dashed #ccc' : `2px solid ${color.color}`
                                      }}
                                    >
                                      {color.id === 'transparent' && <span className="text-xs text-gray-400">⊘</span>}
                                    </div>
                                    <span className="font-medium">{color.name_ar}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* الأوزان والكميات */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">الأوزان والكميات</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="unit_weight_kg">وزن الوحدة (كغ)</Label>
                          <Input
                            id="unit_weight_kg"
                            type="number"
                            step="0.001"
                            value={customerProductForm.unit_weight_kg}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, unit_weight_kg: e.target.value})}
                            placeholder="0.000"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit_quantity">كمية الوحدة</Label>
                          <Input
                            id="unit_quantity"
                            type="number"
                            value={customerProductForm.unit_quantity}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, unit_quantity: e.target.value})}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="package_weight_kg">وزن العبوة (كغ)</Label>
                          <Input
                            id="package_weight_kg"
                            type="number"
                            step="0.001"
                            value={customerProductForm.package_weight_kg}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, package_weight_kg: e.target.value})}
                            placeholder="0.000"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* الكليشيهات والتصاميم */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium">الكليشيهات والتصاميم</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cliche_front_design">تصميم الوجه الأمامي</Label>
                          <Input
                            id="cliche_front_design"
                            value={customerProductForm.cliche_front_design}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, cliche_front_design: e.target.value})}
                            placeholder="وصف أو كود التصميم الأمامي"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cliche_back_design">تصميم الوجه الخلفي</Label>
                          <Input
                            id="cliche_back_design"
                            value={customerProductForm.cliche_back_design}
                            onChange={(e) => setCustomerProductForm({...customerProductForm, cliche_back_design: e.target.value})}
                            placeholder="وصف أو كود التصميم الخلفي"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ملاحظات */}
                    <div>
                      <Label htmlFor="notes">ملاحظات</Label>
                      <textarea
                        id="notes"
                        value={customerProductForm.notes}
                        onChange={(e) => setCustomerProductForm({...customerProductForm, notes: e.target.value})}
                        placeholder="أي ملاحظات إضافية حول المنتج..."
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateCustomerProductMutation.mutate({ id: editingItem.id, data: customerProductForm });
                        } else {
                          createCustomerProductMutation.mutate(customerProductForm);
                        }
                      }}
                      disabled={createCustomerProductMutation.isPending || updateCustomerProductMutation.isPending}
                    >
                      {createCustomerProductMutation.isPending || updateCustomerProductMutation.isPending ? (
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

            {/* Locations Add/Edit Dialog */}
            {selectedTab === 'locations' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث الموقع" : "إضافة موقع جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={locationForm.name_ar}
                          onChange={(e) => setLocationForm({...locationForm, name_ar: e.target.value})}
                          placeholder="اسم الموقع بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={locationForm.name}
                          onChange={(e) => setLocationForm({...locationForm, name: e.target.value})}
                          placeholder="Location Name"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">النوع</Label>
                        <Select 
                          value={locationForm.type} 
                          onValueChange={(value) => setLocationForm({...locationForm, type: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="city">مدينة</SelectItem>
                            <SelectItem value="warehouse">مستودع</SelectItem>
                            <SelectItem value="factory">مصنع</SelectItem>
                            <SelectItem value="office">مكتب</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="coordinates">الإحداثيات</Label>
                        <Input
                          id="coordinates"
                          value={locationForm.coordinates}
                          onChange={(e) => setLocationForm({...locationForm, coordinates: e.target.value})}
                          placeholder="lat,lng"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateLocationMutation.mutate({ id: editingItem.id, data: locationForm });
                        } else {
                          createLocationMutation.mutate(locationForm);
                        }
                      }}
                      disabled={createLocationMutation.isPending || updateLocationMutation.isPending}
                    >
                      {createLocationMutation.isPending || updateLocationMutation.isPending ? (
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

            {/* Machines Add/Edit Dialog */}
            {selectedTab === 'machines' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث الماكينة" : "إضافة ماكينة جديدة"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={machineForm.name_ar}
                          onChange={(e) => setMachineForm({...machineForm, name_ar: e.target.value})}
                          placeholder="اسم الماكينة بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={machineForm.name}
                          onChange={(e) => setMachineForm({...machineForm, name: e.target.value})}
                          placeholder="Machine Name"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">النوع</Label>
                        <Select 
                          value={machineForm.type} 
                          onValueChange={(value) => setMachineForm({...machineForm, type: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="extruder">بثق</SelectItem>
                            <SelectItem value="cutting">قطع</SelectItem>
                            <SelectItem value="printing">طباعة</SelectItem>
                            <SelectItem value="packaging">تعبئة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="section_id">القسم</Label>
                        <Select 
                          value={machineForm.section_id} 
                          onValueChange={(value) => setMachineForm({...machineForm, section_id: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون قسم</SelectItem>
                            {Array.isArray(sections) && sections.map((section: any) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.name_ar || section.name} ({section.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateMachineMutation.mutate({ id: editingItem.id, data: machineForm });
                        } else {
                          createMachineMutation.mutate(machineForm);
                        }
                      }}
                      disabled={createMachineMutation.isPending || updateMachineMutation.isPending}
                    >
                      {createMachineMutation.isPending || updateMachineMutation.isPending ? (
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

            {/* Users Add/Edit Dialog */}
            {selectedTab === 'users' && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث المستخدم" : "إضافة مستخدم جديد"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="display_name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="display_name_ar"
                          value={userForm.display_name_ar}
                          onChange={(e) => setUserForm({...userForm, display_name_ar: e.target.value})}
                          placeholder="اسم المستخدم بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="display_name">الاسم بالإنجليزية</Label>
                        <Input
                          id="display_name"
                          value={userForm.display_name}
                          onChange={(e) => setUserForm({...userForm, display_name: e.target.value})}
                          placeholder="Display Name"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">اسم المستخدم *</Label>
                        <Input
                          id="username"
                          value={userForm.username}
                          onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                          placeholder="username"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="section_id">القسم</Label>
                        <Select 
                          value={userForm.section_id} 
                          onValueChange={(value) => setUserForm({...userForm, section_id: value})}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون قسم</SelectItem>
                            {Array.isArray(sections) && sections.map((section: any) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.name_ar || section.name} ({section.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateUserMutation.mutate({ id: editingItem.id, data: userForm });
                        } else {
                          createUserMutation.mutate(userForm);
                        }
                      }}
                      disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    >
                      {createUserMutation.isPending || updateUserMutation.isPending ? (
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