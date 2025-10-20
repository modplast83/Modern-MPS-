import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { parseIntSafe } from "../../../shared/validation-utils";
import { format } from "date-fns";
import { isUserAdmin } from "../utils/roleUtils";
import { OrdersStats, OrdersTabs } from "../components/orders";
import ViewOrderDialog from "../components/orders/ViewOrderDialog";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productionSearchTerm, setProductionSearchTerm] = useState("");
  const [productionStatusFilter, setProductionStatusFilter] = useState("all");
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = isUserAdmin(user);

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch("/api/orders");
      if (!response.ok) throw new Error("فشل في جلب الطلبات");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch production orders
  const { data: productionOrders = [] } = useQuery({
    queryKey: ["/api/production-orders"],
    queryFn: async () => {
      const response = await fetch("/api/production-orders");
      if (!response.ok) throw new Error("فشل في جلب أوامر الإنتاج");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("فشل في جلب العملاء");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch customer products
  const { data: customerProducts = [] } = useQuery({
    queryKey: ["/api/customer-products"],
    queryFn: async () => {
      const response = await fetch("/api/customer-products");
      if (!response.ok) throw new Error("فشل في جلب منتجات العملاء");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("فشل في جلب المستخدمين");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ["/api/items"],
    queryFn: async () => {
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error("فشل في جلب العناصر");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("فشل في جلب الفئات");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  // Filter orders by search term and status
  const filteredOrders = orders.filter((order: any) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      (order.order_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.customer_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customers
        .find((c: any) => c.id === order.customer_id)
        ?.name?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      customers
        .find((c: any) => c.id === order.customer_id)
        ?.name_ar?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter production orders by search term and status
  const filteredProductionOrders = productionOrders.filter((po: any) => {
    const order = orders.find((o: any) => o.id === po.order_id);
    const customer = customers.find((c: any) => c.id === order?.customer_id);
    const customerProduct = customerProducts.find((cp: any) => cp.id === po.customer_product_id);

    // Search filter
    const matchesSearch =
      productionSearchTerm === "" ||
      (po.production_order_number || "")
        .toLowerCase()
        .includes(productionSearchTerm.toLowerCase()) ||
      (order?.order_number || "")
        .toLowerCase()
        .includes(productionSearchTerm.toLowerCase()) ||
      (customer?.name_ar || "")
        .toLowerCase()
        .includes(productionSearchTerm.toLowerCase()) ||
      (customer?.name || "")
        .toLowerCase()
        .includes(productionSearchTerm.toLowerCase()) ||
      (customerProduct?.size_caption || "")
        .toLowerCase()
        .includes(productionSearchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      productionStatusFilter === "all" || po.status === productionStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Order submission handler
  const onOrderSubmit = async (data: any, productionOrdersData: any[]) => {
    // منع الإرسال المتعدد بشكل إضافي
    // إذا كان هناك طلب قيد المعالجة، لا نقبل طلباً جديداً
    if (isCreatingOrder) {
      console.warn("طلب قيد المعالجة بالفعل، تجاهل الطلب المكرر");
      return;
    }
    
    try {
      setIsCreatingOrder(true);
      console.log("بدء عملية حفظ الطلب...", { data, productionOrdersData, editingOrder });

      // Check if user is authenticated
      if (!user?.id) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول لإنشاء طلب",
          variant: "destructive",
        });
        return;
      }

      // If editing, update the order
      if (editingOrder) {
        const updateData = {
          order_number: editingOrder.order_number, // Include order number as required by API
          customer_id: data.customer_id,
          delivery_days: parseIntSafe(data.delivery_days, "Delivery days", {
            min: 1,
            max: 365,
          }),
          notes: data.notes || "",
          created_by: editingOrder.created_by || user.id, // Keep original creator as number
        };

        console.log("تحديث الطلب:", updateData);
        const updateResponse = await fetch(`/api/orders/${editingOrder.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error("خطأ في تحديث الطلب:", errorText);
          throw new Error(`فشل في تحديث الطلب: ${errorText}`);
        }

        // Always delete existing production orders for this order
        // This ensures we recreate the entire set of production orders on save
        const existingProdOrders = productionOrders.filter(
          (po: any) => po.order_id === editingOrder.id
        );
        
        for (const po of existingProdOrders) {
          try {
            await fetch(`/api/production-orders/${po.id}`, {
              method: "DELETE",
            });
          } catch (error) {
            console.error("خطأ في حذف أمر إنتاج قديم:", error);
          }
        }

        // Create new production orders if any
        const validProductionOrders = productionOrdersData.filter(
          (prodOrder) =>
            prodOrder.customer_product_id &&
            prodOrder.customer_product_id !== "" &&
            prodOrder.quantity_kg &&
            prodOrder.quantity_kg > 0,
        );

        for (const prodOrder of validProductionOrders) {
          try {
            const productionOrderData = {
              order_id: editingOrder.id,
              customer_product_id: prodOrder.customer_product_id,
              quantity_kg: prodOrder.quantity_kg,
              overrun_percentage: prodOrder.overrun_percentage || 5.0,
            };

            await fetch("/api/production-orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(productionOrderData),
            });
          } catch (error) {
            console.error("خطأ في إنشاء أمر إنتاج:", error);
          }
        }

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
        queryClient.invalidateQueries({
          queryKey: ["/api/production/hierarchical-orders"],
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

        setIsOrderDialogOpen(false);
        setEditingOrder(null);

        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث الطلب ${editingOrder.order_number} بنجاح`,
        });
        return;
      }

      // Creating new order - check if at least one production order is added
      if (productionOrdersData.length === 0) {
        toast({
          title: "تحذير",
          description: "يجب إضافة أمر إنتاج واحد على الأقل",
          variant: "destructive",
        });
        return;
      }

      // Validate that all production orders have complete data
      const invalidOrders = productionOrdersData.filter(
        (order) =>
          !order.customer_product_id ||
          order.customer_product_id === "" ||
          !order.quantity_kg ||
          order.quantity_kg <= 0,
      );

      if (invalidOrders.length > 0) {
        toast({
          title: "خطأ في البيانات",
          description:
            "يرجى التأكد من اكتمال جميع أوامر الإنتاج (اختيار المنتج وإدخال الكمية)",
          variant: "destructive",
        });
        return;
      }

      // Generate order number
      console.log("توليد رقم الطلب...");
      const orderNumberResponse = await fetch("/api/orders/next-number");
      if (!orderNumberResponse.ok) throw new Error("فشل في توليد رقم الطلب");
      const { orderNumber } = await orderNumberResponse.json();
      console.log("رقم الطلب المولد:", orderNumber);

      // Create the order first
      const orderData = {
        order_number: orderNumber,
        customer_id: data.customer_id,
        delivery_days: parseIntSafe(data.delivery_days, "Delivery days", {
          min: 1,
          max: 365,
        }),
        notes: data.notes || "",
        created_by: user.id, // API expects a number, not a string
      };

      console.log("إرسال بيانات الطلب:", orderData);
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error("خطأ في إنشاء الطلب:", errorText);
        throw new Error(`فشل في إنشاء الطلب: ${errorText}`);
      }

      const newOrder = await orderResponse.json();
      console.log("تم إنشاء الطلب بنجاح:", newOrder);

      // Filter out empty production orders and create valid ones
      const validProductionOrders = productionOrdersData.filter(
        (prodOrder) =>
          prodOrder.customer_product_id &&
          prodOrder.customer_product_id !== "" &&
          prodOrder.quantity_kg &&
          prodOrder.quantity_kg > 0,
      );

      console.log("أوامر الإنتاج الصالحة:", validProductionOrders);

      // Create production orders using batch endpoint for better performance
      const batchProductionOrders = validProductionOrders.map((prodOrder: any) => ({
        order_id: newOrder.data?.id || newOrder.id,
        customer_product_id: prodOrder.customer_product_id,
        quantity_kg: prodOrder.quantity_kg,
        overrun_percentage: prodOrder.overrun_percentage || 5.0,
        // final_quantity_kg will be calculated server-side for security
      }));

      console.log("بيانات أوامر الإنتاج:", batchProductionOrders);

      // Create all production orders in a single batch request
      const prodOrderResponse = await fetch("/api/production-orders/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: batchProductionOrders }),
      });

      if (!prodOrderResponse.ok) {
        const errorText = await prodOrderResponse.text();
        console.error("خطأ في إنشاء أوامر الإنتاج:", errorText);
        throw new Error(`فشل في إنشاء أوامر الإنتاج: ${errorText}`);
      }

      const batchResult = await prodOrderResponse.json();
      console.log("نتيجة إنشاء أوامر الإنتاج:", batchResult);

      // Check if any orders failed
      if (batchResult.failed && batchResult.failed.length > 0) {
        console.warn("بعض أوامر الإنتاج فشلت:", batchResult.failed);
        // Continue with successful orders, but warn about failures
        if (batchResult.successful && batchResult.successful.length > 0) {
          toast({
            title: "تنبيه",
            description: `تم إنشاء ${batchResult.successful.length} من ${batchProductionOrders.length} أوامر إنتاج`,
            variant: "default",
          });
        } else {
          throw new Error("فشل في إنشاء جميع أوامر الإنتاج");
        }
      } else {
        console.log("تم إنشاء جميع أوامر الإنتاج بنجاح");
      }

      // Refresh data - invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/hierarchical-orders"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      // Close dialogs and reset forms
      setIsOrderDialogOpen(false);
      setEditingOrder(null);

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم إنشاء الطلب ${orderNumber} بنجاح مع ${validProductionOrders.length} أمر إنتاج`,
      });
    } catch (error) {
      console.error("خطأ في حفظ الطلب:", error);
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "فشل في حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      // إعادة تعيين حالة isCreatingOrder بغض النظر عن النجاح أو الفشل
      setIsCreatingOrder(false);
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
        variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        `هل أنت متأكد من حذف الطلب ${order.order_number}؟ هذا الإجراء لا يمكن التراجع عنه.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في حذف الطلب");
      }

      // Refresh all related data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/hierarchical-orders"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف الطلب ${order.order_number}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "فشل في حذف الطلب",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (order: any, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في تحديث حالة الطلب");
      }

      // Refresh all related data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/hierarchical-orders"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث حالة الطلب ${order.order_number}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    }
  };

  // Bulk action handlers
  const handleBulkDelete = async (orderIds: number[]) => {
    if (!isAdmin) {
      toast({
        title: "غير مخول",
        description: "صلاحيات المدير مطلوبة لحذف الطلبات",
        variant: "destructive",
      });
      return;
    }

    try {
      // Delete orders one by one (could be optimized to a single API call)
      const deletePromises = orderIds.map((orderId) =>
        fetch(`/api/orders/${orderId}`, { method: "DELETE" }),
      );

      const responses = await Promise.allSettled(deletePromises);

      // Check for failures
      const failures = responses.filter(
        (response) =>
          response.status === "rejected" ||
          (response.status === "fulfilled" && !response.value.ok),
      );

      if (failures.length > 0) {
        toast({
          title: "تحذير",
          description: `فشل حذف ${failures.length} من ${orderIds.length} طلب`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم الحذف بنجاح",
          description: `تم حذف ${orderIds.length} طلب بنجاح`,
        });
      }

      // Refresh all related data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/hierarchical-orders"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    } catch (error) {
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "فشل في الحذف الجماعي",
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async (
    orderIds: number[],
    newStatus: string,
  ) => {
    try {
      // Update status for all selected orders
      const updatePromises = orderIds.map((orderId) =>
        fetch(`/api/orders/${orderId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }),
      );

      const responses = await Promise.allSettled(updatePromises);

      // Check for failures
      const failures = responses.filter(
        (response) =>
          response.status === "rejected" ||
          (response.status === "fulfilled" && !response.value.ok),
      );

      if (failures.length > 0) {
        toast({
          title: "تحذير",
          description: `فشل تحديث ${failures.length} من ${orderIds.length} طلب`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث حالة ${orderIds.length} طلب بنجاح`,
        });
      }

      // Refresh all related data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/hierarchical-orders"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    } catch (error) {
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "فشل في التحديث الجماعي",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: any) => {
    setViewingOrder(order);
    setIsViewOrderDialogOpen(true);
  };

  const handlePrintOrder = (order: any) => {
  try {
    // بيانات مساعدة آمنة
    const fmtDate = (d?: string | Date, withTime = false) => {
      if (!d) return "غير محدد";
      const date = d instanceof Date ? d : new Date(d);
      const pad = (n: number) => String(n).padStart(2, "0");
      const Y = date.getFullYear();
      const M = pad(date.getMonth() + 1);
      const D = pad(date.getDate());
      if (!withTime) return `${D}/${M}/${Y}`;
      const h = pad(date.getHours());
      const m = pad(date.getMinutes());
      return `${D}/${M}/${Y} ${h}:${m}`;
    };

    // اجلب الكيانات بهدوء وفلاتر آمنة
    const customer = (customers || []).find((c: any) => c.id === order?.customer_id);
    const creator =
      (users || []).find((u: any) => u.id === Number(order?.created_by))?.name ||
      (users || []).find((u: any) => u.id === Number(order?.created_by))?.username ||
      "غير محدد";

    const orderProductionOrders = (productionOrders || [])
      .filter((po: any) => po?.order_id === order?.id)
      .sort((a: any, b: any) =>
        String(a?.production_order_number || "").localeCompare(
          String(b?.production_order_number || "")
        )
      );

    const buildProductCaption = (po: any) => {
      const cp = (customerProducts || []).find((x: any) => x.id === po?.customer_product_id);
      if (!cp) return "—";
      const item = (items || []).find((it: any) => it.id === cp.item_id);
      const parts = [
        item?.name_ar || item?.name || null,
        cp.size_caption || null,
        cp.cutting_length_cm ? `طول: ${cp.cutting_length_cm} سم` : null,
        cp.thickness ? `سماكة: ${cp.thickness}µ` : null,
        cp.width ? `عرض: ${cp.width} سم` : null,
        cp.raw_material || null,
      ].filter(Boolean);
      return parts.length ? parts.join(" - ") : "—";
    };

    const totalQty = orderProductionOrders.reduce(
      (s: number, po: any) => s + (Number(po?.quantity_kg) || 0),
      0
    );

    // HTML النهائي (بدون سكربتات inline)
    const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>طلب رقم ${order?.order_number ?? "—"}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, "Helvetica Neue", "Noto Naskh Arabic", "Amiri", sans-serif;
    color: #000; font-size: 13px; line-height: 1.6; margin: 0;
  }
  .header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
    border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 14px; }
  .brand { font-size: 18px; font-weight: 800; }
  .doc-title { text-align: center; font-size: 18px; font-weight: 800; }
  .meta { text-align: left; font-size: 11px; }
  .meta p { margin: 0; }

  .section { margin-bottom: 12px; }
  .box { border: 1px solid #000; border-radius: 6px; padding: 10px; background: #fff; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .subhead { font-weight: 700; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 8px; }

  table { width: 100%; border-collapse: collapse; }
  thead th { position: sticky; top: 0; background: #f6f6f6; z-index: 1;
    border: 1px solid #000; padding: 6px; font-weight: 700; text-align: center; }
  tbody td { border: 1px solid #000; padding: 6px; vertical-align: top; }
  tfoot td { border: 1px solid #000; padding: 6px; font-weight: 800; background: #fafafa; }
  .num { text-align: center; white-space: nowrap; }
  .muted { color: #222; }

  .signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 14px; }
  .sign-box { border: 1px dashed #000; border-radius: 6px; padding: 10px; height: 70px; }
  .sign-box .label { font-size: 12px; color: #333; margin-bottom: 6px; }

  .footer { margin-top: 14px; font-size: 11px; color: #111; display: flex; justify-content: space-between; }
  .qr { width: 74px; height: 74px; border: 1px solid #000; display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; }
  .actions { margin-top: 12px; text-align: center; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">نظام إدارة الطلبات والإنتاج</div>
    <div class="doc-title">أمر طلب / أمر بيع</div>
    <div class="meta">
      <p>تاريخ الطباعة: ${fmtDate(new Date(), true)}</p>
      <p>رقم المستند: ${order?.order_number ?? "—"}</p>
    </div>
  </div>

  <div class="section grid-2">
    <div class="box">
      <div class="subhead">معلومات الطلب</div>
      <p><strong>رقم الطلب:</strong> ${order?.order_number ?? "—"}</p>
      <p><strong>تاريخ الإنشاء:</strong> ${fmtDate(order?.created_at)}</p>
      <p><strong>أيام التسليم:</strong> ${order?.delivery_days ?? "غير محدد"} يوم</p>
      <p><strong>أنشأه:</strong> ${creator}</p>
      <p><strong>ملاحظات:</strong> ${order?.notes || "—"}</p>
    </div>
    <div class="box">
      <div class="subhead">بيانات العميل</div>
      <p><strong>الاسم:</strong> ${customer?.name_ar || customer?.name || "غير محدد"}</p>
      <p><strong>رقم العميل:</strong> ${customer?.id ?? "غير محدد"}</p>
      <p><strong>المدينة:</strong> ${customer?.city || "غير محدد"}</p>
      <p><strong>الهاتف:</strong> ${customer?.phone || "غير محدد"}</p>
    </div>
  </div>

  <div class="section box">
    <div class="subhead">أوامر الإنتاج المرتبطة</div>
    <table>
      <thead>
        <tr>
          <th style="width: 120px;">رقم أمر الإنتاج</th>
          <th>المنتج / المواصفات</th>
          <th style="width: 120px;">الكمية (كجم)</th>
          <th style="width: 130px;">الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${
          orderProductionOrders.length
            ? orderProductionOrders.map((po: any) => {
                const caption = buildProductCaption(po);
                const qty = Number(po?.quantity_kg) || 0;
                const status = po?.status || "—";
                const poNum = po?.production_order_number || "—";
                return `
                  <tr>
                    <td class="num">${poNum}</td>
                    <td>${caption}</td>
                    <td class="num">${qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td class="num">${status}</td>
                  </tr>`;
              }).join("")
            : `<tr><td colspan="4" class="num muted">لا توجد أوامر إنتاج</td></tr>`
        }
      </tbody>
      <tfoot>
        <tr>
          <td class="num" colspan="2">الإجمالي</td>
          <td class="num">${totalQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <div class="signs">
      <div class="sign-box"><div class="label">إعداد الطلب</div></div>
      <div class="sign-box"><div class="label">مراجعة</div></div>
      <div class="sign-box"><div class="label">اعتماد</div></div>
    </div>
  </div>

  <div class="footer">
    <div>مخرجات النظام • لا تحتاج توقيع إذا ظهرت إلكترونيًا</div>
    <div class="qr">QR ${order?.order_number ?? "—"}</div>
  </div>

  <div class="actions no-print">
    <button onclick="window.print()">طباعة</button>
  </div>
</body>
</html>`;

    // استخدم Blob URL بدل document.write (أكثر ثباتًا)
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
      // لو البوب-أب محظور
      alert("المتصفح منع فتح نافذة الطباعة. فضلاً عطّل حظر النوافذ المنبثقة لهذه الصفحة.");
      URL.revokeObjectURL(url);
      return;
    }
    // اطبع تلقائيًا بعد التحميل
    const onLoad = () => {
      try { w.focus(); w.print(); } catch {}
      w.removeEventListener("load", onLoad);
      // URL.revokeObjectURL(url); // لا تفرّغ مباشرة حتى لا تكسر الطباعة ببطء
      setTimeout(() => URL.revokeObjectURL(url), 30000); // أمان لاحق
    };
    w.addEventListener("load", onLoad);
  } catch (err) {
    console.error("print error:", err);
    toast({
      title: "خطأ في الطباعة",
      description: err instanceof Error ? err.message : "تعذر إنشاء مستند الطباعة",
      variant: "destructive",
    });
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              إدارة الطلبات
            </h1>
            <p className="text-gray-600">
              إنشاء ومتابعة الطلبات وأوامر الإنتاج
            </p>
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
              categories={categories}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              productionSearchTerm={productionSearchTerm}
              setProductionSearchTerm={setProductionSearchTerm}
              productionStatusFilter={productionStatusFilter}
              setProductionStatusFilter={setProductionStatusFilter}
              filteredOrders={filteredOrders}
              filteredProductionOrders={filteredProductionOrders}
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
              onBulkDelete={handleBulkDelete}
              onBulkStatusChange={handleBulkStatusChange}
              currentUser={user}
              isAdmin={isAdmin}
            />
          </div>
        </main>
      </div>

      {/* View Order Dialog */}
      <ViewOrderDialog
        isOpen={isViewOrderDialogOpen}
        onClose={() => {
          setIsViewOrderDialogOpen(false);
          setViewingOrder(null);
        }}
        order={viewingOrder}
        customer={customers.find((c: any) => c.id === viewingOrder?.customer_id)}
        productionOrders={productionOrders}
        customerProducts={customerProducts}
        items={items}
      />
    </div>
  );
}
