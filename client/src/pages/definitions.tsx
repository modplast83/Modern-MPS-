import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Remove aggressive cache clearing that causes unnecessary refetches
  // React Query's default staleTime and gcTime will handle cache freshness automatically

  const [selectedTab, setSelectedTab] = useState("customers");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickSearch, setQuickSearch] = useState("");

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
      (mb) =>{t('pages.definitions.mb.id_===_product.master_batch_id,_);_const_printcontent_=_`')}<!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>{t('pages.definitions.تفاصيل_منتج_العميل')}</title>
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
        <h1>{t('pages.definitions.تفاصيل_منتج_العميل')}</h1>
        <p>{t('pages.definitions.نظام_إدارة_مصنع_الأكياس_البلاستيكية')}</p>
        <p>رقم المنتج: ${product.id}</p>
      </div>
      
      <div class="section">
        <h3>{t('pages.definitions.معلومات_أساسية')}</h3>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.اسم_العميل:')}</span>
          <span class="detail-value">${customerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.الفئة:')}</span>
          <span class="detail-value">${categoryName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.الصنف:')}</span>
          <span class="detail-value">${itemName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.وصف_المقاس:')}</span>
          <span class="detail-value">${product.size_caption || "-"}</span>
        </div>
      </div>

      <div class="section">
        <h3>{t('pages.definitions.المقاسات_والأبعاد')}</h3>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.العرض_(سم):')}</span>
          <span class="detail-value">${product.width || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.الوجه_الأيسر_(سم):')}</span>
          <span class="detail-value">${product.left_facing || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.الوجه_الأيمن_(سم):')}</span>
          <span class="detail-value">${product.right_facing || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.السمك_(ميكرون):')}</span>
          <span class="detail-value">${product.thickness || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.طول_القطع_(سم):')}</span>
          <span class="detail-value">${product.cutting_length_cm || "-"}</span>
        </div>
      </div>

      <div class="section">
        <h3>{t('pages.definitions.الطباعة_والإنتاج')}</h3>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.اسطوانة_الطباعة:')}</span>
          <span class="detail-value">${product.printing_cylinder || "بدون طباعة"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.هل_مطبوع:')}</span>
          <span class="detail-value">${product.is_printed ? "نعم" : "لا"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.المادة_الخام:')}</span>
          <span class="detail-value">${product.raw_material || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.الماستر_باتش:')}</span>
          <span class="detail-value">
            ${
              masterBatchColor
                ? `<span class="color-box" style="background-color: ${masterBatchColor.color}; ${masterBatchColor.color === "transparent" ? "background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%); background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0px;" : ""}"></span>${masterBatchColor.name_ar}`
                : product.master_batch_id || "-"
            }
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.التخريم:')}</span>
          <span class="detail-value">${product.punching || "-"}</span>
        </div>
      </div>

      <div class="section">
        <h3>{t('pages.definitions.الوزن_والكميات')}</h3>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.وحدة_القطع:')}</span>
          <span class="detail-value">${product.cutting_unit || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.وزن_الوحدة_(كيلو):')}</span>
          <span class="detail-value">${product.unit_weight_kg || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.الكمية_لكل_وحدة:')}</span>
          <span class="detail-value">${product.unit_quantity || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.وزن_التعبئة_(كيلو):')}</span>
          <span class="detail-value">${product.package_weight_kg || "-"}</span>
        </div>
      </div>

      <div class="section">
        <h3>{t('pages.definitions.التصاميم_والملاحظات')}</h3>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.تصميم_الواجهة_الأمامية:')}</span>
          <span class="detail-value">${product.cliche_front_design || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.تصميم_الواجهة_الخلفية:')}</span>
          <span class="detail-value">${product.cliche_back_design || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.ملاحظات:')}</span>
          <span class="detail-value">${product.notes || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('pages.definitions.الحالة:')}</span>
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
  const sizeCaptionTimer = useRef<NodeJS.Timeout | null>{t('pages.definitions.(null);_const_packageweighttimer_=_useref')}<NodeJS.Timeout | null>(null);

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
  const getFilteredCustomers = () =>
    filterData(customers as any[], [
      "name",
      "name_ar",
      "phone",
      "email",
      "address",
      "id",
    ]);
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
        return aId - bId;
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
      <div className={t("pages.definitions.name.flex_items_center_justify_between_px_6_py_3_bg_white_border_t_border_gray_200")}>
        <div className={t("pages.definitions.name.flex_flex_1_justify_between_sm_hidden")}>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >{t('pages.definitions.السابق')}</Button>
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >{t('pages.definitions.التالي')}</Button>
        </div>
        <div className={t("pages.definitions.name.hidden_sm_flex_sm_flex_1_sm_items_center_sm_justify_between")}>
          <div>
            <p className={t("pages.definitions.name.text_sm_text_gray_700")}>{t('pages.definitions.عرض')}<span className={t("pages.definitions.name.font_medium")}>{startItem}</span> إلى{" "}
              <span className={t("pages.definitions.name.font_medium")}>{endItem}</span> من{" "}
              <span className={t("pages.definitions.name.font_medium")}>{totalItems}</span>{t('pages.definitions.نتيجة')}</p>
          </div>
          <div>
            <nav
              className={t("pages.definitions.name.inline_flex_space_x_px_rounded_md_shadow_sm")}
              aria-label="{t('pages.definitions.label.{t('pages.definitions.aria-label.pagination')}')}"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={t("pages.definitions.name.rounded_l_md")}
              >
                <ChevronLeft className={t("pages.definitions.name.h_4_w_4")} />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >{t('pages.definitions.=_currentpage_-_2_&&_page')}<= currentPage + 2)
                  );
                })
                .map((page, index, array) => {
                  const showEllipsis =
                    index >{t('pages.definitions.0_&&_array[index_-_1]_!==_page_-_1;_return_(')}<div key={page}>
                      {showEllipsis && (
                        <span className={t("pages.definitions.name.relative_inline_flex_items_center_px_4_py_2_text_sm_font_medium_text_gray_700")}>{t('pages.definitions....')}</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className={t("pages.definitions.name.min_w_40px_")}
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
                className={t("pages.definitions.name.rounded_r_md")}
              >
                <ChevronRight className={t("pages.definitions.name.h_4_w_4")} />
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
    <div className={t("pages.definitions.name.min_h_screen_bg_gray_50")}>
      <Header />
      <div className={t("pages.definitions.name.flex_min_h_screen")}>
        <Sidebar />
        <MobileNav />
        <main
          className={t("pages.definitions.name.flex_1_lg_mr_64_p_4_lg_p_6")}
          style={{ marginRight: "16rem" }}
        >
          <div className={t("pages.definitions.name.w_full_space_y_4")}>
            <div className={t("pages.definitions.name.flex_items_center_justify_between_mb_6")}>
              <h1 className={t("pages.definitions.name.text_2xl_lg_text_3xl_font_bold_text_gray_900")}>{t('pages.definitions.التعريفات_الأساسية')}</h1>
            </div>

            {/* Search and Filter Controls */}
            <div className={t("pages.definitions.name.flex_flex_col_sm_flex_row_gap_4_items_center_justify_between_bg_white_p_4_rounded_lg_shadow_sm_border_border_gray_200")}>
              <div className={t("pages.definitions.name.flex_items_center_gap_4")}>
                <div className={t("pages.definitions.name.relative")}>
                  <Search className={t("pages.definitions.name.absolute_right_3_top_1_2_transform_translate_y_1_2_text_gray_400_w_4_h_4")} />
                  <Input
                    type="text"
                    placeholder="{t('pages.definitions.placeholder.البحث_السريع...')}"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className={t("pages.definitions.name.pr_10")}
                  />
                </div>
                <div className={t("pages.definitions.name.flex_items_center_gap_2")}>
                  <Filter className={t("pages.definitions.name.w_4_h_4_text_gray_400")} />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className={t("pages.definitions.name.w_40")}>
                      <SelectValue placeholder="{t('pages.definitions.placeholder.فلترة_الحالة')}" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('pages.definitions.جميع_الحالات')}</SelectItem>
                      <SelectItem value="active">{t('pages.definitions.نشط')}</SelectItem>
                      <SelectItem value="inactive">{t('pages.definitions.غير_نشط')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className={t("pages.definitions.name.w_full")}>
              <Tabs
                value={selectedTab}
                onValueChange={setSelectedTab}
                className={t("pages.definitions.name.space_y_4_w_full")}
              >
                <TabsList
                  className={t("pages.definitions.name.grid_grid_cols_4_lg_grid_cols_8_w_full_h_auto_p_1_bg_white_rounded_lg_border_border_gray_200_shadow_sm_gap_1")}
                  dir="rtl"
                >
                  <TabsTrigger
                    value="customers"
                    className={t("pages.definitions.name.data_state_active_bg_white_data_state_active_text_blue_600_text_gray_600_hover_text_blue_600_px_3_py_2_text_sm_font_medium_transition_all_duration_200_rounded_md_min_w_0_flex_1")}
                  >{t('pages.definitions.العملاء')}</TabsTrigger>
                  <TabsTrigger
                    value="sections"
                    className={t("pages.definitions.name.data_state_active_bg_white_data_state_active_text_blue_600_text_gray_600_hover_text_blue_600_px_3_py_2_text_sm_font_medium_transition_all_duration_200_rounded_md_min_w_0_flex_1")}
                  >{t('pages.definitions.الأقسام')}</TabsTrigger>
                  <TabsTrigger
                    value="categories"
                    className={t("pages.definitions.name.data_state_active_bg_white_data_state_active_text_blue_600_text_gray_600_hover_text_blue_600_px_3_py_2_text_sm_font_medium_transition_all_duration_200_rounded_md_min_w_0_flex_1")}
                  >{t('pages.definitions.الفئات')}</TabsTrigger>
                  <TabsTrigger
                    value="items"
                    className={t("pages.definitions.name.data_state_active_bg_white_data_state_active_text_blue_600_text_gray_600_hover_text_blue_600_px_3_py_2_text_sm_font_medium_transition_all_duration_200_rounded_md_min_w_0_flex_1")}
                  >{t('pages.definitions.الأصناف')}</TabsTrigger>
                  <TabsTrigger
                    value="customer-products"
                    className={t("pages.definitions.name.data_state_active_bg_white_data_state_active_text_blue_600_text_gray_600_hover_text_blue_600_px_2_py_2_text_xs_font_medium_transition_all_duration_200_rounded_md_min_w_0_flex_1")}
                  >{t('pages.definitions.منتجات_العملاء')}</TabsTrigger>
                  <TabsTrigger
                    value="locations"
                    className={t("pages.definitions.name.data_state_active_bg_white_data_state_active_text_blue_600_text_gray_600_hover_text_blue_600_px_3_py_2_text_sm_font_medium_transition_all_duration_200_rounded_md_min_w_0_flex_1")}
                  >{t('pages.definitions.المواقع')}</TabsTrigger>
                  <TabsTrigger
                    value="machines"
                    className={t("pages.definitions.name.data_state_active_bg_white_data_state_active_text_blue_600_text_gray_600_hover_text_blue_600_px_3_py_2_text_sm_font_medium_transition_all_duration_200_rounded_md_min_w_0_flex_1")}
                  >{t('pages.definitions.المكائن')}</TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className={t("pages.definitions.name.data_state_active_bg_white_data_state_active_text_blue_600_text_gray_600_hover_text_blue_600_px_3_py_2_text_sm_font_medium_transition_all_duration_200_rounded_md_min_w_0_flex_1")}
                  >{t('pages.definitions.المستخدمين')}</TabsTrigger>
                </TabsList>

                {/* Customers Tab */}
                <TabsContent value="customers" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <Building2 className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.إدارة_العملاء')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("customers");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_عميل')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {customersLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_العربي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_الإنجليزي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الهاتف')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.المدينة')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                      className={t("pages.definitions.name.hover_bg_gray_50")}
                                    >
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                        {customer.id}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {customer.name_ar || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {customer.name || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {customer.phone || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {customer.city || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                        <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
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
                                            <Edit className={t("pages.definitions.name.w_4_h_4")} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>{t('pages.definitions.))_)_:_(')}<tr>
                                    <td
                                      colSpan={6}
                                      className={t("pages.definitions.name.px_6_py_4_text_center_text_gray_500")}
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
                <TabsContent value="categories" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <Package className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.إدارة_الفئات')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("categories");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_فئة')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {categoriesLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_العربي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_الإنجليزي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الكود')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                      className={t("pages.definitions.name.hover_bg_gray_50")}
                                    >
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                        {category.id}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {category.name_ar || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {category.name || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {category.code || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                        <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
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
                                            <Edit className={t("pages.definitions.name.w_4_h_4")} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>{t('pages.definitions.))_)_:_(')}<tr>
                                    <td
                                      colSpan={5}
                                      className={t("pages.definitions.name.px_6_py_4_text_center_text_gray_500")}
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
                <TabsContent value="sections" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <Cog className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.إدارة_الأقسام')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("sections");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_قسم')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {sectionsLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_العربي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_الإنجليزي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الوصف')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                      className={t("pages.definitions.name.hover_bg_gray_50")}
                                    >
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                        {section.id}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {section.name_ar || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {section.name || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {section.description || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                        <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
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
                                            <Edit className={t("pages.definitions.name.w_4_h_4")} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>{t('pages.definitions.))_)_:_(')}<tr>
                                    <td
                                      colSpan={5}
                                      className={t("pages.definitions.name.px_6_py_8_text_center_text_gray_500")}
                                    >{t('pages.definitions.لا_توجد_أقسام_مطابقة_للبحث')}</td>
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
                <TabsContent value="items" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <Package className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.إدارة_الأصناف')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("items");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_صنف')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {itemsLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_العربي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_الإنجليزي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الفئة')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                      className={t("pages.definitions.name.hover_bg_gray_50")}
                                    >
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                        {item.id}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {item.name_ar || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {item.name || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {item.category_id || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                        <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
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
                                            <Edit className={t("pages.definitions.name.w_4_h_4")} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>{t('pages.definitions.))_)_:_(')}<tr>
                                    <td
                                      colSpan={5}
                                      className={t("pages.definitions.name.px_6_py_8_text_center_text_gray_500")}
                                    >{t('pages.definitions.لا_توجد_أصناف_مطابقة_للبحث')}</td>
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
                <TabsContent value="customer-products" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <Package className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.منتجات_العملاء')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("customer-products");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_منتج')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {customerProductsLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.اسم_العميل')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.اسم_الصنف')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.وصف_المقاس')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الطباعة/القطع')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.المادة_الخام')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الماستر_باتش')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.التخريم')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الوحدة')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.وزن_التعبئة')}</th>
                                <th className={t("pages.definitions.name.px_3_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                            (i: any) =>{t('pages.definitions.i.id_===_product.item_id,_)_:_null;_return_(')}<tr
                                          key={product.id}
                                          className={t("pages.definitions.name.hover_bg_gray_50")}
                                        >
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                            {product.id}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_text_sm_text_gray_900_text_center")}>
                                            <div className={t("pages.definitions.name.flex_flex_col_items_center")}>
                                              <span className={t("pages.definitions.name.font_medium")}>
                                                {customer?.name_ar ||
                                                  customer?.name ||
                                                  "-"}
                                              </span>
                                              <span className={t("pages.definitions.name.text_xs_text_gray_500")}>
                                                {customer?.name || "-"}
                                              </span>
                                            </div>
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_text_gray_900_text_center")}>
                                            {item?.name_ar || item?.name || "-"}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_text_gray_900_text_center")}>
                                            {product.size_caption || "-"}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_text_gray_900_text_center")}>
                                            {product.is_printed
                                              ? product.printing_cylinder ||
                                                "بدون طباعة"
                                              : product.cutting_length_cm
                                                ? `${formatNumber(parseFloat(product.cutting_length_cm))} سم`
                                                : "-"}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_text_gray_900_text_center")}>
                                            {product.raw_material || "-"}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_text_gray_900_text_center")}>
                                            {(() => {
                                              const masterBatchColor =
                                                masterBatchColors.find(
                                                  (mb) =>{t('pages.definitions.mb.id_===_product.master_batch_id,_);_return_masterbatchcolor_?_(')}<div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
                                                  <div
                                                    className={t("pages.definitions.name.w_6_h_6_rounded_full_border_2_border_gray_300_shadow_sm")}
                                                    style={{
                                                      backgroundColor:
                                                        masterBatchColor.color,
                                                    }}
                                                    title={
                                                      masterBatchColor.name
                                                    }
                                                  ></div>
                                                  <span className={t("pages.definitions.name.text_xs_font_medium_text_gray_700")}>
                                                    {masterBatchColor.name_ar}
                                                  </span>
                                                </div>
                                              ) : (
                                                product.master_batch_id || "-"
                                              );
                                            })()}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_text_gray_900_text_center")}>
                                            {product.punching || "-"}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_text_gray_900_text_center")}>
                                            {product.cutting_unit || "-"}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_text_gray_900_text_center")}>
                                            {product.package_weight_kg
                                              ? `${formatNumber(parseFloat(product.package_weight_kg))} كغ`
                                              : "-"}
                                          </td>
                                          <td className={t("pages.definitions.name.px_3_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                            <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_1")}>
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
                                                title="{t('pages.definitions.title.{t('pages.definitions.title.تحديث')}')}"
                                              >
                                                <Edit className={t("pages.definitions.name.w_3_h_3")} />
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
                                                title="{t('pages.definitions.title.{t('pages.definitions.title.استنساخ')}')}"
                                                className={t("pages.definitions.name.text_blue_600_hover_text_blue_700_hover_bg_blue_50")}
                                              >
                                                <Copy className={t("pages.definitions.name.w_3_h_3")} />
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
                                                title="{t('pages.definitions.title.{t('pages.definitions.title.طباعة')}')}"
                                                className={t("pages.definitions.name.text_green_600_hover_text_green_700_hover_bg_green_50")}
                                              >
                                                <Printer className={t("pages.definitions.name.w_3_h_3")} />
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
                                                title="{t('pages.definitions.title.{t('pages.definitions.title.حذف')}')}"
                                                className={t("pages.definitions.name.text_red_600_hover_text_red_700_hover_bg_red_50")}
                                                disabled={
                                                  deleteCustomerProductMutation.isPending
                                                }
                                              >
                                                {deleteCustomerProductMutation.isPending ? (
                                                  <div className={t("pages.definitions.name.animate_spin_rounded_full_h_3_w_3_border_b_2_border_red_600")}></div>{t('pages.definitions.)_:_(')}<Trash2 className={t("pages.definitions.name.w_3_h_3")} />
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
                                      className={t("pages.definitions.name.px_6_py_8_text_center_text_gray_500")}
                                    >{t('pages.definitions.لا_توجد_منتجات_مطابقة_للبحث')}</td>
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
                <TabsContent value="locations" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <MapPin className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.إدارة_المواقع')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("locations");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_موقع')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {locationsLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_العربي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_الإنجليزي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.النوع')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                      className={t("pages.definitions.name.hover_bg_gray_50")}
                                    >
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                        {location.id}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {location.name_ar || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {location.name || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {location.type || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                        <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
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
                                            <Edit className={t("pages.definitions.name.w_4_h_4")} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>{t('pages.definitions.))_)_:_(')}<tr>
                                    <td
                                      colSpan={5}
                                      className={t("pages.definitions.name.px_6_py_8_text_center_text_gray_500")}
                                    >{t('pages.definitions.لا_توجد_مواقع_مطابقة_للبحث')}</td>
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
                <TabsContent value="machines" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <Settings className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.إدارة_الماكينات')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("machines");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_ماكينة')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {machinesLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_العربي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_الإنجليزي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.النوع')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.نشطة')}</th>
                                <th className={t("pages.definitions.name.px_4_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.قدرة_صغير')}<br />
                                  <span className={t("pages.definitions.name.text_10px_font_normal")}>{t('pages.definitions.(كجم/ساعة)')}</span>
                                </th>
                                <th className={t("pages.definitions.name.px_4_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.قدرة_وسط')}<br />
                                  <span className={t("pages.definitions.name.text_10px_font_normal")}>{t('pages.definitions.(كجم/ساعة)')}</span>
                                </th>
                                <th className={t("pages.definitions.name.px_4_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.قدرة_كبير')}<br />
                                  <span className={t("pages.definitions.name.text_10px_font_normal")}>{t('pages.definitions.(كجم/ساعة)')}</span>
                                </th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                      className={t("pages.definitions.name.hover_bg_gray_50")}
                                    >
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                        {machine.id}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {machine.name_ar || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {machine.name || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {machine.type || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_center")} data-testid={`text-status-${machine.id}`}>
                                        <Badge 
                                          variant={machine.status === "active" ? "default" : "secondary"}
                                          className={machine.status === "active" ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}
                                        >
                                          {machine.status === "active" ? "نشطة" : machine.status === "maintenance" ? "صيانة" : "متوقفة"}
                                        </Badge>
                                      </td>
                                      <td className={t("pages.definitions.name.px_4_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")} data-testid={`text-capacity-small-${machine.id}`}>
                                        {machine.capacity_small_kg_per_hour ? formatNumber(parseFloat(machine.capacity_small_kg_per_hour)) : "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_4_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")} data-testid={`text-capacity-medium-${machine.id}`}>
                                        {machine.capacity_medium_kg_per_hour ? formatNumber(parseFloat(machine.capacity_medium_kg_per_hour)) : "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_4_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")} data-testid={`text-capacity-large-${machine.id}`}>
                                        {machine.capacity_large_kg_per_hour ? formatNumber(parseFloat(machine.capacity_large_kg_per_hour)) : "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                        <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
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
                                            <Edit className={t("pages.definitions.name.w_4_h_4")} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>{t('pages.definitions.))_)_:_(')}<tr>
                                    <td
                                      colSpan={9}
                                      className={t("pages.definitions.name.px_6_py_8_text_center_text_gray_500")}
                                    >{t('pages.definitions.لا_توجد_ماكينات_مطابقة_للبحث')}</td>
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
                <TabsContent value="users" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <User className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.إدارة_المستخدمين')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("users");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_مستخدم')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {usersLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.اسم_المستخدم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.القسم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الدور')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                      className={t("pages.definitions.name.hover_bg_gray_50")}
                                    >
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                        {user.id}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {user.username || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {user.display_name || user.name || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
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
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
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
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                        <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
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
                                            <Edit className={t("pages.definitions.name.w_4_h_4")} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>{t('pages.definitions.))_)_:_(')}<tr>
                                    <td
                                      colSpan={5}
                                      className={t("pages.definitions.name.px_6_py_8_text_center_text_gray_500")}
                                    >{t('pages.definitions.لا_توجد_مستخدمين_مطابقة_للبحث')}</td>
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
                <TabsContent value="locations" className={t("pages.definitions.name.space_y_6")}>
                  <Card>
                    <CardHeader>
                      <div className={t("pages.definitions.name.flex_items_center_justify_between")}>
                        <CardTitle className={t("pages.definitions.name.flex_items_center_gap_2")}>
                          <MapPin className={t("pages.definitions.name.w_5_h_5")} />{t('pages.definitions.إدارة_المواقع')}</CardTitle>
                        <Button
                          onClick={() => {
                            resetForm();
                            setSelectedTab("locations");
                            setIsDialogOpen(true);
                          }}
                        >
                          <Plus className={t("pages.definitions.name.w_4_h_4_mr_2")} />{t('pages.definitions.إضافة_موقع')}</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {locationsLoading ? (
                        <div className={t("pages.definitions.name.text_center_py_8")}>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                          <p className={t("pages.definitions.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.definitions.جاري_التحميل...')}</p>
                        </div>{t('pages.definitions.)_:_(')}<div className={t("pages.definitions.name.overflow_x_auto")}>
                          <table className={t("pages.definitions.name.min_w_full_divide_y_divide_gray_200")}>
                            <thead className={t("pages.definitions.name.bg_gray_50")}>
                              <tr>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الرقم')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_العربي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الاسم_الإنجليزي')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.الإحداثيات')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.نطاق_التسامح')}</th>
                                <th className={t("pages.definitions.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.definitions.العمليات')}</th>
                              </tr>
                            </thead>
                            <tbody className={t("pages.definitions.name.bg_white_divide_y_divide_gray_200")}>
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
                                      className={t("pages.definitions.name.hover_bg_gray_50")}
                                    >
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                        {location.id}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {location.name_ar || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {location.name || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {location.coordinates || "-"}
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                        {location.tolerance_range || "-"} متر
                                      </td>
                                      <td className={t("pages.definitions.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_center")}>
                                        <div className={t("pages.definitions.name.flex_items_center_justify_center_gap_2")}>
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
                                            <Edit className={t("pages.definitions.name.w_4_h_4")} />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>{t('pages.definitions.))_)_:_(')}<tr>
                                    <td
                                      colSpan={6}
                                      className={t("pages.definitions.name.px_6_py_8_text_center_text_gray_500")}
                                    >{t('pages.definitions.لا_توجد_مواقع_مطابقة_للبحث')}</td>
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
                  className={t("pages.definitions.name.max_w_4xl_max_h_90vh_overflow_y_auto")}
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
                  <div className={t("pages.definitions.name.grid_gap_4_py_4")}>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="name_ar">{t('pages.definitions.الاسم_بالعربية_*')}</Label>
                        <Input
                          id="name_ar"
                          value={customerForm.name_ar}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.اسم_العميل_بالعربية')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">{t('pages.definitions.الاسم_بالإنجليزية')}</Label>
                        <Input
                          id="name"
                          value={customerForm.name}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.customer_name')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                    <div className={t("pages.definitions.name.grid_grid_cols_3_gap_4")}>
                      <div>
                        <Label htmlFor="code">{t('pages.definitions.كود_العميل')}</Label>
                        <Input
                          id="code"
                          value={customerForm.code}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              code: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.كود_العميل')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">{t('pages.definitions.الهاتف')}</Label>
                        <Input
                          id="phone"
                          value={customerForm.phone}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.رقم_الهاتف')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">{t('pages.definitions.المدينة')}</Label>
                        <Input
                          id="city"
                          value={customerForm.city}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              city: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.المدينة')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="sales_rep_id">{t('pages.definitions.المندوب')}</Label>
                        <Select
                          value={customerForm.sales_rep_id?.toString() || "none"}
                          onValueChange={(value) =>
                            setCustomerForm({
                              ...customerForm,
                              sales_rep_id: value === "none" ? "" : value,
                            })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")} data-testid="select-sales-rep">
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_المندوب')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pages.definitions.بدون_مندوب')}</SelectItem>
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
                        <Label htmlFor="tax_number">{t('pages.definitions.الرقم_الضريبي')}</Label>
                        <Input
                          id="tax_number"
                          value={customerForm.tax_number}
                          onChange={(e) =>
                            setCustomerForm({
                              ...customerForm,
                              tax_number: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.الرقم_الضريبي')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">{t('pages.definitions.العنوان')}</Label>
                      <Input
                        id="address"
                        value={customerForm.address}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            address: e.target.value,
                          })
                        }
                        placeholder="{t('pages.definitions.placeholder.العنوان_كاملاً')}"
                        className={t("pages.definitions.name.mt_1")}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >{t('pages.definitions.إلغاء')}</Button>
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
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_mr_2")}></div>
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
                <DialogContent className={t("pages.definitions.name.max_w_2xl_max_h_90vh_overflow_y_auto")}>
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
                  <div className={t("pages.definitions.name.grid_gap_4_py_4")}>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="name_ar">{t('pages.definitions.الاسم_بالعربية_*')}</Label>
                        <Input
                          id="name_ar"
                          value={sectionForm.name_ar}
                          onChange={(e) =>
                            setSectionForm({
                              ...sectionForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.اسم_القسم_بالعربية')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">{t('pages.definitions.الاسم_بالإنجليزية')}</Label>
                        <Input
                          id="name"
                          value={sectionForm.name}
                          onChange={(e) =>
                            setSectionForm({
                              ...sectionForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.section_name')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">{t('pages.definitions.الوصف')}</Label>
                      <Input
                        id="description"
                        value={sectionForm.description}
                        onChange={(e) =>
                          setSectionForm({
                            ...sectionForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="{t('pages.definitions.placeholder.وصف_القسم_(اختياري)')}"
                        className={t("pages.definitions.name.mt_1")}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >{t('pages.definitions.إلغاء')}</Button>
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
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_mr_2")}></div>
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
                <DialogContent className={t("pages.definitions.name.max_w_2xl_max_h_90vh_overflow_y_auto")}>
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
                  <div className={t("pages.definitions.name.grid_gap_4_py_4")}>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="name_ar">{t('pages.definitions.الاسم_بالعربية_*')}</Label>
                        <Input
                          id="name_ar"
                          value={categoryForm.name_ar}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.اسم_الفئة_بالعربية')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">{t('pages.definitions.الاسم_بالإنجليزية')}</Label>
                        <Input
                          id="name"
                          value={categoryForm.name}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.category_name')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>

                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="code">{t('pages.definitions.الكود')}</Label>
                        <Input
                          id="code"
                          value={categoryForm.code}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              code: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.كود_الفئة_(اختياري)')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="parent_id">{t('pages.definitions.الفئة_الرئيسية')}</Label>
                        <Select
                          value={categoryForm.parent_id}
                          onValueChange={(value) =>
                            setCategoryForm({
                              ...categoryForm,
                              parent_id: value,
                            })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_الفئة_الرئيسية')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pages.definitions.بدون_فئة_رئيسية')}</SelectItem>
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
                      <Label htmlFor="description">{t('pages.definitions.الوصف')}</Label>
                      <Input
                        id="description"
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm({
                            ...categoryForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="{t('pages.definitions.placeholder.وصف_الفئة_(اختياري)')}"
                        className={t("pages.definitions.name.mt_1")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">{t('pages.definitions.الحالة')}</Label>
                      <Select
                        value={categoryForm.status}
                        onValueChange={(value) =>
                          setCategoryForm({ ...categoryForm, status: value })
                        }
                      >
                        <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t('pages.definitions.نشط')}</SelectItem>
                          <SelectItem value="inactive">{t('pages.definitions.غير_نشط')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >{t('pages.definitions.إلغاء')}</Button>
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
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_mr_2")}></div>
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
                <DialogContent className={t("pages.definitions.name.max_w_2xl_max_h_90vh_overflow_y_auto")}>
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
                  <div className={t("pages.definitions.name.grid_gap_4_py_4")}>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="name_ar">{t('pages.definitions.الاسم_بالعربية_*')}</Label>
                        <Input
                          id="name_ar"
                          value={itemForm.name_ar}
                          onChange={(e) =>
                            setItemForm({
                              ...itemForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.اسم_الصنف_بالعربية')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">{t('pages.definitions.الاسم_بالإنجليزية')}</Label>
                        <Input
                          id="name"
                          value={itemForm.name}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, name: e.target.value })
                          }
                          placeholder="{t('pages.definitions.placeholder.item_name')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="code">{t('pages.definitions.كود_الصنف')}</Label>
                        <Input
                          id="code"
                          value={itemForm.code}
                          onChange={(e) =>
                            setItemForm({ ...itemForm, code: e.target.value })
                          }
                          placeholder="{t('pages.definitions.placeholder.كود_الصنف')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category_id">{t('pages.definitions.الفئة')}</Label>
                        <Select
                          value={itemForm.category_id}
                          onValueChange={(value) =>
                            setItemForm({ ...itemForm, category_id: value })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_الفئة')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pages.definitions.بدون_فئة')}</SelectItem>
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
                    >{t('pages.definitions.إلغاء')}</Button>
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
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_mr_2")}></div>
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
                <DialogContent className={t("pages.definitions.name.max_w_6xl_max_h_90vh_overflow_y_auto_sm_max_w_95vw_w_full_mx_4")}>
                  <DialogHeader>
                    <DialogTitle className={t("pages.definitions.name.text_lg_sm_text_xl")}>
                      {editingItem
                        ? "تحديث منتج العميل"
                        : "إضافة منتج عميل جديد"}
                    </DialogTitle>
                    <DialogDescription className={t("pages.definitions.name.text_sm_sm_text_base")}>
                      {editingItem
                        ? "تعديل بيانات منتج العميل الحالي"
                        : "إضافة منتج جديد لعميل محدد"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className={t("pages.definitions.name.grid_gap_6_py_4_px_2_sm_px_0")}>
                    {/* العميل والفئة والصنف */}
                    <div className={t("pages.definitions.name.grid_grid_cols_1_sm_grid_cols_2_lg_grid_cols_3_gap_4")}>
                      <div>
                        <Label htmlFor="customer_id">{t('pages.definitions.العميل_*')}</Label>
                        <Select
                          value={customerProductForm.customer_id}
                          onValueChange={(value) =>
                            setCustomerProductForm({
                              ...customerProductForm,
                              customer_id: value,
                            })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_العميل')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pages.definitions.اختر_العميل')}</SelectItem>
                            {Array.isArray(customers) &&
                              customers
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
                                    {customer.name_ar || customer.name} (
                                    {customer.id})
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="category_id">{t('pages.definitions.الفئة')}</Label>
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
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_الفئة')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pages.definitions.اختر_الفئة')}</SelectItem>
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
                        <Label htmlFor="item_id">{t('pages.definitions.الصنف')}</Label>
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
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
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
                            <SelectItem value="none">{t('pages.definitions.اختر_الصنف')}</SelectItem>
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
                    <div className={t("pages.definitions.name.space_y_4")}>
                      <h4 className={t("pages.definitions.name.text_lg_sm_text_xl_font_medium_border_b_border_gray_200_pb_2")}>{t('pages.definitions.مواصفات_المنتج')}</h4>
                      <div className={t("pages.definitions.name.grid_grid_cols_1_sm_grid_cols_2_gap_4")}>
                        <div>
                          <Label htmlFor="size_caption">{t('pages.definitions.مقاس_المنتج_(يُحسب_تلقائياً)')}</Label>
                          <Input
                            id="size_caption"
                            value={customerProductForm.size_caption}
                            placeholder="{t('pages.definitions.placeholder.سيتم_إنشاؤه_تلقائياً:_العرض_×_الطول')}"
                            className={t("pages.definitions.name.mt_1_bg_gray_50")}
                            readOnly
                          />
                        </div>
                        <div>
                          <Label htmlFor="punching">{t('pages.definitions.التخريم')}</Label>
                          <Select
                            value={customerProductForm.punching}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                punching: value,
                              })
                            }
                          >
                            <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                              <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_نوع_التخريم')}" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="بدون">{t('pages.definitions.بدون')}</SelectItem>
                              <SelectItem value="علاقي">{t('pages.definitions.علاقي')}</SelectItem>
                              <SelectItem value="علاقي هوك">{t('pages.definitions.علاقي_هوك')}</SelectItem>
                              <SelectItem value="بنانة">{t('pages.definitions.بنانة')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* الأبعاد والقياسات بالترتيب المطلوب */}
                    <div className={t("pages.definitions.name.space_y_4")}>
                      <h4 className={t("pages.definitions.name.text_lg_sm_text_xl_font_medium_border_b_border_gray_200_pb_2")}>{t('pages.definitions.الأبعاد_والقياسات')}</h4>
                      <div className={t("pages.definitions.name.grid_grid_cols_2_sm_grid_cols_3_lg_grid_cols_4_gap_4")}>
                        <div>
                          <Label htmlFor="right_facing">{t('pages.definitions.الجانب_الأيمن_(سم)')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.0.00')}"
                            className={t("pages.definitions.name.mt_1")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="width">{t('pages.definitions.العرض_(سم)')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.0.00')}"
                            className={t("pages.definitions.name.mt_1")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="left_facing">{t('pages.definitions.الجانب_الأيسر_(سم)')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.0.00')}"
                            className={t("pages.definitions.name.mt_1")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="thickness">{t('pages.definitions.السماكة_(ميكرون)')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.0.00')}"
                            className={t("pages.definitions.name.mt_1")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* الطباعة والقطع */}
                    <div className={t("pages.definitions.name.space_y_4")}>
                      <h4 className={t("pages.definitions.name.text_lg_sm_text_xl_font_medium_border_b_border_gray_200_pb_2")}>{t('pages.definitions.مواصفات_الطباعة_والقطع')}</h4>
                      <div className={t("pages.definitions.name.grid_grid_cols_1_sm_grid_cols_2_lg_grid_cols_4_gap_4")}>
                        <div>
                          <Label htmlFor="printing_cylinder">{t('pages.definitions.أسطوانة_الطباعة')}</Label>
                          <Select
                            value={customerProductForm.printing_cylinder}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                printing_cylinder: value,
                              })
                            }
                          >
                            <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                              <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_الأسطوانة')}" />
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
                          <Label htmlFor="cutting_length_cm">{t('pages.definitions.طول_القطع_(سم)')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.يحسب_تلقائياً_أو_أدخل_يدوياً')}"
                            className={t("pages.definitions.name.mt_1")}
                            disabled={
                              customerProductForm.printing_cylinder !==
                              "بدون طباعة"
                            }
                          />
                        </div>
                        <div className={t("pages.definitions.name.flex_items_center_gap_3_mt_6_p_3_bg_gray_50_rounded_md")}>
                          <input
                            type="checkbox"
                            id="is_printed"
                            checked={customerProductForm.is_printed}
                            className={t("pages.definitions.name.rounded_w_4_h_4")}
                            disabled
                          />
                          <Label
                            htmlFor="is_printed"
                            className={t("pages.definitions.name.text_gray_600_text_sm")}
                          >{t('pages.definitions.منتج_مطبوع_(يتم_تحديده_تلقائياً)')}</Label>
                        </div>
                        <div>
                          <Label htmlFor="cutting_unit">{t('pages.definitions.وحدة_القطع')}</Label>
                          <Select
                            value={customerProductForm.cutting_unit}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                cutting_unit: value,
                              })
                            }
                          >
                            <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                              <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_الوحدة')}" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="كيلو">{t('pages.definitions.كيلو')}</SelectItem>
                              <SelectItem value="رول">{t('pages.definitions.رول')}</SelectItem>
                              <SelectItem value="باكت">{t('pages.definitions.باكت')}</SelectItem>
                              <SelectItem value="كرتون">{t('pages.definitions.كرتون')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* المواد والخامات */}
                    <div className={t("pages.definitions.name.space_y_4")}>
                      <h4 className={t("pages.definitions.name.text_lg_sm_text_xl_font_medium_border_b_border_gray_200_pb_2")}>{t('pages.definitions.المواد_والخامات')}</h4>
                      <div className={t("pages.definitions.name.grid_grid_cols_1_sm_grid_cols_2_gap_4")}>
                        <div>
                          <Label htmlFor="raw_material">{t('pages.definitions.المادة_الخام')}</Label>
                          <Select
                            value={customerProductForm.raw_material}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                raw_material: value,
                              })
                            }
                          >
                            <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                              <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_المادة_الخام')}" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HDPE">{t('pages.definitions.hdpe')}</SelectItem>
                              <SelectItem value="LDPE">{t('pages.definitions.ldpe')}</SelectItem>
                              <SelectItem value="Regrind">{t('pages.definitions.regrind')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="master_batch_id">{t('pages.definitions.لون_الماستر_باتش')}</Label>
                          <Select
                            value={customerProductForm.master_batch_id}
                            onValueChange={(value) =>
                              setCustomerProductForm({
                                ...customerProductForm,
                                master_batch_id: value,
                              })
                            }
                          >
                            <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                              <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_اللون')}" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{t('pages.definitions.بدون_لون')}</SelectItem>
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
                                    <div className={t("pages.definitions.name.flex_items_center_gap_3")}>
                                      <div
                                        className={t("pages.definitions.name.w_5_h_5_rounded_full_border_2_border_gray_300_flex_items_center_justify_center")}
                                        style={{
                                          backgroundColor: color.color,
                                          border:
                                            color.id === "transparent"
                                              ? "2px dashed #ccc"
                                              : `2px solid ${color.color}`,
                                        }}
                                      >
                                        {color.id === "transparent" && (
                                          <span className={t("pages.definitions.name.text_xs_text_gray_400")}>
                                            ⊘
                                          </span>
                                        )}
                                      </div>
                                      <span className={t("pages.definitions.name.font_medium")}>
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
                    <div className={t("pages.definitions.name.space_y_4")}>
                      <h4 className={t("pages.definitions.name.text_lg_sm_text_xl_font_medium_border_b_border_gray_200_pb_2")}>{t('pages.definitions.الأوزان_والكميات')}</h4>
                      <div className={t("pages.definitions.name.grid_grid_cols_1_sm_grid_cols_2_lg_grid_cols_3_gap_4")}>
                        <div>
                          <Label htmlFor="unit_weight_kg">{t('pages.definitions.وزن_الوحدة_(كغ)')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.0.00')}"
                            className={t("pages.definitions.name.mt_1")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="unit_quantity">{t('pages.definitions.التعبئة')}</Label>
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
                            className={t("pages.definitions.name.mt_1")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="package_weight_kg">{t('pages.definitions.وزن_العبوة_(كغ)_-_محسوب_تلقائياً')}</Label>
                          <Input
                            id="package_weight_kg"
                            type="number"
                            step="0.01"
                            value={customerProductForm.package_weight_kg}
                            placeholder="{t('pages.definitions.placeholder.وزن_الوحدة_×_كمية_الوحدة')}"
                            className={t("pages.definitions.name.mt_1_bg_gray_50")}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    {/* الكليشيهات والتصاميم */}
                    <div className={t("pages.definitions.name.space_y_4")}>
                      <h4 className={t("pages.definitions.name.text_lg_sm_text_xl_font_medium_border_b_border_gray_200_pb_2")}>{t('pages.definitions.الكليشيهات_والتصاميم')}</h4>
                      <div className={t("pages.definitions.name.grid_grid_cols_1_sm_grid_cols_2_gap_4")}>
                        <div>
                          <Label htmlFor="cliche_front_design">{t('pages.definitions.تصميم_الوجه_الأمامي')}</Label>
                          <div className={t("pages.definitions.name.space_y_2")}>
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
                              className={t("pages.definitions.name.mt_1")}
                            />
                            {customerProductForm.cliche_front_design && (
                              <div className={t("pages.definitions.name.relative")}>
                                <img
                                  src={customerProductForm.cliche_front_design}
                                  alt="{t('pages.definitions.alt.التصميم_الأمامي')}"
                                  className={t("pages.definitions.name.max_w_full_max_h_32_object_contain_border_rounded_md_bg_gray_50")}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className={t("pages.definitions.name.absolute_top_1_right_1_h_6_w_6_p_0")}
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
                          <Label htmlFor="cliche_back_design">{t('pages.definitions.تصميم_الوجه_الخلفي')}</Label>
                          <div className={t("pages.definitions.name.space_y_2")}>
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
                              className={t("pages.definitions.name.mt_1")}
                            />
                            {customerProductForm.cliche_back_design && (
                              <div className={t("pages.definitions.name.relative")}>
                                <img
                                  src={customerProductForm.cliche_back_design}
                                  alt="{t('pages.definitions.alt.التصميم_الخلفي')}"
                                  className={t("pages.definitions.name.max_w_full_max_h_32_object_contain_border_rounded_md_bg_gray_50")}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className={t("pages.definitions.name.absolute_top_1_right_1_h_6_w_6_p_0")}
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
                      <Label htmlFor="notes" className={t("pages.definitions.name.text_base")}>{t('pages.definitions.ملاحظات')}</Label>
                      <textarea
                        id="notes"
                        value={customerProductForm.notes}
                        onChange={(e) =>
                          setCustomerProductForm({
                            ...customerProductForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="{t('pages.definitions.placeholder.أي_ملاحظات_إضافية_حول_المنتج...')}"
                        className={t("pages.definitions.name.mt_2_w_full_p_3_border_border_gray_300_rounded_md_resize_none_text_right")}
                        rows={4}
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <DialogFooter className={t("pages.definitions.name.flex_flex_col_sm_flex_row_gap_2_sm_gap_0")}>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className={t("pages.definitions.name.w_full_sm_w_auto_order_2_sm_order_1")}
                    >{t('pages.definitions.إلغاء')}</Button>
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
                      className={t("pages.definitions.name.w_full_sm_w_auto_order_1_sm_order_2")}
                    >
                      {createCustomerProductMutation.isPending ||
                      updateCustomerProductMutation.isPending ? (
                        <>
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_mr_2")}></div>
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
                <DialogContent className={t("pages.definitions.name.max_w_2xl_max_h_90vh_overflow_y_auto")}>
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
                  <div className={t("pages.definitions.name.grid_gap_4_py_4")}>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="name_ar">{t('pages.definitions.الاسم_بالعربية_*')}</Label>
                        <Input
                          id="name_ar"
                          value={locationForm.name_ar}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.اسم_الموقع_بالعربية')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">{t('pages.definitions.الاسم_بالإنجليزية')}</Label>
                        <Input
                          id="name"
                          value={locationForm.name}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.location_name')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="type">{t('pages.definitions.النوع')}</Label>
                        <Select
                          value={locationForm.type}
                          onValueChange={(value) =>
                            setLocationForm({ ...locationForm, type: value })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="city">{t('pages.definitions.مدينة')}</SelectItem>
                            <SelectItem value="warehouse">{t('pages.definitions.مستودع')}</SelectItem>
                            <SelectItem value="factory">{t('pages.definitions.مصنع')}</SelectItem>
                            <SelectItem value="office">{t('pages.definitions.مكتب')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="coordinates">{t('pages.definitions.الإحداثيات')}</Label>
                        <Input
                          id="coordinates"
                          value={locationForm.coordinates}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              coordinates: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.lat,lng')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >{t('pages.definitions.إلغاء')}</Button>
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
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_mr_2")}></div>
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
                <DialogContent className={t("pages.definitions.name.max_w_2xl_max_h_90vh_overflow_y_auto")}>
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
                  <div className={t("pages.definitions.name.grid_gap_4_py_4")}>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="name_ar">{t('pages.definitions.الاسم_بالعربية_*')}</Label>
                        <Input
                          id="name_ar"
                          value={machineForm.name_ar}
                          onChange={(e) =>
                            setMachineForm({
                              ...machineForm,
                              name_ar: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.اسم_الماكينة_بالعربية')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">{t('pages.definitions.الاسم_بالإنجليزية')}</Label>
                        <Input
                          id="name"
                          value={machineForm.name}
                          onChange={(e) =>
                            setMachineForm({
                              ...machineForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.machine_name')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="type">{t('pages.definitions.النوع')}</Label>
                        <Select
                          value={machineForm.type}
                          onValueChange={(value) =>
                            setMachineForm({ ...machineForm, type: value })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="extruder">{t('pages.definitions.فيلم')}</SelectItem>
                            <SelectItem value="cutting">{t('pages.definitions.قطع')}</SelectItem>
                            <SelectItem value="printing">{t('pages.definitions.طباعة')}</SelectItem>
                            <SelectItem value="packaging">{t('pages.definitions.تعبئة')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="section_id">{t('pages.definitions.القسم')}</Label>
                        <Select
                          value={machineForm.section_id}
                          onValueChange={(value) =>
                            setMachineForm({
                              ...machineForm,
                              section_id: value,
                            })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_القسم')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pages.definitions.بدون_قسم')}</SelectItem>
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
                      <Label htmlFor="status">{t('pages.definitions.حالة_الماكينة')}</Label>
                      <Select
                        value={machineForm.status}
                        onValueChange={(value) =>
                          setMachineForm({
                            ...machineForm,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger className={t("pages.definitions.name.mt_1")} data-testid="select-machine-status">
                          <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_الحالة')}" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t('pages.definitions.نشطة')}</SelectItem>
                          <SelectItem value="maintenance">{t('pages.definitions.صيانة')}</SelectItem>
                          <SelectItem value="down">{t('pages.definitions.متوقفة')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* قدرة الإنتاج حسب الحجم */}
                    <div className={t("pages.definitions.name.border_t_pt_4_mt_4")}>
                      <h3 className={t("pages.definitions.name.text_sm_font_medium_mb_3")}>{t('pages.definitions.قدرة_الإنتاج_(كجم/ساعة)')}</h3>
                      <div className={t("pages.definitions.name.grid_grid_cols_3_gap_4")}>
                        <div>
                          <Label htmlFor="capacity_small">{t('pages.definitions.حجم_صغير')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.كجم/ساعة')}"
                            className={t("pages.definitions.name.mt_1")}
                            data-testid="input-capacity-small"
                          />
                        </div>
                        <div>
                          <Label htmlFor="capacity_medium">{t('pages.definitions.حجم_وسط')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.كجم/ساعة')}"
                            className={t("pages.definitions.name.mt_1")}
                            data-testid="input-capacity-medium"
                          />
                        </div>
                        <div>
                          <Label htmlFor="capacity_large">{t('pages.definitions.حجم_كبير')}</Label>
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
                            placeholder="{t('pages.definitions.placeholder.كجم/ساعة')}"
                            className={t("pages.definitions.name.mt_1")}
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
                    >{t('pages.definitions.إلغاء')}</Button>
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
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_mr_2")}></div>
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
                <DialogContent className={t("pages.definitions.name.max_w_2xl_max_h_90vh_overflow_y_auto")}>
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
                  <div className={t("pages.definitions.name.grid_gap_4_py_4")}>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="display_name_ar">{t('pages.definitions.الاسم_بالعربية_*')}</Label>
                        <Input
                          id="display_name_ar"
                          value={userForm.display_name_ar}
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              display_name_ar: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.اسم_المستخدم_بالعربية')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="display_name">{t('pages.definitions.الاسم_بالإنجليزية')}</Label>
                        <Input
                          id="display_name"
                          value={userForm.display_name}
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              display_name: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.display_name')}"
                          className={t("pages.definitions.name.mt_1")}
                        />
                      </div>
                    </div>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="username">{t('pages.definitions.اسم_المستخدم_*')}</Label>
                        <Input
                          id="username"
                          value={userForm.username}
                          onChange={(e) =>
                            setUserForm({
                              ...userForm,
                              username: e.target.value,
                            })
                          }
                          placeholder="{t('pages.definitions.placeholder.username')}"
                          className={t("pages.definitions.name.mt_1")}
                          data-testid="input-username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">
                          كلمة المرور {editingItem ? "(اتركها فارغة إذا لم ترد تغييرها)" : "*"}
                        </Label>
                        <div className={t("pages.definitions.name.relative")}>
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
                            className={t("pages.definitions.name.mt_1_pr_10")}
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={t("pages.definitions.name.absolute_left_3_top_1_2_translate_y_1_2_text_gray_500_hover_text_gray_700")}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className={t("pages.definitions.name.w_4_h_4")} />{t('pages.definitions.)_:_(')}<Eye className={t("pages.definitions.name.w_4_h_4")} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={t("pages.definitions.name.grid_grid_cols_2_gap_4")}>
                      <div>
                        <Label htmlFor="role_id">{t('pages.definitions.الدور')}</Label>
                        <Select
                          value={userForm.role_id}
                          onValueChange={(value) =>
                            setUserForm({ ...userForm, role_id: value })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_الدور')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pages.definitions.بدون_دور')}</SelectItem>
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
                        <Label htmlFor="section_id">{t('pages.definitions.القسم')}</Label>
                        <Select
                          value={userForm.section_id}
                          onValueChange={(value) =>
                            setUserForm({ ...userForm, section_id: value })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_القسم')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pages.definitions.بدون_قسم')}</SelectItem>
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
                        <Label htmlFor="status">{t('pages.definitions.الحالة')}</Label>
                        <Select
                          value={userForm.status}
                          onValueChange={(value) =>
                            setUserForm({ ...userForm, status: value })
                          }
                        >
                          <SelectTrigger className={t("pages.definitions.name.mt_1")}>
                            <SelectValue placeholder="{t('pages.definitions.placeholder.اختر_الحالة')}" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{t('pages.definitions.نشط')}</SelectItem>
                            <SelectItem value="inactive">{t('pages.definitions.غير_نشط')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >{t('pages.definitions.إلغاء')}</Button>
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
                          <div className={t("pages.definitions.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white_mr_2")}></div>
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
