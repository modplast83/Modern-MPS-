import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Target, Calendar, Users } from "lucide-react";
import TrainingPrograms from "./TrainingPrograms.tsx";
import PerformanceReviews from "./PerformanceReviews.tsx";
import LeaveManagement from "./LeaveManagement.tsx";

export default function HRTabs() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          نظام الموارد البشرية المتقدم
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          إدارة شاملة للتدريب وتقييم الأداء والإجازات
        </p>
      </div>

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger 
            value="training" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <GraduationCap className="w-4 h-4" />
            منصة التدريب الإلكتروني
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <Target className="w-4 h-4" />
            تقييم الأداء
          </TabsTrigger>
          <TabsTrigger 
            value="leaves" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
          >
            <Calendar className="w-4 h-4" />
            إدارة الإجازات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-4">
          <TrainingPrograms />
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