import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
  FormDescription,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Plus,
  FileText,
  AlertCircle,
  Users,
  Eye,
  Printer,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import {
  generateActionNumber,
  generateMaintenanceReportNumber,
  generateOperatorReportNumber,
} from "../../../shared/id-generator";
import ConsumablePartsTab from "../components/maintenance/ConsumablePartsTab";

// Schema definitions for forms
const maintenanceActionSchema = z.object({
  maintenance_request_id: z.number(),
  action_type: z.string().min(1, "نوع الإجراء مطلوب"),
  description: z.string().min(1, "الوصف مطلوب"),
  text_report: z.string().optional(),
  spare_parts_request: z.string().optional(),
  machining_request: z.string().optional(),
  operator_negligence_report: z.string().optional(),
  performed_by: z.string().min(1, "المنفذ مطلوب"),
  requires_management_action: z.boolean().optional(),
  management_notified: z.boolean().optional(),
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
  issue_type: z.string().min(1, "نوع المشكلة مطلوب"),
  urgency_level: z.string().default("normal"),
  description: z.string().min(1, "الوصف مطلوب"),
  assigned_to: z.string().optional(),
});

export default function Maintenance() {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState("requests");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>{t('pages.maintenance.(_null,_);_const_[isrequestdialogopen,_setisrequestdialogopen]_=_usestate(false);_const_[selectedaction,_setselectedaction]_=_usestate')}<any>(null);
  const [isActionViewDialogOpen, setIsActionViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

  const { data: operatorReports, isLoading: loadingOperatorReports } = useQuery(
    {
      queryKey: ["/api/operator-negligence-reports"],
    },
  );

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
  });

  const { data: spareParts } = useQuery({
    queryKey: ["/api/spare-parts"],
  });

  // Mutations for creating new records
  const createActionMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Sending maintenance action data:", data);
      return apiRequest("/api/maintenance-actions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (result) => {
      console.log("Maintenance action created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-actions"] });
      toast({ title: t("toast.successSaved") });
    },
    onError: (error) => {
      console.error("Failed to create maintenance action:", error);
      toast({ title: t("errors.savingError"), variant: "destructive" });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/maintenance-reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-reports"] });
      toast({ title: t("toast.successSaved") });
    },
    onError: () => {
      toast({ title: t("errors.savingError"), variant: "destructive" });
    },
  });

  const createOperatorReportMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/operator-negligence-reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/operator-negligence-reports"],
      });
      toast({ title: t("toast.successSaved") });
    },
    onError: () => {
      toast({
        title: t("errors.savingError"),
        variant: "destructive",
      });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: any) => {
      // Add current user as reported_by
      const requestData = {
        ...data,
        reported_by: user?.id?.toString() || "",
      };
      return apiRequest("/api/maintenance-requests", {
        method: "POST",
        body: JSON.stringify(requestData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/maintenance-requests"],
      });
      setIsRequestDialogOpen(false);
      toast({ title: t("toast.successSaved") });
    },
    onError: (error) => {
      console.error("Error creating maintenance request:", error);
      toast({ title: t("errors.savingError"), variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t("production.pending");
      case "in_progress":
        return t("production.inProduction");
      case "completed":
        return t("production.completed");
      case "cancelled":
        return t("production.cancelled");
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return t("production.high");
      case "medium":
        return t("production.medium");
      case "low":
        return t("production.low");
      default:
        return priority;
    }
  };

  return (
    <div className={t("pages.maintenance.name.min_h_screen_bg_gray_50")}>
      <Header />

      <div className={t("pages.maintenance.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.maintenance.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          <div className={t("pages.maintenance.name.mb_6")}>
            <h1 className={t("pages.maintenance.name.text_2xl_font_bold_text_gray_900_mb_2")}>
              {t("maintenance.title")}
            </h1>
            <p className={t("pages.maintenance.name.text_gray_600")}>
              {t("maintenance.maintenanceManagement")}
            </p>
          </div>

          <div className={t("pages.maintenance.name.grid_grid_cols_1_md_grid_cols_4_gap_4_mb_6")}>
            <Card>
              <CardContent className={t("pages.maintenance.name.p_6")}>
                <div className={t("pages.maintenance.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.maintenance.name.text_sm_font_medium_text_gray_600")}>
                      {t("common.total")}
                    </p>
                    <p className={t("pages.maintenance.name.text_2xl_font_bold_text_gray_900")}>
                      {Array.isArray(maintenanceRequests)
                        ? maintenanceRequests.length
                        : 0}
                    </p>
                  </div>
                  <Wrench className={t("pages.maintenance.name.w_8_h_8_text_blue_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.maintenance.name.p_6")}>
                <div className={t("pages.maintenance.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.maintenance.name.text_sm_font_medium_text_gray_600")}>
                      {t("production.pending")}
                    </p>
                    <p className={t("pages.maintenance.name.text_2xl_font_bold_text_yellow_600")}>
                      {Array.isArray(maintenanceRequests)
                        ? maintenanceRequests.filter(
                            (r: any) => r.status === "pending",
                          ).length
                        : 0}
                    </p>
                  </div>
                  <Clock className={t("pages.maintenance.name.w_8_h_8_text_yellow_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.maintenance.name.p_6")}>
                <div className={t("pages.maintenance.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.maintenance.name.text_sm_font_medium_text_gray_600")}>
                      {t("production.inProduction")}
                    </p>
                    <p className={t("pages.maintenance.name.text_2xl_font_bold_text_blue_600")}>
                      {Array.isArray(maintenanceRequests)
                        ? maintenanceRequests.filter(
                            (r: any) => r.status === "in_progress",
                          ).length
                        : 0}
                    </p>
                  </div>
                  <AlertTriangle className={t("pages.maintenance.name.w_8_h_8_text_blue_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.maintenance.name.p_6")}>
                <div className={t("pages.maintenance.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.maintenance.name.text_sm_font_medium_text_gray_600")}>{t("production.completed")}</p>
                    <p className={t("pages.maintenance.name.text_2xl_font_bold_text_green_600")}>
                      {Array.isArray(maintenanceRequests)
                        ? maintenanceRequests.filter(
                            (r: any) => r.status === "completed",
                          ).length
                        : 0}
                    </p>
                  </div>
                  <CheckCircle className={t("pages.maintenance.name.w_8_h_8_text_green_500")} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className={t("pages.maintenance.name.w_full")}
          >
            <TabsList className={t("pages.maintenance.name.grid_w_full_grid_cols_6_mb_6")}>
              <TabsTrigger value="requests" className={t("pages.maintenance.name.flex_items_center_gap_2")}>
                <Wrench className={t("pages.maintenance.name.h_4_w_4")} />
                {t("maintenance.maintenanceTasks")}
              </TabsTrigger>
              <TabsTrigger value="actions" className={t("pages.maintenance.name.flex_items_center_gap_2")}>
                <CheckCircle className={t("pages.maintenance.name.h_4_w_4")} />
                {t("common.actions")}
              </TabsTrigger>
              <TabsTrigger value="reports" className={t("pages.maintenance.name.flex_items_center_gap_2")}>
                <FileText className={t("pages.maintenance.name.h_4_w_4")} />
                {t("reports.maintenanceReports")}
              </TabsTrigger>
              <TabsTrigger
                value="negligence"
                className={t("pages.maintenance.name.flex_items_center_gap_2")}
              >
                <AlertCircle className={t("pages.maintenance.name.h_4_w_4")} />
                {t("maintenance.maintenanceTasks")}
              </TabsTrigger>
              <TabsTrigger
                value="spare-parts"
                className={t("pages.maintenance.name.flex_items_center_gap_2")}
              >
                <Users className={t("pages.maintenance.name.h_4_w_4")} />
                {t("maintenance.spareParts")}
              </TabsTrigger>
              <TabsTrigger
                value="consumable-parts"
                className={t("pages.maintenance.name.flex_items_center_gap_2")}
              >
                <Wrench className={t("pages.maintenance.name.h_4_w_4")} />
                {t("maintenance.consumableParts")}
              </TabsTrigger>
            </TabsList>

            {/* Maintenance Requests Tab */}
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <div className={t("pages.maintenance.name.flex_justify_between_items_center")}>
                    <CardTitle>{t("maintenance.maintenanceTasks")}</CardTitle>
                    <Dialog
                      open={isRequestDialogOpen}
                      onOpenChange={setIsRequestDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className={t("pages.maintenance.name.bg_blue_600_hover_bg_blue_700_text_white")}>
                          <Plus className={t("pages.maintenance.name.h_4_w_4_mr_2")} />
                          {t("common.add")}
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
                    <div className={t("pages.maintenance.name.text_center_py_8")}>
                      <div className={t("pages.maintenance.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
                      <p className={t("pages.maintenance.name.mt_2_text_sm_text_muted_foreground")}>
                        {t("common.loading")}
                      </p>
                    </div>{t('pages.maintenance.)_:_(')}<div className={t("pages.maintenance.name.overflow_x_auto")}>
                      <table className={t("pages.maintenance.name.min_w_full_divide_y_divide_gray_200")}>
                        <thead className={t("pages.maintenance.name.bg_gray_50")}>
                          <tr>
                            <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.name")}
                            </th>
                            <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("maintenance.equipment")}
                            </th>
                            <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.type")}
                            </th>
                            <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("maintenance.taskPriority")}
                            </th>
                            <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.status")}
                            </th>
                            <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.description")}
                            </th>
                            <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("maintenance.assignedTo")}
                            </th>
                            <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>
                              {t("common.date")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className={t("pages.maintenance.name.bg_white_divide_y_divide_gray_200")}>
                          {Array.isArray(maintenanceRequests) &&
                          maintenanceRequests.length > 0 ? (
                            maintenanceRequests.map((request: any) => {
                              // Get machine name from machines array
                              const machine = Array.isArray(machines)
                                ? machines.find(
                                    (m: any) => m.id === request.machine_id,
                                  )
                                : null;
                              const machineName = machine
                                ? machine.name_ar || machine.name
                                : request.machine_id;

                              // Get assigned user name from users array
                              const assignedUser =
                                Array.isArray(users) && request.assigned_to
                                  ? users.find(
                                      (u: any) =>{t('pages.maintenance.u.id.tostring()_===_request.assigned_to.tostring(),_)_:_null;_const_assignedname_=_assigneduser_?_assigneduser.full_name_||_assigneduser.username_:_t("common.nodata");_return_(')}<tr
                                  key={request.id}
                                  className={t("pages.maintenance.name.hover_bg_gray_50")}
                                >
                                  <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                                    {request.request_number}
                                  </td>
                                  <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                    {machineName}
                                  </td>
                                  <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                    {request.issue_type === "mechanical"
                                      ? t("maintenance.maintenanceType")
                                      : request.issue_type === "electrical"
                                        ? t("maintenance.maintenanceType")
                                        : t("common.type")}
                                  </td>
                                  <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_center")}>
                                    <Badge
                                      variant={
                                        request.urgency_level === "urgent"
                                          ? "destructive"
                                          : request.urgency_level === "medium"
                                            ? "default"
                                            : "secondary"
                                      }
                                    >
                                      {request.urgency_level === "urgent"
                                        ? t("production.urgent")
                                        : request.urgency_level === "medium"
                                          ? t("production.medium")
                                          : t("production.normal")}
                                    </Badge>
                                  </td>
                                  <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_center")}>
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                                    >
                                      {getStatusText(request.status)}
                                    </span>
                                  </td>
                                  <td className={t("pages.maintenance.name.px_6_py_4_text_sm_text_gray_500_max_w_xs_truncate_text_center")}>
                                    {request.description}
                                  </td>
                                  <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                    {assignedName}
                                  </td>
                                  <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                                    {new Date(
                                      request.date_reported,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    })}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={8}
                                className={t("pages.maintenance.name.px_6_py_4_text_center_text_gray_500")}
                              >
                                {t("common.noData")}
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
                onViewAction={(action: any) => {
                  setSelectedAction(action);
                  setIsActionViewDialogOpen(true);
                }}
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

            {/* Spare Parts Tab */}
            <TabsContent value="spare-parts">
              <SparePartsTab
                spareParts={Array.isArray(spareParts) ? spareParts : []}
                isLoading={false}
              />
            </TabsContent>

            {/* Consumable Parts Tab */}
            <TabsContent value="consumable-parts">
              <ConsumablePartsTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Action View Dialog */}
      <Dialog
        open={isActionViewDialogOpen}
        onOpenChange={setIsActionViewDialogOpen}
      >
        <DialogContent className={t("pages.maintenance.name.max_w_2xl")}>
          <DialogHeader>
            <DialogTitle>{t('pages.maintenance.تفاصيل_إجراء_الصيانة')}</DialogTitle>
            <DialogDescription>{t('pages.maintenance.عرض_تفاصيل_إجراء_الصيانة_المحدد')}</DialogDescription>
          </DialogHeader>
          {selectedAction &&
            (() => {
              const performedByUser = Array.isArray(users)
                ? users.find(
                    (u: any) => u.id.toString() === selectedAction.performed_by,
                  )
                : null;
              const maintenanceRequest = Array.isArray(maintenanceRequests)
                ? maintenanceRequests.find(
                    (r: any) =>{t('pages.maintenance.r.id_===_selectedaction.maintenance_request_id,_)_:_null;_return_(')}<div className={t("pages.maintenance.name.space_y_6")}>
                  {/* Basic Information */}
                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.رقم_الإجراء')}</label>
                      <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_font_mono_bg_gray_50_p_2_rounded")}>
                        {selectedAction.action_number}
                      </p>
                    </div>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.رقم_طلب_الصيانة')}</label>
                      <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_font_mono_bg_gray_50_p_2_rounded")}>
                        {maintenanceRequest?.request_number ||
                          selectedAction.maintenance_request_id}
                      </p>
                    </div>
                  </div>

                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.نوع_الإجراء')}</label>
                      <div className={t("pages.maintenance.name.mt_1")}>
                        <Badge variant="outline" className={t("pages.maintenance.name.text_sm")}>
                          {selectedAction.action_type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.المنفذ')}</label>
                      <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_bg_gray_50_p_2_rounded")}>
                        {performedByUser
                          ? performedByUser.display_name_ar ||
                            performedByUser.display_name ||
                            performedByUser.username
                          : selectedAction.performed_by}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.وصف_الإجراء')}</label>
                    <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_bg_gray_50_p_3_rounded_min_h_60px_")}>
                      {selectedAction.description || "لا يوجد وصف"}
                    </p>
                  </div>

                  {/* Technical Reports */}
                  {selectedAction.text_report && (
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.التقرير_النصي')}</label>
                      <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_bg_blue_50_p_3_rounded_min_h_60px_border_border_blue_200")}>
                        {selectedAction.text_report}
                      </p>
                    </div>
                  )}

                  {/* Spare Parts and Machining Requests */}
                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.طلب_قطع_غيار')}</label>
                      <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_bg_gray_50_p_2_rounded")}>
                        {selectedAction.spare_parts_request || "لا يوجد"}
                      </p>
                    </div>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.طلب_مخرطة')}</label>
                      <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_bg_gray_50_p_2_rounded")}>
                        {selectedAction.machining_request || "لا يوجد"}
                      </p>
                    </div>
                  </div>

                  {/* Management Actions */}
                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.يتطلب_إجراء_إداري')}</label>
                      <div className={t("pages.maintenance.name.mt_1")}>
                        <Badge
                          variant={
                            selectedAction.requires_management_action
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {selectedAction.requires_management_action
                            ? "نعم"
                            : "لا"}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.تم_إشعار_الإدارة')}</label>
                      <div className={t("pages.maintenance.name.mt_1")}>
                        <Badge
                          variant={
                            selectedAction.management_notified
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedAction.management_notified ? "نعم" : "لا"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Date Information */}
                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.تاريخ_التنفيذ')}</label>
                      <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_bg_gray_50_p_2_rounded")}>
                        {selectedAction.performed_at
                          ? new Date(
                              selectedAction.performed_at,
                            ).toLocaleDateString("ar")
                          : "غير محدد"}
                      </p>
                    </div>
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.تاريخ_الإنشاء')}</label>
                      <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1_bg_gray_50_p_2_rounded")}>
                        {selectedAction.created_at
                          ? new Date(
                              selectedAction.created_at,
                            ).toLocaleDateString("ar")
                          : "غير محدد"}
                      </p>
                    </div>
                  </div>

                  {/* Machine Information */}
                  {maintenanceRequest && (
                    <div>
                      <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.معلومات_الماكينة')}</label>
                      <div className={t("pages.maintenance.name.mt_1_bg_blue_50_p_3_rounded_border_border_blue_200")}>
                        <p className={t("pages.maintenance.name.text_sm")}>
                          <strong>{t('pages.maintenance.معرف_الماكينة:')}</strong>{" "}
                          {maintenanceRequest.machine_id}
                        </p>
                        <p className={t("pages.maintenance.name.text_sm")}>
                          <strong>{t('pages.maintenance.نوع_المشكلة:')}</strong>{" "}
                          {maintenanceRequest.issue_type}
                        </p>
                        <p className={t("pages.maintenance.name.text_sm")}>
                          <strong>{t('pages.maintenance.مستوى_الأولوية:')}</strong>{" "}
                          {maintenanceRequest.urgency_level}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Maintenance Actions Tab Component
function MaintenanceActionsTab({
  actions,
  requests,
  users,
  isLoading,
  onCreateAction,
  onViewAction,
}: any) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Add spare parts query and user context
  const { data: spareParts } = useQuery({ queryKey: ["/api/spare-parts"] });
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(maintenanceActionSchema),
    defaultValues: {
      maintenance_request_id: 0,
      action_type: "",
      description: "",
      text_report: "",
      spare_parts_request: "",
      machining_request: "",
      operator_negligence_report: "",
      performed_by: "",
      requires_management_action: false,
      management_notified: false,
    },
  });

  // Set current user as performer when dialog opens or user changes
  useEffect(() => {
    if (user?.id) {
      form.setValue("performed_by", user.id.toString());
    }
  }, [user?.id, form]);

  const onSubmit = async (data: any) => {
    try {
      console.log("Form data submitted:", data);

      // Generate action number
      const actionNumber = generateActionNumber();

      const submitData = {
        ...data,
        action_number: actionNumber,
        request_created_by: user?.id?.toString() || "",
      };

      console.log("Submitting action data:", submitData);
      await onCreateAction(submitData);

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating maintenance action:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={t("pages.maintenance.name.flex_items_center_justify_between")}>
          <span>{t('pages.maintenance.إجراءات_الصيانة')}</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className={t("pages.maintenance.name.h_4_w_4_ml_2")} />{t('pages.maintenance.إضافة_إجراء_جديد')}</Button>
            </DialogTrigger>
            <DialogContent className={t("pages.maintenance.name.max_w_4xl")}>
              <DialogHeader>
                <DialogTitle>{t('pages.maintenance.إضافة_إجراء_صيانة_جديد')}</DialogTitle>
                <DialogDescription>{t('pages.maintenance.تسجيل_إجراء_صيانة_جديد_مع_تحديد_المعدات_والمنفذ')}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className={t("pages.maintenance.name.space_y_4")}
                >
                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.maintenance_request_id')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.طلب_الصيانة')}</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_طلب_الصيانة')}" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(requests) &&
                                requests.map((request: any) => (
                                  <SelectItem
                                    key={request.id}
                                    value={request.id.toString()}
                                  >
                                    {request.request_number} -{" "}
                                    {request.description}
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
                      name="{t('pages.maintenance.name.action_type')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.نوع_الإجراء')}</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_نوع_الإجراء')}" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="فحص مبدئي">{t('pages.maintenance.فحص_مبدئي')}</SelectItem>
                              <SelectItem value="تغيير قطعة غيار">{t('pages.maintenance.تغيير_قطعة_غيار')}</SelectItem>
                              <SelectItem value="إصلاح مكانيكي">{t('pages.maintenance.إصلاح_مكانيكي')}</SelectItem>
                              <SelectItem value="إصلاح كهربائي">{t('pages.maintenance.إصلاح_كهربائي')}</SelectItem>
                              <SelectItem value="إيقاف الماكينة">{t('pages.maintenance.إيقاف_الماكينة')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="{t('pages.maintenance.name.performed_by')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.maintenance.المنفذ')}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={user?.id ? user.id.toString() : ""}
                            type="hidden"
                            className={t("pages.maintenance.name.hidden")}
                          />
                        </FormControl>
                        <div className={t("pages.maintenance.name.p_3_bg_gray_100_dark_bg_gray_800_rounded_border")}>
                          <div className={t("pages.maintenance.name.font_medium_text_sm")}>
                            {user
                              ? `${user.display_name || user.username} (${user.id})`
                              : "جاري التحميل..."}
                          </div>
                          <div className={t("pages.maintenance.name.text_xs_text_gray_600_dark_text_gray_400")}>{t('pages.maintenance.سيتم_تسجيل_الإجراء_باسم_المستخدم_الحالي')}</div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="{t('pages.maintenance.name.description')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.maintenance.وصف_الإجراء')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="{t('pages.maintenance.placeholder.اكتب_وصفاً_مفصلاً_للإجراء_المتخذ')}"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.text_report')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.التقرير_النصي')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="{t('pages.maintenance.placeholder.تقرير_مفصل_عن_العملية')}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.spare_parts_request')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.طلب_قطع_غيار')}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_قطعة_الغيار_المطلوبة')}" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(spareParts) &&
                                spareParts.length > 0 ? (
                                  spareParts
                                    .filter(
                                      (part) =>
                                        part.part_id &&
                                        part.part_name &&
                                        part.code,
                                    )
                                    .map((part: any) => (
                                      <SelectItem
                                        key={part.part_id}
                                        value={`${part.part_name}_${part.code}_${part.part_id}`}
                                      >
                                        {part.part_name} ({part.code}) -{" "}
                                        {part.machine_name}
                                      </SelectItem>{t('pages.maintenance.))_)_:_(')}<SelectItem value="no_parts">{t('pages.maintenance.لا_توجد_قطع_غيار_متاحة')}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.machining_request')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.طلب_مخرطة')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="{t('pages.maintenance.placeholder.تفاصيل_طلب_المخرطة_إن_وجد')}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.operator_negligence_report')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.تبليغ_إهمال_المشغل')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="{t('pages.maintenance.placeholder.تقرير_عن_إهمال_المشغل_إن_وجد')}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.requires_management_action')}"
                      render={({ field }) => (
                        <FormItem className={t("pages.maintenance.name.flex_flex_row_items_center_space_x_3_space_y_0")}>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className={t("pages.maintenance.name.h_4_w_4")}
                            />
                          </FormControl>
                          <div className={t("pages.maintenance.name.space_y_1_leading_none")}>
                            <FormLabel>{t('pages.maintenance.يحتاج_موافقة_إدارية')}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.management_notified')}"
                      render={({ field }) => (
                        <FormItem className={t("pages.maintenance.name.flex_flex_row_items_center_space_x_3_space_y_0")}>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className={t("pages.maintenance.name.h_4_w_4")}
                            />
                          </FormControl>
                          <div className={t("pages.maintenance.name.space_y_1_leading_none")}>
                            <FormLabel>{t('pages.maintenance.تم_إبلاغ_الإدارة')}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className={t("pages.maintenance.name.flex_justify_end_gap_2")}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >{t('pages.maintenance.إلغاء')}</Button>
                    <Button type="submit">{t('pages.maintenance.حفظ_الإجراء')}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className={t("pages.maintenance.name.text_center_py_8")}>
            <div className={t("pages.maintenance.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
            <p className={t("pages.maintenance.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.maintenance.جاري_التحميل...')}</p>
          </div>
        ) : Array.isArray(actions) && actions.length >{t('pages.maintenance.0_?_(')}<div className={t("pages.maintenance.name.overflow_x_auto")}>
            <table className={t("pages.maintenance.name.w_full_border_collapse_border_border_gray_300_text_sm")}>
              <thead className={t("pages.maintenance.name.bg_gray_50")}>
                <tr>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.رقم_الإجراء')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.رقم_طلب_الصيانة')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.نوع_الإجراء')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.الوصف')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.المنفذ')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.طلب_قطع_غيار')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.طلب_مخرطة')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.موافقة_إدارية')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.تاريخ_التنفيذ')}</th>
                  <th className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_semibold")}>{t('pages.maintenance.الإجراءات')}</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action: any) => {
                  const performedByUser = Array.isArray(users)
                    ? users.find(
                        (u: any) => u.id.toString() === action.performed_by,
                      )
                    : null;
                  const maintenanceRequest = Array.isArray(requests)
                    ? requests.find(
                        (r: any) => r.id === action.maintenance_request_id,
                      )
                    : null;

                  const handleView = () => {
                    onViewAction?.(action);
                  };

                  const handlePrint = () => {
                    const printContent = `
                      <div style="font-family: Arial; direction: rtl; text-align: right; padding: 20px;">
                        <h2 style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px;">
                          إجراء صيانة رقم: ${action.action_number}
                        </h2>
                        <div style="margin: 20px 0;">
                          <p><strong>{t('pages.maintenance.رقم_طلب_الصيانة:')}</strong> ${maintenanceRequest?.request_number || action.maintenance_request_id}</p>
                          <p><strong>{t('pages.maintenance.نوع_الإجراء:')}</strong> ${action.action_type}</p>
                          <p><strong>{t('pages.maintenance.الوصف:')}</strong> ${action.description || "-"}</p>
                          <p><strong>{t('pages.maintenance.المنفذ:')}</strong> ${performedByUser ? performedByUser.full_name || performedByUser.username : action.performed_by}</p>
                          <p><strong>{t('pages.maintenance.طلب_قطع_غيار:')}</strong> ${action.spare_parts_request || "-"}</p>
                          <p><strong>{t('pages.maintenance.طلب_مخرطة:')}</strong> ${action.machining_request || "-"}</p>
                          <p><strong>{t('pages.maintenance.تقرير_إهمال_المشغل:')}</strong> ${action.operator_negligence_report || "-"}</p>
                          <p><strong>{t('pages.maintenance.تقرير_نصي:')}</strong> ${action.text_report || "-"}</p>
                          <p><strong>{t('pages.maintenance.موافقة_إدارية_مطلوبة:')}</strong> ${action.requires_management_action ? "نعم" : "لا"}</p>
                          <p><strong>{t('pages.maintenance.تاريخ_التنفيذ:')}</strong> ${new Date(action.action_date).toLocaleDateString("ar")}</p>
                          <p><strong>{t('pages.maintenance.وقت_التنفيذ:')}</strong> ${new Date(action.action_date).toLocaleTimeString("ar")}</p>
                        </div>
                      </div>
                    `;

                    const printWindow = window.open("", "_blank");
                    printWindow?.document.write(printContent);
                    printWindow?.document.close();
                    printWindow?.print();
                  };

                  const handleDelete = async () => {
                    if (
                      confirm(
                        `هل أنت متأكد من حذف الإجراء ${action.action_number}؟`,
                      )
                    ) {
                      try {
                        const response = await fetch(`/api/maintenance-actions/${action.id}`, {
                          method: "DELETE",
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => null);
                          const errorMessage = errorData?.message || "حدث خطأ في حذف الإجراء";
                          alert(errorMessage);
                          return;
                        }
                        
                        window.location.reload();
                      } catch (error) {
                        console.error("Error deleting maintenance action:", error);
                        alert("حدث خطأ في الاتصال بالخادم");
                      }
                    }
                  };

                  const handleEdit = () => {
                    alert(
                      `تعديل الإجراء ${action.action_number} - سيتم تطوير هذه الميزة قريباً`,
                    );
                  };

                  return (
                    <tr key={action.id} className={t("pages.maintenance.name.hover_bg_gray_50")}>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_medium_text_blue_600")}>
                        {action.action_number}
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center_font_medium_text_green_600")}>
                        {maintenanceRequest?.request_number ||
                          `MO${action.maintenance_request_id.toString().padStart(3, "0")}`}
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center")}>
                        <Badge
                          variant="outline"
                          className={t("pages.maintenance.name.bg_blue_50_text_blue_700")}
                        >
                          {action.action_type}
                        </Badge>
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2")}>
                        {action.description || "-"}
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center")}>
                        {performedByUser
                          ? performedByUser.full_name ||
                            performedByUser.username
                          : action.performed_by}
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2")}>
                        {action.spare_parts_request || "-"}
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2")}>
                        {action.machining_request || "-"}
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center")}>
                        {action.requires_management_action ? (
                          <Badge variant="destructive">{t('pages.maintenance.مطلوب')}</Badge>{t('pages.maintenance.)_:_(')}<Badge variant="secondary">{t('pages.maintenance.غير_مطلوب')}</Badge>
                        )}
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center")}>
                        {new Date(action.action_date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )}
                        <br />
                        <span className={t("pages.maintenance.name.text_xs_text_gray_500")}>
                          {new Date(action.action_date).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </span>
                      </td>
                      <td className={t("pages.maintenance.name.border_border_gray_300_px_4_py_2_text_center")}>
                        <div className={t("pages.maintenance.name.flex_justify_center_gap_1")}>
                          <Button
                            size="sm"
                            variant="outline"
                            className={t("pages.maintenance.name.bg_blue_50_text_blue_600_hover_bg_blue_100_border_blue_200_h_8_w_8_p_0")}
                            onClick={handleView}
                            title="{t('pages.maintenance.title.{t('pages.maintenance.title.عرض')}')}"
                          >
                            <Eye className={t("pages.maintenance.name.h_4_w_4")} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={t("pages.maintenance.name.bg_green_50_text_green_600_hover_bg_green_100_border_green_200_h_8_w_8_p_0")}
                            onClick={handlePrint}
                            title="{t('pages.maintenance.title.{t('pages.maintenance.title.طباعة')}')}"
                          >
                            <Printer className={t("pages.maintenance.name.h_4_w_4")} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={t("pages.maintenance.name.bg_yellow_50_text_yellow_600_hover_bg_yellow_100_border_yellow_200_h_8_w_8_p_0")}
                            onClick={handleEdit}
                            title="{t('pages.maintenance.title.{t('pages.maintenance.title.تعديل')}')}"
                          >
                            <Edit className={t("pages.maintenance.name.h_4_w_4")} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={t("pages.maintenance.name.bg_red_50_text_red_600_hover_bg_red_100_border_red_200_h_8_w_8_p_0")}
                            onClick={handleDelete}
                            title="{t('pages.maintenance.title.{t('pages.maintenance.title.حذف')}')}"
                          >
                            <Trash2 className={t("pages.maintenance.name.h_4_w_4")} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>{t('pages.maintenance.)_:_(')}<div className={t("pages.maintenance.name.text_center_py_8_text_gray_500")}>
            <CheckCircle className={t("pages.maintenance.name.h_12_w_12_mx_auto_mb_4_opacity_50")} />
            <p>{t('pages.maintenance.لا_توجد_إجراءات_صيانة_مسجلة')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Maintenance Reports Tab Component
function MaintenanceReportsTab({
  reports,
  machines,
  users,
  isLoading,
  onCreateReport,
}: any) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
    if (!user?.id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لإنشاء بلاغ صيانة",
        variant: "destructive",
      });
      return;
    }

    try {
      const reportNumber = generateMaintenanceReportNumber();

      await onCreateReport({
        ...data,
        report_number: reportNumber,
        reported_by_user_id: user.id,
        status: "open",
        estimated_repair_time: data.estimated_repair_time || null,
      });

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating maintenance report:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={t("pages.maintenance.name.flex_items_center_justify_between")}>
          <span>{t('pages.maintenance.بلاغات_الصيانة')}</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className={t("pages.maintenance.name.h_4_w_4_ml_2")} />{t('pages.maintenance.إضافة_بلاغ_جديد')}</Button>
            </DialogTrigger>
            <DialogContent className={t("pages.maintenance.name.max_w_4xl")}>
              <DialogHeader>
                <DialogTitle>{t('pages.maintenance.إضافة_بلاغ_صيانة_جديد')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className={t("pages.maintenance.name.space_y_4")}
                >
                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.report_type')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.نوع_البلاغ')}</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_نوع_البلاغ')}" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="breakdown">{t('pages.maintenance.عطل_في_الماكينة')}</SelectItem>
                              <SelectItem value="malfunction">{t('pages.maintenance.خلل_في_الأداء')}</SelectItem>
                              <SelectItem value="safety">{t('pages.maintenance.مشكلة_أمان')}</SelectItem>
                              <SelectItem value="quality">{t('pages.maintenance.مشكلة_جودة')}</SelectItem>
                              <SelectItem value="preventive">{t('pages.maintenance.صيانة_وقائية_مطلوبة')}</SelectItem>
                              <SelectItem value="spare_parts">{t('pages.maintenance.طلب_قطع_غيار')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.severity')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.شدة_المشكلة')}</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_شدة_المشكلة')}" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t('pages.maintenance.منخفضة')}</SelectItem>
                              <SelectItem value="medium">{t('pages.maintenance.متوسطة')}</SelectItem>
                              <SelectItem value="high">{t('pages.maintenance.عالية')}</SelectItem>
                              <SelectItem value="critical">{t('pages.maintenance.حرجة')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="{t('pages.maintenance.name.title')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.maintenance.عنوان_البلاغ')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="{t('pages.maintenance.placeholder.عنوان_مختصر_للمشكلة')}" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="{t('pages.maintenance.name.description')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.maintenance.وصف_المشكلة')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="{t('pages.maintenance.placeholder.وصف_مفصل_للمشكلة_والأعراض')}"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.machine_id')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.الماكينة_(اختياري)')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="{t('pages.maintenance.placeholder.رقم_أو_اسم_الماكينة')}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.estimated_repair_time')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.الوقت_المتوقع_للإصلاح_(ساعات)')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className={t("pages.maintenance.name.flex_justify_end_gap_2")}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >{t('pages.maintenance.إلغاء')}</Button>
                    <Button type="submit">{t('pages.maintenance.إرسال_البلاغ')}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className={t("pages.maintenance.name.text_center_py_8")}>
            <div className={t("pages.maintenance.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
            <p className={t("pages.maintenance.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.maintenance.جاري_التحميل...')}</p>
          </div>
        ) : Array.isArray(reports) && reports.length >{t('pages.maintenance.0_?_(')}<div className={t("pages.maintenance.name.space_y_4")}>
            {reports.map((report: any) => (
              <div key={report.id} className={t("pages.maintenance.name.border_rounded_lg_p_4")}>
                <div className={t("pages.maintenance.name.flex_justify_between_items_start_mb_2")}>
                  <h3 className={t("pages.maintenance.name.font_semibold")}>
                    {report.report_number} - {report.title}
                  </h3>
                  <div className={t("pages.maintenance.name.flex_gap_2")}>
                    <Badge
                      variant={
                        report.severity === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {report.severity}
                    </Badge>
                    <Badge>{report.status}</Badge>
                  </div>
                </div>
                <p className={t("pages.maintenance.name.text_sm_text_gray_600_mb_2")}>
                  {report.description}
                </p>
                <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4_text_sm")}>
                  <div>
                    <span className={t("pages.maintenance.name.font_medium")}>{t('pages.maintenance.نوع_البلاغ:')}</span>
                    {report.report_type}
                  </div>
                  <div>
                    <span className={t("pages.maintenance.name.font_medium")}>{t('pages.maintenance.تاريخ_الإبلاغ:')}</span>
                    {new Date(report.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>{t('pages.maintenance.)_:_(')}<div className={t("pages.maintenance.name.text_center_py_8_text_gray_500")}>
            <FileText className={t("pages.maintenance.name.h_12_w_12_mx_auto_mb_4_opacity_50")} />
            <p>{t('pages.maintenance.لا_توجد_بلاغات_صيانة')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Operator Negligence Tab Component
function OperatorNegligenceTab({
  reports,
  users,
  isLoading,
  onCreateReport,
}: any) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
    if (!user?.id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لإنشاء بلاغ إهمال",
        variant: "destructive",
      });
      return;
    }

    try {
      const reportNumber = generateOperatorReportNumber();

      await onCreateReport({
        ...data,
        report_number: reportNumber,
        reported_by_user_id: user.id,
        report_date: new Date().toISOString().split("T")[0],
        status: "pending",
        follow_up_required:
          data.severity === "high" || data.severity === "critical",
      });

      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating operator negligence report:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={t("pages.maintenance.name.flex_items_center_justify_between")}>
          <span>{t('pages.maintenance.بلاغات_إهمال_المشغلين')}</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className={t("pages.maintenance.name.h_4_w_4_ml_2")} />{t('pages.maintenance.إضافة_بلاغ_إهمال')}</Button>
            </DialogTrigger>
            <DialogContent className={t("pages.maintenance.name.max_w_4xl")}>
              <DialogHeader>
                <DialogTitle>{t('pages.maintenance.إضافة_بلاغ_إهمال_مشغل')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className={t("pages.maintenance.name.space_y_4")}
                >
                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.operator_id')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.معرف_المشغل')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="{t('pages.maintenance.placeholder.رقم_المشغل_أو_كود_التعريف')}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.operator_name')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.اسم_المشغل')}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="{t('pages.maintenance.placeholder.الاسم_الكامل_للمشغل')}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.incident_date')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.تاريخ_الحادث')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.incident_type')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.نوع_الإهمال')}</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_نوع_الإهمال')}" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="safety_violation">{t('pages.maintenance.مخالفة_قواعد_الأمان')}</SelectItem>
                              <SelectItem value="equipment_misuse">{t('pages.maintenance.سوء_استخدام_المعدات')}</SelectItem>
                              <SelectItem value="procedure_violation">{t('pages.maintenance.عدم_اتباع_الإجراءات')}</SelectItem>
                              <SelectItem value="quality_negligence">{t('pages.maintenance.إهمال_الجودة')}</SelectItem>
                              <SelectItem value="time_violation">{t('pages.maintenance.مخالفة_الوقت')}</SelectItem>
                              <SelectItem value="maintenance_neglect">{t('pages.maintenance.إهمال_الصيانة')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="{t('pages.maintenance.name.description')}"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('pages.maintenance.وصف_الحادث')}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="{t('pages.maintenance.placeholder.وصف_مفصل_لما_حدث_والظروف_المحيطة')}"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.severity')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.درجة_خطورة_الإهمال')}</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_درجة_الخطورة')}" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t('pages.maintenance.منخفضة')}</SelectItem>
                              <SelectItem value="medium">{t('pages.maintenance.متوسطة')}</SelectItem>
                              <SelectItem value="high">{t('pages.maintenance.عالية')}</SelectItem>
                              <SelectItem value="critical">{t('pages.maintenance.حرجة')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="{t('pages.maintenance.name.immediate_actions_taken')}"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.maintenance.الإجراءات_المتخذة_فوراً')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="{t('pages.maintenance.placeholder.ما_تم_اتخاذه_من_إجراءات_فورية')}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className={t("pages.maintenance.name.flex_justify_end_gap_2")}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >{t('pages.maintenance.إلغاء')}</Button>
                    <Button type="submit">{t('pages.maintenance.إرسال_البلاغ')}</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className={t("pages.maintenance.name.text_center_py_8")}>
            <div className={t("pages.maintenance.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_primary_mx_auto")}></div>
            <p className={t("pages.maintenance.name.mt_2_text_sm_text_muted_foreground")}>{t('pages.maintenance.جاري_التحميل...')}</p>
          </div>
        ) : Array.isArray(reports) && reports.length >{t('pages.maintenance.0_?_(')}<div className={t("pages.maintenance.name.space_y_4")}>
            {reports.map((report: any) => (
              <div key={report.id} className={t("pages.maintenance.name.border_rounded_lg_p_4")}>
                <div className={t("pages.maintenance.name.flex_justify_between_items_start_mb_2")}>
                  <h3 className={t("pages.maintenance.name.font_semibold")}>
                    {report.report_number} - {report.operator_name}
                  </h3>
                  <div className={t("pages.maintenance.name.flex_gap_2")}>
                    <Badge
                      variant={
                        report.severity === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {report.severity}
                    </Badge>
                    <Badge>{report.status}</Badge>
                  </div>
                </div>
                <p className={t("pages.maintenance.name.text_sm_text_gray_600_mb_2")}>
                  {report.description}
                </p>
                <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4_text_sm")}>
                  <div>
                    <span className={t("pages.maintenance.name.font_medium")}>{t('pages.maintenance.نوع_الإهمال:')}</span>
                    {report.incident_type}
                  </div>
                  <div>
                    <span className={t("pages.maintenance.name.font_medium")}>{t('pages.maintenance.تاريخ_الحادث:')}</span>
                    {new Date(report.incident_date).toLocaleDateString("ar")}
                  </div>
                </div>
              </div>
            ))}
          </div>{t('pages.maintenance.)_:_(')}<div className={t("pages.maintenance.name.text_center_py_8_text_gray_500")}>
            <Users className={t("pages.maintenance.name.h_12_w_12_mx_auto_mb_4_opacity_50")} />
            <p>{t('pages.maintenance.لا_توجد_بلاغات_إهمال_مسجلة')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Maintenance Request Dialog Component
function MaintenanceRequestDialog({
  machines,
  users,
  onSubmit,
  isLoading,
}: any) {
  const form = useForm({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      machine_id: "",
      issue_type: "mechanical",
      urgency_level: "normal",
      description: "",
      assigned_to: "none",
    },
  });

  const handleSubmit = (data: any) => {
    // Convert "none" back to empty string for the API
    const submitData = {
      ...data,
      assigned_to: data.assigned_to === "none" ? "" : data.assigned_to,
    };
    onSubmit(submitData);
    form.reset();
  };

  return (
    <DialogContent
      className={t("pages.maintenance.name.sm_max_w_600px_")}
      aria-describedby="maintenance-request-description"
    >
      <DialogHeader>
        <DialogTitle>{t('pages.maintenance.طلب_صيانة_جديد')}</DialogTitle>
        <p
          id="maintenance-request-description"
          className={t("pages.maintenance.name.text_sm_text_gray_600")}
        >{t('pages.maintenance.أنشئ_طلب_صيانة_جديد_للمعدات_التي_تحتاج_إلى_إصلاح_أو_صيانة')}</p>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={t("pages.maintenance.name.space_y_4")}>
          <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
            <FormField
              control={form.control}
              name="{t('pages.maintenance.name.machine_id')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.maintenance.المعدة')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_المعدة')}" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(machines) &&
                        machines
                          .filter(
                            (machine) =>
                              machine.id &&
                              machine.id !== "" &&
                              machine.id !== null &&
                              machine.id !== undefined,
                          )
                          .map((machine: any) => (
                            <SelectItem
                              key={machine.id}
                              value={machine.id.toString()}
                            >
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
              name="{t('pages.maintenance.name.issue_type')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.maintenance.نوع_المشكلة')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_نوع_المشكلة')}" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mechanical">{t('pages.maintenance.ميكانيكية')}</SelectItem>
                      <SelectItem value="electrical">{t('pages.maintenance.كهربائية')}</SelectItem>
                      <SelectItem value="other">{t('pages.maintenance.أخرى')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
            <FormField
              control={form.control}
              name="{t('pages.maintenance.name.urgency_level')}"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pages.maintenance.مستوى_الإلحاح')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_مستوى_الإلحاح')}" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">{t('pages.maintenance.عادي')}</SelectItem>
                      <SelectItem value="medium">{t('pages.maintenance.متوسط')}</SelectItem>
                      <SelectItem value="urgent">{t('pages.maintenance.عاجل')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.assigned_to')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.المكلف_بالإصلاح_(اختياري)')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_الفني')}" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t('pages.maintenance.بدون_تكليف')}</SelectItem>
                    {Array.isArray(users) &&
                      users
                        .filter((user: any) => user.role === "technician")
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
            name="{t('pages.maintenance.name.description')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.وصف_المشكلة')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="{t('pages.maintenance.placeholder.اشرح_المشكلة_أو_نوع_الصيانة_المطلوبة...')}"
                    className={t("pages.maintenance.name.min_h_100px_")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className={t("pages.maintenance.name.flex_justify_end_gap_2")}>
            <Button
              type="submit"
              disabled={isLoading}
              className={t("pages.maintenance.name.bg_blue_600_hover_bg_blue_700_text_white")}
            >
              {isLoading ? "جاري الإنشاء..." : "إنشاء الطلب"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

// Spare Parts Tab Component
function SparePartsTab({
  spareParts,
  isLoading,
}: {
  spareParts: any[];
  isLoading: boolean;
}) {
  const [selectedPart, setSelectedPart] = useState<any>{t('pages.maintenance.(null);_const_[iscreatedialogopen,_setiscreatedialogopen]_=_usestate(false);_const_[isviewdialogopen,_setisviewdialogopen]_=_usestate(false);_const_[iseditdialogopen,_setiseditdialogopen]_=_usestate(false);_const_[parttodelete,_setparttodelete]_=_usestate')}<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create spare part mutation
  const createSparePartMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/spare-parts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      toast({ title: "تم إنشاء قطعة الغيار بنجاح" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "فشل في إنشاء قطعة الغيار", variant: "destructive" });
    },
  });

  // Update spare part mutation
  const updateSparePartMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest(`/api/spare-parts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      toast({ title: "تم تحديث قطعة الغيار بنجاح" });
      setIsEditDialogOpen(false);
      setSelectedPart(null);
    },
    onError: () => {
      toast({ title: "فشل في تحديث قطعة الغيار", variant: "destructive" });
    },
  });

  // Delete spare part mutation
  const deleteSparePartMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/spare-parts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      toast({ title: "تم حذف قطعة الغيار بنجاح" });
      setPartToDelete(null);
    },
    onError: () => {
      toast({ title: "فشل في حذف قطعة الغيار", variant: "destructive" });
    },
  });

  const handleView = (part: any) => {
    setSelectedPart(part);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (part: any) => {
    setSelectedPart(part);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (part: any) => {
    setPartToDelete(part);
  };

  const confirmDelete = () => {
    if (partToDelete) {
      deleteSparePartMutation.mutate(partToDelete.id);
    }
  };

  return (
    <div className={t("pages.maintenance.name.space_y_6")}>
      {/* Header */}
      <div className={t("pages.maintenance.name.flex_justify_between_items_center")}>
        <h3 className={t("pages.maintenance.name.text_lg_font_semibold_text_gray_900")}>{t('pages.maintenance.إدارة_قطع_الغيار')}</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className={t("pages.maintenance.name.bg_blue_600_hover_bg_blue_700_text_white")}>
              <Plus className={t("pages.maintenance.name.h_4_w_4_ml_2")} />{t('pages.maintenance.إضافة_قطعة_غيار_جديدة')}</Button>
          </DialogTrigger>
          <DialogContent
            className={t("pages.maintenance.name.max_w_md")}
            aria-describedby="spare-part-dialog-description"
          >
            <DialogHeader>
              <DialogTitle>{t('pages.maintenance.إضافة_قطعة_غيار_جديدة')}</DialogTitle>
              <div
                id="spare-part-dialog-description"
                className={t("pages.maintenance.name.text_sm_text_gray_600")}
              >{t('pages.maintenance.أضف_قطعة_غيار_جديدة_إلى_المخزون')}</div>
            </DialogHeader>
            <SparePartForm
              onSubmit={createSparePartMutation.mutate}
              isLoading={createSparePartMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Spare Parts Table */}
      <Card>
        <CardContent className={t("pages.maintenance.name.p_0")}>
          {isLoading ? (
            <div className={t("pages.maintenance.name.p_8_text_center")}>
              <div className={t("pages.maintenance.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
              <p className={t("pages.maintenance.name.mt_2_text_gray_500")}>{t('pages.maintenance.جاري_التحميل...')}</p>
            </div>{t('pages.maintenance.)_:_(')}<div className={t("pages.maintenance.name.overflow_x_auto")}>
              <table className={t("pages.maintenance.name.min_w_full_divide_y_divide_gray_200")}>
                <thead className={t("pages.maintenance.name.bg_gray_50")}>
                  <tr>
                    <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.maintenance.رقم_القطعة')}</th>
                    <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.maintenance.اسم_الماكينة')}</th>
                    <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.maintenance.اسم_القطعة')}</th>
                    <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.maintenance.الكود')}</th>
                    <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.maintenance.الرقم_التسلسلي')}</th>
                    <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.maintenance.المواصفات')}</th>
                    <th className={t("pages.maintenance.name.px_6_py_3_text_center_text_xs_font_medium_text_gray_500_uppercase")}>{t('pages.maintenance.الإجراءات')}</th>
                  </tr>
                </thead>
                <tbody className={t("pages.maintenance.name.bg_white_divide_y_divide_gray_200")}>
                  {Array.isArray(spareParts) && spareParts.length > 0 ? (
                    spareParts.map((part: any) => (
                      <tr key={part.part_id} className={t("pages.maintenance.name.hover_bg_gray_50")}>
                        <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900_text_center")}>
                          {part.part_id}
                        </td>
                        <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                          {part.machine_name}
                        </td>
                        <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                          {part.part_name}
                        </td>
                        <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                          {part.code}
                        </td>
                        <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                          {part.serial_number}
                        </td>
                        <td className={t("pages.maintenance.name.px_6_py_4_text_sm_text_gray_500_max_w_xs_truncate_text_center")}>
                          {part.specifications}
                        </td>
                        <td className={t("pages.maintenance.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500_text_center")}>
                          <div className={t("pages.maintenance.name.flex_justify_center_gap_2")}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={t("pages.maintenance.name.h_8_w_8_p_0")}
                              onClick={() => handleView(part)}
                            >
                              <Eye className={t("pages.maintenance.name.h_4_w_4")} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={t("pages.maintenance.name.h_8_w_8_p_0")}
                              onClick={() => handleEdit(part)}
                            >
                              <Edit className={t("pages.maintenance.name.h_4_w_4")} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={t("pages.maintenance.name.h_8_w_8_p_0_text_red_600")}
                              onClick={() => handleDelete(part)}
                            >
                              <Trash2 className={t("pages.maintenance.name.h_4_w_4")} />
                            </Button>
                          </div>
                        </td>
                      </tr>{t('pages.maintenance.))_)_:_(')}<tr>
                      <td
                        colSpan={7}
                        className={t("pages.maintenance.name.px_6_py_4_text_center_text_gray_500")}
                      >{t('pages.maintenance.لا_توجد_قطع_غيار_مسجلة')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent
          className={t("pages.maintenance.name.max_w_md")}
          aria-describedby="view-spare-part-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>{t('pages.maintenance.تفاصيل_قطعة_الغيار')}</DialogTitle>
            <div
              id="view-spare-part-dialog-description"
              className={t("pages.maintenance.name.text_sm_text_gray_600")}
            >{t('pages.maintenance.عرض_تفاصيل_قطعة_الغيار_المحددة')}</div>
          </DialogHeader>
          {selectedPart && (
            <div className={t("pages.maintenance.name.space_y_4")}>
              <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                <div>
                  <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.رقم_القطعة')}</label>
                  <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1")}>
                    {selectedPart.part_id}
                  </p>
                </div>
                <div>
                  <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.الكود')}</label>
                  <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1")}>
                    {selectedPart.code}
                  </p>
                </div>
              </div>
              <div>
                <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.اسم_الماكينة')}</label>
                <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1")}>
                  {selectedPart.machine_name}
                </p>
              </div>
              <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
                <div>
                  <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.اسم_القطعة')}</label>
                  <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1")}>
                    {selectedPart.part_name}
                  </p>
                </div>
                <div>
                  <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.الرقم_التسلسلي')}</label>
                  <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1")}>
                    {selectedPart.serial_number}
                  </p>
                </div>
              </div>
              <div>
                <label className={t("pages.maintenance.name.text_sm_font_medium_text_gray_700")}>{t('pages.maintenance.المواصفات')}</label>
                <p className={t("pages.maintenance.name.text_sm_text_gray_900_mt_1")}>
                  {selectedPart.specifications}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className={t("pages.maintenance.name.max_w_md")}
          aria-describedby="edit-spare-part-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>{t('pages.maintenance.تعديل_قطعة_الغيار')}</DialogTitle>
            <div
              id="edit-spare-part-dialog-description"
              className={t("pages.maintenance.name.text_sm_text_gray_600")}
            >{t('pages.maintenance.تعديل_بيانات_قطعة_الغيار')}</div>
          </DialogHeader>
          {selectedPart && (
            <SparePartEditForm
              part={selectedPart}
              onSubmit={(data) =>
                updateSparePartMutation.mutate({ id: selectedPart.id, data })
              }
              isLoading={updateSparePartMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!partToDelete} onOpenChange={() => setPartToDelete(null)}>
        <DialogContent
          className={t("pages.maintenance.name.max_w_md")}
          aria-describedby="delete-spare-part-dialog-description"
        >
          <DialogHeader>
            <DialogTitle>{t('pages.maintenance.تأكيد_الحذف')}</DialogTitle>
            <div
              id="delete-spare-part-dialog-description"
              className={t("pages.maintenance.name.text_sm_text_gray_600")}
            >{t('pages.maintenance.هل_أنت_متأكد_من_حذف_قطعة_الغيار؟')}</div>
          </DialogHeader>
          {partToDelete && (
            <div className={t("pages.maintenance.name.space_y_4")}>
              <p className={t("pages.maintenance.name.text_sm_text_gray_700")}>{t('pages.maintenance.سيتم_حذف_قطعة_الغيار')}<strong>{partToDelete.part_id}</strong> -{" "}
                {partToDelete.part_name} نهائياً.
              </p>
              <div className={t("pages.maintenance.name.flex_justify_end_gap_2")}>
                <Button variant="outline" onClick={() => setPartToDelete(null)}>{t('pages.maintenance.إلغاء')}</Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteSparePartMutation.isPending}
                >
                  {deleteSparePartMutation.isPending ? "جاري الحذف..." : "حذف"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Spare Part Form Component
function SparePartForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const { data: spareParts } = useQuery({ queryKey: ["/api/spare-parts"] });
  const { data: machines } = useQuery({ queryKey: ["/api/machines"] });

  // Generate next part ID automatically
  const generateNextPartId = (currentSpareParts: any[]) => {
    if (!Array.isArray(currentSpareParts)) return "SP001";

    const partNumbers = currentSpareParts
      .map((part: any) => part.part_id)
      .filter((id: string) => id && id.match(/^SP\d+$/))
      .map((id: string) => parseInt(id.replace("SP", "")))
      .filter((num: number) => !isNaN(num));

    const nextNumber =
      partNumbers.length > 0 ? Math.max(...partNumbers) + 1 : 1;
    return `SP${nextNumber.toString().padStart(3, "0")}`;
  };

  const form = useForm({
    defaultValues: {
      part_id: "SP001",
      machine_name: "",
      part_name: "",
      code: "",
      serial_number: "",
      specifications: "",
    },
  });

  // Update part_id when spare parts data changes
  useEffect(() => {
    if (spareParts && Array.isArray(spareParts)) {
      const nextId = generateNextPartId(spareParts);
      if (nextId !== form.getValues("part_id")) {
        form.setValue("part_id", nextId);
      }
    }
  }, [spareParts, form]);

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={t("pages.maintenance.name.space_y_4")}>
        <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.part_id')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.رقم_القطعة_(تلقائي)')}</FormLabel>
                <FormControl>
                  <Input {...field} disabled className={t("pages.maintenance.name.bg_gray_100")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.code')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.الكود')}</FormLabel>
                <FormControl>
                  <Input placeholder="{t('pages.maintenance.placeholder.a8908')}" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="{t('pages.maintenance.name.machine_name')}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pages.maintenance.اسم_الماكينة')}</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_الماكينة')}" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(machines) && machines.length > 0 ? (
                      machines.map((machine: any) => (
                        <SelectItem
                          key={machine.id}
                          value={
                            machine.id ? `machine_${machine.id}` : "unknown"
                          }
                        >
                          {machine.name_ar || machine.name} ({machine.id})
                        </SelectItem>{t('pages.maintenance.))_)_:_(')}<SelectItem value="no_machines">{t('pages.maintenance.لا_توجد_ماكينات_متاحة')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.part_name')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.اسم_القطعة')}</FormLabel>
                <FormControl>
                  <Input placeholder="{t('pages.maintenance.placeholder.ماطور')}" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.serial_number')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.الرقم_التسلسلي')}</FormLabel>
                <FormControl>
                  <Input placeholder="{t('pages.maintenance.placeholder.e5sh973798')}" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="{t('pages.maintenance.name.specifications')}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pages.maintenance.المواصفات')}</FormLabel>
              <FormControl>
                <Textarea placeholder="{t('pages.maintenance.placeholder.قوة_380_فولت_و_10_امبير')}" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={t("pages.maintenance.name.flex_justify_end_gap_2_pt_4")}>
          <Button
            type="submit"
            disabled={isLoading}
            className={t("pages.maintenance.name.bg_blue_600_hover_bg_blue_700_text_white")}
          >
            {isLoading ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Spare Part Edit Form Component
function SparePartEditForm({
  part,
  onSubmit,
  isLoading,
}: {
  part: any;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const { data: machines } = useQuery({ queryKey: ["/api/machines"] });

  const form = useForm({
    defaultValues: {
      part_id: part.part_id || "",
      machine_name: part.machine_name || "",
      part_name: part.part_name || "",
      code: part.code || "",
      serial_number: part.serial_number || "",
      specifications: part.specifications || "",
    },
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={t("pages.maintenance.name.space_y_4")}>
        <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.part_id')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.رقم_القطعة')}</FormLabel>
                <FormControl>
                  <Input {...field} disabled className={t("pages.maintenance.name.bg_gray_100")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.code')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.الكود')}</FormLabel>
                <FormControl>
                  <Input placeholder="{t('pages.maintenance.placeholder.a8908')}" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="{t('pages.maintenance.name.machine_name')}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pages.maintenance.اسم_الماكينة')}</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="{t('pages.maintenance.placeholder.اختر_الماكينة')}" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(machines) && machines.length > 0 ? (
                      machines.map((machine: any) => (
                        <SelectItem
                          key={machine.id}
                          value={
                            machine.id ? `machine_${machine.id}` : "unknown"
                          }
                        >
                          {machine.name_ar || machine.name} ({machine.id})
                        </SelectItem>{t('pages.maintenance.))_)_:_(')}<SelectItem value="no_machines">{t('pages.maintenance.لا_توجد_ماكينات_متاحة')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={t("pages.maintenance.name.grid_grid_cols_2_gap_4")}>
          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.part_name')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.اسم_القطعة')}</FormLabel>
                <FormControl>
                  <Input placeholder="{t('pages.maintenance.placeholder.ماطور')}" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="{t('pages.maintenance.name.serial_number')}"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('pages.maintenance.الرقم_التسلسلي')}</FormLabel>
                <FormControl>
                  <Input placeholder="{t('pages.maintenance.placeholder.e5sh973798')}" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="{t('pages.maintenance.name.specifications')}"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('pages.maintenance.المواصفات')}</FormLabel>
              <FormControl>
                <Textarea placeholder="{t('pages.maintenance.placeholder.قوة_380_فولت_و_10_امبير')}" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className={t("pages.maintenance.name.flex_justify_end_gap_2_pt_4")}>
          <Button
            type="submit"
            disabled={isLoading}
            className={t("pages.maintenance.name.bg_blue_600_hover_bg_blue_700_text_white")}
          >
            {isLoading ? "جاري التحديث..." : "تحديث"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
