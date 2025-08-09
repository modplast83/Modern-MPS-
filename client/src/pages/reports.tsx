import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber, formatPercentage, formatNumberWithCommas } from '@/lib/formatNumber';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  Filter,
  Calendar as CalendarIcon,
  FileText,
  Users,
  Settings,
  Package,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Reports() {
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({});
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [reportType, setReportType] = useState("production");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/reports", { type: reportType, period: selectedPeriod }],
  });

  const reportTypes = [
    { value: "production", label: "تقارير الإنتاج", icon: <Package className="w-4 h-4" /> },
    { value: "quality", label: "تقارير الجودة", icon: <CheckCircle2 className="w-4 h-4" /> },
    { value: "maintenance", label: "تقارير الصيانة", icon: <Settings className="w-4 h-4" /> },
    { value: "hr", label: "تقارير الموارد البشرية", icon: <Users className="w-4 h-4" /> },
    { value: "financial", label: "التقارير المالية", icon: <BarChart3 className="w-4 h-4" /> }
  ];

  const exportReport = (format: string) => {
    // Implement export functionality
    console.log(`Exporting report as ${format}`);
  };

  const productionData = {
    totalProduction: 15420,
    efficiency: 87,
    completedOrders: 34,
    defectRate: 2.1,
    machineUtilization: 91
  };

  const qualityData = {
    passRate: 97.9,
    totalChecks: 1250,
    defectsFound: 26,
    topDefects: [
      { type: "تشوه في الشكل", count: 12 },
      { type: "سماكة غير متجانسة", count: 8 },
      { type: "لون غير مطابق", count: 6 }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">التقارير والتحليلات</h1>
            <p className="text-gray-600">تقارير شاملة حول الأداء والإنتاجية</p>
          </div>

          {/* Report Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                خيارات التقرير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">نوع التقرير</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.icon}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">الفترة الزمنية</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">هذا الأسبوع</SelectItem>
                      <SelectItem value="month">هذا الشهر</SelectItem>
                      <SelectItem value="quarter">هذا الربع</SelectItem>
                      <SelectItem value="year">هذا العام</SelectItem>
                      <SelectItem value="custom">فترة مخصصة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">من تاريخ</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP", { locale: ar }) : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-end gap-2">
                  <Button onClick={() => exportReport('pdf')} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    تصدير PDF
                  </Button>
                  <Button variant="outline" onClick={() => exportReport('excel')}>
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <Tabs value={reportType} onValueChange={setReportType}>
            <TabsList className="grid w-full grid-cols-5">
              {reportTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value} className="text-xs">
                  <div className="flex items-center gap-1">
                    {type.icon}
                    <span className="hidden sm:inline">{type.label.split(' ')[1]}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Production Reports */}
            <TabsContent value="production">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">إجمالي الإنتاج</p>
                        <p className="text-2xl font-bold text-blue-600">{formatNumberWithCommas(productionData.totalProduction)}</p>
                        <p className="text-xs text-gray-500">قطعة</p>
                      </div>
                      <Package className="w-8 h-8 text-blue-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">الكفاءة</p>
                        <p className="text-2xl font-bold text-green-600">{formatPercentage(productionData.efficiency)}</p>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +3% من الشهر الماضي
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-green-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">الطلبات المكتملة</p>
                        <p className="text-2xl font-bold text-purple-600">{formatNumber(productionData.completedOrders)}</p>
                        <p className="text-xs text-gray-500">طلب</p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-purple-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">معدل العيوب</p>
                        <p className="text-2xl font-bold text-red-600">{formatPercentage(productionData.defectRate)}</p>
                        <p className="text-xs text-red-500">يحتاج تحسين</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>أداء المكائن</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['ماكينة البثق الأولى', 'ماكينة البثق الثانية', 'ماكينة الطباعة', 'ماكينة القطع'].map((machine, index) => (
                        <div key={machine} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{machine}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${85 + index * 3}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{formatPercentage(85 + index * 3)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>الإنتاج اليومي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day, index) => (
                        <div key={day} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{day}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 6 ? 'secondary' : 'default'}>
                              {index === 6 ? 'عطلة' : `${formatNumber(2000 + index * 200)} قطعة`}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Quality Reports */}
            <TabsContent value="quality">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">معدل النجاح</p>
                        <p className="text-2xl font-bold text-green-600">{formatPercentage(qualityData.passRate)}</p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-green-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">إجمالي الفحوصات</p>
                        <p className="text-2xl font-bold text-blue-600">{formatNumber(qualityData.totalChecks)}</p>
                      </div>
                      <PieChart className="w-8 h-8 text-blue-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">العيوب المكتشفة</p>
                        <p className="text-2xl font-bold text-red-600">{formatNumber(qualityData.defectsFound)}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500 opacity-60" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>أكثر العيوب شيوعاً</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {qualityData.topDefects.map((defect, index) => (
                      <div key={defect.type} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{defect.type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${(defect.count / qualityData.defectsFound) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{formatNumber(defect.count)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other report types placeholders */}
            <TabsContent value="maintenance">
              <Card>
                <CardContent className="p-8 text-center">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">تقارير الصيانة قيد التطوير</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hr">
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">تقارير الموارد البشرية قيد التطوير</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial">
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">التقارير المالية قيد التطوير</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}