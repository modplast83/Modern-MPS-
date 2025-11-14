import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  CalendarDays,
  Eye,
  Check,
  X,
} from "lucide-react";

interface UserRequest {
  id: number;
  user_id: number;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date?: string;
  end_date?: string;
  requested_amount?: number;
  manager_comments?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: number;
    username: string;
    display_name?: string;
    display_name_ar?: string;
  };
}

export default function LeaveManagement() {
  const { t } = useTranslation();
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>{t('components.hr.LeaveManagement.(_null_);_const_[isviewdialogopen,_setisviewdialogopen]_=_usestate(false);_const_[isapprovaldialogopen,_setisapprovaldialogopen]_=_usestate(false);_const_[approvalcomments,_setapprovalcomments]_=_usestate("");_const_[approvalaction,_setapprovalaction]_=_usestate')}<"approve" | "reject">(
    "approve"
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: userRequests = [],
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
    isFetching,
  } = useQuery<UserRequest[]>({
    queryKey: ["/api/user-requests"],
    initialData: [],
    refetchOnWindowFocus: false,
    staleTime: 0,
    retry: 3,
    enabled: true,
    onError: (err: any) => {
      toast({
        title: t('common.error'),
        description:
          err instanceof Error ? err.message : t('hr.failedToLoadRequests', 'فشل في تحميل طلبات المستخدمين'),
        variant: "destructive",
      });
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    initialData: [],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      comments,
    }: {
      id: number;
      status: string;
      comments: string;
    }) => {
      return await apiRequest(`/api/user-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          manager_comments: comments,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-requests"] });
      setIsApprovalDialogOpen(false);
      setApprovalComments("");
      setSelectedRequest(null);
      toast({
        title: t('hr.requestUpdated', 'تم تحديث الطلب بنجاح'),
        description: t('hr.approvalSaved', 'تم حفظ قرار الموافقة/الرفض'),
      });
    },
    onError: () => {
      toast({
        title: t('hr.updateRequestError', 'خطأ في تحديث الطلب'),
        description: t('hr.updateRequestErrorDesc', 'حدث خطأ أثناء تحديث حالة الطلب'),
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    if (!status)
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "approved" || status === "موافق عليه" || status === "موافق") {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
    if (lowerStatus === "rejected" || status === "مرفوض") {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
    if (lowerStatus === "pending" || status === "معلق" || status === "قيد المراجعة") {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  };

  const getStatusText = (status: string) => {
    if (!status) return status;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "approved" || status === "موافق عليه" || status === "موافق")
      return t('hr.approved');
    if (lowerStatus === "rejected" || status === "مرفوض") return t('hr.rejected');
    if (lowerStatus === "pending" || status === "معلق" || status === "قيد المراجعة")
      return t('status.pending');
    return status;
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Clock className={t("components.hr.leavemanagement.name.w_4_h_4")} />{t('components.hr.LeaveManagement.;_const_lowerstatus_=_status.tolowercase();_if_(lowerstatus_===_"approved"_||_status_===_"موافق_عليه"_||_status_===_"موافق")_return')}<CheckCircle className={t("components.hr.leavemanagement.name.w_4_h_4")} />{t('components.hr.LeaveManagement.;_if_(lowerstatus_===_"rejected"_||_status_===_"مرفوض")_return')}<XCircle className={t("components.hr.leavemanagement.name.w_4_h_4")} />{t('components.hr.LeaveManagement.;_if_(_lowerstatus_===_"pending"_||_status_===_"معلق"_||_status_===_"قيد_المراجعة"_)_return')}<AlertCircle className={t("components.hr.leavemanagement.name.w_4_h_4")} />{t('components.hr.LeaveManagement.;_return')}<Clock className={t("components.hr.leavemanagement.name.w_4_h_4")} />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "عالية":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
      case "متوسطة":
      case "عادي":
      case "عادية":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
      case "منخفضة":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "عالية":
        return t('production.high');
      case "medium":
      case "متوسطة":
      case "عادي":
      case "عادية":
        return t('production.medium');
      case "low":
      case "منخفضة":
        return t('production.low');
      default:
        return priority;
    }
  };

  const handleApproval = (
    request: UserRequest,
    action: "approve" | "reject"
  ) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  const handleSubmitApproval = () => {
    if (!selectedRequest) return;

    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: approvalAction,
      comments: approvalComments,
    });
  };

  const getUserDisplayName = (userId: number) => {
    if (!Array.isArray(users) || users.length === 0) return `${t('common.user')} ${userId}`;
    const user = users.find((u: any) => u.id === userId);
    return user ? user.display_name_ar || user.display_name || user.username : `${t('common.user')} ${userId}`;
  };

  // memoize the request groups
  const pendingRequests = useMemo(
    () =>
      Array.isArray(userRequests)
        ? userRequests.filter((req: any) => {
            const status = String(req.status || "").toLowerCase();
            return status === "pending" || req.status === "معلق" || req.status === "قيد المراجعة";
          })
        : [],
    [userRequests]
  );

  const approvedRequests = useMemo(
    () =>
      Array.isArray(userRequests)
        ? userRequests.filter((req: any) => {
            const status = String(req.status || "").toLowerCase();
            return status === "approved" || req.status === "موافق عليه" || req.status === "موافق";
          })
        : [],
    [userRequests]
  );

  const rejectedRequests = useMemo(
    () =>
      Array.isArray(userRequests)
        ? userRequests.filter((req: any) => {
            const status = String(req.status || "").toLowerCase();
            return status === "rejected" || req.status === "مرفوض";
          })
        : [],
    [userRequests]
  );

  if (requestsLoading || usersLoading) {
    return (
      <div className={t("components.hr.leavemanagement.name.flex_items_center_justify_center_h_64")}>
        <div className={t("components.hr.leavemanagement.name.text_center")}>
          <div className={t("components.hr.leavemanagement.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
          <p className={t("components.hr.leavemanagement.name.text_gray_600_dark_text_gray_400_mt_2")}>
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={t("components.hr.leavemanagement.name.space_y_6")}>
      {/* Header */}
      <div className={t("components.hr.leavemanagement.name.flex_justify_between_items_center")}>
        <div>
          <h2 className={t("components.hr.leavemanagement.name.text_2xl_font_bold_text_gray_900_dark_text_white")}>
            {t('hr.leaves')}
          </h2>
          <p className={t("components.hr.leavemanagement.name.text_gray_600_dark_text_gray_300")}>
            {t('hr.approveLeave')}
          </p>
        </div>
        <div className={t("components.hr.leavemanagement.name.flex_gap_2")}>
          <Button onClick={() => refetchRequests()} variant="outline" className={t("components.hr.leavemanagement.name.text_sm")} data-testid="button-refresh-requests">
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={t("components.hr.leavemanagement.name.grid_grid_cols_1_md_grid_cols_4_gap_4")}>
        <Card>
          <CardContent className={t("components.hr.leavemanagement.name.p_4")}>
            <div className={t("components.hr.leavemanagement.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.leavemanagement.name.text_sm_font_medium_text_gray_600_dark_text_gray_400")}>
                  {t('common.total')}
                </p>
                <p className={t("components.hr.leavemanagement.name.text_2xl_font_bold_text_blue_600")} data-testid="text-total-requests">{Array.isArray(userRequests) ? userRequests.length : 0}</p>
              </div>
              <CalendarDays className={t("components.hr.leavemanagement.name.w_8_h_8_text_blue_500")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.leavemanagement.name.p_4")}>
            <div className={t("components.hr.leavemanagement.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.leavemanagement.name.text_sm_font_medium_text_gray_600_dark_text_gray_400")}>{t('status.pending')}</p>
                <p className={t("components.hr.leavemanagement.name.text_2xl_font_bold_text_yellow_600")} data-testid="text-pending-requests">{pendingRequests.length}</p>
              </div>
              <Clock className={t("components.hr.leavemanagement.name.w_8_h_8_text_yellow_500")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.leavemanagement.name.p_4")}>
            <div className={t("components.hr.leavemanagement.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.leavemanagement.name.text_sm_font_medium_text_gray_600_dark_text_gray_400")}>{t('hr.approved')}</p>
                <p className={t("components.hr.leavemanagement.name.text_2xl_font_bold_text_green_600")} data-testid="text-approved-requests">{approvedRequests.length}</p>
              </div>
              <CheckCircle className={t("components.hr.leavemanagement.name.w_8_h_8_text_green_500")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={t("components.hr.leavemanagement.name.p_4")}>
            <div className={t("components.hr.leavemanagement.name.flex_items_center_justify_between")}>
              <div>
                <p className={t("components.hr.leavemanagement.name.text_sm_font_medium_text_gray_600_dark_text_gray_400")}>{t('hr.rejected')}</p>
                <p className={t("components.hr.leavemanagement.name.text_2xl_font_bold_text_red_600")} data-testid="text-rejected-requests">{rejectedRequests.length}</p>
              </div>
              <XCircle className={t("components.hr.leavemanagement.name.w_8_h_8_text_red_500")} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className={t("components.hr.leavemanagement.name.flex_items_center_gap_2")}>
            <Calendar className={t("components.hr.leavemanagement.name.w_5_h_5")} />
            {t('hr.leaves')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className={t("components.hr.leavemanagement.name.text_center_py_8")}>
              <div className={t("components.hr.leavemanagement.name.animate_spin_rounded_full_h_8_w_8_border_b_2_border_blue_600_mx_auto")}></div>
              <p className={t("components.hr.leavemanagement.name.text_gray_600_dark_text_gray_400_mt_2")}>{t('common.loading')}</p>
            </div>{t('components.hr.LeaveManagement.)_:_!array.isarray(userrequests)_||_userrequests.length_===_0_?_(')}<div className={t("components.hr.leavemanagement.name.text_center_py_8_text_gray_500_dark_text_gray_400")}>
              <Calendar className={t("components.hr.leavemanagement.name.w_12_h_12_mx_auto_mb_4_opacity_50")} />
              <p>{t('common.noData')}</p>
              {requestsError && <p className={t("components.hr.leavemanagement.name.text_red_500_mt_2")}>{t('common.error')}: {String(requestsError)}</p>}
            </div>{t('components.hr.LeaveManagement.)_:_(')}<div className={t("components.hr.leavemanagement.name.overflow_x_auto")}>
              <table className={t("components.hr.leavemanagement.name.w_full_border_collapse")}>
                <thead>
                  <tr className={t("components.hr.leavemanagement.name.border_b_bg_gray_50_dark_bg_gray_800")}>
                    <th className={t("components.hr.leavemanagement.name.text_right_p_3_font_semibold")}>{t('common.user')}</th>
                    <th className={t("components.hr.leavemanagement.name.text_right_p_3_font_semibold")}>{t('common.type')}</th>
                    <th className={t("components.hr.leavemanagement.name.text_right_p_3_font_semibold")}>{t('forms.title')}</th>
                    <th className={t("components.hr.leavemanagement.name.text_right_p_3_font_semibold")}>{t('quickNotes.priority')}</th>
                    <th className={t("components.hr.leavemanagement.name.text_right_p_3_font_semibold")}>{t('common.status')}</th>
                    <th className={t("components.hr.leavemanagement.name.text_right_p_3_font_semibold")}>{t('common.date')}</th>
                    <th className={t("components.hr.leavemanagement.name.text_center_p_3_font_semibold")}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(userRequests) &&
                    userRequests.map((request: any) => (
                      <tr key={request.id} className={t("components.hr.leavemanagement.name.border_b_hover_bg_gray_50_dark_hover_bg_gray_800")}>
                        <td className={t("components.hr.leavemanagement.name.p_3")}>
                          <div className={t("components.hr.leavemanagement.name.flex_items_center_gap_2")}>
                            <User className={t("components.hr.leavemanagement.name.w_4_h_4_text_gray_400")} />
                            <span className={t("components.hr.leavemanagement.name.font_medium")}>{getUserDisplayName(request.user_id)}</span>
                          </div>
                        </td>
                        <td className={t("components.hr.leavemanagement.name.p_3")}>
                          <Badge variant="outline" className={t("components.hr.leavemanagement.name.bg_blue_50_text_blue_700_dark_bg_blue_900_dark_text_blue_300")}>
                            {request.type}
                          </Badge>
                        </td>
                        <td className={t("components.hr.leavemanagement.name.p_3")}>
                          <span className={t("components.hr.leavemanagement.name.text_sm_font_medium")}>{request.title}</span>
                        </td>
                        <td className={t("components.hr.leavemanagement.name.p_3")}>
                          <Badge className={getPriorityColor(request.priority)}>
                            {getPriorityText(request.priority)}
                          </Badge>
                        </td>
                        <td className={t("components.hr.leavemanagement.name.p_3")}>
                          <Badge className={getStatusColor(request.status)}>
                            <span className={t("components.hr.leavemanagement.name.flex_items_center_gap_1")}>
                              {getStatusIcon(request.status)}
                              {getStatusText(request.status)}
                            </span>
                          </Badge>
                        </td>
                        <td className={t("components.hr.leavemanagement.name.p_3_text_sm_text_gray_600_dark_text_gray_400")}>
                          {new Date(request.created_at).toLocaleDateString("ar")}
                        </td>
                        <td className={t("components.hr.leavemanagement.name.p_3")}>
                          <div className={t("components.hr.leavemanagement.name.flex_justify_center_gap_2")}>
                            <Button
                              size="sm"
                              variant="outline"
                              className={t("components.hr.leavemanagement.name.bg_blue_50_text_blue_600_hover_bg_blue_100_dark_bg_blue_900_dark_text_blue_300")}
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsViewDialogOpen(true);
                              }}
                              data-testid="button-view-request"
                            >
                              <Eye className={t("components.hr.leavemanagement.name.w_4_h_4_mr_1")} />
                              {t('common.view')}
                            </Button>
                            {(request.status?.toLowerCase() === "pending" ||
                              request.status === "معلق" ||
                              request.status === "قيد المراجعة") && (
                              <>
                                <Button size="sm" className={t("components.hr.leavemanagement.name.bg_green_600_hover_bg_green_700_text_white")} onClick={() => handleApproval(request, "approve")} data-testid="button-approve-request">
                                  <Check className={t("components.hr.leavemanagement.name.w_4_h_4_mr_1")} />
                                  {t('hr.approveLeave')}
                                </Button>
                                <Button size="sm" className={t("components.hr.leavemanagement.name.bg_red_600_hover_bg_red_700_text_white")} onClick={() => handleApproval(request, "reject")} data-testid="button-reject-request">
                                  <X className={t("components.hr.leavemanagement.name.w_4_h_4_mr_1")} />
                                  {t('hr.rejectLeave')}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className={t("components.hr.leavemanagement.name.max_w_2xl")}>
          <DialogHeader>
            <DialogTitle>{t('common.details')}</DialogTitle>
            <DialogDescription>{t('hr.requestLeave')}</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className={t("components.hr.leavemanagement.name.space_y_4")}>
              <div className={t("components.hr.leavemanagement.name.grid_grid_cols_2_gap_4")}>
                <div>
                  <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('common.user')}:</Label>
                  <p className={t("components.hr.leavemanagement.name.text_sm_text_gray_600_dark_text_gray_400")}>
                    {getUserDisplayName(selectedRequest.user_id)}
                  </p>
                </div>
                <div>
                  <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('common.type')}:</Label>
                  <p className={t("components.hr.leavemanagement.name.text_sm_text_gray_600_dark_text_gray_400")}>{selectedRequest.type}</p>
                </div>
                <div>
                  <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('forms.title')}:</Label>
                  <p className={t("components.hr.leavemanagement.name.text_sm_text_gray_600_dark_text_gray_400")}>{selectedRequest.title}</p>
                </div>
                <div>
                  <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('quickNotes.priority')}:</Label>
                  <Badge className={getPriorityColor(selectedRequest.priority)}>
                    {getPriorityText(selectedRequest.priority)}
                  </Badge>
                </div>
                {selectedRequest.start_date && (
                  <div>
                    <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('common.from')}:</Label>
                    <p className={t("components.hr.leavemanagement.name.text_sm_text_gray_600_dark_text_gray_400")}>
                      {new Date(selectedRequest.start_date).toLocaleDateString("ar")}
                    </p>
                  </div>
                )}
                {selectedRequest.end_date && (
                  <div>
                    <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('common.to')}:</Label>
                    <p className={t("components.hr.leavemanagement.name.text_sm_text_gray_600_dark_text_gray_400")}>
                      {new Date(selectedRequest.end_date).toLocaleDateString("ar")}
                    </p>
                  </div>
                )}
                {selectedRequest.requested_amount && (
                  <div>
                    <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('forms.amount')}:</Label>
                    <p className={t("components.hr.leavemanagement.name.text_sm_text_gray_600_dark_text_gray_400")}>
                      {selectedRequest.requested_amount}
                    </p>
                  </div>
                )}
                <div>
                  <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('common.status')}:</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusText(selectedRequest.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('common.description')}:</Label>
                <p className={t("components.hr.leavemanagement.name.text_sm_text_gray_600_dark_text_gray_400_mt_1_p_3_bg_gray_50_dark_bg_gray_800_rounded_lg")}>
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.manager_comments && (
                <div>
                  <Label className={t("components.hr.leavemanagement.name.font_semibold")}>{t('common.notes')}:</Label>
                  <p className={t("components.hr.leavemanagement.name.text_sm_text_gray_600_dark_text_gray_400_mt_1_p_3_bg_gray_50_dark_bg_gray_800_rounded_lg")}>
                    {selectedRequest.manager_comments}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className={t("components.hr.leavemanagement.name.max_w_md")}>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? t('hr.approveLeave') : t('hr.rejectLeave')}
            </DialogTitle>
            <DialogDescription>
              {t('common.notes')}
            </DialogDescription>
          </DialogHeader>

          <div className={t("components.hr.leavemanagement.name.space_y_4")}>
            <div>
              <Label htmlFor="comments">{t('common.notes')} ({t('common.optional')}):</Label>
              <Textarea
                id="comments"
                placeholder={t('common.notes')}
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className={t("components.hr.leavemanagement.name.mt_1")}
                data-testid="textarea-approval-comments"
              />
            </div>
            <div className={t("components.hr.leavemanagement.name.flex_justify_end_gap_2")}>
              <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)} data-testid="button-cancel-approval">
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSubmitApproval}
                disabled={updateRequestMutation.isPending}
                className={
                  approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }
                data-testid="button-submit-approval"
              >
                {updateRequestMutation.isPending ? (
                  <div className={t("components.hr.leavemanagement.name.flex_items_center_gap_2")}>
                    <div className={t("components.hr.leavemanagement.name.animate_spin_rounded_full_h_4_w_4_border_b_2_border_white")}></div>
                    {t('common.loading')}
                  </div>{t('components.hr.LeaveManagement.)_:_approvalaction_===_"approve"_?_(')}<>
                    <Check className={t("components.hr.leavemanagement.name.w_4_h_4_mr_1")} />
                    {t('hr.approveLeave')}
                  </>{t('components.hr.LeaveManagement.)_:_(')}<>
                    <X className={t("components.hr.leavemanagement.name.w_4_h_4_mr_1")} />
                    {t('hr.rejectLeave')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
