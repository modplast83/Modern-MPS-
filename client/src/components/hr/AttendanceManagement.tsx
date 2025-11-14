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

  const attendanceSchema = useMemo(() =>{t('components.hr.AttendanceManagement.createattendanceschema(t),_[t]);_const_form_=_useform')}<z.infer<ReturnType<typeof createAttendanceSchema>>>({
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
        <IconComponent className={t("components.hr.attendancemanagement.name.h_4_w_4")} />
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
    <div className={t("components.hr.attendancemanagement.name.space_y_6")}>
      <div className={t("components.hr.attendancemanagement.name.flex_justify_between_items_center")}>
        <div>
          <h2 className={t("components.hr.attendancemanagement.name.text_2xl_font_bold_text_gray_900")}>{t('hr.attendance')}</h2>
          <p className={t("components.hr.attendancemanagement.name.text_gray_600_mt_1")}>
            {t('hr.attendanceManagement', 'متابعة حضور الموظفين وحالاتهم اليومية')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Clock className={t("components.hr.attendancemanagement.name.h_4_w_4_mr_2")} />
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
              <form onSubmit={form.handleSubmit(onSubmit)} className={t("components.hr.attendancemanagement.name.space_y_4")}>
                <FormField
                  control={form.control}
                  name="{t('components.hr.AttendanceManagement.name.user_id')}"
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
                  name="{t('components.hr.AttendanceManagement.name.status')}"
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
                  name="{t('components.hr.AttendanceManagement.name.notes')}"
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

                <div className={t("components.hr.attendancemanagement.name.flex_gap_4_pt_4")}>
                  <Button
                    type="submit"
                    className={t("components.hr.attendancemanagement.name.flex_1")}
                    disabled={isSubmitDisabled}
                  >
                    {attendanceMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className={t("components.hr.attendancemanagement.name.flex_1")}
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
      <div className={t("components.hr.attendancemanagement.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
        <Card>
          <CardContent className={t("components.hr.attendancemanagement.name.p_6")}>
            <div className={t("components.hr.attendancemanagement.name.flex_items_center")}>
              <UserCheck className={t("components.hr.attendancemanagement.name.h_8_w_8_text_green_600")} />
              <div className={t("components.hr.attendancemanagement.name.mr_4")}>
                <p className={t("components.hr.attendancemanagement.name.text_sm_font_medium_text_gray_600")}>{t('hr.presentCount', 'الحاضرون')}</p>
                <p className={t("components.hr.attendancemanagement.name.text_2xl_font_bold_text_green_600")}>
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
          <CardContent className={t("components.hr.attendancemanagement.name.p_6")}>
            <div className={t("components.hr.attendancemanagement.name.flex_items_center")}>
              <UserX className={t("components.hr.attendancemanagement.name.h_8_w_8_text_red_600")} />
              <div className={t("components.hr.attendancemanagement.name.mr_4")}>
                <p className={t("components.hr.attendancemanagement.name.text_sm_font_medium_text_gray_600")}>{t('hr.absentCount', 'الغائبون')}</p>
                <p className={t("components.hr.attendancemanagement.name.text_2xl_font_bold_text_red_600")}>
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
          <CardContent className={t("components.hr.attendancemanagement.name.p_6")}>
            <div className={t("components.hr.attendancemanagement.name.flex_items_center")}>
              <Coffee className={t("components.hr.attendancemanagement.name.h_8_w_8_text_orange_600")} />
              <div className={t("components.hr.attendancemanagement.name.mr_4")}>
                <p className={t("components.hr.attendancemanagement.name.text_sm_font_medium_text_gray_600")}>{t('hr.breakCount', 'استراحة الغداء')}</p>
                <p className={t("components.hr.attendancemanagement.name.text_2xl_font_bold_text_orange_600")}>
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
          <CardContent className={t("components.hr.attendancemanagement.name.p_6")}>
            <div className={t("components.hr.attendancemanagement.name.flex_items_center")}>
              <LogOut className={t("components.hr.attendancemanagement.name.h_8_w_8_text_gray_600")} />
              <div className={t("components.hr.attendancemanagement.name.mr_4")}>
                <p className={t("components.hr.attendancemanagement.name.text_sm_font_medium_text_gray_600")}>{t('hr.checkOutCount', 'المغادرون')}</p>
                <p className={t("components.hr.attendancemanagement.name.text_2xl_font_bold_text_gray_600")}>
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
                <TableHead className={t("components.hr.attendancemanagement.name.text_center")}>{t('hr.employeeName')}</TableHead>
                <TableHead className={t("components.hr.attendancemanagement.name.text_center")}>{t('common.user')}</TableHead>
                <TableHead className={t("components.hr.attendancemanagement.name.text_center")}>{t('hr.status')}</TableHead>
                <TableHead className={t("components.hr.attendancemanagement.name.text_center")}>{t('common.notes')}</TableHead>
                <TableHead className={t("components.hr.attendancemanagement.name.text_center")}>{t('hr.lastUpdate', 'آخر تحديث')}</TableHead>
                <TableHead className={t("components.hr.attendancemanagement.name.text_center")}>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className={t("components.hr.attendancemanagement.name.text_center_py_8")}>
                    {t('common.loading')}
                  </TableCell>
                </TableRow>{t('components.hr.AttendanceManagement.)_:_attendancesummary.length_===_0_?_(')}<TableRow>
                  <TableCell colSpan={6} className={t("components.hr.attendancemanagement.name.text_center_py_8")}>
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                attendanceSummary.map((user: AttendanceSummaryItem) => (
                  <TableRow key={user.id}>
                    <TableCell className={t("components.hr.attendancemanagement.name.font_medium_text_center")}>
                      {user.display_name_ar || user.display_name || user.username}
                    </TableCell>
                    <TableCell className={t("components.hr.attendancemanagement.name.text_center_text_gray_500")}>
                      {user.username}
                    </TableCell>
                    <TableCell className={t("components.hr.attendancemanagement.name.text_center")}>
                      {getStatusBadge(user.attendance.status)}
                    </TableCell>
                    <TableCell className={t("components.hr.attendancemanagement.name.text_center")}>
                      {user.attendance.notes || "-"}
                    </TableCell>
                    <TableCell className={t("components.hr.attendancemanagement.name.text_center")}>
                      {user.attendance.updated_at
                        ? format(new Date(user.attendance.updated_at), "HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell className={t("components.hr.attendancemanagement.name.text_center")}>
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
                        <Edit className={t("components.hr.attendancemanagement.name.h_4_w_4")} />
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
