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
      case "film": return <Film className={t("components.production.rolldetailscard.name.h_4_w_4")} />{t('components.production.RollDetailsCard.;_case_"printing":_return')}<PrintIcon className={t("components.production.rolldetailscard.name.h_4_w_4")} />{t('components.production.RollDetailsCard.;_case_"cutting":_return')}<Scissors className={t("components.production.rolldetailscard.name.h_4_w_4")} />{t('components.production.RollDetailsCard.;_case_"done":_return')}<CheckCircle className={t("components.production.rolldetailscard.name.h_4_w_4")} />{t('components.production.RollDetailsCard.;_default:_return')}<Package className={t("components.production.rolldetailscard.name.h_4_w_4")} />;
    }
  };

  // Get history icon component
  const getHistoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Film": return <Film className={t("components.production.rolldetailscard.name.h_4_w_4")} />{t('components.production.RollDetailsCard.;_case_"printer":_return')}<PrintIcon className={t("components.production.rolldetailscard.name.h_4_w_4")} />{t('components.production.RollDetailsCard.;_case_"scissors":_return')}<Scissors className={t("components.production.rolldetailscard.name.h_4_w_4")} />{t('components.production.RollDetailsCard.;_case_"package":_return')}<Package className={t("components.production.rolldetailscard.name.h_4_w_4")} />{t('components.production.RollDetailsCard.;_default:_return')}<Activity className={t("components.production.rolldetailscard.name.h_4_w_4")} />;
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
          <Skeleton className={t("components.production.rolldetailscard.name.h_6_w_32")} />
          <Skeleton className={t("components.production.rolldetailscard.name.h_4_w_48_mt_2")} />
        </CardHeader>
        <CardContent className={t("components.production.rolldetailscard.name.space_y_4")}>
          <Skeleton className={t("components.production.rolldetailscard.name.h_24")} />
          <Skeleton className={t("components.production.rolldetailscard.name.h_24")} />
          <Skeleton className={t("components.production.rolldetailscard.name.h_24")} />
        </CardContent>
      </Card>
    );
  }

  if (!rollDetails) {
    return (
      <Card>
        <CardContent className={t("components.production.rolldetailscard.name.text_center_py_8")}>
          <Package className={t("components.production.rolldetailscard.name.h_12_w_12_mx_auto_text_muted_foreground_mb_3")} />
          <p className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.لا_توجد_تفاصيل_متاحة')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={t("components.production.rolldetailscard.name.sticky_top_4")}>
      <CardHeader className={t("components.production.rolldetailscard.name.pb_3")}>
        <div className={t("components.production.rolldetailscard.name.flex_items_start_justify_between")}>
          <div>
            <CardTitle className={t("components.production.rolldetailscard.name.text_2xl_flex_items_center_gap_2")}>
              <Package className={t("components.production.rolldetailscard.name.h_6_w_6")} />
              {rollDetails.roll_number}
            </CardTitle>
            <CardDescription className={t("components.production.rolldetailscard.name.mt_1")}>
              {rollDetails.customer_name_ar || rollDetails.customer_name}
            </CardDescription>
          </div>
          <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2")}>
            <Badge variant={getStageColor(rollDetails.stage) as any}>
              {getStageIcon(rollDetails.stage)}
              {getStageNameAr(rollDetails.stage)}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-details">
                <X className={t("components.production.rolldetailscard.name.h_4_w_4")} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="details" className={t("components.production.rolldetailscard.name.w_full")}>
          <TabsList className={t("components.production.rolldetailscard.name.grid_w_full_grid_cols_3")}>
            <TabsTrigger value="details" data-testid="tab-details">{t('components.production.RollDetailsCard.التفاصيل')}</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">{t('components.production.RollDetailsCard.السجل')}</TabsTrigger>
            <TabsTrigger value="cuts" data-testid="tab-cuts">{t('components.production.RollDetailsCard.القطع')}</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className={t("components.production.rolldetailscard.name.space_y_4")}>
            <ScrollArea className={t("components.production.rolldetailscard.name.h_500px_pr_4")}>
              {/* Basic Info */}
              <div className={t("components.production.rolldetailscard.name.space_y_4")}>
                <div>
                  <h3 className={t("components.production.rolldetailscard.name.font_semibold_text_sm_text_muted_foreground_mb_3")}>{t('components.production.RollDetailsCard.معلومات_أساسية')}</h3>
                  <div className={t("components.production.rolldetailscard.name.space_y_2")}>
                    <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                      <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                        <Hash className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.رقم_التسلسل')}</span>
                      <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.roll_seq}</span>
                    </div>
                    <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                      <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                        <Calendar className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.تاريخ_الإنشاء')}</span>
                      <span className={t("components.production.rolldetailscard.name.font_medium")}>
                        {format(new Date(rollDetails.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </span>
                    </div>
                    <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                      <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                        <Weight className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.الوزن_الأصلي')}</span>
                      <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.weight_kg} كجم</span>
                    </div>
                    {rollDetails.cut_weight_total_kg && parseFloat(rollDetails.cut_weight_total_kg) >{t('components.production.RollDetailsCard.0_&&_(')}<>
                        <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                          <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                            <Weight className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.وزن_التقطيع')}</span>
                          <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.cut_weight_total_kg} كجم</span>
                        </div>
                        <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                          <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                            <AlertTriangle className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.الهدر')}</span>
                          <span className={t("components.production.rolldetailscard.name.font_medium_text_destructive")}>
                            {rollDetails.waste_kg || "0"} كجم ({(parseFloat(rollDetails.waste_kg || "0") / parseFloat(rollDetails.weight_kg) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                          <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                            <TrendingUp className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.الكفاءة')}</span>
                          <span className={t("components.production.rolldetailscard.name.font_medium_text_green_600")}>
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
                  <h3 className={t("components.production.rolldetailscard.name.font_semibold_text_sm_text_muted_foreground_mb_3")}>{t('components.production.RollDetailsCard.معلومات_المنتج')}</h3>
                  <div className={t("components.production.rolldetailscard.name.space_y_2")}>
                    {rollDetails.item_name && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.المنتج')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>
                          {rollDetails.item_name_ar || rollDetails.item_name}
                        </span>
                      </div>
                    )}
                    {rollDetails.size_caption && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.المقاس')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.size_caption}</span>
                      </div>
                    )}
                    {rollDetails.raw_material && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.الخامة')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.raw_material}</span>
                      </div>
                    )}
                    {rollDetails.color && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.اللون')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.color}</span>
                      </div>
                    )}
                    {rollDetails.punching && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.التخريم')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.punching}</span>
                      </div>
                    )}
                    {rollDetails.thickness && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.السماكة')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.thickness}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Production Info */}
                <div>
                  <h3 className={t("components.production.rolldetailscard.name.font_semibold_text_sm_text_muted_foreground_mb_3")}>{t('components.production.RollDetailsCard.معلومات_الإنتاج')}</h3>
                  <div className={t("components.production.rolldetailscard.name.space_y_2")}>
                    <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                      <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.أمر_الإنتاج')}</span>
                      <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.production_order_number}</span>
                    </div>
                    <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                      <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.رقم_الطلب')}</span>
                      <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.order_number}</span>
                    </div>
                    <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                      <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.كمية_الإنتاج')}</span>
                      <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.production_quantity_kg} كجم</span>
                    </div>
                    {rollDetails.production_overrun_percentage && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.نسبة_الزيادة')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.production_overrun_percentage}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Customer Info */}
                <div>
                  <h3 className={t("components.production.rolldetailscard.name.font_semibold_text_sm_text_muted_foreground_mb_3")}>{t('components.production.RollDetailsCard.معلومات_العميل')}</h3>
                  <div className={t("components.production.rolldetailscard.name.space_y_2")}>
                    <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                      <span className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.الاسم')}</span>
                      <span className={t("components.production.rolldetailscard.name.font_medium")}>
                        {rollDetails.customer_name_ar || rollDetails.customer_name}
                      </span>
                    </div>
                    {rollDetails.customer_city && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                          <MapPin className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.المدينة')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.customer_city}</span>
                      </div>
                    )}
                    {rollDetails.customer_phone && (
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between_text_sm")}>
                        <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                          <Phone className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.الهاتف')}</span>
                        <span className={t("components.production.rolldetailscard.name.font_medium")}>{rollDetails.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Machines & Operators */}
                <div>
                  <h3 className={t("components.production.rolldetailscard.name.font_semibold_text_sm_text_muted_foreground_mb_3")}>{t('components.production.RollDetailsCard.الماكينات_والعمال')}</h3>
                  <div className={t("components.production.rolldetailscard.name.space_y_2")}>
                    {/* Film */}
                    <div className={t("components.production.rolldetailscard.name.text_sm_space_y_1")}>
                      <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                        <Film className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                        <span>{t('components.production.RollDetailsCard.مرحلة_الفيلم')}</span>
                      </div>
                      <div className={t("components.production.rolldetailscard.name.mr_5_space_y_1")}>
                        {rollDetails.film_machine_name && (
                          <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                            <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                              <Factory className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.الماكينة')}</span>
                            <span className={t("components.production.rolldetailscard.name.font_medium")}>
                              {rollDetails.film_machine_name_ar || rollDetails.film_machine_name}
                            </span>
                          </div>
                        )}
                        {rollDetails.created_by_name && (
                          <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                            <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                              <User className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.العامل')}</span>
                            <span className={t("components.production.rolldetailscard.name.font_medium")}>
                              {rollDetails.created_by_name_ar || rollDetails.created_by_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Printing */}
                    {rollDetails.printed_at && (
                      <div className={t("components.production.rolldetailscard.name.text_sm_space_y_1")}>
                        <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                          <PrintIcon className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                          <span>{t('components.production.RollDetailsCard.مرحلة_الطباعة')}</span>
                        </div>
                        <div className={t("components.production.rolldetailscard.name.mr_5_space_y_1")}>
                          {rollDetails.printing_machine_name && (
                            <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                              <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                                <Factory className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.الماكينة')}</span>
                              <span className={t("components.production.rolldetailscard.name.font_medium")}>
                                {rollDetails.printing_machine_name_ar || rollDetails.printing_machine_name}
                              </span>
                            </div>
                          )}
                          {rollDetails.printed_by_name && (
                            <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                              <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                                <User className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.العامل')}</span>
                              <span className={t("components.production.rolldetailscard.name.font_medium")}>
                                {rollDetails.printed_by_name_ar || rollDetails.printed_by_name}
                              </span>
                            </div>
                          )}
                          <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                            <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                              <Clock className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.التوقيت')}</span>
                            <span className={t("components.production.rolldetailscard.name.font_medium")}>
                              {format(new Date(rollDetails.printed_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cutting */}
                    {rollDetails.cut_completed_at && (
                      <div className={t("components.production.rolldetailscard.name.text_sm_space_y_1")}>
                        <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                          <Scissors className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                          <span>{t('components.production.RollDetailsCard.مرحلة_التقطيع')}</span>
                        </div>
                        <div className={t("components.production.rolldetailscard.name.mr_5_space_y_1")}>
                          {rollDetails.cutting_machine_name && (
                            <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                              <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                                <Factory className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.الماكينة')}</span>
                              <span className={t("components.production.rolldetailscard.name.font_medium")}>
                                {rollDetails.cutting_machine_name_ar || rollDetails.cutting_machine_name}
                              </span>
                            </div>
                          )}
                          {rollDetails.cut_by_name && (
                            <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                              <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                                <User className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.العامل')}</span>
                              <span className={t("components.production.rolldetailscard.name.font_medium")}>
                                {rollDetails.cut_by_name_ar || rollDetails.cut_by_name}
                              </span>
                            </div>
                          )}
                          <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                            <span className={t("components.production.rolldetailscard.name.text_muted_foreground_flex_items_center_gap_1")}>
                              <Clock className={t("components.production.rolldetailscard.name.h_3_w_3")} />{t('components.production.RollDetailsCard.التوقيت')}</span>
                            <span className={t("components.production.rolldetailscard.name.font_medium")}>
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
            <div className={t("components.production.rolldetailscard.name.pt_4_border_t_flex_gap_2")}>
              <Button
                variant="outline"
                size="sm"
                className={t("components.production.rolldetailscard.name.flex_1")}
                onClick={handlePrint}
                data-testid="button-print-roll"
              >
                <Printer className={t("components.production.rolldetailscard.name.h_4_w_4_ml_2")} />{t('components.production.RollDetailsCard.طباعة')}</Button>
              {rollDetails.qr_png_base64 && (
                <Button
                  variant="outline"
                  size="sm"
                  className={t("components.production.rolldetailscard.name.flex_1")}
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `data:image/png;base64,${rollDetails.qr_png_base64}`;
                    link.download = `qr_${rollDetails.roll_number}.png`;
                    link.click();
                  }}
                  data-testid="button-download-qr"
                >
                  <QrCode className={t("components.production.rolldetailscard.name.h_4_w_4_ml_2")} />{t('components.production.RollDetailsCard.تحميل_qr')}</Button>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className={t("components.production.rolldetailscard.name.space_y_4")}>
            {isLoadingHistory ? (
              <div className={t("components.production.rolldetailscard.name.space_y_3")}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className={t("components.production.rolldetailscard.name.h_20")} />
                ))}
              </div>
            ) : rollHistory.length >{t('components.production.RollDetailsCard.0_?_(')}<ScrollArea className={t("components.production.rolldetailscard.name.h_500px_pr_4")}>
                <div className={t("components.production.rolldetailscard.name.relative")}>
                  <div className={t("components.production.rolldetailscard.name.absolute_top_0_right_4_w_0_5_h_full_bg_border")}></div>
                  <div className={t("components.production.rolldetailscard.name.space_y_4")}>
                    {rollHistory.map((event, idx) => (
                      <div key={idx} className={t("components.production.rolldetailscard.name.flex_gap_4")}>
                        <div className={t("components.production.rolldetailscard.name.relative")}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === "completed" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}>
                            {getHistoryIcon(event.icon)}
                          </div>
                        </div>
                        <div className={t("components.production.rolldetailscard.name.flex_1_pb_4")}>
                          <Card className={t("components.production.rolldetailscard.name.p_3")}>
                            <div className={t("components.production.rolldetailscard.name.space_y_2")}>
                              <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                                <h4 className={t("components.production.rolldetailscard.name.font_semibold")}>{event.stage_ar}</h4>
                                <Badge variant={event.status === "completed" ? "success" as any : "default"}>
                                  {event.status === "completed" ? "مكتمل" : "قيد التنفيذ"}
                                </Badge>
                              </div>
                              <div className={t("components.production.rolldetailscard.name.text_sm_space_y_1")}>
                                <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                                  <Clock className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                                  {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm", { locale: ar })}
                                </div>
                                {event.operator_name && (
                                  <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                                    <User className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                                    {event.operator_name}
                                  </div>
                                )}
                                {event.machine_id && (
                                  <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                                    <Factory className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                                    {event.machine_id}
                                  </div>
                                )}
                                {event.weight_kg && (
                                  <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                                    <Weight className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                                    {event.weight_kg} كجم
                                  </div>
                                )}
                                {event.cut_number && (
                                  <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                                    <Hash className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                                    {event.cut_number}
                                  </div>
                                )}
                                {event.pkt_count && (
                                  <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2_text_muted_foreground")}>
                                    <Package className={t("components.production.rolldetailscard.name.h_3_w_3")} />
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
              </ScrollArea>{t('components.production.RollDetailsCard.)_:_(')}<div className={t("components.production.rolldetailscard.name.text_center_py_8")}>
                <HistoryIcon className={t("components.production.rolldetailscard.name.h_12_w_12_mx_auto_text_muted_foreground_mb_3")} />
                <p className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.لا_يوجد_سجل_تحركات')}</p>
              </div>
            )}
          </TabsContent>

          {/* Cuts Tab */}
          <TabsContent value="cuts" className={t("components.production.rolldetailscard.name.space_y_4")}>
            {rollDetails.cuts && rollDetails.cuts.length >{t('components.production.RollDetailsCard.0_?_(')}<>
                {/* Cuts Summary */}
                <div className={t("components.production.rolldetailscard.name.grid_grid_cols_3_gap_3")}>
                  <Card className={t("components.production.rolldetailscard.name.p_3")}>
                    <div className={t("components.production.rolldetailscard.name.text_center")}>
                      <p className={t("components.production.rolldetailscard.name.text_2xl_font_bold")}>{rollDetails.cuts_count || 0}</p>
                      <p className={t("components.production.rolldetailscard.name.text_sm_text_muted_foreground")}>{t('components.production.RollDetailsCard.عدد_القطع')}</p>
                    </div>
                  </Card>
                  <Card className={t("components.production.rolldetailscard.name.p_3")}>
                    <div className={t("components.production.rolldetailscard.name.text_center")}>
                      <p className={t("components.production.rolldetailscard.name.text_2xl_font_bold")}>{rollDetails.total_cuts_weight?.toFixed(2) || 0}</p>
                      <p className={t("components.production.rolldetailscard.name.text_sm_text_muted_foreground")}>{t('components.production.RollDetailsCard.إجمالي_الوزن_(كجم)')}</p>
                    </div>
                  </Card>
                  <Card className={t("components.production.rolldetailscard.name.p_3")}>
                    <div className={t("components.production.rolldetailscard.name.text_center")}>
                      <p className={t("components.production.rolldetailscard.name.text_2xl_font_bold")}>
                        {rollDetails.cuts.reduce((sum, cut) => sum + (cut.pkt_count || 0), 0)}
                      </p>
                      <p className={t("components.production.rolldetailscard.name.text_sm_text_muted_foreground")}>{t('components.production.RollDetailsCard.إجمالي_الرزم')}</p>
                    </div>
                  </Card>
                </div>

                {/* Cuts List */}
                <ScrollArea className={t("components.production.rolldetailscard.name.h_400px_pr_4")}>
                  <div className={t("components.production.rolldetailscard.name.space_y_2")}>
                    {rollDetails.cuts.map((cut) => (
                      <Card key={cut.cut_id} className={t("components.production.rolldetailscard.name.p_3")}>
                        <div className={t("components.production.rolldetailscard.name.flex_items_center_justify_between")}>
                          <div className={t("components.production.rolldetailscard.name.space_y_1")}>
                            <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_2")}>
                              <Package className={t("components.production.rolldetailscard.name.h_4_w_4_text_primary")} />
                              <span className={t("components.production.rolldetailscard.name.font_semibold")}>{cut.cut_number}</span>
                            </div>
                            <div className={t("components.production.rolldetailscard.name.flex_items_center_gap_4_text_sm_text_muted_foreground")}>
                              <span>{cut.weight_kg} كجم</span>
                              {cut.pkt_count && <span>{cut.pkt_count} رزمة</span>}
                              {cut.created_by_name && (
                                <span className={t("components.production.rolldetailscard.name.flex_items_center_gap_1")}>
                                  <User className={t("components.production.rolldetailscard.name.h_3_w_3")} />
                                  {cut.created_by_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={t("components.production.rolldetailscard.name.text_sm_text_muted_foreground")}>
                            {format(new Date(cut.created_at), "dd/MM HH:mm")}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>{t('components.production.RollDetailsCard.)_:_(')}<div className={t("components.production.rolldetailscard.name.text_center_py_8")}>
                <Scissors className={t("components.production.rolldetailscard.name.h_12_w_12_mx_auto_text_muted_foreground_mb_3")} />
                <p className={t("components.production.rolldetailscard.name.text_muted_foreground")}>{t('components.production.RollDetailsCard.لم_يتم_التقطيع_بعد')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}