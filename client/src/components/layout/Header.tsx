import { Bot } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "../../hooks/use-auth";
import { NotificationBell } from "../notifications/NotificationBell";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { useTranslation } from 'react-i18next';

const FactoryLogoHPNGWg = "/attached_assets/FactoryLogoHPNGW.png";

export default function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className={t("components.layout.header.name.bg_white_shadow_sm_border_b_border_gray_200_sticky_top_0_z_50")}>
      <div className={t("components.layout.header.name.flex_items_center_justify_between_px_4_py_3")}>
        <div className={t("components.layout.header.name.flex_items_center_space_x_4_space_x_reverse")}>
          <div className={t("components.layout.header.name.flex_items_center_justify_center_w_10_h_10_rounded_lg_overflow_hidden")}>
            <img
              src={FactoryLogoHPNGWg}
              alt={t('header.logoAlt')}
              className={t("components.layout.header.name.w_full_h_full_object_contain_mt_0px_mb_0px_pt_0px_pb_0px_")}
            />
          </div>
          <div>
            <h1 className={t("components.layout.header.name.text_xl_font_bold_text_gray_900")}>{t('header.title')}</h1>
            <p className={t("components.layout.header.name.text_sm_text_gray_600")}>
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        <div className={t("components.layout.header.name.flex_items_center_space_x_3_space_x_reverse")}>
          <Button variant="default" size="sm" className={t("components.layout.header.name.btn_primary")}>
            <Bot className={t("components.layout.header.name.h_4_w_4_ml_2")} />
            <span className={t("components.layout.header.name.hidden_sm_inline")}>{t('header.aiAssistant')}</span>
          </Button>

          <LanguageSwitcher />

          <NotificationBell />

          <div className={t("components.layout.header.name.flex_items_center_space_x_3_space_x_reverse")}>
            <div className={t("components.layout.header.name.text_right_hidden_sm_block")}>
              <p className={t("components.layout.header.name.text_sm_font_medium_text_gray_900")}>
                {user?.display_name_ar || user?.display_name || user?.username}
              </p>
              <p className={t("components.layout.header.name.text_xs_text_gray_600")}>
                {user?.role_name_ar || user?.role_name || t('header.user')}
              </p>
            </div>
            <button
              onClick={logout}
              className={t("components.layout.header.name.h_8_w_8_bg_primary_rounded_full_flex_items_center_justify_center_text_primary_foreground_font_medium_text_sm_hover_bg_primary_90_transition_colors")}
            >
              {(
                user?.display_name_ar ||
                user?.display_name ||
                user?.username ||
                "م"
              ).charAt(0)}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
