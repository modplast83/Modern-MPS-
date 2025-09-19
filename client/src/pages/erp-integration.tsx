import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Plus, Edit, Trash2, TestTube, Database, Server, ArrowUpDown } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

const erpConfigSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  name_ar: z.string().min(1, "الاسم باللغة العربية مطلوب"),
  type: z.enum(["SAP", "Oracle", "Odoo", "QuickBooks", "Custom"]),
  endpoint: z.string().url("رابط غير صحيح"),
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  is_active: z.boolean().default(true),
  sync_frequency: z.number().min(5, "الحد الأدنى 5 دقائق").default(60)
});

const databaseConfigSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  name_ar: z.string().min(1, "الاسم باللغة العربية مطلوب"),
  type: z.enum(["PostgreSQL", "MySQL", "SQL Server", "Oracle", "MongoDB", "MariaDB"]),
  host: z.string().min(1, "عنوان الخادم مطلوب"),
  port: z.number().min(1, "رقم المنفذ مطلوب").default(5432),
  database: z.string().min(1, "اسم قاعدة البيانات مطلوب"),
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  ssl_enabled: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sync_frequency: z.number().min(5, "الحد الأدنى 5 دقائق").default(60)
});

type ERPConfigFormValues = z.infer<typeof erpConfigSchema>;
type DatabaseConfigFormValues = z.infer<typeof databaseConfigSchema>;

export default function ERPIntegration() {
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDbDialogOpen, setIsAddDbDialogOpen] = useState(false);
  const [isEditDbDialogOpen, setIsEditDbDialogOpen] = useState(false);
  const [selectedDbConfig, setSelectedDbConfig] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ERP configurations
  const { data: configurations = [], isLoading: configsLoading } = useQuery({
    queryKey: ["/api/erp/configurations"],
  });

  // Fetch sync logs
  const { data: syncLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/erp/sync-logs"],
  });

  // Fetch database configurations
  const { data: dbConfigurations = [], isLoading: dbConfigsLoading } = useQuery({
    queryKey: ["/api/database/configurations"],
  });

  const form = useForm<ERPConfigFormValues>({
    resolver: zodResolver(erpConfigSchema),
    defaultValues: {
      name: "",
      name_ar: "",
      type: "SAP",
      endpoint: "",
      username: "",
      password: "",
      is_active: true,
      sync_frequency: 60
    }
  });

  const dbForm = useForm<DatabaseConfigFormValues>({
    resolver: zodResolver(databaseConfigSchema),
    defaultValues: {
      name: "",
      name_ar: "",
      type: "PostgreSQL",
      host: "",
      port: 5432,
      database: "",
      username: "",
      password: "",
      ssl_enabled: false,
      is_active: true,
      sync_frequency: 60
    }
  });

  // Create configuration mutation
  const createConfig = useMutation({
    mutationFn: async (data: ERPConfigFormValues) => {
      const response = await fetch("/api/erp/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("فشل في إنشاء الإعدادات");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/configurations"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({ title: "تم إنشاء إعدادات ERP بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في إنشاء الإعدادات", variant: "destructive" });
    }
  });

  // Create database configuration mutation
  const createDbConfig = useMutation({
    mutationFn: async (data: DatabaseConfigFormValues) => {
      const response = await fetch("/api/database/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("فشل في إنشاء إعدادات قاعدة البيانات");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/configurations"] });
      setIsAddDbDialogOpen(false);
      dbForm.reset();
      toast({ title: "تم إنشاء إعدادات قاعدة البيانات بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في إنشاء إعدادات قاعدة البيانات", variant: "destructive" });
    }
  });

  // Update database configuration mutation
  const updateDbConfig = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DatabaseConfigFormValues> }) => {
      const response = await fetch(`/api/database/configurations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("فشل في تحديث إعدادات قاعدة البيانات");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/configurations"] });
      setIsEditDbDialogOpen(false);
      setSelectedDbConfig(null);
      dbForm.reset();
      toast({ title: "تم تحديث إعدادات قاعدة البيانات بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في تحديث إعدادات قاعدة البيانات", variant: "destructive" });
    }
  });

  // Delete database configuration mutation
  const deleteDbConfig = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/database/configurations/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("فشل في حذف إعدادات قاعدة البيانات");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/database/configurations"] });
      toast({ title: "تم حذف إعدادات قاعدة البيانات بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف إعدادات قاعدة البيانات", variant: "destructive" });
    }
  });

  // Test connection mutation
  const testConnection = useMutation({
    mutationFn: async (config: any) => {
      const endpoint = config.type ? "/api/database/test-connection" : "/api/erp/test-connection";
      const response = await fetch(endpoint, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    },
    onSuccess: (data) => {
      toast({ 
        title: "نجح اختبار الاتصال", 
        description: data.details ? `الوقت المستغرق: ${data.details.responseTime}ms` : data.message
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "فشل اختبار الاتصال", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Sync entities mutation
  const syncEntities = useMutation({
    mutationFn: async ({ configId, entityType }: { configId: number; entityType: string }) => {
      const response = await fetch(`/api/erp/sync/${configId}/${entityType}`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("فشل في المزامنة");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/sync-logs"] });
      toast({ 
        title: "تمت المزامنة بنجاح", 
        description: `تم معالجة ${data.success} عنصر بنجاح${data.failed > 0 ? ` و ${data.failed} فشل` : ''}` 
      });
    },
    onError: () => {
      toast({ title: "خطأ في المزامنة", variant: "destructive" });
    }
  });

  const onSubmit = (data: ERPConfigFormValues) => {
    createConfig.mutate(data);
  };

  const onDbSubmit = (data: DatabaseConfigFormValues) => {
    if (selectedDbConfig) {
      updateDbConfig.mutate({ id: selectedDbConfig.id, data });
    } else {
      createDbConfig.mutate(data);
    }
  };

  const handleEditDbConfig = (config: any) => {
    setSelectedDbConfig(config);
    dbForm.reset({
      name: config.name,
      name_ar: config.name_ar,
      type: config.type,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ssl_enabled: config.ssl_enabled,
      is_active: config.is_active,
      sync_frequency: config.sync_frequency
    });
    setIsEditDbDialogOpen(true);
  };

  const handleDeleteDbConfig = (id: number) => {
    if (confirm("هل أنت متأكد من حذف إعدادات قاعدة البيانات؟")) {
      deleteDbConfig.mutate(id);
    }
  };

  const handleTestConnection = (config: any) => {
    testConnection.mutate(config);
  };

  const handleSync = (configId: number, entityType: string) => {
    syncEntities.mutate({ configId, entityType });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      success: "default",
      failed: "destructive", 
      partial: "secondary",
      pending: "outline"
    };
    
    const icons: Record<string, React.ReactElement> = {
      success: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      partial: <AlertTriangle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
        {icons[status] || <Clock className="h-3 w-3" />}
        {status === 'success' ? 'نجح' : status === 'failed' ? 'فشل' : status === 'partial' ? 'جزئي' : 'في الانتظار'}
      </Badge>
    );
  };

  const getSystemIcon = (type: string) => {
    const icons: Record<string, string> = {
      SAP: "🏢",
      Oracle: "🔶", 
      Odoo: "🟣",
      QuickBooks: "💰",
      Custom: "⚙️"
    };
    return icons[type] || "⚙️";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:mr-64 p-6" dir="rtl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">تكامل أنظمة ERP وقواعد البيانات</h1>
              <p className="text-muted-foreground">إدارة التكامل مع أنظمة ERP الخارجية وقواعد البيانات</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة نظام ERP
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة نظام ERP جديد</DialogTitle>
                    <DialogDescription>
                      قم بإعداد التكامل مع نظام ERP خارجي
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم النظام</FormLabel>
                              <FormControl>
                                <Input placeholder="SAP Production System" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="name_ar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم النظام بالعربية</FormLabel>
                              <FormControl>
                                <Input placeholder="نظام ساب للإنتاج" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع النظام</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر نوع النظام" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="SAP">SAP</SelectItem>
                                  <SelectItem value="Oracle">Oracle</SelectItem>
                                  <SelectItem value="Odoo">Odoo</SelectItem>
                                  <SelectItem value="QuickBooks">QuickBooks</SelectItem>
                                  <SelectItem value="Custom">مخصص</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="endpoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رابط الخدمة</FormLabel>
                              <FormControl>
                                <Input placeholder="https://api.example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم المستخدم</FormLabel>
                              <FormControl>
                                <Input placeholder="api_user" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>كلمة المرور</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="sync_frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تكرار المزامنة (بالدقائق)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="60" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">تفعيل النظام</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                تفعيل المزامنة التلقائية مع هذا النظام
                              </div>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleTestConnection(form.getValues())}
                          disabled={testConnection.isPending}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          {testConnection.isPending ? "جاري الاختبار..." : "اختبار الاتصال"}
                        </Button>
                        <div className="space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                          >
                            إلغاء
                          </Button>
                          <Button type="submit" disabled={createConfig.isPending}>
                            {createConfig.isPending ? "جاري الحفظ..." : "حفظ"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDbDialogOpen} onOpenChange={setIsAddDbDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    إضافة قاعدة بيانات
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة قاعدة بيانات جديدة</DialogTitle>
                    <DialogDescription>
                      قم بإعداد التكامل مع قاعدة بيانات خارجية
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...dbForm}>
                    <form onSubmit={dbForm.handleSubmit(onDbSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={dbForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم قاعدة البيانات</FormLabel>
                              <FormControl>
                                <Input placeholder="Production Database" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="name_ar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الاسم باللغة العربية</FormLabel>
                              <FormControl>
                                <Input placeholder="قاعدة بيانات الإنتاج" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={dbForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع قاعدة البيانات</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر نوع قاعدة البيانات" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                                  <SelectItem value="MySQL">MySQL</SelectItem>
                                  <SelectItem value="SQL Server">SQL Server</SelectItem>
                                  <SelectItem value="Oracle">Oracle</SelectItem>
                                  <SelectItem value="MongoDB">MongoDB</SelectItem>
                                  <SelectItem value="MariaDB">MariaDB</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="host"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>عنوان الخادم</FormLabel>
                              <FormControl>
                                <Input placeholder="localhost أو IP العنوان" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={dbForm.control}
                          name="port"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رقم المنفذ</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="5432" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="database"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم قاعدة البيانات</FormLabel>
                              <FormControl>
                                <Input placeholder="myapp_production" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم المستخدم</FormLabel>
                              <FormControl>
                                <Input placeholder="dbuser" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={dbForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={dbForm.control}
                          name="ssl_enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">تفعيل SSL</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  استخدام اتصال مشفر مع قاعدة البيانات
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="is_active"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">تفعيل التكامل</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  تفعيل المزامنة التلقائية مع قاعدة البيانات
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={dbForm.control}
                        name="sync_frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تكرار المزامنة (بالدقائق)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="60" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => testConnection.mutate(dbForm.getValues())}
                          disabled={testConnection.isPending}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          {testConnection.isPending ? "جاري الاختبار..." : "اختبار الاتصال"}
                        </Button>
                        <div className="space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddDbDialogOpen(false)}
                          >
                            إلغاء
                          </Button>
                          <Button type="submit" disabled={createDbConfig.isPending}>
                            {createDbConfig.isPending ? "جاري الحفظ..." : "حفظ"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditDbDialogOpen} onOpenChange={setIsEditDbDialogOpen}>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>تعديل إعدادات قاعدة البيانات</DialogTitle>
                    <DialogDescription>
                      تعديل إعدادات التكامل مع قاعدة البيانات الخارجية
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...dbForm}>
                    <form onSubmit={dbForm.handleSubmit(onDbSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={dbForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم قاعدة البيانات</FormLabel>
                              <FormControl>
                                <Input placeholder="Production Database" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="name_ar"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الاسم باللغة العربية</FormLabel>
                              <FormControl>
                                <Input placeholder="قاعدة بيانات الإنتاج" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={dbForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نوع قاعدة البيانات</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر نوع قاعدة البيانات" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                                  <SelectItem value="MySQL">MySQL</SelectItem>
                                  <SelectItem value="SQL Server">SQL Server</SelectItem>
                                  <SelectItem value="Oracle">Oracle</SelectItem>
                                  <SelectItem value="MongoDB">MongoDB</SelectItem>
                                  <SelectItem value="MariaDB">MariaDB</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="host"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>عنوان الخادم</FormLabel>
                              <FormControl>
                                <Input placeholder="localhost أو IP العنوان" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={dbForm.control}
                          name="port"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>رقم المنفذ</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="5432" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="database"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم قاعدة البيانات</FormLabel>
                              <FormControl>
                                <Input placeholder="myapp_production" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>اسم المستخدم</FormLabel>
                              <FormControl>
                                <Input placeholder="dbuser" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={dbForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كلمة المرور</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={dbForm.control}
                          name="ssl_enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">تفعيل SSL</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  استخدام اتصال مشفر مع قاعدة البيانات
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dbForm.control}
                          name="is_active"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">تفعيل التكامل</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  تفعيل المزامنة التلقائية مع قاعدة البيانات
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={dbForm.control}
                        name="sync_frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تكرار المزامنة (بالدقائق)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="60" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => testConnection.mutate(dbForm.getValues())}
                          disabled={testConnection.isPending}
                        >
                          <TestTube className="h-4 w-4 mr-2" />
                          {testConnection.isPending ? "جاري الاختبار..." : "اختبار الاتصال"}
                        </Button>
                        <div className="space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditDbDialogOpen(false);
                              setSelectedDbConfig(null);
                              dbForm.reset();
                            }}
                          >
                            إلغاء
                          </Button>
                          <Button type="submit" disabled={updateDbConfig.isPending}>
                            {updateDbConfig.isPending ? "جاري التحديث..." : "تحديث"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="configurations" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="configurations">إعدادات ERP</TabsTrigger>
              <TabsTrigger value="databases">قواعد البيانات</TabsTrigger>
              <TabsTrigger value="sync-logs">سجلات المزامنة</TabsTrigger>
              <TabsTrigger value="mappings">ربط البيانات</TabsTrigger>
            </TabsList>

            <TabsContent value="configurations" className="space-y-4">
              {configsLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(configurations as any[]).map((config: any) => (
                    <Card key={config.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getSystemIcon(config.type)}</span>
                            <div>
                              <CardTitle className="text-lg">{config.name_ar || config.name}</CardTitle>
                              <CardDescription>{config.type}</CardDescription>
                            </div>
                          </div>
                          <Badge variant={config.is_active ? "default" : "secondary"}>
                            {config.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm space-y-1">
                          <div><strong>الخدمة:</strong> {config.endpoint}</div>
                          <div><strong>تكرار المزامنة:</strong> كل {config.sync_frequency} دقيقة</div>
                          {config.last_sync && (
                            <div><strong>آخر مزامنة:</strong> {new Date(config.last_sync).toLocaleString('ar-SA')}</div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(config.id, "customers")}
                            disabled={syncEntities.isPending}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            العملاء
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(config.id, "products")}
                            disabled={syncEntities.isPending}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            المنتجات
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(config.id, "orders")}
                            disabled={syncEntities.isPending}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            الطلبات
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="databases" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>تكامل قواعد البيانات</CardTitle>
                  <CardDescription>إدارة التكامل مع قواعد البيانات الخارجية</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    {dbConfigsLoading ? (
                      <div>جاري التحميل...</div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {(dbConfigurations as any[]).length > 0 ? (
                          (dbConfigurations as any[]).map((dbConfig: any) => (
                            <Card key={dbConfig.id} className="relative">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Database className="h-6 w-6 text-blue-500" />
                                    <div>
                                      <CardTitle className="text-lg">{dbConfig.name_ar || dbConfig.name}</CardTitle>
                                      <CardDescription>{dbConfig.type}</CardDescription>
                                    </div>
                                  </div>
                                  <Badge variant={dbConfig.is_active ? "default" : "secondary"}>
                                    {dbConfig.is_active ? "نشط" : "غير نشط"}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="text-sm space-y-1">
                                  <div><strong>الخادم:</strong> {dbConfig.host}:{dbConfig.port}</div>
                                  <div><strong>قاعدة البيانات:</strong> {dbConfig.database}</div>
                                  <div><strong>تكرار المزامنة:</strong> كل {dbConfig.sync_frequency} دقيقة</div>
                                  <div><strong>SSL:</strong> {dbConfig.ssl_enabled ? "مفعل" : "معطل"}</div>
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => testConnection.mutate(dbConfig)}
                                    disabled={testConnection.isPending}
                                  >
                                    <TestTube className="h-3 w-3 mr-1" />
                                    اختبار
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditDbConfig(dbConfig)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    تعديل
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleDeleteDbConfig(dbConfig.id)}
                                    disabled={deleteDbConfig.isPending}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    حذف
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-8 text-muted-foreground">
                            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>لا توجد قواعد بيانات مضافة</p>
                            <p className="text-sm">اضغط على "إضافة قاعدة بيانات" لبدء التكامل</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sync-logs" className="space-y-4">
              {logsLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>سجلات المزامنة</CardTitle>
                    <CardDescription>تتبع عمليات المزامنة مع أنظمة ERP</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>النظام</TableHead>
                          <TableHead>نوع البيانات</TableHead>
                          <TableHead>العملية</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>المعالج</TableHead>
                          <TableHead>نجح</TableHead>
                          <TableHead>فشل</TableHead>
                          <TableHead>المدة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(syncLogs as any[]).map((log: any) => {
                          const config = (configurations as any[]).find((c: any) => c.id === log.erp_config_id);
                          return (
                            <TableRow key={log.id}>
                              <TableCell>
                                {new Date(log.created_at).toLocaleString('ar-SA')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span>{getSystemIcon(config?.type || 'Custom')}</span>
                                  {config?.name_ar || config?.name || 'غير معروف'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {log.entity_type === 'customers' ? 'العملاء' : 
                                 log.entity_type === 'products' ? 'المنتجات' : 
                                 log.entity_type === 'orders' ? 'الطلبات' : log.entity_type}
                              </TableCell>
                              <TableCell>
                                {log.operation === 'sync_in' ? 'استيراد' :
                                 log.operation === 'sync_out' ? 'تصدير' :
                                 log.operation === 'manual_sync' ? 'مزامنة يدوية' : log.operation}
                              </TableCell>
                              <TableCell>{getStatusBadge(log.status)}</TableCell>
                              <TableCell>{log.records_processed}</TableCell>
                              <TableCell className="text-green-600 font-medium">{log.records_success}</TableCell>
                              <TableCell className="text-red-600 font-medium">{log.records_failed}</TableCell>
                              <TableCell>{log.sync_duration}ث</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="mappings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ربط البيانات</CardTitle>
                  <CardDescription>إدارة ربط البيانات بين النظام المحلي وأنظمة ERP</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>سيتم إضافة إعدادات ربط البيانات قريباً</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mappings" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">خرائط ربط البيانات</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة خريطة جديدة
                </Button>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ربط العملاء</CardTitle>
                    <CardDescription>ربط بيانات العملاء بين النظام وقاعدة البيانات الخارجية</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>الجدول المحلي:</strong> customers
                        </div>
                        <div>
                          <strong>الجدول الخارجي:</strong> clients
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3 text-right">الحقل المحلي</th>
                              <th className="p-3 text-right">الحقل الخارجي</th>
                              <th className="p-3 text-right">نوع الربط</th>
                              <th className="p-3 text-right">الحالة</th>
                              <th className="p-3 text-right">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="p-3">name</td>
                              <td className="p-3">client_name</td>
                              <td className="p-3">مباشر</td>
                              <td className="p-3">
                                <Badge variant="default">نشط</Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            <tr className="border-t">
                              <td className="p-3">phone</td>
                              <td className="p-3">contact_phone</td>
                              <td className="p-3">مباشر</td>
                              <td className="p-3">
                                <Badge variant="default">نشط</Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm">
                          <ArrowUpDown className="h-3 w-3 mr-1" />
                          مزامنة العملاء
                        </Button>
                        <Button size="sm" variant="outline">
                          <TestTube className="h-3 w-3 mr-1" />
                          اختبار الربط
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ربط الأصناف</CardTitle>
                    <CardDescription>ربط بيانات الأصناف والمنتجات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>الجدول المحلي:</strong> items
                        </div>
                        <div>
                          <strong>الجدول الخارجي:</strong> products
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3 text-right">الحقل المحلي</th>
                              <th className="p-3 text-right">الحقل الخارجي</th>
                              <th className="p-3 text-right">نوع الربط</th>
                              <th className="p-3 text-right">الحالة</th>
                              <th className="p-3 text-right">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="p-3">code</td>
                              <td className="p-3">product_code</td>
                              <td className="p-3">مباشر</td>
                              <td className="p-3">
                                <Badge variant="default">نشط</Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            <tr className="border-t">
                              <td className="p-3">name_ar</td>
                              <td className="p-3">product_name</td>
                              <td className="p-3">مباشر</td>
                              <td className="p-3">
                                <Badge variant="default">نشط</Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm">
                          <ArrowUpDown className="h-3 w-3 mr-1" />
                          مزامنة الأصناف
                        </Button>
                        <Button size="sm" variant="outline">
                          <TestTube className="h-3 w-3 mr-1" />
                          اختبار الربط
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ربط الأسعار</CardTitle>
                    <CardDescription>ربط بيانات الأسعار مع قواعد التحويل</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>الجدول المحلي:</strong> customer_products
                        </div>
                        <div>
                          <strong>الجدول الخارجي:</strong> product_prices
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-3 text-right">الحقل المحلي</th>
                              <th className="p-3 text-right">الحقل الخارجي</th>
                              <th className="p-3 text-right">نوع الربط</th>
                              <th className="p-3 text-right">قاعدة التحويل</th>
                              <th className="p-3 text-right">الحالة</th>
                              <th className="p-3 text-right">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="p-3">price</td>
                              <td className="p-3">unit_price</td>
                              <td className="p-3">تحويل</td>
                              <td className="p-3">
                                <code className="text-xs bg-gray-100 p-1 rounded">× 1.15</code>
                                <br />
                                <span className="text-xs text-muted-foreground">إضافة ضريبة 15%</span>
                              </td>
                              <td className="p-3">
                                <Badge variant="default">نشط</Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm">
                          <ArrowUpDown className="h-3 w-3 mr-1" />
                          مزامنة الأسعار
                        </Button>
                        <Button size="sm" variant="outline">
                          <TestTube className="h-3 w-3 mr-1" />
                          اختبار الربط
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>سجلات المزامنة الأخيرة</CardTitle>
                    <CardDescription>عرض آخر عمليات مزامنة البيانات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="font-medium">العملاء</span>
                          </div>
                          <Badge variant="default">نجح</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          45 سجل • منذ ساعة واحدة
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="font-medium">الأصناف</span>
                          </div>
                          <Badge variant="secondary">جزئي</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          118/120 سجل • منذ ساعتين
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="font-medium">الأسعار</span>
                          </div>
                          <Badge variant="outline">في الانتظار</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          مجدولة للساعة 8:00 مساءً
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}