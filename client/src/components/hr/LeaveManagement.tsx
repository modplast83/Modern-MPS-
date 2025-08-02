import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  User,
  CalendarDays
} from "lucide-react";

interface LeaveType {
  id: number;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  max_days_per_year: number;
  requires_approval: boolean;
  can_be_carried_forward: boolean;
  advance_notice_days: number;
  is_active: boolean;
}

interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  manager_status: 'pending' | 'approved' | 'rejected';
  hr_status: 'pending' | 'approved' | 'rejected';
  final_status: 'pending' | 'approved' | 'rejected';
  manager_comments?: string;
  hr_comments?: string;
  created_at: string;
  updated_at?: string;
}

interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

export default function LeaveManagement() {
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

  const { data: leaveTypes = [], isLoading: typesLoading } = useQuery<LeaveType[]>({
    queryKey: ['/api/hr/leave-types'],
    initialData: []
  });

  const { data: leaveRequests = [], isLoading: requestsLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/hr/leave-requests'],
    initialData: []
  });

  const { data: pendingRequests = [], isLoading: pendingLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/hr/leave-requests/pending'],
    initialData: []
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'موافق عليه';
      case 'rejected': return 'مرفوض';
      case 'pending': return 'قيد المراجعة';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (typesLoading || requestsLoading || pendingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">جاري تحميل بيانات الإجازات...</p>
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
            نظام إدارة الإجازات
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            إدارة طلبات الإجازات وأرصدة الموظفين
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 ml-2" />
          طلب إجازة جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{leaveRequests.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">قيد المراجعة</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">موافق عليها</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {leaveRequests.filter(r => r.final_status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">أنواع الإجازات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {leaveTypes.filter(t => t.is_active).length}
                </p>
              </div>
              <CalendarDays className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            أنواع الإجازات المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map((type) => (
              <div key={type.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{type.name_ar || type.name}</h4>
                  <Badge variant={type.is_active ? "default" : "secondary"}>
                    {type.is_active ? "نشط" : "معطل"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {type.description_ar || type.description || "لا يوجد وصف"}
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>الحد الأقصى سنوياً:</span>
                    <span className="font-medium">{type.max_days_per_year} يوم</span>
                  </div>
                  <div className="flex justify-between">
                    <span>فترة الإشعار المسبق:</span>
                    <span className="font-medium">{type.advance_notice_days} يوم</span>
                  </div>
                  <div className="flex justify-between">
                    <span>يتطلب موافقة:</span>
                    <span className={type.requires_approval ? "text-orange-600" : "text-green-600"}>
                      {type.requires_approval ? "نعم" : "لا"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>قابل للترحيل:</span>
                    <span className={type.can_be_carried_forward ? "text-green-600" : "text-red-600"}>
                      {type.can_be_carried_forward ? "نعم" : "لا"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {leaveTypes.length === 0 && (
            <div className="text-center py-8">
              <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">لا توجد أنواع إجازات محددة</p>
              <Button variant="outline" className="mt-2">
                إضافة نوع إجازة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              طلبات تحتاج موافقة ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium">موظف رقم {request.employee_id}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(request.start_date).toLocaleDateString('ar-SA')} - 
                        {new Date(request.end_date).toLocaleDateString('ar-SA')} 
                        ({request.total_days} أيام)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                      موافقة
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
              {pendingRequests.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    عرض جميع الطلبات المعلقة ({pendingRequests.length - 5} أخرى)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {leaveRequests.map((request) => (
          <Card key={request.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg mb-1">
                    طلب إجازة رقم #{request.id}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>موظف رقم {request.employee_id}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(request.final_status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(request.final_status)}
                    {getStatusText(request.final_status)}
                  </div>
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">تاريخ البداية</p>
                  <p className="font-medium">{new Date(request.start_date).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">تاريخ النهاية</p>
                  <p className="font-medium">{new Date(request.end_date).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">إجمالي الأيام</span>
                <span className="font-bold text-lg">{request.total_days} يوم</span>
              </div>

              {request.reason && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">السبب</p>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {request.reason}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">موافقة المدير</p>
                  <Badge size="sm" className={getStatusColor(request.manager_status)}>
                    {getStatusText(request.manager_status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">موافقة الموارد البشرية</p>
                  <Badge size="sm" className={getStatusColor(request.hr_status)}>
                    {getStatusText(request.hr_status)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>تم التقديم: {new Date(request.created_at).toLocaleDateString('ar-SA')}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setSelectedRequest(request.id)}
                >
                  عرض التفاصيل
                </Button>
                {request.final_status === 'pending' && (
                  <Button size="sm" variant="outline" className="flex-1">
                    تحرير
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {leaveRequests.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد طلبات إجازات
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ابدأ بتقديم طلب إجازة جديد أو انتظر طلبات من الموظفين
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 ml-2" />
              طلب إجازة جديد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}