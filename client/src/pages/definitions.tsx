import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import {
  Building2,
  Users,
  Cog,
  Package,
  Plus,
  Edit,
  Trash2,
  Printer,
  Search,
  Filter,
  MapPin,
  Settings,
  User,
  Copy,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatNumber } from "../lib/formatNumber";

export default function Definitions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Remove aggressive cache clearing that causes unnecessary refetches
  // React Query's default staleTime and gcTime will handle cache freshness automatically

  const [selectedTab, setSelectedTab] = useState("customers");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickSearch, setQuickSearch] = useState("");

  // Reset search and filters when changing tabs
  useEffect(() => {
    setQuickSearch("");
    setStatusFilter("all");
  }, [selectedTab]);

  // Pagination states for each tab
  const [currentPages, setCurrentPages] = useState({
    customers: 1,
    categories: 1,
    sections: 1,
    items: 1,
    customerProducts: 1,
    locations: 1,
    machines: 1,
    users: 1,
  });
  const itemsPerPage = 25;

  // Helper function to paginate data
  const paginateData = (data: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Helper function to get total pages
  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  // Helper function to update page for specific tab
  const updatePage = (tab: string, page: number) => {
    setCurrentPages((prev) => ({
      ...prev,
      [tab]: page,
    }));
  };

  // Drawer code separate states
  const [drawerLetter, setDrawerLetter] = useState("");
  const [drawerNumber, setDrawerNumber] = useState("");

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: "",
    name_ar: "",
    code: "",
    user_id: "",
    plate_drawer_code: "",
    city: "",
    address: "",
    tax_number: "",
    phone: "",
    sales_rep_id: "",
  });
  const [sectionForm, setSectionForm] = useState({
    name: "",
    name_ar: "",
    description: "",
  });
  const [itemForm, setItemForm] = useState({
    name: "",
    name_ar: "",
    code: "",
    category_id: "none",
    status: "active",
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    name_ar: "",
    code: "",
    parent_id: "none",
    description: "",
    status: "active",
  });
  const [customerProductForm, setCustomerProductForm] = useState({
    customer_id: "none",
    category_id: "none",
    item_id: "none",
    size_caption: "",
    width: "",
    left_facing: "",
    right_facing: "",
    thickness: "",
    printing_cylinder: "بدون طباعة",
    cutting_length_cm: "",
    raw_material: "",
    master_batch_id: "",
    is_printed: false,
    cutting_unit: "",
    punching: "",
    unit_weight_kg: "",
    unit_quantity: "",
    package_weight_kg: "",
    cliche_front_design: "",
    cliche_back_design: "",
    front_design_filename: "",
    back_design_filename: "",
    notes: "",
    status: "active",
  });
  const [locationForm, setLocationForm] = useState({
    name: "",
    name_ar: "",
    type: "city",
    parent_id: "",
    coordinates: "",
    status: "active",
  });
  const [machineForm, setMachineForm] = useState({
    name: "",
    name_ar: "",
    type: "extruder",
    section_id: "none",
    status: "active",
    capacity_small_kg_per_hour: "",
    capacity_medium_kg_per_hour: "",
    capacity_large_kg_per_hour: "",
  });
  const [userForm, setUserForm] = useState({
    username: "",
    display_name: "",
    display_name_ar: "",
    password: "",
    role_id: "none",
    section_id: "none",
    status: "active",
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Search term for customer selection in customer products form
  const [customerSearchTermInProducts, setCustomerSearchTermInProducts] = useState("");

  // Master Batch Colors (24 من الكتالوج)
  const masterBatchColors = [
    {
      id: "PT-111111",
      name: "White",
      name_ar: "أبيض",
      color: "#FFFFFF",
      textColor: "#000000",
    },
    {
      id: "PT-000000",
      name: "Black",
      name_ar: "أسود",
      color: "#000000",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-160060",
      name: "Terracotta",
      name_ar: "تيراكوتا",
      color: "#CC4E3A",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-160061",
      name: "Coffee Brown",
      name_ar: "بني قهوة",
      color: "#4B2E2B",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-160055",
      name: "Chocolate",
      name_ar: "بني شوكولا",
      color: "#7B3F00",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-102004",
      name: "Dark Silver",
      name_ar: "فضي داكن",
      color: "#6E6E6E",
      textColor: "#000000",
    },
    {
      id: "PT-101008",
      name: "Gold",
      name_ar: "ذهبي",
      color: "#D4AF37",
      textColor: "#000000",
    },
    {
      id: "PT-150245",
      name: "Pistachio Green",
      name_ar: "أخضر فستقي",
      color: "#93C572",
      textColor: "#000000",
    },
    {
      id: "PT-150086",
      name: "Light Green",
      name_ar: "أخضر فاتح",
      color: "#90EE90",
      textColor: "#000000",
    },
    {
      id: "PT-170028",
      name: "Light Grey",
      name_ar: "رمادي فاتح",
      color: "#B0B0B0",
      textColor: "#000000",
    },
    {
      id: "PT-180361",
      name: "Dark Pink",
      name_ar: "وردي داكن",
      color: "#D81B60",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-180374",
      name: "Pastel Pink",
      name_ar: "وردي باستيل",
      color: "#FFB6C1",
      textColor: "#000000",
    },
    {
      id: "PT-180375",
      name: "Baby Pink",
      name_ar: "وردي فاتح",
      color: "#F4C2C2",
      textColor: "#000000",
    },
    {
      id: "PT-140079",
      name: "Light Blue",
      name_ar: "أزرق فاتح",
      color: "#66B2FF",
      textColor: "#000000",
    },
    {
      id: "PT-140340",
      name: "Dark Blue",
      name_ar: "أزرق داكن",
      color: "#0033A0",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-140352",
      name: "Pure Blue",
      name_ar: "أزرق صافي",
      color: "#0057FF",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-140080",
      name: "African Violet",
      name_ar: "بنفسجي أفريقي",
      color: "#B284BE",
      textColor: "#000000",
    },
    {
      id: "PT-140114",
      name: "Royal Purple",
      name_ar: "بنفسجي ملكي",
      color: "#613399",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-120074",
      name: "Dark Ivory",
      name_ar: "عاجي داكن",
      color: "#E2DCC8",
      textColor: "#000000",
    },
    {
      id: "PT-130232-A",
      name: "Sunflower Yellow",
      name_ar: "أصفر دوار الشمس",
      color: "#FFDA03",
      textColor: "#000000",
    },
    {
      id: "PT-130112",
      name: "Lemon Yellow",
      name_ar: "أصفر ليموني",
      color: "#FFF44F",
      textColor: "#000000",
    },
    {
      id: "PT-130231",
      name: "Yellow",
      name_ar: "أصفر",
      color: "#FFD000",
      textColor: "#000000",
    },
    {
      id: "PT-130232-B",
      name: "Golden Yellow",
      name_ar: "أصفر ذهبي",
      color: "#FFC000",
      textColor: "#000000",
    },
    {
      id: "PT-180370",
      name: "Orange",
      name_ar: "برتقالي 805",
      color: "#FF7A00",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-180363",
      name: "Orange",
      name_ar: "برتقالي 801",
      color: "#FF5A1F",
      textColor: "#FFFFFF",
    },
    {
      id: "PT-180122",
      name: "Tomato Red",
      name_ar: "أحمر طماطمي",
      color: "#E53935",
      textColor: "#FFFFFF",
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

  // Generate printing cylinder options
  const printingCylinderOptions = [
    { value: "بدون طباعة", label: "بدون طباعة" },
    ...Array.from({ length: 16 }, (_, i) => {
      const size = (i + 1) * 2 + 6; // 8, 10, 12, ..., 38
      return { value: `${size}"`, label: `${size}"` };
    }),
    { value: '39"', label: '39"' },
  ];

  // Automatic calculations
  React.useEffect(() => {
    // Auto-calculate cutting length based on printing cylinder
    if (
      customerProductForm.printing_cylinder &&
      customerProductForm.printing_cylinder !== "بدون طباعة"
    ) {
      const cylinderNumber = parseInt(
        customerProductForm.printing_cylinder.replace(/\D/g, ""),
      );
      if (cylinderNumber) {
        const calculatedLength = Math.round(cylinderNumber * 2.54); // Convert inches to cm
        setCustomerProductForm((prev) => ({
          ...prev,
          cutting_length_cm: calculatedLength.toString(),
        }));
      }
    }
  }, [customerProductForm.printing_cylinder]);

  // Helper Functions
  const handleDeleteCustomerProduct = (product: any) => {
    if (
      window.confirm(
        `هل أنت متأكد من حذف منتج العميل "${product.size_caption || "بدون وصف"}"؟`,
      )
    ) {
      deleteCustomerProductMutation.mutate(product.id);
    }
  };

  const handleCloneCustomerProduct = (product: any) => {
    // Clone product data and reset form with cloned data
    const clonedData = {
      customer_id: product.customer_id || "none",
      category_id: product.category_id || "none",
      item_id: product.item_id || "none",
      size_caption: `نسخة من ${product.size_caption || ""}`,
      width: product.width || "",
      left_facing: product.left_facing || "",
      right_facing: product.right_facing || "",
      thickness: product.thickness || "",
      printing_cylinder: product.printing_cylinder || "بدون طباعة",
      cutting_length_cm: product.cutting_length_cm || "",
      raw_material: product.raw_material || "",
      master_batch_id: product.master_batch_id || "",
      is_printed: product.is_printed || false,
      cutting_unit: product.cutting_unit || "",
      punching: product.punching || "",
      unit_weight_kg: product.unit_weight_kg || "",
      unit_quantity: product.unit_quantity || "",
      package_weight_kg: product.package_weight_kg || "",
      cliche_front_design: product.cliche_front_design || "",
      cliche_back_design: product.cliche_back_design || "",
      notes: product.notes || "",
      status: "active",
    };

    setCustomerProductForm({
      ...clonedData,
      front_design_filename: "",
      back_design_filename: "",
    });
    setEditingItem(null); // Ensure it's a new record
    setSelectedTab("customer-products");
    setIsDialogOpen(true);
    toast({ title: "تم نسخ بيانات المنتج - يمكنك تعديلها والحفظ" });
  };

  const handlePrintCustomerProduct = (product: any) => {
    // Create a detailed print view
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "خطأ في فتح نافذة الطباعة", variant: "destructive" });
      return;
    }

    const customerName = Array.isArray(customers)
      ? customers.find((c: any) => c.id === product.customer_id)?.name_ar ||
        customers.find((c: any) => c.id === product.customer_id)?.name ||
        "غير محدد"
      : "غير محدد";

    const categoryName = Array.isArray(categories)
      ? categories.find((c: any) => c.id === product.category_id)?.name_ar ||
        categories.find((c: any) => c.id === product.category_id)?.name ||
        "غير محدد"
      : "غير محدد";

    const itemName = Array.isArray(items)
      ? items.find((i: any) => i.id === product.item_id)?.name_ar ||
        items.find((i: any) => i.id === product.item_id)?.name ||
        "غير محدد"
      : "غير محدد";

    const masterBatchColor = masterBatchColors.find(
      (mb) => mb.id === product.master_batch_id,
    );

    const printContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تفاصيل منتج العميل</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 20px;
          line-height: 1.6;
          color: #333;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #007bff; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
        }
        .header h1 { 
          color: #007bff; 
          margin: 0;
          font-size: 2em;
        }
        .header p { 
          margin: 5px 0; 
          color: #666;
          font-size: 1.1em;
        }
        .section { 
          margin-bottom: 25px; 
          padding: 15px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        .section h3 { 
          color: #007bff; 
          margin-top: 0; 
          border-bottom: 1px solid #007bff;
          padding-bottom: 8px;
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          margin: 8px 0;
          padding: 5px 0;
          border-bottom: 1px dotted #ccc;
        }
        .detail-label { 
          font-weight: bold; 
          color: #555;
          min-width: 150px;
        }
        .detail-value { 
          color: #333;
          text-align: left;
        }
        .color-box { 
          display: inline-block; 
          width: 20px; 
          height: 20px; 
          border: 1px solid #ccc; 
          margin-left: 10px;
          vertical-align: middle;
        }
        .print-date {
          text-align: center;
          margin-top: 30px;
          font-size: 0.9em;
          color: #888;
        }
        @media print {
          body { margin: 10px; }
          .section { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>تفاصيل منتج العميل</h1>
        <p>نظام إدارة مصنع الأكياس البلاستيكية</p>
        <p>رقم المنتج: ${product.id}</p>
      </div>
      
      <div class="section">
        <h3>معلومات أساسية</h3>
        <div class="detail-row">
          <span class="detail-label">اسم العميل:</span>
          <span class="detail-value">${customerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">الفئة:</span>
          <span class="detail-value">${categoryName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">الصنف:</span>
          <span class="detail-value">${itemName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">وصف المقاس:</span>
          <span class="detail-value">${product.size_caption || "-"}</span>
        </div>
      </div>

      <div class="section">
        <h3>المقاسات والأبعاد</h3>
        <div class="detail-row">
          <span class="detail-label">العرض (سم):</span>
          <span class="detail-value">${product.width || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">الوجه الأيسر (سم):</span>
          <span class="detail-value">${product.left_facing || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">الوجه الأيمن (سم):</span>
          <span class="detail-value">${product.right_facing || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">السمك (ميكرون):</span>
          <span class="detail-value">${product.thickness || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">طول القطع (سم):</span>
          <span class="detail-value">${product.cutting_length_cm || "-"}</span>
        </div>
      </div>

      <div class="section">
        <h3>الطباعة والإنتاج</h3>
        <div class="detail-row">
          <span class="detail-label">اسطوانة الطباعة:</span>
          <span class="detail-value">${product.printing_cylinder || "بدون طباعة"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">هل مطبوع:</span>
          <span class="detail-value">${product.is_printed ? "نعم" : "لا"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">المادة الخام:</span>
          <span class="detail-value">${product.raw_material || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">الماستر باتش:</span>
          <span class="detail-value">
            ${
              masterBatchColor
                ? `<span class="color-box" style="background-color: ${masterBatchColor.color}; ${masterBatchColor.color === "transparent" ? "background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0px;" : ""}"></span>${masterBatchColor.name_ar}`
                : product.master_batch_id || "-"
            }
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">التخريم:</span>
          <span class="detail-value">${product.punching || "-"}</span>
        </div>
      </div>

      <div class="section">
        <h3>الوزن والكميات</h3>
        <div class="detail-row">
          <span class="detail-label">وحدة القطع:</span>
          <span class="detail-value">${product.cutting_unit || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">وزن الوحدة (كيلو):</span>
          <span class="detail-value">${product.unit_weight_kg || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">الكمية لكل وحدة:</span>
          <span class="detail-value">${product.unit_quantity || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">وزن التعبئة (كيلو):</span>
          <span class="detail-value">${product.package_weight_kg || "-"}</span>
        </div>
      </div>

      <div class="section">
        <h3>التصاميم والملاحظات</h3>
        <div class="detail-row">
          <span class="detail-label">تصميم الواجهة الأمامية:</span>
          <span class="detail-value">${product.cliche_front_design || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">تصميم الواجهة الخلفية:</span>
          <span class="detail-value">${product.cliche_back_design || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">ملاحظات:</span>
          <span class="detail-value">${product.notes || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">الحالة:</span>
          <span class="detail-value">${product.status === "active" ? "نشط" : "غير نشط"}</span>
        </div>
      </div>

      <div class="print-date">
        تم الطباعة بتاريخ: ${new Date().toLocaleDateString("ar")} - ${new Date().toLocaleTimeString("ar")}
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Debounce timers for auto-calculations
  const sizeCaptionTimer = useRef<NodeJS.Timeout | null>(null);
  const packageWeightTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-set printing status based on cylinder selection (immediate, no debounce needed)
  React.useEffect(() => {
    const isPrinted = customerProductForm.printing_cylinder !== "بدون طباعة";
    setCustomerProductForm((prev) => ({
      ...prev,
      is_printed: isPrinted,
    }));
  }, [customerProductForm.printing_cylinder]);

  // Auto-generate size caption with debouncing
  React.useEffect(() => {
    if (sizeCaptionTimer.current) {
      clearTimeout(sizeCaptionTimer.current);
    }

    sizeCaptionTimer.current = setTimeout(() => {
      const { width, right_facing, left_facing, cutting_length_cm } =
        customerProductForm;
      if (width && right_facing && left_facing && cutting_length_cm) {
        const w = parseFloat(width);
        const rf = parseFloat(right_facing);
        const lf = parseFloat(left_facing);
        const cl = parseFloat(cutting_length_cm);

        if (w && rf && lf && cl) {
          const sizeCaption = `${w}+${rf}+${lf}X${cl}`;
          setCustomerProductForm((prev) => ({
            ...prev,
            size_caption: sizeCaption,
          }));
        }
      }
    }, 300);

    return () => {
      if (sizeCaptionTimer.current) {
        clearTimeout(sizeCaptionTimer.current);
      }
    };
  }, [
    customerProductForm.width,
    customerProductForm.right_facing,
    customerProductForm.left_facing,
    customerProductForm.cutting_length_cm,
  ]);

  // Auto-calculate package weight with debouncing
  React.useEffect(() => {
    if (packageWeightTimer.current) {
      clearTimeout(packageWeightTimer.current);
    }

    packageWeightTimer.current = setTimeout(() => {
      const { unit_weight_kg, unit_quantity } = customerProductForm;
      if (unit_weight_kg && unit_quantity) {
        const unitWeight = parseFloat(unit_weight_kg);
        const quantity = parseInt(unit_quantity);

        if (unitWeight && quantity) {
          const packageWeight = unitWeight * quantity;
          setCustomerProductForm((prev) => ({
            ...prev,
            package_weight_kg: packageWeight.toFixed(3),
          }));
        }
      }
    }, 300);

    return () => {
      if (packageWeightTimer.current) {
        clearTimeout(packageWeightTimer.current);
      }
    };
  }, [customerProductForm.unit_weight_kg, customerProductForm.unit_quantity]);

  // Data queries
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers"],
    staleTime: 0,
  });
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ["/api/sections"],
    staleTime: 0,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    staleTime: 0,
  });
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/items"],
    staleTime: 0,
  });
  const { data: customerProducts = [], isLoading: customerProductsLoading } =
    useQuery({
      queryKey: ["/api/customer-products"],
      staleTime: 0,
    });
  const { data: machines = [], isLoading: machinesLoading } = useQuery({
    queryKey: ["/api/machines"],
    staleTime: 0,
  });
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
    staleTime: 0,
  });
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["/api/locations"],
    staleTime: 0,
  });
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["/api/roles"],
    staleTime: 0,
  });
  const { data: salesReps = [], isLoading: salesRepsLoading } = useQuery({
    queryKey: ["/api/users/sales-reps"],
    staleTime: 0,
  });

  // Filter customers based on search term in customer products form
  const filteredCustomersInProducts = React.useMemo(() => {
    console.log("🔍 Customer filter running:", {
      totalCustomers: Array.isArray(customers) ? customers.length : 0,
      searchTerm: customerSearchTermInProducts,
      isArray: Array.isArray(customers)
    });

    if (!Array.isArray(customers)) return [];

    const filtered = customers.filter((customer: any) => {
      if (!customerSearchTermInProducts) return true;

      const searchLower = customerSearchTermInProducts.toLowerCase();
      return (
        (customer.name || "").toLowerCase().includes(searchLower) ||
        (customer.name_ar || "").toLowerCase().includes(searchLower) ||
        String(customer.id || "").toLowerCase().includes(searchLower) ||
        (customer.code || "").toLowerCase().includes(searchLower)
      );
    });

    console.log("🔍 Filtered customers:", filtered.length);
    return filtered;
  }, [customers, customerSearchTermInProducts]);

  // Parse plate_drawer_code when editing customer
  React.useEffect(() => {
    if (editingItem && selectedTab === "customers") {
      const drawerCode = editingItem.plate_drawer_code || "";
      if (drawerCode && drawerCode.includes("-")) {
        const [letter, number] = drawerCode.split("-");
        setDrawerLetter(letter || "");
        setDrawerNumber(number || "");
      } else {
        setDrawerLetter("");
        setDrawerNumber("");
      }
    } else if (!isDialogOpen) {
      // Reset when dialog closes
      setDrawerLetter("");
      setDrawerNumber("");
    }
  }, [editingItem, selectedTab, isDialogOpen]);

  // Auto-calculations after data is loaded
  React.useEffect(() => {
    // Auto-set cutting unit based on item category
    const { category_id } = customerProductForm;
    if (
      category_id &&
      category_id !== "none" &&
      Array.isArray(categories) &&
      categories.length > 0
    ) {
      const category = (categories as any[]).find(
        (cat: any) => cat.id === category_id,
      );
      if (category) {
        let cuttingUnit = "قطعة";
        if (category.name_ar?.includes("أكياس")) {
          cuttingUnit = "كيس";
        } else if (category.name_ar?.includes("رولات")) {
          cuttingUnit = "رول";
        } else if (category.name_ar?.includes("أغطية")) {
          cuttingUnit = "غطاء";
        }

        setCustomerProductForm((prev) => ({
          ...prev,
          cutting_unit: cuttingUnit,
        }));
      }
    }
  }, [customerProductForm.category_id, categories]);

  // Filter helper function
  const filterData = (data: any[], searchFields: string[]) => {
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => {
        // Status filter
        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "active" &&
            (item.status === "active" || item.status === "operational")) ||
          (statusFilter === "inactive" &&
            (item.status === "inactive" ||
              item.status === "down" ||
              item.status === "maintenance"));

        // Search filter
        const searchMatch =
          !quickSearch ||
          searchFields.some((field) => {
            const value = item[field];
            if (value === null || value === undefined) return false;
            return value
              .toString()
              .toLowerCase()
              .includes(quickSearch.toLowerCase());
          });

        return statusMatch && searchMatch;
      })
      .sort((a, b) => {
        // Sort by ID (number) ascending
        const aId =
          typeof a.id === "string"
            ? parseInt(a.id.replace(/\D/g, "")) || 0
            : a.id || 0;
        const bId =
          typeof b.id === "string"
            ? parseInt(b.id.replace(/\D/g, "")) || 0
            : b.id || 0;
        return aId - bId;
      });
  };

  // Specific filter functions
  const getFilteredCustomers = () => {
    // Sort descending (newest first) for customers
    const filtered = filterData(customers as any[], [
      "name",
      "name_ar",
      "phone",
      "email",
      "address",
      "id",
    ]);
    return filtered.sort((a, b) => {
      const aId =
        typeof a.id === "string"
          ? parseInt(a.id.replace(/\D/g, "")) || 0
          : a.id || 0;
      const bId =
        typeof b.id === "string"
          ? parseInt(b.id.replace(/\D/g, "")) || 0
          : b.id || 0;
      return bId - aId; // Descending order (newest first)
    });
  };
  const getFilteredSections = () =>
    filterData(sections as any[], ["name", "name_ar", "description", "id"]);
  const getFilteredCategories = () =>
    filterData(categories as any[], ["name", "name_ar", "description", "id"]);
  const getFilteredItems = () =>
    filterData(items as any[], ["name", "name_ar", "category_id", "id"]);
  const getFilteredCustomerProducts = () => {
    const filtered = (customerProducts as any[])
      .filter((product: any) => {
        // Status filter
        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "active" && product.status === "active") ||
          (statusFilter === "inactive" && product.status === "inactive");

        // Search filter - enhanced for customer products
        const searchMatch =
          !quickSearch ||
          [
            product.size_caption,
            product.raw_material,
            product.master_batch_id,
            product.notes,
            product.id,
            // Search in related customer name
            (customers as any[]).find((c: any) => c.id === product.customer_id)
              ?.name_ar,
            (customers as any[]).find((c: any) => c.id === product.customer_id)
              ?.name,
            // Search in related item name
            (items as any[]).find((i: any) => i.id === product.item_id)
              ?.name_ar,
            (items as any[]).find((i: any) => i.id === product.item_id)?.name,
          ].some((field: any) => {
            if (field === null || field === undefined) return false;
            return field
              .toString()
              .toLowerCase()
              .includes(quickSearch.toLowerCase());
          });

        return statusMatch && searchMatch;
      })
      .sort((a: any, b: any) => {
        const aId =
          typeof a.id === "string"
            ? parseInt(a.id.replace(/\D/g, "")) || 0
            : a.id || 0;
        const bId =
          typeof b.id === "string"
            ? parseInt(b.id.replace(/\D/g, "")) || 0
            : b.id || 0;
        return bId - aId; // Descending order (newest first)
      });
    return filtered;
  };
  const getFilteredLocations = () =>
    filterData(locations as any[], ["name", "name_ar", "type", "id"]);
  const getFilteredMachines = () =>
    filterData(machines as any[], ["name", "name_ar", "type", "id"]);
  const getFilteredUsers = () =>
    filterData(users as any[], [
      "username",
      "display_name",
      "display_name_ar",
      "id",
    ]);

  // Pagination component
  const PaginationComponent = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
  }) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            التالي
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              عرض <span className="font-medium">{startItem}</span> إلى{" "}
              <span className="font-medium">{endItem}</span> من{" "}
              <span className="font-medium">{totalItems}</span> نتيجة
            </p>
          </div>
          <div>
            <nav
              className="inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-l-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  );
                })
                .map((page, index, array) => {
                  const showEllipsis =
                    index > 0 && array[index - 1] !== page - 1;
                  return (
                    <div key={page}>
                      {showEllipsis && (
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-r-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // All mutations for different entities

  // Customer mutations
  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في إنشاء العميل:", error);
      toast({ title: "خطأ في إنشاء العميل", variant: "destructive" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث العميل:", error);
      toast({ title: "خطأ في تحديث العميل", variant: "destructive" });
    },
  });

  // Section mutations
  const createSectionMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/sections", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء القسم بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في إنشاء القسم:", error);
      toast({ title: "خطأ في إنشاء القسم", variant: "destructive" });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/sections/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث القسم بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث القسم:", error);
      toast({ title: "خطأ في تحديث القسم", variant: "destructive" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء الفئة بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في إنشاء الفئة:", error);
      toast({ title: "خطأ في إنشاء الفئة", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث الفئة بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث الفئة:", error);
      toast({ title: "خطأ في تحديث الفئة", variant: "destructive" });
    },
  });

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/items", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create item");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء الصنف بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في إنشاء الصنف:", error);
      toast({ title: "خطأ في إنشاء الصنف", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update item");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث الصنف بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث الصنف:", error);
      toast({ title: "خطأ في تحديث الصنف", variant: "destructive" });
    },
  });

  // Customer Product mutations
  const createCustomerProductMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/customer-products", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create customer product");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-products"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء منتج العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في إنشاء منتج العميل:", error);
      toast({ title: "خطأ في إنشاء منتج العميل", variant: "destructive" });
    },
  });

  const updateCustomerProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/customer-products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to update customer product");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-products"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث منتج العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث منتج العميل:", error);
      toast({ title: "خطأ في تحديث منتج العميل", variant: "destructive" });
    },
  });

  // Delete Customer Product Mutation
  const deleteCustomerProductMutation = useMutation({
    mutationFn: (id: string) => {
      return fetch(`/api/customer-products/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-products"] });
      toast({ title: "تم حذف منتج العميل بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في حذف منتج العميل:", error);
      toast({ title: "خطأ في حذف منتج العميل", variant: "destructive" });
    },
  });

  // Location mutations
  const createLocationMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/locations", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء الموقع بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في إنشاء الموقع:", error);
      toast({ title: "خطأ في إنشاء الموقع", variant: "destructive" });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/locations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث الموقع بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث الموقع:", error);
      toast({ title: "خطأ في تحديث الموقع", variant: "destructive" });
    },
  });

  // Machine mutations
  const createMachineMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/machines", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء الماكينة بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في إنشاء الماكينة:", error);
      toast({ title: "خطأ في إنشاء الماكينة", variant: "destructive" });
    },
  });

  const updateMachineMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/machines/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/machines"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث الماكينة بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث الماكينة:", error);
      toast({ title: "خطأ في تحديث الماكينة", variant: "destructive" });
    },
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => {
      return fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم إنشاء المستخدم بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في إنشاء المستخدم:", error);
      toast({ title: "خطأ في إنشاء المستخدم", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      resetForm();
      setIsDialogOpen(false);
      toast({ title: "تم تحديث المستخدم بنجاح" });
    },
    onError: (error: any) => {
      console.error("خطأ في تحديث المستخدم:", error);
      toast({ title: "خطأ في تحديث المستخدم", variant: "destructive" });
    },
  });

  // Event handlers
  const resetForm = () => {
    setDrawerLetter("");
    setDrawerNumber("");
    setCustomerForm({
      name: "",
      name_ar: "",
      code: "",
      user_id: "",
      plate_drawer_code: "",
      city: "",
      address: "",
      tax_number: "",
      phone: "",
      sales_rep_id: "",
    });
    setSectionForm({ name: "", name_ar: "", description: "" });
    setCategoryForm({
      name: "",
      name_ar: "",
      code: "",
      parent_id: "none",
      description: "",
      status: "active",
    });
    setItemForm({
      name: "",
      name_ar: "",
      code: "",
      category_id: "none",
      status: "active",
    });
    setCustomerProductForm({
      customer_id: "none",
      category_id: "none",
      item_id: "none",
      size_caption: "",
      width: "",
      left_facing: "",
      right_facing: "",
      thickness: "",
      printing_cylinder: "بدون طباعة",
      cutting_length_cm: "",
      raw_material: "",
      master_batch_id: "",
      is_printed: false,
      cutting_unit: "",
      punching: "",
      unit_weight_kg: "",
      unit_quantity: "",
      package_weight_kg: "",
      cliche_front_design: "",
      cliche_back_design: "",
      front_design_filename: "",
      back_design_filename: "",
      notes: "",
      status: "active",
    });
    setLocationForm({
      name: "",
      name_ar: "",
      type: "city",
      parent_id: "",
      coordinates: "",
      status: "active",
    });
    setMachineForm({
      name: "",
      name_ar: "",
      type: "extruder",
      section_id: "none",
      status: "active",
      capacity_small_kg_per_hour: "",
      capacity_medium_kg_per_hour: "",
      capacity_large_kg_per_hour: "",
    });
    setUserForm({
      username: "",
      display_name: "",
      display_name_ar: "",
      password: "",
      role_id: "none",
      section_id: "none",
      status: "active",
    });
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex min-h-screen">
        <Sidebar />
        <MobileNav />
        <main
          className="flex-1 lg:mr-64 p-4 lg:p-6"
          style={{ marginRight: "16rem" }}
        >
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                التعريفات الأساسية
              </h1>
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
              <Tabs
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="space-y-4 w-full"
              >
                <TabsList
                  className="grid grid-cols-4 lg:grid-cols-8 w-full h-auto p-1 bg-white rounded-lg border border-gray-200 shadow-sm gap-1"
                  dir="rtl"
                >
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
                    المكائن
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("customers");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة عميل
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {customersLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم العربي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم الإنجليزي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  رقم درج
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الهاتف
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  المدينة
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredCustomers =
                                  getFilteredCustomers();
                                const paginatedCustomers = paginateData(
                                  filteredCustomers,
                                  currentPages.customers,
                                );
                                return paginatedCustomers.length > 0 ? (
                                  paginatedCustomers.map((customer: any) => (
                                    <tr
                                      key={customer.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        {customer.id}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {customer.name_ar || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {customer.name || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {customer.plate_drawer_code || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {customer.phone || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {customer.city || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingItem(customer);
                                              setCustomerForm({
                                                name: customer.name || "",
                                                name_ar: customer.name_ar || "",
                                                code: customer.code || "",
                                                user_id: customer.user_id || "",
                                                plate_drawer_code:
                                                  customer.plate_drawer_code ||
                                                  "",
                                                city: customer.city || "",
                                                address: customer.address || "",
                                                tax_number:
                                                  customer.tax_number || "",
                                                phone: customer.phone || "",
                                                sales_rep_id:
                                                  customer.sales_rep_id || "",
                                              });
                                              setSelectedTab("customers");
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
                                    <td
                                      colSpan={7}
                                      className="px-6 py-4 text-center text-gray-500"
                                    >
                                      {quickSearch || statusFilter !== "all"
                                        ? "لا توجد نتائج مطابقة للفلاتر المحددة"
                                        : "لا توجد بيانات متاحة"}
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredCustomers = getFilteredCustomers();
                            const totalPages = getTotalPages(
                              filteredCustomers.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.customers}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("customers", page)
                                  }
                                  totalItems={filteredCustomers.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("categories");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة فئة
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {categoriesLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم العربي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم الإنجليزي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الكود
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredCategories =
                                  getFilteredCategories();
                                const paginatedCategories = paginateData(
                                  filteredCategories,
                                  currentPages.categories,
                                );
                                return paginatedCategories.length > 0 ? (
                                  paginatedCategories.map((category: any) => (
                                    <tr
                                      key={category.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        {category.id}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {category.name_ar || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {category.name || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {category.code || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingItem(category);
                                              setCategoryForm({
                                                name: category.name || "",
                                                name_ar: category.name_ar || "",
                                                code: category.code || "",
                                                parent_id:
                                                  category.parent_id || "none",
                                                description:
                                                  category.description || "",
                                                status:
                                                  category.status || "active",
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
                                    <td
                                      colSpan={5}
                                      className="px-6 py-4 text-center text-gray-500"
                                    >
                                      {quickSearch || statusFilter !== "all"
                                        ? "لا توجد نتائج مطابقة للفلاتر المحددة"
                                        : "لا توجد بيانات متاحة"}
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredCategories = getFilteredCategories();
                            const totalPages = getTotalPages(
                              filteredCategories.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.categories}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("categories", page)
                                  }
                                  totalItems={filteredCategories.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("sections");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة قسم
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sectionsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم العربي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم الإنجليزي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الوصف
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredSections = getFilteredSections();
                                const paginatedSections = paginateData(
                                  filteredSections,
                                  currentPages.sections,
                                );
                                return paginatedSections.length > 0 ? (
                                  paginatedSections.map((section: any) => (
                                    <tr
                                      key={section.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        {section.id}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {section.name_ar || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {section.name || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {section.description || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingItem(section);
                                              setSectionForm({
                                                name: section.name || "",
                                                name_ar: section.name_ar || "",
                                                description:
                                                  section.description || "",
                                              });
                                              setSelectedTab("sections");
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
                                    <td
                                      colSpan={5}
                                      className="px-6 py-8 text-center text-gray-500"
                                    >
                                      لا توجد أقسام مطابقة للبحث
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredSections = getFilteredSections();
                            const totalPages = getTotalPages(
                              filteredSections.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.sections}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("sections", page)
                                  }
                                  totalItems={filteredSections.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("items");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة صنف
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {itemsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم العربي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم الإنجليزي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الفئة
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredItems = getFilteredItems();
                                const paginatedItems = paginateData(
                                  filteredItems,
                                  currentPages.items,
                                );
                                return paginatedItems.length > 0 ? (
                                  paginatedItems.map((item: any) => (
                                    <tr
                                      key={item.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        {item.id}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {item.name_ar || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {item.name || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {item.category_id || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingItem(item);
                                              setItemForm({
                                                name: item.name || "",
                                                name_ar: item.name_ar || "",
                                                code: item.code || "",
                                                category_id:
                                                  item.category_id || "none",
                                                status: item.status || "active",
                                              });
                                              setSelectedTab("items");
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
                                    <td
                                      colSpan={5}
                                      className="px-6 py-8 text-center text-gray-500"
                                    >
                                      لا توجد أصناف مطابقة للبحث
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredItems = getFilteredItems();
                            const totalPages = getTotalPages(
                              filteredItems.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.items}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("items", page)
                                  }
                                  totalItems={filteredItems.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("customer-products");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة منتج
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {customerProductsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  اسم العميل
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  اسم الصنف
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  وصف المقاس
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الطباعة/القطع
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  المادة الخام
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الماستر باتش
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  التخريم
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الوحدة
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  وزن التعبئة
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredCustomerProducts =
                                  getFilteredCustomerProducts();
                                const paginatedCustomerProducts = paginateData(
                                  filteredCustomerProducts,
                                  currentPages.customerProducts,
                                );
                                return paginatedCustomerProducts.length > 0 ? (
                                  paginatedCustomerProducts.map(
                                    (product: any) => {
                                      // Find customer details
                                      const customer = Array.isArray(customers)
                                        ? customers.find(
                                            (c: any) =>
                                              c.id === product.customer_id,
                                          )
                                        : null;
                                      // Find item details
                                      const item = Array.isArray(items)
                                        ? items.find(
                                            (i: any) =>
                                              i.id === product.item_id,
                                          )
                                        : null;

                                      return (
                                        <tr
                                          key={product.id}
                                          className="hover:bg-gray-50"
                                        >
                                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                            {product.id}
                                          </td>
                                          <td className="px-3 py-4 text-sm text-gray-900 text-center">
                                            <div className="flex flex-col items-center">
                                              <span className="font-medium">
                                                {customer?.name_ar ||
                                                  customer?.name ||
                                                  "-"}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {customer?.name || "-"}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {item?.name_ar || item?.name || "-"}
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {product.size_caption || "-"}
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {product.is_printed
                                              ? product.printing_cylinder ||
                                                "بدون طباعة"
                                              : product.cutting_length_cm
                                                ? `${formatNumber(parseFloat(product.cutting_length_cm))} سم`
                                                : "-"}
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {product.raw_material || "-"}
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {(() => {
                                              const masterBatchColor =
                                                masterBatchColors.find(
                                                  (mb) =>
                                                    mb.id ===
                                                    product.master_batch_id,
                                                );
                                              return masterBatchColor ? (
                                                <div className="flex items-center justify-center gap-2">
                                                  <div
                                                    className="w-6 h-6 rounded-full border-2 border-gray-300 shadow-sm"
                                                    style={{
                                                      backgroundColor:
                                                        masterBatchColor.color,
                                                    }}
                                                    title={
                                                      masterBatchColor.name
                                                    }
                                                  ></div>
                                                  <span className="text-xs font-medium text-gray-700">
                                                    {masterBatchColor.name_ar}
                                                  </span>
                                                </div>
                                              ) : (
                                                product.master_batch_id || "-"
                                              );
                                            })()}
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {product.punching || "-"}
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {product.cutting_unit || "-"}
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {product.package_weight_kg
                                              ? `${formatNumber(parseFloat(product.package_weight_kg))} كغ`
                                              : "-"}
                                          </td>
                                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-center">
                                            <div className="flex items-center justify-center gap-1">
                                              {/* Edit Button */}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setEditingItem(product);
                                                  setCustomerProductForm({
                                                    customer_id:
                                                      product.customer_id ||
                                                      "none",
                                                    category_id:
                                                      product.category_id ||
                                                      "none",
                                                    item_id:
                                                      product.item_id || "none",
                                                    size_caption:
                                                      product.size_caption ||
                                                      "",
                                                    width: product.width || "",
                                                    left_facing:
                                                      product.left_facing || "",
                                                    right_facing:
                                                      product.right_facing ||
                                                      "",
                                                    thickness:
                                                      product.thickness || "",
                                                    printing_cylinder:
                                                      product.printing_cylinder ||
                                                      "بدون طباعة",
                                                    cutting_length_cm:
                                                      product.cutting_length_cm ||
                                                      "",
                                                    raw_material:
                                                      product.raw_material ||
                                                      "",
                                                    master_batch_id:
                                                      product.master_batch_id ||
                                                      "",
                                                    is_printed:
                                                      product.is_printed ||
                                                      false,
                                                    cutting_unit:
                                                      product.cutting_unit ||
                                                      "",
                                                    punching:
                                                      product.punching || "",
                                                    unit_weight_kg:
                                                      product.unit_weight_kg ||
                                                      "",
                                                    unit_quantity:
                                                      product.unit_quantity ||
                                                      "",
                                                    package_weight_kg:
                                                      product.package_weight_kg ||
                                                      "",
                                                    cliche_front_design:
                                                      product.cliche_front_design ||
                                                      "",
                                                    cliche_back_design:
                                                      product.cliche_back_design ||
                                                      "",
                                                    front_design_filename: "",
                                                    back_design_filename: "",
                                                    notes: product.notes || "",
                                                    status:
                                                      product.status ||
                                                      "active",
                                                  });
                                                  setSelectedTab(
                                                    "customer-products",
                                                  );
                                                  setIsDialogOpen(true);
                                                }}
                                                title="تحديث"
                                              >
                                                <Edit className="w-3 h-3" />
                                              </Button>

                                              {/* Clone Button */}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleCloneCustomerProduct(
                                                    product,
                                                  )
                                                }
                                                title="استنساخ"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                              >
                                                <Copy className="w-3 h-3" />
                                              </Button>

                                              {/* Print Button */}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handlePrintCustomerProduct(
                                                    product,
                                                  )
                                                }
                                                title="طباعة"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                              >
                                                <Printer className="w-3 h-3" />
                                              </Button>

                                              {/* Delete Button */}
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleDeleteCustomerProduct(
                                                    product,
                                                  )
                                                }
                                                title="حذف"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                disabled={
                                                  deleteCustomerProductMutation.isPending
                                                }
                                              >
                                                {deleteCustomerProductMutation.isPending ? (
                                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                                ) : (
                                                  <Trash2 className="w-3 h-3" />
                                                )}
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    },
                                  )
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={11}
                                      className="px-6 py-8 text-center text-gray-500"
                                    >
                                      لا توجد منتجات مطابقة للبحث
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredCustomerProducts =
                              getFilteredCustomerProducts();
                            const totalPages = getTotalPages(
                              filteredCustomerProducts.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.customerProducts}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("customerProducts", page)
                                  }
                                  totalItems={filteredCustomerProducts.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("locations");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة موقع
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {locationsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم العربي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم الإنجليزي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  النوع
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredLocations =
                                  getFilteredLocations();
                                const paginatedLocations = paginateData(
                                  filteredLocations,
                                  currentPages.locations,
                                );
                                return paginatedLocations.length > 0 ? (
                                  paginatedLocations.map((location: any) => (
                                    <tr
                                      key={location.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        {location.id}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {location.name_ar || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {location.name || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {location.type || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingItem(location);
                                              setLocationForm({
                                                name: location.name || "",
                                                name_ar: location.name_ar || "",
                                                type: location.type || "city",
                                                parent_id:
                                                  location.parent_id || "",
                                                coordinates:
                                                  location.coordinates || "",
                                                status:
                                                  location.status || "active",
                                              });
                                              setSelectedTab("locations");
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
                                    <td
                                      colSpan={5}
                                      className="px-6 py-8 text-center text-gray-500"
                                    >
                                      لا توجد مواقع مطابقة للبحث
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredLocations = getFilteredLocations();
                            const totalPages = getTotalPages(
                              filteredLocations.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.locations}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("locations", page)
                                  }
                                  totalItems={filteredLocations.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("machines");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة ماكينة
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {machinesLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم العربي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم الإنجليزي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  النوع
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  نشطة
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  قدرة صغير
                                  <br />
                                  <span className="text-[10px] font-normal">(كجم/ساعة)</span>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  قدرة وسط
                                  <br />
                                  <span className="text-[10px] font-normal">(كجم/ساعة)</span>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  قدرة كبير
                                  <br />
                                  <span className="text-[10px] font-normal">(كجم/ساعة)</span>
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredMachines = getFilteredMachines();
                                const paginatedMachines = paginateData(
                                  filteredMachines,
                                  currentPages.machines,
                                );
                                return paginatedMachines.length > 0 ? (
                                  paginatedMachines.map((machine: any) => (
                                    <tr
                                      key={machine.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        {machine.id}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {machine.name_ar || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {machine.name || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {machine.type || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center" data-testid={`text-status-${machine.id}`}>
                                        <Badge 
                                          variant={machine.status === "active" ? "default" : "secondary"}
                                          className={machine.status === "active" ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}
                                        >
                                          {machine.status === "active" ? "نشطة" : machine.status === "maintenance" ? "صيانة" : "متوقفة"}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center" data-testid={`text-capacity-small-${machine.id}`}>
                                        {machine.capacity_small_kg_per_hour ? formatNumber(parseFloat(machine.capacity_small_kg_per_hour)) : "-"}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center" data-testid={`text-capacity-medium-${machine.id}`}>
                                        {machine.capacity_medium_kg_per_hour ? formatNumber(parseFloat(machine.capacity_medium_kg_per_hour)) : "-"}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center" data-testid={`text-capacity-large-${machine.id}`}>
                                        {machine.capacity_large_kg_per_hour ? formatNumber(parseFloat(machine.capacity_large_kg_per_hour)) : "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingItem(machine);
                                              setMachineForm({
                                                name: machine.name || "",
                                                name_ar: machine.name_ar || "",
                                                type:
                                                  machine.type || "extruder",
                                                section_id:
                                                  machine.section_id || "",
                                                status:
                                                  machine.status || "active",
                                                capacity_small_kg_per_hour: machine.capacity_small_kg_per_hour || "",
                                                capacity_medium_kg_per_hour: machine.capacity_medium_kg_per_hour || "",
                                                capacity_large_kg_per_hour: machine.capacity_large_kg_per_hour || "",
                                              });
                                              setSelectedTab("machines");
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
                                    <td
                                      colSpan={9}
                                      className="px-6 py-8 text-center text-gray-500"
                                    >
                                      لا توجد ماكينات مطابقة للبحث
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredMachines = getFilteredMachines();
                            const totalPages = getTotalPages(
                              filteredMachines.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.machines}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("machines", page)
                                  }
                                  totalItems={filteredMachines.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("users");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة مستخدم
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {usersLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  اسم المستخدم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  القسم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الدور
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredUsers = getFilteredUsers();
                                const paginatedUsers = paginateData(
                                  filteredUsers,
                                  currentPages.users,
                                );
                                return paginatedUsers.length > 0 ? (
                                  paginatedUsers.map((user: any) => (
                                    <tr
                                      key={user.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        {user.id}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {user.username || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {user.display_name || user.name || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {(() => {
                                          if (!user.section_id) return "-";
                                          // Map numeric section_id to section string ID
                                          const sectionMapping: {
                                            [key: number]: string;
                                          } = {
                                            1: "SEC01",
                                            2: "SEC02",
                                            3: "SEC03",
                                            4: "SEC04",
                                            5: "SEC05",
                                            6: "SEC06",
                                            7: "SEC07",
                                          };
                                          const sectionId =
                                            sectionMapping[user.section_id];
                                          const section =
                                            Array.isArray(sections) &&
                                            sections.find(
                                              (s: any) => s.id === sectionId,
                                            );
                                          return section
                                            ? section.name_ar || section.name
                                            : `قسم ${user.section_id}`;
                                        })()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {(() => {
                                          if (!user.role_id) return "-";
                                          const role =
                                            Array.isArray(roles) &&
                                            roles.find(
                                              (r: any) => r.id === user.role_id,
                                            );
                                          return role
                                            ? role.name_ar || role.name
                                            : "-";
                                        })()}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingItem(user);
                                              setUserForm({
                                                username: user.username || "",
                                                display_name:
                                                  user.display_name || "",
                                                display_name_ar:
                                                  user.display_name_ar || "",
                                                password: "",
                                                role_id: user.role_id
                                                  ? `ROLE0${user.role_id < 10 ? "0" + user.role_id : user.role_id}`
                                                  : "none",
                                                section_id: (() => {
                                                  if (!user.section_id)
                                                    return "none";
                                                  const sectionMapping: {
                                                    [key: number]: string;
                                                  } = {
                                                    1: "SEC01",
                                                    2: "SEC02",
                                                    3: "SEC03",
                                                    4: "SEC04",
                                                    5: "SEC05",
                                                    6: "SEC06",
                                                    7: "SEC07",
                                                  };
                                                  return (
                                                    sectionMapping[
                                                      user.section_id
                                                    ] || "none"
                                                  );
                                                })(),
                                                status: user.status || "active",
                                              });
                                              setSelectedTab("users");
                                              setShowPassword(false);
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
                                    <td
                                      colSpan={5}
                                      className="px-6 py-8 text-center text-gray-500"
                                    >
                                      لا توجد مستخدمين مطابقة للبحث
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredUsers = getFilteredUsers();
                            const totalPages = getTotalPages(
                              filteredUsers.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.users}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("users", page)
                                  }
                                  totalItems={filteredUsers.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
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
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("locations");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          إضافة موقع
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {locationsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            جاري التحميل...
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الرقم
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم العربي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الاسم الإنجليزي
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  الإحداثيات
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  نطاق التسامح
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                  العمليات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {(() => {
                                const filteredLocations =
                                  getFilteredLocations();
                                const paginatedLocations = paginateData(
                                  filteredLocations,
                                  currentPages.locations,
                                );
                                return paginatedLocations.length > 0 ? (
                                  paginatedLocations.map((location: any) => (
                                    <tr
                                      key={location.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                        {location.id}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {location.name_ar || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {location.name || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {location.coordinates || "-"}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                        {location.tolerance_range || "-"} متر
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setEditingItem(location);
                                              setLocationForm({
                                                name: location.name || "",
                                                name_ar: location.name_ar || "",
                                                type: location.type || "city",
                                                parent_id:
                                                  location.parent_id || "",
                                                coordinates:
                                                  location.coordinates || "",
                                                status:
                                                  location.status || "active",
                                              });
                                              setSelectedTab("locations");
                                              setIsDialogOpen(true);
                                            }}
                                            data-testid={`button-edit-location-${location.id}`}
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="px-6 py-8 text-center text-gray-500"
                                    >
                                      لا توجد مواقع مطابقة للبحث
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tbody>
                          </table>
                          {(() => {
                            const filteredLocations = getFilteredLocations();
                            const totalPages = getTotalPages(
                              filteredLocations.length,
                            );
                            if (totalPages > 1) {
                              return (
                                <PaginationComponent
                                  currentPage={currentPages.locations}
                                  totalPages={totalPages}
                                  onPageChange={(page) =>
                                    updatePage("locations", page)
                                  }
                                  totalItems={filteredLocations.length}
                                  itemsPerPage={itemsPerPage}
                                />
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* All Dialogs for different entities */}

            {/* Customer Add/Edit Dialog */}
            {selectedTab === "customers" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent
                  className="max-w-4xl max-h-[90vh] overflow-y-auto"
                  aria-describedby="customer-dialog-description"
                >
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث العميل" : "إضافة عميل جديد"}
                    </DialogTitle>
                    <DialogDescription id="customer-dialog-description">
                      {editingItem
                        ? "تعديل بيانات العميل الحالي"
                        : "إضافة عميل جديد إلى النظام"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={customerForm.name_ar}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="اسم العميل بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={customerForm.name}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              name: e.target.value,
                            })
                          }
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
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              code: e.target.value,
                            })
                          }
                          placeholder="كود العميل"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="plate_drawer_code">رقم درج</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Select
                            value={drawerLetter || "none"}
                            onValueChange={(value) => {
                              const newLetter = value === "none" ? "" : value;
                              setDrawerLetter(newLetter);
                              const combined = newLetter && drawerNumber 
                                ? `${newLetter}-${drawerNumber}` 
                                : "";
                              setCustomerForm({
                                ...customerForm,
                                plate_drawer_code: combined,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="الحرف" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">بدون</SelectItem>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                              <SelectItem value="D">D</SelectItem>
                              <SelectItem value="E">E</SelectItem>
                              <SelectItem value="F">F</SelectItem>
                              <SelectItem value="G">G</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={drawerNumber || "none"}
                            onValueChange={(value) => {
                              const newNumber = value === "none" ? "" : value;
                              setDrawerNumber(newNumber);
                              const combined = drawerLetter && newNumber 
                                ? `${drawerLetter}-${newNumber}` 
                                : "";
                              setCustomerForm({
                                ...customerForm,
                                plate_drawer_code: combined,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="الرقم" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              <SelectItem value="none">بدون</SelectItem>
                              {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">الهاتف</Label>
                        <Input
                          id="phone"
                          value={customerForm.phone}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="رقم الهاتف"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">المدينة</Label>
                        <Input
                          id="city"
                          value={customerForm.city}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              city: e.target.value,
                            })
                          }
                          placeholder="المدينة"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tax_number">الرقم الضريبي</Label>
                        <Input
                          id="tax_number"
                          value={customerForm.tax_number}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              tax_number: e.target.value,
                            })
                          }
                          placeholder="الرقم الضريبي"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="sales_rep_id">المندوب</Label>
                      <Select
                        value={customerForm.sales_rep_id?.toString() || "none"}
                        onValueChange={(value) =>
                          setCustomerForm({
                            ...customerForm,
                            sales_rep_id: value === "none" ? "" : value,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1" data-testid="select-sales-rep">
                          <SelectValue placeholder="اختر المندوب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون مندوب</SelectItem>
                          {Array.isArray(salesReps) &&
                            salesReps.map((rep: any) => (
                              <SelectItem
                                key={rep.id}
                                value={rep.id.toString()}
                              >
                                {rep.display_name_ar || rep.display_name || rep.username}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="address">العنوان</Label>
                      <Input
                        id="address"
                        value={customerForm.address}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            address: e.target.value,
                          })
                        }
                        placeholder="العنوان كاملاً"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateCustomerMutation.mutate({
                            id: editingItem.id,
                            data: customerForm,
                          });
                        } else {
                          createCustomerMutation.mutate(customerForm);
                        }
                      }}
                      disabled={
                        createCustomerMutation.isPending ||
                        updateCustomerMutation.isPending
                      }
                    >
                      {createCustomerMutation.isPending ||
                      updateCustomerMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : editingItem ? (
                        "تحديث"
                      ) : (
                        "حفظ"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Section Add/Edit Dialog */}
            {selectedTab === "sections" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث القسم" : "إضافة قسم جديد"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem
                        ? "تعديل بيانات القسم الحالي"
                        : "إضافة قسم جديد للمؤسسة"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={sectionForm.name_ar}
                          onChange={(e) =>
                            setSectionForm({
                              ...sectionForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="اسم القسم بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={sectionForm.name}
                          onChange={(e) =>
                            setSectionForm({
                              ...sectionForm,
                              name: e.target.value,
                            })
                          }
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
                        onChange={(e) =>
                          setSectionForm({
                            ...sectionForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="وصف القسم (اختياري)"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateSectionMutation.mutate({
                            id: editingItem.id,
                            data: sectionForm,
                          });
                        } else {
                          createSectionMutation.mutate(sectionForm);
                        }
                      }}
                      disabled={
                        createSectionMutation.isPending ||
                        updateSectionMutation.isPending
                      }
                    >
                      {createSectionMutation.isPending ||
                      updateSectionMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : editingItem ? (
                        "تحديث"
                      ) : (
                        "حفظ"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Category Add/Edit Dialog */}
            {selectedTab === "categories" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث الفئة" : "إضافة فئة جديدة"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem
                        ? "تعديل بيانات الفئة الحالية"
                        : "إضافة فئة جديدة لتصنيف المنتجات"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={categoryForm.name_ar}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="اسم الفئة بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={categoryForm.name}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              name: e.target.value,
                            })
                          }
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
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              code: e.target.value,
                            })
                          }
                          placeholder="كود الفئة (اختياري)"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="parent_id">الفئة الرئيسية</Label>
                        <Select
                          value={categoryForm.parent_id}
                          onValueChange={(value) =>
                            setCategoryForm({
                              ...categoryForm,
                              parent_id: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الفئة الرئيسية" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              بدون فئة رئيسية
                            </SelectItem>
                            {Array.isArray(categories) &&
                              categories
                                .filter(
                                  (cat) =>
                                    cat.id &&
                                    cat.id !== "" &&
                                    cat.id !== null &&
                                    cat.id !== undefined,
                                )
                                .map((cat: any) => (
                                  <SelectItem
                                    key={cat.id}
                                    value={cat.id.toString()}
                                  >
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
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="وصف الفئة (اختياري)"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">الحالة</Label>
                      <Select
                        value={categoryForm.status}
                        onValueChange={(value) =>
                          setCategoryForm({ ...categoryForm, status: value })
                        }
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
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateCategoryMutation.mutate({
                            id: editingItem.id,
                            data: categoryForm,
                          });
                        } else {
                          createCategoryMutation.mutate(categoryForm);
                        }
                      }}
                      disabled={
                        createCategoryMutation.isPending ||
                        updateCategoryMutation.isPending
                      }
                    >
                      {createCategoryMutation.isPending ||
                      updateCategoryMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : editingItem ? (
                        "تحديث"
                      ) : (
                        "حفظ"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Items Add/Edit Dialog */}
            {selectedTab === "items" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث الصنف" : "إضافة صنف جديد"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem
                        ? "تعديل بيانات الصنف الحالي"
                        : "إضافة صنف جديد إلى المخزون"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={itemForm.name_ar}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="اسم الصنف بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={itemForm.name}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, name: e.target.value })
                          }
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
                          onChange={(e) =>
                            setItemForm({ ...itemForm, code: e.target.value })
                          }
                          placeholder="كود الصنف"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category_id">الفئة</Label>
                        <Select
                          value={itemForm.category_id}
                          onValueChange={(value) =>
                            setItemForm({ ...itemForm, category_id: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون فئة</SelectItem>
                            {Array.isArray(categories) &&
                              categories
                                .filter(
                                  (cat) =>
                                    cat.id &&
                                    cat.id !== "" &&
                                    cat.id !== null &&
                                    cat.id !== undefined,
                                )
                                .map((cat: any) => (
                                  <SelectItem
                                    key={cat.id}
                                    value={cat.id.toString()}
                                  >
                                    {cat.name_ar || cat.name} ({cat.id})
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateItemMutation.mutate({
                            id: editingItem.id,
                            data: itemForm,
                          });
                        } else {
                          createItemMutation.mutate(itemForm);
                        }
                      }}
                      disabled={
                        createItemMutation.isPending ||
                        updateItemMutation.isPending
                      }
                    >
                      {createItemMutation.isPending ||
                      updateItemMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : editingItem ? (
                        "تحديث"
                      ) : (
                        "حفظ"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Customer Products Add/Edit Dialog */}
            {selectedTab === "customer-products" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto sm:max-w-[95vw] w-full mx-4">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      {editingItem
                        ? "تحديث منتج العميل"
                        : "إضافة منتج عميل جديد"}
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                      {editingItem
                        ? "تعديل بيانات منتج العميل الحالي"
                        : "إضافة منتج جديد لعميل محدد"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4 px-2 sm:px-0">
                    {/* العميل والفئة والصنف */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="customer_id">العميل *</Label>
                        <div className="space-y-2 mt-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="البحث بالاسم العربي أو الإنجليزي..."
                              value={customerSearchTermInProducts}
                              onChange={(e) =>
                                setCustomerSearchTermInProducts(e.target.value)
                              }
                              className="pl-10"
                              data-testid="input-search-customers-in-products"
                            />
                          </div>
                          <Select
                            value={customerProductForm.customer_id}
                            onValueChange={(value) => {
                              setCustomerProductForm({
                                ...customerProductForm,
                                customer_id: value,
                              });
                              console.log("Selected customer:", value);
                            }}
                          >
                            <SelectTrigger data-testid="select-customer-in-products">
                              <SelectValue placeholder="اختر العميل" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">اختر العميل</SelectItem>
                              {filteredCustomersInProducts.length > 0 ? (
                                filteredCustomersInProducts
                                  .filter(
                                    (customer) =>
                                      customer.id &&
                                      customer.id !== "" &&
                                      customer.id !== null &&
                                      customer.id !== undefined,
                                  )
                                  .map((customer: any) => (
                                    <SelectItem
                                      key={customer.id}
                                      value={customer.id.toString()}
                                    >
                                      {customer.name_ar || customer.name}
                                      {customer.name && customer.name_ar ? ` - ${customer.name}` : ""}
                                    </SelectItem>
                                  ))
                              ) : (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  {customerSearchTermInProducts 
                                    ? "لا توجد نتائج للبحث"
                                    : "جاري تحميل العملاء..."}
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-gray-500 mt-1">
                            {filteredCustomersInProducts.length > 0 && (
                              <span>
                                {filteredCustomersInProducts.length} عميل متاح
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category_id">الفئة</Label>
                        <Select
                          value={customerProductForm.category_id}
                          onValueChange={(value) => {
                            setCustomerProductForm({
                              ...customerProductForm,
                              category_id: value,
                              item_id: "", // Reset item selection when category changes
                            });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">اختر الفئة</SelectItem>
                            {Array.isArray(categories) &&
                              categories
                                .filter(
                                  (cat) =>
                                    cat.id &&
                                    cat.id !== "" &&
                                    cat.id !== null &&
                                    cat.id !== undefined,
                                )
                                .map((cat: any) => (
                                  <SelectItem
                                    key={cat.id}
                                    value={cat.id.toString()}
                                  >
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
                          onValueChange={(value) =>
                            setCustomerProductForm({
                              ...customerProductForm,
                              item_id: value,
                            })
                          }
                          disabled={
                            !customerProductForm.category_id ||
                            customerProductForm.category_id === "none"
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue
                              placeholder={
                                !customerProductForm.category_id ||
                                customerProductForm.category_id === "none"
                                  ? "اختر الفئة أولاً"
                                  : "اختر الصنف"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">اختر الصنف</SelectItem>
                            {Array.isArray(items) &&
                              items
                                .filter(
                                  (item: any) =>
                                    customerProductForm.category_id &&
                                    customerProductForm.category_id !==
                                      "none" &&
                                    item.category_id ===
                                      customerProductForm.category_id,
                                )
                                .filter(
                                  (item) =>
                                    item.id &&
                                    item.id !== "" &&
                                    item.id !== null &&
                                    item.id !== undefined,
                                )
                                .map((item: any) => (
                                  <SelectItem
                                    key={item.id}
                                    value={item.id.toString()}
                                  >
                                    {item.name_ar || item.name} ({item.code})
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* وصف الحجم والتثقيب */}
                    <div className="space-y-4">
                      <h4 className="text-lg sm:text-xl font-medium border-b border-gray-200 pb-2">
                        مواصفات المنتج
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="size_caption">
                            مقاس المنتج (يُحسب تلقائياً)
                          </Label>
                          <Input
                            id="size_caption"
                            value={customerProductForm.size_caption}
                            placeholder="سيتم إنشاؤه تلقائياً: العرض × الطول"
                            className="mt-1 bg-gray-50"
                            readOnly
                          />
                        </div>
                        <div>
                          <Label htmlFor="punching">التخريم</Label>
                          <Select
                            value={customerProductForm.punching}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                punching: value,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="اختر نوع التخريم" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="بدون">بدون</SelectItem>
                              <SelectItem value="علاقي">علاقي</SelectItem>
                              <SelectItem value="علاقي هوك">
                                علاقي هوك
                              </SelectItem>
                              <SelectItem value="بنانة">بنانة</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* الأبعاد والقياسات بالترتيب المطلوب */}
                    <div className="space-y-4">
                      <h4 className="text-lg sm:text-xl font-medium border-b border-gray-200 pb-2">
                        الأبعاد والقياسات
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="right_facing">
                            الجانب الأيمن (سم)
                          </Label>
                          <Input
                            id="right_facing"
                            type="number"
                            step="0.01"
                            value={customerProductForm.right_facing}
                            onChange={(e) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                right_facing: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="width">العرض (سم)</Label>
                          <Input
                            id="width"
                            type="number"
                            step="0.01"
                            value={customerProductForm.width}
                            onChange={(e) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                width: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="left_facing">
                            الجانب الأيسر (سم)
                          </Label>
                          <Input
                            id="left_facing"
                            type="number"
                            step="0.01"
                            value={customerProductForm.left_facing}
                            onChange={(e) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                left_facing: e.target.value,
                              })
                            }
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
                            onChange={(e) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                thickness: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* الطباعة والقطع */}
                    <div className="space-y-4">
                      <h4 className="text-lg sm:text-xl font-medium border-b border-gray-200 pb-2">
                        مواصفات الطباعة والقطع
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="printing_cylinder">
                            أسطوانة الطباعة
                          </Label>
                          <Select
                            value={customerProductForm.printing_cylinder}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                printing_cylinder: value,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="اختر الأسطوانة" />
                            </SelectTrigger>
                            <SelectContent>
                              {printingCylinderOptions
                                .filter(
                                  (option) =>
                                    option.value &&
                                    option.value !== "" &&
                                    option.value !== null &&
                                    option.value !== undefined,
                                )
                                .map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value.toString()}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="cutting_length_cm">
                            طول القطع (سم)
                          </Label>
                          <Input
                            id="cutting_length_cm"
                            type="number"
                            value={customerProductForm.cutting_length_cm}
                            onChange={(e) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                cutting_length_cm: e.target.value,
                              })
                            }
                            placeholder="يحسب تلقائياً أو أدخل يدوياً"
                            className="mt-1"
                            disabled={
                              customerProductForm.printing_cylinder !==
                              "بدون طباعة"
                            }
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-6 p-3 bg-gray-50 rounded-md">
                          <input
                            type="checkbox"
                            id="is_printed"
                            checked={customerProductForm.is_printed}
                            className="rounded w-4 h-4"
                            disabled
                          />
                          <Label
                            htmlFor="is_printed"
                            className="text-gray-600 text-sm"
                          >
                            منتج مطبوع (يتم تحديده تلقائياً)
                          </Label>
                        </div>
                        <div>
                          <Label htmlFor="cutting_unit">وحدة القطع</Label>
                          <Select
                            value={customerProductForm.cutting_unit}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                cutting_unit: value,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="اختر الوحدة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="كيلو">كيلو</SelectItem>
                              <SelectItem value="رول">رول</SelectItem>
                              <SelectItem value="باكت">باكت</SelectItem>
                              <SelectItem value="كرتون">كرتون</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* المواد والخامات */}
                    <div className="space-y-4">
                      <h4 className="text-lg sm:text-xl font-medium border-b border-gray-200 pb-2">
                        المواد والخامات
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="raw_material">المادة الخام</Label>
                          <Select
                            value={customerProductForm.raw_material}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                raw_material: value,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="اختر المادة الخام" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HDPE">HDPE</SelectItem>
                              <SelectItem value="LDPE">LDPE</SelectItem>
                              <SelectItem value="Regrind">Regrind</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="master_batch_id">
                            لون الماستر باتش
                          </Label>
                          <Select
                            value={customerProductForm.master_batch_id}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                master_batch_id: value,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="اختر اللون" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">بدون لون</SelectItem>
                              {masterBatchColors
                                .filter(
                                  (color) =>
                                    color.id &&
                                    color.id !== "" &&
                                    color.id !== null &&
                                    color.id !== undefined,
                                )
                                .map((color) => (
                                  <SelectItem
                                    key={color.id}
                                    value={color.id.toString()}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center"
                                        style={{
                                          backgroundColor: color.color,
                                          border:
                                            color.id === "transparent"
                                              ? "2px dashed #ccc"
                                              : `2px solid ${color.color}`,
                                        }}
                                      >
                                        {color.id === "transparent" && (
                                          <span className="text-xs text-gray-400">
                                            ⊘
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-medium">
                                        {color.name_ar}
                                      </span>
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
                      <h4 className="text-lg sm:text-xl font-medium border-b border-gray-200 pb-2">
                        الأوزان والكميات
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="unit_weight_kg">
                            وزن الوحدة (كغ)
                          </Label>
                          <Input
                            id="unit_weight_kg"
                            type="number"
                            step="0.001"
                            value={customerProductForm.unit_weight_kg}
                            onChange={(e) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                unit_weight_kg: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit_quantity">التعبئة</Label>
                          <Input
                            id="unit_quantity"
                            type="number"
                            value={customerProductForm.unit_quantity}
                            onChange={(e) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                unit_quantity: e.target.value,
                              })
                            }
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="package_weight_kg">
                            وزن العبوة (كغ) - محسوب تلقائياً
                          </Label>
                          <Input
                            id="package_weight_kg"
                            type="number"
                            step="0.01"
                            value={customerProductForm.package_weight_kg}
                            placeholder="وزن الوحدة × كمية الوحدة"
                            className="mt-1 bg-gray-50"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {/* الكليشيهات والتصاميم */}
                    <div className="space-y-4">
                      <h4 className="text-lg sm:text-xl font-medium border-b border-gray-200 pb-2">
                        الكليشيهات والتصاميم
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cliche_front_design">
                            تصميم الوجه الأمامي
                          </Label>
                          <div className="space-y-2">
                            <Input
                              id="cliche_front_design"
                              type="file"
                              accept="image/*,.jpeg,.jpg,.png,.gif,.bmp,.webp,.svg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Validate file size (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast({
                                      title: "حجم الملف كبير جداً",
                                      description:
                                        "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    const result = e.target?.result as string;
                                    setCustomerProductForm({
                                      ...customerProductForm,
                                      cliche_front_design: result,
                                      front_design_filename: file.name,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="mt-1"
                            />
                            {customerProductForm.cliche_front_design && (
                              <div className="relative">
                                <img
                                  src={customerProductForm.cliche_front_design}
                                  alt="التصميم الأمامي"
                                  className="max-w-full max-h-32 object-contain border rounded-md bg-gray-50"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0"
                                  onClick={() =>
                                    setCustomerProductForm({
                                      ...customerProductForm,
                                      cliche_front_design: "",
                                      front_design_filename: "",
                                    })
                                  }
                                >
                                  ✕
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="cliche_back_design">
                            تصميم الوجه الخلفي
                          </Label>
                          <div className="space-y-2">
                            <Input
                              id="cliche_back_design"
                              type="file"
                              accept="image/*,.jpeg,.jpg,.png,.gif,.bmp,.webp,.svg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Validate file size (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast({
                                      title: "حجم الملف كبير جداً",
                                      description:
                                        "يجب أن يكون حجم الصورة أقل من 5 ميجابايت",
                                      variant: "destructive",
                                    });
                                    return;
                                  }

                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    const result = e.target?.result as string;
                                    setCustomerProductForm({
                                      ...customerProductForm,
                                      cliche_back_design: result,
                                      back_design_filename: file.name,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="mt-1"
                            />
                            {customerProductForm.cliche_back_design && (
                              <div className="relative">
                                <img
                                  src={customerProductForm.cliche_back_design}
                                  alt="التصميم الخلفي"
                                  className="max-w-full max-h-32 object-contain border rounded-md bg-gray-50"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0"
                                  onClick={() =>
                                    setCustomerProductForm({
                                      ...customerProductForm,
                                      cliche_back_design: "",
                                      back_design_filename: "",
                                    })
                                  }
                                >
                                  ✕
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ملاحظات */}
                    <div>
                      <Label htmlFor="notes" className="text-base">
                        ملاحظات
                      </Label>
                      <textarea
                        id="notes"
                        value={customerProductForm.notes}
                        onChange={(e) =>
                          setCustomerProductForm({
                            ...customerProductForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="أي ملاحظات إضافية حول المنتج..."
                        className="mt-2 w-full p-3 border border-gray-300 rounded-md resize-none text-right"
                        rows={4}
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        // Convert string fields to numbers for validation
                        const processedData = {
                          ...customerProductForm,
                          cutting_length_cm:
                            customerProductForm.cutting_length_cm
                              ? parseInt(customerProductForm.cutting_length_cm)
                              : undefined,
                          unit_quantity: customerProductForm.unit_quantity
                            ? parseInt(customerProductForm.unit_quantity)
                            : undefined,
                          width: customerProductForm.width
                            ? parseFloat(customerProductForm.width)
                            : undefined,
                          left_facing: customerProductForm.left_facing
                            ? parseFloat(customerProductForm.left_facing)
                            : undefined,
                          right_facing: customerProductForm.right_facing
                            ? parseFloat(customerProductForm.right_facing)
                            : undefined,
                          thickness: customerProductForm.thickness
                            ? parseFloat(customerProductForm.thickness)
                            : undefined,
                          unit_weight_kg: customerProductForm.unit_weight_kg
                            ? parseFloat(customerProductForm.unit_weight_kg)
                            : undefined,
                          package_weight_kg:
                            customerProductForm.package_weight_kg
                              ? parseFloat(
                                  customerProductForm.package_weight_kg,
                                )
                              : undefined,
                        };

                        if (editingItem) {
                          updateCustomerProductMutation.mutate({
                            id: editingItem.id,
                            data: processedData,
                          });
                        } else {
                          createCustomerProductMutation.mutate(processedData);
                        }
                      }}
                      disabled={
                        createCustomerProductMutation.isPending ||
                        updateCustomerProductMutation.isPending
                      }
                      className="w-full sm:w-auto order-1 sm:order-2"
                    >
                      {createCustomerProductMutation.isPending ||
                      updateCustomerProductMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : editingItem ? (
                        "تحديث"
                      ) : (
                        "حفظ"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Locations Add/Edit Dialog */}
            {selectedTab === "locations" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث الموقع" : "إضافة موقع جديد"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem
                        ? "تحديث بيانات الموقع المحدد"
                        : "إضافة موقع جديد لتخزين المواد والمنتجات"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={locationForm.name_ar}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="اسم الموقع بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={locationForm.name}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              name: e.target.value,
                            })
                          }
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
                          onValueChange={(value) =>
                            setLocationForm({ ...locationForm, type: value })
                          }
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
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              coordinates: e.target.value,
                            })
                          }
                          placeholder="lat,lng"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateLocationMutation.mutate({
                            id: editingItem.id,
                            data: locationForm,
                          });
                        } else {
                          createLocationMutation.mutate(locationForm);
                        }
                      }}
                      disabled={
                        createLocationMutation.isPending ||
                        updateLocationMutation.isPending
                      }
                    >
                      {createLocationMutation.isPending ||
                      updateLocationMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : editingItem ? (
                        "تحديث"
                      ) : (
                        "حفظ"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Machines Add/Edit Dialog */}
            {selectedTab === "machines" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث الماكينة" : "إضافة ماكينة جديدة"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem
                        ? "تحديث بيانات الماكينة المحددة"
                        : "إضافة ماكينة جديدة إلى خط الإنتاج"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">الاسم بالعربية *</Label>
                        <Input
                          id="name_ar"
                          value={machineForm.name_ar}
                          onChange={(e) =>
                            setMachineForm({
                              ...machineForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="اسم الماكينة بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">الاسم بالإنجليزية</Label>
                        <Input
                          id="name"
                          value={machineForm.name}
                          onChange={(e) =>
                            setMachineForm({
                              ...machineForm,
                              name: e.target.value,
                            })
                          }
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
                          onValueChange={(value) =>
                            setMachineForm({ ...machineForm, type: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="extruder">فيلم</SelectItem>
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
                          onValueChange={(value) =>
                            setMachineForm({
                              ...machineForm,
                              section_id: value,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون قسم</SelectItem>
                            {Array.isArray(sections) &&
                              sections
                                .filter(
                                  (section) =>
                                    section.id &&
                                    section.id !== "" &&
                                    section.id !== null &&
                                    section.id !== undefined,
                                )
                                .map((section: any) => (
                                  <SelectItem
                                    key={section.id}
                                    value={section.id.toString()}
                                  >
                                    {section.name_ar || section.name} (
                                    {section.id})
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* حالة الماكينة */}
                    <div>
                      <Label htmlFor="status">حالة الماكينة</Label>
                      <Select
                        value={machineForm.status}
                        onValueChange={(value) =>
                          setMachineForm({
                            ...machineForm,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger className="mt-1" data-testid="select-machine-status">
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">نشطة</SelectItem>
                          <SelectItem value="maintenance">صيانة</SelectItem>
                          <SelectItem value="down">متوقفة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* قدرة الإنتاج حسب الحجم */}
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-sm font-medium mb-3">قدرة الإنتاج (كجم/ساعة)</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="capacity_small">حجم صغير</Label>
                          <Input
                            id="capacity_small"
                            type="number"
                            step="0.01"
                            value={machineForm.capacity_small_kg_per_hour}
                            onChange={(e) =>
                              setMachineForm({
                                ...machineForm,
                                capacity_small_kg_per_hour: e.target.value,
                              })
                            }
                            placeholder="كجم/ساعة"
                            className="mt-1"
                            data-testid="input-capacity-small"
                          />
                        </div>
                        <div>
                          <Label htmlFor="capacity_medium">حجم وسط</Label>
                          <Input
                            id="capacity_medium"
                            type="number"
                            step="0.01"
                            value={machineForm.capacity_medium_kg_per_hour}
                            onChange={(e) =>
                              setMachineForm({
                                ...machineForm,
                                capacity_medium_kg_per_hour: e.target.value,
                              })
                            }
                            placeholder="كجم/ساعة"
                            className="mt-1"
                            data-testid="input-capacity-medium"
                          />
                        </div>
                        <div>
                          <Label htmlFor="capacity_large">حجم كبير</Label>
                          <Input
                            id="capacity_large"
                            type="number"
                            step="0.01"
                            value={machineForm.capacity_large_kg_per_hour}
                            onChange={(e) =>
                              setMachineForm({
                                ...machineForm,
                                capacity_large_kg_per_hour: e.target.value,
                              })
                            }
                            placeholder="كجم/ساعة"
                            className="mt-1"
                            data-testid="input-capacity-large"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          updateMachineMutation.mutate({
                            id: editingItem.id,
                            data: machineForm,
                          });
                        } else {
                          createMachineMutation.mutate(machineForm);
                        }
                      }}
                      disabled={
                        createMachineMutation.isPending ||
                        updateMachineMutation.isPending
                      }
                    >
                      {createMachineMutation.isPending ||
                      updateMachineMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : editingItem ? (
                        "تحديث"
                      ) : (
                        "حفظ"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Users Add/Edit Dialog */}
            {selectedTab === "users" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "تحديث المستخدم" : "إضافة مستخدم جديد"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem
                        ? "تحديث بيانات المستخدم المحدد"
                        : "إضافة مستخدم جديد إلى النظام"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="display_name_ar">
                          الاسم بالعربية *
                        </Label>
                        <Input
                          id="display_name_ar"
                          value={userForm.display_name_ar}
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              display_name_ar: e.target.value,
                            })
                          }
                          placeholder="اسم المستخدم بالعربية"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="display_name">الاسم بالإنجليزية</Label>
                        <Input
                          id="display_name"
                          value={userForm.display_name}
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              display_name: e.target.value,
                            })
                          }
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
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              username: e.target.value,
                            })
                          }
                          placeholder="username"
                          className="mt-1"
                          data-testid="input-username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">
                          كلمة المرور {editingItem ? "(اتركها فارغة إذا لم ترد تغييرها)" : "*"}
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={userForm.password}
                            onChange={(e) =>
                              setUserForm({
                                ...userForm,
                                password: e.target.value,
                              })
                            }
                            placeholder={editingItem ? "أدخل كلمة مرور جديدة" : "أدخل كلمة المرور"}
                            className="mt-1 pr-10"
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="role_id">الدور</Label>
                        <Select
                          value={userForm.role_id}
                          onValueChange={(value) =>
                            setUserForm({ ...userForm, role_id: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الدور" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون دور</SelectItem>
                            {Array.isArray(roles) &&
                              roles
                                .filter(
                                  (role) =>
                                    role.id &&
                                    role.id !== "" &&
                                    role.id !== null &&
                                    role.id !== undefined,
                                )
                                .map((role: any) => (
                                  <SelectItem
                                    key={role.id}
                                    value={`ROLE0${role.id}`}
                                  >
                                    {role.name_ar || role.name}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="section_id">القسم</Label>
                        <Select
                          value={userForm.section_id}
                          onValueChange={(value) =>
                            setUserForm({ ...userForm, section_id: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">بدون قسم</SelectItem>
                            {Array.isArray(sections) &&
                              sections
                                .filter(
                                  (section) =>
                                    section.id &&
                                    section.id !== "" &&
                                    section.id !== null &&
                                    section.id !== undefined,
                                )
                                .map((section: any) => (
                                  <SelectItem
                                    key={section.id}
                                    value={section.id.toString()}
                                  >
                                    {section.name_ar || section.name} (
                                    {section.id})
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">الحالة</Label>
                        <Select
                          value={userForm.status}
                          onValueChange={(value) =>
                            setUserForm({ ...userForm, status: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">نشط</SelectItem>
                            <SelectItem value="inactive">غير نشط</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingItem) {
                          // When updating, only send password if it's not empty
                          const { password, ...restData } = userForm;
                          const updateData = password && password.trim() !== "" 
                            ? userForm 
                            : restData;
                          updateUserMutation.mutate({
                            id: editingItem.id,
                            data: updateData,
                          });
                        } else {
                          // When creating, password is required
                          if (!userForm.password || userForm.password.trim() === "") {
                            toast({
                              title: "خطأ",
                              description: "كلمة المرور مطلوبة عند إنشاء مستخدم جديد",
                              variant: "destructive",
                            });
                            return;
                          }
                          createUserMutation.mutate(userForm);
                        }
                      }}
                      disabled={
                        createUserMutation.isPending ||
                        updateUserMutation.isPending
                      }
                      data-testid="button-save-user"
                    >
                      {createUserMutation.isPending ||
                      updateUserMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingItem ? "جاري التحديث..." : "جاري الحفظ..."}
                        </>
                      ) : editingItem ? (
                        "تحديث"
                      ) : (
                        "حفظ"
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
