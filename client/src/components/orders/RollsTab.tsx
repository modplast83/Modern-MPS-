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
  const [startDate, setStartDate] = useState<Date | undefined>{t('components.orders.RollsTab.();_const_[enddate,_setenddate]_=_usestate')}<Date | undefined>();
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
      const matchesStartDate = !startDate || rollDate >{t('components.orders.RollsTab.=_startdate;_const_matchesenddate_=_!enddate_||_rolldate')}<= endDate;

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
    return <Icon className={t("components.orders.rollstab.name.h_4_w_4")} />;
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
    <div className={t("components.orders.rollstab.name.space_y_4")}>
      {/* الإحصائيات السريعة */}
      <div className={t("components.orders.rollstab.name.grid_grid_cols_2_md_grid_cols_6_gap_4")}>
        <Card>
          <CardHeader className={t("components.orders.rollstab.name.p_4_pb_2")}>
            <CardTitle className={t("components.orders.rollstab.name.text_sm_font_medium_text_gray_600")}>{t('components.orders.RollsTab.الإجمالي')}</CardTitle>
          </CardHeader>
          <CardContent className={t("components.orders.rollstab.name.p_4_pt_0")}>
            <div className={t("components.orders.rollstab.name.text_2xl_font_bold")}>{formatNumber(stats.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={t("components.orders.rollstab.name.p_4_pb_2")}>
            <CardTitle className={t("components.orders.rollstab.name.text_sm_font_medium_text_gray_600_flex_items_center_gap_1")}>
              <Film className={t("components.orders.rollstab.name.h_4_w_4")} />{t('components.orders.RollsTab.فيلم')}</CardTitle>
          </CardHeader>
          <CardContent className={t("components.orders.rollstab.name.p_4_pt_0")}>
            <div className={t("components.orders.rollstab.name.text_2xl_font_bold")}>{formatNumber(stats.byStage.film)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={t("components.orders.rollstab.name.p_4_pb_2")}>
            <CardTitle className={t("components.orders.rollstab.name.text_sm_font_medium_text_gray_600_flex_items_center_gap_1")}>
              <PrinterIcon className={t("components.orders.rollstab.name.h_4_w_4")} />{t('components.orders.RollsTab.طباعة')}</CardTitle>
          </CardHeader>
          <CardContent className={t("components.orders.rollstab.name.p_4_pt_0")}>
            <div className={t("components.orders.rollstab.name.text_2xl_font_bold")}>{formatNumber(stats.byStage.printing)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={t("components.orders.rollstab.name.p_4_pb_2")}>
            <CardTitle className={t("components.orders.rollstab.name.text_sm_font_medium_text_gray_600_flex_items_center_gap_1")}>
              <Scissors className={t("components.orders.rollstab.name.h_4_w_4")} />{t('components.orders.RollsTab.تقطيع')}</CardTitle>
          </CardHeader>
          <CardContent className={t("components.orders.rollstab.name.p_4_pt_0")}>
            <div className={t("components.orders.rollstab.name.text_2xl_font_bold")}>{formatNumber(stats.byStage.cutting)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={t("components.orders.rollstab.name.p_4_pb_2")}>
            <CardTitle className={t("components.orders.rollstab.name.text_sm_font_medium_text_gray_600_flex_items_center_gap_1")}>
              <CheckCircle className={t("components.orders.rollstab.name.h_4_w_4")} />{t('components.orders.RollsTab.منتهي')}</CardTitle>
          </CardHeader>
          <CardContent className={t("components.orders.rollstab.name.p_4_pt_0")}>
            <div className={t("components.orders.rollstab.name.text_2xl_font_bold")}>{formatNumber(stats.byStage.done)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={t("components.orders.rollstab.name.p_4_pb_2")}>
            <CardTitle className={t("components.orders.rollstab.name.text_sm_font_medium_text_gray_600")}>{t('components.orders.RollsTab.إجمالي_الوزن')}</CardTitle>
          </CardHeader>
          <CardContent className={t("components.orders.rollstab.name.p_4_pt_0")}>
            <div className={t("components.orders.rollstab.name.text_xl_font_bold")}>{stats.totalWeight.toFixed(2)} كجم</div>
          </CardContent>
        </Card>
      </div>

      {/* شريط البحث والفلاتر */}
      <Card>
        <CardContent className={t("components.orders.rollstab.name.p_4")}>
          <div className={t("components.orders.rollstab.name.space_y_4")}>
            {/* صف البحث والأزرار */}
            <div className={t("components.orders.rollstab.name.flex_flex_col_md_flex_row_gap_3")}>
              <div className={t("components.orders.rollstab.name.flex_1_relative")}>
                <Search className={t("components.orders.rollstab.name.absolute_right_3_top_3_h_4_w_4_text_gray_400")} />
                <Input
                  placeholder="{t('components.orders.RollsTab.placeholder.ابحث_برقم_الرول،_أمر_الإنتاج،_الطلب،_العميل،_أو_المنتج...')}"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={t("components.orders.rollstab.name.pr_9")}
                  data-testid="input-search-rolls"
                />
              </div>
              <div className={t("components.orders.rollstab.name.flex_gap_2")}>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters"
                >
                  <Filter className={t("components.orders.rollstab.name.h_4_w_4_ml_2")} />{t('components.orders.RollsTab.الفلاتر')}</Button>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  data-testid="button-refresh-rolls"
                >
                  <RefreshCw className={t("components.orders.rollstab.name.h_4_w_4_ml_2")} />{t('components.orders.RollsTab.تحديث')}</Button>
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  disabled={filteredRolls.length === 0}
                  data-testid="button-export-rolls"
                >
                  <Download className={t("components.orders.rollstab.name.h_4_w_4_ml_2")} />{t('components.orders.RollsTab.تصدير')}</Button>
              </div>
            </div>

            {/* الفلاتر المتقدمة */}
            {showFilters && (
              <div className={t("components.orders.rollstab.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_4_gap_4_p_4_bg_gray_50_rounded_lg")}>
                {/* فلتر المرحلة */}
                <div className={t("components.orders.rollstab.name.space_y_2")}>
                  <Label>{t('components.orders.RollsTab.المرحلة')}</Label>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger data-testid="select-stage-filter">
                      <SelectValue placeholder="{t('components.orders.RollsTab.placeholder.كل_المراحل')}" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('components.orders.RollsTab.كل_المراحل')}</SelectItem>
                      <SelectItem value="film">{t('components.orders.RollsTab.فيلم')}</SelectItem>
                      <SelectItem value="printing">{t('components.orders.RollsTab.طباعة')}</SelectItem>
                      <SelectItem value="cutting">{t('components.orders.RollsTab.تقطيع')}</SelectItem>
                      <SelectItem value="done">{t('components.orders.RollsTab.منتهي')}</SelectItem>
                      <SelectItem value="archived">{t('components.orders.RollsTab.مؤرشف')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* فلتر العميل */}
                <div className={t("components.orders.rollstab.name.space_y_2")}>
                  <Label>{t('components.orders.RollsTab.العميل')}</Label>
                  <Select value={customerFilter} onValueChange={setCustomerFilter}>
                    <SelectTrigger data-testid="select-customer-filter">
                      <SelectValue placeholder="{t('components.orders.RollsTab.placeholder.كل_العملاء')}" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('components.orders.RollsTab.كل_العملاء')}</SelectItem>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name_ar || customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* فلتر أمر الإنتاج */}
                <div className={t("components.orders.rollstab.name.space_y_2")}>
                  <Label>{t('components.orders.RollsTab.أمر_الإنتاج')}</Label>
                  <Select value={productionOrderFilter} onValueChange={setProductionOrderFilter}>
                    <SelectTrigger data-testid="select-production-order-filter">
                      <SelectValue placeholder="{t('components.orders.RollsTab.placeholder.كل_أوامر_الإنتاج')}" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('components.orders.RollsTab.كل_أوامر_الإنتاج')}</SelectItem>
                      {productionOrders.slice(0, 50).map((po: any) => (
                        <SelectItem key={po.id} value={po.id.toString()}>
                          {po.production_order_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* فلتر التاريخ */}
                <div className={t("components.orders.rollstab.name.space_y_2")}>
                  <Label>{t('components.orders.RollsTab.التاريخ')}</Label>
                  <div className={t("components.orders.rollstab.name.flex_gap_2")}>
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
                          <CalendarIcon className={t("components.orders.rollstab.name.ml_2_h_4_w_4")} />
                          {startDate ? format(startDate, "dd/MM/yyyy") : "من"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className={t("components.orders.rollstab.name.w_auto_p_0")} align="start">
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
                          <CalendarIcon className={t("components.orders.rollstab.name.ml_2_h_4_w_4")} />
                          {endDate ? format(endDate, "dd/MM/yyyy") : "إلى"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className={t("components.orders.rollstab.name.w_auto_p_0")} align="start">
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
                <div className={t("components.orders.rollstab.name.md_col_span_2_lg_col_span_4_flex_justify_end")}>
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className={t("components.orders.rollstab.name.text_sm")}
                    data-testid="button-clear-filters"
                  >
                    <X className={t("components.orders.rollstab.name.h_4_w_4_ml_2")} />{t('components.orders.RollsTab.مسح_الفلاتر')}</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* الجدول */}
      <Card>
        <CardContent className={t("components.orders.rollstab.name.p_0")}>
          {isLoading ? (
            <div className={t("components.orders.rollstab.name.p_8_space_y_4")}>
              <Skeleton className={t("components.orders.rollstab.name.h_12_w_full")} />
              <Skeleton className={t("components.orders.rollstab.name.h_12_w_full")} />
              <Skeleton className={t("components.orders.rollstab.name.h_12_w_full")} />
            </div>{t('components.orders.RollsTab.)_:_filteredrolls.length_===_0_?_(')}<div className={t("components.orders.rollstab.name.p_12_text_center_text_gray_500")}>
              <Package className={t("components.orders.rollstab.name.h_12_w_12_mx_auto_mb_4_text_gray_300")} />
              <p className={t("components.orders.rollstab.name.text_lg_font_medium")}>{t('components.orders.RollsTab.لا_توجد_رولات')}</p>
              <p className={t("components.orders.rollstab.name.text_sm_mt_1")}>{t('components.orders.RollsTab.جرب_تغيير_معايير_البحث_أو_الفلاتر')}</p>
            </div>{t('components.orders.RollsTab.)_:_(')}<div className={t("components.orders.rollstab.name.overflow_x_auto")}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.رقم_الرول')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.المرحلة')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.أمر_الإنتاج')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.رقم_الطلب')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.العميل')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.المنتج')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.الوزن_(كجم)')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.فيلم_بواسطة')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.طبع_بواسطة')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.قطع_بواسطة')}</TableHead>
                    <TableHead className={t("components.orders.rollstab.name.text_right")}>{t('components.orders.RollsTab.تاريخ_الإنشاء')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRolls.map((roll) => (
                    <TableRow key={roll.roll_id} data-testid={`row-roll-${roll.roll_id}`}>
                      <TableCell className={t("components.orders.rollstab.name.font_medium")} data-testid={`text-roll-number-${roll.roll_id}`}>
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
                          <div className={t("components.orders.rollstab.name.font_medium")}>{roll.item_name_ar || roll.item_name || "-"}</div>
                          {roll.size_caption && (
                            <div className={t("components.orders.rollstab.name.text_xs_text_gray_500")}>{roll.size_caption}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={t("components.orders.rollstab.name.font_medium")} data-testid={`text-weight-${roll.roll_id}`}>
                        {parseFloat(roll.weight_kg).toFixed(2)}
                      </TableCell>
                      <TableCell className={t("components.orders.rollstab.name.text_sm")} data-testid={`text-created-by-${roll.roll_id}`}>
                        {roll.created_by_name || "-"}
                      </TableCell>
                      <TableCell className={t("components.orders.rollstab.name.text_sm")} data-testid={`text-printed-by-${roll.roll_id}`}>
                        {roll.printed_by_name || "-"}
                      </TableCell>
                      <TableCell className={t("components.orders.rollstab.name.text_sm")} data-testid={`text-cut-by-${roll.roll_id}`}>
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
      {!isLoading && filteredRolls.length >{t('components.orders.RollsTab.0_&&_(')}<div className={t("components.orders.rollstab.name.text_sm_text_gray_500_text_center")}>
          عرض {formatNumber(filteredRolls.length)} من {formatNumber(rolls.length)} رول
        </div>
      )}
    </div>
  );
}
