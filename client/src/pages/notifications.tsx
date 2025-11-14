import React from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import NotificationCenter from "../components/notifications/NotificationCenter";

export default function NotificationsPage() {
  return (
    <div className={t("pages.notifications.name.min_h_screen_bg_gray_50_dark_bg_gray_900")}>
      <Header />

      <div className={t("pages.notifications.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.notifications.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          <div className={t("pages.notifications.name.max_w_7xl_mx_auto")}>
            <NotificationCenter />
          </div>
        </main>
      </div>
    </div>
  );
}
