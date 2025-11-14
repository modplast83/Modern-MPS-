import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
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
  const { t } = useTranslation();
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

  // Backup restore state
  const backupFileInputRef = useRef<HTMLInputElement>{t('pages.settings.(null);_const_[selectedbackupfile,_setselectedbackupfile]_=_usestate')}<File | null>{t('pages.settings.(null);_const_[showrestoreconfirm,_setshowrestoreconfirm]_=_usestate(false);_const_[pendingbackupdata,_setpendingbackupdata]_=_usestate')}<any>{t('pages.settings.(null);_//_enhanced_file_import_state_const_[selectedfile,_setselectedfile]_=_usestate')}<File | null>{t('pages.settings.(null);_const_[dragactive,_setdragactive]_=_usestate(false);_const_[importstep,_setimportstep]_=_usestate(1);_//_1:_upload,_2:_preview_&_map,_3:_import_const_[filedata,_setfiledata]_=_usestate')}<any[]>{t('pages.settings.([]);_const_[fileheaders,_setfileheaders]_=_usestate')}<string[]>{t('pages.settings.([]);_const_[columnmapping,_setcolumnmapping]_=_usestate')}<{ [key: string]: string }>(
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
        title: t('settings.dataImportedSuccess'),
        description: `${t('settings.recordsImported', { imported: data.count || data.importedRecords, total: data.totalRows || data.count })}`,
      });
    },
    onError: (error) => {
      toast({
        title: t('settings.dataImportError'),
        description:
          error instanceof Error
            ? error.message
            : t('settings.importErrorOccurred'),
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
        title: t('settings.fileParsedSuccess'),
        description: t('settings.foundRecordsColumns', { records: data.length, columns: headers.length }),
      });
    } catch (error) {
      toast({
        title: t('settings.fileParseError'),
        description: t('settings.checkFileFormat'),
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
            title: t('settings.selectTableFirst'),
            description: t('settings.selectTableToImport'),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t('settings.unsupportedFileType'),
          description: t('settings.selectCSVJSONExcel'),
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
        title: t('settings.importComplete'),
        description: t('settings.recordsSuccessFailed', { success: results.successful, failed: results.failed }),
      });
    },
    onError: (error) => {
      setImportProgress((prev) => ({ ...prev, processing: false }));
      toast({
        title: t('settings.importError'),
        description:
          error instanceof Error
            ? error.message
            : t('settings.importErrorOccurred'),
        variant: "destructive",
      });
    },
  });

  // Process and start import
  const handleStartImport = () => {
    if (!selectedFile || !selectedTable || fileData.length === 0) {
      toast({
        title: t('settings.missingData'),
        description: t('settings.checkFileTableData'),
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
        title: t('settings.noValidData'),
        description: t('settings.checkColumnMapping'),
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
      const filenameMatch = contentDisposition?.match(/filename="{t('pages.settings.name.(.+)')}"/);
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
        title: t('settings.backupCreatedSuccess'),
        description: t('settings.backupDownloadedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('settings.backupCreationError'),
        description: t('settings.backupErrorOccurred'),
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
        title: t('settings.optimizeTables'),
        description: t('settings.backupCreatedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('settings.savingError'),
        description: t('settings.saveErrorOccurred'),
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
        title: t('settings.integrityCheck'),
        description: t('settings.settingsSavedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('settings.savingError'),
        description: t('settings.saveErrorOccurred'),
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

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupData: any) => {
      return await apiRequest("/api/database/restore", {
        method: "POST",
        body: JSON.stringify({ backupData }),
      });
    },
    onSuccess: () => {
      toast({
        title: "تم استعادة قاعدة البيانات بنجاح",
        description: "تمت استعادة جميع البيانات من النسخة الاحتياطية",
      });
      setSelectedBackupFile(null);
      setPendingBackupData(null);
      setShowRestoreConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/database/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في استعادة قاعدة البيانات",
        description: error?.message || "حدث خطأ أثناء استعادة النسخة الاحتياطية",
        variant: "destructive",
      });
    },
  });

  // Handle backup file selection
  const handleBackupFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "الملف كبير جداً",
        description: "يجب أن يكون حجم الملف أقل من 50 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.name.endsWith('.json')) {
      toast({
        title: "نوع ملف غير صحيح",
        description: "يجب أن يكون الملف بصيغة JSON",
        variant: "destructive",
      });
      return;
    }

    setSelectedBackupFile(file);

    // Read and parse JSON file
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (!backupData.tables || typeof backupData.tables !== 'object') {
          throw new Error("بنية ملف النسخة الاحتياطية غير صحيحة");
        }

        // Store the data and show confirmation dialog
        setPendingBackupData(backupData);
        setShowRestoreConfirm(true);
      } catch (error) {
        toast({
          title: "خطأ في قراءة الملف",
          description: error instanceof Error ? error.message : "الملف تالف أو غير صالح",
          variant: "destructive",
        });
        setSelectedBackupFile(null);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "خطأ في قراءة الملف",
        description: "فشل في قراءة الملف",
        variant: "destructive",
      });
      setSelectedBackupFile(null);
    };

    reader.readAsText(file);
  };

  // Confirm and execute restore
  const confirmRestore = () => {
    if (pendingBackupData) {
      restoreBackupMutation.mutate(pendingBackupData);
    }
  };

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
        title: t('settings.savingSuccess'),
        description: t('settings.systemSettingsSaved'),
      });
    },
    onError: () => {
      toast({
        title: t('settings.savingError'),
        description: t('settings.systemSettingsSaveError'),
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
    <div className={t("pages.settings.name.min_h_screen_bg_gray_50")}>
      <Header />
      <div className={t("pages.settings.name.flex")}>
        <Sidebar />
        <main className={t("pages.settings.name.flex_1_lg_mr_64_p_6")}>
          <div className={t("pages.settings.name.mb_6")}>
            <h1 className={t("pages.settings.name.text_2xl_font_bold_text_gray_900_mb_2")}>{t('settings.title')}</h1>
            <p className={t("pages.settings.name.text_gray_600")}>
              {t('settings.description')}
            </p>
          </div>

          <Tabs defaultValue="roles" className={t("pages.settings.name.space_y_6")}>
            <TabsList className={t("pages.settings.name.grid_w_full_grid_cols_4_md_grid_cols_7")}>
              <TabsTrigger value="roles" className={t("pages.settings.name.flex_items_center_gap_2")}>
                <Shield className={t("pages.settings.name.w_4_h_4")} />
                {t('settings.rolesAndPermissions')}
              </TabsTrigger>
              <TabsTrigger value="notifications" className={t("pages.settings.name.flex_items_center_gap_2")}>
                <Bell className={t("pages.settings.name.w_4_h_4")} />
                {t('settings.alerts')}
              </TabsTrigger>
              <TabsTrigger value="system" className={t("pages.settings.name.flex_items_center_gap_2")}>
                <SettingsIcon className={t("pages.settings.name.w_4_h_4")} />
                {t('settings.systemSettings')}
              </TabsTrigger>
              <TabsTrigger value="database" className={t("pages.settings.name.flex_items_center_gap_2")}>
                <Database className={t("pages.settings.name.w_4_h_4")} />
                {t('settings.database')}
              </TabsTrigger>
              <TabsTrigger value="location" className={t("pages.settings.name.flex_items_center_gap_2")}>
                <MapPin className={t("pages.settings.name.w_4_h_4")} />
                {t('settings.factoryLocation')}
              </TabsTrigger>
              <TabsTrigger value="notification-center" className={t("pages.settings.name.flex_items_center_gap_2")}>
                <MessageSquare className={t("pages.settings.name.w_4_h_4")} />
                {t('settings.notificationCenter')}
              </TabsTrigger>
              <TabsTrigger value="whatsapp-webhooks" className={t("pages.settings.name.flex_items_center_gap_2")}>
                <Webhook className={t("pages.settings.name.w_4_h_4")} />
                {t('settings.whatsappWebhooks')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className={t("pages.settings.name.space_y_6")}>
              <Card>
                <CardHeader>
                  <CardTitle className={t("pages.settings.name.flex_items_center_gap_2")}>
                    <Shield className={t("pages.settings.name.w_5_h_5")} />
                    {t('settings.roleManagement')}
                  </CardTitle>
                  <p className={t("pages.settings.name.text_sm_text_muted_foreground")}>
                    {t('settings.roleManagementDesc')}
                  </p>
                </CardHeader>
                <CardContent>
                  <RoleManagementTab />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className={t("pages.settings.name.space_y_6")}>
              <Card>
                <CardHeader>
                  <CardTitle className={t("pages.settings.name.flex_items_center_gap_2")}>
                    <Bell className={t("pages.settings.name.w_5_h_5")} />
                    {t('settings.notificationSettings')}
                  </CardTitle>
                </CardHeader>
                <CardContent className={t("pages.settings.name.space_y_4")}>
                  <div className={t("pages.settings.name.space_y_4")}>
                    <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                      <div>
                        <Label className={t("pages.settings.name.text_base")}>
                          {t('settings.emailNotifications')}
                        </Label>
                        <p className={t("pages.settings.name.text_sm_text_muted_foreground")}>
                          {t('settings.emailNotificationsDesc')}
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

                    <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                      <div>
                        <Label className={t("pages.settings.name.text_base")}>
                          {t('settings.smsNotifications')}
                        </Label>
                        <p className={t("pages.settings.name.text_sm_text_muted_foreground")}>
                          {t('settings.smsNotificationsDesc')}
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

                    <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                      <div>
                        <Label className={t("pages.settings.name.text_base")}>{t('settings.instantNotifications')}</Label>
                        <p className={t("pages.settings.name.text_sm_text_muted_foreground")}>
                          {t('settings.instantNotificationsDesc')}
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

                    <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                      <div className={t("pages.settings.name.flex_items_center_gap_2")}>
                        {userSettings.notifications.sound ? (
                          <Volume2 className={t("pages.settings.name.w_4_h_4")} />{t('pages.settings.)_:_(')}<VolumeX className={t("pages.settings.name.w_4_h_4")} />
                        )}
                        <div>
                          <Label className={t("pages.settings.name.text_base")}>{t('settings.soundNotifications')}</Label>
                          <p className={t("pages.settings.name.text_sm_text_muted_foreground")}>
                            {t('settings.soundNotificationsDesc')}
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

                  <div className={t("pages.settings.name.space_y_4")}>
                    <h4 className={t("pages.settings.name.text_sm_font_medium")}>{t('settings.dashboardSettings')}</h4>
                    <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                      <div>
                        <Label className={t("pages.settings.name.text_base")}>{t('settings.autoRefresh')}</Label>
                        <p className={t("pages.settings.name.text_sm_text_muted_foreground")}>
                          {t('settings.autoRefreshDesc')}
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
                      <div className={t("pages.settings.name.space_y_2")}>
                        <Label htmlFor="refreshInterval">
                          {t('settings.refreshInterval')}
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
                            <SelectItem value="15">{t('settings.15seconds')}</SelectItem>
                            <SelectItem value="30">{t('settings.30seconds')}</SelectItem>
                            <SelectItem value="60">{t('settings.1minute')}</SelectItem>
                            <SelectItem value="300">{t('settings.5minutes')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className={t("pages.settings.name.flex_justify_end")}>
                    <Button
                      onClick={handleSaveUserSettings}
                      disabled={saveUserSettingsMutation.isPending}
                    >
                      {saveUserSettingsMutation.isPending ? (
                        <RefreshCw className={t("pages.settings.name.w_4_h_4_mr_2_animate_spin")} />{t('pages.settings.)_:_(')}<Save className={t("pages.settings.name.w_4_h_4_mr_2")} />
                      )}
                      {t('settings.saveChanges')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className={t("pages.settings.name.space_y_6")}>
              <Card>
                <CardHeader>
                  <CardTitle className={t("pages.settings.name.flex_items_center_gap_2")}>
                    <SettingsIcon className={t("pages.settings.name.w_5_h_5")} />
                    {t('settings.systemGeneralSettings')}
                  </CardTitle>
                </CardHeader>
                <CardContent className={t("pages.settings.name.space_y_4")}>
                  <div className={t("pages.settings.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
                    <div className={t("pages.settings.name.space_y_2")}>
                      <Label htmlFor="companyName">{t('settings.companyName')}</Label>
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
                    <div className={t("pages.settings.name.space_y_2")}>
                      <Label htmlFor="country">{t('settings.country')}</Label>
                      <Input
                        id="country"
                        value={systemSettings.country}
                        readOnly
                        className={t("pages.settings.name.bg_muted")}
                      />
                    </div>
                    <div className={t("pages.settings.name.space_y_2")}>
                      <Label htmlFor="region">{t('settings.region')}</Label>
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
                          <SelectItem value="الرياض">{t('settings.riyadh')}</SelectItem>
                          <SelectItem value="جدة">{t('settings.jeddah')}</SelectItem>
                          <SelectItem value="الدمام">{t('settings.dammam')}</SelectItem>
                          <SelectItem value="مكة المكرمة">
                            {t('settings.mecca')}
                          </SelectItem>
                          <SelectItem value="المدينة المنورة">
                            {t('settings.medina')}
                          </SelectItem>
                          <SelectItem value="تبوك">{t('settings.tabuk')}</SelectItem>
                          <SelectItem value="أبها">{t('settings.abha')}</SelectItem>
                          <SelectItem value="حائل">{t('settings.hail')}</SelectItem>
                          <SelectItem value="الطائف">{t('settings.taif')}</SelectItem>
                          <SelectItem value="الخبر">{t('settings.khobar')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={t("pages.settings.name.space_y_2")}>
                      <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                      <Input
                        id="timezone"
                        value={t('settings.riyadhUTC')}
                        readOnly
                        className={t("pages.settings.name.bg_muted")}
                      />
                    </div>
                    <div className={t("pages.settings.name.space_y_2")}>
                      <Label htmlFor="currency">{t('settings.currency')}</Label>
                      <Input
                        id="currency"
                        value={t('settings.saudiRiyal')}
                        readOnly
                        className={t("pages.settings.name.bg_muted")}
                      />
                    </div>
                    <div className={t("pages.settings.name.space_y_2")}>
                      <Label htmlFor="language">{t('settings.systemLanguage')}</Label>
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
                          <SelectItem value="ar">{t('settings.arabic')}</SelectItem>
                          <SelectItem value="en">{t('settings.english')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className={t("pages.settings.name.space_y_4")}>
                    <h4 className={t("pages.settings.name.text_sm_font_medium")}>{t('settings.workingHours')}</h4>
                    <div className={t("pages.settings.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
                      <div className={t("pages.settings.name.space_y_2")}>
                        <Label htmlFor="workStart">{t('settings.workStart')}</Label>
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
                      <div className={t("pages.settings.name.space_y_2")}>
                        <Label htmlFor="workEnd">{t('settings.workEnd')}</Label>
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

                  <div className={t("pages.settings.name.space_y_4")}>
                    <h4 className={t("pages.settings.name.text_sm_font_medium")}>{t('settings.shifts')}</h4>
                    <div className={t("pages.settings.name.space_y_2")}>
                      {systemSettings.shifts.map((shift) => (
                        <div
                          key={shift.id}
                          className={t("pages.settings.name.flex_items_center_justify_between_p_3_border_rounded_lg")}
                        >
                          <div>
                            <span className={t("pages.settings.name.font_medium")}>{shift.name}</span>
                            <p className={t("pages.settings.name.text_sm_text_muted_foreground")}>
                              {t('settings.from')} {shift.start} {t('settings.to')} {shift.end}
                            </p>
                          </div>
                          <Badge variant="outline">{t('settings.active')}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={t("pages.settings.name.flex_justify_end")}>
                    <Button
                      onClick={handleSaveSystemSettings}
                      disabled={saveSystemSettingsMutation.isPending}
                    >
                      {saveSystemSettingsMutation.isPending ? (
                        <RefreshCw className={t("pages.settings.name.w_4_h_4_mr_2_animate_spin")} />{t('pages.settings.)_:_(')}<Save className={t("pages.settings.name.w_4_h_4_mr_2")} />
                      )}
                      {t('settings.saveSystemSettings')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database" className={t("pages.settings.name.space_y_6")}>
              <Card>
                <CardHeader>
                  <CardTitle className={t("pages.settings.name.flex_items_center_gap_2")}>
                    <Database className={t("pages.settings.name.w_5_h_5")} />
                    {t('settings.databaseManagement')}
                  </CardTitle>
                </CardHeader>
                <CardContent className={t("pages.settings.name.space_y_6")}>
                  {/* Backup Section */}
                  <div className={t("pages.settings.name.space_y_4")}>
                    <h4 className={t("pages.settings.name.text_sm_font_medium_flex_items_center_gap_2")}>
                      <Archive className={t("pages.settings.name.w_4_h_4")} />
                      {t('settings.backup')}
                    </h4>
                    <div className={t("pages.settings.name.grid_grid_cols_1_md_grid_cols_2_gap_4")}>
                      <Card className={t("pages.settings.name.p_4")}>
                        <div className={t("pages.settings.name.space_y_3")}>
                          <div className={t("pages.settings.name.flex_items_center_gap_2")}>
                            <Download className={t("pages.settings.name.w_4_h_4_text_blue_500")} />
                            <Label className={t("pages.settings.name.text_sm_font_medium")}>
                              {t('settings.createBackup')}
                            </Label>
                          </div>
                          <p className={t("pages.settings.name.text_xs_text_muted_foreground")}>
                            {t('settings.createBackupDesc')}
                          </p>
                          <Button
                            className={t("pages.settings.name.w_full")}
                            size="sm"
                            disabled={createBackupMutation.isPending}
                            onClick={() => createBackupMutation.mutate()}
                          >
                            {createBackupMutation.isPending ? (
                              <RefreshCw className={t("pages.settings.name.w_4_h_4_mr_2_animate_spin")} />{t('pages.settings.)_:_(')}<Download className={t("pages.settings.name.w_4_h_4_mr_2")} />
                            )}
                            {t('settings.exportBackup')}
                          </Button>
                        </div>
                      </Card>

                      <Card className={t("pages.settings.name.p_4")}>
                        <div className={t("pages.settings.name.space_y_3")}>
                          <div className={t("pages.settings.name.flex_items_center_gap_2")}>
                            <Upload className={t("pages.settings.name.w_4_h_4_text_green_500")} />
                            <Label className={t("pages.settings.name.text_sm_font_medium")}>
                              {t('settings.restoreBackup')}
                            </Label>
                          </div>
                          <p className={t("pages.settings.name.text_xs_text_muted_foreground")}>
                            {t('settings.restoreBackupDesc')}
                          </p>
                          <input
                            type="file"
                            ref={backupFileInputRef}
                            onChange={handleBackupFileSelect}
                            accept=".json"
                            className={t("pages.settings.name.hidden")}
                            data-testid="input-backup-file"
                          />
                          <Button
                            variant="outline"
                            className={t("pages.settings.name.w_full")}
                            size="sm"
                            onClick={() => backupFileInputRef.current?.click()}
                            disabled={restoreBackupMutation.isPending}
                            data-testid="button-restore-backup"
                          >
                            {restoreBackupMutation.isPending ? (
                              <RefreshCw className={t("pages.settings.name.w_4_h_4_mr_2_animate_spin")} />{t('pages.settings.)_:_(')}<Upload className={t("pages.settings.name.w_4_h_4_mr_2")} />
                            )}
                            {selectedBackupFile ? selectedBackupFile.name : t('settings.selectFileRestore')}
                          </Button>
                          {selectedBackupFile && !restoreBackupMutation.isPending && (
                            <p className={t("pages.settings.name.text_xs_text_green_600")}>
                              {t('settings.selected')}: {selectedBackupFile.name}
                            </p>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Enhanced Import/Export Tables */}
                  <div className={t("pages.settings.name.space_y_4")}>
                    <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                      <h4 className={t("pages.settings.name.text_sm_font_medium_flex_items_center_gap_2")}>
                        <HardDrive className={t("pages.settings.name.w_4_h_4")} />{t('pages.settings.استيراد_وتصدير_الجداول_المحسن')}</h4>
                      {importStep >{t('pages.settings.1_&&_(')}<Button
                          variant="outline"
                          size="sm"
                          onClick={resetImport}
                        >{t('pages.settings.إعادة_تعيين')}</Button>
                      )}
                    </div>

                    {/* Export Section */}
                    <Card className={t("pages.settings.name.p_4")}>
                      <div className={t("pages.settings.name.space_y_4")}>
                        <div className={t("pages.settings.name.flex_items_center_gap_2_mb_3")}>
                          <Download className={t("pages.settings.name.w_4_h_4_text_blue_500")} />
                          <Label className={t("pages.settings.name.text_sm_font_medium")}>{t('pages.settings.تصدير_البيانات')}</Label>
                        </div>

                        <div className={t("pages.settings.name.space_y_2")}>
                          <Label>{t('pages.settings.اختر_الجدول_للتصدير')}</Label>
                          <Select
                            value={selectedTable}
                            onValueChange={handleTableChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="{t('pages.settings.placeholder.اختر_جدول_للتصدير_أو_الاستيراد')}" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customers">{t('pages.settings.العملاء_(customers)')}</SelectItem>
                              <SelectItem value="categories">{t('pages.settings.الفئات_(categories)')}</SelectItem>
                              <SelectItem value="sections">{t('pages.settings.الأقسام_(sections)')}</SelectItem>
                              <SelectItem value="items">{t('pages.settings.الأصناف_(items)')}</SelectItem>
                              <SelectItem value="customer_products">{t('pages.settings.منتجات_العملاء_(customer_products)')}</SelectItem>
                              <SelectItem value="users">{t('pages.settings.المستخدمين_(users)')}</SelectItem>
                              <SelectItem value="machines">{t('pages.settings.الماكينات_(machines)')}</SelectItem>
                              <SelectItem value="locations">{t('pages.settings.المواقع_(locations)')}</SelectItem>
                              <SelectItem value="orders">{t('pages.settings.الطلبات_(orders)')}</SelectItem>
                              <SelectItem value="production_orders">{t('pages.settings.أوامر_الإنتاج_(production_orders)')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className={t("pages.settings.name.grid_grid_cols_1_md_grid_cols_3_gap_3")}>
                          <Button
                            variant="outline"
                            size="sm"
                            className={t("pages.settings.name.flex_items_center_gap_2")}
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
                            <Download className={t("pages.settings.name.w_4_h_4")} />{t('pages.settings.تصدير_csv')}</Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={t("pages.settings.name.flex_items_center_gap_2")}
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
                            <Download className={t("pages.settings.name.w_4_h_4")} />{t('pages.settings.تصدير_json')}</Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={t("pages.settings.name.flex_items_center_gap_2")}
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
                            <Download className={t("pages.settings.name.w_4_h_4")} />{t('pages.settings.تصدير_excel')}</Button>
                        </div>
                      </div>
                    </Card>

                    {/* Import Section */}
                    <Card className={t("pages.settings.name.p_4")}>
                      <div className={t("pages.settings.name.space_y_4")}>
                        <div className={t("pages.settings.name.flex_items_center_gap_2_mb_3")}>
                          <Upload className={t("pages.settings.name.w_4_h_4_text_green_500")} />
                          <Label className={t("pages.settings.name.text_sm_font_medium")}>{t('pages.settings.استيراد_البيانات_المتقدم')}</Label>
                          <Badge variant="outline" className={t("pages.settings.name.text_xs")}>
                            الخطوة {importStep} من 3
                          </Badge>
                        </div>

                        {/* Step 1: File Upload */}
                        {importStep === 1 && (
                          <div className={t("pages.settings.name.space_y_4")}>
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
                              <Upload className={t("pages.settings.name.w_8_h_8_mx_auto_text_gray_400_mb_2")} />
                              {selectedFile ? (
                                <div className={t("pages.settings.name.space_y_2")}>
                                  <p className={t("pages.settings.name.text_sm_text_green_600_font_medium")}>
                                    تم اختيار الملف: {selectedFile.name}
                                  </p>
                                  <p className={t("pages.settings.name.text_xs_text_gray_500")}>
                                    الحجم:{" "}
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                  </p>
                                  <div className={t("pages.settings.name.flex_gap_2_justify_center")}>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        selectedFile &&
                                        parseFileData(selectedFile)
                                      }
                                      disabled={!selectedTable}
                                    >
                                      <Upload className={t("pages.settings.name.w_4_h_4_mr_2")} />{t('pages.settings.تحليل_البيانات')}</Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedFile(null)}
                                    >{t('pages.settings.إلغاء')}</Button>
                                  </div>
                                </div>{t('pages.settings.)_:_(')}<>
                                  <p className={t("pages.settings.name.text_sm_text_gray_600_mb_2")}>{t('pages.settings.اسحب_وأفلت_ملف_البيانات_هنا_أو_انقر_للتصفح')}</p>
                                  <p className={t("pages.settings.name.text_xs_text_gray_500")}>{t('pages.settings.صيغ_مدعومة:_csv,_json,_excel_(.xlsx)')}</p>
                                  <p className={t("pages.settings.name.text_xs_text_blue_600_mt_1")}>{t('pages.settings.يدعم_حتى_5000+_سجل_مع_معالجة_الدفعات')}</p>
                                  <input
                                    type="file"
                                    id="fileInput"
                                    className={t("pages.settings.name.hidden")}
                                    accept=".csv,.json,.xlsx"
                                    onChange={(e) =>
                                      handleFileUpload(e.target.files)
                                    }
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={t("pages.settings.name.mt_3")}
                                    onClick={() =>
                                      document
                                        .getElementById("fileInput")
                                        ?.click()
                                    }
                                  >{t('pages.settings.اختيار_ملف')}</Button>
                                </>
                              )}
                            </div>

                            {!selectedTable && (
                              <div className={t("pages.settings.name.text_center_p_3_bg_yellow_50_border_border_yellow_200_rounded_lg")}>
                                <p className={t("pages.settings.name.text_sm_text_yellow_700")}>{t('pages.settings.يرجى_اختيار_الجدول_أولاً_من_قسم_التصدير_أعلاه')}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Step 2: Data Preview & Column Mapping */}
                        {importStep === 2 && fileData.length >{t('pages.settings.0_&&_(')}<div className={t("pages.settings.name.space_y_4")}>
                            <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                              <h5 className={t("pages.settings.name.text_sm_font_medium")}>{t('pages.settings.معاينة_البيانات_وربط_الأعمدة')}</h5>
                              <Badge variant="secondary">
                                {fileData.length} سجل
                              </Badge>
                            </div>

                            {/* Column Mapping */}
                            <div className={t("pages.settings.name.space_y_3")}>
                              <Label className={t("pages.settings.name.text_sm_font_medium")}>{t('pages.settings.ربط_أعمدة_الملف_مع_أعمدة_الجدول')}</Label>
                              <div className={t("pages.settings.name.grid_grid_cols_1_md_grid_cols_2_gap_3_max_h_48_overflow_y_auto_p_3_border_rounded_lg_bg_gray_50")}>
                                {getTableSchema(selectedTable).map(
                                  (dbColumn) => (
                                    <div
                                      key={dbColumn}
                                      className={t("pages.settings.name.flex_items_center_gap_2_text_sm")}
                                    >
                                      <Label className={t("pages.settings.name.w_24_text_right_font_medium")}>
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
                                        <SelectTrigger className={t("pages.settings.name.h_8_text_xs")}>
                                          <SelectValue placeholder="{t('pages.settings.placeholder.اختر_عمود')}" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">{t('pages.settings.--_لا_شيء_--')}</SelectItem>
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
                            <div className={t("pages.settings.name.space_y_3")}>
                              <Label className={t("pages.settings.name.text_sm_font_medium")}>{t('pages.settings.خيارات_الاستيراد')}</Label>
                              <div className={t("pages.settings.name.grid_grid_cols_1_md_grid_cols_2_gap_4_p_3_border_rounded_lg_bg_gray_50")}>
                                <div className={t("pages.settings.name.space_y_2")}>
                                  <Label className={t("pages.settings.name.text_xs")}>{t('pages.settings.حجم_الدفعة')}</Label>
                                  <Select
                                    value={importOptions.batchSize.toString()}
                                    onValueChange={(value) =>
                                      setImportOptions((prev) => ({
                                        ...prev,
                                        batchSize: parseInt(value),
                                      }))
                                    }
                                  >
                                    <SelectTrigger className={t("pages.settings.name.h_8")}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="500">{t('pages.settings.500_سجل')}</SelectItem>
                                      <SelectItem value="1000">{t('pages.settings.1000_سجل')}</SelectItem>
                                      <SelectItem value="2000">{t('pages.settings.2000_سجل')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className={t("pages.settings.name.space_y_2")}>
                                  <div className={t("pages.settings.name.flex_items_center_gap_2")}>
                                    <Switch
                                      checked={importOptions.updateExisting}
                                      onCheckedChange={(checked) =>
                                        setImportOptions((prev) => ({
                                          ...prev,
                                          updateExisting: checked,
                                        }))
                                      }
                                    />
                                    <Label className={t("pages.settings.name.text_xs")}>{t('pages.settings.تحديث_البيانات_الموجودة')}</Label>
                                  </div>
                                  <div className={t("pages.settings.name.flex_items_center_gap_2")}>
                                    <Switch
                                      checked={importOptions.continueOnError}
                                      onCheckedChange={(checked) =>
                                        setImportOptions((prev) => ({
                                          ...prev,
                                          continueOnError: checked,
                                        }))
                                      }
                                    />
                                    <Label className={t("pages.settings.name.text_xs")}>{t('pages.settings.المتابعة_عند_حدوث_خطأ')}</Label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Data Preview */}
                            <div className={t("pages.settings.name.space_y_2")}>
                              <Label className={t("pages.settings.name.text_sm_font_medium")}>{t('pages.settings.معاينة_البيانات_(أول_5_سجلات)')}</Label>
                              <div className={t("pages.settings.name.overflow_x_auto_border_rounded_lg")}>
                                <table className={t("pages.settings.name.w_full_text_xs")}>
                                  <thead className={t("pages.settings.name.bg_gray_100")}>
                                    <tr>
                                      {fileHeaders
                                        .slice(0, 5)
                                        .map((header, index) => (
                                          <th
                                            key={index}
                                            className={t("pages.settings.name.p_2_text_right_border")}
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
                                        className={t("pages.settings.name.hover_bg_gray_50")}
                                      >
                                        {fileHeaders
                                          .slice(0, 5)
                                          .map((header, colIndex) => (
                                            <td
                                              key={colIndex}
                                              className={t("pages.settings.name.p_2_border")}
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

                            <div className={t("pages.settings.name.flex_gap_2_justify_end")}>
                              <Button
                                variant="outline"
                                onClick={() => setImportStep(1)}
                              >{t('pages.settings.العودة')}</Button>
                              <Button onClick={handleStartImport}>{t('pages.settings.بدء_الاستيراد')}</Button>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Import Progress & Results */}
                        {importStep === 3 && (
                          <div className={t("pages.settings.name.space_y_4")}>
                            <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                              <h5 className={t("pages.settings.name.text_sm_font_medium")}>{t('pages.settings.نتائج_الاستيراد')}</h5>
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
                              <div className={t("pages.settings.name.space_y_2")}>
                                <div className={t("pages.settings.name.flex_justify_between_text_sm")}>
                                  <span>{t('pages.settings.التقدم')}</span>
                                  <span>
                                    {importProgress.current} /{" "}
                                    {importProgress.total}
                                  </span>
                                </div>
                                <div className={t("pages.settings.name.w_full_bg_gray_200_rounded_full_h_2")}>
                                  <div
                                    className={t("pages.settings.name.bg_blue_600_h_2_rounded_full_transition_all_duration_300")}
                                    style={{
                                      width: `${importProgress.percentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <div className={t("pages.settings.name.text_center_text_sm_text_gray_600")}>
                                  {importProgress.percentage}% مكتمل
                                </div>
                              </div>
                            )}

                            {importProgress.errors.length >{t('pages.settings.0_&&_(')}<div className={t("pages.settings.name.space_y_2")}>
                                <Label className={t("pages.settings.name.text_sm_font_medium_text_red_600")}>{t('pages.settings.الأخطاء')}</Label>
                                <div className={t("pages.settings.name.max_h_32_overflow_y_auto_p_3_bg_red_50_border_border_red_200_rounded_lg")}>
                                  {importProgress.errors.map((error, index) => (
                                    <p
                                      key={index}
                                      className={t("pages.settings.name.text_xs_text_red_700_mb_1")}
                                    >
                                      {error}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {importProgress.warnings.length >{t('pages.settings.0_&&_(')}<div className={t("pages.settings.name.space_y_2")}>
                                <Label className={t("pages.settings.name.text_sm_font_medium_text_yellow_600")}>{t('pages.settings.التحذيرات')}</Label>
                                <div className={t("pages.settings.name.max_h_32_overflow_y_auto_p_3_bg_yellow_50_border_border_yellow_200_rounded_lg")}>
                                  {importProgress.warnings.map(
                                    (warning, index) => (
                                      <p
                                        key={index}
                                        className={t("pages.settings.name.text_xs_text_yellow_700_mb_1")}
                                      >
                                        {warning}
                                      </p>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            <div className={t("pages.settings.name.flex_gap_2_justify_end")}>
                              <Button variant="outline" onClick={resetImport}>{t('pages.settings.استيراد_جديد')}</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  <Separator />

                  {/* Database Statistics */}
                  <div className={t("pages.settings.name.space_y_4")}>
                    <h4 className={t("pages.settings.name.text_sm_font_medium_flex_items_center_gap_2")}>
                      <HardDrive className={t("pages.settings.name.w_4_h_4")} />{t('pages.settings.إحصائيات_قاعدة_البيانات')}</h4>

                    <div className={t("pages.settings.name.grid_grid_cols_2_md_grid_cols_4_gap_4")}>
                      <Card className={t("pages.settings.name.p_3")}>
                        <div className={t("pages.settings.name.text_center")}>
                          <div className={t("pages.settings.name.text_2xl_font_bold_text_blue_600")}>
                            {databaseStats.tableCount}
                          </div>
                          <div className={t("pages.settings.name.text_xs_text_muted_foreground")}>{t('pages.settings.عدد_الجداول')}</div>
                        </div>
                      </Card>
                      <Card className={t("pages.settings.name.p_3")}>
                        <div className={t("pages.settings.name.text_center")}>
                          <div className={t("pages.settings.name.text_2xl_font_bold_text_green_600")}>
                            {databaseStats.totalRecords.toLocaleString("ar-SA")}
                          </div>
                          <div className={t("pages.settings.name.text_xs_text_muted_foreground")}>{t('pages.settings.إجمالي_السجلات')}</div>
                        </div>
                      </Card>
                      <Card className={t("pages.settings.name.p_3")}>
                        <div className={t("pages.settings.name.text_center")}>
                          <div className={t("pages.settings.name.text_2xl_font_bold_text_orange_600")}>
                            {databaseStats.databaseSize}
                          </div>
                          <div className={t("pages.settings.name.text_xs_text_muted_foreground")}>{t('pages.settings.حجم_قاعدة_البيانات')}</div>
                        </div>
                      </Card>
                      <Card className={t("pages.settings.name.p_3")}>
                        <div className={t("pages.settings.name.text_center")}>
                          <div className={t("pages.settings.name.text_2xl_font_bold_text_purple_600")}>
                            {databaseStats.lastBackup}
                          </div>
                          <div className={t("pages.settings.name.text_xs_text_muted_foreground")}>{t('pages.settings.آخر_نسخة_احتياطية')}</div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Maintenance Operations */}
                  <div className={t("pages.settings.name.space_y_4")}>
                    <h4 className={t("pages.settings.name.text_sm_font_medium_flex_items_center_gap_2")}>
                      <SettingsIcon className={t("pages.settings.name.w_4_h_4")} />{t('pages.settings.عمليات_الصيانة')}</h4>

                    <div className={t("pages.settings.name.grid_grid_cols_1_md_grid_cols_3_gap_3")}>
                      <Button
                        variant="outline"
                        size="sm"
                        className={t("pages.settings.name.flex_items_center_gap_2")}
                        disabled={optimizeTablesMutation.isPending}
                        onClick={() => optimizeTablesMutation.mutate()}
                      >
                        {optimizeTablesMutation.isPending ? (
                          <RefreshCw className={t("pages.settings.name.w_4_h_4_animate_spin")} />{t('pages.settings.)_:_(')}<RefreshCw className={t("pages.settings.name.w_4_h_4")} />
                        )}
                        تحسين الجداول
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={t("pages.settings.name.flex_items_center_gap_2")}
                        disabled={integrityCheckMutation.isPending}
                        onClick={() => integrityCheckMutation.mutate()}
                      >
                        {integrityCheckMutation.isPending ? (
                          <RefreshCw className={t("pages.settings.name.w_4_h_4_animate_spin")} />{t('pages.settings.)_:_(')}<Database className={t("pages.settings.name.w_4_h_4")} />
                        )}
                        فحص التكامل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className={t("pages.settings.name.flex_items_center_gap_2")}
                        disabled={cleanupDataMutation.isPending}
                        onClick={() => cleanupDataMutation.mutate()}
                      >
                        {cleanupDataMutation.isPending ? (
                          <RefreshCw className={t("pages.settings.name.w_4_h_4_animate_spin")} />{t('pages.settings.)_:_(')}<Trash2 className={t("pages.settings.name.w_4_h_4")} />
                        )}
                        تنظيف البيانات القديمة
                      </Button>
                    </div>
                  </div>

                  <div className={t("pages.settings.name.flex_justify_end")}>
                    <Button>
                      <Save className={t("pages.settings.name.w_4_h_4_mr_2")} />{t('pages.settings.حفظ_إعدادات_قاعدة_البيانات')}</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className={t("pages.settings.name.space_y_6")}>
              <Card>
                <CardHeader>
                  <CardTitle className={t("pages.settings.name.flex_items_center_gap_2")}>
                    <Shield className={t("pages.settings.name.w_5_h_5")} />{t('pages.settings.الأمان_والخصوصية')}</CardTitle>
                </CardHeader>
                <CardContent className={t("pages.settings.name.space_y_4")}>
                  <div className={t("pages.settings.name.space_y_4")}>
                    <div>
                      <h4 className={t("pages.settings.name.text_sm_font_medium_mb_2")}>{t('pages.settings.تغيير_كلمة_المرور')}</h4>
                      <div className={t("pages.settings.name.space_y_2")}>
                        <Label htmlFor="currentPassword">{t('pages.settings.كلمة_المرور_الحالية')}</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="{t('pages.settings.placeholder.أدخل_كلمة_المرور_الحالية')}"
                        />
                      </div>
                      <div className={t("pages.settings.name.space_y_2")}>
                        <Label htmlFor="newPassword">{t('pages.settings.كلمة_المرور_الجديدة')}</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="{t('pages.settings.placeholder.أدخل_كلمة_المرور_الجديدة')}"
                        />
                      </div>
                      <div className={t("pages.settings.name.space_y_2")}>
                        <Label htmlFor="confirmPassword">{t('pages.settings.تأكيد_كلمة_المرور')}</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="{t('pages.settings.placeholder.أعد_إدخال_كلمة_المرور')}"
                        />
                      </div>
                      <Button className={t("pages.settings.name.mt_2")}>{t('pages.settings.تحديث_كلمة_المرور')}</Button>
                    </div>
                  </div>

                  <Separator />

                  <div className={t("pages.settings.name.space_y_4")}>
                    <h4 className={t("pages.settings.name.text_sm_font_medium")}>{t('pages.settings.إعدادات_الجلسة')}</h4>
                    <div className={t("pages.settings.name.flex_items_center_justify_between")}>
                      <div>
                        <Label className={t("pages.settings.name.text_base")}>{t('pages.settings.انتهاء_صلاحية_الجلسة_التلقائي')}</Label>
                        <p className={t("pages.settings.name.text_sm_text_muted_foreground")}>{t('pages.settings.تسجيل_الخروج_التلقائي_عند_عدم_النشاط')}</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className={t("pages.settings.name.space_y_2")}>
                      <Label htmlFor="sessionTimeout">{t('pages.settings.مدة_انتهاء_الصلاحية')}</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">{t('pages.settings.15_دقيقة')}</SelectItem>
                          <SelectItem value="30">{t('pages.settings.30_دقيقة')}</SelectItem>
                          <SelectItem value="60">{t('pages.settings.ساعة_واحدة')}</SelectItem>
                          <SelectItem value="120">{t('pages.settings.ساعتان')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notification-center" className={t("pages.settings.name.space_y_6")}>
              <NotificationCenter />
            </TabsContent>

            <TabsContent value="location" className={t("pages.settings.name.space_y_6")}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('pages.settings.إعدادات_موقع_المصنع')}</CardTitle>
                  <p className={t("pages.settings.name.text_sm_text_gray_600_dark_text_gray_400")}>{t('pages.settings.حدد_الموقع_الجغرافي_للمصنع_والنطاق_المسموح_لتسجيل_الحضور')}</p>
                </CardHeader>
                <CardContent className={t("pages.settings.name.space_y_6")}>
                  <LocationSettingsForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp-webhooks" className={t("pages.settings.name.space_y_6")}>
              <WhatsAppWebhooksTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Confirmation Dialog for Restore */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pages.settings.تأكيد_استعادة_النسخة_الاحتياطية')}</AlertDialogTitle>
            <AlertDialogDescription className={t("pages.settings.name.space_y_2")}>
              <p>{t('pages.settings.هل_أنت_متأكد_من_استعادة_هذه_النسخة_الاحتياطية؟')}</p>
              <p className={t("pages.settings.name.font_semibold_text_red_600")}>{t('pages.settings.تحذير:_سيتم_استبدال_جميع_البيانات_الحالية_بالبيانات_من_النسخة_الاحتياطية.')}</p>
              {pendingBackupData?.metadata && (
                <div className={t("pages.settings.name.mt_2_p_2_bg_gray_100_dark_bg_gray_800_rounded_text_sm")}>
                  <p>الملف: {selectedBackupFile?.name}</p>
                  <p>عدد الجداول: {pendingBackupData.metadata.totalTables}</p>
                  <p>التاريخ: {new Date(pendingBackupData.metadata.timestamp).toLocaleString('ar-SA')}</p>
                </div>
              )}
              <p className={t("pages.settings.name.text_sm_mt_2")}>{t('pages.settings.هذا_الإجراء_لا_يمكن_التراجع_عنه.')}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRestoreConfirm(false);
              setSelectedBackupFile(null);
              setPendingBackupData(null);
            }}>{t('pages.settings.إلغاء')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRestore}
              disabled={restoreBackupMutation.isPending}
              className={t("pages.settings.name.bg_red_600_hover_bg_red_700")}
            >
              {restoreBackupMutation.isPending ? "جاري الاستعادة..." : "استعادة النسخة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    return <div>{t('pages.settings.جاري_التحميل...')}</div>;
  }

  return (
    <div className={t("pages.settings.name.space_y_6")}>
      {/* List of locations */}
      <div className={t("pages.settings.name.space_y_4")}>
        <div className={t("pages.settings.name.flex_justify_between_items_center")}>
          <h3 className={t("pages.settings.name.text_lg_font_semibold")}>{t('pages.settings.مواقع_المصانع')}</h3>
          <Button onClick={() => setShowForm(!showForm)} data-testid="button-add-location">
            <Plus className={t("pages.settings.name.w_4_h_4_ml_2")} />
            {showForm ? "إلغاء" : "إضافة موقع جديد"}
          </Button>
        </div>

        {locations && locations.length >{t('pages.settings.0_?_(')}<div className={t("pages.settings.name.grid_gap_4")}>
            {locations.map((location: any) => (
              <Card key={location.id} className={!location.is_active ? "opacity-50" : ""}>
                <CardContent className={t("pages.settings.name.pt_6")}>
                  <div className={t("pages.settings.name.flex_justify_between_items_start")}>
                    <div className={t("pages.settings.name.flex_1")}>
                      <div className={t("pages.settings.name.flex_items_center_gap_2_mb_2")}>
                        <h4 className={t("pages.settings.name.font_semibold")}>{location.name_ar}</h4>
                        <Badge variant={location.is_active ? "default" : "secondary"}>
                          {location.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      <p className={t("pages.settings.name.text_sm_text_gray_600_dark_text_gray_400_mb_2")}>
                        {location.description || location.name}
                      </p>
                      <div className={t("pages.settings.name.text_sm_space_y_1")}>
                        <p>
                          <strong>{t('pages.settings.الإحداثيات:')}</strong> {location.latitude}, {location.longitude}
                        </p>
                        <p>
                          <strong>{t('pages.settings.النطاق:')}</strong> {location.allowed_radius} متر
                        </p>
                      </div>
                    </div>
                    <div className={t("pages.settings.name.flex_gap_2")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ 
                          id: location.id, 
                          isActive: location.is_active 
                        })}
                        data-testid={`button-toggle-${location.id}`}
                      >
                        {location.is_active ? <EyeOff className={t("pages.settings.name.w_4_h_4")} /> : <Eye className={t("pages.settings.name.w_4_h_4")} />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(location)}
                        data-testid={`button-edit-${location.id}`}
                      >{t('pages.settings.تعديل')}</Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(location.id)}
                        data-testid={`button-delete-${location.id}`}
                      >
                        <Trash2 className={t("pages.settings.name.w_4_h_4")} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>{t('pages.settings.)_:_(')}<p className={t("pages.settings.name.text_center_text_gray_500_py_8")}>{t('pages.settings.لا_توجد_مواقع_مضافة_بعد')}</p>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingLocation ? "تعديل الموقع" : "إضافة موقع جديد"}</CardTitle>
          </CardHeader>
          <CardContent className={t("pages.settings.name.space_y_6")}>
            <div className={t("pages.settings.name.grid_gap_4_md_grid_cols_2")}>
              <div className={t("pages.settings.name.space_y_2")}>
                <Label htmlFor="name-en">{t('pages.settings.الاسم_(english)')}</Label>
                <Input
                  id="name-en"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="{t('pages.settings.placeholder.main_factory')}"
                  data-testid="input-name-en"
                />
              </div>
              <div className={t("pages.settings.name.space_y_2")}>
                <Label htmlFor="name-ar">{t('pages.settings.الاسم_(عربي)')}</Label>
                <Input
                  id="name-ar"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="{t('pages.settings.placeholder.المصنع_الرئيسي')}"
                  data-testid="input-name-ar"
                />
              </div>
            </div>

            <div className={t("pages.settings.name.space_y_2")}>
              <Label htmlFor="description">{t('pages.settings.الوصف_(اختياري)')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="{t('pages.settings.placeholder.وصف_الموقع...')}"
                data-testid="input-description"
              />
            </div>

            <div className={t("pages.settings.name.space_y_2")}>
              <Label>{t('pages.settings.اختر_الموقع_من_الخريطة')}</Label>
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
              <p className={t("pages.settings.name.text_xs_text_gray_500")}>{t('pages.settings.انقر_على_الخريطة_لتحديد_الموقع')}</p>
            </div>

            <div className={t("pages.settings.name.grid_gap_4_md_grid_cols_3")}>
              <div className={t("pages.settings.name.space_y_2")}>
                <Label htmlFor="lat">{t('pages.settings.دائرة_العرض')}</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  data-testid="input-lat"
                />
              </div>
              <div className={t("pages.settings.name.space_y_2")}>
                <Label htmlFor="lng">{t('pages.settings.خط_الطول')}</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  data-testid="input-lng"
                />
              </div>
              <div className={t("pages.settings.name.space_y_2")}>
                <Label htmlFor="radius">{t('pages.settings.النطاق_(متر)')}</Label>
                <Input
                  id="radius"
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  data-testid="input-radius"
                />
              </div>
            </div>

            <div className={t("pages.settings.name.flex_gap_2")}>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className={t("pages.settings.name.flex_1")}
                data-testid="button-submit-location"
              >
                <Save className={t("pages.settings.name.w_4_h_4_ml_2")} />
                {editingLocation ? "تحديث الموقع" : "إضافة الموقع"}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                data-testid="button-cancel-form"
              >{t('pages.settings.إلغاء')}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
