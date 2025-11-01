import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  X,
  Package,
  Printer,
  FileText,
  QrCode,
  Weight,
  Calendar,
  User,
  Factory,
  Film,
  PrinterIcon as PrintIcon,
  Scissors,
  CheckCircle,
  Clock,
  ExternalLink,
  Hash,
  Activity,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Phone,
  History as HistoryIcon,
} from "lucide-react";
import { printRollLabel } from "./RollLabelPrint";

interface RollDetailsCardProps {
  rollId: number;
  onClose?: () => void;
}

interface RollDetails {
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
  // Production order info
  production_order_id: number;
  production_order_number: string;
  production_quantity_kg: string;
  production_final_quantity_kg: string;
  production_status: string;
  production_overrun_percentage?: string;
  // Order info
  order_id: number;
  order_number: string;
  order_status: string;
  order_total_quantity: string;
  order_delivery_date: string;
  // Customer info
  customer_id: string;
  customer_name: string;
  customer_name_ar?: string;
  customer_phone?: string;
  customer_city?: string;
  // Product info
  item_name?: string;
  item_name_ar?: string;
  size_caption?: string;
  raw_material?: string;
  color?: string;
  punching?: string;
  thickness?: string;
  // Machine info
  film_machine_id?: string;
  film_machine_name?: string;
  film_machine_name_ar?: string;
  printing_machine_id?: string;
  printing_machine_name?: string;
  printing_machine_name_ar?: string;
  cutting_machine_id?: string;
  cutting_machine_name?: string;
  cutting_machine_name_ar?: string;
  // Operator info
  created_by?: number;
  created_by_name?: string;
  created_by_name_ar?: string;
  printed_by?: number;
  printed_by_name?: string;
  printed_by_name_ar?: string;
  cut_by?: number;
  cut_by_name?: string;
  cut_by_name_ar?: string;
  // Cuts info
  cuts?: Array<{
    cut_id: number;
    cut_number: string;
    weight_kg: string;
    pkt_count?: number;
    quality_rating?: number;
    created_at: string;
    created_by_name?: string;
  }>;
  cuts_count?: number;
  total_cuts_weight?: number;
}

interface RollHistory {
  stage: string;
  stage_ar: string;
  timestamp: string;
  machine_id?: string;
  operator_id?: number;
  operator_name?: string;
  weight_kg?: string;
  cut_weight_total_kg?: string;
  waste_kg?: string;
  cut_number?: string;
  pkt_count?: number;
  status: string;
  icon: string;
}

export default function RollDetailsCard({ rollId, onClose }: RollDetailsCardProps) {
  const { toast } = useToast();

  // Fetch roll details
  const { data: rollDetails, isLoading: isLoadingDetails } = useQuery<RollDetails>({
    queryKey: [`/api/rolls/${rollId}/full-details`],
    enabled: !!rollId,
  });

  // Fetch roll history
  const { data: rollHistory = [], isLoading: isLoadingHistory } = useQuery<RollHistory[]>({
    queryKey: [`/api/rolls/${rollId}/history`],
    enabled: !!rollId,
  });

  // Get stage name in Arabic
  const getStageNameAr = (stage?: string) => {
    switch (stage) {
      case "film": return "فيلم";
      case "printing": return "طباعة";
      case "cutting": return "تقطيع";
      case "done": return "مكتمل";
      default: return stage || "-";
    }
  };

  // Get stage color
  const getStageColor = (stage?: string) => {
    switch (stage) {
      case "film": return "default";
      case "printing": return "secondary";
      case "cutting": return "warning";
      case "done": return "success";
      default: return "default";
    }
  };

  // Get stage icon
  const getStageIcon = (stage?: string) => {
    switch (stage) {
      case "film": return <Film className="h-4 w-4" />;
      case "printing": return <PrintIcon className="h-4 w-4" />;
      case "cutting": return <Scissors className="h-4 w-4" />;
      case "done": return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // Get history icon component
  const getHistoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Film": return <Film className="h-4 w-4" />;
      case "Printer": return <PrintIcon className="h-4 w-4" />;
      case "Scissors": return <Scissors className="h-4 w-4" />;
      case "Package": return <Package className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Handle print
  const handlePrint = () => {
    if (!rollDetails) return;

    printRollLabel({
      roll: {
        id: rollDetails.roll_id,
        roll_number: rollDetails.roll_number,
        roll_seq: rollDetails.roll_seq,
        weight_kg: parseFloat(rollDetails.weight_kg),
        qr_code_text: rollDetails.qr_code_text,
        qr_png_base64: rollDetails.qr_png_base64,
        created_at: rollDetails.created_at,
        created_by_name: rollDetails.created_by_name,
        printed_by_name: rollDetails.printed_by_name,
        printed_at: rollDetails.printed_at,
        cut_by_name: rollDetails.cut_by_name,
        cut_at: rollDetails.cut_completed_at,
        cut_weight_total_kg: rollDetails.cut_weight_total_kg ? parseFloat(rollDetails.cut_weight_total_kg) : undefined,
        status: rollDetails.stage,
        film_machine_name: rollDetails.film_machine_name,
        printing_machine_name: rollDetails.printing_machine_name,
        cutting_machine_name: rollDetails.cutting_machine_name,
      },
      productionOrder: {
        production_order_number: rollDetails.production_order_number,
        item_name: rollDetails.item_name,
        item_name_ar: rollDetails.item_name_ar,
        size_caption: rollDetails.size_caption,
        color: rollDetails.color,
        raw_material: rollDetails.raw_material,
        punching: rollDetails.punching,
      },
      order: {
        order_number: rollDetails.order_number,
        customer_name: rollDetails.customer_name,
        customer_name_ar: rollDetails.customer_name_ar,
      },
    });

    toast({
      title: "تم إرسال الطباعة",
      description: "سيتم فتح نافذة الطباعة",
    });
  };

  // Calculate efficiency
  const calculateEfficiency = () => {
    if (!rollDetails) return 0;
    const totalWeight = parseFloat(rollDetails.weight_kg);
    const cutWeight = parseFloat(rollDetails.cut_weight_total_kg || "0");
    if (totalWeight === 0) return 0;
    return ((cutWeight / totalWeight) * 100).toFixed(1);
  };

  if (isLoadingDetails) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    );
  }

  if (!rollDetails) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد تفاصيل متاحة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6" />
              {rollDetails.roll_number}
            </CardTitle>
            <CardDescription className="mt-1">
              {rollDetails.customer_name_ar || rollDetails.customer_name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStageColor(rollDetails.stage) as any}>
              {getStageIcon(rollDetails.stage)}
              {getStageNameAr(rollDetails.stage)}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-details">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">التفاصيل</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">السجل</TabsTrigger>
            <TabsTrigger value="cuts" data-testid="tab-cuts">القطع</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">معلومات أساسية</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        رقم التسلسل
                      </span>
                      <span className="font-medium">{rollDetails.roll_seq}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        تاريخ الإنشاء
                      </span>
                      <span className="font-medium">
                        {format(new Date(rollDetails.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Weight className="h-3 w-3" />
                        الوزن الأصلي
                      </span>
                      <span className="font-medium">{rollDetails.weight_kg} كجم</span>
                    </div>
                    {rollDetails.cut_weight_total_kg && parseFloat(rollDetails.cut_weight_total_kg) > 0 && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Weight className="h-3 w-3" />
                            وزن التقطيع
                          </span>
                          <span className="font-medium">{rollDetails.cut_weight_total_kg} كجم</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            الهدر
                          </span>
                          <span className="font-medium text-destructive">
                            {rollDetails.waste_kg || "0"} كجم ({(parseFloat(rollDetails.waste_kg || "0") / parseFloat(rollDetails.weight_kg) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            الكفاءة
                          </span>
                          <span className="font-medium text-green-600">
                            {calculateEfficiency()}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Product Info */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">معلومات المنتج</h3>
                  <div className="space-y-2">
                    {rollDetails.item_name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">المنتج</span>
                        <span className="font-medium">
                          {rollDetails.item_name_ar || rollDetails.item_name}
                        </span>
                      </div>
                    )}
                    {rollDetails.size_caption && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">المقاس</span>
                        <span className="font-medium">{rollDetails.size_caption}</span>
                      </div>
                    )}
                    {rollDetails.raw_material && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">الخامة</span>
                        <span className="font-medium">{rollDetails.raw_material}</span>
                      </div>
                    )}
                    {rollDetails.color && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">اللون</span>
                        <span className="font-medium">{rollDetails.color}</span>
                      </div>
                    )}
                    {rollDetails.punching && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">التخريم</span>
                        <span className="font-medium">{rollDetails.punching}</span>
                      </div>
                    )}
                    {rollDetails.thickness && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">السماكة</span>
                        <span className="font-medium">{rollDetails.thickness}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Production Info */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">معلومات الإنتاج</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">أمر الإنتاج</span>
                      <span className="font-medium">{rollDetails.production_order_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">رقم الطلب</span>
                      <span className="font-medium">{rollDetails.order_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">كمية الإنتاج</span>
                      <span className="font-medium">{rollDetails.production_quantity_kg} كجم</span>
                    </div>
                    {rollDetails.production_overrun_percentage && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">نسبة الزيادة</span>
                        <span className="font-medium">{rollDetails.production_overrun_percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">معلومات العميل</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">الاسم</span>
                      <span className="font-medium">
                        {rollDetails.customer_name_ar || rollDetails.customer_name}
                      </span>
                    </div>
                    {rollDetails.customer_city && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          المدينة
                        </span>
                        <span className="font-medium">{rollDetails.customer_city}</span>
                      </div>
                    )}
                    {rollDetails.customer_phone && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          الهاتف
                        </span>
                        <span className="font-medium">{rollDetails.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Machines & Operators */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">الماكينات والعمال</h3>
                  <div className="space-y-2">
                    {/* Film */}
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Film className="h-3 w-3" />
                        <span>مرحلة الفيلم</span>
                      </div>
                      <div className="mr-5 space-y-1">
                        {rollDetails.film_machine_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Factory className="h-3 w-3" />
                              الماكينة
                            </span>
                            <span className="font-medium">
                              {rollDetails.film_machine_name_ar || rollDetails.film_machine_name}
                            </span>
                          </div>
                        )}
                        {rollDetails.created_by_name && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              العامل
                            </span>
                            <span className="font-medium">
                              {rollDetails.created_by_name_ar || rollDetails.created_by_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Printing */}
                    {rollDetails.printed_at && (
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <PrintIcon className="h-3 w-3" />
                          <span>مرحلة الطباعة</span>
                        </div>
                        <div className="mr-5 space-y-1">
                          {rollDetails.printing_machine_name && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Factory className="h-3 w-3" />
                                الماكينة
                              </span>
                              <span className="font-medium">
                                {rollDetails.printing_machine_name_ar || rollDetails.printing_machine_name}
                              </span>
                            </div>
                          )}
                          {rollDetails.printed_by_name && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                العامل
                              </span>
                              <span className="font-medium">
                                {rollDetails.printed_by_name_ar || rollDetails.printed_by_name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              التوقيت
                            </span>
                            <span className="font-medium">
                              {format(new Date(rollDetails.printed_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cutting */}
                    {rollDetails.cut_completed_at && (
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Scissors className="h-3 w-3" />
                          <span>مرحلة التقطيع</span>
                        </div>
                        <div className="mr-5 space-y-1">
                          {rollDetails.cutting_machine_name && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Factory className="h-3 w-3" />
                                الماكينة
                              </span>
                              <span className="font-medium">
                                {rollDetails.cutting_machine_name_ar || rollDetails.cutting_machine_name}
                              </span>
                            </div>
                          )}
                          {rollDetails.cut_by_name && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                العامل
                              </span>
                              <span className="font-medium">
                                {rollDetails.cut_by_name_ar || rollDetails.cut_by_name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              التوقيت
                            </span>
                            <span className="font-medium">
                              {format(new Date(rollDetails.cut_completed_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="pt-4 border-t flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handlePrint}
                data-testid="button-print-roll"
              >
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </Button>
              {rollDetails.qr_png_base64 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `data:image/png;base64,${rollDetails.qr_png_base64}`;
                    link.download = `qr_${rollDetails.roll_number}.png`;
                    link.click();
                  }}
                  data-testid="button-download-qr"
                >
                  <QrCode className="h-4 w-4 ml-2" />
                  تحميل QR
                </Button>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {isLoadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : rollHistory.length > 0 ? (
              <ScrollArea className="h-[500px] pr-4">
                <div className="relative">
                  <div className="absolute top-0 right-4 w-0.5 h-full bg-border"></div>
                  <div className="space-y-4">
                    {rollHistory.map((event, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === "completed" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}>
                            {getHistoryIcon(event.icon)}
                          </div>
                        </div>
                        <div className="flex-1 pb-4">
                          <Card className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{event.stage_ar}</h4>
                                <Badge variant={event.status === "completed" ? "success" as any : "default"}>
                                  {event.status === "completed" ? "مكتمل" : "قيد التنفيذ"}
                                </Badge>
                              </div>
                              <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm", { locale: ar })}
                                </div>
                                {event.operator_name && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    {event.operator_name}
                                  </div>
                                )}
                                {event.machine_id && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Factory className="h-3 w-3" />
                                    {event.machine_id}
                                  </div>
                                )}
                                {event.weight_kg && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Weight className="h-3 w-3" />
                                    {event.weight_kg} كجم
                                  </div>
                                )}
                                {event.cut_number && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Hash className="h-3 w-3" />
                                    {event.cut_number}
                                  </div>
                                )}
                                {event.pkt_count && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Package className="h-3 w-3" />
                                    {event.pkt_count} رزمة
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا يوجد سجل تحركات</p>
              </div>
            )}
          </TabsContent>

          {/* Cuts Tab */}
          <TabsContent value="cuts" className="space-y-4">
            {rollDetails.cuts && rollDetails.cuts.length > 0 ? (
              <>
                {/* Cuts Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{rollDetails.cuts_count || 0}</p>
                      <p className="text-sm text-muted-foreground">عدد القطع</p>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{rollDetails.total_cuts_weight?.toFixed(2) || 0}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الوزن (كجم)</p>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {rollDetails.cuts.reduce((sum, cut) => sum + (cut.pkt_count || 0), 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">إجمالي الرزم</p>
                    </div>
                  </Card>
                </div>

                {/* Cuts List */}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {rollDetails.cuts.map((cut) => (
                      <Card key={cut.cut_id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{cut.cut_number}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{cut.weight_kg} كجم</span>
                              {cut.pkt_count && <span>{cut.pkt_count} رزمة</span>}
                              {cut.created_by_name && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {cut.created_by_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(cut.created_at), "dd/MM HH:mm")}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-8">
                <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لم يتم التقطيع بعد</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}