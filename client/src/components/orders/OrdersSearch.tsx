import { useTranslation } from "react-i18next";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Search } from "lucide-react";

interface OrdersSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  type?: 'orders' | 'production';
}

export default function OrdersSearch({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  type = 'orders',
}: OrdersSearchProps) {
  const { t } = useTranslation();
  const isProduction = type === 'production';
  
  return (
    <div className={t("components.orders.orderssearch.name.flex_space_x_2_space_x_reverse")}>
      <div className={t("components.orders.orderssearch.name.relative")}>
        <Search className={t("components.orders.orderssearch.name.absolute_left_3_top_1_2_transform_translate_y_1_2_h_4_w_4_text_gray_400")} />
        <Input
          placeholder={isProduction ? t("orders.searchProductionOrders") : t("orders.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={t("components.orders.orderssearch.name.pl_10_w_64")}
          data-testid={isProduction ? "input-search-production" : "input-search-orders"}
        />
      </div>
      <Select value={statusFilter || ""} onValueChange={setStatusFilter}>
        <SelectTrigger className={t("components.orders.orderssearch.name.w_48")} data-testid="select-status-filter">
          <SelectValue placeholder={t("orders.filterByStatus")} />
        </SelectTrigger>
        <SelectContent>
          {isProduction ? (
            <>
              <SelectItem value="all">{t("orders.allProductionOrders")}</SelectItem>
              <SelectItem value="pending">{t("production.pending")}</SelectItem>
              <SelectItem value="in_progress">{t("production.inProduction")}</SelectItem>
              <SelectItem value="completed">{t("production.completed")}</SelectItem>
            </>{t('components.orders.OrdersSearch.)_:_(')}<>
              <SelectItem value="all">{t("orders.allOrders")}</SelectItem>
              <SelectItem value="waiting">{t("production.waiting")}</SelectItem>
              <SelectItem value="in_production">{t("production.inProduction")}</SelectItem>
              <SelectItem value="paused">{t("production.paused")}</SelectItem>
              <SelectItem value="completed">{t("production.completed")}</SelectItem>
              <SelectItem value="received">{t("production.received")}</SelectItem>
              <SelectItem value="delivered">{t("production.delivered")}</SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
