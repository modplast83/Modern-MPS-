import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import DashboardStats from "../components/dashboard/DashboardStats";
import Shortcuts from "../components/dashboard/Shortcuts";
import QuickNotes from "../components/dashboard/QuickNotes";
import AIAssistant from "../components/ai/AIAssistant";
import { VoiceAssistant } from "../components/voice/VoiceAssistant";

export default function Dashboard() {
  return (
    <div className={t("pages.dashboard.name.min_h_screen_bg_gray_50")}>
      <Header />

      <div className={t("pages.dashboard.name.flex")}>
        <Sidebar />
        <MobileNav />

        <main className={t("pages.dashboard.name.flex_1_lg_mr_64_p_4_pb_20_lg_pb_4")}>
          <Shortcuts />
          <DashboardStats />

          <div className={t("pages.dashboard.name.mb_6")}>
            <QuickNotes />
          </div>

          <div className={t("pages.dashboard.name.grid_grid_cols_1_lg_grid_cols_2_gap_6_mb_6")}>
            <AIAssistant />
            <VoiceAssistant />
          </div>
        </main>
      </div>
    </div>
  );
}
