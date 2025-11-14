import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Shield, Users, Star } from "lucide-react";

export default function SimpleFieldTraining() {
  const [selectedView, setSelectedView] = useState<
    "programs" | "enrollments" | "evaluations"
  >{t('components.hr.SimpleFieldTraining.("programs");_return_(')}<div className={t("components.hr.simplefieldtraining.name.space_y_6")} dir="rtl">
      {/* Header */}
      <div className={t("components.hr.simplefieldtraining.name.flex_items_center_justify_between")}>
        <div>
          <h2 className={t("components.hr.simplefieldtraining.name.text_2xl_font_bold_text_gray_900_dark_text_white_mb_2")}>{t('components.hr.SimpleFieldTraining.نظام_التدريب_الميداني')}</h2>
          <p className={t("components.hr.simplefieldtraining.name.text_gray_600_dark_text_gray_300")}>{t('components.hr.SimpleFieldTraining.إدارة_التدريبات_العملية_والميدانية_مع_التقييم_وإصدار_الشهادات')}</p>
        </div>
      </div>

      {/* View Tabs */}
      <div className={t("components.hr.simplefieldtraining.name.flex_gap_2_border_b")}>
        <Button
          variant={selectedView === "programs" ? "default" : "ghost"}
          onClick={() => setSelectedView("programs")}
          className={t("components.hr.simplefieldtraining.name.rounded_b_none")}
          data-testid="tab-programs"
        >
          <Shield className={t("components.hr.simplefieldtraining.name.w_4_h_4_ml_2")} />{t('components.hr.SimpleFieldTraining.برامج_التدريب')}</Button>
        <Button
          variant={selectedView === "enrollments" ? "default" : "ghost"}
          onClick={() => setSelectedView("enrollments")}
          className={t("components.hr.simplefieldtraining.name.rounded_b_none")}
          data-testid="tab-enrollments"
        >
          <Users className={t("components.hr.simplefieldtraining.name.w_4_h_4_ml_2")} />{t('components.hr.SimpleFieldTraining.التسجيلات')}</Button>
        <Button
          variant={selectedView === "evaluations" ? "default" : "ghost"}
          onClick={() => setSelectedView("evaluations")}
          className={t("components.hr.simplefieldtraining.name.rounded_b_none")}
          data-testid="tab-evaluations"
        >
          <Star className={t("components.hr.simplefieldtraining.name.w_4_h_4_ml_2")} />{t('components.hr.SimpleFieldTraining.التقييمات')}</Button>
      </div>

      {/* Content based on selected view */}
      {selectedView === "programs" && (
        <Card>
          <CardContent className={t("components.hr.simplefieldtraining.name.flex_flex_col_items_center_justify_center_p_8")}>
            <Shield className={t("components.hr.simplefieldtraining.name.w_16_h_16_text_gray_400_mb_4")} />
            <h3 className={t("components.hr.simplefieldtraining.name.text_lg_font_semibold_text_gray_600_mb_2")}>{t('components.hr.SimpleFieldTraining.نظام_التدريب_الميداني')}</h3>
            <p className={t("components.hr.simplefieldtraining.name.text_gray_500_text_center")}>{t('components.hr.SimpleFieldTraining.تم_تحويل_النظام_من_التدريب_الإلكتروني_إلى_التدريب_الميداني_بنجاح')}</p>
          </CardContent>
        </Card>
      )}

      {selectedView === "enrollments" && (
        <Card>
          <CardContent className={t("components.hr.simplefieldtraining.name.flex_flex_col_items_center_justify_center_p_8")}>
            <Users className={t("components.hr.simplefieldtraining.name.w_16_h_16_text_gray_400_mb_4")} />
            <h3 className={t("components.hr.simplefieldtraining.name.text_lg_font_semibold_text_gray_600_mb_2")}>{t('components.hr.SimpleFieldTraining.إدارة_التسجيلات')}</h3>
            <p className={t("components.hr.simplefieldtraining.name.text_gray_500_text_center")}>{t('components.hr.SimpleFieldTraining.تسجيل_الموظفين_في_برامج_التدريب_الميداني')}</p>
          </CardContent>
        </Card>
      )}

      {selectedView === "evaluations" && (
        <Card>
          <CardContent className={t("components.hr.simplefieldtraining.name.flex_flex_col_items_center_justify_center_p_8")}>
            <Star className={t("components.hr.simplefieldtraining.name.w_16_h_16_text_gray_400_mb_4")} />
            <h3 className={t("components.hr.simplefieldtraining.name.text_lg_font_semibold_text_gray_600_mb_2")}>{t('components.hr.SimpleFieldTraining.نظام_التقييم')}</h3>
            <p className={t("components.hr.simplefieldtraining.name.text_gray_500_text_center")}>{t('components.hr.SimpleFieldTraining.تقييم_التدريب_مع_معايير_الفهم_النظري_والمهارات_العملية_والسلامة')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
