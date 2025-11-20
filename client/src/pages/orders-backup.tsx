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
import PageLayout from "../components/layout/PageLayout";
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
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingProductionOrder, setEditingProductionOrder] =
    useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [productionOrdersInForm, setProductionOrdersInForm] = useState<any[]>(
    [],
  );
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [quantityPreviews, setQuantityPreviews] = useState<{
    [key: number]: any;
  }>({});

  // Enhanced filtering states
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
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
    (customer: any) =>
      customer.name_ar
        ?.toLowerCase()
        .includes(customerSearchTerm.toLowerCase()) ||
      customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()),
  );

  const productionOrderForm = useForm<{
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
          prodOrder.quantity_kg > 0,
      );

      console.log("إنشاء أوامر الإنتاج...", validProductionOrders.length);
      const createdProductionOrders = [];
      const failedProductionOrders = [];

      for (let i = 0; i < validProductionOrders.length; i++) {
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
              <h3>معلومات الطلب</h3>
              <p><strong>رقم الطلب:</strong> ${order.order_number}</p>
              <p><strong>تاريخ الإنشاء:</strong> ${format(new Date(order.created_at), "dd/MM/yyyy")}</p>
              <p><strong>مدة التسليم:</strong> ${order.delivery_days} يوم</p>
              <p><strong>الحالة:</strong> ${order.status}</p>
              <p><strong>ملاحظات:</strong> ${order.notes || "لا توجد ملاحظات"}</p>
            </div>
            
            <div class="info-box">
              <h3>معلومات العميل</h3>
              <p><strong>اسم العميل:</strong> ${customer?.name_ar || customer?.name}</p>
              <p><strong>رقم العميل:</strong> ${customer?.id}</p>
              <p><strong>الهاتف:</strong> ${customer?.phone || "غير محدد"}</p>
              <p><strong>العنوان:</strong> ${customer?.address || "غير محدد"}</p>
            </div>
          </div>
          
          
          <div class="production-orders">
            <h3>أوامر الإنتاج</h3>
            ${orderProductionOrders
              .map((po: any) => {
                const product = customerProducts.find(
                  (p: any) => p.id === po.customer_product_id,
                );
                return `
                <div class="production-order-card">
                  <h4>أمر إنتاج: ${po.production_order_number}</h4>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div class="product-details">
                      <h5>تفاصيل المنتج:</h5>
                      <p><strong>اسم المنتج:</strong> ${product?.size_caption || "غير محدد"}</p>
                      <p><strong>المادة الخام:</strong> ${product?.raw_material || "غير محدد"}</p>
                      <p><strong>العرض:</strong> ${product?.width || "غير محدد"} سم</p>
                      <p><strong>السماكة:</strong> ${product?.thickness || "غير محدد"} مايكرون</p>
                      <p><strong>طول القطع:</strong> ${product?.cutting_length_cm || "غير محدد"} سم</p>
                      <p><strong>عدد القطع بالكيلو:</strong> ${product?.pieces_per_kg || "غير محدد"}</p>
                    </div>
                    
                    <div class="product-specs">
                      <h5>المواصفات الفنية:</h5>
                      <p><strong>التخريم:</strong> ${product?.punching || "بدون تخريم"}</p>
                      <p><strong>الماستر باتش:</strong> ${product?.master_batch_id || "غير محدد"}</p>
                      ${product?.color ? `<p><strong>اللون:</strong> ${product.color}</p>` : ""}
                      ${product?.bag_type ? `<p><strong>نوع الكيس:</strong> ${product.bag_type}</p>` : ""}
                      <p><strong>الطباعة:</strong> ${product?.print_colors ? `${product.print_colors} لون` : "بدون طباعة"}</p>
                      <p><strong>فئة المنتج:</strong> ${(() => {
                        const category = categories.find(
                          (c: any) => c.id === product?.category_id,
                        );
                        return (
                          category?.name_ar || category?.name || "غير محدد"
                        );
                      })()}</p>
                    </div>
                    
                    <div class="production-details">
                      <h5>تفاصيل الإنتاج:</h5>
                      <p><strong>الكمية المطلوبة:</strong> ${po.quantity_kg} كيلو</p>
                      <p><strong>عدد القطع المتوقع:</strong> ${product?.pieces_per_kg ? Math.round(parseFloat(po.quantity_kg) * parseFloat(product.pieces_per_kg)) : "غير محسوب"} قطعة</p>
                      <p><strong>حالة الإنتاج:</strong> ${po.status === "pending" ? "في الانتظار" : po.status === "in_progress" ? "قيد التنفيذ" : po.status === "completed" ? "مكتمل" : "ملغي"}</p>
                      <p><strong>تاريخ الإنشاء:</strong> ${format(new Date(po.created_at), "dd/MM/yyyy")}</p>
                      <p><strong>ملاحظات الإنتاج:</strong> ${product?.production_notes || "لا توجد"}</p>
                    </div>
                  </div>
                  
                  ${
                    product?.additional_notes
                      ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                      <p><strong>ملاحظات إضافية:</strong> ${product.additional_notes}</p>
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
            <h3>معلومات المستخدم</h3>
            <p><strong>اسم المستخدم:</strong> ${user?.username}</p>
            <p><strong>رقم المستخدم:</strong> ${user?.id}</p>
            <p><strong>تاريخ إنشاء الطلب:</strong> ${format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}</p>
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
    <PageLayout title="إدارة الطلبات والإنتاج" description="متابعة وإدارة طلبات العملاء وأوامر الإنتاج">
      {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
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
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredOrders.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statusFilter === "all"
                    ? `من أصل ${orders.length} طلب`
                    : `من أصل ${orders.length} طلب إجمالي`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  أوامر الإنتاج
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productionOrders.length}
                </div>
                <p className="text-xs text-muted-foreground">أمر إنتاج</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  قيد التنفيذ
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    productionOrders.filter(
                      (po: any) => po.status === "in_progress",
                    ).length
                  }
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
                  {
                    productionOrders.filter(
                      (po: any) => po.status === "completed",
                    ).length
                  }
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
                      <Select
                        value={statusFilter || ""}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="فلترة حسب الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الطلبات</SelectItem>
                          <SelectItem value="waiting">انتظار</SelectItem>
                          <SelectItem value="in_production">قيد الإنتاج</SelectItem>
                          <SelectItem value="paused">معلق</SelectItem>
                          <SelectItem value="completed">مكتمل</SelectItem>
                          <SelectItem value="received">مستلم</SelectItem>
                          <SelectItem value="delivered">تم التوصيل</SelectItem>
                        </SelectContent>
                      </Select>
                      <Dialog
                        open={isOrderDialogOpen}
                        onOpenChange={setIsOrderDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button onClick={handleAddOrder}>
                            <Plus className="h-4 w-4 mr-2" />
                            إضافة طلب
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>إضافة طلب جديد</DialogTitle>
                            <DialogDescription>
                              إضافة طلب جديد مع أوامر الإنتاج والمواصفات
                              المطلوبة
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...orderForm}>
                            <form
                              onSubmit={orderForm.handleSubmit(onOrderSubmit)}
                              className="space-y-6"
                            >
                              {/* Order Info Section */}
                              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    رقم الطلب
                                  </label>
                                  <div className="text-lg font-bold text-blue-600">
                                    سيتم توليده تلقائياً
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">
                                    التاريخ
                                  </label>
                                  <div className="text-lg font-bold text-gray-900">
                                    {format(new Date(), "dd/MM/yyyy")}
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
                                          onChange={(e) =>
                                            setCustomerSearchTerm(
                                              e.target.value,
                                            )
                                          }
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
                                        value={field.value || ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="اختر العميل" />
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
                              <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold">
                                    أوامر الإنتاج
                                  </h3>
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
                                  {productionOrdersInForm.map(
                                    (prodOrder, index) => (
                                      <div
                                        key={index}
                                        className="p-4 border rounded-lg bg-gray-50"
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="font-medium">
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
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                          <div className="col-span-1">
                                            <label className="text-sm font-medium text-gray-700">
                                              منتج العميل
                                            </label>
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
                                              <SelectTrigger className="h-auto min-h-[60px] w-full">
                                                <SelectValue placeholder="اختر المنتج">
                                                  {prodOrder.customer_product_id &&
                                                    filteredCustomerProducts.find(
                                                      (p: any) =>
                                                        p.id ===
                                                        prodOrder.customer_product_id,
                                                    ) && (
                                                      <div className="text-right w-full py-2">
                                                        <div className="font-medium text-gray-900 text-sm leading-relaxed mb-1">
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
                                                        <div className="text-xs text-gray-600 space-y-0.5">
                                                          {(() => {
                                                            const product =
                                                              filteredCustomerProducts.find(
                                                                (p: any) =>
                                                                  p.id ===
                                                                  prodOrder.customer_product_id,
                                                              );
                                                            if (!product)
                                                              return null;

                                                            return (
                                                              <div className="grid grid-cols-1 gap-0.5">
                                                                {product.thickness && (
                                                                  <div>
                                                                    <span className="font-medium text-gray-700">
                                                                      السماكة:
                                                                    </span>{" "}
                                                                    <span className="text-blue-600 font-medium">
                                                                      {
                                                                        product.thickness
                                                                      }{" "}
                                                                      ميكرون
                                                                    </span>
                                                                  </div>
                                                                )}
                                                                {product.master_batch_id && (
                                                                  <div className="flex items-center gap-1">
                                                                    <span className="font-medium text-gray-700">
                                                                      الماستر
                                                                      باتش:
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                      <div
                                                                        className="w-3 h-3 rounded-full border"
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
                                                                      <span className="text-purple-600 font-medium">
                                                                        {getMasterBatchArabicName(
                                                                          product.master_batch_id,
                                                                        )}
                                                                      </span>
                                                                    </div>
                                                                  </div>
                                                                )}
                                                                {product.raw_material && (
                                                                  <div>
                                                                    <span className="font-medium text-gray-700">
                                                                      المادة:
                                                                    </span>{" "}
                                                                    <span className="text-green-600 font-medium">
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
                                              <SelectContent className="max-w-[800px] w-[800px]">
                                                {filteredCustomerProducts.map(
                                                  (product: any) => (
                                                    <SelectItem
                                                      key={product.id}
                                                      value={product.id.toString()}
                                                      className="h-auto min-h-[80px] py-3"
                                                    >
                                                      <div className="w-full text-right py-2 min-w-[700px]">
                                                        <div className="font-semibold text-gray-900 mb-2 text-base leading-relaxed">
                                                          {(() => {
                                                            const item =
                                                              items.find(
                                                                (item: any) =>
                                                                  item.id ===
                                                                  product.item_id,
                                                              );

                                                            return (
                                                              <>
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

                                                        <div className="grid grid-cols-2 gap-6 text-sm text-gray-600">
                                                          <div className="space-y-2">
                                                            {product.thickness && (
                                                              <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-700">
                                                                  السماكة:
                                                                </span>
                                                                <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                                                                  {
                                                                    product.thickness
                                                                  }{" "}
                                                                  ميكرون
                                                                </span>
                                                              </div>
                                                            )}
                                                            {product.master_batch_id && (
                                                              <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-700">
                                                                  الماستر باتش:
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                  <div
                                                                    className="w-4 h-4 rounded-full border-2"
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
                                                                  <span className="text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded">
                                                                    {getMasterBatchArabicName(
                                                                      product.master_batch_id,
                                                                    )}
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            )}
                                                            {product.raw_material && (
                                                              <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-700">
                                                                  المادة الخام:
                                                                </span>
                                                                <span className="text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">
                                                                  {
                                                                    product.raw_material
                                                                  }
                                                                </span>
                                                              </div>
                                                            )}
                                                          </div>
                                                          <div className="space-y-2">
                                                            {product.width && (
                                                              <div>
                                                                <span className="font-medium text-gray-700">
                                                                  العرض:
                                                                </span>{" "}
                                                                <span className="text-orange-600 font-medium">
                                                                  {
                                                                    product.width
                                                                  }{" "}
                                                                  سم
                                                                </span>
                                                              </div>
                                                            )}
                                                            {product.punching && (
                                                              <div>
                                                                <span className="font-medium text-gray-700">
                                                                  التخريم:
                                                                </span>{" "}
                                                                <span className="text-teal-600 font-medium">
                                                                  {
                                                                    product.punching
                                                                  }
                                                                </span>
                                                              </div>
                                                            )}
                                                            {product.cutting_unit && (
                                                              <div>
                                                                <span className="font-medium text-gray-700">
                                                                  وحدة القطع:
                                                                </span>{" "}
                                                                <span className="text-indigo-600 font-medium">
                                                                  {
                                                                    product.cutting_unit
                                                                  }
                                                                </span>
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                        {product.notes && (
                                                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                                                            <span className="font-medium">
                                                              ملاحظات:
                                                            </span>{" "}
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

                                          <div className="grid grid-cols-1 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-gray-700">
                                                الكمية الأساسية (كيلو)
                                              </label>
                                              <Input
                                                type="number"
                                                placeholder="الكمية الأساسية"
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
                                                className="w-full"
                                                data-testid={`input-base-quantity-${index}`}
                                              />
                                              {quantityPreviews[index] && (
                                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                  <div className="text-sm text-blue-800 space-y-1">
                                                    <div className="flex justify-between">
                                                      <span>
                                                        الكمية الأساسية:
                                                      </span>
                                                      <span className="font-medium">
                                                        {
                                                          quantityPreviews[
                                                            index
                                                          ].quantity_kg
                                                        }{" "}
                                                        كغ
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span>نسبة الإضافة:</span>
                                                      <span className="font-medium text-orange-600">
                                                        {
                                                          quantityPreviews[
                                                            index
                                                          ].overrun_percentage
                                                        }
                                                        %
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-1">
                                                      <span className="font-semibold">
                                                        الكمية النهائية:
                                                      </span>
                                                      <span className="font-bold text-green-600">
                                                        {
                                                          quantityPreviews[
                                                            index
                                                          ].final_quantity_kg
                                                        }{" "}
                                                        كغ
                                                      </span>
                                                    </div>
                                                    <div className="text-xs text-blue-600 italic">
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
                                              <label className="text-sm font-medium text-gray-700">
                                                الحالة
                                              </label>
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
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="pending">
                                                    في الانتظار
                                                  </SelectItem>
                                                  <SelectItem value="in_progress">
                                                    قيد التنفيذ
                                                  </SelectItem>
                                                  <SelectItem value="completed">
                                                    مكتمل
                                                  </SelectItem>
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
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={orderForm.control}
                                  name="delivery_days"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        مدة التسليم (بالأيام)
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="number"
                                          placeholder="عدد الأيام"
                                        />
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
                                        <Textarea
                                          {...field}
                                          placeholder="ملاحظات إضافية"
                                          rows={1}
                                        />
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
                        <TableHead className="text-center">
                          تاريخ الإنشاء
                        </TableHead>
                        <TableHead className="text-center">المستخدم</TableHead>
                        <TableHead className="text-center">
                          مدة التسليم المتبقية
                        </TableHead>
                        <TableHead className="text-center">ملاحظات</TableHead>
                        <TableHead className="text-center">الحالة</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
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
                          (u: any) => u.id === parseInt(order.created_by),
                        );
                        // Calculate delivery time remaining
                        const createdDate = new Date(order.created_at);
                        const deliveryDate = new Date(createdDate);
                        deliveryDate.setDate(
                          deliveryDate.getDate() + order.delivery_days,
                        );
                        const today = new Date();
                        const daysRemaining = Math.ceil(
                          (deliveryDate.getTime() - today.getTime()) /
                            (1000 * 60 * 60 * 24),
                        );

                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.order_number}
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                <div className="font-medium">
                                  {customer?.name_ar || customer?.name}
                                </div>
                                <div className="text-sm text-gray-500">
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
                              <div className="text-right">
                                <div className="font-medium">
                                  {user?.username}
                                </div>
                                <div className="text-sm text-gray-500">
                                  #{user?.id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                <div className="font-medium">
                                  {daysRemaining > 0 ? (
                                    <span className="text-green-600">
                                      {daysRemaining} يوم متبقي
                                    </span>
                                  ) : daysRemaining === 0 ? (
                                    <span className="text-orange-600">
                                      يجب التسليم اليوم
                                    </span>
                                  ) : (
                                    <span className="text-red-600">
                                      متأخر {Math.abs(daysRemaining)} يوم
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  التسليم: {format(deliveryDate, "dd/MM/yyyy")}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{order.notes || "-"}</TableCell>
                            <TableCell className="text-center">
                              {getStatusBadge(order.status || "pending")}
                            </TableCell>
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
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-48"
                                  >
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          order,
                                          "for_production",
                                        )
                                      }
                                    >
                                      <div className="flex items-center w-full">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                        إلى الإنتاج
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(order, "on_hold")
                                      }
                                    >
                                      <div className="flex items-center w-full">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                        إيقاف مؤقت
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(order, "pending")
                                      }
                                    >
                                      <div className="flex items-center w-full">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                                        في الانتظار
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(order, "completed")
                                      }
                                    >
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
                  <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <CardTitle>أوامر الإنتاج</CardTitle>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="البحث في أوامر الإنتاج..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pr-10"
                        />
                      </div>
                      <Dialog
                        open={isProductionOrderDialogOpen}
                        onOpenChange={setIsProductionOrderDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button onClick={() => handleAddProductionOrder()}>
                            <Plus className="h-4 w-4 mr-2" />
                            إضافة أمر إنتاج
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                              className="space-y-4"
                            >
                              <FormField
                                control={productionOrderForm.control}
                                name="order_id"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>الطلب</FormLabel>
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
                                          <SelectValue placeholder="اختر الطلب" />
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
                                name="production_order_number"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>رقم أمر الإنتاج</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="رقم أمر الإنتاج"
                                      />
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
                                    <Select
                                      onValueChange={(value) =>
                                        field.onChange(parseInt(value))
                                      }
                                      value={
                                        field.value ? String(field.value) : ""
                                      }
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-auto min-h-[40px]">
                                          <SelectValue placeholder="اختر المنتج" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="max-w-[700px]">
                                        {customerProducts.map(
                                          (product: any) => (
                                            <SelectItem
                                              key={product.id}
                                              value={product.id.toString()}
                                            >
                                              <div className="w-full text-right py-2">
                                                <div className="font-semibold text-gray-900 mb-1">
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
                                                      baseName =
                                                        "منتج غير محدد";
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
                                                <div className="text-sm text-gray-600 space-y-1">
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

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={productionOrderForm.control}
                                  name="quantity_kg"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>الكمية (كيلو)</FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          type="number"
                                          step="0.01"
                                          placeholder="الكمية بالكيلو"
                                          className="w-full"
                                        />
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
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value || ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="اختر الحالة" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="pending">
                                            في الانتظار
                                          </SelectItem>
                                          <SelectItem value="in_progress">
                                            قيد التنفيذ
                                          </SelectItem>
                                          <SelectItem value="completed">
                                            مكتمل
                                          </SelectItem>
                                          <SelectItem value="cancelled">
                                            ملغي
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="flex justify-end space-x-2 space-x-reverse">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    setIsProductionOrderDialogOpen(false)
                                  }
                                >
                                  إلغاء
                                </Button>
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
                        <div className="text-center py-8 text-gray-500">
                          لا توجد أوامر إنتاج
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {orderedGroups.map((orderKey) => {
                          const group = groupedProductionOrders[orderKey];
                          const order = group.order;
                          const customer = customers.find(
                            (c: any) => order && c.id === order.customer_id,
                          );

                          return (
                            <div
                              key={orderKey}
                              className="border-2 border-gray-200 rounded-lg overflow-hidden"
                            >
                              {/* Order Header */}
                              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold text-gray-900">
                                      طلب رقم: {orderKey}
                                    </h3>
                                    <span className="text-sm text-gray-600">
                                      العميل:{" "}
                                      {customer?.name_ar ||
                                        customer?.name ||
                                        "غير محدد"}
                                    </span>
                                    {order && (
                                      <span className="text-sm text-gray-600">
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
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-25">
                                      <TableHead className="text-center min-w-[120px]">
                                        رقم أمر الإنتاج
                                      </TableHead>
                                      <TableHead className="text-center min-w-[150px]">
                                        اسم الصنف
                                      </TableHead>
                                      <TableHead className="text-center min-w-[120px]">
                                        وصف المقاس
                                      </TableHead>
                                      <TableHead className="text-center">
                                        الطباعة
                                      </TableHead>
                                      <TableHead className="text-center">
                                        المادة الخام
                                      </TableHead>
                                      <TableHead className="text-center">
                                        الماستر باتش
                                      </TableHead>
                                      <TableHead className="text-center">
                                        التخريم
                                      </TableHead>
                                      <TableHead className="text-center">
                                        الوحدة
                                      </TableHead>
                                      <TableHead className="text-center">
                                        وزن التعبئة
                                      </TableHead>
                                      <TableHead className="text-center">
                                        الكمية
                                      </TableHead>
                                      <TableHead className="text-center">
                                        العمليات
                                      </TableHead>
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
                                              <span className="text-xs">
                                                غير محدد
                                              </span>
                                            );

                                          const colorInfo =
                                            masterBatchColors.find(
                                              (c) => c.id === masterBatch,
                                            );
                                          const color =
                                            colorInfo?.color || "#808080";
                                          const borderColor =
                                            color === "#FFFFFF"
                                              ? "#CCCCCC"
                                              : color;
                                          const arabicName =
                                            colorInfo?.name_ar || masterBatch;

                                          return (
                                            <div className="flex items-center justify-center gap-2">
                                              <div
                                                className="w-4 h-4 rounded-full border-2"
                                                style={{
                                                  backgroundColor: color,
                                                  borderColor: borderColor,
                                                }}
                                                title={arabicName}
                                              />
                                              <span className="text-xs">
                                                {arabicName}
                                              </span>
                                            </div>
                                          );
                                        };

                                        return (
                                          <TableRow
                                            key={productionOrder.id}
                                            className="hover:bg-gray-50"
                                          >
                                            <TableCell className="font-medium text-center">
                                              <div className="text-sm font-mono">
                                                {productionOrder.production_order_number ||
                                                  "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="font-medium text-sm">
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
                                            <TableCell className="text-center">
                                              <div className="text-sm font-mono">
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
                                            <TableCell className="text-center">
                                              <div className="text-sm font-medium">
                                                {product?.printing_cylinder
                                                  ? `${product.printing_cylinder}`
                                                  : "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="text-sm font-medium">
                                                {product?.raw_material ||
                                                  "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              {getColorCircle(
                                                product?.master_batch_id,
                                              )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="text-sm">
                                                {product?.punching ||
                                                  "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="text-sm font-medium">
                                                {product?.cutting_unit ||
                                                  "كيلو"}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="text-sm font-medium">
                                                {product?.package_weight_kg
                                                  ? `${product.package_weight_kg} كغ`
                                                  : "غير محدد"}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="text-sm font-bold text-blue-600">
                                                {productionOrder.quantity_kg} كغ
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="flex justify-center space-x-1 space-x-reverse">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleEditProductionOrder(
                                                      productionOrder,
                                                    )
                                                  }
                                                  className="h-8 w-8 p-0"
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    if (order)
                                                      handleViewOrder(order);
                                                  }}
                                                  className="h-8 w-8 p-0"
                                                >
                                                  <Eye className="h-4 w-4" />
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

      {/* View Order Dialog */}
      <Dialog
        open={isViewOrderDialogOpen}
        onOpenChange={setIsViewOrderDialogOpen}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب {viewingOrder?.order_number}</DialogTitle>
            <DialogDescription>
              عرض جميع تفاصيل الطلب وأوامر الإنتاج المرتبطة به
            </DialogDescription>
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
                      <span className="text-blue-600 font-bold">
                        {viewingOrder.order_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">تاريخ الإنشاء:</span>
                      <span>
                        {format(
                          new Date(viewingOrder.created_at),
                          "dd/MM/yyyy",
                        )}
                      </span>
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
                      <span>{viewingOrder.notes || "لا توجد ملاحظات"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات العميل</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(() => {
                      const customer = customers.find(
                        (c: any) => c.id === viewingOrder.customer_id,
                      );
                      return customer ? (
                        <>
                          <div className="flex justify-between">
                            <span className="font-medium">اسم العميل:</span>
                            <span className="font-semibold">
                              {customer.name_ar || customer.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">رقم العميل:</span>
                            <span>{customer.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">الهاتف:</span>
                            <span>{customer.phone || "غير محدد"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">العنوان:</span>
                            <span>{customer.address || "غير محدد"}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">
                          معلومات العميل غير متوفرة
                        </div>
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
                      const orderProductionOrders = productionOrders.filter(
                        (po: any) => po.order_id === viewingOrder.id,
                      );

                      if (orderProductionOrders.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            لا توجد أوامر إنتاج لهذا الطلب
                          </div>
                        );
                      }

                      return orderProductionOrders.map((po: any) => {
                        const product = customerProducts.find(
                          (p: any) => p.id === po.customer_product_id,
                        );

                        return (
                          <Card
                            key={po.id}
                            className="border-l-4 border-l-blue-500"
                          >
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-base">
                                  أمر إنتاج: {po.production_order_number}
                                </CardTitle>
                                <Badge>{getStatusBadge(po.status)}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {product ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Product Details */}
                                  <div>
                                    <h5 className="font-semibold text-gray-900 mb-2 border-b pb-1">
                                      تفاصيل المنتج
                                    </h5>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          اسم المنتج:
                                        </span>{" "}
                                        {product.size_caption || "غير محدد"}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          المادة الخام:
                                        </span>{" "}
                                        {product.raw_material || "غير محدد"}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          العرض:
                                        </span>{" "}
                                        {product.width || "غير محدد"} سم
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          السماكة:
                                        </span>{" "}
                                        {product.thickness || "غير محدد"}{" "}
                                        مايكرون
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          طول القطع:
                                        </span>{" "}
                                        {product.cutting_length_cm ||
                                          "غير محدد"}{" "}
                                        سم
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          عدد القطع بالكيلو:
                                        </span>{" "}
                                        {product.pieces_per_kg || "غير محدد"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Product Specifications */}
                                  <div>
                                    <h5 className="font-semibold text-gray-900 mb-2 border-b pb-1">
                                      المواصفات الفنية
                                    </h5>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          التخريم:
                                        </span>{" "}
                                        {product.punching || "بدون تخريم"}
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          الماستر باتش:
                                        </span>{" "}
                                        {getMasterBatchArabicName(
                                          product.master_batch_id,
                                        )}
                                      </div>
                                      {product.color && (
                                        <div>
                                          <span className="font-medium">
                                            اللون:
                                          </span>{" "}
                                          {product.color}
                                        </div>
                                      )}
                                      {product.bag_type && (
                                        <div>
                                          <span className="font-medium">
                                            نوع الكيس:
                                          </span>{" "}
                                          {product.bag_type}
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-medium">
                                          الطباعة:
                                        </span>{" "}
                                        {product.print_colors
                                          ? `${product.print_colors} لون`
                                          : "بدون طباعة"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Production Details */}
                                  <div>
                                    <h5 className="font-semibold text-gray-900 mb-2 border-b pb-1">
                                      تفاصيل الإنتاج
                                    </h5>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <span className="font-medium">
                                          الكمية المطلوبة:
                                        </span>{" "}
                                        <span className="font-bold text-blue-600">
                                          {po.quantity_kg} كيلو
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium">
                                          عدد القطع المتوقع:
                                        </span>{" "}
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
                                        <span className="font-medium">
                                          تاريخ الإنشاء:
                                        </span>{" "}
                                        {format(
                                          new Date(po.created_at),
                                          "dd/MM/yyyy",
                                        )}
                                      </div>
                                      {product.production_notes && (
                                        <div>
                                          <span className="font-medium">
                                            ملاحظات الإنتاج:
                                          </span>{" "}
                                          {product.production_notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-red-500">
                                  خطأ: معلومات المنتج غير متوفرة (رقم المنتج:{" "}
                                  {po.customer_product_id})
                                </div>
                              )}

                              {product?.additional_notes && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-l-amber-400">
                                  <span className="font-medium">
                                    ملاحظات إضافية:
                                  </span>
                                  <p className="mt-1 text-sm text-gray-700">
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
                  <CardTitle className="text-lg">معلومات المستخدم</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const user = users.find(
                      (u: any) => u.id === parseInt(viewingOrder.created_by),
                    );
                    return user ? (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">اسم المستخدم:</span>{" "}
                          {user.username}
                        </div>
                        <div>
                          <span className="font-medium">الاسم:</span>{" "}
                          {user.display_name_ar || user.display_name}
                        </div>
                        <div>
                          <span className="font-medium">
                            تاريخ إنشاء الطلب:
                          </span>{" "}
                          {format(
                            new Date(viewingOrder.created_at),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        معلومات المستخدم غير متوفرة
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
