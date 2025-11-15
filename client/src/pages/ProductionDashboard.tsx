import { useState, useMemo } from "react";
import { useAuth } from "../hooks/use-auth";
import { userHasPermission } from "../utils/roleUtils";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MobileNav from "../components/layout/MobileNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Film, Printer, Scissors, AlertCircle } from "lucide-react";
import FilmOperatorDashboard from "./FilmOperatorDashboard";
import PrintingOperatorDashboard from "./PrintingOperatorDashboard";
import CuttingOperatorDashboard from "./CuttingOperatorDashboard";

export default function ProductionDashboard() {
  const { user } = useAuth();

  const canViewFilm = useMemo(() => 
    userHasPermission(user, 'view_film_dashboard'), 
    [user]
  );
  
  const canViewPrinting = useMemo(() => 
    userHasPermission(user, 'view_printing_dashboard'), 
    [user]
  );
  
  const canViewCutting = useMemo(() => 
    userHasPermission(user, 'view_cutting_dashboard'), 
    [user]
  );

  const availableTabs = useMemo(() => {
    const tabs = [];
    if (canViewFilm) tabs.push('film');
    if (canViewPrinting) tabs.push('printing');
    if (canViewCutting) tabs.push('cutting');
    return tabs;
  }, [canViewFilm, canViewPrinting, canViewCutting]);

  const [activeTab, setActiveTab] = useState(availableTabs[0] || 'film');

  if (availableTabs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex">
          <Sidebar />
          <MobileNav />
          <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
            <Card className="mt-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <CardTitle>لا توجد صلاحيات</CardTitle>
                    <CardDescription>
                      ليس لديك صلاحيات الوصول إلى أي من لوحات الإنتاج
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  يرجى التواصل مع المدير للحصول على الصلاحيات المناسبة.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:mr-64 p-4 pb-20 lg:pb-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              لوحة الإنتاج
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              إدارة مراحل الإنتاج المختلفة من خلال اللوحات المتخصصة
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2 h-auto bg-transparent">
              {canViewFilm && (
                <TabsTrigger
                  value="film"
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md p-4 h-auto"
                  data-testid="tab-film-operator"
                >
                  <Film className="h-5 w-5" />
                  <div className="text-right">
                    <div className="font-semibold">عامل الفيلم</div>
                    <div className="text-xs text-muted-foreground">إنشاء البكرات</div>
                  </div>
                  {activeTab === 'film' && (
                    <Badge variant="default" className="mr-auto">نشط</Badge>
                  )}
                </TabsTrigger>
              )}

              {canViewPrinting && (
                <TabsTrigger
                  value="printing"
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md p-4 h-auto"
                  data-testid="tab-printing-operator"
                >
                  <Printer className="h-5 w-5" />
                  <div className="text-right">
                    <div className="font-semibold">عامل الطباعة</div>
                    <div className="text-xs text-muted-foreground">طباعة البكرات</div>
                  </div>
                  {activeTab === 'printing' && (
                    <Badge variant="default" className="mr-auto">نشط</Badge>
                  )}
                </TabsTrigger>
              )}

              {canViewCutting && (
                <TabsTrigger
                  value="cutting"
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-md p-4 h-auto"
                  data-testid="tab-cutting-operator"
                >
                  <Scissors className="h-5 w-5" />
                  <div className="text-right">
                    <div className="font-semibold">عامل التقطيع</div>
                    <div className="text-xs text-muted-foreground">تقطيع البكرات</div>
                  </div>
                  {activeTab === 'cutting' && (
                    <Badge variant="default" className="mr-auto">نشط</Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            {canViewFilm && (
              <TabsContent value="film" className="mt-0">
                <FilmOperatorDashboard hideLayout={true} />
              </TabsContent>
            )}

            {canViewPrinting && (
              <TabsContent value="printing" className="mt-0">
                <PrintingOperatorDashboard hideLayout={true} />
              </TabsContent>
            )}

            {canViewCutting && (
              <TabsContent value="cutting" className="mt-0">
                <CuttingOperatorDashboard hideLayout={true} />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
