import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { parseIntSafe } from "../../../shared/validation-utils";
import { format } from "date-fns";
import { isUserAdmin } from "../utils/roleUtils";
import { 
  OrdersStats, 
  OrdersTabs 
} from "../components/orders";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("waiting");
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isAdmin = isUserAdmin(user);

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('فشل في جلب الطلبات');
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch production orders
  const { data: productionOrders = [] } = useQuery({
    queryKey: ['/api/production-orders'],
    queryFn: async () => {
      const response = await fetch('/api/production-orders');
      if (!response.ok) throw new Error('فشل في جلب أوامر الإنتاج');
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('فشل في جلب العملاء');
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch customer products
  const { data: customerProducts = [] } = useQuery({
    queryKey: ['/api/customer-products'],
    queryFn: async () => {
      const response = await fetch('/api/customer-products');
      if (!response.ok) throw new Error('فشل في جلب منتجات العملاء');
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('فشل في جلب المستخدمين');
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('فشل في جلب العناصر');
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    }
  });

  // Filter orders by search term and status
  const filteredOrders = orders.filter((order: any) => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      customers.find((c: any) => c.id === order.customer_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customers.find((c: any) => c.id === order.customer_id)?.name_ar?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Order submission handler
  const onOrderSubmit = async (data: any, productionOrdersData: any[]) => {
    try {
      console.log('بدء عملية حفظ الطلب...', { data, productionOrdersData });
      
      // Check if at least one production order is added
      if (productionOrdersData.length === 0) {
        toast({
          title: "تحذير",
          description: "يجب إضافة أمر إنتاج واحد على الأقل",
          variant: "destructive"
        });
        return;
      }

      // Validate that all production orders have complete data
      const invalidOrders = productionOrdersData.filter(order => 
        !order.customer_product_id || 
        order.customer_product_id === "" ||
        !order.quantity_kg || 
        order.quantity_kg <= 0
      );

      if (invalidOrders.length > 0) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى التأكد من اكتمال جميع أوامر الإنتاج (اختيار المنتج وإدخال الكمية)",
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
        delivery_days: parseIntSafe(data.delivery_days, "Delivery days", { min: 1, max: 365 }),
        notes: data.notes || '',
        created_by: user?.id?.toString() || "1"
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
      
      // Filter out empty production orders and create valid ones
      const validProductionOrders = productionOrdersData.filter(prodOrder => 
        prodOrder.customer_product_id && 
        prodOrder.customer_product_id !== "" &&
        prodOrder.quantity_kg &&
        prodOrder.quantity_kg > 0
      );

      console.log('أوامر الإنتاج الصالحة:', validProductionOrders);
      
      // Create production orders for the new order
      for (const prodOrder of validProductionOrders) {
        try {
          console.log('إنشاء أمر إنتاج:', prodOrder);
          
          // Calculate final quantity with overrun
          const overrunPercentage = prodOrder.overrun_percentage || 5.0;
          const finalQuantityKg = prodOrder.quantity_kg * (1 + overrunPercentage / 100);
          
          const productionOrderData = {
            order_id: newOrder.data?.id || newOrder.id,
            customer_product_id: prodOrder.customer_product_id,
            quantity_kg: prodOrder.quantity_kg,
            overrun_percentage: overrunPercentage,
            final_quantity_kg: finalQuantityKg,
          };
          
          console.log('بيانات أمر الإنتاج:', productionOrderData);
          
          const prodOrderResponse = await fetch('/api/production-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productionOrderData)
          });
          
          if (!prodOrderResponse.ok) {
            const errorText = await prodOrderResponse.text();
            console.error('خطأ في إنشاء أمر الإنتاج:', errorText);
            throw new Error(`فشل في إنشاء أمر الإنتاج: ${errorText}`);
          }
          
          const newProdOrder = await prodOrderResponse.json();
          console.log('تم إنشاء أمر الإنتاج بنجاح:', newProdOrder);
          
        } catch (error) {
          console.error('خطأ في إنشاء أمر إنتاج فردي:', error);
          throw error;
        }
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/production-orders'] });
      
      // Close dialogs and reset forms
      setIsOrderDialogOpen(false);
      setEditingOrder(null);
      
      toast({
        title: "تم الحفظ بنجاح",
        description: `تم إنشاء الطلب ${orderNumber} بنجاح مع ${validProductionOrders.length} أمر إنتاج`
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

  // Order actions handlers
  const handleAddOrder = () => {
    setEditingOrder(null);
    setIsOrderDialogOpen(true);
  };

  const handleEditOrder = (order: any) => {
    if (!isAdmin) {
      toast({
        title: "غير مخول",
        description: "صلاحيات المدير مطلوبة لتعديل الطلبات",
        variant: "destructive"
      });
      return;
    }
    setEditingOrder(order);
    setIsOrderDialogOpen(true);
  };

  const handleDeleteOrder = async (order: any) => {
    if (!isAdmin) {
      toast({
        title: "غير مخول",
        description: "صلاحيات المدير مطلوبة لحذف الطلبات",
        variant: "destructive"
      });
      return;
    }

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

  const handleViewOrder = (order: any) => {
    setViewingOrder(order);
    setIsViewOrderDialogOpen(true);
  };

  const handlePrintOrder = (order: any) => {
    const customer = customers.find((c: any) => c.id === order.customer_id);
    const user = users.find((u: any) => u.id === parseInt(order.created_by));
    const orderProductionOrders = productionOrders.filter((po: any) => po.order_id === order.id);
    
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
            h1 { font-size: 24px; font-weight: bold; color: #000; margin: 10px 0; }
            h3 { color: #000; border-bottom: 2px solid #000; padding-bottom: 8px; font-size: 20px; font-weight: bold; }
            p { margin: 8px 0; font-size: 14px; }
            strong { color: #000; font-weight: bold; }
            @media print { 
              body { margin: 0; font-size: 14px; } 
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
              <p><strong>تاريخ الإنشاء:</strong> ${order.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy') : 'غير محدد'}</p>
              <p><strong>أيام التسليم:</strong> ${order.delivery_days || 'غير محدد'} يوم</p>
              <p><strong>ملاحظات:</strong> ${order.notes || 'لا توجد ملاحظات'}</p>
            </div>
            
            <div class="info-box">
              <h3>معلومات العميل</h3>
              <p><strong>اسم العميل:</strong> ${customer?.name_ar || customer?.name || 'غير محدد'}</p>
              <p><strong>رقم العميل:</strong> ${customer?.id || 'غير محدد'}</p>
              <p><strong>المدينة:</strong> ${customer?.city || 'غير محدد'}</p>
              <p><strong>الهاتف:</strong> ${customer?.phone || 'غير محدد'}</p>
            </div>
          </div>
          
          <div class="info-box">
            <h3>أوامر الإنتاج</h3>
            ${orderProductionOrders.length > 0 ? 
              orderProductionOrders.map((po: any) => `
                <div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                  <p><strong>رقم أمر الإنتاج:</strong> ${po.production_order_number}</p>
                  <p><strong>الكمية:</strong> ${po.quantity_kg} كيلو</p>
                  <p><strong>الحالة:</strong> ${po.status}</p>
                </div>
              `).join('') : 
              '<p>لا توجد أوامر إنتاج</p>'
            }
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
  };

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
            <div className="text-center">جاري التحميل...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الطلبات</h1>
            <p className="text-gray-600">إنشاء ومتابعة الطلبات وأوامر الإنتاج</p>
            {isAdmin && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                ✓ لديك صلاحيات المدير - يمكنك تعديل وحذف الطلبات
              </div>
            )}
          </div>

          <OrdersStats orders={orders} productionOrders={productionOrders} />

          <div className="mt-6">
            <OrdersTabs
              orders={orders}
              productionOrders={productionOrders}
              customers={customers}
              customerProducts={customerProducts}
              users={users}
              items={items}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              filteredOrders={filteredOrders}
              isOrderDialogOpen={isOrderDialogOpen}
              setIsOrderDialogOpen={setIsOrderDialogOpen}
              editingOrder={editingOrder}
              onAddOrder={handleAddOrder}
              onEditOrder={handleEditOrder}
              onDeleteOrder={handleDeleteOrder}
              onStatusChange={handleStatusChange}
              onViewOrder={handleViewOrder}
              onPrintOrder={handlePrintOrder}
              onOrderSubmit={onOrderSubmit}
              currentUser={user}
              isAdmin={isAdmin}
            />
          </div>
        </main>
      </div>
    </div>
  );
}