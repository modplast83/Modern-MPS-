import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Package,
  Plus,
  Search,
  FileText,
  Clock,
  User,
  Edit,
  Trash2,
  Eye,
  Calendar,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../hooks/use-toast";
import { format } from "date-fns";
import {
  parseIntSafe,
  coercePositiveInt,
  parseFloatSafe,
} from "../../../shared/validation-utils";

// Master batch colors mapping for Arabic display
const masterBatchColors = [
  {
    id: "PT-111111",
    name: "WHITE",
    name_ar: "أبيض",
    color: "#FFFFFF",
    textColor: "#000000",
  },
  {
    id: "PT-000000",
    name: "BLACK",
    name_ar: "أسود",
    color: "#000000",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-8B0000",
    name: "DARK_RED",
    name_ar: "أحمر غامق",
    color: "#8B0000",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-006400",
    name: "DARK_GREEN",
    name_ar: "أخضر غامق",
    color: "#006400",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-000080",
    name: "NAVY_BLUE",
    name_ar: "أزرق بحري",
    color: "#000080",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-2F4F4F",
    name: "DARK_GRAY",
    name_ar: "رمادي غامق",
    color: "#2F4F4F",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-FF0000",
    name: "RED",
    name_ar: "أحمر",
    color: "#FF0000",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-0000FF",
    name: "BLUE",
    name_ar: "أزرق",
    color: "#0000FF",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-00FF00",
    name: "GREEN",
    name_ar: "أخضر",
    color: "#00FF00",
    textColor: "#000000",
  },
  {
    id: "PT-FFFF00",
    name: "YELLOW",
    name_ar: "أصفر",
    color: "#FFFF00",
    textColor: "#000000",
  },
  {
    id: "PT-FFA500",
    name: "ORANGE",
    name_ar: "برتقالي",
    color: "#FFA500",
    textColor: "#000000",
  },
  {
    id: "PT-800080",
    name: "PURPLE",
    name_ar: "بنفسجي",
    color: "#800080",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-FFC0CB",
    name: "PINK",
    name_ar: "وردي",
    color: "#FFC0CB",
    textColor: "#000000",
  },
  {
    id: "PT-A52A2A",
    name: "BROWN",
    name_ar: "بني",
    color: "#A52A2A",
    textColor: "#FFFFFF",
  },
  {
    id: "PT-C0C0C0",
    name: "SILVER",
    name_ar: "فضي",
    color: "#C0C0C0",
    textColor: "#000000",
  },
  {
    id: "PT-FFD700",
    name: "GOLD",
    name_ar: "ذهبي",
    color: "#FFD700",
    textColor: "#000000",
  },
  {
    id: "PT-E2DCC8",
    name: "BEIGE",
    name_ar: "بيج",
    color: "#E2DCC8",
    textColor: "#000000",
  },
  {
    id: "PT-ADD8E6",
    name: "LIGHT_BLUE",
    name_ar: "أزرق فاتح",
    color: "#ADD8E6",
    textColor: "#000000",
  },
  {
    id: "PT-90EE90",
    name: "LIGHT_GREEN",
    name_ar: "أخضر فاتح",
    color: "#90EE90",
    textColor: "#000000",
  },
  {
    id: "PT-D3D3D3",
    name: "LIGHT_GRAY",
    name_ar: "رمادي فاتح",
    color: "#D3D3D3",
    textColor: "#000000",
  },
  {
    id: "PT-MIX",
    name: "MIX",
    name_ar: "مخلوط",
    color: "#E2DCC8",
    textColor: "#000000",
  },
  {
    id: "PT-CLEAR",
    name: "CLEAR",
    name_ar: "شفاف",
    color: "#E2DCC8",
    textColor: "#000000",
  },
];

// Utility function to get Arabic color name from master batch ID
const getMasterBatchArabicName = (masterBatchId: string): string => {
  if (!masterBatchId) return "غير محدد";
  const color = masterBatchColors.find((c) => c.id === masterBatchId);
  return color?.name_ar || masterBatchId;
};

const orderFormSchema = z.object({
  customer_id: z.string().min(1, "العميل مطلوب"),
  delivery_days: z.coerce
    .number()
    .int()
    .positive()
    .max(365, "عدد أيام التسليم يجب أن يكون بين 1 و 365"),
  notes: z.string().optional(),
});

const productionOrderFormSchema = z.object({
  order_id: z.coerce.number().int().positive().optional(),
  production_order_number: z.string().optional(),
  customer_product_id: z.coerce.number().int().positive().optional(),
  quantity_kg: z.coerce.number().positive().optional(),
  overrun_percentage: z.coerce.number().min(0).max(100).optional(),
  final_quantity_kg: z.coerce.number().positive().optional(),
  status: z.string().min(1, "الحالة مطلوبة"),
});

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("waiting"); // Default to waiting orders
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isProductionOrderDialogOpen, setIsProductionOrderDialogOpen] =
    useState(false);
  const [isViewOrderDialogOpen, setIsViewOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>{t('pages.orders-backup.(null);_const_[editingproductionorder,_seteditingproductionorder]_=_usestate')}<any>{t('pages.orders-backup.(null);_const_[selectedorderid,_setselectedorderid]_=_usestate')}<number | null>{t('pages.orders-backup.(null);_const_[viewingorder,_setviewingorder]_=_usestate')}<any>{t('pages.orders-backup.(null);_const_[selectedcustomerid,_setselectedcustomerid]_=_usestate')}<string>{t('pages.orders-backup.("");_const_[productionordersinform,_setproductionordersinform]_=_usestate')}<any[]>{t('pages.orders-backup.(_[],_);_const_[customersearchterm,_setcustomersearchterm]_=_usestate("");_const_[quantitypreviews,_setquantitypreviews]_=_usestate')}<{
    [key: number]: any;
  }>({});

  // Enhanced filtering states
  const [customerFilter, setCustomerFilter] = useState<string>{t('pages.orders-backup.("");_const_[datefromfilter,_setdatefromfilter]_=_usestate')}<string>{t('pages.orders-backup.("");_const_[datetofilter,_setdatetofilter]_=_usestate')}<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Function to preview quantity calculations
  const previewQuantityCalculation = async (
    customerProductId: number,
    baseQuantityKg: number,
  ) => {
    if (!customerProductId || !baseQuantityKg || baseQuantityKg <= 0) {
      return null;
    }

    try {
      const response = await fetch(
        "/api/production-orders/preview-quantities",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_product_id: customerProductId,
            quantity_kg: baseQuantityKg,
          }),
        },
      );

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error previewing quantity calculation:", error);
      return null;
    }
  };

  // Function to update quantity preview for a production order
  const updateQuantityPreview = async (
    index: number,
    customerProductId?: number,
    baseQuantityKg?: number,
  ) => {
    const prodOrder = productionOrdersInForm[index];
    const productId = customerProductId || prodOrder.customer_product_id;
    const quantity = baseQuantityKg || prodOrder.quantity_kg;

    if (productId && quantity > 0) {
      const preview = await previewQuantityCalculation(productId, quantity);
      if (preview) {
        setQuantityPreviews((prev) => ({
          ...prev,
          [index]: preview,
        }));
      }
    }
  };

  // Enhanced orders data fetching with filters
  const {
    data: enhancedOrdersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: [
      "/api/orders/enhanced",
      {
        search: searchTerm,
        customer_id: customerFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        date_from: dateFromFilter,
        date_to: dateToFilter,
        page: currentPage,
        limit: itemsPerPage,
      },
    ],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey;
      const queryParams = new URLSearchParams();

      Object.entries(params as Record<string, any>).forEach(([key, value]) => {
        if (value && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/orders/enhanced?${queryParams}`);
      if (!response.ok) throw new Error("فشل في جلب الطلبات");
      const result = await response.json();
      return result.success
        ? result.data
        : {
            orders: [],
            pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
          };
    },
    staleTime: 10000,
  });

  const orders = enhancedOrdersData?.orders || [];
  const pagination = enhancedOrdersData?.pagination;

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

  // Fetch customers for dropdown
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

  // Fetch customer products for dropdown
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

  // Fetch users for dropdown
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

  // Fetch items for product names
  const { data: items = [] } = useQuery({
    queryKey: ["/api/items"],
    queryFn: async () => {
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error("فشل في جلب الأصناف");
      const result = await response.json();
      const data = result.data || result;
      return Array.isArray(data) ? data : [];
    },
  });

  // Order mutations
  const orderMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingOrder
        ? `/api/orders/${editingOrder.id}`
        : "/api/orders";
      const method = editingOrder ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("فشل في حفظ البيانات");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsOrderDialogOpen(false);
      setEditingOrder(null);
      toast({
        title: "تم الحفظ بنجاح",
        description: editingOrder ? "تم تحديث الطلب" : "تم إضافة الطلب",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    },
  });

  // Production order mutations
  const productionOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingProductionOrder
        ? `/api/production-orders/${editingProductionOrder.id}`
        : "/api/production-orders";
      const method = editingProductionOrder ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("فشل في حفظ البيانات");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      setIsProductionOrderDialogOpen(false);
      setEditingProductionOrder(null);
      toast({
        title: "تم الحفظ بنجاح",
        description: editingProductionOrder
          ? "تم تحديث أمر الإنتاج"
          : "تم إضافة أمر الإنتاج",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ البيانات",
        variant: "destructive",
      });
    },
  });

  // Forms
  const orderForm = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer_id: "",
      delivery_days: "15",
      notes: "",
    },
  });

  // Filter customer products by selected customer
  const filteredCustomerProducts = customerProducts.filter(
    (product: any) => product.customer_id === selectedCustomerId,
  );

  // Filter customers for search
  const filteredCustomers = customers.filter(
    (customer: any) =>{t('pages.orders-backup.customer.name_ar_?.tolowercase()_.includes(customersearchterm.tolowercase())_||_customer.name?.tolowercase().includes(customersearchterm.tolowercase()),_);_const_productionorderform_=_useform')}<{
    order_id?: number;
    production_order_number?: string;
    customer_product_id?: number;
    quantity_kg?: number;
    status: string;
  }>({
    resolver: zodResolver(productionOrderFormSchema),
    defaultValues: {
      order_id: undefined,
      production_order_number: "",
      customer_product_id: undefined,
      quantity_kg: undefined,
      status: "pending",
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

  // Filter and sort production orders with search capability
  const filteredProductionOrders = productionOrders
    .filter((po: any) => {
      if (selectedOrderId && po.order_id !== selectedOrderId) return false;

      if (searchTerm) {
        const customer = customers.find((c: any) => {
          const order = orders.find((o: any) => o.id === po.order_id);
          return order && c.id === order.customer_id;
        });
        const product = customerProducts.find(
          (p: any) => p.id === po.customer_product_id,
        );

        return (
          po.production_order_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer?.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product?.size_caption
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product?.raw_material
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      }

      return true;
    })
    .sort((a: any, b: any) => {
      // Get order numbers for both production orders
      const orderA = orders.find((o: any) => o.id === a.order_id);
      const orderB = orders.find((o: any) => o.id === b.order_id);

      // Primary sort: by order number descending (تنازليا)
      if (orderA?.order_number && orderB?.order_number) {
        const orderNumA = orderA.order_number;
        const orderNumB = orderB.order_number;
        if (orderNumA !== orderNumB) {
          return orderNumB.localeCompare(orderNumA); // Descending order
        }
      }

      // Secondary sort: by production order number ascending (تصاعديا)
      if (a.production_order_number && b.production_order_number) {
        return a.production_order_number.localeCompare(
          b.production_order_number,
        ); // Ascending order
      }

      return 0;
    });

  const handleAddOrder = () => {
    setEditingOrder(null);
    setSelectedCustomerId(""); // Reset customer selection
    setProductionOrdersInForm([]); // Reset production orders
    orderForm.reset({
      customer_id: "",
      delivery_days: "15",
      notes: "",
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
      notes: order.notes || "",
    });
    setIsOrderDialogOpen(true);
  };

  const handleAddProductionOrder = (orderId?: number) => {
    setEditingProductionOrder(null);
    productionOrderForm.reset({
      order_id: orderId || undefined,
      production_order_number: "",
      customer_product_id: undefined,
      quantity_kg: undefined,
      status: "pending",
    });
    setIsProductionOrderDialogOpen(true);
  };

  const handleEditProductionOrder = (productionOrder: any) => {
    setEditingProductionOrder(productionOrder);
    productionOrderForm.reset({
      order_id: productionOrder.order_id?.toString() || "",
      production_order_number: productionOrder.production_order_number || "",
      customer_product_id:
        productionOrder.customer_product_id?.toString() || "",
      quantity_kg: productionOrder.quantity_kg?.toString() || "",
      status: productionOrder.status || "pending",
    });
    setIsProductionOrderDialogOpen(true);
  };

  const onOrderSubmit = async (data: any) => {
    try {
      console.log("بدء عملية حفظ الطلب...", { data, productionOrdersInForm });

      // Check if at least one production order is added
      if (productionOrdersInForm.length === 0) {
        toast({
          title: "تحذير",
          description: "يجب إضافة أمر إنتاج واحد على الأقل",
          variant: "destructive",
        });
        return;
      }

      // Validate that all production orders have complete data
      const invalidOrders = productionOrdersInForm.filter(
        (order) =>{t('pages.orders-backup.!order.customer_product_id_||_order.customer_product_id_===_""_||_!order.quantity_kg_||_order.quantity_kg')}<= 0,
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
      let orderNumber;
      try {
        const orderNumberResponse = await fetch("/api/orders/next-number");
        if (!orderNumberResponse.ok) throw new Error("فشل في توليد رقم الطلب");
        const result = await orderNumberResponse.json();
        orderNumber = result.orderNumber;
        console.log("رقم الطلب المولد:", orderNumber);
      } catch (error) {
        console.error("خطأ في توليد رقم الطلب:", error);
        throw new Error("فشل في توليد رقم الطلب. يرجى المحاولة مرة أخرى.");
      }

      // Create the order first
      const orderData = {
        order_number: orderNumber,
        customer_id: data.customer_id,
        delivery_days: parseIntSafe(data.delivery_days, "Delivery days", {
          min: 1,
          max: 365,
        }),
        notes: data.notes || "",
        created_by: "8", // AbuKhalid user ID as string
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
      const validProductionOrders = productionOrdersInForm.filter(
        (prodOrder) =>
          prodOrder.customer_product_id &&
          prodOrder.customer_product_id !== "" &&
          prodOrder.quantity_kg &&
          prodOrder.quantity_kg >{t('pages.orders-backup.0,_);_console.log("إنشاء_أوامر_الإنتاج...",_validproductionorders.length);_const_createdproductionorders_=_[];_const_failedproductionorders_=_[];_for_(let_i_=_0;_i')}< validProductionOrders.length; i++) {
        const prodOrder = validProductionOrders[i];

        try {
          // Find the index of this production order in the original array
          const originalIndex = productionOrdersInForm.findIndex(
            (order) =>
              order.customer_product_id === prodOrder.customer_product_id &&
              order.quantity_kg === prodOrder.quantity_kg,
          );

          // Get the calculated values from quantityPreviews
          const quantityData = quantityPreviews[originalIndex];
          const overrunPercentage = quantityData?.overrun_percentage || 5.0;
          const finalQuantityKg =
            quantityData?.final_quantity_kg || prodOrder.quantity_kg * 1.05;

          const productionOrderData = {
            order_id: newOrder.data.id,
            customer_product_id: parseInt(prodOrder.customer_product_id),
            quantity_kg: prodOrder.quantity_kg.toString(),
            overrun_percentage: overrunPercentage.toString(),
            final_quantity_kg: finalQuantityKg.toString(),
            status: prodOrder.status || "pending",
          };

          console.log(`إنشاء أمر إنتاج ${i + 1}:`, productionOrderData);

          const prodOrderResponse = await fetch("/api/production-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productionOrderData),
          });

          if (!prodOrderResponse.ok) {
            const errorText = await prodOrderResponse.text();
            const errorMessage = `فشل في إنشاء أمر الإنتاج ${i + 1}: ${errorText}`;
            console.error(errorMessage);
            failedProductionOrders.push(errorMessage);
          } else {
            const createdProdOrder = await prodOrderResponse.json();
            console.log(
              `تم إنشاء أمر الإنتاج ${i + 1} بنجاح:`,
              createdProdOrder,
            );
            createdProductionOrders.push(createdProdOrder);
          }
        } catch (error) {
          const errorMessage = `خطأ في إنشاء أمر الإنتاج ${i + 1}: ${error instanceof Error ? error.message : "خطأ غير معروف"}`;
          console.error(errorMessage);
          failedProductionOrders.push(errorMessage);
        }
      }

      // If any production orders failed, show a warning but don't fail the entire operation
      if (failedProductionOrders.length > 0) {
        console.warn(
          "بعض أوامر الإنتاج فشلت في الإنشاء:",
          failedProductionOrders,
        );
        toast({
          title: "تحذير",
          description: `تم إنشاء الطلب ولكن فشل في إنشاء ${failedProductionOrders.length} من أوامر الإنتاج`,
          variant: "destructive",
        });
      }

      // Refresh data
      console.log("تحديث البيانات...");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });

      // Reset form
      setIsOrderDialogOpen(false);
      setProductionOrdersInForm([]);
      setSelectedCustomerId("");
      setCustomerSearchTerm("");
      orderForm.reset();

      console.log("تمت عملية الحفظ بنجاح");
      toast({
        title: "تم الحفظ بنجاح",
        description: `تم إضافة الطلب رقم ${orderNumber} مع ${productionOrdersInForm.length} أمر إنتاج`,
      });
    } catch (error) {
      console.error("خطأ في حفظ الطلب:", error);
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "فشل في حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const addProductionOrder = () => {
    if (!selectedCustomerId) {
      toast({
        title: "تحذير",
        description: "يجب اختيار العميل أولاً",
        variant: "destructive",
      });
      return;
    }

    setProductionOrdersInForm([
      ...productionOrdersInForm,
      {
        customer_product_id: "",
        quantity_kg: 0,
        overrun_percentage: 5.0,
        final_quantity_kg: 0,
        status: "pending",
      },
    ]);
  };

  const removeProductionOrder = (index: number) => {
    const updated = productionOrdersInForm.filter((_, i) => i !== index);
    setProductionOrdersInForm(updated);
  };

  const updateProductionOrder = async (
    index: number,
    field: string,
    value: any,
  ) => {
    const updated = [...productionOrdersInForm];
    updated[index] = { ...updated[index], [field]: value };
    setProductionOrdersInForm(updated);

    // Update quantity preview when customer product or base quantity changes
    if (field === "customer_product_id") {
      await updateQuantityPreview(index, value, updated[index].quantity_kg);
    } else if (field === "quantity_kg") {
      await updateQuantityPreview(
        index,
        updated[index].customer_product_id,
        value,
      );
    }
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
    const orderProductionOrders = productionOrders.filter(
      (po: any) => po.order_id === order.id,
    );

    // Fetch categories for proper display
    const categories = [
      { id: "CAT01", name: "أكياس التسوق", name_ar: "أكياس التسوق" },
      { id: "CAT02", name: "أكياس القمامة", name_ar: "أكياس القمامة" },
      { id: "CAT03", name: "أكياس التعبئة", name_ar: "أكياس التعبئة" },
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
            <p>تاريخ الطباعة: ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          </div>
          
          <div class="order-info">
            <div class="info-box">
              <h3>{t('pages.orders-backup.معلومات_الطلب')}</h3>
              <p><strong>{t('pages.orders-backup.رقم_الطلب:')}</strong> ${order.order_number}</p>
              <p><strong>{t('pages.orders-backup.تاريخ_الإنشاء:')}</strong> ${format(new Date(order.created_at), "dd/MM/yyyy")}</p>
              <p><strong>{t('pages.orders-backup.مدة_التسليم:')}</strong> ${order.delivery_days} يوم</p>
              <p><strong>{t('pages.orders-backup.الحالة:')}</strong> ${order.status}</p>
              <p><strong>{t('pages.orders-backup.ملاحظات:')}</strong> ${order.notes || "لا توجد ملاحظات"}</p>
            </div>
            
            <div class="info-box">
              <h3>{t('pages.orders-backup.معلومات_العميل')}</h3>
              <p><strong>{t('pages.orders-backup.اسم_العميل:')}</strong> ${customer?.name_ar || customer?.name}</p>
              <p><strong>{t('pages.orders-backup.رقم_العميل:')}</strong> ${customer?.id}</p>
              <p><strong>{t('pages.orders-backup.الهاتف:')}</strong> ${customer?.phone || "غير محدد"}</p>
              <p><strong>{t('pages.orders-backup.العنوان:')}</strong> ${customer?.address || "غير محدد"}</p>
            </div>
          </div>
          
          
          <div class="production-orders">
            <h3>{t('pages.orders-backup.أوامر_الإنتاج')}</h3>
            ${orderProductionOrders
              .map((po: any) => {
                const product = customerProducts.find(
                  (p: any) =>{t('pages.orders-backup.p.id_===_po.customer_product_id,_);_return_`')}<div class="production-order-card">
                  <h4>أمر إنتاج: ${po.production_order_number}</h4>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div class="product-details">
                      <h5>{t('pages.orders-backup.تفاصيل_المنتج:')}</h5>
                      <p><strong>{t('pages.orders-backup.اسم_المنتج:')}</strong> ${product?.size_caption || "غير محدد"}</p>
                      <p><strong>{t('pages.orders-backup.المادة_الخام:')}</strong> ${product?.raw_material || "غير محدد"}</p>
                      <p><strong>{t('pages.orders-backup.العرض:')}</strong> ${product?.width || "غير محدد"} سم</p>
                      <p><strong>{t('pages.orders-backup.السماكة:')}</strong> ${product?.thickness || "غير محدد"} مايكرون</p>
                      <p><strong>{t('pages.orders-backup.طول_القطع:')}</strong> ${product?.cutting_length_cm || "غير محدد"} سم</p>
                      <p><strong>{t('pages.orders-backup.عدد_القطع_بالكيلو:')}</strong> ${product?.pieces_per_kg || "غير محدد"}</p>
                    </div>
                    
                    <div class="product-specs">
                      <h5>{t('pages.orders-backup.المواصفات_الفنية:')}</h5>
                      <p><strong>{t('pages.orders-backup.التخريم:')}</strong> ${product?.punching || "بدون تخريم"}</p>
                      <p><strong>{t('pages.orders-backup.الماستر_باتش:')}</strong> ${product?.master_batch_id || "غير محدد"}</p>
                      ${product?.color ? `<p><strong>{t('pages.orders-backup.اللون:')}</strong> ${product.color}</p>` : ""}
                      ${product?.bag_type ? `<p><strong>{t('pages.orders-backup.نوع_الكيس:')}</strong> ${product.bag_type}</p>` : ""}
                      <p><strong>{t('pages.orders-backup.الطباعة:')}</strong> ${product?.print_colors ? `${product.print_colors} لون` : "بدون طباعة"}</p>
                      <p><strong>{t('pages.orders-backup.فئة_المنتج:')}</strong> ${(() => {
                        const category = categories.find(
                          (c: any) => c.id === product?.category_id,
                        );
                        return (
                          category?.name_ar || category?.name || "غير محدد"
                        );
                      })()}</p>
                    </div>
                    
                    <div class="production-details">
                      <h5>{t('pages.orders-backup.تفاصيل_الإنتاج:')}</h5>
                      <p><strong>{t('pages.orders-backup.الكمية_المطلوبة:')}</strong> ${po.quantity_kg} كيلو</p>
                      <p><strong>{t('pages.orders-backup.عدد_القطع_المتوقع:')}</strong> ${product?.pieces_per_kg ? Math.round(parseFloat(po.quantity_kg) * parseFloat(product.pieces_per_kg)) : "غير محسوب"} قطعة</p>
                      <p><strong>{t('pages.orders-backup.حالة_الإنتاج:')}</strong> ${po.status === "pending" ? "في الانتظار" : po.status === "in_progress" ? "قيد التنفيذ" : po.status === "completed" ? "مكتمل" : "ملغي"}</p>
                      <p><strong>{t('pages.orders-backup.تاريخ_الإنشاء:')}</strong> ${format(new Date(po.created_at), "dd/MM/yyyy")}</p>
                      <p><strong>{t('pages.orders-backup.ملاحظات_الإنتاج:')}</strong> ${product?.production_notes || "لا توجد"}</p>
                    </div>
                  </div>
                  
                  ${
                    product?.additional_notes
                      ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                      <p><strong>{t('pages.orders-backup.ملاحظات_إضافية:')}</strong> ${product.additional_notes}</p>
                    </div>
                  `
                      : ""
                  }
                </div>
              `;
              })
              .join("")}
          </div>
          
          <div class="user-info info-box">
            <h3>{t('pages.orders-backup.معلومات_المستخدم')}</h3>
            <p><strong>{t('pages.orders-backup.اسم_المستخدم:')}</strong> ${user?.username}</p>
            <p><strong>{t('pages.orders-backup.رقم_المستخدم:')}</strong> ${user?.id}</p>
            <p><strong>{t('pages.orders-backup.تاريخ_إنشاء_الطلب:')}</strong> ${format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: "طباعة الطلب",
      description: `تم فتح نافذة طباعة للطلب ${order.order_number}`,
    });
  };

  const handleDeleteOrder = async (order: any) => {
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

      if (!response.ok) throw new Error("فشل في حذف الطلب");

      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف الطلب ${order.order_number}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الطلب",
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

      if (!response.ok) throw new Error("فشل في تحديث حالة الطلب");

      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث حالة الطلب ${order.order_number}`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الطلب",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      waiting: { label: "انتظار", variant: "secondary" as const },
      in_production: { label: "قيد الإنتاج", variant: "default" as const },
      paused: { label: "معلق", variant: "destructive" as const },
      completed: { label: "مكتمل", variant: "default" as const },
      received: { label: "مستلم", variant: "default" as const },
      delivered: { label: "تم التوصيل", variant: "default" as const },
      cancelled: { label: "ملغي", variant: "destructive" as const },
    };
    const statusInfo =
      statusMap[status as keyof typeof statusMap] || statusMap.waiting;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className={t("pages.orders-backup.name.min_h_screen_bg_gray_50")}>
      <Header />
      <div className={t("pages.orders-backup.name.flex")}>
        <Sidebar />
        <main className={t("pages.orders-backup.name.flex_1_lg_mr_64_p_6")}>
          <div className={t("pages.orders-backup.name.mb_6")}>
            <h1 className={t("pages.orders-backup.name.text_2xl_font_bold_text_gray_900_mb_2")}>{t('pages.orders-backup.إدارة_الطلبات_والإنتاج')}</h1>
            <p className={t("pages.orders-backup.name.text_gray_600")}>{t('pages.orders-backup.متابعة_وإدارة_طلبات_العملاء_وأوامر_الإنتاج')}</p>
          </div>

          {/* Statistics Cards */}
          <div className={t("pages.orders-backup.name.grid_grid_cols_1_md_grid_cols_4_gap_6_mb_6")}>
            <Card>
              <CardHeader className={t("pages.orders-backup.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.orders-backup.name.text_sm_font_medium")}>
                  {statusFilter === "all"
                    ? "إجمالي الطلبات"
                    : statusFilter === "waiting"
                      ? "طلبات في الانتظار"
                      : statusFilter === "in_production"
                        ? "طلبات قيد الإنتاج"
                        : statusFilter === "paused"
                          ? "طلبات معلقة"
                          : statusFilter === "completed"
                            ? "طلبات مكتملة"
                            : statusFilter === "received"
                              ? "طلبات مستلمة"
                              : statusFilter === "delivered"
                                ? "طلبات تم توصيلها"
                                : "الطلبات المفلترة"}
                </CardTitle>
                <FileText className={t("pages.orders-backup.name.h_4_w_4_text_muted_foreground")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.orders-backup.name.text_2xl_font_bold")}>
                  {filteredOrders.length}
                </div>
                <p className={t("pages.orders-backup.name.text_xs_text_muted_foreground")}>
                  {statusFilter === "all"
                    ? `من أصل ${orders.length} طلب`
                    : `من أصل ${orders.length} طلب إجمالي`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.orders-backup.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.orders-backup.name.text_sm_font_medium")}>{t('pages.orders-backup.أوامر_الإنتاج')}</CardTitle>
                <Package className={t("pages.orders-backup.name.h_4_w_4_text_muted_foreground")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.orders-backup.name.text_2xl_font_bold")}>
                  {productionOrders.length}
                </div>
                <p className={t("pages.orders-backup.name.text_xs_text_muted_foreground")}>{t('pages.orders-backup.أمر_إنتاج')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.orders-backup.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.orders-backup.name.text_sm_font_medium")}>{t('pages.orders-backup.قيد_التنفيذ')}</CardTitle>
                <Clock className={t("pages.orders-backup.name.h_4_w_4_text_yellow_500")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.orders-backup.name.text_2xl_font_bold_text_yellow_600")}>
                  {
                    productionOrders.filter(
                      (po: any) => po.status === "in_progress",
                    ).length
                  }
                </div>
                <p className={t("pages.orders-backup.name.text_xs_text_muted_foreground")}>{t('pages.orders-backup.أمر_قيد_التنفيذ')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={t("pages.orders-backup.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
                <CardTitle className={t("pages.orders-backup.name.text_sm_font_medium")}>{t('pages.orders-backup.مكتملة')}</CardTitle>
                <Package className={t("pages.orders-backup.name.h_4_w_4_text_green_500")} />
              </CardHeader>
              <CardContent>
                <div className={t("pages.orders-backup.name.text_2xl_font_bold_text_green_600")}>
                  {
                    productionOrders.filter(
                      (po: any) => po.status === "completed",
                    ).length
                  }
                </div>
                <p className={t("pages.orders-backup.name.text_xs_text_muted_foreground")}>{t('pages.orders-backup.أمر_مكتمل')}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders" className={t("pages.orders-backup.name.space_y_4")}>
            <TabsList>
              <TabsTrigger value="orders">{t('pages.orders-backup.الطلبات')}</TabsTrigger>
              <TabsTrigger value="production-orders">{t('pages.orders-backup.أوامر_الإنتاج')}</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className={t("pages.orders-backup.name.space_y_4")}>
              <Card>
                <CardHeader>
                  <div className={t("pages.orders-backup.name.flex_items_center_justify_between")}>
                    <CardTitle>{t('pages.orders-backup.إدارة_الطلبات')}</CardTitle>
                    <div className={t("pages.orders-backup.name.flex_space_x_2_space_x_reverse")}>
                      <div className={t("pages.orders-backup.name.relative")}>
                        <Search className={t("pages.orders-backup.name.absolute_left_3_top_1_2_transform_translate_y_1_2_h_4_w_4_text_gray_400")} />
                        <Input
                          placeholder="{t('pages.orders-backup.placeholder.البحث_في_الطلبات...')}"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={t("pages.orders-backup.name.pl_10_w_64")}
                        />
                      </div>
                      <Select
                        value={statusFilter || ""}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className={t("pages.orders-backup.name.w_48")}>
                          <SelectValue placeholder="{t('pages.orders-backup.placeholder.فلترة_حسب_الحالة')}" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('pages.orders-backup.جميع_الطلبات')}</SelectItem>
                          <SelectItem value="waiting">{t('pages.orders-backup.انتظار')}</SelectItem>
                          <SelectItem value="in_production">{t('pages.orders-backup.قيد_الإنتاج')}</SelectItem>
                          <SelectItem value="paused">{t('pages.orders-backup.معلق')}</SelectItem>
                          <SelectItem value="completed">{t('pages.orders-backup.مكتمل')}</SelectItem>
                          <SelectItem value="received">{t('pages.orders-backup.مستلم')}</SelectItem>
                          <SelectItem value="delivered">{t('pages.orders-backup.تم_التوصيل')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Dialog
                        open={isOrderDialogOpen}
                        onOpenChange={setIsOrderDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button onClick={handleAddOrder}>
                            <Plus className={t("pages.orders-backup.name.h_4_w_4_mr_2")} />{t('pages.orders-backup.إضافة_طلب')}</Button>
                        </DialogTrigger>
                        <DialogContent className={t("pages.orders-backup.name.max_w_4xl_max_h_80vh_overflow_y_auto")}>
                          <DialogHeader>
                            <DialogTitle>{t('pages.orders-backup.إضافة_طلب_جديد')}</DialogTitle>
                            <DialogDescription>{t('pages.orders-backup.إضافة_طلب_جديد_مع_أوامر_الإنتاج_والمواصفات_المطلوبة')}</DialogDescription>
                          </DialogHeader>
                          <Form {...orderForm}>
                            <form
                              onSubmit={orderForm.handleSubmit(onOrderSubmit)}
                              className={t("pages.orders-backup.name.space_y_6")}
                            >
                              {/* Order Info Section */}
                              <div className={t("pages.orders-backup.name.grid_grid_cols_2_gap_4_p_4_bg_gray_50_rounded_lg")}>
                                <div>
                                  <label className={t("pages.orders-backup.name.text_sm_font_medium_text_gray_700")}>{t('pages.orders-backup.رقم_الطلب')}</label>
                                  <div className={t("pages.orders-backup.name.text_lg_font_bold_text_blue_600")}>{t('pages.orders-backup.سيتم_توليده_تلقائياً')}</div>
                                </div>
                                <div>
                                  <label className={t("pages.orders-backup.name.text_sm_font_medium_text_gray_700")}>{t('pages.orders-backup.التاريخ')}</label>
                                  <div className={t("pages.orders-backup.name.text_lg_font_bold_text_gray_900")}>
                                    {format(new Date(), "dd/MM/yyyy")}
                                  </div>
                                </div>
                              </div>

                              {/* Customer Selection with Search */}
                              <FormField
                                control={orderForm.control}
                                name="{t('pages.orders-backup.name.customer_id')}"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('pages.orders-backup.العميل')}</FormLabel>
                                    <div className={t("pages.orders-backup.name.space_y_2")}>
                                      <div className={t("pages.orders-backup.name.relative")}>
                                        <Search className={t("pages.orders-backup.name.absolute_left_3_top_1_2_transform_translate_y_1_2_h_4_w_4_text_gray_400")} />
                                        <Input
                                          placeholder="{t('pages.orders-backup.placeholder.البحث_بالاسم_العربي_أو_الإنجليزي...')}"
                                          value={customerSearchTerm}
                                          onChange={(e) =>
                                            setCustomerSearchTerm(
                                              e.target.value,
                                            )
                                          }
                                          className={t("pages.orders-backup.name.pl_10")}
                                        />
                                      </div>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          setSelectedCustomerId(value);
                                          // Reset production orders when customer changes
                                          setProductionOrdersInForm([]);
                                        }}
                                        value={field.value || ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="{t('pages.orders-backup.placeholder.اختر_العميل')}" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {filteredCustomers.map(
                                            (customer: any) => (
                                              <SelectItem
                                                key={customer.id}
                                                value={customer.id.toString()}
                                              >
                                                {customer.name_ar ||
                                                  customer.name}{" "}
                                                ({customer.id})
                                              </SelectItem>
                                            ),
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              {/* Production Orders Section */}
                              <div className={t("pages.orders-backup.name.border_t_pt_6")}>
                                <div className={t("pages.orders-backup.name.flex_items_center_justify_between_mb_4")}>
                                  <h3 className={t("pages.orders-backup.name.text_lg_font_semibold")}>{t('pages.orders-backup.أوامر_الإنتاج')}</h3>
                                  <Button
                                    type="button"
                                    onClick={addProductionOrder}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Plus className={t("pages.orders-backup.name.h_4_w_4_mr_2")} />{t('pages.orders-backup.إضافة_أمر_إنتاج')}</Button>
                                </div>

                                {productionOrdersInForm.length === 0 && (
                                  <div className={t("pages.orders-backup.name.text_center_py_8_text_gray_500")}>{t('pages.orders-backup.يجب_إضافة_أمر_إنتاج_واحد_على_الأقل')}</div>
                                )}

                                <div className={t("pages.orders-backup.name.space_y_4")}>
                                  {productionOrdersInForm.map(
                                    (prodOrder, index) => (
                                      <div
                                        key={index}
                                        className={t("pages.orders-backup.name.p_4_border_rounded_lg_bg_gray_50")}
                                      >
                                        <div className={t("pages.orders-backup.name.flex_items_center_justify_between_mb_3")}>
                                          <h4 className={t("pages.orders-backup.name.font_medium")}>
                                            أمر إنتاج #{index + 1}
                                          </h4>
                                          <Button
                                            type="button"
                                            onClick={() =>
                                              removeProductionOrder(index)
                                            }
                                            variant="ghost"
                                            size="sm"
                                          >
                                            <Trash2 className={t("pages.orders-backup.name.h_4_w_4_text_red_500")} />
                                          </Button>
                                        </div>

                                        <div className={t("pages.orders-backup.name.grid_grid_cols_1_gap_4")}>
                                          <div className={t("pages.orders-backup.name.col_span_1")}>
                                            <label className={t("pages.orders-backup.name.text_sm_font_medium_text_gray_700")}>{t('pages.orders-backup.منتج_العميل')}</label>
                                            <Select
                                              onValueChange={(value) =>
                                                updateProductionOrder(
                                                  index,
                                                  "customer_product_id",
                                                  parseInt(value),
                                                )
                                              }
                                              value={
                                                prodOrder.customer_product_id?.toString() ||
                                                ""
                                              }
                                            >
                                              <SelectTrigger className={t("pages.orders-backup.name.h_auto_min_h_60px_w_full")}>
                                                <SelectValue placeholder="{t('pages.orders-backup.placeholder.اختر_المنتج')}">
                                                  {prodOrder.customer_product_id &&
                                                    filteredCustomerProducts.find(
                                                      (p: any) =>{t('pages.orders-backup.p.id_===_prodorder.customer_product_id,_)_&&_(')}<div className={t("pages.orders-backup.name.text_right_w_full_py_2")}>
                                                        <div className={t("pages.orders-backup.name.font_medium_text_gray_900_text_sm_leading_relaxed_mb_1")}>
                                                          {(() => {
                                                            const product =
                                                              filteredCustomerProducts.find(
                                                                (p: any) =>
                                                                  p.id ===
                                                                  prodOrder.customer_product_id,
                                                              );
                                                            if (!product)
                                                              return "";

                                                            // البحث عن اسم المنتج من جدول items
                                                            const item =
                                                              items.find(
                                                                (item: any) =>
                                                                  item.id ===
                                                                  product.item_id,
                                                              );
                                                            const productName =
                                                              item?.name_ar ||
                                                              item?.name ||
                                                              "منتج غير محدد";

                                                            // إضافة وصف المقاس
                                                            let fullDisplayName =
                                                              productName;
                                                            if (
                                                              product?.size_caption
                                                            ) {
                                                              fullDisplayName += ` - ${product.size_caption}`;
                                                            }

                                                            return fullDisplayName;
                                                          })()}
                                                        </div>
                                                        <div className={t("pages.orders-backup.name.text_xs_text_gray_600_space_y_0_5")}>
                                                          {(() => {
                                                            const product =
                                                              filteredCustomerProducts.find(
                                                                (p: any) =>{t('pages.orders-backup.p.id_===_prodorder.customer_product_id,_);_if_(!product)_return_null;_return_(')}<div className={t("pages.orders-backup.name.grid_grid_cols_1_gap_0_5")}>
                                                                {product.thickness && (
                                                                  <div>
                                                                    <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.السماكة:')}</span>{" "}
                                                                    <span className={t("pages.orders-backup.name.text_blue_600_font_medium")}>
                                                                      {
                                                                        product.thickness
                                                                      }{" "}
                                                                      ميكرون
                                                                    </span>
                                                                  </div>
                                                                )}
                                                                {product.master_batch_id && (
                                                                  <div className={t("pages.orders-backup.name.flex_items_center_gap_1")}>
                                                                    <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.الماستر_باتش:')}</span>
                                                                    <div className={t("pages.orders-backup.name.flex_items_center_gap_1")}>
                                                                      <div
                                                                        className={t("pages.orders-backup.name.w_3_h_3_rounded_full_border")}
                                                                        style={{
                                                                          backgroundColor:
                                                                            (() => {
                                                                              const colorMap: {
                                                                                [
                                                                                  key: string
                                                                                ]: string;
                                                                              } =
                                                                                {
                                                                                  WHITE:
                                                                                    "#FFFFFF",
                                                                                  BLACK:
                                                                                    "#000000",
                                                                                  CLEAR:
                                                                                    "#FFFFFF",
                                                                                  RED: "#FF0000",
                                                                                  BLUE: "#0000FF",
                                                                                  GREEN:
                                                                                    "#008000",
                                                                                  YELLOW:
                                                                                    "#FFFF00",
                                                                                  ORANGE:
                                                                                    "#FFA500",
                                                                                  PURPLE:
                                                                                    "#800080",
                                                                                };
                                                                              const color =
                                                                                colorMap[
                                                                                  product.master_batch_id?.toUpperCase()
                                                                                ] ||
                                                                                "#808080";
                                                                              return color;
                                                                            })(),
                                                                          borderColor:
                                                                            product.master_batch_id?.toUpperCase() ===
                                                                            "WHITE"
                                                                              ? "#CCCCCC"
                                                                              : (() => {
                                                                                  const colorMap: {
                                                                                    [
                                                                                      key: string
                                                                                    ]: string;
                                                                                  } =
                                                                                    {
                                                                                      WHITE:
                                                                                        "#FFFFFF",
                                                                                      BLACK:
                                                                                        "#000000",
                                                                                      CLEAR:
                                                                                        "#FFFFFF",
                                                                                      RED: "#FF0000",
                                                                                      BLUE: "#0000FF",
                                                                                      GREEN:
                                                                                        "#008000",
                                                                                      YELLOW:
                                                                                        "#FFFF00",
                                                                                      ORANGE:
                                                                                        "#FFA500",
                                                                                      PURPLE:
                                                                                        "#800080",
                                                                                    };
                                                                                  return (
                                                                                    colorMap[
                                                                                      product.master_batch_id?.toUpperCase()
                                                                                    ] ||
                                                                                    "#808080"
                                                                                  );
                                                                                })(),
                                                                        }}
                                                                      />
                                                                      <span className={t("pages.orders-backup.name.text_purple_600_font_medium")}>
                                                                        {getMasterBatchArabicName(
                                                                          product.master_batch_id,
                                                                        )}
                                                                      </span>
                                                                    </div>
                                                                  </div>
                                                                )}
                                                                {product.raw_material && (
                                                                  <div>
                                                                    <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.المادة:')}</span>{" "}
                                                                    <span className={t("pages.orders-backup.name.text_green_600_font_medium")}>
                                                                      {
                                                                        product.raw_material
                                                                      }
                                                                    </span>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            );
                                                          })()}
                                                        </div>
                                                      </div>
                                                    )}
                                                </SelectValue>
                                              </SelectTrigger>
                                              <SelectContent className={t("pages.orders-backup.name.max_w_800px_w_800px_")}>
                                                {filteredCustomerProducts.map(
                                                  (product: any) => (
                                                    <SelectItem
                                                      key={product.id}
                                                      value={product.id.toString()}
                                                      className={t("pages.orders-backup.name.h_auto_min_h_80px_py_3")}
                                                    >
                                                      <div className={t("pages.orders-backup.name.w_full_text_right_py_2_min_w_700px_")}>
                                                        <div className={t("pages.orders-backup.name.font_semibold_text_gray_900_mb_2_text_base_leading_relaxed")}>
                                                          {(() => {
                                                            const item =
                                                              items.find(
                                                                (item: any) =>{t('pages.orders-backup.item.id_===_product.item_id,_);_return_(')}<>
                                                                <div>
                                                                  {item?.name_ar ||
                                                                    item?.name ||
                                                                    "منتج غير محدد"}
                                                                </div>
                                                                {product?.size_caption && (
                                                                  <div>
                                                                    {
                                                                      product.size_caption
                                                                    }
                                                                  </div>
                                                                )}
                                                                {product.cutting_length_cm && (
                                                                  <div>
                                                                    طول القطع:{" "}
                                                                    {
                                                                      product.cutting_length_cm
                                                                    }{" "}
                                                                    سم
                                                                  </div>
                                                                )}
                                                              </>
                                                            );
                                                          })()}
                                                        </div>

                                                        <div className={t("pages.orders-backup.name.grid_grid_cols_2_gap_6_text_sm_text_gray_600")}>
                                                          <div className={t("pages.orders-backup.name.space_y_2")}>
                                                            {product.thickness && (
                                                              <div className={t("pages.orders-backup.name.flex_items_center_gap_2")}>
                                                                <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.السماكة:')}</span>
                                                                <span className={t("pages.orders-backup.name.text_blue_600_font_semibold_bg_blue_50_px_2_py_0_5_rounded")}>
                                                                  {
                                                                    product.thickness
                                                                  }{" "}
                                                                  ميكرون
                                                                </span>
                                                              </div>
                                                            )}
                                                            {product.master_batch_id && (
                                                              <div className={t("pages.orders-backup.name.flex_items_center_gap_2")}>
                                                                <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.الماستر_باتش:')}</span>
                                                                <div className={t("pages.orders-backup.name.flex_items_center_gap_1")}>
                                                                  <div
                                                                    className={t("pages.orders-backup.name.w_4_h_4_rounded_full_border_2")}
                                                                    style={{
                                                                      backgroundColor:
                                                                        (() => {
                                                                          const colorMap: {
                                                                            [
                                                                              key: string
                                                                            ]: string;
                                                                          } = {
                                                                            WHITE:
                                                                              "#FFFFFF",
                                                                            BLACK:
                                                                              "#000000",
                                                                            CLEAR:
                                                                              "#FFFFFF",
                                                                            RED: "#FF0000",
                                                                            BLUE: "#0000FF",
                                                                            GREEN:
                                                                              "#008000",
                                                                            YELLOW:
                                                                              "#FFFF00",
                                                                            ORANGE:
                                                                              "#FFA500",
                                                                            PURPLE:
                                                                              "#800080",
                                                                            PINK: "#FFC0CB",
                                                                            BROWN:
                                                                              "#A52A2A",
                                                                          };
                                                                          return (
                                                                            colorMap[
                                                                              product.master_batch_id?.toUpperCase()
                                                                            ] ||
                                                                            "#808080"
                                                                          );
                                                                        })(),
                                                                      borderColor:
                                                                        product.master_batch_id?.toUpperCase() ===
                                                                        "WHITE"
                                                                          ? "#CCCCCC"
                                                                          : (() => {
                                                                              const colorMap: {
                                                                                [
                                                                                  key: string
                                                                                ]: string;
                                                                              } =
                                                                                {
                                                                                  WHITE:
                                                                                    "#FFFFFF",
                                                                                  BLACK:
                                                                                    "#000000",
                                                                                  CLEAR:
                                                                                    "#FFFFFF",
                                                                                  RED: "#FF0000",
                                                                                  BLUE: "#0000FF",
                                                                                  GREEN:
                                                                                    "#008000",
                                                                                  YELLOW:
                                                                                    "#FFFF00",
                                                                                  ORANGE:
                                                                                    "#FFA500",
                                                                                  PURPLE:
                                                                                    "#800080",
                                                                                  PINK: "#FFC0CB",
                                                                                  BROWN:
                                                                                    "#A52A2A",
                                                                                };
                                                                              return (
                                                                                colorMap[
                                                                                  product.master_batch_id?.toUpperCase()
                                                                                ] ||
                                                                                "#808080"
                                                                              );
                                                                            })(),
                                                                    }}
                                                                  />
                                                                  <span className={t("pages.orders-backup.name.text_purple_600_font_semibold_bg_purple_50_px_2_py_0_5_rounded")}>
                                                                    {getMasterBatchArabicName(
                                                                      product.master_batch_id,
                                                                    )}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            )}
                                                            {product.raw_material && (
                                                              <div className={t("pages.orders-backup.name.flex_items_center_gap_2")}>
                                                                <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.المادة_الخام:')}</span>
                                                                <span className={t("pages.orders-backup.name.text_green_600_font_semibold_bg_green_50_px_2_py_0_5_rounded")}>
                                                                  {
                                                                    product.raw_material
                                                                  }
                                                                </span>
                                                              </div>
                                                            )}
                                                          </div>
                                                          <div className={t("pages.orders-backup.name.space_y_2")}>
                                                            {product.width && (
                                                              <div>
                                                                <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.العرض:')}</span>{" "}
                                                                <span className={t("pages.orders-backup.name.text_orange_600_font_medium")}>
                                                                  {
                                                                    product.width
                                                                  }{" "}
                                                                  سم
                                                                </span>
                                                              </div>
                                                            )}
                                                            {product.punching && (
                                                              <div>
                                                                <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.التخريم:')}</span>{" "}
                                                                <span className={t("pages.orders-backup.name.text_teal_600_font_medium")}>
                                                                  {
                                                                    product.punching
                                                                  }
                                                                </span>
                                                              </div>
                                                            )}
                                                            {product.cutting_unit && (
                                                              <div>
                                                                <span className={t("pages.orders-backup.name.font_medium_text_gray_700")}>{t('pages.orders-backup.وحدة_القطع:')}</span>{" "}
                                                                <span className={t("pages.orders-backup.name.text_indigo_600_font_medium")}>
                                                                  {
                                                                    product.cutting_unit
                                                                  }
                                                                </span>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                        {product.notes && (
                                                          <div className={t("pages.orders-backup.name.mt_2_text_xs_text_gray_500_bg_gray_50_rounded_p_2")}>
                                                            <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.ملاحظات:')}</span>{" "}
                                                            {product.notes}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </SelectItem>
                                                  ),
                                                )}
                                              </SelectContent>
                                            </Select>
                                          </div>

                                          <div className={t("pages.orders-backup.name.grid_grid_cols_1_gap_4")}>
                                            <div>
                                              <label className={t("pages.orders-backup.name.text_sm_font_medium_text_gray_700")}>{t('pages.orders-backup.الكمية_الأساسية_(كيلو)')}</label>
                                              <Input
                                                type="number"
                                                placeholder="{t('pages.orders-backup.placeholder.الكمية_الأساسية')}"
                                                value={
                                                  prodOrder.quantity_kg || ""
                                                }
                                                onChange={(e) =>
                                                  updateProductionOrder(
                                                    index,
                                                    "quantity_kg",
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                  )
                                                }
                                                className={t("pages.orders-backup.name.w_full")}
                                                data-testid={`input-base-quantity-${index}`}
                                              />
                                              {quantityPreviews[index] && (
                                                <div className={t("pages.orders-backup.name.mt_2_p_3_bg_blue_50_border_border_blue_200_rounded_lg")}>
                                                  <div className={t("pages.orders-backup.name.text_sm_text_blue_800_space_y_1")}>
                                                    <div className={t("pages.orders-backup.name.flex_justify_between")}>
                                                      <span>{t('pages.orders-backup.الكمية_الأساسية:')}</span>
                                                      <span className={t("pages.orders-backup.name.font_medium")}>
                                                        {
                                                          quantityPreviews[
                                                            index
                                                          ].quantity_kg
                                                        }{" "}
                                                        كغ
                                                      </span>
                                                    </div>
                                                    <div className={t("pages.orders-backup.name.flex_justify_between")}>
                                                      <span>{t('pages.orders-backup.نسبة_الإضافة:')}</span>
                                                      <span className={t("pages.orders-backup.name.font_medium_text_orange_600")}>
                                                        {
                                                          quantityPreviews[
                                                            index
                                                          ].overrun_percentage
                                                        }
                                                        %
                                                      </span>
                                                    </div>
                                                    <div className={t("pages.orders-backup.name.flex_justify_between_border_t_pt_1")}>
                                                      <span className={t("pages.orders-backup.name.font_semibold")}>{t('pages.orders-backup.الكمية_النهائية:')}</span>
                                                      <span className={t("pages.orders-backup.name.font_bold_text_green_600")}>
                                                        {
                                                          quantityPreviews[
                                                            index
                                                          ].final_quantity_kg
                                                        }{" "}
                                                        كغ
                                                      </span>
                                                    </div>
                                                    <div className={t("pages.orders-backup.name.text_xs_text_blue_600_italic")}>
                                                      {
                                                        quantityPreviews[index]
                                                          .overrun_reason
                                                      }
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            <div>
                                              <label className={t("pages.orders-backup.name.text_sm_font_medium_text_gray_700")}>{t('pages.orders-backup.الحالة')}</label>
                                              <Select
                                                onValueChange={(value) =>
                                                  updateProductionOrder(
                                                    index,
                                                    "status",
                                                    value,
                                                  )
                                                }
                                                value={
                                                  prodOrder.status || "pending"
                                                }
                                              >
                                                <SelectTrigger className={t("pages.orders-backup.name.w_full")}>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="pending">{t('pages.orders-backup.في_الانتظار')}</SelectItem>
                                                  <SelectItem value="in_progress">{t('pages.orders-backup.قيد_التنفيذ')}</SelectItem>
                                                  <SelectItem value="completed">{t('pages.orders-backup.مكتمل')}</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                              <div className={t("pages.orders-backup.name.grid_grid_cols_2_gap_4")}>
                                <FormField
                                  control={orderForm.control}
                                  name="{t('pages.orders-backup.name.delivery_days')}"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t('pages.orders-backup.مدة_التسليم_(بالأيام)')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="number"
                                          placeholder="{t('pages.orders-backup.placeholder.عدد_الأيام')}"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={orderForm.control}
                                  name="{t('pages.orders-backup.name.notes')}"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t('pages.orders-backup.ملاحظات')}</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          {...field}
                                          placeholder="{t('pages.orders-backup.placeholder.ملاحظات_إضافية')}"
                                          rows={1}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className={t("pages.orders-backup.name.flex_gap_4_pt_6_border_t")}>
                                <Button
                                  type="submit"
                                  className={t("pages.orders-backup.name.flex_1")}
                                  disabled={productionOrdersInForm.length === 0}
                                >{t('pages.orders-backup.إنشاء_الطلب_وأوامر_الإنتاج')}</Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsOrderDialogOpen(false)}
                                  className={t("pages.orders-backup.name.flex_1")}
                                >{t('pages.orders-backup.إلغاء')}</Button>
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
                        <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.رقم_الطلب')}</TableHead>
                        <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.العميل')}</TableHead>
                        <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.تاريخ_الإنشاء')}</TableHead>
                        <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.المستخدم')}</TableHead>
                        <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.مدة_التسليم_المتبقية')}</TableHead>
                        <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.ملاحظات')}</TableHead>
                        <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.الحالة')}</TableHead>
                        <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.الإجراءات')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order: any) => {
                        // Find customer details
                        const customer = customers.find(
                          (c: any) => c.id === order.customer_id,
                        );
                        // Find user details
                        const user = users.find(
                          (u: any) =>{t('pages.orders-backup.u.id_===_parseint(order.created_by),_);_//_calculate_delivery_time_remaining_const_createddate_=_new_date(order.created_at);_const_deliverydate_=_new_date(createddate);_deliverydate.setdate(_deliverydate.getdate()_+_order.delivery_days,_);_const_today_=_new_date();_const_daysremaining_=_math.ceil(_(deliverydate.gettime()_-_today.gettime())_/_(1000_*_60_*_60_*_24),_);_return_(')}<TableRow key={order.id}>
                            <TableCell className={t("pages.orders-backup.name.font_medium")}>
                              {order.order_number}
                            </TableCell>
                            <TableCell>
                              <div className={t("pages.orders-backup.name.text_right")}>
                                <div className={t("pages.orders-backup.name.font_medium")}>
                                  {customer?.name_ar || customer?.name}
                                </div>
                                <div className={t("pages.orders-backup.name.text_sm_text_gray_500")}>
                                  {customer?.id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {order.created_at
                                ? format(
                                    new Date(order.created_at),
                                    "dd/MM/yyyy",
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <div className={t("pages.orders-backup.name.text_right")}>
                                <div className={t("pages.orders-backup.name.font_medium")}>
                                  {user?.username}
                                </div>
                                <div className={t("pages.orders-backup.name.text_sm_text_gray_500")}>
                                  #{user?.id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={t("pages.orders-backup.name.text_right")}>
                                <div className={t("pages.orders-backup.name.font_medium")}>
                                  {daysRemaining >{t('pages.orders-backup.0_?_(')}<span className={t("pages.orders-backup.name.text_green_600")}>
                                      {daysRemaining} يوم متبقي
                                    </span>{t('pages.orders-backup.)_:_daysremaining_===_0_?_(')}<span className={t("pages.orders-backup.name.text_orange_600")}>{t('pages.orders-backup.يجب_التسليم_اليوم')}</span>{t('pages.orders-backup.)_:_(')}<span className={t("pages.orders-backup.name.text_red_600")}>
                                      متأخر {Math.abs(daysRemaining)} يوم
                                    </span>
                                  )}
                                </div>
                                <div className={t("pages.orders-backup.name.text_sm_text_gray_500")}>
                                  التسليم: {format(deliveryDate, "dd/MM/yyyy")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{order.notes || "-"}</TableCell>
                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                              {getStatusBadge(order.status || "pending")}
                            </TableCell>
                            <TableCell>
                              <div className={t("pages.orders-backup.name.flex_space_x_2_space_x_reverse")}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={t("pages.orders-backup.name.text_blue_600_border_blue_600_hover_bg_blue_50")}
                                  onClick={() => handleViewOrder(order)}
                                  title="{t('pages.orders-backup.title.{t('pages.orders-backup.title.عرض')}')}"
                                >
                                  <Eye className={t("pages.orders-backup.name.h_4_w_4")} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={t("pages.orders-backup.name.text_green_600_border_green_600_hover_bg_green_50")}
                                  onClick={() => handlePrintOrder(order)}
                                  title="{t('pages.orders-backup.title.{t('pages.orders-backup.title.طباعة')}')}"
                                >
                                  <FileText className={t("pages.orders-backup.name.h_4_w_4")} />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={t("pages.orders-backup.name.text_orange_600_border_orange_600_hover_bg_orange_50")}
                                      title="{t('pages.orders-backup.title.{t('pages.orders-backup.title.تغيير_الحالة')}')}"
                                    >
                                      <RefreshCw className={t("pages.orders-backup.name.h_4_w_4_mr_1")} />
                                      <ChevronDown className={t("pages.orders-backup.name.h_3_w_3")} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className={t("pages.orders-backup.name.w_48")}
                                  >
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          order,
                                          "for_production",
                                        )
                                      }
                                    >
                                      <div className={t("pages.orders-backup.name.flex_items_center_w_full")}>
                                        <div className={t("pages.orders-backup.name.w_3_h_3_bg_blue_500_rounded_full_mr_2")}></div>{t('pages.orders-backup.إلى_الإنتاج')}</div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(order, "on_hold")
                                      }
                                    >
                                      <div className={t("pages.orders-backup.name.flex_items_center_w_full")}>
                                        <div className={t("pages.orders-backup.name.w_3_h_3_bg_red_500_rounded_full_mr_2")}></div>{t('pages.orders-backup.إيقاف_مؤقت')}</div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(order, "pending")
                                      }
                                    >
                                      <div className={t("pages.orders-backup.name.flex_items_center_w_full")}>
                                        <div className={t("pages.orders-backup.name.w_3_h_3_bg_yellow_500_rounded_full_mr_2")}></div>{t('pages.orders-backup.في_الانتظار')}</div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(order, "completed")
                                      }
                                    >
                                      <div className={t("pages.orders-backup.name.flex_items_center_w_full")}>
                                        <div className={t("pages.orders-backup.name.w_3_h_3_bg_green_500_rounded_full_mr_2")}></div>{t('pages.orders-backup.مكتمل')}</div>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={t("pages.orders-backup.name.text_red_600_border_red_600_hover_bg_red_50")}
                                  onClick={() => handleDeleteOrder(order)}
                                  title="{t('pages.orders-backup.title.{t('pages.orders-backup.title.حذف')}')}"
                                >
                                  <Trash2 className={t("pages.orders-backup.name.h_4_w_4")} />
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

            <TabsContent value="production-orders" className={t("pages.orders-backup.name.space_y_4")}>
              <Card>
                <CardHeader>
                  <div className={t("pages.orders-backup.name.flex_flex_col_space_y_4_sm_flex_row_sm_items_center_sm_justify_between_sm_space_y_0")}>
                    <CardTitle>{t('pages.orders-backup.أوامر_الإنتاج')}</CardTitle>
                    <div className={t("pages.orders-backup.name.flex_items_center_space_x_2_space_x_reverse")}>
                      <div className={t("pages.orders-backup.name.relative_flex_1_sm_flex_none_sm_w_64")}>
                        <Search className={t("pages.orders-backup.name.absolute_right_3_top_1_2_transform_translate_y_1_2_text_gray_400_h_4_w_4")} />
                        <Input
                          placeholder="{t('pages.orders-backup.placeholder.البحث_في_أوامر_الإنتاج...')}"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={t("pages.orders-backup.name.pr_10")}
                        />
                      </div>
                      <Dialog
                        open={isProductionOrderDialogOpen}
                        onOpenChange={setIsProductionOrderDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button onClick={() => handleAddProductionOrder()}>
                            <Plus className={t("pages.orders-backup.name.h_4_w_4_mr_2")} />{t('pages.orders-backup.إضافة_أمر_إنتاج')}</Button>
                        </DialogTrigger>
                        <DialogContent className={t("pages.orders-backup.name.max_w_4xl_max_h_90vh_overflow_y_auto")}>
                          <DialogHeader>
                            <DialogTitle>
                              {editingProductionOrder
                                ? "تعديل أمر الإنتاج"
                                : "إضافة أمر إنتاج جديد"}
                            </DialogTitle>
                            <DialogDescription>
                              {editingProductionOrder
                                ? "تعديل تفاصيل أمر الإنتاج والمواصفات"
                                : "إضافة أمر إنتاج جديد مع المواصفات المطلوبة"}
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...productionOrderForm}>
                            <form
                              onSubmit={productionOrderForm.handleSubmit(
                                onProductionOrderSubmit,
                              )}
                              className={t("pages.orders-backup.name.space_y_4")}
                            >
                              <FormField
                                control={productionOrderForm.control}
                                name="{t('pages.orders-backup.name.order_id')}"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('pages.orders-backup.الطلب')}</FormLabel>
                                    <Select
                                      onValueChange={(value) =>
                                        field.onChange(parseInt(value))
                                      }
                                      value={
                                        field.value ? String(field.value) : ""
                                      }
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="{t('pages.orders-backup.placeholder.اختر_الطلب')}" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {orders.map((order: any) => (
                                          <SelectItem
                                            key={order.id}
                                            value={order.id.toString()}
                                          >
                                            {order.order_number} -{" "}
                                            {order.customer_name}
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
                                name="{t('pages.orders-backup.name.production_order_number')}"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('pages.orders-backup.رقم_أمر_الإنتاج')}</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="{t('pages.orders-backup.placeholder.رقم_أمر_الإنتاج')}"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={productionOrderForm.control}
                                name="{t('pages.orders-backup.name.customer_product_id')}"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t('pages.orders-backup.منتج_العميل')}</FormLabel>
                                    <Select
                                      onValueChange={(value) =>
                                        field.onChange(parseInt(value))
                                      }
                                      value={
                                        field.value ? String(field.value) : ""
                                      }
                                    >
                                      <FormControl>
                                        <SelectTrigger className={t("pages.orders-backup.name.h_auto_min_h_40px_")}>
                                          <SelectValue placeholder="{t('pages.orders-backup.placeholder.اختر_المنتج')}" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className={t("pages.orders-backup.name.max_w_700px_")}>
                                        {customerProducts.map(
                                          (product: any) => (
                                            <SelectItem
                                              key={product.id}
                                              value={product.id.toString()}
                                            >
                                              <div className={t("pages.orders-backup.name.w_full_text_right_py_2")}>
                                                <div className={t("pages.orders-backup.name.font_semibold_text_gray_900_mb_1")}>
                                                  {(() => {
                                                    let displayName = "";

                                                    // Create base product name
                                                    let baseName = "";
                                                    if (product.size_caption) {
                                                      baseName =
                                                        product.size_caption;
                                                    } else if (
                                                      product.raw_material &&
                                                      product.width &&
                                                      product.thickness
                                                    ) {
                                                      baseName = `${product.raw_material} ${product.width}×${product.thickness}`;
                                                    } else if (
                                                      product.raw_material
                                                    ) {
                                                      baseName =
                                                        product.raw_material;
                                                    } else {
                                                      baseName={t("pages.orders-backup.name._")};
                                                    }

                                                    // Add cutting length if available
                                                    if (
                                                      product.cutting_length_cm
                                                    ) {
                                                      displayName = `${baseName} × ${product.cutting_length_cm} سم`;
                                                    } else {
                                                      displayName = baseName;
                                                    }

                                                    return displayName;
                                                  })()}
                                                </div>
                                                <div className={t("pages.orders-backup.name.text_sm_text_gray_600_space_y_1")}>
                                                  {product.raw_material && (
                                                    <div>
                                                      المادة الخام:{" "}
                                                      {product.raw_material}
                                                    </div>
                                                  )}
                                                  {product.master_batch_id && (
                                                    <div>
                                                      الماستر باتش:{" "}
                                                      {getMasterBatchArabicName(
                                                        product.master_batch_id,
                                                      )}
                                                    </div>
                                                  )}
                                                  {product.punching && (
                                                    <div>
                                                      التخريم:{" "}
                                                      {product.punching}
                                                    </div>
                                                  )}
                                                  {product.thickness && (
                                                    <div>
                                                      السماكة:{" "}
                                                      {product.thickness}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className={t("pages.orders-backup.name.grid_grid_cols_2_gap_4")}>
                                <FormField
                                  control={productionOrderForm.control}
                                  name="{t('pages.orders-backup.name.quantity_kg')}"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t('pages.orders-backup.الكمية_(كيلو)')}</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="number"
                                          step="0.01"
                                          placeholder="{t('pages.orders-backup.placeholder.الكمية_بالكيلو')}"
                                          className={t("pages.orders-backup.name.w_full")}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={productionOrderForm.control}
                                  name="{t('pages.orders-backup.name.status')}"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t('pages.orders-backup.الحالة')}</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger className={t("pages.orders-backup.name.w_full")}>
                                            <SelectValue placeholder="{t('pages.orders-backup.placeholder.اختر_الحالة')}" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="pending">{t('pages.orders-backup.في_الانتظار')}</SelectItem>
                                          <SelectItem value="in_progress">{t('pages.orders-backup.قيد_التنفيذ')}</SelectItem>
                                          <SelectItem value="completed">{t('pages.orders-backup.مكتمل')}</SelectItem>
                                          <SelectItem value="cancelled">{t('pages.orders-backup.ملغي')}</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className={t("pages.orders-backup.name.flex_justify_end_space_x_2_space_x_reverse")}>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    setIsProductionOrderDialogOpen(false)
                                  }
                                >{t('pages.orders-backup.إلغاء')}</Button>
                                <Button type="submit">
                                  {editingProductionOrder ? "تحديث" : "إضافة"}
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
                  {(() => {
                    // تجميع أوامر الإنتاج حسب رقم الطلب
                    const groupedProductionOrders =
                      filteredProductionOrders.reduce(
                        (groups: any, productionOrder: any) => {
                          const order = orders.find(
                            (o: any) => o.id === productionOrder.order_id,
                          );
                          const orderKey = order?.order_number || "غير محدد";

                          if (!groups[orderKey]) {
                            groups[orderKey] = {
                              order: order,
                              productionOrders: [],
                            };
                          }

                          groups[orderKey].productionOrders.push(
                            productionOrder,
                          );
                          return groups;
                        },
                        {},
                      );

                    const orderedGroups = Object.keys(
                      groupedProductionOrders,
                    ).sort((a, b) => b.localeCompare(a)); // ترتيب تنازلي

                    if (orderedGroups.length === 0) {
                      return (
                        <div className={t("pages.orders-backup.name.text_center_py_8_text_gray_500")}>{t('pages.orders-backup.لا_توجد_أوامر_إنتاج')}</div>
                      );
                    }

                    return (
                      <div className={t("pages.orders-backup.name.space_y_6")}>
                        {orderedGroups.map((orderKey) => {
                          const group = groupedProductionOrders[orderKey];
                          const order = group.order;
                          const customer = customers.find(
                            (c: any) =>{t('pages.orders-backup.order_&&_c.id_===_order.customer_id,_);_return_(')}<div
                              key={orderKey}
                              className={t("pages.orders-backup.name.border_2_border_gray_200_rounded_lg_overflow_hidden")}
                            >
                              {/* Order Header */}
                              <div className={t("pages.orders-backup.name.bg_gray_50_px_6_py_4_border_b_border_gray_200")}>
                                <div className={t("pages.orders-backup.name.flex_items_center_justify_between")}>
                                  <div className={t("pages.orders-backup.name.flex_items_center_gap_4")}>
                                    <h3 className={t("pages.orders-backup.name.text_lg_font_bold_text_gray_900")}>
                                      طلب رقم: {orderKey}
                                    </h3>
                                    <span className={t("pages.orders-backup.name.text_sm_text_gray_600")}>
                                      العميل:{" "}
                                      {customer?.name_ar ||
                                        customer?.name ||
                                        "غير محدد"}
                                    </span>
                                    {order && (
                                      <span className={t("pages.orders-backup.name.text_sm_text_gray_600")}>
                                        تاريخ:{" "}
                                        {format(
                                          new Date(order.created_at),
                                          "dd/MM/yyyy",
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <Badge variant="outline">
                                    {group.productionOrders.length} أوامر إنتاج
                                  </Badge>
                                </div>
                              </div>

                              {/* Production Orders Table */}
                              <div className={t("pages.orders-backup.name.overflow_x_auto")}>
                                <Table>
                                  <TableHeader>
                                    <TableRow className={t("pages.orders-backup.name.bg_gray_25")}>
                                      <TableHead className={t("pages.orders-backup.name.text_center_min_w_120px_")}>{t('pages.orders-backup.رقم_أمر_الإنتاج')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center_min_w_150px_")}>{t('pages.orders-backup.اسم_الصنف')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center_min_w_120px_")}>{t('pages.orders-backup.وصف_المقاس')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.الطباعة')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.المادة_الخام')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.الماستر_باتش')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.التخريم')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.الوحدة')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.وزن_التعبئة')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.الكمية')}</TableHead>
                                      <TableHead className={t("pages.orders-backup.name.text_center")}>{t('pages.orders-backup.العمليات')}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.productionOrders.map(
                                      (productionOrder: any) => {
                                        const product = customerProducts.find(
                                          (p: any) =>
                                            p.id ===
                                            productionOrder.customer_product_id,
                                        );

                                        // دالة لتحديد لون الدائرة حسب الماستر باتش
                                        const getColorCircle = (
                                          masterBatch: string,
                                        ) => {
                                          if (!masterBatch)
                                            return (
                                              <span className={t("pages.orders-backup.name.text_xs")}>{t('pages.orders-backup.غير_محدد')}</span>
                                            );

                                          const colorInfo =
                                            masterBatchColors.find(
                                              (c) =>{t('pages.orders-backup.c.id_===_masterbatch,_);_const_color_=_colorinfo?.color_||_"#808080";_const_bordercolor_=_color_===_"#ffffff"_?_"#cccccc"_:_color;_const_arabicname_=_colorinfo?.name_ar_||_masterbatch;_return_(')}<div className={t("pages.orders-backup.name.flex_items_center_justify_center_gap_2")}>
                                              <div
                                                className={t("pages.orders-backup.name.w_4_h_4_rounded_full_border_2")}
                                                style={{
                                                  backgroundColor: color,
                                                  borderColor: borderColor,
                                                }}
                                                title={arabicName}
                                              />
                                              <span className={t("pages.orders-backup.name.text_xs")}>
                                                {arabicName}
                                              </span>
                                            </div>
                                          );
                                        };

                                        return (
                                          <TableRow
                                            key={productionOrder.id}
                                            className={t("pages.orders-backup.name.hover_bg_gray_50")}
                                          >
                                            <TableCell className={t("pages.orders-backup.name.font_medium_text_center")}>
                                              <div className={t("pages.orders-backup.name.text_sm_font_mono")}>
                                                {productionOrder.production_order_number ||
                                                  "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.font_medium_text_sm")}>
                                                {(() => {
                                                  if (!product)
                                                    return "غير محدد";
                                                  // البحث عن اسم المنتج من جدول items
                                                  const item = items.find(
                                                    (item: any) =>
                                                      item.id ===
                                                      product.item_id,
                                                  );
                                                  return (
                                                    item?.name_ar ||
                                                    item?.name ||
                                                    product?.size_caption ||
                                                    "غير محدد"
                                                  );
                                                })()}
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.text_sm_font_mono")}>
                                                {(() => {
                                                  if (!product)
                                                    return "غير محدد";
                                                  const parts = [];
                                                  if (product.width)
                                                    parts.push(
                                                      Math.round(
                                                        parseFloat(
                                                          product.width,
                                                        ),
                                                      ),
                                                    );
                                                  if (product.left_facing)
                                                    parts.push(
                                                      Math.round(
                                                        parseFloat(
                                                          product.left_facing,
                                                        ),
                                                      ),
                                                    );
                                                  if (product.right_facing)
                                                    parts.push(
                                                      Math.round(
                                                        parseFloat(
                                                          product.right_facing,
                                                        ),
                                                      ),
                                                    );
                                                  const dimensions =
                                                    parts.length > 0
                                                      ? parts.join("+")
                                                      : "";
                                                  const length =
                                                    product.cutting_length_cm ||
                                                    "51";
                                                  return dimensions
                                                    ? `${dimensions}X${length}`
                                                    : `X${length}`;
                                                })()}
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.text_sm_font_medium")}>
                                                {product?.printing_cylinder
                                                  ? `${product.printing_cylinder}`
                                                  : "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.text_sm_font_medium")}>
                                                {product?.raw_material ||
                                                  "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              {getColorCircle(
                                                product?.master_batch_id,
                                              )}
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.text_sm")}>
                                                {product?.punching ||
                                                  "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.text_sm_font_medium")}>
                                                {product?.cutting_unit ||
                                                  "كيلو"}
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.text_sm_font_medium")}>
                                                {product?.package_weight_kg
                                                  ? `${product.package_weight_kg} كغ`
                                                  : "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.text_sm_font_bold_text_blue_600")}>
                                                {productionOrder.quantity_kg} كغ
                                              </div>
                                            </TableCell>
                                            <TableCell className={t("pages.orders-backup.name.text_center")}>
                                              <div className={t("pages.orders-backup.name.flex_justify_center_space_x_1_space_x_reverse")}>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleEditProductionOrder(
                                                      productionOrder,
                                                    )
                                                  }
                                                  className={t("pages.orders-backup.name.h_8_w_8_p_0")}
                                                >
                                                  <Edit className={t("pages.orders-backup.name.h_4_w_4")} />
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    if (order)
                                                      handleViewOrder(order);
                                                  }}
                                                  className={t("pages.orders-backup.name.h_8_w_8_p_0")}
                                                >
                                                  <Eye className={t("pages.orders-backup.name.h_4_w_4")} />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      },
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* View Order Dialog */}
      <Dialog
        open={isViewOrderDialogOpen}
        onOpenChange={setIsViewOrderDialogOpen}
      >
        <DialogContent className={t("pages.orders-backup.name.max_w_6xl_max_h_90vh_overflow_y_auto")}>
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب {viewingOrder?.order_number}</DialogTitle>
            <DialogDescription>{t('pages.orders-backup.عرض_جميع_تفاصيل_الطلب_وأوامر_الإنتاج_المرتبطة_به')}</DialogDescription>
          </DialogHeader>

          {viewingOrder && (
            <div className={t("pages.orders-backup.name.space_y_6")}>
              {/* Order Information */}
              <div className={t("pages.orders-backup.name.grid_grid_cols_2_gap_6")}>
                <Card>
                  <CardHeader>
                    <CardTitle className={t("pages.orders-backup.name.text_lg")}>{t('pages.orders-backup.معلومات_الطلب')}</CardTitle>
                  </CardHeader>
                  <CardContent className={t("pages.orders-backup.name.space_y_3")}>
                    <div className={t("pages.orders-backup.name.flex_justify_between")}>
                      <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.رقم_الطلب:')}</span>
                      <span className={t("pages.orders-backup.name.text_blue_600_font_bold")}>
                        {viewingOrder.order_number}
                      </span>
                    </div>
                    <div className={t("pages.orders-backup.name.flex_justify_between")}>
                      <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.تاريخ_الإنشاء:')}</span>
                      <span>
                        {format(
                          new Date(viewingOrder.created_at),
                          "dd/MM/yyyy",
                        )}
                      </span>
                    </div>
                    <div className={t("pages.orders-backup.name.flex_justify_between")}>
                      <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.مدة_التسليم:')}</span>
                      <span>{viewingOrder.delivery_days} يوم</span>
                    </div>
                    <div className={t("pages.orders-backup.name.flex_justify_between")}>
                      <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.الحالة:')}</span>
                      <span>{getStatusBadge(viewingOrder.status)}</span>
                    </div>
                    <div className={t("pages.orders-backup.name.flex_justify_between")}>
                      <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.ملاحظات:')}</span>
                      <span>{viewingOrder.notes || "لا توجد ملاحظات"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className={t("pages.orders-backup.name.text_lg")}>{t('pages.orders-backup.معلومات_العميل')}</CardTitle>
                  </CardHeader>
                  <CardContent className={t("pages.orders-backup.name.space_y_3")}>
                    {(() => {
                      const customer = customers.find(
                        (c: any) =>{t('pages.orders-backup.c.id_===_viewingorder.customer_id,_);_return_customer_?_(')}<>
                          <div className={t("pages.orders-backup.name.flex_justify_between")}>
                            <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.اسم_العميل:')}</span>
                            <span className={t("pages.orders-backup.name.font_semibold")}>
                              {customer.name_ar || customer.name}
                            </span>
                          </div>
                          <div className={t("pages.orders-backup.name.flex_justify_between")}>
                            <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.رقم_العميل:')}</span>
                            <span>{customer.id}</span>
                          </div>
                          <div className={t("pages.orders-backup.name.flex_justify_between")}>
                            <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.الهاتف:')}</span>
                            <span>{customer.phone || "غير محدد"}</span>
                          </div>
                          <div className={t("pages.orders-backup.name.flex_justify_between")}>
                            <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.العنوان:')}</span>
                            <span>{customer.address || "غير محدد"}</span>
                          </div>
                        </>{t('pages.orders-backup.)_:_(')}<div className={t("pages.orders-backup.name.text_gray_500")}>{t('pages.orders-backup.معلومات_العميل_غير_متوفرة')}</div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Production Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className={t("pages.orders-backup.name.text_lg")}>{t('pages.orders-backup.أوامر_الإنتاج')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={t("pages.orders-backup.name.space_y_4")}>
                    {(() => {
                      const orderProductionOrders = productionOrders.filter(
                        (po: any) => po.order_id === viewingOrder.id,
                      );

                      if (orderProductionOrders.length === 0) {
                        return (
                          <div className={t("pages.orders-backup.name.text_center_py_8_text_gray_500")}>{t('pages.orders-backup.لا_توجد_أوامر_إنتاج_لهذا_الطلب')}</div>
                        );
                      }

                      return orderProductionOrders.map((po: any) => {
                        const product = customerProducts.find(
                          (p: any) =>{t('pages.orders-backup.p.id_===_po.customer_product_id,_);_return_(')}<Card
                            key={po.id}
                            className={t("pages.orders-backup.name.border_l_4_border_l_blue_500")}
                          >
                            <CardHeader>
                              <div className={t("pages.orders-backup.name.flex_justify_between_items_center")}>
                                <CardTitle className={t("pages.orders-backup.name.text_base")}>
                                  أمر إنتاج: {po.production_order_number}
                                </CardTitle>
                                <Badge>{getStatusBadge(po.status)}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {product ? (
                                <div className={t("pages.orders-backup.name.grid_grid_cols_1_md_grid_cols_3_gap_6")}>
                                  {/* Product Details */}
                                  <div>
                                    <h5 className={t("pages.orders-backup.name.font_semibold_text_gray_900_mb_2_border_b_pb_1")}>{t('pages.orders-backup.تفاصيل_المنتج')}</h5>
                                    <div className={t("pages.orders-backup.name.space_y_2_text_sm")}>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.اسم_المنتج:')}</span>{" "}
                                        {product.size_caption || "غير محدد"}
                                      </div>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.المادة_الخام:')}</span>{" "}
                                        {product.raw_material || "غير محدد"}
                                      </div>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.العرض:')}</span>{" "}
                                        {product.width || "غير محدد"} سم
                                      </div>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.السماكة:')}</span>{" "}
                                        {product.thickness || "غير محدد"}{" "}
                                        مايكرون
                                      </div>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.طول_القطع:')}</span>{" "}
                                        {product.cutting_length_cm ||
                                          "غير محدد"}{" "}
                                        سم
                                      </div>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.عدد_القطع_بالكيلو:')}</span>{" "}
                                        {product.pieces_per_kg || "غير محدد"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Product Specifications */}
                                  <div>
                                    <h5 className={t("pages.orders-backup.name.font_semibold_text_gray_900_mb_2_border_b_pb_1")}>{t('pages.orders-backup.المواصفات_الفنية')}</h5>
                                    <div className={t("pages.orders-backup.name.space_y_2_text_sm")}>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.التخريم:')}</span>{" "}
                                        {product.punching || "بدون تخريم"}
                                      </div>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.الماستر_باتش:')}</span>{" "}
                                        {getMasterBatchArabicName(
                                          product.master_batch_id,
                                        )}
                                      </div>
                                      {product.color && (
                                        <div>
                                          <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.اللون:')}</span>{" "}
                                          {product.color}
                                        </div>
                                      )}
                                      {product.bag_type && (
                                        <div>
                                          <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.نوع_الكيس:')}</span>{" "}
                                          {product.bag_type}
                                        </div>
                                      )}
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.الطباعة:')}</span>{" "}
                                        {product.print_colors
                                          ? `${product.print_colors} لون`
                                          : "بدون طباعة"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Production Details */}
                                  <div>
                                    <h5 className={t("pages.orders-backup.name.font_semibold_text_gray_900_mb_2_border_b_pb_1")}>{t('pages.orders-backup.تفاصيل_الإنتاج')}</h5>
                                    <div className={t("pages.orders-backup.name.space_y_2_text_sm")}>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.الكمية_المطلوبة:')}</span>{" "}
                                        <span className={t("pages.orders-backup.name.font_bold_text_blue_600")}>
                                          {po.quantity_kg} كيلو
                                        </span>
                                      </div>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.عدد_القطع_المتوقع:')}</span>{" "}
                                        {product.pieces_per_kg
                                          ? Math.round(
                                              parseFloat(po.quantity_kg) *
                                                parseFloat(
                                                  product.pieces_per_kg,
                                                ),
                                            ).toLocaleString()
                                          : "غير محسوب"}{" "}
                                        قطعة
                                      </div>
                                      <div>
                                        <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.تاريخ_الإنشاء:')}</span>{" "}
                                        {format(
                                          new Date(po.created_at),
                                          "dd/MM/yyyy",
                                        )}
                                      </div>
                                      {product.production_notes && (
                                        <div>
                                          <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.ملاحظات_الإنتاج:')}</span>{" "}
                                          {product.production_notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>{t('pages.orders-backup.)_:_(')}<div className={t("pages.orders-backup.name.text_red_500")}>
                                  خطأ: معلومات المنتج غير متوفرة (رقم المنتج:{" "}
                                  {po.customer_product_id})
                                </div>
                              )}

                              {product?.additional_notes && (
                                <div className={t("pages.orders-backup.name.mt_4_p_3_bg_gray_50_rounded_lg_border_l_4_border_l_amber_400")}>
                                  <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.ملاحظات_إضافية:')}</span>
                                  <p className={t("pages.orders-backup.name.mt_1_text_sm_text_gray_700")}>
                                    {product.additional_notes}
                                  </p>
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
                  <CardTitle className={t("pages.orders-backup.name.text_lg")}>{t('pages.orders-backup.معلومات_المستخدم')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const user = users.find(
                      (u: any) =>{t('pages.orders-backup.u.id_===_parseint(viewingorder.created_by),_);_return_user_?_(')}<div className={t("pages.orders-backup.name.grid_grid_cols_3_gap_4_text_sm")}>
                        <div>
                          <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.اسم_المستخدم:')}</span>{" "}
                          {user.username}
                        </div>
                        <div>
                          <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.الاسم:')}</span>{" "}
                          {user.display_name_ar || user.display_name}
                        </div>
                        <div>
                          <span className={t("pages.orders-backup.name.font_medium")}>{t('pages.orders-backup.تاريخ_إنشاء_الطلب:')}</span>{" "}
                          {format(
                            new Date(viewingOrder.created_at),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </div>
                      </div>{t('pages.orders-backup.)_:_(')}<div className={t("pages.orders-backup.name.text_gray_500")}>{t('pages.orders-backup.معلومات_المستخدم_غير_متوفرة')}</div>
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
