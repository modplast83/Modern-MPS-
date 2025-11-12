import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
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
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Download,
  Upload,
  Trash2,
  Archive,
  HardDrive,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Save,
  RefreshCw,
  MessageSquare,
  Webhook,
  MapPin,
} from "lucide-react";
import RoleManagementTab from "../components/RoleManagementTab";
import { canAccessSettingsTab } from "../utils/roleUtils";
import NotificationCenter from "../components/notifications/NotificationCenter";
import WhatsAppWebhooksTab from "../components/settings/WhatsAppWebhooksTab";
import LocationMapPicker from "../components/LocationMapPicker";
import { Plus, Eye, EyeOff } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system settings
  const { data: systemSettingsData } = useQuery({
    queryKey: ["/api/settings/system"],
    enabled: !!user,
  });

  // Fetch user settings
  const { data: userSettingsData } = useQuery({
    queryKey: ["/api/settings/user", user?.id],
    enabled: !!user?.id,
  });

  // Fetch database stats
  const { data: databaseStatsData } = useQuery({
    queryKey: ["/api/database/stats"],
    enabled: !!user,
  });

  // Convert array settings to object format
  const convertSettingsArrayToObject = (settingsArray: any[] | undefined) => {
    if (!Array.isArray(settingsArray)) return {};
    return settingsArray.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});
  };

  // User preferences state
  const [userSettings, setUserSettings] = useState({
    displayName: user?.display_name_ar || "",
    email: "",
    phone: "",
    language: "ar",
    theme: "light",
    notifications: {
      email: true,
      sms: false,
      push: true,
      sound: true,
    },
    dashboard: {
      autoRefresh: true,
      refreshInterval: 30,
      compactView: false,
    },
  });

  // Database settings state
  const [selectedTable, setSelectedTable] = useState("");
  const [databaseStats, setDatabaseStats] = useState({
    tableCount: 8,
    totalRecords: 1247,
    databaseSize: "45.2 MB",
    lastBackup: "اليوم",
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    companyName: "مصنع أكياس MPBF",
    timezone: "Asia/Riyadh",
    currency: "SAR",
    language: "ar",
    dateFormat: "DD/MM/YYYY",
    country: "المملكة العربية السعودية",
    region: "الرياض",
    workingHours: {
      start: "08:00",
      end: "17:00",
    },
    shifts: [
      { id: 1, name: "الصباحية", start: "08:00", end: "16:00" },
      { id: 2, name: "المسائية", start: "16:00", end: "00:00" },
      { id: 3, name: "الليلية", start: "00:00", end: "08:00" },
    ],
    backup: {
      enabled: true,
      frequency: "daily",
      retention: 30,
    },
  });

  // Load settings from database when data is available
  useEffect(() => {
    if (systemSettingsData && Array.isArray(systemSettingsData)) {
      const settingsObj = convertSettingsArrayToObject(systemSettingsData);
      setSystemSettings((prev) => ({
        ...prev,
        companyName: settingsObj.companyName || prev.companyName,
        timezone: settingsObj.timezone || prev.timezone,
        currency: settingsObj.currency || prev.currency,
        language: settingsObj.language || prev.language,
        dateFormat: settingsObj.dateFormat || prev.dateFormat,
        country: settingsObj.country || prev.country,
        region: settingsObj.region || prev.region,
        workingHours: {
          start: settingsObj.workingHoursStart || prev.workingHours.start,
          end: settingsObj.workingHoursEnd || prev.workingHours.end,
        },
      }));
    }
  }, [systemSettingsData]);

  useEffect(() => {
    if (userSettingsData && Array.isArray(userSettingsData)) {
      const settingsObj = convertSettingsArrayToObject(userSettingsData);
      setUserSettings((prev) => ({
        ...prev,
        displayName: settingsObj.displayName || prev.displayName,
        email: settingsObj.email || prev.email,
        phone: settingsObj.phone || prev.phone,
        language: settingsObj.language || prev.language,
        theme: settingsObj.theme || prev.theme,
        notifications: {
          email:
            settingsObj.notificationsEmail === "true" ||
            prev.notifications.email,
          sms:
            settingsObj.notificationsSms === "true" || prev.notifications.sms,
          push:
            settingsObj.notificationsPush === "true" || prev.notifications.push,
          sound:
            settingsObj.notificationsSound === "true" ||
            prev.notifications.sound,
        },
        dashboard: {
          autoRefresh:
            settingsObj.dashboardAutoRefresh === "true" ||
            prev.dashboard.autoRefresh,
          refreshInterval:
            parseInt(settingsObj.dashboardRefreshInterval) ||
            prev.dashboard.refreshInterval,
          compactView:
            settingsObj.dashboardCompactView === "true" ||
            prev.dashboard.compactView,
        },
      }));
    }
  }, [userSettingsData]);

  // Load database stats when data is available
  useEffect(() => {
    if (databaseStatsData && typeof databaseStatsData === "object") {
      setDatabaseStats((prev) => ({
        ...prev,
        ...databaseStatsData,
      }));
    }
  }, [databaseStatsData]);

  // Enhanced file import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Preview & Map, 3: Import
  const [fileData, setFileData] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string }>(
    {},
  );
  const [importOptions, setImportOptions] = useState({
    batchSize: 1000,
    skipFirstRow: true,
    updateExisting: false,
    validateData: true,
    continueOnError: false,
  });
  const [importProgress, setImportProgress] = useState({
    processing: false,
    current: 0,
    total: 0,
    percentage: 0,
    errors: [] as string[],
    warnings: [] as string[],
  });

  // Import table data mutation
  const importTableMutation = useMutation({
    mutationFn: async ({
      tableName,
      file,
    }: {
      tableName: string;
      file: File;
    }) => {
      const fileText = await file.text();
      const format = file.name.endsWith(".json")
        ? "json"
        : file.name.endsWith(".xlsx")
          ? "excel"
          : "csv";

      return await apiRequest(`/api/database/import/${tableName}`, {
        method: "POST",
        body: JSON.stringify({ data: fileText, format }),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/stats"] });
      setSelectedFile(null);
      toast({
        title: "تم استيراد البيانات بنجاح",
        description: `تم استيراد ${data.count || data.importedRecords} سجل من أصل ${data.totalRows || data.count} سجل`,
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في استيراد البيانات",
        description:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    },
  });

  // Get table schema for column mapping
  const getTableSchema = (tableName: string) => {
    const schemas: { [key: string]: string[] } = {
      customers: [
        "id",
        "name",
        "name_ar",
        "phone",
        "email",
        "address",
        "status",
      ],
      categories: ["id", "name", "name_ar", "description"],
      sections: ["id", "name", "name_ar", "description"],
      items: ["id", "category_id", "name", "name_ar"],
      users: ["id", "username", "display_name", "display_name_ar", "role_id"],
      machines: ["id", "name", "name_ar", "type", "status"],
      locations: ["id", "name", "name_ar", "type"],
      customer_products: [
        "id",
        "customer_id",
        "category_id",
        "item_id",
        "size_caption",
        "width",
        "left_facing",
        "right_facing",
        "thickness",
        "printing_cylinder",
        "cutting_length_cm",
        "raw_material",
        "master_batch_id",
        "is_printed",
        "cutting_unit",
        "punching",
        "unit_weight_kg",
        "unit_quantity",
        "package_weight_kg",
        "cliche_front_design",
        "cliche_back_design",
        "notes",
        "status",
        "created_at",
      ],
      orders: ["id", "customer_id", "order_date", "status", "total_amount"],
      production_orders: [
        "id",
        "order_id",
        "customer_product_id",
        "quantity_kg",
        "status",
      ],
    };
    return schemas[tableName] || [];
  };

  // Parse file data based on format
  const parseFileData = async (file: File) => {
    try {
      const fileText = await file.text();
      let data: any[] = [];
      let headers: string[] = [];

      if (file.name.endsWith(".json")) {
        const jsonData = JSON.parse(fileText);
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          data = jsonData;
          headers = Object.keys(jsonData[0]);
        }
      } else if (file.name.endsWith(".csv")) {
        const lines = fileText.split("\n").filter((line) => line.trim());
        if (lines.length > 0) {
          headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
          data = lines.slice(1).map((line) => {
            const values = line
              .split(",")
              .map((v) => v.trim().replace(/"/g, ""));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || "";
            });
            return row;
          });
        }
      } else if (file.name.endsWith(".xlsx")) {
        // For Excel files, we'll parse them on the server side
        headers = ["Column 1", "Column 2", "Column 3"]; // Placeholder
        data = [
          {
            "Column 1": "سيتم تحليل ملف Excel على الخادم",
            "Column 2": "",
            "Column 3": "",
          },
        ];
      }

      setFileData(data); // Show all rows for import
      setFileHeaders(headers);

      // Auto-map common column names
      const tableSchema = getTableSchema(selectedTable);
      const autoMapping: { [key: string]: string } = {};
      tableSchema.forEach((schemaCol) => {
        const matchingHeader = headers.find(
          (header) =>
            header.toLowerCase().includes(schemaCol.toLowerCase()) ||
            schemaCol.toLowerCase().includes(header.toLowerCase()),
        );
        if (matchingHeader) {
          autoMapping[schemaCol] = matchingHeader;
        }
      });
      setColumnMapping(autoMapping);

      setImportStep(2);

      toast({
        title: "تم تحليل الملف بنجاح",
        description: `تم العثور على ${data.length} سجل و ${headers.length} عمود`,
      });
    } catch (error) {
      toast({
        title: "خطأ في تحليل الملف",
        description: "تأكد من صحة تنسيق الملف",
        variant: "destructive",
      });
    }
  };

  // Enhanced file upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const allowedTypes = [
        "text/csv",
        "application/json",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (
        allowedTypes.includes(file.type) ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".json") ||
        file.name.endsWith(".xlsx")
      ) {
        setSelectedFile(file);

        if (selectedTable) {
          await parseFileData(file);
        } else {
          toast({
            title: "يرجى اختيار الجدول أولاً",
            description: "اختر الجدول المراد استيراد البيانات إليه",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "نوع ملف غير مدعوم",
          description: "يرجى اختيار ملف CSV أو JSON أو Excel",
          variant: "destructive",
        });
      }
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Enhanced batch import mutation
  const batchImportMutation = useMutation({
    mutationFn: async ({
      tableName,
      mappedData,
      options,
    }: {
      tableName: string;
      mappedData: any[];
      options: typeof importOptions;
    }) => {
      setImportProgress((prev) => ({
        ...prev,
        processing: true,
        total: mappedData.length,
      }));

      const results = {
        successful: 0,
        failed: 0,
        errors: [] as string[],
        warnings: [] as string[],
      };

      // Process in batches
      for (let i = 0; i < mappedData.length; i += options.batchSize) {
        const batch = mappedData.slice(i, i + options.batchSize);

        try {
          const response = await apiRequest(
            `/api/database/import/${tableName}/batch`,
            {
              method: "POST",
              body: JSON.stringify({
                data: batch,
                options: {
                  ...options,
                  batchNumber: Math.floor(i / options.batchSize) + 1,
                  totalBatches: Math.ceil(
                    mappedData.length / options.batchSize,
                  ),
                },
              }),
            },
          );

          const responseData = await response.json();

          results.successful += responseData.successful || batch.length;
          if (responseData.errors && responseData.errors.length > 0) {
            results.errors.push(...responseData.errors);
          }
          if (responseData.warnings && responseData.warnings.length > 0) {
            results.warnings.push(...responseData.warnings);
          }
        } catch (error) {
          results.failed += batch.length;
          results.errors.push(
            `خطأ في الدفعة ${Math.floor(i / options.batchSize) + 1}: ${error}`,
          );

          if (!options.continueOnError) {
            throw error;
          }
        }

        // Update progress
        setImportProgress((prev) => ({
          ...prev,
          current: Math.min(i + options.batchSize, mappedData.length),
          percentage: Math.round(
            (Math.min(i + options.batchSize, mappedData.length) /
              mappedData.length) *
              100,
          ),
          errors: results.errors,
          warnings: results.warnings,
        }));

        // Small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/stats"] });
      setImportProgress((prev) => ({ ...prev, processing: false }));
      setImportStep(3);

      toast({
        title: "اكتمل الاستيراد",
        description: `تم استيراد ${results.successful} سجل بنجاح، ${results.failed} فشل`,
      });
    },
    onError: (error) => {
      setImportProgress((prev) => ({ ...prev, processing: false }));
      toast({
        title: "خطأ في الاستيراد",
        description:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    },
  });

  // Process and start import
  const handleStartImport = () => {
    if (!selectedFile || !selectedTable || fileData.length === 0) {
      toast({
        title: "بيانات ناقصة",
        description: "تأكد من اختيار الملف والجدول ووجود بيانات للاستيراد",
        variant: "destructive",
      });
      return;
    }

    // Map the data according to column mapping
    const mappedData = fileData.map((row) => {
      const mappedRow: any = {};
      Object.entries(columnMapping).forEach(([dbColumn, fileColumn]) => {
        if (fileColumn && row[fileColumn] !== undefined) {
          mappedRow[dbColumn] = row[fileColumn];
        }
      });
      return mappedRow;
    });

    // Filter out empty rows
    const validData = mappedData.filter((row) =>
      Object.values(row).some(
        (value) => value !== "" && value !== null && value !== undefined,
      ),
    );

    if (validData.length === 0) {
      toast({
        title: "لا توجد بيانات صالحة",
        description: "تأكد من ربط الأعمدة بشكل صحيح",
        variant: "destructive",
      });
      return;
    }

    batchImportMutation.mutate({
      tableName: selectedTable,
      mappedData: validData,
      options: importOptions,
    });
  };

  // Reset import wizard
  const resetImport = () => {
    setSelectedFile(null);
    setFileData([]);
    setFileHeaders([]);
    setColumnMapping({});
    setImportStep(1);
    setImportProgress({
      processing: false,
      current: 0,
      total: 0,
      percentage: 0,
      errors: [],
      warnings: [],
    });
  };

  // Handle table selection change
  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    if (selectedFile && importStep === 1) {
      // Re-parse file with new table context
      parseFileData(selectedFile);
    }
  };

  // Database operations mutations
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/database/backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) throw new Error("Backup failed");

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `backup-${new Date().toISOString().split("T")[0]}.json`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/stats"] });
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم تحميل النسخة الاحتياطية لجميع الجداول والسجلات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء النسخة الاحتياطية",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    },
  });

  const exportTableMutation = useMutation({
    mutationFn: async ({
      tableName,
      format,
    }: {
      tableName: string;
      format: string;
    }) => {
      const response = await fetch(
        `/api/database/export/${tableName}?format=${format}`,
      );
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tableName}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "تم تصدير البيانات",
        description: "تم تصدير بيانات الجدول بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في تصدير البيانات",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    },
  });

  const optimizeTablesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/database/optimize", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "تم تحسين الجداول",
        description: "تم تحسين جميع الجداول بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في تحسين الجداول",
        description: "حدث خطأ أثناء تحسين الجداول",
        variant: "destructive",
      });
    },
  });

  const integrityCheckMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/database/integrity-check", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "فحص التكامل",
        description: "تم فحص تكامل قاعدة البيانات بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في فحص التكامل",
        description: "حدث خطأ أثناء فحص تكامل قاعدة البيانات",
        variant: "destructive",
      });
    },
  });

  const cleanupDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/database/cleanup", {
        method: "POST",
        body: JSON.stringify({ daysOld: 90 }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/stats"] });
      toast({
        title: "تم تنظيف البيانات",
        description: "تم تنظيف البيانات القديمة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في تنظيف البيانات",
        description: "حدث خطأ أثناء تنظيف البيانات القديمة",
        variant: "destructive",
      });
    },
  });

  // Mutation for saving user settings
  const saveUserSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const flattenedSettings = {
        displayName: settings.displayName,
        email: settings.email,
        phone: settings.phone,
        language: settings.language,
        theme: settings.theme,
        notificationsEmail: settings.notifications.email.toString(),
        notificationsSms: settings.notifications.sms.toString(),
        notificationsPush: settings.notifications.push.toString(),
        notificationsSound: settings.notifications.sound.toString(),
        dashboardAutoRefresh: settings.dashboard.autoRefresh.toString(),
        dashboardRefreshInterval: settings.dashboard.refreshInterval.toString(),
        dashboardCompactView: settings.dashboard.compactView.toString(),
      };

      return await apiRequest(`/api/settings/user/${user?.id}`, {
        method: "POST",
        body: JSON.stringify({ settings: flattenedSettings }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/settings/user", user?.id],
      });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعداداتك الشخصية",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    },
  });

  // Mutation for saving system settings
  const saveSystemSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const flattenedSettings = {
        companyName: settings.companyName,
        timezone: settings.timezone,
        currency: settings.currency,
        language: settings.language,
        dateFormat: settings.dateFormat,
        country: settings.country,
        region: settings.region,
        workingHoursStart: settings.workingHours.start,
        workingHoursEnd: settings.workingHours.end,
      };

      return await apiRequest("/api/settings/system", {
        method: "POST",
        body: JSON.stringify({ settings: flattenedSettings, userId: user?.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات النظام",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات النظام",
        variant: "destructive",
      });
    },
  });

  const handleSaveUserSettings = () => {
    saveUserSettingsMutation.mutate(userSettings);
  };

  const handleSaveSystemSettings = () => {
    saveSystemSettingsMutation.mutate(systemSettings);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:mr-64 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">الإعدادات</h1>
            <p className="text-gray-600">
              إدارة إعدادات النظام والتفضيلات الشخصية
            </p>
          </div>

          <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                الأدوار والصلاحيات
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                التنبيهات
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                النظام
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                قاعدة البيانات
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                موقع المصنع
              </TabsTrigger>
              <TabsTrigger value="notification-center" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                الإشعارات
              </TabsTrigger>
              <TabsTrigger value="whatsapp-webhooks" className="flex items-center gap-2">
                <Webhook className="w-4 h-4" />
                Webhooks واتساب
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    إدارة الأدوار والصلاحيات
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    تحديد أدوار المستخدمين وصلاحياتهم في النظام
                  </p>
                </CardHeader>
                <CardContent>
                  <RoleManagementTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    إعدادات التنبيهات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">
                          تنبيهات البريد الإلكتروني
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          تلقي تنبيهات عبر البريد الإلكتروني
                        </p>
                      </div>
                      <Switch
                        checked={userSettings.notifications.email}
                        onCheckedChange={(checked) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              email: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">
                          تنبيهات الرسائل النصية
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          تلقي تنبيهات عبر الرسائل النصية
                        </p>
                      </div>
                      <Switch
                        checked={userSettings.notifications.sms}
                        onCheckedChange={(checked) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              sms: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">التنبيهات الفورية</Label>
                        <p className="text-sm text-muted-foreground">
                          تنبيهات داخل النظام
                        </p>
                      </div>
                      <Switch
                        checked={userSettings.notifications.push}
                        onCheckedChange={(checked) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              push: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {userSettings.notifications.sound ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <VolumeX className="w-4 h-4" />
                        )}
                        <div>
                          <Label className="text-base">الأصوات</Label>
                          <p className="text-sm text-muted-foreground">
                            تشغيل أصوات التنبيهات
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={userSettings.notifications.sound}
                        onCheckedChange={(checked) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              sound: checked,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">إعدادات لوحة التحكم</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">التحديث التلقائي</Label>
                        <p className="text-sm text-muted-foreground">
                          تحديث البيانات تلقائياً
                        </p>
                      </div>
                      <Switch
                        checked={userSettings.dashboard.autoRefresh}
                        onCheckedChange={(checked) =>
                          setUserSettings((prev) => ({
                            ...prev,
                            dashboard: {
                              ...prev.dashboard,
                              autoRefresh: checked,
                            },
                          }))
                        }
                      />
                    </div>

                    {userSettings.dashboard.autoRefresh && (
                      <div className="space-y-2">
                        <Label htmlFor="refreshInterval">
                          فترة التحديث (بالثواني)
                        </Label>
                        <Select
                          value={(
                            userSettings.dashboard.refreshInterval ?? 30
                          ).toString()}
                          onValueChange={(value) =>
                            setUserSettings((prev) => ({
                              ...prev,
                              dashboard: {
                                ...prev.dashboard,
                                refreshInterval: parseInt(value),
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 ثانية</SelectItem>
                            <SelectItem value="30">30 ثانية</SelectItem>
                            <SelectItem value="60">دقيقة واحدة</SelectItem>
                            <SelectItem value="300">5 دقائق</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveUserSettings}
                      disabled={saveUserSettingsMutation.isPending}
                    >
                      {saveUserSettingsMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      حفظ التغييرات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    إعدادات النظام العامة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">اسم الشركة</Label>
                      <Input
                        id="companyName"
                        value={systemSettings.companyName}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            companyName: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">البلد</Label>
                      <Input
                        id="country"
                        value={systemSettings.country}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">المنطقة</Label>
                      <Select
                        value={systemSettings.region ?? "الرياض"}
                        onValueChange={(value) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            region: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="الرياض">الرياض</SelectItem>
                          <SelectItem value="جدة">جدة</SelectItem>
                          <SelectItem value="الدمام">الدمام</SelectItem>
                          <SelectItem value="مكة المكرمة">
                            مكة المكرمة
                          </SelectItem>
                          <SelectItem value="المدينة المنورة">
                            المدينة المنورة
                          </SelectItem>
                          <SelectItem value="تبوك">تبوك</SelectItem>
                          <SelectItem value="أبها">أبها</SelectItem>
                          <SelectItem value="حائل">حائل</SelectItem>
                          <SelectItem value="الطائف">الطائف</SelectItem>
                          <SelectItem value="الخبر">الخبر</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">المنطقة الزمنية</Label>
                      <Input
                        id="timezone"
                        value="الرياض (UTC+3)"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">العملة</Label>
                      <Input
                        id="currency"
                        value="ريال سعودي (SAR)"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">لغة النظام</Label>
                      <Select
                        value={systemSettings.language ?? "ar"}
                        onValueChange={(value) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            language: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">ساعات العمل</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workStart">بداية العمل</Label>
                        <Input
                          id="workStart"
                          type="time"
                          value={systemSettings.workingHours.start}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              workingHours: {
                                ...prev.workingHours,
                                start: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workEnd">نهاية العمل</Label>
                        <Input
                          id="workEnd"
                          type="time"
                          value={systemSettings.workingHours.end}
                          onChange={(e) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              workingHours: {
                                ...prev.workingHours,
                                end: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">الورديات</h4>
                    <div className="space-y-2">
                      {systemSettings.shifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <span className="font-medium">{shift.name}</span>
                            <p className="text-sm text-muted-foreground">
                              من {shift.start} إلى {shift.end}
                            </p>
                          </div>
                          <Badge variant="outline">نشطة</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveSystemSettings}
                      disabled={saveSystemSettingsMutation.isPending}
                    >
                      {saveSystemSettingsMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      حفظ إعدادات النظام
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    إدارة قاعدة البيانات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Backup Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      النسخ الاحتياطية
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-blue-500" />
                            <Label className="text-sm font-medium">
                              إنشاء نسخة احتياطية
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            إنشاء نسخة احتياطية من قاعدة البيانات بالكامل
                          </p>
                          <Button
                            className="w-full"
                            size="sm"
                            disabled={createBackupMutation.isPending}
                            onClick={() => createBackupMutation.mutate()}
                          >
                            {createBackupMutation.isPending ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            تصدير النسخة الاحتياطية
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-green-500" />
                            <Label className="text-sm font-medium">
                              استعادة النسخة الاحتياطية
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            استعادة قاعدة البيانات من نسخة احتياطية
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            size="sm"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            تحميل واستعادة
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Enhanced Import/Export Tables */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        استيراد وتصدير الجداول المحسن
                      </h4>
                      {importStep > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetImport}
                        >
                          إعادة تعيين
                        </Button>
                      )}
                    </div>

                    {/* Export Section */}
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Download className="w-4 h-4 text-blue-500" />
                          <Label className="text-sm font-medium">
                            تصدير البيانات
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Label>اختر الجدول للتصدير</Label>
                          <Select
                            value={selectedTable}
                            onValueChange={handleTableChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر جدول للتصدير أو الاستيراد" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customers">
                                العملاء (Customers)
                              </SelectItem>
                              <SelectItem value="categories">
                                الفئات (Categories)
                              </SelectItem>
                              <SelectItem value="sections">
                                الأقسام (Sections)
                              </SelectItem>
                              <SelectItem value="items">
                                الأصناف (Items)
                              </SelectItem>
                              <SelectItem value="customer_products">
                                منتجات العملاء (Customer Products)
                              </SelectItem>
                              <SelectItem value="users">
                                المستخدمين (Users)
                              </SelectItem>
                              <SelectItem value="machines">
                                الماكينات (Machines)
                              </SelectItem>
                              <SelectItem value="locations">
                                المواقع (Locations)
                              </SelectItem>
                              <SelectItem value="orders">
                                الطلبات (Orders)
                              </SelectItem>
                              <SelectItem value="production_orders">
                                أوامر الإنتاج (Production Orders)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={
                              !selectedTable || exportTableMutation.isPending
                            }
                            onClick={() =>
                              selectedTable &&
                              exportTableMutation.mutate({
                                tableName: selectedTable,
                                format: "csv",
                              })
                            }
                          >
                            <Download className="w-4 h-4" />
                            تصدير CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={
                              !selectedTable || exportTableMutation.isPending
                            }
                            onClick={() =>
                              selectedTable &&
                              exportTableMutation.mutate({
                                tableName: selectedTable,
                                format: "json",
                              })
                            }
                          >
                            <Download className="w-4 h-4" />
                            تصدير JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={
                              !selectedTable || exportTableMutation.isPending
                            }
                            onClick={() =>
                              selectedTable &&
                              exportTableMutation.mutate({
                                tableName: selectedTable,
                                format: "excel",
                              })
                            }
                          >
                            <Download className="w-4 h-4" />
                            تصدير Excel
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Import Section */}
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Upload className="w-4 h-4 text-green-500" />
                          <Label className="text-sm font-medium">
                            استيراد البيانات المتقدم
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            الخطوة {importStep} من 3
                          </Badge>
                        </div>

                        {/* Step 1: File Upload */}
                        {importStep === 1 && (
                          <div className="space-y-4">
                            <div
                              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                dragActive
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-300"
                              }`}
                              onDragEnter={handleDrag}
                              onDragLeave={handleDrag}
                              onDragOver={handleDrag}
                              onDrop={handleDrop}
                            >
                              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              {selectedFile ? (
                                <div className="space-y-2">
                                  <p className="text-sm text-green-600 font-medium">
                                    تم اختيار الملف: {selectedFile.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    الحجم:{" "}
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                  </p>
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        selectedFile &&
                                        parseFileData(selectedFile)
                                      }
                                      disabled={!selectedTable}
                                    >
                                      <Upload className="w-4 h-4 mr-2" />
                                      تحليل البيانات
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedFile(null)}
                                    >
                                      إلغاء
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600 mb-2">
                                    اسحب وأفلت ملف البيانات هنا أو انقر للتصفح
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    صيغ مدعومة: CSV, JSON, Excel (.xlsx)
                                  </p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    يدعم حتى 5000+ سجل مع معالجة الدفعات
                                  </p>
                                  <input
                                    type="file"
                                    id="fileInput"
                                    className="hidden"
                                    accept=".csv,.json,.xlsx"
                                    onChange={(e) =>
                                      handleFileUpload(e.target.files)
                                    }
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={() =>
                                      document
                                        .getElementById("fileInput")
                                        ?.click()
                                    }
                                  >
                                    اختيار ملف
                                  </Button>
                                </>
                              )}
                            </div>

                            {!selectedTable && (
                              <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-700">
                                  يرجى اختيار الجدول أولاً من قسم التصدير أعلاه
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 2: Data Preview & Column Mapping */}
                        {importStep === 2 && fileData.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-medium">
                                معاينة البيانات وربط الأعمدة
                              </h5>
                              <Badge variant="secondary">
                                {fileData.length} سجل
                              </Badge>
                            </div>

                            {/* Column Mapping */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">
                                ربط أعمدة الملف مع أعمدة الجدول
                              </Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                                {getTableSchema(selectedTable).map(
                                  (dbColumn) => (
                                    <div
                                      key={dbColumn}
                                      className="flex items-center gap-2 text-sm"
                                    >
                                      <Label className="w-24 text-right font-medium">
                                        {dbColumn}:
                                      </Label>
                                      <Select
                                        value={columnMapping[dbColumn] || ""}
                                        onValueChange={(value) =>
                                          setColumnMapping((prev) => ({
                                            ...prev,
                                            [dbColumn]: value,
                                          }))
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="اختر عمود" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            -- لا شيء --
                                          </SelectItem>
                                          {fileHeaders.map((header) => (
                                            <SelectItem
                                              key={header}
                                              value={header}
                                            >
                                              {header}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            {/* Import Options */}
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">
                                خيارات الاستيراد
                              </Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-lg bg-gray-50">
                                <div className="space-y-2">
                                  <Label className="text-xs">حجم الدفعة</Label>
                                  <Select
                                    value={importOptions.batchSize.toString()}
                                    onValueChange={(value) =>
                                      setImportOptions((prev) => ({
                                        ...prev,
                                        batchSize: parseInt(value),
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="500">
                                        500 سجل
                                      </SelectItem>
                                      <SelectItem value="1000">
                                        1000 سجل
                                      </SelectItem>
                                      <SelectItem value="2000">
                                        2000 سجل
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={importOptions.updateExisting}
                                      onCheckedChange={(checked) =>
                                        setImportOptions((prev) => ({
                                          ...prev,
                                          updateExisting: checked,
                                        }))
                                      }
                                    />
                                    <Label className="text-xs">
                                      تحديث البيانات الموجودة
                                    </Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={importOptions.continueOnError}
                                      onCheckedChange={(checked) =>
                                        setImportOptions((prev) => ({
                                          ...prev,
                                          continueOnError: checked,
                                        }))
                                      }
                                    />
                                    <Label className="text-xs">
                                      المتابعة عند حدوث خطأ
                                    </Label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Data Preview */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                معاينة البيانات (أول 5 سجلات)
                              </Label>
                              <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      {fileHeaders
                                        .slice(0, 5)
                                        .map((header, index) => (
                                          <th
                                            key={index}
                                            className="p-2 text-right border"
                                          >
                                            {header}
                                          </th>
                                        ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {fileData.slice(0, 5).map((row, index) => (
                                      <tr
                                        key={index}
                                        className="hover:bg-gray-50"
                                      >
                                        {fileHeaders
                                          .slice(0, 5)
                                          .map((header, colIndex) => (
                                            <td
                                              key={colIndex}
                                              className="p-2 border"
                                            >
                                              {row[header] || ""}
                                            </td>
                                          ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setImportStep(1)}
                              >
                                العودة
                              </Button>
                              <Button onClick={handleStartImport}>
                                بدء الاستيراد
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Import Progress & Results */}
                        {importStep === 3 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-medium">
                                نتائج الاستيراد
                              </h5>
                              <Badge
                                variant={
                                  importProgress.processing
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {importProgress.processing
                                  ? "جاري المعالجة..."
                                  : "اكتمل"}
                              </Badge>
                            </div>

                            {importProgress.processing && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>التقدم</span>
                                  <span>
                                    {importProgress.current} /{" "}
                                    {importProgress.total}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${importProgress.percentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <div className="text-center text-sm text-gray-600">
                                  {importProgress.percentage}% مكتمل
                                </div>
                              </div>
                            )}

                            {importProgress.errors.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-red-600">
                                  الأخطاء
                                </Label>
                                <div className="max-h-32 overflow-y-auto p-3 bg-red-50 border border-red-200 rounded-lg">
                                  {importProgress.errors.map((error, index) => (
                                    <p
                                      key={index}
                                      className="text-xs text-red-700 mb-1"
                                    >
                                      {error}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {importProgress.warnings.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-yellow-600">
                                  التحذيرات
                                </Label>
                                <div className="max-h-32 overflow-y-auto p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  {importProgress.warnings.map(
                                    (warning, index) => (
                                      <p
                                        key={index}
                                        className="text-xs text-yellow-700 mb-1"
                                      >
                                        {warning}
                                      </p>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={resetImport}>
                                استيراد جديد
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  <Separator />

                  {/* Database Statistics */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      إحصائيات قاعدة البيانات
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {databaseStats.tableCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            عدد الجداول
                          </div>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {databaseStats.totalRecords.toLocaleString("ar-SA")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            إجمالي السجلات
                          </div>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {databaseStats.databaseSize}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            حجم قاعدة البيانات
                          </div>
                        </div>
                      </Card>
                      <Card className="p-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {databaseStats.lastBackup}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            آخر نسخة احتياطية
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Maintenance Operations */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <SettingsIcon className="w-4 h-4" />
                      عمليات الصيانة
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={optimizeTablesMutation.isPending}
                        onClick={() => optimizeTablesMutation.mutate()}
                      >
                        {optimizeTablesMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        تحسين الجداول
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={integrityCheckMutation.isPending}
                        onClick={() => integrityCheckMutation.mutate()}
                      >
                        {integrityCheckMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Database className="w-4 h-4" />
                        )}
                        فحص التكامل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={cleanupDataMutation.isPending}
                        onClick={() => cleanupDataMutation.mutate()}
                      >
                        {cleanupDataMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        تنظيف البيانات القديمة
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      حفظ إعدادات قاعدة البيانات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    الأمان والخصوصية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        تغيير كلمة المرور
                      </h4>
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">
                          كلمة المرور الحالية
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="أدخل كلمة المرور الحالية"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="أدخل كلمة المرور الجديدة"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          تأكيد كلمة المرور
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="أعد إدخال كلمة المرور"
                        />
                      </div>
                      <Button className="mt-2">تحديث كلمة المرور</Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">إعدادات الجلسة</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">
                          انتهاء صلاحية الجلسة التلقائي
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          تسجيل الخروج التلقائي عند عدم النشاط
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">
                        مدة انتهاء الصلاحية
                      </Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 دقيقة</SelectItem>
                          <SelectItem value="30">30 دقيقة</SelectItem>
                          <SelectItem value="60">ساعة واحدة</SelectItem>
                          <SelectItem value="120">ساعتان</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notification-center" className="space-y-6">
              <NotificationCenter />
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات موقع المصنع</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    حدد الموقع الجغرافي للمصنع والنطاق المسموح لتسجيل الحضور
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <LocationSettingsForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp-webhooks" className="space-y-6">
              <WhatsAppWebhooksTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Component for Location Settings with Multiple Locations
function LocationSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [latitude, setLatitude] = useState(24.7136);
  const [longitude, setLongitude] = useState(46.6753);
  const [radius, setRadius] = useState(500);
  const [description, setDescription] = useState("");

  // Fetch factory locations
  const { data: locations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/factory-locations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/factory-locations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factory-locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({ title: "تم إضافة الموقع بنجاح" });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطأ في إضافة الموقع", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/factory-locations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factory-locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({ title: "تم تحديث الموقع بنجاح" });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطأ في تحديث الموقع", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/factory-locations/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factory-locations"] });
      toast({ title: "تم حذف الموقع بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف الموقع", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await apiRequest(`/api/factory-locations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !isActive }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/factory-locations"] });
      toast({ title: "تم تحديث حالة الموقع" });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingLocation(null);
    setName("");
    setNameAr("");
    setLatitude(24.7136);
    setLongitude(46.6753);
    setRadius(500);
    setDescription("");
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location);
    setName(location.name);
    setNameAr(location.name_ar);
    setLatitude(parseFloat(location.latitude));
    setLongitude(parseFloat(location.longitude));
    setRadius(location.allowed_radius);
    setDescription(location.description || "");
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!name || !nameAr) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    const data = {
      name,
      name_ar: nameAr,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      allowed_radius: radius,
      description,
      is_active: true,
    };

    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* List of locations */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">مواقع المصانع</h3>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-location">
            <Plus className="w-4 h-4 ml-2" />
            {showForm ? "إلغاء" : "إضافة موقع جديد"}
          </Button>
        </div>

        {locations && locations.length > 0 ? (
          <div className="grid gap-4">
            {locations.map((location: any) => (
              <Card key={location.id} className={!location.is_active ? "opacity-50" : ""}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{location.name_ar}</h4>
                        <Badge variant={location.is_active ? "default" : "secondary"}>
                          {location.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {location.description || location.name}
                      </p>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>الإحداثيات:</strong> {location.latitude}, {location.longitude}
                        </p>
                        <p>
                          <strong>النطاق:</strong> {location.allowed_radius} متر
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ 
                          id: location.id, 
                          isActive: location.is_active 
                        })}
                        data-testid={`button-toggle-${location.id}`}
                      >
                        {location.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(location)}
                        data-testid={`button-edit-${location.id}`}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(location.id)}
                        data-testid={`button-delete-${location.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">لا توجد مواقع مضافة بعد</p>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingLocation ? "تعديل الموقع" : "إضافة موقع جديد"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name-en">الاسم (English)</Label>
                <Input
                  id="name-en"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Main Factory"
                  data-testid="input-name-en"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name-ar">الاسم (عربي)</Label>
                <Input
                  id="name-ar"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="المصنع الرئيسي"
                  data-testid="input-name-ar"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف الموقع..."
                data-testid="input-description"
              />
            </div>

            <div className="space-y-2">
              <Label>اختر الموقع من الخريطة</Label>
              <LocationMapPicker
                latitude={latitude}
                longitude={longitude}
                radius={radius}
                onLocationChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                editable={true}
              />
              <p className="text-xs text-gray-500">
                انقر على الخريطة لتحديد الموقع
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lat">دائرة العرض</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  data-testid="input-lat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">خط الطول</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  data-testid="input-lng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radius">النطاق (متر)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  data-testid="input-radius"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
                data-testid="button-submit-location"
              >
                <Save className="w-4 h-4 ml-2" />
                {editingLocation ? "تحديث الموقع" : "إضافة الموقع"}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                data-testid="button-cancel-form"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
