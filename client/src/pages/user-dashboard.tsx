import { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import UserProfile from "../components/dashboard/UserProfile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
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
} from "../components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";
import { formatNumber } from "../lib/formatNumber";
import { useTranslation } from "react-i18next";

// دالة حساب المسافة بين نقطتين جغرافيتين (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // نصف قطر الأرض بالأمتار
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // المسافة بالأمتار
}

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
  status: "حاضر" | "غائب" | "استراحة غداء" | "مغادر";
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
  status: "معلق" | "مطبق" | "ملغي";
  date: string;
  created_by: number;
}

interface UserRequest {
  id: number;
  user_id: number;
  type: "إجازة" | "شكوى" | "طلب خاص";
  title: string;
  description: string;
  status: "معلق" | "موافق" | "مرفوض";
  date: string;
  response?: string;
}

export default function UserDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // جلب مواقع المصانع النشطة من قاعدة البيانات
  const { data: activeLocations, isLoading: isLoadingLocations } = useQuery<any[]>({
    queryKey: ["/api/factory-locations/active"],
  });

  // دالة لطلب الموقع الجغرافي
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t('userDashboard.browserNotSupported'));
      return;
    }

    setIsLoadingLocation(true);
    setLocationError("");
    setCurrentLocation(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setLocationError("");
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = t('userDashboard.locationError');
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('userDashboard.locationPermissionDenied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('userDashboard.locationUnavailable');
            break;
          case error.TIMEOUT:
            errorMessage = t('userDashboard.locationTimeout');
            break;
        }
        
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Get current location on mount
  useEffect(() => {
    requestLocation();
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
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  // Fetch attendance records
  const { data: attendanceRecords } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance"],
    select: (data) => data.filter((record) => record.user_id === user?.id),
  });

  // Fetch violations
  const { data: violations } = useQuery<Violation[]>({
    queryKey: ["/api/violations"],
    select: (data) =>
      data.filter((violation) => violation.user_id === user?.id),
  });

  // Fetch user requests
  const { data: userRequests } = useQuery<UserRequest[]>({
    queryKey: ["/api/user-requests"],
    select: (data) => data.filter((request) => request.user_id === user?.id),
  });

  // Fetch daily attendance status - Optimized polling
  const { data: dailyAttendanceStatus } = useQuery<{
    hasCheckedIn: boolean;
    hasStartedLunch: boolean;
    hasEndedLunch: boolean;
    hasCheckedOut: boolean;
    currentStatus: string;
  }>({
    queryKey: ["/api/attendance/daily-status", user?.id],
    enabled: !!user?.id,
    refetchInterval: 120000, // Reduced from 30s to 2 minutes
    staleTime: 90000, // Cache for 1.5 minutes
  });

  // Current attendance status - get the latest record for today
  const todayAttendance = attendanceRecords
    ?.filter((record) => record.date === new Date().toISOString().split("T")[0])
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    })[0];

  // Attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: {
      status: string;
      notes?: string;
      action?: string;
      location?: {
        lat: number;
        lng: number;
        distance: number;
      };
    }) => {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          status: data.status,
          action: data.action,
          date: new Date().toISOString().split("T")[0],
          notes: data.notes,
          location: data.location,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('userDashboard.attendanceError'));
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/attendance/daily-status", user?.id],
      });
      toast({ title: t('userDashboard.attendanceRecorded') });
    },
    onError: (error: Error) => {
      toast({
        title: t('userDashboard.attendanceError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate working hours, overtime, and break time
  const calculateDailyHours = (
    attendanceRecords: AttendanceRecord[] | undefined,
    userId: number,
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const todayRecords =
      attendanceRecords
        ?.filter((record) => {
          if (!record.date || record.user_id !== userId) return false;
          const recordDate = new Date(record.date).toISOString().split("T")[0];
          return recordDate === today;
        })
        .sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeA - timeB;
        }) || [];

    if (todayRecords.length === 0) {
      return {
        workingHours: 0,
        overtimeHours: 0,
        deficitHours: 0,
        breakMinutes: 0,
        totalMinutes: 0,
        isFriday: false,
      };
    }

    // Find check-in time (first "حاضر" record with check_in_time)
    const checkInRecord = todayRecords.find(
      (r) => r.check_in_time && r.status === "حاضر",
    );
    if (!checkInRecord?.check_in_time) {
      return {
        workingHours: 0,
        overtimeHours: 0,
        deficitHours: 0,
        breakMinutes: 0,
        totalMinutes: 0,
        isFriday: false,
      };
    }

    const checkInTime = new Date(checkInRecord.check_in_time);

    // Find check-out time (last "مغادر" record with check_out_time)
    const checkOutRecord = todayRecords
      .reverse()
      .find((r) => r.check_out_time && r.status === "مغادر");
    const hasCheckedOut = checkOutRecord && checkOutRecord.check_out_time;

    const checkOutTime = hasCheckedOut
      ? new Date(checkOutRecord.check_out_time!)
      : new Date(); // Current time if still working

    // Calculate total time worked in minutes
    const totalMinutesWorked = Math.floor(
      (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60),
    );

    // Calculate break time in minutes
    let breakMinutes = 0;
    const lunchStartRecord = todayRecords.find((r) => r.lunch_start_time);
    const lunchEndRecord = todayRecords.find((r) => r.lunch_end_time);

    if (lunchStartRecord?.lunch_start_time && lunchEndRecord?.lunch_end_time) {
      const lunchStart = new Date(lunchStartRecord.lunch_start_time);
      const lunchEnd = new Date(lunchEndRecord.lunch_end_time);
      breakMinutes = Math.floor(
        (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60),
      );
    } else if (
      lunchStartRecord?.lunch_start_time &&
      !lunchEndRecord?.lunch_end_time
    ) {
      // Still on break - calculate from break start to now or check-out
      const lunchStart = new Date(lunchStartRecord.lunch_start_time);
      const endTime = hasCheckedOut ? checkOutTime : new Date();
      breakMinutes = Math.floor(
        (endTime.getTime() - lunchStart.getTime()) / (1000 * 60),
      );
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

    const result = {
      workingHours: Math.round(workingHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      deficitHours: Math.round(deficitHours * 100) / 100,
      breakMinutes: Math.round(breakMinutes),
      totalMinutes: totalMinutesWorked,
      isFriday,
    };

    return result;
  };

  const dailyHours = calculateDailyHours(attendanceRecords, user?.id || 0);

  // Request form
  const requestForm = useForm({
    defaultValues: {
      type: "",
      title: "",
      description: "",
    },
  });

  // Submit request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/user-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          user_id: user?.id,
          date: new Date().toISOString(),
          status: "معلق",
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-requests"] });
      toast({ title: t('userDashboard.requestSubmitted') });
      requestForm.reset();
    },
  });

  // تحديث: طلب الموقع الجغرافي قبل إرسال الحضور
  const handleAttendanceAction = (status: string, action?: string) => {
    // التحقق من وجود الموقع الحالي
    if (!currentLocation) {
      toast({
        title: t('userDashboard.locationError'),
        description: t('userDashboard.locationRequired'),
        variant: "destructive",
      });
      return;
    }

    // انتظار تحميل المواقع
    if (isLoadingLocations) {
      toast({
        title: t('common.loading'),
        description: t('userDashboard.loadingFactoryLocations'),
      });
      return;
    }

    // التحقق من وجود مواقع نشطة
    if (!activeLocations || activeLocations.length === 0) {
      toast({
        title: t('common.error'),
        description: t('userDashboard.noActiveFactoryLocations'),
        variant: "destructive",
      });
      return;
    }

    // التحقق من وجود المستخدم ضمن أي من المواقع النشطة
    let isWithinRange = false;
    let closestDistance = Infinity;
    let closestLocation = null;
    let validDistance = 0;

    for (const factoryLocation of activeLocations) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        parseFloat(factoryLocation.latitude),
        parseFloat(factoryLocation.longitude)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestLocation = factoryLocation;
      }

      if (distance <= factoryLocation.allowed_radius) {
        isWithinRange = true;
        validDistance = distance;
        break;
      }
    }

    if (!isWithinRange) {
      toast({
        title: t('userDashboard.outsideRange'),
        description: t('userDashboard.outsideRangeDescription', { 
          distance: Math.round(closestDistance), 
          locationName: closestLocation?.name_ar,
          allowedRadius: closestLocation?.allowed_radius 
        }),
        variant: "destructive",
      });
      return;
    }

    // إرسال الطلب مع الموقع الجغرافي
    attendanceMutation.mutate({ 
      status, 
      action,
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        distance: Math.round(validDistance)
      }
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      حاضر: "bg-green-500",
      غائب: "bg-red-500",
      "في الاستراحة": "bg-yellow-500",
      يعمل: "bg-blue-500",
      مغادر: "bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "destructive" | "secondary" | "outline" | "warning" => {
    const variants: Record<
      string,
      "default" | "destructive" | "secondary" | "outline" | "warning"
    > = {
      معلق: "secondary",
      موافق: "default",
      مرفوض: "destructive",
      مطبق: "destructive",
      ملغي: "outline",
    };
    return variants[status] || "secondary";
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('userDashboard.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('userDashboard.welcome', { name: userData?.full_name || userData?.username })}
              </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
                <TabsTrigger value="overview">{t('userDashboard.overview')}</TabsTrigger>
                <TabsTrigger value="profile">{t('userDashboard.profile')}</TabsTrigger>
                <TabsTrigger value="attendance">{t('userDashboard.attendance')}</TabsTrigger>
                <TabsTrigger value="violations">{t('userDashboard.violations')}</TabsTrigger>
                <TabsTrigger value="requests">{t('userDashboard.requests')}</TabsTrigger>
                <TabsTrigger value="location">{t('userDashboard.location')}</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Current Date Display */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h2>
                      <p className="text-sm text-blue-600 dark:text-blue-300">
                        {new Date().toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('userDashboard.currentStatus')}
                      </p>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          dailyAttendanceStatus?.currentStatus === "حاضر"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : dailyAttendanceStatus?.currentStatus ===
                                "في الاستراحة"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : dailyAttendanceStatus?.currentStatus === "يعمل"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : dailyAttendanceStatus?.currentStatus ===
                                    "مغادر"
                                  ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                        }`}
                      >
                        {dailyAttendanceStatus?.currentStatus || t('hr.absent')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('userDashboard.todayAttendanceStatus')}
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {dailyAttendanceStatus?.currentStatus ? (
                          <div className="flex flex-col gap-2">
                            <Badge
                              className={getStatusColor(
                                dailyAttendanceStatus.currentStatus,
                              )}
                            >
                              {dailyAttendanceStatus.currentStatus}
                            </Badge>
                            {(dailyAttendanceStatus.currentStatus === "حاضر" ||
                              dailyAttendanceStatus.currentStatus ===
                                "في الاستراحة" ||
                              dailyAttendanceStatus.currentStatus === "يعمل" ||
                              dailyAttendanceStatus.currentStatus ===
                                "مغادر") &&
                              dailyAttendanceStatus.hasCheckedIn && (
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {(() => {
                                    const todayRecord = attendanceRecords?.find(
                                      (record) =>
                                        record.date ===
                                          new Date()
                                            .toISOString()
                                            .split("T")[0] &&
                                        record.user_id === user?.id &&
                                        record.check_in_time,
                                    );

                                    if (!todayRecord?.check_in_time) return "";

                                    const checkIn = new Date(
                                      todayRecord.check_in_time,
                                    );
                                    const now = todayRecord.check_out_time
                                      ? new Date(todayRecord.check_out_time)
                                      : currentTime;
                                    const diff =
                                      now.getTime() - checkIn.getTime();
                                    const hours = Math.floor(
                                      diff / (1000 * 60 * 60),
                                    );
                                    const minutes = Math.floor(
                                      (diff % (1000 * 60 * 60)) / (1000 * 60),
                                    );

                                    return `${hours} ${t('userDashboard.hour')} ${minutes} ${t('userDashboard.minute')}`;
                                  })()}
                                </span>
                              )}
                          </div>
                        ) : (
                          <Badge variant="outline">{t('userDashboard.notRegistered')}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('userDashboard.attendanceDaysCount')}
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(
                          attendanceRecords?.filter(
                            (r) => r.check_in_time !== null,
                          ).length || 0,
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t('userDashboard.thisMonth')}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('userDashboard.activeViolations')}
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(
                          violations?.filter((v) => v.status === "معلق")
                            .length || 0,
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('userDashboard.pendingViolation')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {t('userDashboard.pendingRequests')}
                      </CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatNumber(
                          userRequests?.filter((r) => r.status === "معلق")
                            .length || 0,
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('userDashboard.waitingForResponse')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('userDashboard.quickAttendanceActions')}</CardTitle>
                    <CardDescription>
                      {t('userDashboard.currentStatus')}:{" "}
                      {dailyAttendanceStatus?.currentStatus ||
                        t('userDashboard.notRegistered')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Check In Button */}
                      <div className="flex flex-col items-center">
                        <Button
                          onClick={() => handleAttendanceAction("حاضر")}
                          className="bg-green-600 hover:bg-green-700 w-full"
                          disabled={
                            dailyAttendanceStatus?.hasCheckedIn ||
                            attendanceMutation.isPending
                          }
                        >
                          {dailyAttendanceStatus?.hasCheckedIn
                            ? `✓ ${t('userDashboard.checkedIn')}`
                            : t('userDashboard.checkIn')}
                        </Button>
                        <div className="text-xs text-gray-500 mt-1 h-4 text-center">
                          {(() => {
                            const todayRecords = attendanceRecords?.filter(
                              (record) =>
                                record.date ===
                                  new Date().toISOString().split("T")[0] &&
                                record.user_id === user?.id,
                            );
                            const checkInRecord = todayRecords?.find(
                              (record) => record.check_in_time,
                            );
                            return checkInRecord?.check_in_time
                              ? new Date(checkInRecord.check_in_time)
                                  .toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                  .replace("ص", "ص")
                                  .replace("م", "م")
                              : "";
                          })()}
                        </div>
                      </div>

                      {/* Lunch Start Button */}
                      <div className="flex flex-col items-center">
                        <Button
                          onClick={() => handleAttendanceAction("في الاستراحة")}
                          className="bg-yellow-600 hover:bg-yellow-700 w-full"
                          disabled={
                            !dailyAttendanceStatus?.hasCheckedIn ||
                            dailyAttendanceStatus?.hasStartedLunch ||
                            attendanceMutation.isPending
                          }
                        >
                          {dailyAttendanceStatus?.hasStartedLunch
                            ? `✓ ${t('userDashboard.lunchStarted')}`
                            : t('userDashboard.lunchBreakStart')}
                        </Button>
                        <div className="text-xs text-gray-500 mt-1 h-4 text-center">
                          {(() => {
                            const todayRecords = attendanceRecords?.filter(
                              (record) =>
                                record.date ===
                                  new Date().toISOString().split("T")[0] &&
                                record.user_id === user?.id,
                            );
                            const lunchStartRecord = todayRecords?.find(
                              (record) => record.lunch_start_time,
                            );
                            return lunchStartRecord?.lunch_start_time
                              ? new Date(lunchStartRecord.lunch_start_time)
                                  .toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                  .replace("ص", "ص")
                                  .replace("م", "م")
                              : "";
                          })()}
                        </div>
                      </div>

                      {/* Lunch End Button */}
                      <div className="flex flex-col items-center">
                        <Button
                          onClick={() =>
                            handleAttendanceAction("يعمل", "end_lunch")
                          }
                          className="bg-blue-600 hover:bg-blue-700 w-full"
                          disabled={
                            !dailyAttendanceStatus?.hasStartedLunch ||
                            dailyAttendanceStatus?.hasEndedLunch ||
                            attendanceMutation.isPending
                          }
                        >
                          {dailyAttendanceStatus?.hasEndedLunch
                            ? `✓ ${t('userDashboard.lunchEnded')}`
                            : t('userDashboard.lunchBreakEnd')}
                        </Button>
                        <div className="text-xs text-gray-500 mt-1 h-4 text-center">
                          {(() => {
                            const todayRecords = attendanceRecords?.filter(
                              (record) =>
                                record.date ===
                                  new Date().toISOString().split("T")[0] &&
                                record.user_id === user?.id,
                            );
                            const lunchEndRecord = todayRecords?.find(
                              (record) => record.lunch_end_time,
                            );
                            return lunchEndRecord?.lunch_end_time
                              ? new Date(lunchEndRecord.lunch_end_time)
                                  .toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                  .replace("ص", "ص")
                                  .replace("م", "م")
                              : "";
                          })()}
                        </div>
                      </div>

                      {/* Check Out Button */}
                      <div className="flex flex-col items-center">
                        <Button
                          onClick={() => handleAttendanceAction("مغادر")}
                          className="bg-gray-600 hover:bg-gray-700 w-full"
                          disabled={
                            !dailyAttendanceStatus?.hasCheckedIn ||
                            dailyAttendanceStatus?.hasCheckedOut ||
                            attendanceMutation.isPending
                          }
                        >
                          {dailyAttendanceStatus?.hasCheckedOut
                            ? `✓ ${t('userDashboard.checkedOut')}`
                            : t('userDashboard.checkOut')}
                        </Button>
                        <div className="text-xs text-gray-500 mt-1 h-4 text-center">
                          {(() => {
                            const todayRecords = attendanceRecords?.filter(
                              (record) =>
                                record.date ===
                                  new Date().toISOString().split("T")[0] &&
                                record.user_id === user?.id,
                            );
                            const checkOutRecord = todayRecords?.find(
                              (record) => record.check_out_time,
                            );
                            return checkOutRecord?.check_out_time
                              ? new Date(checkOutRecord.check_out_time)
                                  .toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })
                                  .replace("ص", "ص")
                                  .replace("م", "م")
                              : "";
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Status indicator with timestamps */}
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">{t('userDashboard.todayLog')}:</h4>
                      {attendanceRecords
                        ?.filter(
                          (record) =>
                            record.date ===
                              new Date().toISOString().split("T")[0] &&
                            record.user_id === user?.id,
                        )
                        .map((record, index) => (
                          <div key={record.id} className="mb-2 last:mb-0">
                            {record.check_in_time && (
                              <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-green-600">
                                  ✓ {t('userDashboard.checkInRecorded')}
                                </span>
                                <span className="text-gray-600">
                                  {new Date(
                                    record.check_in_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            )}
                            {record.lunch_start_time && (
                              <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-yellow-600">
                                  ✓ {t('userDashboard.breakStartRecorded')}
                                </span>
                                <span className="text-gray-600">
                                  {new Date(
                                    record.lunch_start_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            )}
                            {record.lunch_end_time && (
                              <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-blue-600">
                                  ✓ {t('userDashboard.breakEndRecorded')}
                                </span>
                                <span className="text-gray-600">
                                  {new Date(
                                    record.lunch_end_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            )}
                            {record.check_out_time && (
                              <div className="flex items-center justify-between text-sm py-1">
                                <span className="text-gray-600">
                                  ✓ {t('userDashboard.checkOutRecorded')}
                                </span>
                                <span className="text-gray-600">
                                  {new Date(
                                    record.check_out_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
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
                            📊 {t('userDashboard.workHoursSummary')}{" "}
                            {dailyHours.isFriday ? `(${t('userDashboard.friday')})` : ""}:
                          </h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Working Hours */}
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-green-700 dark:text-green-300">
                                  ⏰ {t('userDashboard.workingHours')}
                                </span>
                                <span className="font-medium text-green-800 dark:text-green-200">
                                  {dailyHours.workingHours.toFixed(1)} {t('userDashboard.hour')}
                                </span>
                              </div>
                            </div>

                            {/* Overtime Hours */}
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-orange-700 dark:text-orange-300">
                                  ⚡ {t('userDashboard.overtimeHours')}
                                </span>
                                <span className="font-medium text-orange-800 dark:text-orange-200">
                                  {dailyHours.overtimeHours.toFixed(1)} {t('userDashboard.hour')}
                                </span>
                              </div>
                            </div>

                            {/* Break Time */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                              <div className="flex items-center justify-between">
                                <span className="text-yellow-700 dark:text-yellow-300">
                                  ☕ {t('userDashboard.breakTime')}
                                </span>
                                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                                  {dailyHours.breakMinutes} {t('userDashboard.minute')}
                                </span>
                              </div>
                            </div>

                            {/* Deficit Hours (if any) */}
                            {dailyHours.deficitHours > 0 && (
                              <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                <div className="flex items-center justify-between">
                                  <span className="text-red-700 dark:text-red-300">
                                    ⚠️ {t('userDashboard.deficitHours')}
                                  </span>
                                  <span className="font-medium text-red-800 dark:text-red-200">
                                    {dailyHours.deficitHours.toFixed(1)} {t('userDashboard.hour')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Additional Info */}
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex justify-between">
                              <span>{t('userDashboard.totalTime')}:</span>
                              <span>
                                {Math.floor(dailyHours.totalMinutes / 60)}:
                                {(dailyHours.totalMinutes % 60)
                                  .toString()
                                  .padStart(2, "0")}
                              </span>
                            </div>
                            {dailyHours.isFriday && (
                              <div className="text-orange-600 dark:text-orange-400 mt-1 font-medium">
                                * {t('userDashboard.fridayOvertimeNote')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Status indicators for missing actions */}
                      <div className="mt-2 pt-2 border-t">
                        {!dailyAttendanceStatus?.hasCheckedIn && (
                          <div className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-400">
                              ⏳ {t('userDashboard.checkIn')}
                            </span>
                            <span className="text-gray-400">{t('userDashboard.notDone')}</span>
                          </div>
                        )}
                        {!dailyAttendanceStatus?.hasStartedLunch &&
                          dailyAttendanceStatus?.hasCheckedIn && (
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-gray-400">
                                ⏳ {t('userDashboard.lunchBreakStart')}
                              </span>
                              <span className="text-gray-400">{t('userDashboard.notDone')}</span>
                            </div>
                          )}
                        {!dailyAttendanceStatus?.hasEndedLunch &&
                          dailyAttendanceStatus?.hasStartedLunch && (
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-gray-400">
                                ⏳ {t('userDashboard.lunchBreakEnd')}
                              </span>
                              <span className="text-gray-400">{t('userDashboard.notDone')}</span>
                            </div>
                          )}
                        {!dailyAttendanceStatus?.hasCheckedOut &&
                          dailyAttendanceStatus?.hasCheckedIn && (
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-gray-400">
                                ⏳ {t('userDashboard.checkOut')}
                              </span>
                              <span className="text-gray-400">{t('userDashboard.notDone')}</span>
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <UserProfile />
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('userDashboard.detailedAttendanceLog')}</CardTitle>
                    <CardDescription>
                      {t('userDashboard.comprehensiveAttendanceView')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {attendanceRecords?.slice(0, 15).map((record) => (
                        <div
                          key={record.id}
                          className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge
                                className={getStatusColor(record.status)}
                                variant="outline"
                              >
                                {record.status}
                              </Badge>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {new Date(record.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
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
                                <span className="text-gray-500 text-xs">
                                  {t('userDashboard.checkInLabel')}
                                </span>
                                <span className="font-medium text-green-600">
                                  {new Date(
                                    record.check_in_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            )}

                            {record.lunch_start_time && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">
                                  {t('userDashboard.breakStartLabel')}
                                </span>
                                <span className="font-medium text-yellow-600">
                                  {new Date(
                                    record.lunch_start_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            )}

                            {record.lunch_end_time && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">
                                  {t('userDashboard.breakEndLabel')}
                                </span>
                                <span className="font-medium text-blue-600">
                                  {new Date(
                                    record.lunch_end_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            )}

                            {record.check_out_time && (
                              <div className="flex flex-col">
                                <span className="text-gray-500 text-xs">
                                  {t('userDashboard.checkOutLabel')}
                                </span>
                                <span className="font-medium text-gray-600">
                                  {new Date(
                                    record.check_out_time,
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Calculate working hours if both check-in and check-out exist */}
                          {record.check_in_time && record.check_out_time && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">
                                  {t('userDashboard.totalWorkHours')}:
                                </span>
                                <span className="font-medium text-blue-700 dark:text-blue-300">
                                  {(() => {
                                    const checkIn = new Date(
                                      record.check_in_time!,
                                    );
                                    const checkOut = new Date(
                                      record.check_out_time!,
                                    );
                                    const diff =
                                      checkOut.getTime() - checkIn.getTime();
                                    const hours = Math.floor(
                                      diff / (1000 * 60 * 60),
                                    );
                                    const minutes = Math.floor(
                                      (diff % (1000 * 60 * 60)) / (1000 * 60),
                                    );
                                    return `${hours} ${t('userDashboard.hour')} ${minutes} ${t('userDashboard.minute')}`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {(!attendanceRecords ||
                        attendanceRecords.length === 0) && (
                        <div className="text-center text-gray-500 py-8">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>{t('userDashboard.noAttendanceRecords')}</p>
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
                    <CardTitle>{t('userDashboard.violationsAndPenalties')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {violations?.map((violation) => (
                        <div
                          key={violation.id}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{violation.type}</h3>
                            <Badge
                              variant={getStatusBadgeVariant(violation.status)}
                            >
                              {violation.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">
                            {violation.description}
                          </p>
                          <p className="text-sm text-red-600 mb-2">
                            <strong>{t('userDashboard.penalty')}:</strong> {violation.penalty}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t('common.date')}:{" "}
                            {new Date(violation.date).toLocaleDateString("ar")}
                          </p>
                        </div>
                      ))}
                      {(!violations || violations.length === 0) && (
                        <p className="text-center text-gray-500 py-8">
                          {t('userDashboard.noViolations')}
                        </p>
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
                      <CardTitle>{t('userDashboard.submitNewRequest')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...requestForm}>
                        <form
                          onSubmit={requestForm.handleSubmit((data) =>
                            submitRequestMutation.mutate(data),
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={requestForm.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('userDashboard.requestTypeLabel')}</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || ""}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('userDashboard.selectRequestType')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="إجازة">
                                      {t('userDashboard.leaveRequest')}
                                    </SelectItem>
                                    <SelectItem value="شكوى">
                                      {t('userDashboard.complaintRequest')}
                                    </SelectItem>
                                    <SelectItem value="طلب خاص">
                                      {t('userDashboard.specialRequest')}
                                    </SelectItem>
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
                                <FormLabel>{t('userDashboard.requestTitleLabel')}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t('userDashboard.requestTitlePlaceholder')}
                                    {...field}
                                  />
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
                                <FormLabel>{t('userDashboard.requestDescriptionLabel')}</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={t('userDashboard.requestDescriptionPlaceholder')}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            disabled={submitRequestMutation.isPending}
                          >
                            {submitRequestMutation.isPending
                              ? t('userDashboard.submitting')
                              : t('userDashboard.submitRequest')}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('userDashboard.myPreviousRequests')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userRequests?.map((request) => (
                          <div
                            key={request.id}
                            className="p-4 border rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{request.title}</h3>
                              <Badge
                                variant={getStatusBadgeVariant(request.status)}
                              >
                                {request.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>{t('common.type')}:</strong> {request.type}
                            </p>
                            <p className="text-gray-600 mb-2">
                              {request.description}
                            </p>
                            {request.response && (
                              <p className="text-sm text-blue-600 mb-2">
                                <strong>{t('userDashboard.requestResponse')}:</strong> {request.response}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {t('common.date')}:{" "}
                              {new Date(request.date).toLocaleDateString("ar")}
                            </p>
                          </div>
                        ))}
                        {(!userRequests || userRequests.length === 0) && (
                          <p className="text-center text-gray-500 py-8">
                            {t('userDashboard.noRequests')}
                          </p>
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
                    <CardTitle>{t('userDashboard.currentLocation')}</CardTitle>
                    <CardDescription>
                      {t('userDashboard.determineLocationForAttendance')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLocation ? (
                      <div className="text-center py-8">
                        <div className="animate-pulse">
                          <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          {t('userDashboard.requestingLocation')}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {t('userDashboard.allowLocation')}
                        </p>
                      </div>
                    ) : currentLocation ? (
                      <div className="space-y-6">
                        {/* GPS Status Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <MapPin className="h-5 w-5" />
                            <span className="font-medium">
                              {t('userDashboard.locationReceived')}
                            </span>
                          </div>
                          <Button
                            onClick={requestLocation}
                            variant="outline"
                            size="sm"
                            disabled={isLoadingLocation}
                            data-testid="button-refresh-location-top"
                          >
                            {isLoadingLocation ? t('common.loading') : t('userDashboard.retryLocation')}
                          </Button>
                        </div>

                        {/* GPS Diagnostics Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg space-y-3">
                          <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {t('userDashboard.detailedGPSInfo')}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Latitude */}
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-900">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('userDashboard.latitude')}</p>
                              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {currentLocation.lat.toFixed(8)}°
                              </p>
                            </div>

                            {/* Longitude */}
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-900">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('userDashboard.longitude')}</p>
                              <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {currentLocation.lng.toFixed(8)}°
                              </p>
                            </div>

                            {/* Accuracy */}
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-900">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('userDashboard.gpsAccuracy')}</p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {currentLocation.accuracy 
                                    ? `±${Math.round(currentLocation.accuracy)} ${t('userDashboard.meters')}`
                                    : t('common.notSpecified')}
                                </p>
                                {currentLocation.accuracy && currentLocation.accuracy > 100 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t('userDashboard.lowAccuracy')}
                                  </Badge>
                                )}
                                {currentLocation.accuracy && currentLocation.accuracy <= 20 && (
                                  <Badge className="bg-green-500 text-xs">
                                    {t('userDashboard.highAccuracy')}
                                  </Badge>
                                )}
                                {currentLocation.accuracy && currentLocation.accuracy > 20 && currentLocation.accuracy <= 100 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {t('userDashboard.mediumAccuracy')}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Timestamp */}
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-blue-900">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('userDashboard.lastUpdate')}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {currentLocation.timestamp 
                                  ? new Date(currentLocation.timestamp).toLocaleTimeString("ar-SA", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    })
                                  : t('common.notSpecified')}
                              </p>
                            </div>
                          </div>

                          {/* GPS Quality Warning */}
                          {currentLocation.accuracy && currentLocation.accuracy > 100 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded">
                              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                ⚠️ <strong>{t('common.warning')}:</strong> {t('userDashboard.lowGPSAccuracyWarning', { accuracy: Math.round(currentLocation.accuracy) })}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Factory Locations Distance Table */}
                        {activeLocations && activeLocations.length > 0 && (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {t('userDashboard.factoryLocationsDistance')}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {t('userDashboard.haversineCalculation')}
                              </p>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                      {t('userDashboard.locationName')}
                                    </th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                      {t('userDashboard.allowedRange')}
                                    </th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                      {t('userDashboard.actualDistance')}
                                    </th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                      {t('userDashboard.difference')}
                                    </th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                      {t('common.status')}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {activeLocations.map((location) => {
                                    const distance = calculateDistance(
                                      currentLocation.lat,
                                      currentLocation.lng,
                                      parseFloat(location.latitude),
                                      parseFloat(location.longitude)
                                    );
                                    const isInRange = distance <= location.allowed_radius;
                                    const difference = Math.abs(distance - location.allowed_radius);
                                    
                                    return (
                                      <tr 
                                        key={location.id}
                                        className={`${
                                          isInRange 
                                            ? 'bg-green-50 dark:bg-green-900/10' 
                                            : 'bg-red-50 dark:bg-red-900/10'
                                        }`}
                                      >
                                        <td className="px-4 py-3">
                                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {location.name_ar || location.name}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                            {parseFloat(location.latitude).toFixed(6)}°, {parseFloat(location.longitude).toFixed(6)}°
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {formatNumber(location.allowed_radius)} م
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            {formatNumber(Math.round(distance))} م
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`text-sm font-semibold ${
                                            isInRange 
                                              ? 'text-green-600 dark:text-green-400'
                                              : 'text-red-600 dark:text-red-400'
                                          }`}>
                                            {isInRange ? '-' : '+'}{formatNumber(Math.round(difference))} م
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {isInRange ? (
                                            <Badge className="bg-green-500">
                                              ✓ {t('userDashboard.withinRange')}
                                            </Badge>
                                          ) : (
                                            <Badge variant="destructive">
                                              ✗ {t('userDashboard.outsideRange')}
                                            </Badge>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                              {(() => {
                                const closestLocation = activeLocations.reduce((closest, location) => {
                                  const distance = calculateDistance(
                                    currentLocation.lat,
                                    currentLocation.lng,
                                    parseFloat(location.latitude),
                                    parseFloat(location.longitude)
                                  );
                                  if (!closest || distance < closest.distance) {
                                    return { location, distance };
                                  }
                                  return closest;
                                }, null as { location: any; distance: number } | null);

                                const isAnyInRange = activeLocations.some((location) => {
                                  const distance = calculateDistance(
                                    currentLocation.lat,
                                    currentLocation.lng,
                                    parseFloat(location.latitude),
                                    parseFloat(location.longitude)
                                  );
                                  return distance <= location.allowed_radius;
                                });

                                return (
                                  <div className="text-sm">
                                    <p className="text-gray-700 dark:text-gray-300">
                                      <strong>{t('userDashboard.closestLocation')}:</strong> {closestLocation?.location.name_ar || closestLocation?.location.name} 
                                      <span className="font-mono text-xs mr-2">
                                        ({formatNumber(Math.round(closestLocation?.distance || 0))} {t('userDashboard.meters')})
                                      </span>
                                    </p>
                                    {!isAnyInRange && closestLocation && (
                                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                                        ⚠️ {t('userDashboard.outsideAllLocations', { distance: formatNumber(Math.round(closestLocation.distance - closestLocation.location.allowed_radius)) })}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAttendanceAction("حاضر")}
                            className="flex-1"
                            disabled={
                              !dailyAttendanceStatus || 
                              dailyAttendanceStatus.hasCheckedIn
                            }
                            data-testid="button-checkin-location"
                          >
                            {dailyAttendanceStatus?.hasCheckedIn 
                              ? `✓ ${t('userDashboard.checkedIn')}` 
                              : t('userDashboard.checkIn')}
                          </Button>
                          <Button
                            onClick={requestLocation}
                            variant="outline"
                            data-testid="button-refresh-location"
                          >
                            {t('userDashboard.retryLocation')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400 mb-2 font-medium">
                          {locationError || t('userDashboard.locationError')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {t('userDashboard.allowLocationInstructions')}:
                        </p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 text-right mb-4 space-y-1">
                          <li>• {t('userDashboard.locationInstruction1')}</li>
                          <li>• {t('userDashboard.locationInstruction2')}</li>
                          <li>• {t('userDashboard.locationInstruction3')}</li>
                        </ul>
                        <Button
                          onClick={requestLocation}
                          variant="default"
                          className="mt-2"
                          data-testid="button-retry-location"
                        >
                          {t('userDashboard.retryLocation')}
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
