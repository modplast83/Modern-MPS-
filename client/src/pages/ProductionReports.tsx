import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  FileDown,
  Search,
  RotateCcw,
  TrendingUp,
  Package,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
import { useToast } from "../hooks/use-toast";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ProductionReports() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    dateFrom: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    dateTo: format(new Date(), "yyyy-MM-dd"),
    customerId: [] as number[],
    productId: [] as number[],
    status: [] as string[],
    sectionId: "",
    machineId: "",
    operatorId: "",
  });

  const [activeFilters, setActiveFilters] = useState(filters);

  // Fetch data using React Query
  const { data: summary, isLoading: summaryLoading } = useQuery<any>({
    queryKey: ["/api/reports/production-summary", activeFilters],
    enabled: !!activeFilters.dateFrom && !!activeFilters.dateTo,
  });

  const { data: productionByDate, isLoading: dateLoading } = useQuery<any>({
    queryKey: ["/api/reports/production-by-date", activeFilters],
    enabled: !!activeFilters.dateFrom && !!activeFilters.dateTo,
  });

  const { data: productionByProduct, isLoading: productLoading } = useQuery<any>({
    queryKey: ["/api/reports/production-by-product", activeFilters],
    enabled: !!activeFilters.dateFrom && !!activeFilters.dateTo,
  });

  const { data: wasteAnalysis, isLoading: wasteLoading } = useQuery<any>({
    queryKey: ["/api/reports/waste-analysis", activeFilters],
    enabled: !!activeFilters.dateFrom && !!activeFilters.dateTo,
  });

  const { data: machinePerformance, isLoading: machineLoading } = useQuery<any>({
    queryKey: ["/api/reports/machine-performance", activeFilters],
    enabled: !!activeFilters.dateFrom && !!activeFilters.dateTo,
  });

  const { data: operatorPerformance, isLoading: operatorLoading } = useQuery<any>({
    queryKey: ["/api/reports/operator-performance", activeFilters],
    enabled: !!activeFilters.dateFrom && !!activeFilters.dateTo,
  });

  // Fetch filter options
  const { data: customers } = useQuery<any>({ queryKey: ["/api/customers"] });
  const { data: products } = useQuery<any>({ queryKey: ["/api/customer-products"] });
  const { data: machines } = useQuery<any>({ queryKey: ["/api/machines"] });
  const { data: users } = useQuery<any>({ queryKey: ["/api/users"] });
  const { data: sections } = useQuery<any>({ queryKey: ["/api/sections"] });

  const handleSearch = () => {
    setActiveFilters(filters);
  };

  const handleReset = () => {
    const defaultFilters = {
      dateFrom: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      dateTo: format(new Date(), "yyyy-MM-dd"),
      customerId: [] as number[],
      productId: [] as number[],
      status: [] as string[],
      sectionId: "",
      machineId: "",
      operatorId: "",
    };
    setFilters(defaultFilters);
    setActiveFilters(defaultFilters);
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      if (summary?.data) {
        const summaryData = [
          ["إجمالي الطلبات", summary.data.totalOrders],
          ["أوامر نشطة", summary.data.activeOrders],
          ["أوامر مكتملة", summary.data.completedOrders],
          ["الرولات المنتجة", summary.data.totalRolls],
          ["الوزن الكلي (كجم)", summary.data.totalWeight],
          ["متوسط وقت الإنتاج (ساعة)", summary.data.avgProductionTime?.toFixed(2)],
          ["نسبة الهدر %", summary.data.wastePercentage?.toFixed(2)],
          ["معدل الإنجاز %", summary.data.completionRate?.toFixed(2)],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "الملخص");
      }

      // Production by date sheet
      if (productionByDate?.data) {
        const dateSheet = XLSX.utils.json_to_sheet(productionByDate.data);
        XLSX.utils.book_append_sheet(workbook, dateSheet, "الإنتاج اليومي");
      }

      // Production by product sheet
      if (productionByProduct?.data) {
        const productSheet = XLSX.utils.json_to_sheet(productionByProduct.data);
        XLSX.utils.book_append_sheet(workbook, productSheet, "الإنتاج حسب المنتج");
      }

      // Machine performance sheet
      if (machinePerformance?.data) {
        const machineSheet = XLSX.utils.json_to_sheet(machinePerformance.data);
        XLSX.utils.book_append_sheet(workbook, machineSheet, "أداء المكائن");
      }

      // Operator performance sheet
      if (operatorPerformance?.data) {
        const operatorSheet = XLSX.utils.json_to_sheet(operatorPerformance.data);
        XLSX.utils.book_append_sheet(workbook, operatorSheet, "أداء العمال");
      }

      XLSX.writeFile(workbook, `تقرير_الإنتاج_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير التقرير إلى ملف Excel",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير التقرير",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  const getStatusColor = (value: number, metric: string) => {
    if (metric === "waste") {
      if (value < 3) return "text-green-600 bg-green-50";
      if (value < 5) return "text-yellow-600 bg-yellow-50";
      return "text-red-600 bg-red-50";
    }
    if (value >= 90) return "text-green-600 bg-green-50";
    if (value >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">تقارير الإنتاج الشاملة</h1>
          <p className="text-muted-foreground">تحليل شامل لأداء الإنتاج مع رسوم بيانية تفاعلية</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline" data-testid="button-export-excel">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            تصدير Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" data-testid="button-export-pdf">
            <FileText className="mr-2 h-4 w-4" />
            طباعة PDF
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>فلاتر التقرير</CardTitle>
          <CardDescription>اختر المعايير لتخصيص التقرير</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">من تاريخ</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                data-testid="input-date-from"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">إلى تاريخ</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                data-testid="input-date-to"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">القسم</Label>
              <Select
                value={filters.sectionId || "all"}
                onValueChange={(value) => setFilters({ ...filters, sectionId: value === "all" ? "" : value })}
              >
                <SelectTrigger data-testid="select-section">
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأقسام</SelectItem>
                  {sections?.map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name_ar || section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machine">الماكينة</Label>
              <Select
                value={filters.machineId || "all"}
                onValueChange={(value) => setFilters({ ...filters, machineId: value === "all" ? "" : value })}
              >
                <SelectTrigger data-testid="select-machine">
                  <SelectValue placeholder="اختر الماكينة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المكائن</SelectItem>
                  {machines?.map((machine: any) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name_ar || machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} data-testid="button-search">
              <Search className="mr-2 h-4 w-4" />
              بحث
            </Button>
            <Button onClick={handleReset} variant="outline" data-testid="button-reset">
              <RotateCcw className="mr-2 h-4 w-4" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-orders">
                {summary?.data?.totalOrders || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أوامر نشطة</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-blue-600" data-testid="text-active-orders">
                {summary?.data?.activeOrders || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الرولات المنتجة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-total-rolls">
                {summary?.data?.totalRolls || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط وقت الإنتاج</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-avg-time">
                {summary?.data?.avgProductionTime?.toFixed(1) || "0"} ساعة
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة الهدر</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div
                className={`text-2xl font-bold rounded px-2 ${getStatusColor(summary?.data?.wastePercentage || 0, "waste")}`}
                data-testid="text-waste-percentage"
              >
                {summary?.data?.wastePercentage?.toFixed(2) || "0"}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل الإنجاز</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div
                className={`text-2xl font-bold rounded px-2 ${getStatusColor(summary?.data?.completionRate || 0, "completion")}`}
                data-testid="text-completion-rate"
              >
                {summary?.data?.completionRate?.toFixed(1) || "0"}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="daily" data-testid="tab-daily">الإنتاج اليومي</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">حسب المنتج</TabsTrigger>
          <TabsTrigger value="waste" data-testid="tab-waste">تحليل الهدر</TabsTrigger>
          <TabsTrigger value="machines" data-testid="tab-machines">أداء المكائن</TabsTrigger>
          <TabsTrigger value="operators" data-testid="tab-operators">أداء العمال</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإنتاج اليومي</CardTitle>
              <CardDescription>عدد الرولات والوزن المنتج يومياً</CardDescription>
            </CardHeader>
            <CardContent>
              {dateLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productionByDate?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="rollsCount"
                      stroke="#3b82f6"
                      name="عدد الرولات"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalWeight"
                      stroke="#10b981"
                      name="الوزن (كجم)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الإنتاج حسب المنتج</CardTitle>
              <CardDescription>توزيع الإنتاج على المنتجات المختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              {productLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productionByProduct?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalWeight" fill="#3b82f6" name="الوزن (كجم)" />
                    <Bar dataKey="rollsCount" fill="#10b981" name="عدد الرولات" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>توزيع الإنتاج</CardTitle>
              <CardDescription>النسبة المئوية لكل منتج</CardDescription>
            </CardHeader>
            <CardContent>
              {productLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productionByProduct?.data || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.productName}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalWeight"
                    >
                      {(productionByProduct?.data || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اتجاه الهدر عبر الوقت</CardTitle>
              <CardDescription>تحليل كمية الهدر اليومية</CardDescription>
            </CardHeader>
            <CardContent>
              {wasteLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={wasteAnalysis?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="totalWaste"
                      stroke="#ef4444"
                      fill="#fecaca"
                      name="كمية الهدر (كجم)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أداء المكائن</CardTitle>
              <CardDescription>الإنتاجية حسب كل ماكينة</CardDescription>
            </CardHeader>
            <CardContent>
              {machineLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={machinePerformance?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="machineName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalWeight" fill="#3b82f6" name="الوزن (كجم)" />
                    <Bar dataKey="rollsCount" fill="#10b981" name="عدد الرولات" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Machine Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>جدول أداء المكائن</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الماكينة</TableHead>
                    <TableHead>عدد الرولات</TableHead>
                    <TableHead>الوزن الكلي (كجم)</TableHead>
                    <TableHead>متوسط الوقت (ساعة)</TableHead>
                    <TableHead>الكفاءة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machinePerformance?.data?.map((machine: any) => (
                    <TableRow key={machine.machineId}>
                      <TableCell className="font-medium">{machine.machineName}</TableCell>
                      <TableCell>{machine.rollsCount}</TableCell>
                      <TableCell>{machine.totalWeight?.toFixed(2)}</TableCell>
                      <TableCell>{machine.avgProductionTime?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={machine.efficiency > 100 ? "default" : "secondary"}>
                          {machine.efficiency?.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>أداء العمال</CardTitle>
              <CardDescription>إنتاجية كل عامل</CardDescription>
            </CardHeader>
            <CardContent>
              {operatorLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={operatorPerformance?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="operatorName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalWeight" fill="#8b5cf6" name="الوزن (كجم)" />
                    <Bar dataKey="rollsCount" fill="#ec4899" name="عدد الرولات" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Operator Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>جدول أداء العمال</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العامل</TableHead>
                    <TableHead>عدد الرولات</TableHead>
                    <TableHead>الوزن الكلي (كجم)</TableHead>
                    <TableHead>متوسط وزن الرولة</TableHead>
                    <TableHead>الإنتاجية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatorPerformance?.data?.map((operator: any) => (
                    <TableRow key={operator.operatorId}>
                      <TableCell className="font-medium">{operator.operatorName}</TableCell>
                      <TableCell>{operator.rollsCount}</TableCell>
                      <TableCell>{operator.totalWeight?.toFixed(2)}</TableCell>
                      <TableCell>{operator.avgRollWeight?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={operator.productivity > 50 ? "default" : "secondary"}>
                          {operator.productivity?.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
