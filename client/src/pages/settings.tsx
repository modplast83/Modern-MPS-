import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
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
  const [loading, setLoading] = useState(false);

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
    timezone: "Asia/Baghdad",
    currency: "IQD",
    language: "ar",
    dateFormat: "DD/MM/YYYY",
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

  const handleSaveUserSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعداداتك الشخصية",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات النظام",
      });
    } catch (error) {
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ إعدادات النظام",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">الإعدادات</h1>
            <p className="text-gray-600">إدارة إعدادات النظام والحساب الشخصي</p>
          </div>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                شخصية
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

            <TabsContent value="personal" className="space-y-6">
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
                      <Label htmlFor="displayName">الاسم للعرض</Label>
                      <Input
                        id="displayName"
                        value={userSettings.displayName}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="أدخل اسمك"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="example@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={userSettings.phone}
                        onChange={(e) => setUserSettings(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+964 XXX XXX XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">اللغة</Label>
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
                    <Button onClick={handleSaveUserSettings} disabled={loading}>
                      {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
                    <Button onClick={handleSaveUserSettings} disabled={loading}>
                      {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
                      <Label htmlFor="timezone">المنطقة الزمنية</Label>
                      <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Baghdad">بغداد (UTC+3)</SelectItem>
                          <SelectItem value="Asia/Riyadh">الرياض (UTC+3)</SelectItem>
                          <SelectItem value="Asia/Dubai">دبي (UTC+4)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">العملة</Label>
                      <Select value={systemSettings.currency} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, currency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IQD">دينار عراقي (IQD)</SelectItem>
                          <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                          <SelectItem value="EUR">يورو (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">تنسيق التاريخ</Label>
                      <Select value={systemSettings.dateFormat} onValueChange={(value) => setSystemSettings(prev => ({ ...prev, dateFormat: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
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
                    <Button onClick={handleSaveSystemSettings} disabled={loading}>
                      {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
                        <Input id="confirmPassword" type="password" placeholder="أعد إدخال كلمة المرور الجديدة" />
                      </div>
                      <Button className="mt-2">تحديث كلمة المرور</Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">النسخ الاحتياطية</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">تفعيل النسخ الاحتياطي التلقائي</Label>
                          <p className="text-sm text-muted-foreground">إنشاء نسخ احتياطية منتظمة للبيانات</p>
                        </div>
                        <Switch
                          checked={systemSettings.backup.enabled}
                          onCheckedChange={(checked) => setSystemSettings(prev => ({
                            ...prev,
                            backup: { ...prev.backup, enabled: checked }
                          }))}
                        />
                      </div>
                      
                      {systemSettings.backup.enabled && (
                        <div className="space-y-4 p-4 bg-muted rounded-lg">
                          <div className="space-y-2">
                            <Label>تكرار النسخ الاحتياطي</Label>
                            <Select 
                              value={systemSettings.backup.frequency} 
                              onValueChange={(value) => setSystemSettings(prev => ({
                                ...prev,
                                backup: { ...prev.backup, frequency: value }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hourly">كل ساعة</SelectItem>
                                <SelectItem value="daily">يومياً</SelectItem>
                                <SelectItem value="weekly">أسبوعياً</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>فترة الاحتفاظ (بالأيام)</Label>
                            <Input
                              type="number"
                              value={systemSettings.backup.retention}
                              onChange={(e) => setSystemSettings(prev => ({
                                ...prev,
                                backup: { ...prev.backup, retention: parseInt(e.target.value) }
                              }))}
                              min="1"
                              max="365"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-red-600">المنطقة الخطيرة</h4>
                      <p className="text-sm text-muted-foreground">
                        هذه العمليات قد تؤثر على بيانات النظام بشكل دائم
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Database className="w-4 h-4 mr-2" />
                          تصدير البيانات
                        </Button>
                        <Button variant="destructive" size="sm">
                          إعادة تعيين النظام
                        </Button>
                      </div>
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