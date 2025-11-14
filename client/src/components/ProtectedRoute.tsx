import { useAuth } from "../hooks/use-auth";
import { canAccessRoute } from "../utils/roleUtils";
import { Redirect } from "wouter";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProtectedRouteProps {
  children: React.ReactNode;
  path: string;
}

export default function ProtectedRoute({ children, path }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className={t("components.protectedroute.name.flex_items_center_justify_center_min_h_screen")}>
        <div className={t("components.protectedroute.name.text_lg_text_gray_600")}>{t("common.loading")}</div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!canAccessRoute(user, path)) {
    const handleLogout = async () => {
      await logout();
      window.location.href = '/login';
    };

    return (
      <div className={t("components.protectedroute.name.flex_flex_col_items_center_justify_center_min_h_screen_bg_gray_50")}>
        <div className={t("components.protectedroute.name.bg_white_p_8_rounded_lg_shadow_lg_max_w_md_w_full_text_center")}>
          <div className={t("components.protectedroute.name.text_6xl_mb_4")}>{t('components.ProtectedRoute.🚫')}</div>
          <div className={t("components.protectedroute.name.text_2xl_font_bold_text_red_600_mb_4")}>{t("login.unauthorized")}</div>
          <div className={t("components.protectedroute.name.text_lg_text_gray_600_mb_6")}>
            {t("login.noPermission")}
          </div>
          
          <div className={t("components.protectedroute.name.border_t_pt_4_mb_4")}>
            <p className={t("components.protectedroute.name.text_sm_text_gray_500_mb_2")}>
              {t("login.currentUser")} <strong>{user.display_name_ar || user.display_name || user.username}</strong>
            </p>
            <p className={t("components.protectedroute.name.text_sm_text_gray_500")}>
              {t("login.role")} <strong>{user.role_name_ar || user.role_name || t("login.notSpecified")}</strong>
            </p>
          </div>
          
          <div className={t("components.protectedroute.name.flex_flex_col_gap_3")}>
            <a
              href="/"
              className={t("components.protectedroute.name.px_4_py_2_bg_blue_600_text_white_rounded_lg_hover_bg_blue_700_transition_colors")}
            >
              {t("login.returnHome")}
            </a>
            
            <button
              onClick={handleLogout}
              className={t("components.protectedroute.name.px_4_py_2_bg_gray_600_text_white_rounded_lg_hover_bg_gray_700_transition_colors_flex_items_center_justify_center_gap_2")}
            >
              <LogOut className={t("components.protectedroute.name.h_4_w_4")} />
              {t("login.logoutAndSwitch")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User has permission, render the page
  return <>{children}</>;
}