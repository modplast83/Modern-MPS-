import { Card, CardContent } from "../components/ui/card";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className={t("pages.not-found.name.min_h_screen_w_full_flex_items_center_justify_center_bg_gray_50")}>
      <Card className={t("pages.not-found.name.w_full_max_w_md_mx_4")}>
        <CardContent className={t("pages.not-found.name.pt_6")}>
          <div className={t("pages.not-found.name.flex_mb_4_gap_2")}>
            <AlertCircle className={t("pages.not-found.name.h_8_w_8_text_red_500")} />
            <h1 className={t("pages.not-found.name.text_2xl_font_bold_text_gray_900")}>
              {t('notFound.title')}
            </h1>
          </div>

          <p className={t("pages.not-found.name.mt_4_text_sm_text_gray_600")}>
            {t('notFound.message')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
