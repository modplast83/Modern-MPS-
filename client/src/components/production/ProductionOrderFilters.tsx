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
    <Card className="p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold">{t('filters.searchFilters')}</h3>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="mr-auto"
            data-testid="button-reset-filters"
          >
            <X className="h-4 w-4 ml-1" />
            {t('filters.clearFilters')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* البحث النصي */}
        <div>
          <Label htmlFor="search">{t('filters.search')}</Label>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder={t('filters.searchPlaceholder')}
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="pr-9"
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
                <div className="flex items-center gap-2">
                  <span className="text-yellow-600">⏳</span>
                  {t('production.pending')}
                </div>
              </SelectItem>
              <SelectItem value="active" data-testid="option-status-active">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">▶️</span>
                  {t('filters.active')}
                </div>
              </SelectItem>
              <SelectItem value="completed" data-testid="option-status-completed">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">✅</span>
                  {t('production.completed')}
                </div>
              </SelectItem>
              <SelectItem value="cancelled" data-testid="option-status-cancelled">
                <div className="flex items-center gap-2">
                  <span className="text-red-600">❌</span>
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