import {
  Home,
  Warehouse,
  ClipboardCheck,
  Database,
  BarChart3,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";

const navItems = [
  { key: "home", icon: Home, path: "/" },
  { key: "warehouse", icon: Warehouse, path: "/warehouse" },
  { key: "quality", icon: ClipboardCheck, path: "/quality" },
  { key: "definitions", icon: Database, path: "/definitions" },
];

export default function MobileNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <div className={t("components.layout.mobilenav.name.lg_hidden_fixed_bottom_0_left_0_right_0_bg_white_border_t_border_gray_200_z_40")}>
      <div className={t("components.layout.mobilenav.name.flex_justify_around_py_1")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link key={item.key} href={item.path}>
              <button
                className={`flex flex-col items-center p-2 min-w-0 ${
                  isActive ? "text-blue-600" : "text-gray-600"
                }`}
                data-testid={`button-nav-${item.key}`}
              >
                <Icon className={t("components.layout.mobilenav.name.h_5_w_5_mb_1")} />
                <span className={t("components.layout.mobilenav.name.text_xs_leading_tight")}>{t(`mobileNav.${item.key}`)}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
