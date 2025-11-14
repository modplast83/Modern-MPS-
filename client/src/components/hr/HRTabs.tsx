import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { GraduationCap, Target, Calendar, Users, Clock } from "lucide-react";
import SimpleFieldTraining from "./SimpleFieldTraining.tsx";
import PerformanceReviews from "./PerformanceReviews.tsx";
import LeaveManagement from "./LeaveManagement.tsx";
import AttendanceManagement from "./AttendanceManagement.tsx";
import { useTranslation } from 'react-i18next';

export default function HRTabs() {
  const { t } = useTranslation();

  return (
    <div className={t("components.hr.hrtabs.name.space_y_6")} dir="rtl">
      <div className={t("components.hr.hrtabs.name.text_center")}>
        <h1 className={t("components.hr.hrtabs.name.text_3xl_font_bold_text_gray_900_dark_text_white")}>
          {t('hr.title')}
        </h1>
        <p className={t("components.hr.hrtabs.name.text_gray_600_dark_text_gray_300_mt_2")}>
          {t('hr.description', 'إدارة شاملة للتدريب وتقييم الأداء والإجازات')}
        </p>
      </div>

      <Tabs defaultValue="attendance" className={t("components.hr.hrtabs.name.w_full")}>
        <TabsList className={t("components.hr.hrtabs.name.grid_w_full_grid_cols_4_bg_gray_100_dark_bg_gray_800")}>
          <TabsTrigger
            value="attendance"
            className={t("components.hr.hrtabs.name.flex_items_center_gap_2_data_state_active_bg_white_dark_data_state_active_bg_gray_700")}
          >
            <Clock className={t("components.hr.hrtabs.name.w_4_h_4")} />
            {t('hr.attendance')}
          </TabsTrigger>
          <TabsTrigger
            value="training"
            className={t("components.hr.hrtabs.name.flex_items_center_gap_2_data_state_active_bg_white_dark_data_state_active_bg_gray_700")}
          >
            <GraduationCap className={t("components.hr.hrtabs.name.w_4_h_4")} />
            {t('hr.fieldTraining')}
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className={t("components.hr.hrtabs.name.flex_items_center_gap_2_data_state_active_bg_white_dark_data_state_active_bg_gray_700")}
          >
            <Target className={t("components.hr.hrtabs.name.w_4_h_4")} />
            {t('hr.performance')}
          </TabsTrigger>
          <TabsTrigger
            value="leaves"
            className={t("components.hr.hrtabs.name.flex_items_center_gap_2_data_state_active_bg_white_dark_data_state_active_bg_gray_700")}
          >
            <Calendar className={t("components.hr.hrtabs.name.w_4_h_4")} />
            {t('hr.leaves')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className={t("components.hr.hrtabs.name.space_y_4")}>
          <AttendanceManagement />
        </TabsContent>

        <TabsContent value="training" className={t("components.hr.hrtabs.name.space_y_4")}>
          <SimpleFieldTraining />
        </TabsContent>

        <TabsContent value="performance" className={t("components.hr.hrtabs.name.space_y_4")}>
          <PerformanceReviews />
        </TabsContent>

        <TabsContent value="leaves" className={t("components.hr.hrtabs.name.space_y_4")}>
          <LeaveManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
