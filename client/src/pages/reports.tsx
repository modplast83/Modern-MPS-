import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  Printer,
  Share,
  RefreshCw,
  Users,
  Package,
  Cog,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState("production");
  const [loading, setLoading] = useState(false);

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: jobOrders } = useQuery({
    queryKey: ["/api/job-orders"],
  });

  const { data: qualityChecks } = useQuery({
    queryKey: ["/api/quality-checks"],
  });

  const { data: maintenanceRequests } = useQuery({
    queryKey: ["/api/maintenance-requests"],
  });

  const { data: attendance } = useQuery({
    queryKey: ["/api/attendance"],
  });

  const handleGenerateReport = async () => {
    setLoading(true);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const handleExportReport = (format: string) => {
    console.log(`Exporting report as ${format}`);
  };

  const productionSummary = {
    totalOrders: Array.isArray(orders) ? orders.length : 0,
    completedOrders: Array.isArray(orders) ? orders.filter(o => o.status === 'completed').length : 0,
    activeJobs: Array.isArray(jobOrders) ? jobOrders.filter(j => j.status === 'in_progress').length : 0,
    productionRate: (dashboardStats as any)?.productionRate || 0
  };

  const qualitySummary = {
    totalChecks: Array.isArray(qualityChecks) ? qualityChecks.length : 0,
    passedChecks: Array.isArray(qualityChecks) ? qualityChecks.filter(q => q.score >= 4).length : 0,
    averageScore: Array.isArray(qualityChecks) && qualityChecks.length > 0 
      ? (qualityChecks.reduce((sum, q) => sum + q.score, 0) / qualityChecks.length).toFixed(1) 
      : 0
  };

  const maintenanceSummary = {
    totalRequests: Array.isArray(maintenanceRequests) ? maintenanceRequests.length : 0,
    completedRequests: Array.isArray(maintenanceRequests) ? maintenanceRequests.filter(m => m.status === 'completed').length : 0,
    pendingRequests: Array.isArray(maintenanceRequests) ? maintenanceRequests.filter(m => m.status === 'pending').length : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">التقارير والإحصائيات</h1>
            <p className="text-gray-600">تقارير شاملة حول الإنتاج والجودة والصيانة</p>
          </div>

          {/* Report Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                إعدادات التقرير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">نوع التقرير</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">تقرير الإنتاج</SelectItem>
                      <SelectItem value="quality">تقرير الجودة</SelectItem>
                      <SelectItem value="maintenance">تقرير الصيانة</SelectItem>
                      <SelectItem value="hr">تقرير الموارد البشرية</SelectItem>
                      <SelectItem value="comprehensive">تقرير شامل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">من تاريخ</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">إلى تاريخ</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <Button onClick={handleGenerateReport} disabled={loading} className="flex-1">
                    {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                    إنشاء التقرير
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => handleExportReport('pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportReport('excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  طباعة
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  مشاركة
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="production">الإنتاج</TabsTrigger>
              <TabsTrigger value="quality">الجودة</TabsTrigger>
              <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
              <TabsTrigger value="hr">الموارد البشرية</TabsTrigger>
              <TabsTrigger value="comprehensive">شامل</TabsTrigger>
            </TabsList>

            <TabsContent value="production" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                        <p className="text-2xl font-bold text-gray-900">{productionSummary.totalOrders}</p>
                      </div>
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">الطلبات المكتملة</p>
                        <p className="text-2xl font-bold text-green-600">{productionSummary.completedOrders}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">الوظائف النشطة</p>
                        <p className="text-2xl font-bold text-orange-600">{productionSummary.activeJobs}</p>
                      </div>
                      <Clock className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">معدل الإنتاج</p>
                        <p className="text-2xl font-bold text-purple-600">{productionSummary.productionRate}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل الإنتاج</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الكمية</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(orders) && orders.length > 0 ? (
                          orders.slice(0, 10).map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order.order_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.customer_name || 'غير محدد'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.quantity?.toLocaleString() || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={
                                  order.status === 'completed' ? 'default' :
                                  order.status === 'in_progress' ? 'secondary' : 'outline'
                                }>
                                  {order.status === 'completed' ? 'مكتمل' :
                                   order.status === 'in_progress' ? 'قيد التنفيذ' :
                                   order.status === 'for_production' ? 'للإنتاج' : order.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString('ar-IQ')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              لا توجد بيانات متاحة
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">إجمالي الفحوصات</p>
                        <p className="text-2xl font-bold text-gray-900">{qualitySummary.totalChecks}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">الفحوصات الناجحة</p>
                        <p className="text-2xl font-bold text-green-600">{qualitySummary.passedChecks}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">متوسط النقاط</p>
                        <p className="text-2xl font-bold text-purple-600">{qualitySummary.averageScore}/5</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل فحوصات الجودة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الرولة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النقاط</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النتيجة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المفتش</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(qualityChecks) && qualityChecks.length > 0 ? (
                          qualityChecks.slice(0, 10).map((check) => (
                            <tr key={check.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                R-{check.roll_id?.toString().padStart(3, '0')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {check.score}/5
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={check.score >= 4 ? 'default' : check.score >= 3 ? 'secondary' : 'destructive'}>
                                  {check.score >= 4 ? 'ممتاز' : check.score >= 3 ? 'جيد' : 'ضعيف'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {check.inspector_name || 'غير محدد'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(check.checked_at).toLocaleDateString('ar-IQ')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                              لا توجد بيانات متاحة
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                        <p className="text-2xl font-bold text-gray-900">{maintenanceSummary.totalRequests}</p>
                      </div>
                      <Cog className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">مكتملة</p>
                        <p className="text-2xl font-bold text-green-600">{maintenanceSummary.completedRequests}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">معلقة</p>
                        <p className="text-2xl font-bold text-yellow-600">{maintenanceSummary.pendingRequests}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="hr" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">إجمالي الموظفين</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Array.isArray(attendance) ? Array.from(new Set(attendance.map(a => a.user_id))).length : 0}
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
                        <p className="text-sm font-medium text-gray-600">الحضور اليوم</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Array.isArray(attendance) ? attendance.filter(a => 
                            new Date(a.date).toDateString() === new Date().toDateString() && a.time_in
                          ).length : 0}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">الغياب</p>
                        <p className="text-2xl font-bold text-red-600">
                          {Array.isArray(attendance) ? attendance.filter(a => 
                            new Date(a.date).toDateString() === new Date().toDateString() && !a.time_in
                          ).length : 0}
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">معدل الحضور</p>
                        <p className="text-2xl font-bold text-purple-600">92%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="comprehensive" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>التقرير الشامل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{productionSummary.totalOrders}</p>
                      <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{qualitySummary.totalChecks}</p>
                      <p className="text-sm text-gray-600">فحوصات الجودة</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Cog className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">{maintenanceSummary.totalRequests}</p>
                      <p className="text-sm text-gray-600">طلبات الصيانة</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">92%</p>
                      <p className="text-sm text-gray-600">معدل الحضور</p>
                    </div>
                  </div>
                  
                  <div className="text-center py-8">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">التقرير الشامل يتضمن جميع البيانات من الأقسام المختلفة</p>
                    <Button className="mt-4" onClick={handleGenerateReport} disabled={loading}>
                      {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                      إنشاء التقرير الشامل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}