import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock, Calendar } from "lucide-react";

export default function HR() {
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'early_leave':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'حاضر';
      case 'absent':
        return 'غائب';
      case 'late':
        return 'متأخر';
      case 'early_leave':
        return 'انصراف مبكر';
      default:
        return status;
    }
  };

  const todayAttendance = Array.isArray(attendance) ? attendance.filter((a: any) => {
    const today = new Date().toDateString();
    const attendanceDate = new Date(a.date).toDateString();
    return today === attendanceDate;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">إدارة الموارد البشرية</h1>
            <p className="text-gray-600">متابعة الموظفين والحضور والغياب</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي الموظفين</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Array.isArray(users) ? users.length : 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">حاضر اليوم</p>
                    <p className="text-2xl font-bold text-green-600">
                      {todayAttendance.filter((a: any) => a.status === 'present').length}
                    </p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">غائب اليوم</p>
                    <p className="text-2xl font-bold text-red-600">
                      {todayAttendance.filter((a: any) => a.status === 'absent').length}
                    </p>
                  </div>
                  <UserX className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">متأخر اليوم</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {todayAttendance.filter((a: any) => a.status === 'late').length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>الموظفين النشطين</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(users) ? users.filter((user: any) => user.status === 'active').map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{user.display_name_ar}</p>
                          <p className="text-sm text-gray-500">{user.username}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.role_id === 1 ? 'مدير' :
                           user.role_id === 2 ? 'مشرف' :
                           user.role_id === 3 ? 'مشغل' :
                           user.role_id === 4 ? 'مفتش جودة' : 'موظف'}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-gray-500 py-4">
                        لا توجد بيانات متاحة
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سجل الحضور اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayAttendance.map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{record.user_name}</p>
                          <p className="text-sm text-gray-500">
                            وصل: {record.check_in_time ? new Date(`2000-01-01T${record.check_in_time}`).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            {record.check_out_time && (
                              <span className="mr-4">
                                انصرف: {new Date(`2000-01-01T${record.check_out_time}`).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </p>
                        </div>
                        <Badge className={getAttendanceStatusColor(record.status)}>
                          {getAttendanceStatusText(record.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}