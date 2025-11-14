import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { formatNumber, formatPercentage } from "../lib/formatNumber";

export default function Quality() {
  const { t } = useTranslation();
  const { data: qualityChecks, isLoading } = useQuery({
    queryKey: ["/api/quality-checks"],
  });

  const getStatusIcon = (result: string) => {
    switch (result) {
      case "pass":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "fail":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (result: string) => {
    switch (result) {
      case "pass":
        return t("quality.passed");
      case "fail":
        return t("quality.failed");
      case "warning":
        return t("quality.warning");
      default:
        return t("quality.pending");
    }
  };

  return (
    <div className={t("pages.quality.name.min_h_screen_bg_gray_50")}>
      <Header />

      <div className={t("pages.quality.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.quality.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          <div className={t("pages.quality.name.mb_6")}>
            <h1 className={t("pages.quality.name.text_2xl_font_bold_text_gray_900_mb_2")}>
              {t("quality.title")}
            </h1>
            <p className={t("pages.quality.name.text_gray_600")}>
              {t("quality.qualityManagement")}
            </p>
          </div>

          <div className={t("pages.quality.name.grid_grid_cols_1_md_grid_cols_4_gap_4_mb_6")}>
            <Card>
              <CardContent className={t("pages.quality.name.p_6")}>
                <div className={t("pages.quality.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.quality.name.text_sm_font_medium_text_gray_600")}>
                      {t("quality.totalInspections")}
                    </p>
                    <p className={t("pages.quality.name.text_2xl_font_bold_text_gray_900")}>
                      {formatNumber(
                        Array.isArray(qualityChecks) ? qualityChecks.length : 0,
                      )}
                    </p>
                  </div>
                  <CheckCircle2 className={t("pages.quality.name.w_8_h_8_text_blue_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.quality.name.p_6")}>
                <div className={t("pages.quality.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.quality.name.text_sm_font_medium_text_gray_600")}>
                      {t("quality.passedInspections")}
                    </p>
                    <p className={t("pages.quality.name.text_2xl_font_bold_text_green_600")}>
                      {formatNumber(
                        Array.isArray(qualityChecks)
                          ? qualityChecks.filter(
                              (q: any) => q.result === "pass",
                            ).length
                          : 0,
                      )}
                    </p>
                  </div>
                  <CheckCircle2 className={t("pages.quality.name.w_8_h_8_text_green_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.quality.name.p_6")}>
                <div className={t("pages.quality.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.quality.name.text_sm_font_medium_text_gray_600")}>
                      {t("quality.failedInspections")}
                    </p>
                    <p className={t("pages.quality.name.text_2xl_font_bold_text_red_600")}>
                      {formatNumber(
                        Array.isArray(qualityChecks)
                          ? qualityChecks.filter(
                              (q: any) => q.result === "fail",
                            ).length
                          : 0,
                      )}
                    </p>
                  </div>
                  <XCircle className={t("pages.quality.name.w_8_h_8_text_red_500")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className={t("pages.quality.name.p_6")}>
                <div className={t("pages.quality.name.flex_items_center_justify_between")}>
                  <div>
                    <p className={t("pages.quality.name.text_sm_font_medium_text_gray_600")}>
                      {t("quality.successRate")}
                    </p>
                    <p className={t("pages.quality.name.text_2xl_font_bold_text_blue_600")}>
                      {formatPercentage(
                        Array.isArray(qualityChecks) && qualityChecks.length > 0
                          ? Math.round(
                              (qualityChecks.filter(
                                (q: any) => q.result === "pass",
                              ).length /
                                qualityChecks.length) *
                                100,
                            )
                          : 0,
                      )}
                    </p>
                  </div>
                  <AlertTriangle className={t("pages.quality.name.w_8_h_8_text_blue_500")} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("quality.latestChecks")}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("common.loading")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className={t("pages.quality.name.min_w_full_divide_y_divide_gray_200")}>
                    <thead className={t("pages.quality.name.bg_gray_50")}>
                      <tr>
                        <th className={t("pages.quality.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                          {t("quality.rollNumber")}
                        </th>
                        <th className={t("pages.quality.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                          {t("quality.checkType")}
                        </th>
                        <th className={t("pages.quality.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                          {t("quality.result")}
                        </th>
                        <th className={t("pages.quality.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                          {t("common.notes")}
                        </th>
                        <th className={t("pages.quality.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                          {t("quality.inspector")}
                        </th>
                        <th className={t("pages.quality.name.px_6_py_3_text_right_text_xs_font_medium_text_gray_500_uppercase")}>
                          {t("common.date")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className={t("pages.quality.name.bg_white_divide_y_divide_gray_200")}>
                      {Array.isArray(qualityChecks) ? (
                        qualityChecks.map((check: any) => (
                          <tr key={check.id} className={t("pages.quality.name.hover_bg_gray_50")}>
                            <td className={t("pages.quality.name.px_6_py_4_whitespace_nowrap_text_sm_font_medium_text_gray_900")}>
                              {check.roll_number}
                            </td>
                            <td className={t("pages.quality.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500")}>
                              {check.check_type}
                            </td>
                            <td className={t("pages.quality.name.px_6_py_4_whitespace_nowrap")}>
                              <div className={t("pages.quality.name.flex_items_center_gap_2")}>
                                {getStatusIcon(check.result)}
                                <Badge
                                  variant={
                                    check.result === "pass"
                                      ? "default"
                                      : check.result === "fail"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {getStatusText(check.result)}
                                </Badge>
                              </div>
                            </td>
                            <td className={t("pages.quality.name.px_6_py_4_text_sm_text_gray_500_max_w_xs_truncate")}>
                              {check.notes || "-"}
                            </td>
                            <td className={t("pages.quality.name.px_6_py_4_whitespace_nowrap_text_sm_text_gray_500")}>
                              {check.inspector_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(check.checked_at).toLocaleDateString(
                                "ar",
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            {t("common.noData")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
