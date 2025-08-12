import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wrench, AlertTriangle, CheckCircle, Clock, Calendar, Plus, FileText, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema definitions for forms
const maintenanceActionSchema = z.object({
  maintenance_request_id: z.number(),
  action_type: z.string().min(1, "نوع الإجراء مطلوب"),
  procedures_performed: z.array(z.string()).min(1, "يجب إضافة إجراء واحد على الأقل"),
  description: z.string().min(1, "الوصف مطلوب"),
  spare_parts_used: z.array(z.string()).optional(),
  tools_used: z.array(z.string()).optional(),
  time_spent_hours: z.number().min(0.1, "وقت التنفيذ مطلوب"),
  notes: z.string().optional(),
});

const maintenanceReportSchema = z.object({
  report_type: z.string().min(1, "نوع البلاغ مطلوب"),
  title: z.string().min(1, "العنوان مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  machine_id: z.string().optional(),
  severity: z.string().default("medium"),
  priority: z.string().default("medium"),
  spare_parts_needed: z.array(z.string()).optional(),
  estimated_repair_time: z.number().optional(),
});

const operatorNegligenceSchema = z.object({
  operator_id: z.string().min(1, "معرف المشغل مطلوب"),
  operator_name: z.string().min(1, "اسم المشغل مطلوب"),
  incident_date: z.string().min(1, "تاريخ الحادث مطلوب"),
  incident_type: z.string().min(1, "نوع الحادث مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  severity: z.string().default("medium"),
  witnesses: z.array(z.string()).optional(),
  immediate_actions_taken: z.string().optional(),
});

const maintenanceRequestSchema = z.object({
  machine_id: z.string().min(1, "المعدة مطلوبة"),
  maintenance_type: z.string().min(1, "نوع الصيانة مطلوب"),
  priority: z.string().default("medium"),
  description: z.string().min(1, "الوصف مطلوب"),
  requested_date: z.string().min(1, "التاريخ المطلوب مطلوب"),
  assigned_technician: z.string().optional(),
});

export default function Maintenance() {
  const [currentTab, setCurrentTab] = useState("requests");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all data
  const { data: maintenanceRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ["/api/maintenance-requests"],
  });

  const { data: maintenanceActions, isLoading: loadingActions } = useQuery({
    queryKey: ["/api/maintenance-actions"],
  });

  const { data: maintenanceReports, isLoading: loadingReports } = useQuery({
    queryKey: ["/api/maintenance-reports"],
  });

  const { data: operatorReports, isLoading: loadingOperatorReports } = useQuery({
    queryKey: ["/api/operator-negligence-reports"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
  });

  // Mutations for creating new records
  const createActionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/maintenance-actions", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-actions"] });
      toast({ title: "تم إنشاء إجراء الصيانة بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء إجراء الصيانة", variant: "destructive" });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/maintenance-reports", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-reports"] });
      toast({ title: "تم إنشاء بلاغ الصيانة بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء بلاغ الصيانة", variant: "destructive" });
    },
  });

  const createOperatorReportMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/operator-negligence-reports", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operator-negligence-reports"] });
      toast({ title: "تم إنشاء بلاغ إهمال المشغل بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء بلاغ إهمال المشغل", variant: "destructive" });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/maintenance-requests", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-requests"] });
      setIsRequestDialogOpen(false);
      toast({ title: "تم إنشاء طلب الصيانة بنجاح" });
    },
    onError: () => {
      toast({ title: "فشل في إنشاء طلب الصيانة", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'in_progress':
        return 'قيد التنفيذ';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      default:
        return priority;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الصيانة</h1>
            <p className="text-gray-600">نظام متكامل لإدارة الصيانة وتتبع الأعطال</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(maintenanceRequests) ? maintenanceRequests.length : 0}
                    </p>
                  </div>
                  <Wrench className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">قيد الانتظار</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {Array.isArray(maintenanceRequests) ? maintenanceRequests.filter((r: any) => r.status === 'pending').length : 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">قيد التنفيذ</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Array.isArray(maintenanceRequests) ? maintenanceRequests.filter((r: any) => r.status === 'in_progress').length : 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">مكتملة</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Array.isArray(maintenanceRequests) ? maintenanceRequests.filter((r: any) => r.status === 'completed').length : 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                طلبات الصيانة
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                إجراءات الصيانة
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                بلاغات الصيانة
              </TabsTrigger>
              <TabsTrigger value="negligence" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                بلاغات إهمال المشغلين
              </TabsTrigger>
            </TabsList>

            {/* Maintenance Requests Tab */}
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>طلبات الصيانة</CardTitle>
                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          طلب صيانة جديد
                        </Button>
                      </DialogTrigger>
                      <MaintenanceRequestDialog 
                        machines={machines}
                        users={users}
                        onSubmit={createRequestMutation.mutate}
                        isLoading={createRequestMutation.isPending}
                      />
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingRequests ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              رقم الطلب
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              المعدة
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              النوع
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              الأولوية
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              الحالة
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              المطلوب
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              الفني
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              التاريخ
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(maintenanceRequests) ? maintenanceRequests.map((request: any) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {request.request_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.machine_name_ar}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.maintenance_type === 'preventive' ? 'وقائية' : 
                                 request.maintenance_type === 'corrective' ? 'تصحيحية' : 
                                 'طارئة'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={getPriorityColor(request.priority)}>
                                  {getPriorityText(request.priority)}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={getStatusColor(request.status)}>
                                  {getStatusText(request.status)}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {request.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.assigned_technician || 'غير محدد'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(request.requested_date).toLocaleDateString('ar-SA')}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                                لا توجد بيانات متاحة
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Maintenance Actions Tab */}
            <TabsContent value="actions">
              <MaintenanceActionsTab 
                actions={maintenanceActions}
                requests={maintenanceRequests}
                users={users}
                isLoading={loadingActions}
                onCreateAction={createActionMutation.mutate}
              />
            </TabsContent>

            {/* Maintenance Reports Tab */}
            <TabsContent value="reports">
              <MaintenanceReportsTab 
                reports={maintenanceReports}
                machines={machines}
                users={users}
                isLoading={loadingReports}
                onCreateReport={createReportMutation.mutate}
              />
            </TabsContent>

            {/* Operator Negligence Tab */}
            <TabsContent value="negligence">
              <OperatorNegligenceTab 
                reports={operatorReports}
                users={users}
                isLoading={loadingOperatorReports}
                onCreateReport={createOperatorReportMutation.mutate}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Maintenance Actions Tab Component
function MaintenanceActionsTab({ actions, requests, users, isLoading, onCreateAction }: any) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(maintenanceActionSchema),
    defaultValues: {
      maintenance_request_id: 0,
      action_type: "",
      procedures_performed: [],
      description: "",
      spare_parts_used: [],
      tools_used: [],
      time_spent_hours: 0,
      notes: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      // Generate action number
      const actionNumber = `MA${Date.now().toString().slice(-6)}`;
      
      await onCreateAction({
        ...data,
        action_number: actionNumber,
        performed_by_user_id: 1, // Should be current user
        action_date: new Date().toISOString(),
        status: 'completed'
      });
      
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating maintenance action:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>إجراءات الصيانة</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة إجراء جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>إضافة إجراء صيانة جديد</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maintenance_request_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>طلب الصيانة</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر طلب الصيانة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(requests) && requests.map((request: any) => (
                                <SelectItem key={request.id} value={request.id.toString()}>
                                  {request.request_number} - {request.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="action_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع الإجراء</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع الإجراء" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="preventive">صيانة وقائية</SelectItem>
                              <SelectItem value="corrective">صيانة تصحيحية</SelectItem>
                              <SelectItem value="emergency">صيانة طارئة</SelectItem>
                              <SelectItem value="inspection">فحص</SelectItem>
                              <SelectItem value="repair">إصلاح</SelectItem>
                              <SelectItem value="replacement">استبدال</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف الإجراء</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="اكتب وصفاً مفصلاً للإجراء المتخذ" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="time_spent_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوقت المستغرق (ساعات)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ملاحظات إضافية</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="أي ملاحظات أو توصيات" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit">حفظ الإجراء</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : Array.isArray(actions) && actions.length > 0 ? (
          <div className="space-y-4">
            {actions.map((action: any) => (
              <div key={action.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{action.action_number} - {action.action_type}</h3>
                  <Badge>{new Date(action.action_date).toLocaleDateString('ar-SA')}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">الوقت المستغرق: </span>
                    {action.time_spent_hours} ساعة
                  </div>
                  <div>
                    <span className="font-medium">تاريخ التنفيذ: </span>
                    {new Date(action.action_date).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد إجراءات صيانة مسجلة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Maintenance Reports Tab Component
function MaintenanceReportsTab({ reports, machines, users, isLoading, onCreateReport }: any) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(maintenanceReportSchema),
    defaultValues: {
      report_type: "",
      title: "",
      description: "",
      machine_id: "",
      severity: "medium",
      priority: "medium",
      spare_parts_needed: [],
      estimated_repair_time: 0,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const reportNumber = `MR${Date.now().toString().slice(-6)}`;
      
      await onCreateReport({
        ...data,
        report_number: reportNumber,
        reported_by_user_id: 1, // Should be current user
        status: 'open',
        estimated_repair_time: data.estimated_repair_time || null
      });
      
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating maintenance report:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>بلاغات الصيانة</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة بلاغ جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>إضافة بلاغ صيانة جديد</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="report_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع البلاغ</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع البلاغ" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="breakdown">عطل في الماكينة</SelectItem>
                              <SelectItem value="malfunction">خلل في الأداء</SelectItem>
                              <SelectItem value="safety">مشكلة أمان</SelectItem>
                              <SelectItem value="quality">مشكلة جودة</SelectItem>
                              <SelectItem value="preventive">صيانة وقائية مطلوبة</SelectItem>
                              <SelectItem value="spare_parts">طلب قطع غيار</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>شدة المشكلة</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر شدة المشكلة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">منخفضة</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="high">عالية</SelectItem>
                              <SelectItem value="critical">حرجة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان البلاغ</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="عنوان مختصر للمشكلة" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف المشكلة</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="وصف مفصل للمشكلة والأعراض" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="machine_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الماكينة (اختياري)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="رقم أو اسم الماكينة" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="estimated_repair_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الوقت المتوقع للإصلاح (ساعات)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit">إرسال البلاغ</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : Array.isArray(reports) && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{report.report_number} - {report.title}</h3>
                  <div className="flex gap-2">
                    <Badge variant={report.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {report.severity}
                    </Badge>
                    <Badge>{report.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">نوع البلاغ: </span>
                    {report.report_type}
                  </div>
                  <div>
                    <span className="font-medium">تاريخ الإبلاغ: </span>
                    {new Date(report.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد بلاغات صيانة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Operator Negligence Tab Component
function OperatorNegligenceTab({ reports, users, isLoading, onCreateReport }: any) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(operatorNegligenceSchema),
    defaultValues: {
      operator_id: "",
      operator_name: "",
      incident_date: "",
      incident_type: "",
      description: "",
      severity: "medium",
      witnesses: [],
      immediate_actions_taken: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const reportNumber = `ON${Date.now().toString().slice(-6)}`;
      
      await onCreateReport({
        ...data,
        report_number: reportNumber,
        reported_by_user_id: 1, // Should be current user
        report_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        follow_up_required: data.severity === 'high' || data.severity === 'critical'
      });
      
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error creating operator negligence report:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>بلاغات إهمال المشغلين</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة بلاغ إهمال
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>إضافة بلاغ إهمال مشغل</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="operator_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>معرف المشغل</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="رقم المشغل أو كود التعريف" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="operator_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المشغل</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="الاسم الكامل للمشغل" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="incident_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاريخ الحادث</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="incident_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع الإهمال</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع الإهمال" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="safety_violation">مخالفة قواعد الأمان</SelectItem>
                              <SelectItem value="equipment_misuse">سوء استخدام المعدات</SelectItem>
                              <SelectItem value="procedure_violation">عدم اتباع الإجراءات</SelectItem>
                              <SelectItem value="quality_negligence">إهمال الجودة</SelectItem>
                              <SelectItem value="time_violation">مخالفة الوقت</SelectItem>
                              <SelectItem value="maintenance_neglect">إهمال الصيانة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف الحادث</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="وصف مفصل لما حدث والظروف المحيطة" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>درجة خطورة الإهمال</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر درجة الخطورة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">منخفضة</SelectItem>
                              <SelectItem value="medium">متوسطة</SelectItem>
                              <SelectItem value="high">عالية</SelectItem>
                              <SelectItem value="critical">حرجة</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="immediate_actions_taken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الإجراءات المتخذة فوراً</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="ما تم اتخاذه من إجراءات فورية" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit">إرسال البلاغ</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : Array.isArray(reports) && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{report.report_number} - {report.operator_name}</h3>
                  <div className="flex gap-2">
                    <Badge variant={report.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {report.severity}
                    </Badge>
                    <Badge>{report.status}</Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">نوع الإهمال: </span>
                    {report.incident_type}
                  </div>
                  <div>
                    <span className="font-medium">تاريخ الحادث: </span>
                    {new Date(report.incident_date).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد بلاغات إهمال مسجلة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Maintenance Request Dialog Component
function MaintenanceRequestDialog({ machines, users, onSubmit, isLoading }: any) {
  const form = useForm({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      machine_id: "",
      maintenance_type: "preventive",
      priority: "medium",
      description: "",
      requested_date: new Date().toISOString().split('T')[0],
      assigned_technician: "",
    },
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>طلب صيانة جديد</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المعدة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المعدة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(machines) && machines.map((machine: any) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maintenance_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع الصيانة</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الصيانة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="preventive">صيانة وقائية</SelectItem>
                      <SelectItem value="corrective">صيانة تصحيحية</SelectItem>
                      <SelectItem value="emergency">صيانة طارئة</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الأولوية</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الأولوية" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requested_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التاريخ المطلوب</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="assigned_technician"
            render={({ field }) => (
              <FormItem>
                <FormLabel>الفني المكلف (اختياري)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفني" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">بدون تكليف</SelectItem>
                    {Array.isArray(users) && users
                      .filter((user: any) => user.role === 'technician')
                      .map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.full_name || user.username}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>وصف المشكلة</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="اشرح المشكلة أو نوع الصيانة المطلوبة..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "جاري الإنشاء..." : "إنشاء الطلب"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}