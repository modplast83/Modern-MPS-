import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Skeleton } from "../components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../components/ui/sheet";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";
import {
  Search,
  ScanLine,
  Filter,
  FileText,
  Printer,
  Download,
  CalendarIcon,
  Package,
  History,
  X,
  Film,
  PrinterIcon,
  Scissors,
  CheckCircle,
  Clock,
  User,
  Weight,
  Factory,
  QrCode,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import RollDetailsCard from "../components/production/RollDetailsCard";
import { queryClient } from "../lib/queryClient";
import * as XLSX from "xlsx";

interface RollSearchResult {
  roll_id: number;
  roll_number: string;
  roll_seq: number;
  qr_code_text: string;
  qr_png_base64?: string;
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
  raw_material?: string;
  color?: string;
  punching?: string;
  film_machine_name?: string;
  printing_machine_name?: string;
  cutting_machine_name?: string;
  created_by_name?: string;
  printed_by_name?: string;
  cut_by_name?: string;
}

interface SearchFilters {
  stage?: string;
  startDate?: Date;
  endDate?: Date;
  machineId?: string;
  operatorId?: number;
  minWeight?: number;
  maxWeight?: number;
  productionOrderId?: number;
  orderId?: number;
}

export default function RollSearch() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedRollId, setSelectedRollId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem("rollSearchHistory");
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, 10));
    }
  }, []);

  // Save search to history
  const saveToHistory = (query: string) => {
    if (query.trim()) {
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem("rollSearchHistory", JSON.stringify(newHistory));
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery) saveToHistory(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.append("q", debouncedQuery);
    if (filters.stage) params.append("stage", filters.stage);
    if (filters.startDate) params.append("start_date", format(filters.startDate, "yyyy-MM-dd"));
    if (filters.endDate) params.append("end_date", format(filters.endDate, "yyyy-MM-dd"));
    if (filters.machineId) params.append("machine_id", filters.machineId);
    if (filters.operatorId) params.append("operator_id", filters.operatorId.toString());
    if (filters.minWeight) params.append("min_weight", filters.minWeight.toString());
    if (filters.maxWeight) params.append("max_weight", filters.maxWeight.toString());
    if (filters.productionOrderId) params.append("production_order_id", filters.productionOrderId.toString());
    if (filters.orderId) params.append("order_id", filters.orderId.toString());
    return params.toString();
  };

  // Search query
  const { data: searchResults = [], isLoading: isSearching } = useQuery<RollSearchResult[]>({
    queryKey: ["/api/rolls/search", buildQueryParams()],
    enabled: debouncedQuery.length > 0 || Object.keys(filters).length > 0,
  });

  // Barcode search mutation
  const searchByBarcodeMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const response = await fetch(`/api/rolls/search-by-barcode/${barcode}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "خطأ في البحث بالباركود");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedRollId(data.roll_id);
      toast({
        title: "تم العثور على الرول",
        description: `رقم الرول: ${data.roll_number}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export to Excel
  const exportToExcel = () => {
    if (!searchResults || searchResults.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const data = searchResults.map((roll: RollSearchResult) => ({
      "رقم الرول": roll.roll_number,
      "رقم أمر الإنتاج": roll.production_order_number,
      "رقم الطلب": roll.order_number,
      "العميل": roll.customer_name_ar || roll.customer_name,
      "المنتج": roll.item_name_ar || roll.item_name || "-",
      "المقاس": roll.size_caption || "-",
      "المرحلة": getStageNameAr(roll.stage),
      "الوزن (كجم)": roll.weight_kg,
      "وزن التقطيع": roll.cut_weight_total_kg || "-",
      "الهدر": roll.waste_kg || "-",
      "تاريخ الإنشاء": format(new Date(roll.created_at), "yyyy-MM-dd HH:mm", { locale: ar }),
      "تاريخ الطباعة": roll.printed_at ? format(new Date(roll.printed_at), "yyyy-MM-dd HH:mm", { locale: ar }) : "-",
      "تاريخ التقطيع": roll.cut_completed_at ? format(new Date(roll.cut_completed_at), "yyyy-MM-dd HH:mm", { locale: ar }) : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "نتائج البحث");
    XLSX.writeFile(wb, `roll_search_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`);

    toast({
      title: "تم التصدير بنجاح",
      description: `تم تصدير ${searchResults.length} رول`,
    });
  };

  // Get stage name in Arabic
  const getStageNameAr = (stage: string) => {
    switch (stage) {
      case "film": return "فيلم";
      case "printing": return "طباعة";
      case "cutting": return "تقطيع";
      case "done": return "مكتمل";
      default: return stage;
    }
  };

  // Get stage icon
  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "film": return <Film className="h-4 w-4" />;
      case "printing": return <PrinterIcon className="h-4 w-4" />;
      case "cutting": return <Scissors className="h-4 w-4" />;
      case "done": return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // Get stage color
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "film": return "default";
      case "printing": return "secondary";
      case "cutting": return "warning";
      case "done": return "success";
      default: return "default";
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = () => {
    if (barcodeInput.trim()) {
      searchByBarcodeMutation.mutate(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Search className="h-6 w-6" />
              البحث عن الرولات
            </h1>
              <p className="text-muted-foreground mt-1">
                ابحث عن الرولات بالرقم، الباركود، أمر الإنتاج أو الطلب
              </p>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <Tabs defaultValue="text" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" data-testid="tab-text-search">
                    <Search className="h-4 w-4 ml-2" />
                    بحث نصي
                  </TabsTrigger>
                  <TabsTrigger value="barcode" data-testid="tab-barcode-search">
                    <ScanLine className="h-4 w-4 ml-2" />
                    بحث بالباركود
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="search-input"
                      type="text"
                      placeholder="ابحث برقم الرول، أمر الإنتاج، الطلب أو اسم العميل..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 text-lg h-12"
                      data-testid="input-search"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="absolute left-2 top-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Quick Search History */}
                  {searchHistory.length > 0 && !searchQuery && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">عمليات البحث الأخيرة</Label>
                      <div className="flex flex-wrap gap-2">
                        {searchHistory.map((query, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => setSearchQuery(query)}
                          >
                            <Clock className="h-3 w-3 ml-1" />
                            {query}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advanced Filters */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      data-testid="button-toggle-filters"
                    >
                      <Filter className="h-4 w-4 ml-2" />
                      فلاتر متقدمة
                      {Object.keys(filters).length > 0 && (
                        <Badge className="mr-2" variant="secondary">
                          {Object.keys(filters).length}
                        </Badge>
                      )}
                    </Button>

                    {Object.keys(filters).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({})}
                        data-testid="button-clear-filters"
                      >
                        مسح الفلاتر
                      </Button>
                    )}
                  </div>

                  {/* Filter Panel */}
                  {showFilters && (
                    <Card className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Stage Filter */}
                        <div className="space-y-2">
                          <Label>المرحلة</Label>
                          <Select
                            value={filters.stage || "all"}
                            onValueChange={(value) => setFilters({ ...filters, stage: value === "all" ? undefined : value })}
                          >
                            <SelectTrigger data-testid="select-stage-filter">
                              <SelectValue placeholder="جميع المراحل" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">جميع المراحل</SelectItem>
                              <SelectItem value="film">فيلم</SelectItem>
                              <SelectItem value="printing">طباعة</SelectItem>
                              <SelectItem value="cutting">تقطيع</SelectItem>
                              <SelectItem value="done">مكتمل</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-2">
                          <Label>من تاريخ</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-right",
                                  !filters.startDate && "text-muted-foreground"
                                )}
                                data-testid="button-start-date"
                              >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {filters.startDate ? format(filters.startDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filters.startDate}
                                onSelect={(date) => setFilters({ ...filters, startDate: date || undefined })}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>إلى تاريخ</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-right",
                                  !filters.endDate && "text-muted-foreground"
                                )}
                                data-testid="button-end-date"
                              >
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {filters.endDate ? format(filters.endDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filters.endDate}
                                onSelect={(date) => setFilters({ ...filters, endDate: date || undefined })}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Weight Range */}
                        <div className="space-y-2">
                          <Label>الوزن الأدنى (كجم)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={filters.minWeight || ""}
                            onChange={(e) => setFilters({ ...filters, minWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                            data-testid="input-min-weight"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>الوزن الأقصى (كجم)</Label>
                          <Input
                            type="number"
                            placeholder="1000"
                            value={filters.maxWeight || ""}
                            onChange={(e) => setFilters({ ...filters, maxWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                            data-testid="input-max-weight"
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="barcode" className="space-y-4">
                  <div className="text-center space-y-4">
                    <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      امسح الباركود أو أدخل رقمه يدوياً
                    </p>
                    <div className="flex gap-2 max-w-md mx-auto">
                      <Input
                        type="text"
                        placeholder="أدخل رقم الباركود..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleBarcodeScan()}
                        className="text-lg h-12"
                        data-testid="input-barcode"
                      />
                      <Button
                        onClick={handleBarcodeScan}
                        disabled={!barcodeInput.trim() || searchByBarcodeMutation.isPending}
                        data-testid="button-scan"
                      >
                        {searchByBarcodeMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <ScanLine className="h-4 w-4" />
                        )}
                        مسح
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Search Results */}
              <div className="mt-6">
                {isSearching ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        نتائج البحث ({searchResults.length})
                      </h3>
                    </div>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        {searchResults.map((roll: RollSearchResult) => (
                          <Card
                            key={roll.roll_id}
                            className={cn(
                              "p-4 cursor-pointer hover:shadow-md transition-shadow",
                              selectedRollId === roll.roll_id && "ring-2 ring-primary"
                            )}
                            onClick={() => setSelectedRollId(roll.roll_id)}
                            data-testid={`card-roll-${roll.roll_id}`}
                          >
                            <div className="space-y-3">
                              {/* Roll Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-primary/10 rounded">
                                    <Package className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg">{roll.roll_number}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {roll.customer_name_ar || roll.customer_name}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={getStageColor(roll.stage) as any}>
                                  {getStageIcon(roll.stage)}
                                  {getStageNameAr(roll.stage)}
                                </Badge>
                              </div>

                              {/* Roll Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">أمر الإنتاج</p>
                                  <p className="font-medium">{roll.production_order_number}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">رقم الطلب</p>
                                  <p className="font-medium">{roll.order_number}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">الوزن</p>
                                  <p className="font-medium">{roll.weight_kg} كجم</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">التاريخ</p>
                                  <p className="font-medium">
                                    {format(new Date(roll.created_at), "dd/MM/yyyy")}
                                  </p>
                                </div>
                              </div>

                              {/* Product Info */}
                              {(roll.item_name || roll.size_caption) && (
                                <div className="pt-2 border-t">
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-muted-foreground">المنتج:</span>
                                    <span className="font-medium">
                                      {roll.item_name_ar || roll.item_name || "-"}
                                    </span>
                                    {roll.size_caption && (
                                      <>
                                        <span className="text-muted-foreground">المقاس:</span>
                                        <span className="font-medium">{roll.size_caption}</span>
                                      </>
                                    )}
                                    {roll.raw_material && (
                                      <>
                                        <span className="text-muted-foreground">الخامة:</span>
                                        <span className="font-medium">{roll.raw_material}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex gap-2">
                                  {roll.created_by_name && (
                                    <Badge variant="outline" className="text-xs">
                                      <User className="h-3 w-3 ml-1" />
                                      {roll.created_by_name}
                                    </Badge>
                                  )}
                                  {roll.film_machine_name && (
                                    <Badge variant="outline" className="text-xs">
                                      <Factory className="h-3 w-3 ml-1" />
                                      {roll.film_machine_name}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/production?order=${roll.order_id}`);
                                  }}
                                  data-testid={`button-view-order-${roll.roll_id}`}
                                >
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                  عرض الطلب
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : debouncedQuery || Object.keys(filters).length > 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا توجد نتائج للبحث</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      جرب البحث بكلمات مختلفة أو تعديل الفلاتر
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">ابدأ البحث لعرض النتائج</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      يمكنك البحث برقم الرول، أمر الإنتاج، الطلب أو اسم العميل
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Roll Details Panel */}
          <div className="lg:col-span-1">
            {selectedRollId ? (
              <RollDetailsCard
                rollId={selectedRollId}
                onClose={() => setSelectedRollId(null)}
              />
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">اختر رول لعرض التفاصيل</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    انقر على أي رول من نتائج البحث
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}