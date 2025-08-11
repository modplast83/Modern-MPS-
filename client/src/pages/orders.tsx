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
import { Package, Plus, Search, FileText, Clock, User, Edit, Trash2, Eye, Calendar, ChevronDown, RefreshCw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const orderFormSchema = z.object({
  customer_id: z.string().min(1, "العميل مطلوب"),
  delivery_days: z.string().min(1, "عدد أيام التسليم مطلوب").transform(val => parseInt(val)),
  notes: z.string().optional()
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
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingProductionOrder, setEditingProductionOrder] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
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
      delivery_days: "7",
      notes: ""
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
    setSelectedCustomerId(""); // Reset customer selection
    setProductionOrdersInForm([]); // Reset production orders
    orderForm.reset({
      customer_id: "",
      delivery_days: "7",
      notes: ""
    });
    setIsOrderDialogOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setSelectedCustomerId(order.customer_id?.toString() || ""); // Set customer for editing
    setProductionOrdersInForm([]); // Reset production orders
    orderForm.reset({
      customer_id: order.customer_id?.toString() || "",
      delivery_days: order.delivery_days?.toString() || "",
      notes: order.notes || ""
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
      console.log('بدء عملية حفظ الطلب...', { data, productionOrdersInForm });
      
      // Check if at least one production order is added
      if (productionOrdersInForm.length === 0) {
        toast({
          title: "تحذير",
          description: "يجب إضافة أمر إنتاج واحد على الأقل",
          variant: "destructive"
        });
        return;
      }

      // Generate order number
      console.log('توليد رقم الطلب...');
      const orderNumberResponse = await fetch('/api/orders/next-number');
      if (!orderNumberResponse.ok) throw new Error('فشل في توليد رقم الطلب');
      const { orderNumber } = await orderNumberResponse.json();
      console.log('رقم الطلب المولد:', orderNumber);
      
      // Create the order first
      const orderData = {
        order_number: orderNumber,
        customer_id: data.customer_id,
        delivery_days: parseInt(data.delivery_days) || 7,
        notes: data.notes || '',
        created_by: "8" // AbuKhalid user ID as string
      };
      
      console.log('إرسال بيانات الطلب:', orderData);
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('خطأ في إنشاء الطلب:', errorText);
        throw new Error(`فشل في إنشاء الطلب: ${errorText}`);
      }
      
      const newOrder = await orderResponse.json();
      console.log('تم إنشاء الطلب بنجاح:', newOrder);
      
      // Create production orders
      console.log('إنشاء أوامر الإنتاج...', productionOrdersInForm.length);
      for (let i = 0; i < productionOrdersInForm.length; i++) {
        const prodOrder = productionOrdersInForm[i];
        console.log(`إنشاء أمر إنتاج ${i + 1}:`, prodOrder);
        
        const prodOrderResponse = await fetch('/api/production-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: newOrder.id,
            customer_product_id: parseInt(prodOrder.customer_product_id),
            quantity_kg: parseFloat(prodOrder.quantity_kg),
            status: prodOrder.status || 'pending'
          })
        });
        
        if (!prodOrderResponse.ok) {
          const errorText = await prodOrderResponse.text();
          console.error(`خطأ في إنشاء أمر الإنتاج ${i + 1}:`, errorText);
        } else {
          const createdProdOrder = await prodOrderResponse.json();
          console.log(`تم إنشاء أمر الإنتاج ${i + 1} بنجاح:`, createdProdOrder);
        }
      }
      
      // Refresh data
      console.log('تحديث البيانات...');
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders'] });
      
      // Reset form
      setIsOrderDialogOpen(false);
      setProductionOrdersInForm([]);
      setSelectedCustomerId("");
      setCustomerSearchTerm("");
      orderForm.reset();
      
      console.log('تمت عملية الحفظ بنجاح');
      toast({
        title: "تم الحفظ بنجاح",
        description: `تم إضافة الطلب رقم ${orderNumber} مع ${productionOrdersInForm.length} أمر إنتاج`
      });
      
    } catch (error) {
      console.error('خطأ في حفظ الطلب:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل في حفظ البيانات",
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

  // Order action handlers
  const handleViewOrder = (order: any) => {
    setViewingOrder(order);
    setSelectedOrderId(order.id);
    setIsViewOrderDialogOpen(true);
  };

  const handlePrintOrder = (order: any) => {
    const customer = customers.find((c: any) => c.id === order.customer_id);
    const user = users.find((u: any) => u.id === parseInt(order.created_by));
    const orderProductionOrders = productionOrders.filter((po: any) => po.order_id === order.id);
    
    // Fetch categories for proper display
    const categories = [
      { id: 'CAT01', name: 'أكياس التسوق', name_ar: 'أكياس التسوق' },
      { id: 'CAT02', name: 'أكياس القمامة', name_ar: 'أكياس القمامة' },
      { id: 'CAT03', name: 'أكياس التعبئة', name_ar: 'أكياس التعبئة' }
    ];
    
    const printContent = `
      <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>طباعة الطلب ${order.order_number}</title>
          <style>
            body { font-family: 'Arial', sans-serif; direction: rtl; margin: 20px; line-height: 1.6; font-size: 16px; color: #000; font-weight: bold; }
            .header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
            .order-info { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px; }
            .info-box { border: 2px solid #000; padding: 20px; border-radius: 8px; background: #fff; }
            .production-orders { margin-top: 25px; margin-bottom: 25px; }
            .production-order-card { page-break-inside: avoid; border: 2px solid #000; margin: 20px 0; padding: 20px; border-radius: 8px; background: #f9f9f9; }
            .user-info { margin-top: 25px; }
            h1 { font-size: 24px; font-weight: bold; color: #000; margin: 10px 0; }
            h3 { color: #000; border-bottom: 2px solid #000; padding-bottom: 8px; font-size: 20px; font-weight: bold; }
            h4 { color: #000; margin-bottom: 15px; font-size: 18px; font-weight: bold; }
            h5 { color: #000; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; font-size: 16px; font-weight: bold; }
            p { margin: 8px 0; font-size: 14px; }
            strong { color: #000; font-weight: bold; }
            @media print { 
              body { margin: 0; font-size: 14px; } 
              .production-order-card { margin: 15px 0; }
              .info-box { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>طلب رقم: ${order.order_number}</h1>
            <p>تاريخ الطباعة: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          
          <div class="order-info">
            <div class="info-box">
              <h3>معلومات الطلب</h3>
              <p><strong>رقم الطلب:</strong> ${order.order_number}</p>
              <p><strong>تاريخ الإنشاء:</strong> ${format(new Date(order.created_at), 'dd/MM/yyyy')}</p>
              <p><strong>مدة التسليم:</strong> ${order.delivery_days} يوم</p>
              <p><strong>الحالة:</strong> ${order.status}</p>
              <p><strong>ملاحظات:</strong> ${order.notes || 'لا توجد ملاحظات'}</p>
            </div>
            
            <div class="info-box">
              <h3>معلومات العميل</h3>
              <p><strong>اسم العميل:</strong> ${customer?.name_ar || customer?.name}</p>
              <p><strong>رقم العميل:</strong> ${customer?.id}</p>
              <p><strong>الهاتف:</strong> ${customer?.phone || 'غير محدد'}</p>
              <p><strong>العنوان:</strong> ${customer?.address || 'غير محدد'}</p>
            </div>
          </div>
          
          
          <div class="production-orders">
            <h3>أوامر الإنتاج</h3>
            ${orderProductionOrders.map((po: any) => {
              const product = customerProducts.find((p: any) => p.id === po.customer_product_id);
              return `
                <div class="production-order-card">
                  <h4>أمر إنتاج: ${po.production_order_number}</h4>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div class="product-details">
                      <h5>تفاصيل المنتج:</h5>
                      <p><strong>اسم المنتج:</strong> ${product?.size_caption || 'غير محدد'}</p>
                      <p><strong>المادة الخام:</strong> ${product?.raw_material || 'غير محدد'}</p>
                      <p><strong>العرض:</strong> ${product?.width || 'غير محدد'} سم</p>
                      <p><strong>السماكة:</strong> ${product?.thickness || 'غير محدد'} مايكرون</p>
                      <p><strong>طول القطع:</strong> ${product?.cutting_length_cm || 'غير محدد'} سم</p>
                      <p><strong>عدد القطع بالكيلو:</strong> ${product?.pieces_per_kg || 'غير محدد'}</p>
                    </div>
                    
                    <div class="product-specs">
                      <h5>المواصفات الفنية:</h5>
                      <p><strong>التخريم:</strong> ${product?.punching || 'بدون تخريم'}</p>
                      <p><strong>الماستر باتش:</strong> ${product?.master_batch_id || 'غير محدد'}</p>
                      ${product?.color ? `<p><strong>اللون:</strong> ${product.color}</p>` : ''}
                      ${product?.bag_type ? `<p><strong>نوع الكيس:</strong> ${product.bag_type}</p>` : ''}
                      <p><strong>الطباعة:</strong> ${product?.print_colors ? `${product.print_colors} لون` : 'بدون طباعة'}</p>
                      <p><strong>فئة المنتج:</strong> ${(() => {
                        const category = categories.find((c: any) => c.id === product?.category_id);
                        return category?.name_ar || category?.name || 'غير محدد';
                      })()}</p>
                    </div>
                    
                    <div class="production-details">
                      <h5>تفاصيل الإنتاج:</h5>
                      <p><strong>الكمية المطلوبة:</strong> ${po.quantity_kg} كيلو</p>
                      <p><strong>عدد القطع المتوقع:</strong> ${product?.pieces_per_kg ? Math.round(parseFloat(po.quantity_kg) * parseFloat(product.pieces_per_kg)) : 'غير محسوب'} قطعة</p>
                      <p><strong>حالة الإنتاج:</strong> ${po.status === 'pending' ? 'في الانتظار' : po.status === 'in_progress' ? 'قيد التنفيذ' : po.status === 'completed' ? 'مكتمل' : 'ملغي'}</p>
                      <p><strong>تاريخ الإنشاء:</strong> ${format(new Date(po.created_at), 'dd/MM/yyyy')}</p>
                      <p><strong>ملاحظات الإنتاج:</strong> ${product?.production_notes || 'لا توجد'}</p>
                    </div>
                  </div>
                  
                  ${product?.additional_notes ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                      <p><strong>ملاحظات إضافية:</strong> ${product.additional_notes}</p>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
          
          <div class="user-info info-box">
            <h3>معلومات المستخدم</h3>
            <p><strong>اسم المستخدم:</strong> ${user?.username}</p>
            <p><strong>رقم المستخدم:</strong> ${user?.id}</p>
            <p><strong>تاريخ إنشاء الطلب:</strong> ${format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast({
      title: "طباعة الطلب",
      description: `تم فتح نافذة طباعة للطلب ${order.order_number}`
    });
  };

  const handleDeleteOrder = async (order: any) => {
    if (!confirm(`هل أنت متأكد من حذف الطلب ${order.order_number}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('فشل في حذف الطلب');
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف الطلب ${order.order_number}`
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الطلب",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (order: any, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('فشل في تحديث حالة الطلب');
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث حالة الطلب ${order.order_number}`
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "في الانتظار", variant: "secondary" as const },
      for_production: { label: "إلى الإنتاج", variant: "default" as const },
      on_hold: { label: "إيقاف مؤقت", variant: "destructive" as const },
      waiting: { label: "انتظار", variant: "outline" as const },
      in_progress: { label: "قيد التنفيذ", variant: "default" as const },
      completed: { label: "مكتمل", variant: "default" as const },
      cancelled: { label: "ملغي", variant: "destructive" as const },
      delivered: { label: "تم التسليم", variant: "default" as const }
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:mr-64 p-6">
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
                                          // Reset production orders when customer changes
                                          setProductionOrdersInForm([]);
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
                                      
                                      <div className="grid grid-cols-1 gap-4">
                                        <div className="col-span-1">
                                          <label className="text-sm font-medium text-gray-700">منتج العميل</label>
                                          <Select 
                                            onValueChange={(value) => updateProductionOrder(index, 'customer_product_id', parseInt(value))}
                                            value={prodOrder.customer_product_id?.toString() || ""}
                                          >
                                            <SelectTrigger className="h-auto min-h-[60px] w-full">
                                              <SelectValue placeholder="اختر المنتج">
                                                {prodOrder.customer_product_id && filteredCustomerProducts.find((p: any) => p.id === prodOrder.customer_product_id) && (
                                                  <div className="text-right w-full py-1">
                                                    <div className="font-medium text-gray-900 text-sm leading-relaxed">
                                                      {(() => {
                                                        const product = filteredCustomerProducts.find((p: any) => p.id === prodOrder.customer_product_id);
                                                        if (!product) return '';
                                                        
                                                        let displayName = '';
                                                        if (product.size_caption) {
                                                          displayName = product.size_caption;
                                                        } else if (product.raw_material && product.width && product.thickness) {
                                                          displayName = `${product.raw_material} ${product.width}×${product.thickness}`;
                                                        } else if (product.raw_material) {
                                                          displayName = product.raw_material;
                                                        } else {
                                                          displayName = 'منتج غير محدد';
                                                        }
                                                        
                                                        if (product.cutting_length_cm) {
                                                          displayName += ` × ${product.cutting_length_cm} سم`;
                                                        }
                                                        
                                                        return displayName;
                                                      })()}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                      {(() => {
                                                        const product = filteredCustomerProducts.find((p: any) => p.id === prodOrder.customer_product_id);
                                                        if (!product) return '';
                                                        
                                                        const details = [];
                                                        if (product.raw_material) details.push(`المادة: ${product.raw_material}`);
                                                        if (product.thickness) details.push(`السماكة: ${product.thickness}`);
                                                        if (product.master_batch_id) details.push(`اللون: ${product.master_batch_id}`);
                                                        
                                                        return details.slice(0, 2).join(' | ');
                                                      })()}
                                                    </div>
                                                  </div>
                                                )}
                                              </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="max-w-[800px] w-[800px]">
                                              {filteredCustomerProducts.map((product: any) => (
                                                <SelectItem 
                                                  key={product.id} 
                                                  value={product.id.toString()}
                                                  className="h-auto min-h-[80px] py-3"
                                                >
                                                  <div className="w-full text-right py-2 min-w-[700px]">
                                                    <div className="font-semibold text-gray-900 mb-2 text-base leading-relaxed">
                                                      {(() => {
                                                        let displayName = '';
                                                        
                                                        // Create base product name with better formatting
                                                        if (product.size_caption) {
                                                          displayName = product.size_caption;
                                                        } else if (product.raw_material && product.width && product.thickness) {
                                                          displayName = `${product.raw_material} - ${product.width} × ${product.thickness}`;
                                                        } else if (product.raw_material) {
                                                          displayName = product.raw_material;
                                                        } else {
                                                          displayName = 'منتج غير محدد';
                                                        }
                                                        
                                                        // Add cutting length if available
                                                        if (product.cutting_length_cm) {
                                                          displayName += ` (طول القطع: ${product.cutting_length_cm} سم)`;
                                                        }
                                                        
                                                        return displayName;
                                                      })()} 
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                      <div className="space-y-1">
                                                        {product.raw_material && (
                                                          <div><span className="font-medium">المادة الخام:</span> {product.raw_material}</div>
                                                        )}
                                                        {product.master_batch_id && (
                                                          <div><span className="font-medium">الماستر باتش:</span> {product.master_batch_id}</div>
                                                        )}
                                                        {product.punching && (
                                                          <div><span className="font-medium">التخريم:</span> {product.punching}</div>
                                                        )}
                                                      </div>
                                                      <div className="space-y-1">
                                                        {product.thickness && (
                                                          <div><span className="font-medium">السماكة:</span> {product.thickness} ميكرون</div>
                                                        )}
                                                        {product.width && (
                                                          <div><span className="font-medium">العرض:</span> {product.width} سم</div>
                                                        )}
                                                        {product.cutting_unit && (
                                                          <div><span className="font-medium">وحدة القطع:</span> {product.cutting_unit}</div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    {product.notes && (
                                                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                                                        <span className="font-medium">ملاحظات:</span> {product.notes}
                                                      </div>
                                                    )}
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">الكمية (كيلو)</label>
                                            <Input
                                              type="number"
                                              placeholder="الكمية"
                                              value={prodOrder.quantity_kg || ""}
                                              onChange={(e) => updateProductionOrder(index, 'quantity_kg', parseFloat(e.target.value) || 0)}
                                              className="w-full"
                                            />
                                          </div>
                                          
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">الحالة</label>
                                            <Select 
                                              onValueChange={(value) => updateProductionOrder(index, 'status', value)}
                                              value={prodOrder.status || "pending"}
                                            >
                                              <SelectTrigger className="w-full">
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
                                    </div>
                                  ))}
                                </div>
                              </div>
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
                        <TableHead className="text-center">رقم الطلب</TableHead>
                        <TableHead className="text-center">العميل</TableHead>
                        <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                        <TableHead className="text-center">المستخدم</TableHead>
                        <TableHead className="text-center">مدة التسليم المتبقية</TableHead>
                        <TableHead className="text-center">ملاحظات</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order: any) => {
                        // Find customer details
                        const customer = customers.find((c: any) => c.id === order.customer_id);
                        // Find user details
                        const user = users.find((u: any) => u.id === parseInt(order.created_by));
                        // Calculate delivery time remaining
                        const createdDate = new Date(order.created_at);
                        const deliveryDate = new Date(createdDate);
                        deliveryDate.setDate(deliveryDate.getDate() + order.delivery_days);
                        const today = new Date();
                        const daysRemaining = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>
                              <div className="text-right">
                                <div className="font-medium">{customer?.name_ar || customer?.name}</div>
                                <div className="text-sm text-gray-500">{customer?.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                <div className="font-medium">{user?.username}</div>
                                <div className="text-sm text-gray-500">#{user?.id}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                <div className="font-medium">
                                  {daysRemaining > 0 ? (
                                    <span className="text-green-600">{daysRemaining} يوم متبقي</span>
                                  ) : daysRemaining === 0 ? (
                                    <span className="text-orange-600">يجب التسليم اليوم</span>
                                  ) : (
                                    <span className="text-red-600">متأخر {Math.abs(daysRemaining)} يوم</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  التسليم: {format(deliveryDate, 'dd/MM/yyyy')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{order.notes || '-'}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2 space-x-reverse">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                  onClick={() => handleViewOrder(order)}
                                  title="عرض"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handlePrintOrder(order)}
                                  title="طباعة"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                                      title="تغيير الحالة"
                                    >
                                      <RefreshCw className="h-4 w-4 mr-1" />
                                      <ChevronDown className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'for_production')}>
                                      <div className="flex items-center w-full">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                        إلى الإنتاج
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'on_hold')}>
                                      <div className="flex items-center w-full">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                        إيقاف مؤقت
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'waiting')}>
                                      <div className="flex items-center w-full">
                                        <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                                        انتظار
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'pending')}>
                                      <div className="flex items-center w-full">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                        في الانتظار
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(order, 'completed')}>
                                      <div className="flex items-center w-full">
                                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                        مكتمل
                                      </div>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteOrder(order)}
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                                              {(() => {
                                                let displayName = '';
                                                
                                                // Create base product name
                                                let baseName = '';
                                                if (product.size_caption) {
                                                  baseName = product.size_caption;
                                                } else if (product.raw_material && product.width && product.thickness) {
                                                  baseName = `${product.raw_material} ${product.width}×${product.thickness}`;
                                                } else if (product.raw_material) {
                                                  baseName = product.raw_material;
                                                } else {
                                                  baseName = 'منتج غير محدد';
                                                }
                                                
                                                // Add cutting length if available
                                                if (product.cutting_length_cm) {
                                                  displayName = `${baseName} × ${product.cutting_length_cm} سم`;
                                                } else {
                                                  displayName = baseName;
                                                }
                                                
                                                return displayName;
                                              })()}
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

      {/* View Order Dialog */}
      <Dialog open={isViewOrderDialogOpen} onOpenChange={setIsViewOrderDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب {viewingOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {viewingOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات الطلب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">رقم الطلب:</span>
                      <span className="text-blue-600 font-bold">{viewingOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">تاريخ الإنشاء:</span>
                      <span>{format(new Date(viewingOrder.created_at), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">مدة التسليم:</span>
                      <span>{viewingOrder.delivery_days} يوم</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">الحالة:</span>
                      <span>{getStatusBadge(viewingOrder.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">ملاحظات:</span>
                      <span>{viewingOrder.notes || 'لا توجد ملاحظات'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات العميل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const customer = customers.find((c: any) => c.id === viewingOrder.customer_id);
                      return customer ? (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium">اسم العميل:</span>
                            <span className="font-semibold">{customer.name_ar || customer.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">رقم العميل:</span>
                            <span>{customer.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">الهاتف:</span>
                            <span>{customer.phone || 'غير محدد'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">العنوان:</span>
                            <span>{customer.address || 'غير محدد'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">معلومات العميل غير متوفرة</div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Production Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">أوامر الإنتاج</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const orderProductionOrders = productionOrders.filter((po: any) => po.order_id === viewingOrder.id);
                      
                      if (orderProductionOrders.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            لا توجد أوامر إنتاج لهذا الطلب
                          </div>
                        );
                      }

                      return orderProductionOrders.map((po: any) => {
                        const product = customerProducts.find((p: any) => p.id === po.customer_product_id);
                        
                        return (
                          <Card key={po.id} className="border-l-4 border-l-blue-500">
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base">أمر إنتاج: {po.production_order_number}</CardTitle>
                                <Badge>{getStatusBadge(po.status)}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {product ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Product Details */}
                                  <div>
                                    <h5 className="font-semibold text-gray-900 mb-2 border-b pb-1">تفاصيل المنتج</h5>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="font-medium">اسم المنتج:</span> {product.size_caption || 'غير محدد'}</div>
                                      <div><span className="font-medium">المادة الخام:</span> {product.raw_material || 'غير محدد'}</div>
                                      <div><span className="font-medium">العرض:</span> {product.width || 'غير محدد'} سم</div>
                                      <div><span className="font-medium">السماكة:</span> {product.thickness || 'غير محدد'} مايكرون</div>
                                      <div><span className="font-medium">طول القطع:</span> {product.cutting_length_cm || 'غير محدد'} سم</div>
                                      <div><span className="font-medium">عدد القطع بالكيلو:</span> {product.pieces_per_kg || 'غير محدد'}</div>
                                    </div>
                                  </div>

                                  {/* Product Specifications */}
                                  <div>
                                    <h5 className="font-semibold text-gray-900 mb-2 border-b pb-1">المواصفات الفنية</h5>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="font-medium">التخريم:</span> {product.punching || 'بدون تخريم'}</div>
                                      <div><span className="font-medium">الماستر باتش:</span> {product.master_batch_id || 'غير محدد'}</div>
                                      {product.color && <div><span className="font-medium">اللون:</span> {product.color}</div>}
                                      {product.bag_type && <div><span className="font-medium">نوع الكيس:</span> {product.bag_type}</div>}
                                      <div><span className="font-medium">الطباعة:</span> {product.print_colors ? `${product.print_colors} لون` : 'بدون طباعة'}</div>
                                    </div>
                                  </div>

                                  {/* Production Details */}
                                  <div>
                                    <h5 className="font-semibold text-gray-900 mb-2 border-b pb-1">تفاصيل الإنتاج</h5>
                                    <div className="space-y-2 text-sm">
                                      <div><span className="font-medium">الكمية المطلوبة:</span> <span className="font-bold text-blue-600">{po.quantity_kg} كيلو</span></div>
                                      <div><span className="font-medium">عدد القطع المتوقع:</span> {product.pieces_per_kg ? Math.round(parseFloat(po.quantity_kg) * parseFloat(product.pieces_per_kg)).toLocaleString() : 'غير محسوب'} قطعة</div>
                                      <div><span className="font-medium">تاريخ الإنشاء:</span> {format(new Date(po.created_at), 'dd/MM/yyyy')}</div>
                                      {product.production_notes && <div><span className="font-medium">ملاحظات الإنتاج:</span> {product.production_notes}</div>}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-red-500">
                                  خطأ: معلومات المنتج غير متوفرة (رقم المنتج: {po.customer_product_id})
                                </div>
                              )}
                              
                              {product?.additional_notes && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-l-amber-400">
                                  <span className="font-medium">ملاحظات إضافية:</span>
                                  <p className="mt-1 text-sm text-gray-700">{product.additional_notes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* User Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">معلومات المستخدم</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const user = users.find((u: any) => u.id === parseInt(viewingOrder.created_by));
                    return user ? (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><span className="font-medium">اسم المستخدم:</span> {user.username}</div>
                        <div><span className="font-medium">الاسم:</span> {user.display_name_ar || user.display_name}</div>
                        <div><span className="font-medium">تاريخ إنشاء الطلب:</span> {format(new Date(viewingOrder.created_at), 'dd/MM/yyyy HH:mm')}</div>
                      </div>
                    ) : (
                      <div className="text-gray-500">معلومات المستخدم غير متوفرة</div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}