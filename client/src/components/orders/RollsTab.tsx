import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import { formatNumber } from "../../lib/formatNumber";
import {
  Search,
  Filter,
  CalendarIcon,
  Film,
  PrinterIcon,
  Scissors,
  CheckCircle,
  Package,
  RefreshCw,
  X,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import * as XLSX from "xlsx";
import { useTranslation } from 'react-i18next';

interface RollData {
  roll_id: number;
  roll_number: string;
  roll_seq: number;
  stage: string;
  weight_kg: string;
  cut_weight_total_kg?: string;
  waste_kg?: string;
  created_at: string;
  printed_at?: string;
  cut_completed_at?: string;
  production_order_id: number;
  production_order_number: string;
  order_id: number;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_name_ar?: string;
  item_name?: string;
  item_name_ar?: string;
  size_caption?: string;
  color?: string;
  punching?: string;
  film_machine_name?: string;
  printing_machine_name?: string;
  cutting_machine_name?: string;
  created_by_name?: string;
  printed_by_name?: string;
  cut_by_name?: string;
}

interface RollsTabProps {
  customers?: any[];
  productionOrders?: any[];
}

export default function RollsTab({ customers = [], productionOrders = [] }: RollsTabProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [productionOrderFilter, setProductionOrderFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // جلب الرولات
  const { data: rolls = [], isLoading, refetch } = useQuery<RollData[]>({
    queryKey: ["/api/rolls/search"],
    queryFn: async () => {
      const response = await fetch("/api/rolls/search?q=");
      if (!response.ok) throw new Error(t('production.rolls.fetchError'));
      return response.json();
    },
  });

  // الفلترة
  const filteredRolls = useMemo(() => {
    return rolls.filter((roll) => {
      // البحث النصي
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        roll.roll_number.toLowerCase().includes(searchLower) ||
        roll.production_order_number.toLowerCase().includes(searchLower) ||
        roll.order_number.toLowerCase().includes(searchLower) ||
        (roll.customer_name_ar || roll.customer_name).toLowerCase().includes(searchLower) ||
        (roll.item_name_ar || roll.item_name || "").toLowerCase().includes(searchLower);

      // فلتر المرحلة
      const matchesStage = stageFilter === "all" || roll.stage === stageFilter;

      // فلتر العميل
      const matchesCustomer = customerFilter === "all" || roll.customer_id === customerFilter;

      // فلتر أمر الإنتاج
      const matchesProductionOrder = productionOrderFilter === "all" || 
        roll.production_order_id === parseInt(productionOrderFilter);

      // فلتر التاريخ
      const rollDate = new Date(roll.created_at);
      const matchesStartDate = !startDate || rollDate >= startDate;
      const matchesEndDate = !endDate || rollDate <= endDate;

      return matchesSearch && matchesStage && matchesCustomer && 
             matchesProductionOrder && matchesStartDate && matchesEndDate;
    });
  }, [rolls, searchTerm, stageFilter, customerFilter, productionOrderFilter, startDate, endDate]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const byStage = {
      film: filteredRolls.filter(r => r.stage === "film").length,
      printing: filteredRolls.filter(r => r.stage === "printing").length,
      cutting: filteredRolls.filter(r => r.stage === "cutting").length,
      done: filteredRolls.filter(r => r.stage === "done").length,
      archived: filteredRolls.filter(r => r.stage === "archived").length,
    };
    const totalWeight = filteredRolls.reduce((sum, r) => sum + parseFloat(r.weight_kg || "0"), 0);
    return { byStage, totalWeight, total: filteredRolls.length };
  }, [filteredRolls]);

  // الترجمة
  const getStageNameAr = (stage: string) => {
    const stages: Record<string, string> = {
      film: t('production.rolls.stages.film'),
      printing: t('production.rolls.stages.printing'),
      cutting: t('production.rolls.stages.cutting'),
      done: t('production.rolls.stages.done'),
      archived: t('production.rolls.stages.archived'),
    };
    return stages[stage] || stage;
  };

  const getStageBadgeVariant = (stage: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      film: "secondary",
      printing: "default",
      cutting: "outline",
      done: "default",
      archived: "secondary",
    };
    return variants[stage] || "default";
  };

  const getStageBadgeClassName = (stage: string) => {
    if (stage === "done") {
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100";
    }
    return "";
  };

  const getStageIcon = (stage: string) => {
    const icons: Record<string, any> = {
      film: Film,
      printing: PrinterIcon,
      cutting: Scissors,
      done: CheckCircle,
      archived: Package,
    };
    const Icon = icons[stage] || Package;
    return <Icon className="h-4 w-4" />;
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    if (filteredRolls.length === 0) {
      alert(t('production.rolls.noDataToExport'));
      return;
    }

    const data = filteredRolls.map((roll) => ({
      [t('production.rolls.rollNumber')]: roll.roll_number,
      [t('orders.productionOrderNumber')]: roll.production_order_number,
      [t('orders.orderNumber')]: roll.order_number,
      [t('orders.customer')]: roll.customer_name_ar || roll.customer_name,
      [t('common.product')]: roll.item_name_ar || roll.item_name || "-",
      [t('production.rolls.size')]: roll.size_caption || "-",
      [t('production.rolls.stage')]: getStageNameAr(roll.stage),
      [t('production.rolls.weightKg')]: roll.weight_kg,
      [t('production.rolls.filmBy')]: roll.created_by_name || "-",
      [t('production.rolls.printedBy')]: roll.printed_by_name || "-",
      [t('production.rolls.cutBy')]: roll.cut_by_name || "-",
      [t('production.rolls.cutWeight')]: roll.cut_weight_total_kg || "-",
      [t('production.rolls.waste')]: roll.waste_kg || "-",
      [t('common.createdAt')]: format(new Date(roll.created_at), "yyyy-MM-dd HH:mm", { locale: ar }),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('production.rolls.rolls'));
    XLSX.writeFile(wb, `rolls-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  // مسح الفلاتر
  const clearFilters = () => {
    setSearchTerm("");
    setStageFilter("all");
    setCustomerFilter("all");
    setProductionOrderFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-4">
      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">الإجمالي</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Film className="h-4 w-4" />
              فيلم
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{formatNumber(stats.byStage.film)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <PrinterIcon className="h-4 w-4" />
              طباعة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{formatNumber(stats.byStage.printing)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <Scissors className="h-4 w-4" />
              تقطيع
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{formatNumber(stats.byStage.cutting)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              منتهي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{formatNumber(stats.byStage.done)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">إجمالي الوزن</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold">{stats.totalWeight.toFixed(2)} كجم</div>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث والفلاتر */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* صف البحث والأزرار */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث برقم الرول، أمر الإنتاج، الطلب، العميل، أو المنتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                  data-testid="input-search-rolls"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters"
                >
                  <Filter className="h-4 w-4 ml-2" />
                  الفلاتر
                </Button>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  data-testid="button-refresh-rolls"
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تحديث
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  disabled={filteredRolls.length === 0}
                  data-testid="button-export-rolls"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                </Button>
              </div>
            </div>

            {/* الفلاتر المتقدمة */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* فلتر المرحلة */}
                <div className="space-y-2">
                  <Label>المرحلة</Label>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger data-testid="select-stage-filter">
                      <SelectValue placeholder="كل المراحل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المراحل</SelectItem>
                      <SelectItem value="film">فيلم</SelectItem>
                      <SelectItem value="printing">طباعة</SelectItem>
                      <SelectItem value="cutting">تقطيع</SelectItem>
                      <SelectItem value="done">منتهي</SelectItem>
                      <SelectItem value="archived">مؤرشف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* فلتر العميل */}
                <div className="space-y-2">
                  <Label>العميل</Label>
                  <Select value={customerFilter} onValueChange={setCustomerFilter}>
                    <SelectTrigger data-testid="select-customer-filter">
                      <SelectValue placeholder="كل العملاء" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل العملاء</SelectItem>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name_ar || customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* فلتر أمر الإنتاج */}
                <div className="space-y-2">
                  <Label>أمر الإنتاج</Label>
                  <Select value={productionOrderFilter} onValueChange={setProductionOrderFilter}>
                    <SelectTrigger data-testid="select-production-order-filter">
                      <SelectValue placeholder="كل أوامر الإنتاج" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل أوامر الإنتاج</SelectItem>
                      {productionOrders.slice(0, 50).map((po: any) => (
                        <SelectItem key={po.id} value={po.id.toString()}>
                          {po.production_order_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* فلتر التاريخ */}
                <div className="space-y-2">
                  <Label>التاريخ</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-right font-normal flex-1",
                            !startDate && "text-muted-foreground"
                          )}
                          data-testid="button-start-date"
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd/MM/yyyy") : "من"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          locale={ar}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-right font-normal flex-1",
                            !endDate && "text-muted-foreground"
                          )}
                          data-testid="button-end-date"
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd/MM/yyyy") : "إلى"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          locale={ar}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* زر مسح الفلاتر */}
                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-sm"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 ml-2" />
                    مسح الفلاتر
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* الجدول */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredRolls.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">لا توجد رولات</p>
              <p className="text-sm mt-1">جرب تغيير معايير البحث أو الفلاتر</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الرول</TableHead>
                    <TableHead className="text-right">المرحلة</TableHead>
                    <TableHead className="text-right">أمر الإنتاج</TableHead>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">الوزن (كجم)</TableHead>
                    <TableHead className="text-right">فيلم بواسطة</TableHead>
                    <TableHead className="text-right">طبع بواسطة</TableHead>
                    <TableHead className="text-right">قطع بواسطة</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRolls.map((roll) => (
                    <TableRow key={roll.roll_id} data-testid={`row-roll-${roll.roll_id}`}>
                      <TableCell className="font-medium" data-testid={`text-roll-number-${roll.roll_id}`}>
                        {roll.roll_number}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStageBadgeVariant(roll.stage)} 
                          className={`flex items-center gap-1 w-fit ${getStageBadgeClassName(roll.stage)}`}
                          data-testid={`badge-stage-${roll.roll_id}`}
                        >
                          {getStageIcon(roll.stage)}
                          {getStageNameAr(roll.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-production-order-${roll.roll_id}`}>
                        {roll.production_order_number}
                      </TableCell>
                      <TableCell data-testid={`text-order-number-${roll.roll_id}`}>
                        {roll.order_number}
                      </TableCell>
                      <TableCell data-testid={`text-customer-${roll.roll_id}`}>
                        {roll.customer_name_ar || roll.customer_name}
                      </TableCell>
                      <TableCell data-testid={`text-item-${roll.roll_id}`}>
                        <div>
                          <div className="font-medium">{roll.item_name_ar || roll.item_name || "-"}</div>
                          {roll.size_caption && (
                            <div className="text-xs text-gray-500">{roll.size_caption}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-weight-${roll.roll_id}`}>
                        {parseFloat(roll.weight_kg).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-created-by-${roll.roll_id}`}>
                        {roll.created_by_name || "-"}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-printed-by-${roll.roll_id}`}>
                        {roll.printed_by_name || "-"}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-cut-by-${roll.roll_id}`}>
                        {roll.cut_by_name || "-"}
                      </TableCell>
                      <TableCell data-testid={`text-created-at-${roll.roll_id}`}>
                        {format(new Date(roll.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* معلومات النتائج */}
      {!isLoading && filteredRolls.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          عرض {formatNumber(filteredRolls.length)} من {formatNumber(rolls.length)} رول
        </div>
      )}
    </div>
  );
}
