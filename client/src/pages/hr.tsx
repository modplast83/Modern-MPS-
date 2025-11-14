import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import HRTabs from "../components/hr/HRTabs";

export default function HR() {
  return (
    <div className={t("pages.hr.name.min_h_screen_bg_gray_50_dark_bg_gray_900")}>
      <Header />

      <div className={t("pages.hr.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.hr.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          <HRTabs />
        </main>
      </div>
    </div>
  );
}
