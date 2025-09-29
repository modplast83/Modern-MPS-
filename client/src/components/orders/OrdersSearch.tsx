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
}

export default function OrdersSearch({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: OrdersSearchProps) {
  return (
    <div className="flex space-x-2 space-x-reverse">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="البحث في الطلبات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-64"
          data-testid="input-search-orders"
        />
      </div>
      <Select value={statusFilter || ""} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48" data-testid="select-status-filter">
          <SelectValue placeholder="فلترة حسب الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">جميع الطلبات</SelectItem>
          <SelectItem value="waiting">انتظار</SelectItem>
          <SelectItem value="in_production">انتاج</SelectItem>
          <SelectItem value="paused">معلق</SelectItem>
          <SelectItem value="completed">مكتمل</SelectItem>
          <SelectItem value="received">مستلم</SelectItem>
          <SelectItem value="delivered">تم التوصيل</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
