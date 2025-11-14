import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          [t('reports.totalOrders'), summary.data.totalOrders],
          [t('production.activeOrdersCount'), summary.data.activeOrders],
          [t('production.completedOrdersCount'), summary.data.completedOrders],
          [t('reports.rollsProduced'), summary.data.totalRolls],
          [t('reports.totalWeight') + ' (' + t('warehouse.kg') + ')', summary.data.totalWeight],
          [t('reports.avgProductionTime') + ' (' + t('reports.hours') + ')', summary.data.avgProductionTime?.toFixed(2)],
          [t('reports.wastePercentage') + ' %', summary.data.wastePercentage?.toFixed(2)],
          [t('reports.completionRate') + ' %', summary.data.completionRate?.toFixed(2)],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, t('reports.summary'));
      }

      // Production by date sheet
      if (productionByDate?.data) {
        const dateSheet = XLSX.utils.json_to_sheet(productionByDate.data);
        XLSX.utils.book_append_sheet(workbook, dateSheet, t('reports.dailyProduction'));
      }

      // Production by product sheet
      if (productionByProduct?.data) {
        const productSheet = XLSX.utils.json_to_sheet(productionByProduct.data);
        XLSX.utils.book_append_sheet(workbook, productSheet, t('reports.productionByProduct'));
      }

      // Machine performance sheet
      if (machinePerformance?.data) {
        const machineSheet = XLSX.utils.json_to_sheet(machinePerformance.data);
        XLSX.utils.book_append_sheet(workbook, machineSheet, t('reports.machinePerformance'));
      }

      // Operator performance sheet
      if (operatorPerformance?.data) {
        const operatorSheet = XLSX.utils.json_to_sheet(operatorPerformance.data);
        XLSX.utils.book_append_sheet(workbook, operatorSheet, t('reports.operatorPerformance'));
      }

      XLSX.writeFile(workbook, `${t('reports.productionReport')}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast({
        title: t("toast.exportSuccess"),
        description: t("toast.exportSuccessDesc"),
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t("toast.exportError"),
        description: t("toast.exportErrorDesc"),
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
    <div className={t("pages.productionreports.name.container_mx_auto_p_6_space_y_6_max_w_7xl")}>
      <div className={t("pages.productionreports.name.flex_justify_between_items_center")}>
        <div>
          <h1 className={t("pages.productionreports.name.text_3xl_font_bold")} data-testid="text-page-title">{t("reports.comprehensiveProductionReports")}</h1>
          <p className={t("pages.productionreports.name.text_muted_foreground")}>{t("reports.comprehensiveAnalysisDesc")}</p>
        </div>
        <div className={t("pages.productionreports.name.flex_gap_2")}>
          <Button onClick={exportToExcel} variant="outline" data-testid="button-export-excel">
            <FileSpreadsheet className={t("pages.productionreports.name.mr_2_h_4_w_4")} />
            {t('reports.exportToExcel')}
          </Button>
          <Button onClick={exportToPDF} variant="outline" data-testid="button-export-pdf">
            <FileText className={t("pages.productionreports.name.mr_2_h_4_w_4")} />
            {t('reports.exportToPDF')}
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.reportFilters')}</CardTitle>
          <CardDescription>{t('reports.selectCriteriaDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={t("pages.productionreports.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_4_gap_4")}>
            <div className={t("pages.productionreports.name.space_y_2")}>
              <Label htmlFor="dateFrom">{t('reports.startDate')}</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                data-testid="input-date-from"
              />
            </div>

            <div className={t("pages.productionreports.name.space_y_2")}>
              <Label htmlFor="dateTo">{t('reports.endDate')}</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                data-testid="input-date-to"
              />
            </div>

            <div className={t("pages.productionreports.name.space_y_2")}>
              <Label htmlFor="section">{t('pages.ProductionReports.القسم')}</Label>
              <Select
                value={filters.sectionId || "all"}
                onValueChange={(value) => setFilters({ ...filters, sectionId: value === "all" ? "" : value })}
              >
                <SelectTrigger data-testid="select-section">
                  <SelectValue placeholder="{t('pages.ProductionReports.placeholder.اختر_القسم')}" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('pages.ProductionReports.جميع_الأقسام')}</SelectItem>
                  {sections?.map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name_ar || section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={t("pages.productionreports.name.space_y_2")}>
              <Label htmlFor="machine">{t('pages.ProductionReports.الماكينة')}</Label>
              <Select
                value={filters.machineId || "all"}
                onValueChange={(value) => setFilters({ ...filters, machineId: value === "all" ? "" : value })}
              >
                <SelectTrigger data-testid="select-machine">
                  <SelectValue placeholder="{t('pages.ProductionReports.placeholder.اختر_الماكينة')}" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('pages.ProductionReports.جميع_المكائن')}</SelectItem>
                  {machines?.map((machine: any) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name_ar || machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={t("pages.productionreports.name.flex_gap_2_mt_4")}>
            <Button onClick={handleSearch} data-testid="button-search">
              <Search className={t("pages.productionreports.name.mr_2_h_4_w_4")} />{t('pages.ProductionReports.بحث')}</Button>
            <Button onClick={handleReset} variant="outline" data-testid="button-reset">
              <RotateCcw className={t("pages.productionreports.name.mr_2_h_4_w_4")} />{t('pages.ProductionReports.إعادة_تعيين')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className={t("pages.productionreports.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_3_xl_grid_cols_6_gap_4")}>
        <Card>
          <CardHeader className={t("pages.productionreports.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
            <CardTitle className={t("pages.productionreports.name.text_sm_font_medium")}>{t('pages.ProductionReports.إجمالي_الطلبات')}</CardTitle>
            <Package className={t("pages.productionreports.name.h_4_w_4_text_muted_foreground")} />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className={t("pages.productionreports.name.h_8_w_20")} />{t('pages.ProductionReports.)_:_(')}<div className={t("pages.productionreports.name.text_2xl_font_bold")} data-testid="text-total-orders">
                {summary?.data?.totalOrders || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={t("pages.productionreports.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
            <CardTitle className={t("pages.productionreports.name.text_sm_font_medium")}>{t('pages.ProductionReports.أوامر_نشطة')}</CardTitle>
            <Activity className={t("pages.productionreports.name.h_4_w_4_text_muted_foreground")} />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className={t("pages.productionreports.name.h_8_w_20")} />{t('pages.ProductionReports.)_:_(')}<div className={t("pages.productionreports.name.text_2xl_font_bold_text_blue_600")} data-testid="text-active-orders">
                {summary?.data?.activeOrders || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={t("pages.productionreports.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
            <CardTitle className={t("pages.productionreports.name.text_sm_font_medium")}>{t('pages.ProductionReports.الرولات_المنتجة')}</CardTitle>
            <TrendingUp className={t("pages.productionreports.name.h_4_w_4_text_muted_foreground")} />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className={t("pages.productionreports.name.h_8_w_20")} />{t('pages.ProductionReports.)_:_(')}<div className={t("pages.productionreports.name.text_2xl_font_bold")} data-testid="text-total-rolls">
                {summary?.data?.totalRolls || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={t("pages.productionreports.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
            <CardTitle className={t("pages.productionreports.name.text_sm_font_medium")}>{t('pages.ProductionReports.متوسط_وقت_الإنتاج')}</CardTitle>
            <Clock className={t("pages.productionreports.name.h_4_w_4_text_muted_foreground")} />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className={t("pages.productionreports.name.h_8_w_20")} />{t('pages.ProductionReports.)_:_(')}<div className={t("pages.productionreports.name.text_2xl_font_bold")} data-testid="text-avg-time">
                {summary?.data?.avgProductionTime?.toFixed(1) || "0"} ساعة
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={t("pages.productionreports.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
            <CardTitle className={t("pages.productionreports.name.text_sm_font_medium")}>{t('pages.ProductionReports.نسبة_الهدر')}</CardTitle>
            <AlertTriangle className={t("pages.productionreports.name.h_4_w_4_text_muted_foreground")} />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className={t("pages.productionreports.name.h_8_w_20")} />{t('pages.ProductionReports.)_:_(')}<div
                className={`text-2xl font-bold rounded px-2 ${getStatusColor(summary?.data?.wastePercentage || 0, "waste")}`}
                data-testid="text-waste-percentage"
              >
                {summary?.data?.wastePercentage?.toFixed(2) || "0"}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={t("pages.productionreports.name.flex_flex_row_items_center_justify_between_space_y_0_pb_2")}>
            <CardTitle className={t("pages.productionreports.name.text_sm_font_medium")}>{t('pages.ProductionReports.معدل_الإنجاز')}</CardTitle>
            <CheckCircle className={t("pages.productionreports.name.h_4_w_4_text_muted_foreground")} />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className={t("pages.productionreports.name.h_8_w_20")} />{t('pages.ProductionReports.)_:_(')}<div
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
      <Tabs defaultValue="daily" className={t("pages.productionreports.name.space_y_4")}>
        <TabsList className={t("pages.productionreports.name.grid_w_full_grid_cols_5")}>
          <TabsTrigger value="daily" data-testid="tab-daily">{t('pages.ProductionReports.الإنتاج_اليومي')}</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">{t('pages.ProductionReports.حسب_المنتج')}</TabsTrigger>
          <TabsTrigger value="waste" data-testid="tab-waste">{t('pages.ProductionReports.تحليل_الهدر')}</TabsTrigger>
          <TabsTrigger value="machines" data-testid="tab-machines">{t('pages.ProductionReports.أداء_المكائن')}</TabsTrigger>
          <TabsTrigger value="operators" data-testid="tab-operators">{t('pages.ProductionReports.أداء_العمال')}</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className={t("pages.productionreports.name.space_y_4")}>
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.ProductionReports.الإنتاج_اليومي')}</CardTitle>
              <CardDescription>{t('pages.ProductionReports.عدد_الرولات_والوزن_المنتج_يومياً')}</CardDescription>
            </CardHeader>
            <CardContent>
              {dateLoading ? (
                <Skeleton className={t("pages.productionreports.name.h_300px_w_full")} />{t('pages.ProductionReports.)_:_(')}<ResponsiveContainer width="100%" height={300}>
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
                      name="{t('pages.ProductionReports.name.عدد_الرولات')}"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalWeight"
                      stroke="#10b981"
                      name="{t('pages.ProductionReports.name.الوزن_(كجم)')}"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className={t("pages.productionreports.name.space_y_4")}>
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.ProductionReports.الإنتاج_حسب_المنتج')}</CardTitle>
              <CardDescription>{t('pages.ProductionReports.توزيع_الإنتاج_على_المنتجات_المختلفة')}</CardDescription>
            </CardHeader>
            <CardContent>
              {productLoading ? (
                <Skeleton className={t("pages.productionreports.name.h_300px_w_full")} />{t('pages.ProductionReports.)_:_(')}<ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productionByProduct?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalWeight" fill="#3b82f6" name="{t('pages.ProductionReports.name.الوزن_(كجم)')}" />
                    <Bar dataKey="rollsCount" fill="#10b981" name="{t('pages.ProductionReports.name.عدد_الرولات')}" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.ProductionReports.توزيع_الإنتاج')}</CardTitle>
              <CardDescription>{t('pages.ProductionReports.النسبة_المئوية_لكل_منتج')}</CardDescription>
            </CardHeader>
            <CardContent>
              {productLoading ? (
                <Skeleton className={t("pages.productionreports.name.h_300px_w_full")} />{t('pages.ProductionReports.)_:_(')}<ResponsiveContainer width="100%" height={300}>
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

        <TabsContent value="waste" className={t("pages.productionreports.name.space_y_4")}>
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.ProductionReports.اتجاه_الهدر_عبر_الوقت')}</CardTitle>
              <CardDescription>{t('pages.ProductionReports.تحليل_كمية_الهدر_اليومية')}</CardDescription>
            </CardHeader>
            <CardContent>
              {wasteLoading ? (
                <Skeleton className={t("pages.productionreports.name.h_300px_w_full")} />{t('pages.ProductionReports.)_:_(')}<ResponsiveContainer width="100%" height={300}>
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
                      name="{t('pages.ProductionReports.name.كمية_الهدر_(كجم)')}"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="machines" className={t("pages.productionreports.name.space_y_4")}>
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.ProductionReports.أداء_المكائن')}</CardTitle>
              <CardDescription>{t('pages.ProductionReports.الإنتاجية_حسب_كل_ماكينة')}</CardDescription>
            </CardHeader>
            <CardContent>
              {machineLoading ? (
                <Skeleton className={t("pages.productionreports.name.h_300px_w_full")} />{t('pages.ProductionReports.)_:_(')}<ResponsiveContainer width="100%" height={300}>
                  <BarChart data={machinePerformance?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="machineName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalWeight" fill="#3b82f6" name="{t('pages.ProductionReports.name.الوزن_(كجم)')}" />
                    <Bar dataKey="rollsCount" fill="#10b981" name="{t('pages.ProductionReports.name.عدد_الرولات')}" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Machine Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.ProductionReports.جدول_أداء_المكائن')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('pages.ProductionReports.الماكينة')}</TableHead>
                    <TableHead>{t('pages.ProductionReports.عدد_الرولات')}</TableHead>
                    <TableHead>{t('pages.ProductionReports.الوزن_الكلي_(كجم)')}</TableHead>
                    <TableHead>{t('pages.ProductionReports.متوسط_الوقت_(ساعة)')}</TableHead>
                    <TableHead>{t('pages.ProductionReports.الكفاءة')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machinePerformance?.data?.map((machine: any) => (
                    <TableRow key={machine.machineId}>
                      <TableCell className={t("pages.productionreports.name.font_medium")}>{machine.machineName}</TableCell>
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

        <TabsContent value="operators" className={t("pages.productionreports.name.space_y_4")}>
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.ProductionReports.أداء_العمال')}</CardTitle>
              <CardDescription>{t('pages.ProductionReports.إنتاجية_كل_عامل')}</CardDescription>
            </CardHeader>
            <CardContent>
              {operatorLoading ? (
                <Skeleton className={t("pages.productionreports.name.h_300px_w_full")} />{t('pages.ProductionReports.)_:_(')}<ResponsiveContainer width="100%" height={300}>
                  <BarChart data={operatorPerformance?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="operatorName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalWeight" fill="#8b5cf6" name="{t('pages.ProductionReports.name.الوزن_(كجم)')}" />
                    <Bar dataKey="rollsCount" fill="#ec4899" name="{t('pages.ProductionReports.name.عدد_الرولات')}" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Operator Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.ProductionReports.جدول_أداء_العمال')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('pages.ProductionReports.العامل')}</TableHead>
                    <TableHead>{t('pages.ProductionReports.عدد_الرولات')}</TableHead>
                    <TableHead>{t('pages.ProductionReports.الوزن_الكلي_(كجم)')}</TableHead>
                    <TableHead>{t('pages.ProductionReports.متوسط_وزن_الرولة')}</TableHead>
                    <TableHead>{t('pages.ProductionReports.الإنتاجية')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatorPerformance?.data?.map((operator: any) => (
                    <TableRow key={operator.operatorId}>
                      <TableCell className={t("pages.productionreports.name.font_medium")}>{operator.operatorName}</TableCell>
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
