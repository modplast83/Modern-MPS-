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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:mr-64">
        <Header />
        <MobileNav />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
              <p className="text-muted-foreground">إدارة إعدادات النظام والتفضيلات الشخصية</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
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
          </div>
        </main>
      </div>
    </div>
  );
}