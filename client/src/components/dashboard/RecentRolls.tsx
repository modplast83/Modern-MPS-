import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Package,
  Clock,
  User,
  Settings,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function RecentRolls() {
  const { t } = useTranslation();
  const {
    data: rolls = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/rolls"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return t('production.completed');
      case "in_progress":
        return t('production.inProduction');
      case "pending":
        return t('production.pending');
      case "failed":
        return t('recentRolls.failed');
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className={t("components.dashboard.recentrolls.name.w_4_h_4_text_green_600")} />{t('components.dashboard.RecentRolls.;_case_"in_progress":_return')}<RefreshCw className={t("components.dashboard.recentrolls.name.w_4_h_4_text_blue_600_animate_spin")} />{t('components.dashboard.RecentRolls.;_case_"pending":_return')}<Clock className={t("components.dashboard.recentrolls.name.w_4_h_4_text_yellow_600")} />{t('components.dashboard.RecentRolls.;_case_"failed":_return')}<AlertCircle className={t("components.dashboard.recentrolls.name.w_4_h_4_text_red_600")} />{t('components.dashboard.RecentRolls.;_default:_return')}<Package className={t("components.dashboard.recentrolls.name.w_4_h_4_text_gray_600")} />;
    }
  };

  const recentRolls = Array.isArray(rolls) ? rolls.slice(0, 10) : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={t("components.dashboard.recentrolls.name.flex_items_center_gap_2")}>
            <Package className={t("components.dashboard.recentrolls.name.w_5_h_5")} />
            {t('dashboard.recentRolls')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={t("components.dashboard.recentrolls.name.space_y_4")}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={t("components.dashboard.recentrolls.name.animate_pulse")}>
                <div className={t("components.dashboard.recentrolls.name.flex_items_center_gap_3")}>
                  <div className={t("components.dashboard.recentrolls.name.w_10_h_10_bg_gray_200_rounded")}></div>
                  <div className={t("components.dashboard.recentrolls.name.flex_1")}>
                    <div className={t("components.dashboard.recentrolls.name.h_4_bg_gray_200_rounded_mb_2")}></div>
                    <div className={t("components.dashboard.recentrolls.name.h_3_bg_gray_200_rounded_w_2_3")}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={t("components.dashboard.recentrolls.name.pb_3")}>
        <div className={t("components.dashboard.recentrolls.name.flex_items_center_justify_between")}>
          <CardTitle className={t("components.dashboard.recentrolls.name.flex_items_center_gap_2")}>
            <Package className={t("components.dashboard.recentrolls.name.w_5_h_5")} />
            {t('dashboard.recentRolls')}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={t("components.dashboard.recentrolls.name.w_4_h_4")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={t("components.dashboard.recentrolls.name.p_0")}>
        <ScrollArea className={t("components.dashboard.recentrolls.name.h_80")}>
          {recentRolls.length >{t('components.dashboard.RecentRolls.0_?_(')}<div className={t("components.dashboard.recentrolls.name.p_4_space_y_4")}>
              {recentRolls.map((roll: any) => (
                <div
                  key={roll.id}
                  className={t("components.dashboard.recentrolls.name.border_rounded_lg_p_3_hover_bg_gray_50_transition_colors")}
                >
                  <div className={t("components.dashboard.recentrolls.name.flex_items_start_justify_between")}>
                    <div className={t("components.dashboard.recentrolls.name.flex_items_start_gap_3")}>
                      <div className={t("components.dashboard.recentrolls.name.mt_1")}>{getStatusIcon(roll.status)}</div>
                      <div className={t("components.dashboard.recentrolls.name.flex_1_min_w_0")}>
                        <div className={t("components.dashboard.recentrolls.name.flex_items_center_gap_2_mb_1")}>
                          <h4 className={t("components.dashboard.recentrolls.name.font_medium_text_gray_900_truncate")}>
                            {roll.roll_number}
                          </h4>
                          <Badge className={getStatusColor(roll.status)}>
                            {getStatusText(roll.status)}
                          </Badge>
                        </div>

                        <div className={t("components.dashboard.recentrolls.name.space_y_1_text_sm_text_gray_600")}>
                          <div className={t("components.dashboard.recentrolls.name.flex_items_center_gap_1")}>
                            <Package className={t("components.dashboard.recentrolls.name.w_3_h_3")} />
                            <span>{t('recentRolls.productionOrder')}: {roll.production_order_id}</span>
                          </div>

                          {roll.machine_id && (
                            <div className={t("components.dashboard.recentrolls.name.flex_items_center_gap_1")}>
                              <Settings className={t("components.dashboard.recentrolls.name.w_3_h_3")} />
                              <span>{t('recentRolls.machine')}: {roll.machine_id}</span>
                            </div>
                          )}

                          {roll.employee_id && (
                            <div className={t("components.dashboard.recentrolls.name.flex_items_center_gap_1")}>
                              <User className={t("components.dashboard.recentrolls.name.w_3_h_3")} />
                              <span>{t('recentRolls.operator')}: {roll.employee_id}</span>
                            </div>
                          )}

                          <div className={t("components.dashboard.recentrolls.name.flex_items_center_gap_1")}>
                            <Clock className={t("components.dashboard.recentrolls.name.w_3_h_3")} />
                            <span>
                              {new Date(roll.created_at).toLocaleDateString(
                                "ar",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={t("components.dashboard.recentrolls.name.text_right")}>
                      {roll.length && (
                        <div className={t("components.dashboard.recentrolls.name.text_sm_font_medium_text_gray_900")}>
                          {roll.length} م
                        </div>
                      )}
                      {roll.weight && (
                        <div className={t("components.dashboard.recentrolls.name.text_xs_text_gray_500")}>
                          {roll.weight} كغ
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar for in-progress rolls */}
                  {roll.status === "in_progress" &&
                    roll.length &&
                    roll.target_length && (
                      <div className={t("components.dashboard.recentrolls.name.mt_3")}>
                        <div className={t("components.dashboard.recentrolls.name.flex_justify_between_text_xs_text_gray_600_mb_1")}>
                          <span>{t('recentRolls.progress')}</span>
                          <span>
                            {Math.round(
                              (roll.length / roll.target_length) * 100,
                            )}
                            %
                          </span>
                        </div>
                        <div className={t("components.dashboard.recentrolls.name.w_full_bg_gray_200_rounded_full_h_2")}>
                          <div
                            className={t("components.dashboard.recentrolls.name.bg_blue_600_h_2_rounded_full_transition_all_duration_300")}
                            style={{
                              width: `${Math.min((roll.length / roll.target_length) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>{t('components.dashboard.RecentRolls.)_:_(')}<div className={t("components.dashboard.recentrolls.name.p_8_text_center")}>
              <Package className={t("components.dashboard.recentrolls.name.w_12_h_12_text_gray_400_mx_auto_mb_3")} />
              <p className={t("components.dashboard.recentrolls.name.text_gray_600_mb_2")}>{t('recentRolls.noRolls')}</p>
              <p className={t("components.dashboard.recentrolls.name.text_sm_text_gray_500")}>{t('recentRolls.newRollsAppearHere')}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
