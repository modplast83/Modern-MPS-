import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  RefreshCw
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system settings
  const { data: systemSettingsData } = useQuery({
    queryKey: ['/api/settings/system'],
    enabled: !!user
  });

  // Fetch user settings
  const { data: userSettingsData } = useQuery({
    queryKey: ['/api/settings/user', user?.id],
    enabled: !!user?.id
  });

  // Fetch database stats
  const { data: databaseStatsData } = useQuery({
    queryKey: ['/api/database/stats'],
    enabled: !!user
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
      sound: true
    },
    dashboard: {
      autoRefresh: true,
      refreshInterval: 30,
      compactView: false
    }
  });

  // Database settings state
  const [selectedTable, setSelectedTable] = useState("");
  const [databaseStats, setDatabaseStats] = useState({
    tableCount: 8,
    totalRecords: 1247,
    databaseSize: '45.2 MB',
    lastBackup: 'اليوم'
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
      end: "17:00"
    },
    shifts: [
      { id: 1, name: "الصباحية", start: "08:00", end: "16:00" },
      { id: 2, name: "المسائية", start: "16:00", end: "00:00" },
      { id: 3, name: "الليلية", start: "00:00", end: "08:00" }
    ],
    backup: {
      enabled: true,
      frequency: "daily",
      retention: 30
    }
  });

  // Load settings from database when data is available
  useEffect(() => {
    if (systemSettingsData && Array.isArray(systemSettingsData)) {
      const settingsObj = convertSettingsArrayToObject(systemSettingsData);
      setSystemSettings(prev => ({
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
          end: settingsObj.workingHoursEnd || prev.workingHours.end
        }
      }));
    }
  }, [systemSettingsData]);

  useEffect(() => {
    if (userSettingsData && Array.isArray(userSettingsData)) {
      const settingsObj = convertSettingsArrayToObject(userSettingsData);
      setUserSettings(prev => ({
        ...prev,
        displayName: settingsObj.displayName || prev.displayName,
        email: settingsObj.email || prev.email,
        phone: settingsObj.phone || prev.phone,
        language: settingsObj.language || prev.language,
        theme: settingsObj.theme || prev.theme,
        notifications: {
          email: settingsObj.notificationsEmail === 'true' || prev.notifications.email,
          sms: settingsObj.notificationsSms === 'true' || prev.notifications.sms,
          push: settingsObj.notificationsPush === 'true' || prev.notifications.push,
          sound: settingsObj.notificationsSound === 'true' || prev.notifications.sound
        },
        dashboard: {
          autoRefresh: settingsObj.dashboardAutoRefresh === 'true' || prev.dashboard.autoRefresh,
          refreshInterval: parseInt(settingsObj.dashboardRefreshInterval) || prev.dashboard.refreshInterval,
          compactView: settingsObj.dashboardCompactView === 'true' || prev.dashboard.compactView
        }
      }));
    }
  }, [userSettingsData]);

  // Load database stats when data is available
  useEffect(() => {
    if (databaseStatsData && typeof databaseStatsData === 'object') {
      setDatabaseStats(prev => ({
        ...prev,
        ...databaseStatsData
      }));
    }
  }, [databaseStatsData]);

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Import table data mutation
  const importTableMutation = useMutation({
    mutationFn: async ({ tableName, file }: { tableName: string, file: File }) => {
      const formData = new FormData();
      const fileText = await file.text();
      const format = file.name.endsWith('.json') ? 'json' : 
                    file.name.endsWith('.xlsx') ? 'excel' : 'csv';
      
      return await apiRequest(`/api/database/import/${tableName}`, {
        method: 'POST',
        body: JSON.stringify({ data: fileText, format })
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/database/stats'] });
      setSelectedFile(null);
      toast({
        title: "تم استيراد البيانات بنجاح",
        description: `تم استيراد ${data.count || data.importedRecords} سجل من أصل ${data.totalRows || data.count} سجل`,
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في استيراد البيانات",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء استيراد البيانات",
        variant: "destructive",
      });
    }
  });

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const allowedTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      
      if (allowedTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.xlsx')) {
        setSelectedFile(file);
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

  // Handle import
  const handleImportData = () => {
    if (selectedFile && selectedTable) {
      importTableMutation.mutate({ tableName: selectedTable, file: selectedFile });
    } else {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار الجدول والملف قبل الاستيراد",
        variant: "destructive",
      });
    }
  };

  // Database operations mutations
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/database/backup', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/database/stats'] });
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم إنشاء النسخة الاحتياطية بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في إنشاء النسخة الاحتياطية",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  });

  const exportTableMutation = useMutation({
    mutationFn: async ({ tableName, format }: { tableName: string, format: string }) => {
      const response = await fetch(`/api/database/export/${tableName}?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
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
    }
  });

  const optimizeTablesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/database/optimize', {
        method: 'POST'
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
    }
  });

  const integrityCheckMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/database/integrity-check', {
        method: 'POST'
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
    }
  });

  const cleanupDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/database/cleanup', {
        method: 'POST',
        body: JSON.stringify({ daysOld: 90 })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/database/stats'] });
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
    }
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
        dashboardCompactView: settings.dashboard.compactView.toString()
      };
      
      return await apiRequest(`/api/settings/user/${user?.id}`, {
        method: 'POST',
        body: JSON.stringify({ settings: flattenedSettings })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/user', user?.id] });
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
    }
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
        workingHoursEnd: settings.workingHours.end
      };
      
      return await apiRequest('/api/settings/system', {
        method: 'POST',
        body: JSON.stringify({ settings: flattenedSettings, userId: user?.id })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/system'] });
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
    }
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
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">الإعدادات</h1>
            <p className="text-gray-600">إدارة إعدادات النظام والتفضيلات الشخصية</p>
          </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  الملف الشخصي
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
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  الأمان
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      المعلومات الشخصية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">الاسم المعروض</Label>
                        <Input
                          id="displayName"
                          value={userSettings.displayName}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, displayName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userSettings.email}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <Input
                          id="phone"
                          value={userSettings.phone}
                          onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+966 5X XXX XXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">اللغة المفضلة</Label>
                        <Select value={userSettings.language} onValueChange={(value) => setUserSettings(prev => ({ ...prev, language: value }))}>
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
                      <h4 className="text-sm font-medium">المظهر</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {userSettings.theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          <Label>الوضع الداكن</Label>
                        </div>
                        <Switch
                          checked={userSettings.theme === 'dark'}
                          onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, theme: checked ? 'dark' : 'light' }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          <Label>العرض المدمج</Label>
                        </div>
                        <Switch
                          checked={userSettings.dashboard.compactView}
                          onCheckedChange={(checked) => setUserSettings(prev => ({ 
                            ...prev, 
                            dashboard: { ...prev.dashboard, compactView: checked }
                          }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveUserSettings} disabled={saveUserSettingsMutation.isPending}>
                        {saveUserSettingsMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        حفظ التغييرات
                      </Button>
                    </div>
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
                          <Label className="text-base">تنبيهات البريد الإلكتروني</Label>
                          <p className="text-sm text-muted-foreground">تلقي تنبيهات عبر البريد الإلكتروني</p>
                        </div>
                        <Switch
                          checked={userSettings.notifications.email}
                          onCheckedChange={(checked) => setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">تنبيهات الرسائل النصية</Label>
                          <p className="text-sm text-muted-foreground">تلقي تنبيهات عبر الرسائل النصية</p>
                        </div>
                        <Switch
                          checked={userSettings.notifications.sms}
                          onCheckedChange={(checked) => setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, sms: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">التنبيهات الفورية</Label>
                          <p className="text-sm text-muted-foreground">تنبيهات داخل النظام</p>
                        </div>
                        <Switch
                          checked={userSettings.notifications.push}
                          onCheckedChange={(checked) => setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, push: checked }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {userSettings.notifications.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                          <div>
                            <Label className="text-base">الأصوات</Label>
                            <p className="text-sm text-muted-foreground">تشغيل أصوات التنبيهات</p>
                          </div>
                        </div>
                        <Switch
                          checked={userSettings.notifications.sound}
                          onCheckedChange={(checked) => setUserSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, sound: checked }
                          }))}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">إعدادات لوحة التحكم</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">التحديث التلقائي</Label>
                          <p className="text-sm text-muted-foreground">تحديث البيانات تلقائياً</p>
                        </div>
                        <Switch
                          checked={userSettings.dashboard.autoRefresh}
                          onCheckedChange={(checked) => setUserSettings(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, autoRefresh: checked }
                          }))}
                        />
                      </div>
                      
                      {userSettings.dashboard.autoRefresh && (
                        <div className="space-y-2">
                          <Label htmlFor="refreshInterval">فترة التحديث (بالثواني)</Label>
                          <Select 
                            value={userSettings.dashboard.refreshInterval.toString()} 
                            onValueChange={(value) => setUserSettings(prev => ({
                              ...prev,
                              dashboard: { ...prev.dashboard, refreshInterval: parseInt(value) }
                            }))}
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
                      <Button onClick={handleSaveUserSettings} disabled={saveUserSettingsMutation.isPending}>
                        {saveUserSettingsMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, companyName: e.target.value }))}
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
                        <Select value={systemSettings.region} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, region: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="الرياض">الرياض</SelectItem>
                            <SelectItem value="جدة">جدة</SelectItem>
                            <SelectItem value="الدمام">الدمام</SelectItem>
                            <SelectItem value="مكة المكرمة">مكة المكرمة</SelectItem>
                            <SelectItem value="المدينة المنورة">المدينة المنورة</SelectItem>
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
                        <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, language: value }))}>
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
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              workingHours: { ...prev.workingHours, start: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="workEnd">نهاية العمل</Label>
                          <Input
                            id="workEnd"
                            type="time"
                            value={systemSettings.workingHours.end}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              workingHours: { ...prev.workingHours, end: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">الورديات</h4>
                      <div className="space-y-2">
                        {systemSettings.shifts.map((shift) => (
                          <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                      <Button onClick={handleSaveSystemSettings} disabled={saveSystemSettingsMutation.isPending}>
                        {saveSystemSettingsMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
                              <Label className="text-sm font-medium">إنشاء نسخة احتياطية</Label>
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
                              <Label className="text-sm font-medium">استعادة النسخة الاحتياطية</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              استعادة قاعدة البيانات من نسخة احتياطية
                            </p>
                            <Button variant="outline" className="w-full" size="sm">
                              <Upload className="w-4 h-4 mr-2" />
                              تحميل واستعادة
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </div>

                    <Separator />

                    {/* Import/Export Tables */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        استيراد وتصدير الجداول
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="tableSelect">اختر الجدول</Label>
                          <Select value={selectedTable} onValueChange={setSelectedTable}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر جدول للتصدير أو الاستيراد" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="orders">الطلبات (Orders)</SelectItem>
                              <SelectItem value="customers">العملاء (Customers)</SelectItem>
                              <SelectItem value="users">المستخدمين (Users)</SelectItem>
                              <SelectItem value="machines">الماكينات (Machines)</SelectItem>
                              <SelectItem value="locations">المواقع (Locations)</SelectItem>
                              <SelectItem value="categories">الفئات (Categories)</SelectItem>
                              <SelectItem value="items">الأصناف (Items)</SelectItem>
                              <SelectItem value="rolls">الرولات (Rolls)</SelectItem>
                              <SelectItem value="job_orders">أوامر التشغيل (Job Orders)</SelectItem>
                              <SelectItem value="production_orders">أوامر الإنتاج (Production Orders)</SelectItem>
                              <SelectItem value="customer_products">منتجات العملاء (Customer Products)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2"
                            disabled={!selectedTable || exportTableMutation.isPending}
                            onClick={() => selectedTable && exportTableMutation.mutate({ tableName: selectedTable, format: 'csv' })}
                          >
                            <Download className="w-4 h-4" />
                            تصدير CSV
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2"
                            disabled={!selectedTable || exportTableMutation.isPending}
                            onClick={() => selectedTable && exportTableMutation.mutate({ tableName: selectedTable, format: 'json' })}
                          >
                            <Download className="w-4 h-4" />
                            تصدير JSON
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2"
                            disabled={!selectedTable || exportTableMutation.isPending}
                            onClick={() => selectedTable && exportTableMutation.mutate({ tableName: selectedTable, format: 'excel' })}
                          >
                            <Download className="w-4 h-4" />
                            تصدير Excel
                          </Button>
                        </div>

                        <div 
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
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
                                الحجم: {(selectedFile.size / 1024).toFixed(1)} KB
                              </p>
                              <div className="flex gap-2 justify-center">
                                <Button 
                                  size="sm" 
                                  onClick={handleImportData}
                                  disabled={!selectedTable || importTableMutation.isPending}
                                >
                                  {importTableMutation.isPending ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  استيراد البيانات
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
                                ملاحظة: سيتم إنتاج معرفات تلقائية بالتنسيق: CAT01, CID001, ITM01
                              </p>
                              <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                accept=".csv,.json,.xlsx"
                                onChange={(e) => handleFileUpload(e.target.files)}
                              />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-3"
                                onClick={() => document.getElementById('fileInput')?.click()}
                              >
                                اختيار ملف
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
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
                            <div className="text-2xl font-bold text-blue-600">{databaseStats.tableCount}</div>
                            <div className="text-xs text-muted-foreground">عدد الجداول</div>
                          </div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{databaseStats.totalRecords.toLocaleString('ar-SA')}</div>
                            <div className="text-xs text-muted-foreground">إجمالي السجلات</div>
                          </div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{databaseStats.databaseSize}</div>
                            <div className="text-xs text-muted-foreground">حجم قاعدة البيانات</div>
                          </div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{databaseStats.lastBackup}</div>
                            <div className="text-xs text-muted-foreground">آخر نسخة احتياطية</div>
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
                        <h4 className="text-sm font-medium mb-2">تغيير كلمة المرور</h4>
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                          <Input id="currentPassword" type="password" placeholder="أدخل كلمة المرور الحالية" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                          <Input id="newPassword" type="password" placeholder="أدخل كلمة المرور الجديدة" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                          <Input id="confirmPassword" type="password" placeholder="أعد إدخال كلمة المرور" />
                        </div>
                        <Button className="mt-2">تحديث كلمة المرور</Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">إعدادات الجلسة</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">انتهاء صلاحية الجلسة التلقائي</Label>
                          <p className="text-sm text-muted-foreground">تسجيل الخروج التلقائي عند عدم النشاط</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sessionTimeout">مدة انتهاء الصلاحية</Label>
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
            </Tabs>
        </main>
      </div>
    </div>
  );
}