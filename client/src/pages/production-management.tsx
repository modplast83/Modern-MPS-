import { lazy, Suspense } from "react";
import { useRoute, Redirect } from "wouter";
import { Skeleton } from "../components/ui/skeleton";

// استيراد كسول للصفحات
const ProductionOrdersManagement = lazy(() => import("./ProductionOrdersManagement"));
const ProductionQueues = lazy(() => import("./ProductionQueues"));
const RollSearch = lazy(() => import("./RollSearch"));
const ProductionReports = lazy(() => import("./ProductionReports"));

type TabValue = "roll-search" | "production-orders" | "production-queues" | "production-reports";

export default function ProductionManagement() {
  const [, params] = useRoute("/production-management/:tab?");
  
  // تحديد التبويب النشط من URL
  const tab = params?.tab as TabValue | undefined;
  
  // التوجيه إلى التبويب الافتراضي إذا لم يكن محدداً
  if (!tab) {
    return <Redirect to="/production-management/production-orders" />;
  }
  
  // حالة التحميل
  const LoadingFallback = () => (
    <div className="space-y-4 p-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
  
  // عرض الصفحة المناسبة بناءً على التبويب
  return (
    <Suspense fallback={<LoadingFallback />}>
      {tab === "production-orders" && <ProductionOrdersManagement />}
      {tab === "production-queues" && <ProductionQueues />}
      {tab === "roll-search" && <RollSearch />}
      {tab === "production-reports" && <ProductionReports />}
      {!["production-orders", "production-queues", "roll-search", "production-reports"].includes(tab) && (
        <Redirect to="/production-management/production-orders" />
      )}
    </Suspense>
  );
}
