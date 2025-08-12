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
  created_at?: string;
  updated_at?: string;
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
  const [currentTime, setCurrentTime] = useState(new Date());

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

  // Update time display every minute for live hour calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
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

  // Fetch daily attendance status
  const { data: dailyAttendanceStatus } = useQuery<{
    hasCheckedIn: boolean;
    hasStartedLunch: boolean;
    hasEndedLunch: boolean;
    hasCheckedOut: boolean;
    currentStatus: string;
  }>({
    queryKey: ['/api/attendance/daily-status', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Current attendance status - get the latest record for today
  const todayAttendance = attendanceRecords?.filter(record => 
    record.date === new Date().toISOString().split('T')[0]
  ).sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  })[0];

  // Attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: { status: string; notes?: string; action?: string }) => {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          status: data.status,
          action: data.action,
          date: new Date().toISOString().split('T')[0],
          notes: data.notes,
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في تسجيل الحضور');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/daily-status', user?.id] });
      toast({ title: "تم تسجيل الحضور بنجاح" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "خطأ في التسجيل", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Calculate working hours, overtime, and break time
  const calculateDailyHours = (attendanceRecords: AttendanceRecord[] | undefined, userId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords?.filter(record => 
      record.date === today && record.user_id === userId
    ) || [];

    if (todayRecords.length === 0) {
      return {
        workingHours: 0,
        overtimeHours: 0,
        deficitHours: 0,
        breakMinutes: 0,
        totalMinutes: 0,
        isFriday: false
      };
    }

    // Get the latest record with check-in time
    const checkInRecord = todayRecords.find(r => r.check_in_time);
    if (!checkInRecord?.check_in_time) {
      return {
        workingHours: 0,
        overtimeHours: 0,
        deficitHours: 0,
        breakMinutes: 0,
        totalMinutes: 0,
        isFriday: false
      };
    }

    const checkInTime = new Date(checkInRecord.check_in_time);
    
    // Get check-out time (either from record or current time if still working)
    const checkOutRecord = todayRecords.find(r => r.check_out_time);
    const checkOutTime = checkOutRecord?.check_out_time ? 
      new Date(checkOutRecord.check_out_time) : 
      new Date(); // Current time if still working

    // Calculate total time worked in minutes
    const totalMinutesWorked = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60));

    // Calculate break time in minutes
    let breakMinutes = 0;
    const lunchStartRecord = todayRecords.find(r => r.lunch_start_time);
    const lunchEndRecord = todayRecords.find(r => r.lunch_end_time);
    
    if (lunchStartRecord?.lunch_start_time && lunchEndRecord?.lunch_end_time) {
      const lunchStart = new Date(lunchStartRecord.lunch_start_time);
      const lunchEnd = new Date(lunchEndRecord.lunch_end_time);
      breakMinutes = Math.floor((lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60));
    } else if (lunchStartRecord?.lunch_start_time && !lunchEndRecord?.lunch_end_time) {
      // Still on break - calculate from break start to now
      const lunchStart = new Date(lunchStartRecord.lunch_start_time);
      const now = new Date();
      breakMinutes = Math.floor((now.getTime() - lunchStart.getTime()) / (1000 * 60));
    }

    // Net working time (excluding break)
    const netWorkingMinutes = Math.max(0, totalMinutesWorked - breakMinutes);
    const netWorkingHours = netWorkingMinutes / 60;

    // Check if today is Friday (5 in JavaScript, where Sunday = 0)
    const isFriday = new Date().getDay() === 5;
    
    // Standard working hours (8 hours = 480 minutes)
    const standardWorkingMinutes = 8 * 60; // 480 minutes
    
    let workingHours = 0;
    let overtimeHours = 0;
    let deficitHours = 0;

    if (isFriday) {
      // All hours on Friday are overtime
      overtimeHours = netWorkingHours;
      workingHours = 0;
    } else {
      if (netWorkingMinutes >= standardWorkingMinutes) {
        // Normal case: worked 8+ hours
        workingHours = 8;
        overtimeHours = (netWorkingMinutes - standardWorkingMinutes) / 60;
      } else {
        // Worked less than 8 hours
        workingHours = netWorkingHours;
        deficitHours = (standardWorkingMinutes - netWorkingMinutes) / 60;
      }
    }

    return {
      workingHours: Math.round(workingHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      deficitHours: Math.round(deficitHours * 100) / 100,
      breakMinutes: Math.round(breakMinutes),
      totalMinutes: totalMinutesWorked,
      isFriday
    };
  };

  const dailyHours = calculateDailyHours(attendanceRecords, user?.id || 0);

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
      'في الاستراحة': 'bg-yellow-500',
      'يعمل': 'bg-blue-500',
      'مغادر': 'bg-gray-500'
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
                {/* Current Date Display */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h2>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {new Date().toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">الحالة الحالية</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        dailyAttendanceStatus?.currentStatus === 'حاضر' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        dailyAttendanceStatus?.currentStatus === 'في الاستراحة' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        dailyAttendanceStatus?.currentStatus === 'يعمل' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        dailyAttendanceStatus?.currentStatus === 'مغادر' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {dailyAttendanceStatus?.currentStatus || 'غائب'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">حالة الحضور اليوم</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dailyAttendanceStatus?.currentStatus ? (
                          <div className="flex flex-col gap-2">
                            <Badge className={getStatusColor(dailyAttendanceStatus.currentStatus)}>
                              {dailyAttendanceStatus.currentStatus}
                            </Badge>
                            {(dailyAttendanceStatus.currentStatus === 'حاضر' || 
                              dailyAttendanceStatus.currentStatus === 'في الاستراحة' || 
                              dailyAttendanceStatus.currentStatus === 'يعمل' || 
                              dailyAttendanceStatus.currentStatus === 'مغادر') && 
                              dailyAttendanceStatus.hasCheckedIn && (
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {(() => {
                                  const todayRecord = attendanceRecords?.find(record => 
                                    record.date === new Date().toISOString().split('T')[0] && 
                                    record.user_id === user?.id &&
                                    record.check_in_time
                                  );
                                  
                                  if (!todayRecord?.check_in_time) return '';
                                  
                                  const checkIn = new Date(todayRecord.check_in_time);
                                  const now = todayRecord.check_out_time ? new Date(todayRecord.check_out_time) : currentTime;
                                  const diff = now.getTime() - checkIn.getTime();
                                  const hours = Math.floor(diff / (1000 * 60 * 60));
                                  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                  
                                  return `${hours} ساعة ${minutes} دقيقة`;
                                })()}
                              </span>
                            )}
                          </div>
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
                        {formatNumber(attendanceRecords?.filter(r => r.check_in_time !== null).length || 0)}
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
                    <CardDescription>
                      الحالة الحالية: {dailyAttendanceStatus?.currentStatus || 'لم يتم تسجيل الحضور'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Check In Button */}
                      <div className="flex flex-col items-center">
                        <Button 
                          onClick={() => handleAttendanceAction('حاضر')}
                          className="bg-green-600 hover:bg-green-700 w-full"
                          disabled={dailyAttendanceStatus?.hasCheckedIn || attendanceMutation.isPending}
                        >
                          {dailyAttendanceStatus?.hasCheckedIn ? '✓ تم الحضور' : 'الحضور'}
                        </Button>
                        <div className="text-xs text-gray-500 mt-1 h-4 text-center">
                          {(() => {
                            const todayRecords = attendanceRecords?.filter(record => 
                              record.date === new Date().toISOString().split('T')[0] && 
                              record.user_id === user?.id
                            );
                            const checkInRecord = todayRecords?.find(record => record.check_in_time);
                            return checkInRecord?.check_in_time ? 
                              new Date(checkInRecord.check_in_time).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              }).replace('ص', 'ص').replace('م', 'م') : '';
                          })()}
                        </div>
                      </div>

                      {/* Lunch Start Button */}
                      <div className="flex flex-col items-center">
                        <Button 
                          onClick={() => handleAttendanceAction('في الاستراحة')}
                          className="bg-yellow-600 hover:bg-yellow-700 w-full"
                          disabled={!dailyAttendanceStatus?.hasCheckedIn || dailyAttendanceStatus?.hasStartedLunch || attendanceMutation.isPending}
                        >
                          {dailyAttendanceStatus?.hasStartedLunch ? '✓ تم اخذ استراحة' : 'بدء استراحة'}
                        </Button>
                        <div className="text-xs text-gray-500 mt-1 h-4 text-center">
                          {(() => {
                            const todayRecords = attendanceRecords?.filter(record => 
                              record.date === new Date().toISOString().split('T')[0] && 
                              record.user_id === user?.id
                            );
                            const lunchStartRecord = todayRecords?.find(record => record.lunch_start_time);
                            return lunchStartRecord?.lunch_start_time ? 
                              new Date(lunchStartRecord.lunch_start_time).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              }).replace('ص', 'ص').replace('م', 'م') : '';
                          })()}
                        </div>
                      </div>

                      {/* Lunch End Button */}
                      <div className="flex flex-col items-center">
                        <Button 
                          onClick={() => handleAttendanceAction('يعمل', 'end_lunch')}
                          className="bg-blue-600 hover:bg-blue-700 w-full"
                          disabled={!dailyAttendanceStatus?.hasStartedLunch || dailyAttendanceStatus?.hasEndedLunch || attendanceMutation.isPending}
                        >
                          {dailyAttendanceStatus?.hasEndedLunch ? '✓ تم انهاء الاستراحة' : 'انهاء الاستراحة'}
                        </Button>
                        <div className="text-xs text-gray-500 mt-1 h-4 text-center">
                          {(() => {
                            const todayRecords = attendanceRecords?.filter(record => 
                              record.date === new Date().toISOString().split('T')[0] && 
                              record.user_id === user?.id
                            );
                            const lunchEndRecord = todayRecords?.find(record => record.lunch_end_time);
                            return lunchEndRecord?.lunch_end_time ? 
                              new Date(lunchEndRecord.lunch_end_time).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              }).replace('ص', 'ص').replace('م', 'م') : '';
                          })()}
                        </div>
                      </div>

                      {/* Check Out Button */}
                      <div className="flex flex-col items-center">
                        <Button 
                          onClick={() => handleAttendanceAction('مغادر')}
                          className="bg-gray-600 hover:bg-gray-700 w-full"
                          disabled={!dailyAttendanceStatus?.hasCheckedIn || dailyAttendanceStatus?.hasCheckedOut || attendanceMutation.isPending}
                        >
                          {dailyAttendanceStatus?.hasCheckedOut ? '✓ تم الانصراف' : 'الانصراف'}
                        </Button>
                        <div className="text-xs text-gray-500 mt-1 h-4 text-center">
                          {(() => {
                            const todayRecords = attendanceRecords?.filter(record => 
                              record.date === new Date().toISOString().split('T')[0] && 
                              record.user_id === user?.id
                            );
                            const checkOutRecord = todayRecords?.find(record => record.check_out_time);
                            return checkOutRecord?.check_out_time ? 
                              new Date(checkOutRecord.check_out_time).toLocaleTimeString('ar-SA', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              }).replace('ص', 'ص').replace('م', 'م') : '';
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Status indicator with timestamps */}
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">سجل اليوم:</h4>
                      {attendanceRecords?.filter(record => 
                        record.date === new Date().toISOString().split('T')[0] && record.user_id === user?.id
                      ).map((record, index) => (
                        <div key={record.id} className="mb-2 last:mb-0">
                          {record.check_in_time && (
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-green-600">✓ تسجيل الحضور</span>
                              <span className="text-gray-600">
                                {new Date(record.check_in_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          )}
                          {record.lunch_start_time && (
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-yellow-600">✓ بداية الاستراحة</span>
                              <span className="text-gray-600">
                                {new Date(record.lunch_start_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          )}
                          {record.lunch_end_time && (
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-blue-600">✓ نهاية الاستراحة</span>
                              <span className="text-gray-600">
                                {new Date(record.lunch_end_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          )}
                          {record.check_out_time && (
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-gray-600">✓ تسجيل الانصراف</span>
                              <span className="text-gray-600">
                                {new Date(record.check_out_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Working Hours Summary */}
                      {dailyAttendanceStatus?.hasCheckedIn && (
                        <div className="mt-3 pt-3 border-t">
                          <h5 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">
                            📊 ملخص ساعات العمل {dailyHours.isFriday ? '(يوم الجمعة)' : ''}:
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Working Hours */}
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-green-700 dark:text-green-300">⏰ ساعات العمل</span>
                                <span className="font-medium text-green-800 dark:text-green-200">
                                  {dailyHours.workingHours.toFixed(1)} ساعة
                                </span>
                              </div>
                            </div>
                            
                            {/* Overtime Hours */}
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-orange-700 dark:text-orange-300">⚡ ساعات إضافية</span>
                                <span className="font-medium text-orange-800 dark:text-orange-200">
                                  {dailyHours.overtimeHours.toFixed(1)} ساعة
                                </span>
                              </div>
                            </div>
                            
                            {/* Break Time */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-yellow-700 dark:text-yellow-300">☕ وقت الاستراحة</span>
                                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                  {dailyHours.breakMinutes} دقيقة
                                </span>
                              </div>
                            </div>
                            
                            {/* Deficit Hours (if any) */}
                            {dailyHours.deficitHours > 0 && (
                              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                <div className="flex items-center justify-between">
                                  <span className="text-red-700 dark:text-red-300">⚠️ ساعات ناقصة</span>
                                  <span className="font-medium text-red-800 dark:text-red-200">
                                    {dailyHours.deficitHours.toFixed(1)} ساعة
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Additional Info */}
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex justify-between">
                              <span>إجمالي الوقت:</span>
                              <span>{Math.floor(dailyHours.totalMinutes / 60)}:{(dailyHours.totalMinutes % 60).toString().padStart(2, '0')}</span>
                            </div>
                            {dailyHours.isFriday && (
                              <div className="text-orange-600 dark:text-orange-400 mt-1 font-medium">
                                * يوم الجمعة - جميع الساعات تحسب إضافية
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status indicators for missing actions */}
                      <div className="mt-2 pt-2 border-t">
                        {!dailyAttendanceStatus?.hasCheckedIn && (
                          <div className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-400">⏳ تسجيل الحضور</span>
                            <span className="text-gray-400">لم يتم</span>
                          </div>
                        )}
                        {!dailyAttendanceStatus?.hasStartedLunch && dailyAttendanceStatus?.hasCheckedIn && (
                          <div className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-400">⏳ بداية الاستراحة</span>
                            <span className="text-gray-400">لم يتم</span>
                          </div>
                        )}
                        {!dailyAttendanceStatus?.hasEndedLunch && dailyAttendanceStatus?.hasStartedLunch && (
                          <div className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-400">⏳ نهاية الاستراحة</span>
                            <span className="text-gray-400">لم يتم</span>
                          </div>
                        )}
                        {!dailyAttendanceStatus?.hasCheckedOut && dailyAttendanceStatus?.hasCheckedIn && (
                          <div className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-400">⏳ تسجيل الانصراف</span>
                            <span className="text-gray-400">لم يتم</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle>سجل الحضور والانصراف التفصيلي</CardTitle>
                    <CardDescription>عرض شامل لجميع تسجيلات الحضور مع الأوقات</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {attendanceRecords?.slice(0, 15).map((record) => (
                        <div key={record.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(record.status)} variant="outline">
                                {record.status}
                              </Badge>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {new Date(record.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            {record.notes && (
                              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {record.notes}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {record.check_in_time && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">دخول</span>
                                <span className="font-medium text-green-600">
                                  {new Date(record.check_in_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            )}
                            
                            {record.lunch_start_time && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">بداية استراحة</span>
                                <span className="font-medium text-yellow-600">
                                  {new Date(record.lunch_start_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            )}
                            
                            {record.lunch_end_time && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">نهاية استراحة</span>
                                <span className="font-medium text-blue-600">
                                  {new Date(record.lunch_end_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            )}
                            
                            {record.check_out_time && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">خروج</span>
                                <span className="font-medium text-gray-600">
                                  {new Date(record.check_out_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Calculate working hours if both check-in and check-out exist */}
                          {record.check_in_time && record.check_out_time && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">إجمالي ساعات العمل:</span>
                                <span className="font-medium text-blue-700 dark:text-blue-300">
                                  {(() => {
                                    const checkIn = new Date(record.check_in_time!);
                                    const checkOut = new Date(record.check_out_time!);
                                    const diff = checkOut.getTime() - checkIn.getTime();
                                    const hours = Math.floor(diff / (1000 * 60 * 60));
                                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                    return `${hours} ساعة ${minutes} دقيقة`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {(!attendanceRecords || attendanceRecords.length === 0) && (
                        <div className="text-center text-gray-500 py-8">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>لا توجد سجلات حضور مسجلة</p>
                        </div>
                      )}
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