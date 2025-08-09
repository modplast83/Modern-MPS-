import { useState, useEffect } from 'react';
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, User, AlertTriangle, FileText, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatNumber } from "@/lib/formatNumber";

// Types for dashboard data
interface UserData {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  phone?: string;
}

interface AttendanceRecord {
  id: number;
  user_id: number;
  status: 'حاضر' | 'غائب' | 'استراحة غداء' | 'مغادر';
  check_in_time?: string;
  check_out_time?: string;
  lunch_start_time?: string;
  lunch_end_time?: string;
  date: string;
  notes?: string;
}

interface Violation {
  id: number;
  user_id: number;
  type: string;
  description: string;
  penalty: string;
  status: 'معلق' | 'مطبق' | 'ملغي';
  date: string;
  created_by: number;
}

interface UserRequest {
  id: number;
  user_id: number;
  type: 'إجازة' | 'شكوى' | 'طلب خاص';
  title: string;
  description: string;
  status: 'معلق' | 'موافق' | 'مرفوض';
  date: string;
  response?: string;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string>('');

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setLocationError('لا يمكن الحصول على الموقع الحالي');
        }
      );
    }
  }, []);

  // Fetch user data
  const { data: userData } = useQuery<UserData>({
    queryKey: ['/api/users', user?.id],
    enabled: !!user?.id
  });

  // Fetch attendance records
  const { data: attendanceRecords } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance'],
    select: (data) => data.filter(record => record.user_id === user?.id)
  });

  // Fetch violations
  const { data: violations } = useQuery<Violation[]>({
    queryKey: ['/api/violations'],
    select: (data) => data.filter(violation => violation.user_id === user?.id)
  });

  // Fetch user requests
  const { data: userRequests } = useQuery<UserRequest[]>({
    queryKey: ['/api/user-requests'],
    select: (data) => data.filter(request => request.user_id === user?.id)
  });

  // Current attendance status
  const todayAttendance = attendanceRecords?.find(record => 
    record.date === new Date().toISOString().split('T')[0]
  );

  // Attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: { status: string; notes?: string; action?: string }) => {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          status: data.status,
          date: new Date().toISOString().split('T')[0],
          notes: data.notes,
          ...(data.status === 'حاضر' && { check_in_time: new Date().toISOString() }),
          ...(data.status === 'مغادر' && { check_out_time: new Date().toISOString() }),
          ...(data.status === 'استراحة غداء' && data.action === 'start' && { lunch_start_time: new Date().toISOString() }),
          ...(data.status === 'حاضر' && data.action === 'end_lunch' && { lunch_end_time: new Date().toISOString() }),
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      toast({ title: "تم تسجيل الحضور بنجاح" });
    }
  });

  // Request form
  const requestForm = useForm({
    defaultValues: {
      type: '',
      title: '',
      description: ''
    }
  });

  // Submit request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/user-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          user_id: user?.id,
          date: new Date().toISOString(),
          status: 'معلق'
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-requests'] });
      toast({ title: "تم إرسال الطلب بنجاح" });
      requestForm.reset();
    }
  });

  const handleAttendanceAction = (status: string, action?: string) => {
    attendanceMutation.mutate({ status, action });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'حاضر': 'bg-green-500',
      'غائب': 'bg-red-500',
      'استراحة غداء': 'bg-yellow-500',
      'مغادر': 'bg-blue-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" | "warning" => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline" | "warning"> = {
      'معلق': 'secondary',
      'موافق': 'default',
      'مرفوض': 'destructive',
      'مطبق': 'destructive',
      'ملغي': 'outline'
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">لوحة التحكم الشخصية</h1>
              <p className="text-gray-600 dark:text-gray-400">مرحباً {userData?.full_name || userData?.username}</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="attendance">الحضور</TabsTrigger>
                <TabsTrigger value="violations">المخالفات</TabsTrigger>
                <TabsTrigger value="requests">طلباتي</TabsTrigger>
                <TabsTrigger value="location">الموقع</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">حالة الحضور اليوم</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {todayAttendance ? (
                          <Badge className={getStatusColor(todayAttendance.status)}>
                            {todayAttendance.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">لم يتم التسجيل</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">عدد أيام الحضور</CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(attendanceRecords?.filter(r => r.status === 'حاضر').length || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">هذا الشهر</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">المخالفات النشطة</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(violations?.filter(v => v.status === 'معلق').length || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">مخالفة معلقة</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">الطلبات المعلقة</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(userRequests?.filter(r => r.status === 'معلق').length || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">في انتظار الرد</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>عمليات الحضور السريعة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        onClick={() => handleAttendanceAction('حاضر')}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={todayAttendance?.status === 'حاضر'}
                      >
                        تسجيل الحضور
                      </Button>
                      <Button 
                        onClick={() => handleAttendanceAction('استراحة غداء', 'start')}
                        className="bg-yellow-600 hover:bg-yellow-700"
                        disabled={todayAttendance?.status === 'استراحة غداء'}
                      >
                        بداية الاستراحة
                      </Button>
                      <Button 
                        onClick={() => handleAttendanceAction('حاضر', 'end_lunch')}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={todayAttendance?.status !== 'استراحة غداء'}
                      >
                        نهاية الاستراحة
                      </Button>
                      <Button 
                        onClick={() => handleAttendanceAction('مغادر')}
                        className="bg-gray-600 hover:bg-gray-700"
                        disabled={todayAttendance?.status === 'مغادر'}
                      >
                        تسجيل الانصراف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle>سجل الحضور والانصراف</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {attendanceRecords?.slice(0, 10).map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                            <div>
                              <p className="font-medium">{record.date}</p>
                              {record.check_in_time && (
                                <p className="text-sm text-gray-600">
                                  دخول: {new Date(record.check_in_time).toLocaleTimeString('ar-SA')}
                                </p>
                              )}
                              {record.check_out_time && (
                                <p className="text-sm text-gray-600">
                                  خروج: {new Date(record.check_out_time).toLocaleTimeString('ar-SA')}
                                </p>
                              )}
                            </div>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-gray-600 max-w-xs">{record.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Violations Tab */}
              <TabsContent value="violations">
                <Card>
                  <CardHeader>
                    <CardTitle>المخالفات والجزاءات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {violations?.map((violation) => (
                        <div key={violation.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{violation.type}</h3>
                            <Badge variant={getStatusBadgeVariant(violation.status)}>
                              {violation.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{violation.description}</p>
                          <p className="text-sm text-red-600 mb-2">
                            <strong>الجزاء:</strong> {violation.penalty}
                          </p>
                          <p className="text-xs text-gray-500">
                            التاريخ: {new Date(violation.date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                      ))}
                      {(!violations || violations.length === 0) && (
                        <p className="text-center text-gray-500 py-8">لا توجد مخالفات مسجلة</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>إرسال طلب جديد</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...requestForm}>
                        <form onSubmit={requestForm.handleSubmit((data) => submitRequestMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={requestForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>نوع الطلب</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="اختر نوع الطلب" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="إجازة">طلب إجازة</SelectItem>
                                    <SelectItem value="شكوى">تقديم شكوى</SelectItem>
                                    <SelectItem value="طلب خاص">طلب خاص</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={requestForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>عنوان الطلب</FormLabel>
                                <FormControl>
                                  <Input placeholder="أدخل عنوان الطلب" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={requestForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>تفاصيل الطلب</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="أدخل تفاصيل الطلب" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={submitRequestMutation.isPending}>
                            {submitRequestMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>طلباتي السابقة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userRequests?.map((request) => (
                          <div key={request.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{request.title}</h3>
                              <Badge variant={getStatusBadgeVariant(request.status)}>
                                {request.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>النوع:</strong> {request.type}
                            </p>
                            <p className="text-gray-600 mb-2">{request.description}</p>
                            {request.response && (
                              <p className="text-sm text-blue-600 mb-2">
                                <strong>الرد:</strong> {request.response}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              التاريخ: {new Date(request.date).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        ))}
                        {(!userRequests || userRequests.length === 0) && (
                          <p className="text-center text-gray-500 py-8">لا توجد طلبات مرسلة</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Location Tab */}
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>الموقع الحالي</CardTitle>
                    <CardDescription>تحديد موقعك الحالي لتسجيل الحضور</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentLocation ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-green-600" />
                          <span className="font-medium">تم تحديد الموقع بنجاح</span>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <p><strong>خط العرض:</strong> {currentLocation.lat.toFixed(6)}</p>
                          <p><strong>خط الطول:</strong> {currentLocation.lng.toFixed(6)}</p>
                        </div>
                        <Button 
                          onClick={() => handleAttendanceAction('حاضر')}
                          className="w-full"
                          disabled={todayAttendance?.status === 'حاضر'}
                        >
                          تسجيل الحضور من الموقع الحالي
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          {locationError || 'جاري تحديد الموقع الحالي...'}
                        </p>
                        <Button 
                          onClick={() => window.location.reload()}
                          variant="outline"
                          className="mt-4"
                        >
                          إعادة المحاولة
                        </Button>
                      </div>
                    )}
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