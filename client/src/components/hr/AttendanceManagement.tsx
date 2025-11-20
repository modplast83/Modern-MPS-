import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Textarea } from "../ui/textarea";
import { Clock, Edit, UserCheck, Coffee, LogOut, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "../../hooks/use-toast";
import { format } from "date-fns";

const attendanceSchema = z.object({
  user_id: z.number().min(1, "الموظف مطلوب"),
  status: z.string().min(1, "الحالة مطلوبة"),
  notes: z.string().optional(),
});

interface User {
  id: number;
  username: string;
  display_name?: string;
  display_name_ar?: string;
}

interface AttendanceRecord {
  id: number;
  user_id: number;
  status: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  date?: string;
}

export default function AttendanceManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<
    AttendanceRecord | null
  >(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof attendanceSchema>>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      user_id: 0,
      status: "غائب",
      notes: "",
    },
  });

  // Fetch attendance data
  const {
    data: attendanceData = [],
    isLoading: attendanceLoading,
    isError: attendanceError,
  } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance"],
    queryFn: async () => {
      const response = await fetch("/api/attendance");
      if (!response.ok) throw new Error("فشل في جلب بيانات الحضور");
      return response.json();
    },
  });

  // Fetch users data
  const { data: users = [], isLoading: usersLoading, isError: usersError } =
    useQuery<User[]>({
      queryKey: ["/api/users"],
      queryFn: async () => {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("فشل في جلب بيانات المستخدمين");
        return response.json();
      },
    });

  // Attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof attendanceSchema>) => {
      const url = editingAttendance
        ? `/api/attendance/${editingAttendance.id}`
        : `/api/attendance`;
      const method = editingAttendance ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("فشل في حفظ بيانات الحضور");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setIsDialogOpen(false);
      setEditingAttendance(null);
      form.reset({
        user_id: 0,
        status: "غائب",
        notes: "",
      });
      toast({
        title: "تم الحفظ بنجاح",
        description: editingAttendance
          ? "تم تحديث حالة الحضور"
          : "تم تسجيل حالة الحضور",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "فشل في حفظ البيانات",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof attendanceSchema>) => {
    attendanceMutation.mutate(data);
  };

  const handleEdit = (attendance: AttendanceRecord) => {
    setEditingAttendance(attendance);
    form.setValue("user_id", attendance.user_id);
    form.setValue("status", attendance.status);
    form.setValue("notes", attendance.notes || "");
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAttendance(null);
    form.reset({
      user_id: 0,
      status: "غائب",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      حاضر: {
        label: "حاضر",
        variant: "default" as const,
        icon: UserCheck,
        color: "bg-green-100 text-green-800",
      },
      غائب: {
        label: "غائب",
        variant: "destructive" as const,
        icon: UserX,
        color: "bg-red-100 text-red-800",
      },
      "استراحة غداء": {
        label: "استراحة غداء",
        variant: "secondary" as const,
        icon: Coffee,
        color: "bg-orange-100 text-orange-800",
      },
      مغادر: {
        label: "مغادر",
        variant: "outline" as const,
        icon: LogOut,
        color: "bg-gray-100 text-gray-800",
      },
    };

    const statusInfo =
      (statusMap as any)[status as keyof typeof statusMap] || statusMap["غائب"];
    const IconComponent = statusInfo.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
      >
        <IconComponent className="h-4 w-4" />
        {statusInfo.label}
      </div>
    );
  };

  // Group attendance by today's data (useMemo to avoid recompute)
  const todayAttendance = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return (attendanceData || []).filter((record) => {
      const recordDate =
        record.date || new Date(record.created_at || "").toISOString().split("T")[0];
      return recordDate === today;
    });
  }, [attendanceData]);

  // Create attendance summary for all users with proper typing
  interface AttendanceSummaryItem {
    id: number;
    username: string;
    display_name?: string;
    display_name_ar?: string;
    attendance: {
      status: string;
      user_id: number;
      notes?: string;
      created_at?: string;
      updated_at?: string;
    };
  }

  const attendanceSummary: AttendanceSummaryItem[] = useMemo(() => {
    return (users || []).map((user: User) => {
      const userAttendance = todayAttendance.find(
        (record) => record.user_id === user.id
      );
      return {
        ...user,
        attendance: userAttendance || { status: "غائب", user_id: user.id },
      };
    });
  }, [users, todayAttendance]);

  const userIdWatched = form.watch("user_id");
  const isSubmitDisabled =
    attendanceMutation.isPending || Number(userIdWatched) <= 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة الحضور</h2>
          <p className="text-gray-600 mt-1">
            متابعة حضور الموظفين وحالاتهم اليومية
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Clock className="h-4 w-4 mr-2" />
              تسجيل حضور
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAttendance ? "تعديل حالة الحضور" : "تسجيل حضور جديد"}
              </DialogTitle>
              <DialogDescription>
                {editingAttendance
                  ? "تحديث حالة حضور الموظف وإضافة ملاحظات"
                  : "تسجيل حالة حضور جديدة للموظف مع الملاحظات"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموظف</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value !== undefined ? String(field.value) : "0"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" key="placeholder" disabled>
                            اختر الموظف
                          </SelectItem>
                          {users.map((user: User) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.display_name_ar || user.username}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حالة الحضور</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="حاضر">حاضر</SelectItem>
                          <SelectItem value="غائب">غائب</SelectItem>
                          <SelectItem value="استراحة غداء">
                            استراحة غداء
                          </SelectItem>
                          <SelectItem value="مغادر">مغادر</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="ملاحظات إضافية (اختياري)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitDisabled}
                  >
                    {attendanceMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">الحاضرون</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    attendanceSummary.filter(
                      (u: AttendanceSummaryItem) => u.attendance.status === "حاضر"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">الغائبون</p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    attendanceSummary.filter(
                      (u: AttendanceSummaryItem) => u.attendance.status === "غائب"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-orange-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">استراحة الغداء</p>
                <p className="text-2xl font-bold text-orange-600">
                  {
                    attendanceSummary.filter(
                      (u: AttendanceSummaryItem) =>
                        u.attendance.status === "استراحة غداء"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <LogOut className="h-8 w-8 text-gray-600" />
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">المغادرون</p>
                <p className="text-2xl font-bold text-gray-600">
                  {
                    attendanceSummary.filter(
                      (u: AttendanceSummaryItem) => u.attendance.status === "مغادر"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>حضور اليوم - {format(new Date(), "dd/MM/yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">الموظف</TableHead>
                <TableHead className="text-center">اسم المستخدم</TableHead>
                <TableHead className="text-center">حالة الحضور</TableHead>
                <TableHead className="text-center">الملاحظات</TableHead>
                <TableHead className="text-center">آخر تحديث</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    جاري تحميل البيانات...
                  </TableCell>
                </TableRow>
              ) : attendanceSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    لا توجد بيانات حضور
                  </TableCell>
                </TableRow>
              ) : (
                attendanceSummary.map((user: AttendanceSummaryItem) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-center">
                      {user.display_name_ar || user.display_name || user.username}
                    </TableCell>
                    <TableCell className="text-center text-gray-500">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(user.attendance.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.attendance.notes || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.attendance.updated_at
                        ? format(new Date(user.attendance.updated_at), "HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleEdit(
                            (todayAttendance.find(
                              (r) => r.user_id === user.id
                            ) as AttendanceRecord) || {
                              id: 0,
                              user_id: user.id,
                              status: "غائب",
                            }
                          )
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
