import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search, Filter, X } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface ProductionOrderFiltersProps {
  filters: {
    status: string;
    customerId: string;
    searchTerm: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: any) => void;
  customers: any[];
}

export default function ProductionOrderFilters({
  filters,
  onFiltersChange,
  customers,
}: ProductionOrderFiltersProps) {
  const { t } = useTranslation();
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      status: "all",
      customerId: "",
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = 
    filters.status !== "all" ||
    filters.customerId ||
    filters.searchTerm ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <Card className={t("components.production.productionorderfilters.name.p_4_mb_4")}>
      <div className={t("components.production.productionorderfilters.name.flex_items_center_gap_2_mb_4")}>
        <Filter className={t("components.production.productionorderfilters.name.h_5_w_5_text_gray_600")} />
        <h3 className={t("components.production.productionorderfilters.name.font_semibold")}>{t('filters.searchFilters')}</h3>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className={t("components.production.productionorderfilters.name.mr_auto")}
            data-testid="button-reset-filters"
          >
            <X className={t("components.production.productionorderfilters.name.h_4_w_4_ml_1")} />
            {t('filters.clearFilters')}
          </Button>
        )}
      </div>

      <div className={t("components.production.productionorderfilters.name.grid_grid_cols_1_md_grid_cols_2_lg_grid_cols_5_gap_4")}>
        {/* البحث النصي */}
        <div>
          <Label htmlFor="search">{t('filters.search')}</Label>
          <div className={t("components.production.productionorderfilters.name.relative")}>
            <Search className={t("components.production.productionorderfilters.name.absolute_right_3_top_2_5_h_4_w_4_text_gray_400")} />
            <Input
              id="search"
              placeholder={t('filters.searchPlaceholder')}
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className={t("components.production.productionorderfilters.name.pr_9")}
              data-testid="input-search"
            />
          </div>
        </div>

        {/* فلتر الحالة */}
        <div>
          <Label htmlFor="status">{t('filters.status')}</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger id="status" data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-status-all">
                {t('filters.allStatuses')}
              </SelectItem>
              <SelectItem value="pending" data-testid="option-status-pending">
                <div className={t("components.production.productionorderfilters.name.flex_items_center_gap_2")}>
                  <span className={t("components.production.productionorderfilters.name.text_yellow_600")}>⏳</span>
                  {t('production.pending')}
                </div>
              </SelectItem>
              <SelectItem value="active" data-testid="option-status-active">
                <div className={t("components.production.productionorderfilters.name.flex_items_center_gap_2")}>
                  <span className={t("components.production.productionorderfilters.name.text_green_600")}>{t('components.production.ProductionOrderFilters.▶️')}</span>
                  {t('filters.active')}
                </div>
              </SelectItem>
              <SelectItem value="completed" data-testid="option-status-completed">
                <div className={t("components.production.productionorderfilters.name.flex_items_center_gap_2")}>
                  <span className={t("components.production.productionorderfilters.name.text_gray_600")}>✅</span>
                  {t('production.completed')}
                </div>
              </SelectItem>
              <SelectItem value="cancelled" data-testid="option-status-cancelled">
                <div className={t("components.production.productionorderfilters.name.flex_items_center_gap_2")}>
                  <span className={t("components.production.productionorderfilters.name.text_red_600")}>❌</span>
                  {t('filters.cancelled')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* فلتر العميل */}
        <div>
          <Label htmlFor="customer">{t('filters.customer')}</Label>
          <Select
            value={filters.customerId || "all"}
            onValueChange={(value) => handleFilterChange("customerId", value === "all" ? "" : value)}
          >
            <SelectTrigger id="customer" data-testid="select-customer">
              <SelectValue placeholder={t('filters.allCustomers')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-customer-all">
                {t('filters.allCustomers')}
              </SelectItem>
              {customers.map((customer) => (
                <SelectItem
                  key={customer.id}
                  value={customer.id}
                  data-testid={`option-customer-${customer.id}`}
                >
                  {customer.name_ar || customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* التاريخ من */}
        <div>
          <Label htmlFor="date-from">{t('filters.fromDate')}</Label>
          <Input
            id="date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            data-testid="input-date-from"
          />
        </div>

        {/* التاريخ إلى */}
        <div>
          <Label htmlFor="date-to">{t('filters.toDate')}</Label>
          <Input
            id="date-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            data-testid="input-date-to"
          />
        </div>
      </div>
    </Card>
  );
}