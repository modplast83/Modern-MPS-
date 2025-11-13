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
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
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
      return "موافق عليه";
    if (lowerStatus === "rejected" || status === "مرفوض") return "مرفوض";
    if (lowerStatus === "pending" || status === "معلق" || status === "قيد المراجعة")
      return "قيد المراجعة";
    return status;
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Clock className="w-4 h-4" />;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "approved" || status === "موافق عليه" || status === "موافق")
      return <CheckCircle className="w-4 h-4" />;
    if (lowerStatus === "rejected" || status === "مرفوض") return <XCircle className="w-4 h-4" />;
    if (
      lowerStatus === "pending" ||
      status === "معلق" ||
      status === "قيد المراجعة"
    )
      return <AlertCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
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
        return "عالية";
      case "medium":
      case "متوسطة":
      case "عادي":
      case "عادية":
        return "متوسطة";
      case "low":
      case "منخفضة":
        return "منخفضة";
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
    if (!Array.isArray(users) || users.length === 0) return `المستخدم ${userId}`;
    const user = users.find((u: any) => u.id === userId);
    return user ? user.display_name_ar || user.display_name || user.username : `المستخدم ${userId}`;
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            جاري تحميل طلبات المستخدمين...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            إدارة طلبات المستخدمين
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            مراجعة والموافقة على طلبات المستخدمين
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetchRequests()} variant="outline" className="text-sm">
            إعادة تحميل البيانات
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  إجمالي الطلبات
                </p>
                <p className="text-2xl font-bold text-blue-600">{Array.isArray(userRequests) ? userRequests.length : 0}</p>
              </div>
              <CalendarDays className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">قيد المراجعة</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">موافق عليها</p>
                <p className="text-2xl font-bold text-green-600">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">مرفوضة</p>
                <p className="text-2xl font-bold text-red-600">{rejectedRequests.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            قائمة طلبات المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">جاري تحميل الطلبات...</p>
            </div>
          ) : !Array.isArray(userRequests) || userRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات مسجلة</p>
              {requestsError && <p className="text-red-500 mt-2">خطأ في تحميل البيانات: {String(requestsError)}</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="text-right p-3 font-semibold">المستخدم</th>
                    <th className="text-right p-3 font-semibold">نوع الطلب</th>
                    <th className="text-right p-3 font-semibold">العنوان</th>
                    <th className="text-right p-3 font-semibold">الأولوية</th>
                    <th className="text-right p-3 font-semibold">الحالة</th>
                    <th className="text-right p-3 font-semibold">تاريخ الطلب</th>
                    <th className="text-center p-3 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(userRequests) &&
                    userRequests.map((request: any) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{getUserDisplayName(request.user_id)}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {request.type}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-sm font-medium">{request.title}</span>
                        </td>
                        <td className="p-3">
                          <Badge className={getPriorityColor(request.priority)}>
                            {getPriorityText(request.priority)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(request.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {getStatusText(request.status)}
                            </span>
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(request.created_at).toLocaleDateString("ar")}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              عرض
                            </Button>
                            {(request.status?.toLowerCase() === "pending" ||
                              request.status === "معلق" ||
                              request.status === "قيد المراجعة") && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproval(request, "approve")}>
                                  <Check className="w-4 h-4 mr-1" />
                                  موافقة
                                </Button>
                                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleApproval(request, "reject")}>
                                  <X className="w-4 h-4 mr-1" />
                                  رفض
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
            <DialogDescription>عرض تفاصيل طلب الإجازة وحالة المراجعة</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">المستخدم:</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getUserDisplayName(selectedRequest.user_id)}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">نوع الطلب:</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequest.type}</p>
                </div>
                <div>
                  <Label className="font-semibold">العنوان:</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequest.title}</p>
                </div>
                <div>
                  <Label className="font-semibold">الأولوية:</Label>
                  <Badge className={getPriorityColor(selectedRequest.priority)}>
                    {getPriorityText(selectedRequest.priority)}
                  </Badge>
                </div>
                {selectedRequest.start_date && (
                  <div>
                    <Label className="font-semibold">تاريخ البداية:</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(selectedRequest.start_date).toLocaleDateString("ar")}
                    </p>
                  </div>
                )}
                {selectedRequest.end_date && (
                  <div>
                    <Label className="font-semibold">تاريخ النهاية:</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(selectedRequest.end_date).toLocaleDateString("ar")}
                    </p>
                  </div>
                )}
                {selectedRequest.requested_amount && (
                  <div>
                    <Label className="font-semibold">المبلغ المطلوب:</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedRequest.requested_amount} ريال
                    </p>
                  </div>
                )}
                <div>
                  <Label className="font-semibold">الحالة:</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusText(selectedRequest.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="font-semibold">الوصف:</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.manager_comments && (
                <div>
                  <Label className="font-semibold">تعليقات المدير:</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "موافقة على الطلب" : "رفض الطلب"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? "تأكيد الموافقة على الطلب مع إمكانية إضافة تعليقات"
                : "رفض الطلب وإضافة تعليقات حول أسباب الرفض"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="comments">تعليقات (اختياري):</Label>
              <Textarea
                id="comments"
                placeholder="أضف تعليقات حول قرارك..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleSubmitApproval}
                disabled={updateRequestMutation.isPending}
                className={
                  approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }
              >
                {updateRequestMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري المعالجة...
                  </div>
                ) : approvalAction === "approve" ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    موافقة
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    رفض
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
