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
import { useTranslation } from 'react-i18next';

const createAttendanceSchema = (t: any) => z.object({
  user_id: z.number().min(1, t('common.required')),
  status: z.string().min(1, t('common.required')),
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
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<
    AttendanceRecord | null
  >(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const attendanceSchema = useMemo(() => createAttendanceSchema(t), [t]);

  const form = useForm<z.infer<ReturnType<typeof createAttendanceSchema>>>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      user_id: 0,
      status: t('hr.absent'),
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
      if (!response.ok) throw new Error(t('errors.fetchError'));
      return response.json();
    },
    onError: (err: any) => {
      toast({
        title: t('common.error'),
        description:
          err instanceof Error ? err.message : t('errors.fetchError'),
        variant: "destructive",
      });
    },
  });

  // Fetch users data
  const { data: users = [], isLoading: usersLoading, isError: usersError } =
    useQuery<User[]>({
      queryKey: ["/api/users"],
      queryFn: async () => {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error(t('errors.fetchError'));
        return response.json();
      },
      onError: (err: any) => {
        toast({
          title: t('common.error'),
          description:
            err instanceof Error ? err.message : t('errors.fetchError'),
          variant: "destructive",
        });
      },
    });

  // Attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: z.infer<ReturnType<typeof createAttendanceSchema>>) => {
      const url = editingAttendance
        ? `/api/attendance/${editingAttendance.id}`
        : `/api/attendance`;
      const method = editingAttendance ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(t('errors.savingError'));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setIsDialogOpen(false);
      setEditingAttendance(null);
      form.reset({
        user_id: 0,
        status: t('hr.absent'),
        notes: "",
      });
      toast({
        title: t('toast.successSaved'),
        description: editingAttendance
          ? t('hr.attendanceUpdated', 'تم تحديث حالة الحضور')
          : t('hr.attendanceRecorded'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description:
          error instanceof Error ? error.message : t('errors.savingError'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<ReturnType<typeof createAttendanceSchema>>) => {
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
      status: t('hr.absent'),
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: any; color: string }> = {
      [t('hr.present')]: {
        label: t('hr.present'),
        variant: "default",
        icon: UserCheck,
        color: "bg-green-100 text-green-800",
      },
      [t('hr.absent')]: {
        label: t('hr.absent'),
        variant: "destructive",
        icon: UserX,
        color: "bg-red-100 text-red-800",
      },
      [t('hr.breakStart')]: {
        label: t('hr.breakStart'),
        variant: "secondary",
        icon: Coffee,
        color: "bg-orange-100 text-orange-800",
      },
      [t('hr.checkOut')]: {
        label: t('hr.checkOut'),
        variant: "outline",
        icon: LogOut,
        color: "bg-gray-100 text-gray-800",
      },
    };

    const statusInfo = statusMap[status] || statusMap[t('hr.absent')];
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
        attendance: userAttendance || { status: t('hr.absent'), user_id: user.id },
      };
    });
  }, [users, todayAttendance, t]);

  const userIdWatched = form.watch("user_id");
  const isSubmitDisabled =
    attendanceMutation.isPending || Number(userIdWatched) <= 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('hr.attendance')}</h2>
          <p className="text-gray-600 mt-1">
            {t('hr.attendanceManagement', 'متابعة حضور الموظفين وحالاتهم اليومية')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Clock className="h-4 w-4 mr-2" />
              {t('hr.recordAttendance')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAttendance ? t('hr.editAttendance', 'تعديل حالة الحضور') : t('hr.recordAttendance')}
              </DialogTitle>
              <DialogDescription>
                {editingAttendance
                  ? t('hr.updateAttendanceDesc', 'تحديث حالة حضور الموظف وإضافة ملاحظات')
                  : t('hr.newAttendanceDesc', 'تسجيل حالة حضور جديدة للموظف مع الملاحظات')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('hr.employeeName')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value !== undefined ? String(field.value) : "0"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('hr.selectEmployee', 'اختر الموظف')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" key="placeholder" disabled>
                            {t('hr.selectEmployee', 'اختر الموظف')}
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
                      <FormLabel>{t('hr.status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={t('hr.present')}>{t('hr.present')}</SelectItem>
                          <SelectItem value={t('hr.absent')}>{t('hr.absent')}</SelectItem>
                          <SelectItem value={t('hr.breakStart')}>
                            {t('hr.breakStart')}
                          </SelectItem>
                          <SelectItem value={t('hr.checkOut')}>{t('hr.checkOut')}</SelectItem>
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
                      <FormLabel>{t('common.notes')}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t('hr.notesPlaceholder', 'ملاحظات إضافية (اختياري)')}
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
                    {attendanceMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    {t('common.cancel')}
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
                <p className="text-sm font-medium text-gray-600">{t('hr.presentCount', 'الحاضرون')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    attendanceSummary.filter(
                      (u: AttendanceSummaryItem) => u.attendance.status === t('hr.present')
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
                <p className="text-sm font-medium text-gray-600">{t('hr.absentCount', 'الغائبون')}</p>
                <p className="text-2xl font-bold text-red-600">
                  {
                    attendanceSummary.filter(
                      (u: AttendanceSummaryItem) => u.attendance.status === t('hr.absent')
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
                <p className="text-sm font-medium text-gray-600">{t('hr.breakCount', 'استراحة الغداء')}</p>
                <p className="text-2xl font-bold text-orange-600">
                  {
                    attendanceSummary.filter(
                      (u: AttendanceSummaryItem) =>
                        u.attendance.status === t('hr.breakStart')
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
                <p className="text-sm font-medium text-gray-600">{t('hr.checkOutCount', 'المغادرون')}</p>
                <p className="text-2xl font-bold text-gray-600">
                  {
                    attendanceSummary.filter(
                      (u: AttendanceSummaryItem) => u.attendance.status === t('hr.checkOut')
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
          <CardTitle>{t('hr.todayAttendance', 'حضور اليوم')} - {format(new Date(), "dd/MM/yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">{t('hr.employeeName')}</TableHead>
                <TableHead className="text-center">{t('common.user')}</TableHead>
                <TableHead className="text-center">{t('hr.status')}</TableHead>
                <TableHead className="text-center">{t('common.notes')}</TableHead>
                <TableHead className="text-center">{t('hr.lastUpdate', 'آخر تحديث')}</TableHead>
                <TableHead className="text-center">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : attendanceSummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {t('common.noData')}
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
                              status: t('hr.absent'),
                            }
                          )
                        }
                        data-testid={`button-edit-attendance-${user.id}`}
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
