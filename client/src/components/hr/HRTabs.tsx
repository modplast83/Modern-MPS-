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
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('hr.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {t('hr.description', 'إدارة شاملة للتدريب وتقييم الأداء والإجازات')}
        </p>
      </div>

      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger
            value="attendance"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <Clock className="w-4 h-4" />
            {t('hr.attendance')}
          </TabsTrigger>
          <TabsTrigger
            value="training"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <GraduationCap className="w-4 h-4" />
            {t('hr.fieldTraining')}
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <Target className="w-4 h-4" />
            {t('hr.performance')}
          </TabsTrigger>
          <TabsTrigger
            value="leaves"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <Calendar className="w-4 h-4" />
            {t('hr.leaves')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <AttendanceManagement />
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <SimpleFieldTraining />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceReviews />
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <LeaveManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
