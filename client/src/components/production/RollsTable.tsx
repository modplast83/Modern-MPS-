import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  ArrowRight,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Tag,
  QrCode,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../hooks/use-auth";
import { apiRequest } from "../../lib/queryClient";
import { useTranslation } from "react-i18next";
import type { Roll } from "../../../../shared/schema";

interface RollsTableProps {
  stage: string;
}

interface RollWithDetails extends Roll {
  production_order_number?: string;
  customer_name?: string;
  customer_name_ar?: string;
  machine_name?: string;
  machine_name_ar?: string;
  employee_name?: string;
}

const nextStage = {
  film: "printing",
  printing: "cutting",
  cutting: null,
};

export default function RollsTable({ stage }: RollsTableProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const stageLabels = {
    film: t("production.filmStage"),
    printing: t("production.printingStage"),
    cutting: t("production.cuttingStage"),
  };

  const { data: rolls = [], isLoading } = useQuery<RollWithDetails[]>({
    queryKey: ["/api/rolls", stage],
    queryFn: () => fetch(`/api/rolls?stage=${stage}`).then((res) => res.json()),
  });

  const updateRollMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest(`/api/rolls/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
    onSuccess: (_, { updates }) => {
      // Invalidate all production-related queries for instant updates
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/film-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/printing-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/cutting-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/grouped-cutting-queue"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/production/hierarchical-orders"],
      });

      // Force immediate refetch for real-time updates
      queryClient.refetchQueries({ queryKey: ["/api/rolls"], type: "active" });

      toast({
        title: t("production.rollUpdatedSuccess"),
        description: updates.stage
          ? t("production.rollMovedToStage", { stage: stageLabels[updates.stage as keyof typeof stageLabels] })
          : t("production.rollDataUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("production.rollUpdateFailed"),
        variant: "destructive",
      });
    },
  });

  const moveToNextStage = (rollId: number, currentStage: string) => {
    const next = nextStage[currentStage as keyof typeof nextStage];
    if (!next) {
      // Mark as completed - server will set cut_completed_at and cut_by from session
      updateRollMutation.mutate({
        id: rollId,
        updates: {
          stage: "done",
        },
      });
    } else {
      // Just advance to next stage - server will handle employee tracking from session
      updateRollMutation.mutate({
        id: rollId,
        updates: {
          stage: next,
        },
      });
    }
  };

  const printLabel = async (rollId: number) => {
    try {
      const response = await fetch(`/api/rolls/${rollId}/label`);
      const labelData = await response.json();

      const printWindow = window.open("", "_blank", "width=400,height=500");
      if (!printWindow) {
        toast({
          title: t("production.printWindowError"),
          description: t("production.allowPopups"),
          variant: "destructive",
        });
        return;
      }

      const labelHTML = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>${t("production.rollLabel")} - ${labelData.roll_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              width: 4in;
              height: 5in;
              padding: 10px;
              background: white;
              color: black;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .subtitle {
              font-size: 12px;
              color: #666;
            }
            .content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .info-section {
              margin-bottom: 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 11px;
            }
            .label {
              font-weight: bold;
              color: #333;
            }
            .value {
              text-align: left;
              direction: ltr;
            }
            .qr-section {
              text-align: center;
              border: 1px solid #ddd;
              padding: 8px;
              border-radius: 4px;
            }
            .qr-code {
              max-width: 80px;
              max-height: 80px;
              margin: 0 auto;
            }
            .footer {
              text-align: center;
              font-size: 8px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 5px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${t("production.rollLabel")}</div>
            <div class="subtitle">${labelData.label_dimensions.width} × ${labelData.label_dimensions.height}</div>
          </div>
          
          <div class="content">
            <div class="info-section">
              <div class="info-row">
                <span class="label">${t("production.rollNumber")}:</span>
                <span class="value">${labelData.roll_number}</span>
              </div>
              <div class="info-row">
                <span class="label">${t("production.productionOrderNumber")}:</span>
                <span class="value">${labelData.production_order_number}</span>
              </div>
              <div class="info-row">
                <span class="label">${t("orders.customer")}:</span>
                <span class="value">${labelData.customer_name}</span>
              </div>
              <div class="info-row">
                <span class="label">${t("production.rollWeight")}:</span>
                <span class="value">${labelData.weight_kg}</span>
              </div>
              <div class="info-row">
                <span class="label">${t("production.stage")}:</span>
                <span class="value">${labelData.stage}</span>
              </div>
              <div class="info-row">
                <span class="label">${t("production.machine")}:</span>
                <span class="value">${labelData.machine_name}</span>
              </div>
              <div class="info-row">
                <span class="label">${t("common.date")}:</span>
                <span class="value">${labelData.created_at}</span>
              </div>
            </div>
            
            ${
              labelData.qr_png_base64
                ? `
            <div class="qr-section">
              <img src="data:image/png;base64,${labelData.qr_png_base64}" 
                   alt="{t('components.production.RollsTable.alt.qr_code')}" class="qr-code" />
              <div style="font-size: 8px; margin-top: 3px;">${t("production.scanForInfo")}</div>
            </div>
            `
                : ""
            }
          </div>
          
          <div class="footer">
            ${t("production.printDate")}: ${new Date().toLocaleDateString("ar")} | ${t("production.productionManagement")}
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(labelHTML);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      toast({
        title: t("production.labelSentToPrint"),
        description: t("production.labelFor", { rollNumber: labelData.roll_number }),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/rolls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/hierarchical-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/film-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/printing-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/production/cutting-queue"] });
    } catch (error) {
      console.error("Error printing label:", error);
      toast({
        title: t("production.labelPrintError"),
        description: t("production.labelGenerationError"),
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (stage: string) => {
    switch (stage) {
      case "done":
        return "bg-green-100 text-green-800";
      case "cutting":
        return "bg-blue-100 text-blue-800";
      case "printing":
      case "film":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (stage: string) => {
    switch (stage) {
      case "done":
        return t("production.completed");
      case "cutting":
        return t("production.cuttingStage");
      case "printing":
        return t("production.printingStage");
      case "film":
        return t("production.filmStage");
      default:
        return stage;
    }
  };

  const getStatusIcon = (stage: string) => {
    switch (stage) {
      case "done":
        return <CheckCircle className={t("components.production.rollstable.name.w_4_h_4_text_green_600")} />{t('components.production.RollsTable.;_case_"cutting":_return')}<Clock className={t("components.production.rollstable.name.w_4_h_4_text_blue_600_animate_spin")} />{t('components.production.RollsTable.;_case_"printing":_case_"film":_return')}<AlertCircle className={t("components.production.rollstable.name.w_4_h_4_text_yellow_600")} />{t('components.production.RollsTable.;_default:_return')}<Package className={t("components.production.rollstable.name.w_4_h_4_text_gray_600")} />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={t("components.production.rollstable.name.flex_items_center_gap_2")}>
            <Package className={t("components.production.rollstable.name.w_5_h_5")} />
            {t("orders.rolls")} - {stageLabels[stage as keyof typeof stageLabels]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={t("components.production.rollstable.name.space_y_4")}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={t("components.production.rollstable.name.animate_pulse")}>
                <div className={t("components.production.rollstable.name.flex_items_center_gap_3")}>
                  <div className={t("components.production.rollstable.name.w_16_h_10_bg_gray_200_rounded")}></div>
                  <div className={t("components.production.rollstable.name.flex_1")}>
                    <div className={t("components.production.rollstable.name.h_4_bg_gray_200_rounded_mb_2")}></div>
                    <div className={t("components.production.rollstable.name.h_3_bg_gray_200_rounded_w_2_3")}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rolls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={t("components.production.rollstable.name.flex_items_center_gap_2")}>
            <Package className={t("components.production.rollstable.name.w_5_h_5")} />
            {t("orders.rolls")} - {stageLabels[stage as keyof typeof stageLabels]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={t("components.production.rollstable.name.text_center_py_8")}>
            <Package className={t("components.production.rollstable.name.w_16_h_16_text_gray_400_mx_auto_mb_4")} />
            <p className={t("components.production.rollstable.name.text_gray_500")}>{t("production.noRollsInStage")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={t("components.production.rollstable.name.flex_items_center_gap_2")}>
          <Package className={t("components.production.rollstable.name.w_5_h_5")} />
          {t("orders.rolls")} - {stageLabels[stage as keyof typeof stageLabels]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={t("components.production.rollstable.name.overflow_x_auto")}>
          <table className={t("components.production.rollstable.name.min_w_full_divide_y_divide_gray_200")}>
            <thead className={t("components.production.rollstable.name.bg_gray_50")}>
              <tr>
                <th className={t("components.production.rollstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                  {t("production.rollNumber")}
                </th>
                <th className={t("components.production.rollstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                  {t("production.productionOrderNumber")}
                </th>
                <th className={t("components.production.rollstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                  {t("production.rollWeight")} ({t("warehouse.kg")})
                </th>
                <th className={t("components.production.rollstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                  {t("production.machine")}
                </th>
                <th className={t("components.production.rollstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                  {t("production.responsibleTiming")}
                </th>
                <th className={t("components.production.rollstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                  {t("common.status")}
                </th>
                <th className={t("components.production.rollstable.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase_tracking_wider")}>
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className={t("components.production.rollstable.name.bg_white_divide_y_divide_gray_200")}>
              {rolls.map((roll) => (
                <tr key={roll.id} className={t("components.production.rollstable.name.hover_bg_gray_50")}>
                  <td className={t("components.production.rollstable.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900")}>
                    {roll.roll_number || t("common.notSpecified")}
                  </td>
                  <td className={t("components.production.rollstable.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                    {roll.production_order_number || t("common.notSpecified")}
                  </td>
                  <td className={t("components.production.rollstable.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                    {roll.weight_kg
                      ? parseFloat(roll.weight_kg.toString()).toFixed(1)
                      : t("common.notSpecified")}
                  </td>
                  <td className={t("components.production.rollstable.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_900")}>
                    {roll.machine_name_ar || roll.machine_name || t("common.notSpecified")}
                  </td>
                  <td className={t("components.production.rollstable.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500")}>
                    <div className={t("components.production.rollstable.name.space_y_1")}>
                      <div className={t("components.production.rollstable.name.flex_items_center_gap_1_text_xs")}>
                        <span className={t("components.production.rollstable.name.font_medium_text_blue_600")}>
                          {t("production.production")}:
                        </span>
                        <span>{t("common.user")} {roll.created_by || t("common.notSpecified")}</span>
                      </div>
                      <div className={t("components.production.rollstable.name.text_xs_text_gray_400")}>
                        {roll.created_at
                          ? new Date(roll.created_at).toLocaleDateString("ar")
                          : ""}
                      </div>

                      {roll.printed_by && (
                        <div className={t("components.production.rollstable.name.flex_items_center_gap_1_text_xs")}>
                          <span className={t("components.production.rollstable.name.font_medium_text_green_600")}>
                            {t("production.printing")}:
                          </span>
                          <span>{t("common.user")} {roll.printed_by}</span>
                        </div>
                      )}
                      {roll.printed_at && (
                        <div className={t("components.production.rollstable.name.text_xs_text_gray_400")}>
                          {new Date(roll.printed_at).toLocaleDateString("ar")}
                        </div>
                      )}

                      {roll.cut_by && (
                        <div className={t("components.production.rollstable.name.flex_items_center_gap_1_text_xs")}>
                          <span className={t("components.production.rollstable.name.font_medium_text_purple_600")}>
                            {t("production.cutting")}:
                          </span>
                          <span>{t("common.user")} {roll.cut_by}</span>
                        </div>
                      )}
                      {roll.cut_completed_at && (
                        <div className={t("components.production.rollstable.name.text_xs_text_gray_400")}>
                          {new Date(roll.cut_completed_at).toLocaleDateString(
                            "ar",
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={t("components.production.rollstable.name.px_6_py_4_whitespace_nowrap")}>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(roll.stage || "")}
                    >
                      <div className={t("components.production.rollstable.name.flex_items_center_gap_1")}>
                        {getStatusIcon(roll.stage || "")}
                        {getStatusText(roll.stage || "")}
                      </div>
                    </Badge>
                  </td>
                  <td className={t("components.production.rollstable.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium")}>
                    <div className={t("components.production.rollstable.name.flex_items_center_space_x_2_space_x_reverse")}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printLabel(roll.id)}
                        className={t("components.production.rollstable.name.flex_items_center_gap_1")}
                        data-testid={`button-print-label-${roll.id}`}
                      >
                        <Tag className={t("components.production.rollstable.name.w_3_h_3")} />
                        {t("production.label")}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(`/api/rolls/${roll.id}/qr`, "_blank")
                        }
                        className={t("components.production.rollstable.name.flex_items_center_gap_1")}
                        data-testid={`button-qr-${roll.id}`}
                      >
                        <QrCode className={t("components.production.rollstable.name.w_3_h_3")} />{t('components.production.RollsTable.qr')}</Button>

                      {(roll.stage || "") !== "done" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            moveToNextStage(roll.id, roll.stage || "film")
                          }
                          disabled={updateRollMutation.isPending}
                          className={t("components.production.rollstable.name.flex_items_center_gap_1")}
                          data-testid={`button-next-stage-${roll.id}`}
                        >
                          {nextStage[
                            (roll.stage || "film") as keyof typeof nextStage
                          ] ? (
                            <>
                              <ArrowRight className={t("components.production.rollstable.name.w_3_h_3")} />
                              {t("production.moveToNextStage")}
                            </>{t('components.production.RollsTable.)_:_(')}<>
                              <CheckCircle className={t("components.production.rollstable.name.w_3_h_3")} />
                              {t("production.finish")}
                            </>
                          )}
                        </Button>{t('components.production.RollsTable.)_:_(')}<Badge
                          variant="secondary"
                          className={t("components.production.rollstable.name.bg_green_100_text_green_800")}
                        >
                          {t("production.completed")}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
