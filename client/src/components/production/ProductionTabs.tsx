import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Package, Scissors, Warehouse } from "lucide-react";
import JobOrdersTable from "./JobOrdersTable";
import RollsTable from "./RollsTable";
import ProductionQueue from "./ProductionQueue";
import GroupedPrintingQueue from "./GroupedPrintingQueue";
import OrderProgress from "./OrderProgress";

interface ProductionTabsProps {
  onCreateRoll: () => void;
}

const stages = [
  { id: "film", name: "Film Stage", name_ar: "مرحلة الفيلم", key: "film", icon: Package },
  { id: "printing", name: "Printing Stage", name_ar: "مرحلة الطباعة", key: "printing", icon: Play },
  { id: "cutting", name: "Cutting Stage", name_ar: "مرحلة التقطيع", key: "cutting", icon: Scissors },
  { id: "warehouse", name: "Warehouse Stage", name_ar: "مرحلة المستودع", key: "warehouse", icon: Warehouse },
];

export default function ProductionTabs({ onCreateRoll }: ProductionTabsProps) {
  const [activeStage, setActiveStage] = useState<string>("film");

  // Fetch production queues
  const { data: filmQueue = [] } = useQuery<any[]>({
    queryKey: ['/api/production/film-queue'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: printingQueue = [] } = useQuery<any[]>({
    queryKey: ['/api/production/printing-queue'],
    refetchInterval: 30000
  });

  const { data: cuttingQueue = [] } = useQuery<any[]>({
    queryKey: ['/api/production/cutting-queue'],
    refetchInterval: 30000
  });

  return (
    <Card className="mb-6">
      <Tabs value={activeStage} onValueChange={setActiveStage}>
        <div className="border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-4 bg-transparent p-0">
            {stages.map((stage) => {
              const Icon = stage.icon;
              let queueCount = 0;
              
              if (stage.key === 'film') queueCount = filmQueue.length;
              else if (stage.key === 'printing') queueCount = printingQueue.length;
              else if (stage.key === 'cutting') queueCount = cuttingQueue.length;
              
              return (
                <TabsTrigger 
                  key={stage.id}
                  value={stage.id}
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary py-4 px-2 text-sm font-medium rounded-none flex items-center gap-2"
                  data-testid={`tab-${stage.key}`}
                >
                  <Icon className="h-4 w-4" />
                  {stage.name_ar}
                  {queueCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {queueCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Film Stage - Job Orders and Roll Creation */}
        <TabsContent value="film" className="mt-0">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <CardTitle className="text-lg">قائمة انتظار الفيلم</CardTitle>
              <Button onClick={onCreateRoll} className="mt-2 lg:mt-0" data-testid="button-create-roll">
                إنشاء رول جديد
              </Button>
            </div>
            
            <JobOrdersTable stage="film" onCreateRoll={onCreateRoll} />
          </CardContent>
        </TabsContent>

        {/* Printing Stage - Rolls Ready for Printing */}
        <TabsContent value="printing" className="mt-0">
          <CardContent className="p-6">
            <CardTitle className="text-lg mb-4">قائمة انتظار الطباعة</CardTitle>
            <GroupedPrintingQueue items={printingQueue} />
          </CardContent>
        </TabsContent>

        {/* Cutting Stage - Printed Rolls Ready for Cutting */}
        <TabsContent value="cutting" className="mt-0">
          <CardContent className="p-6">
            <CardTitle className="text-lg mb-4">قائمة انتظار التقطيع</CardTitle>
            <ProductionQueue queueType="cutting" items={cuttingQueue} />
          </CardContent>
        </TabsContent>

        {/* Warehouse Stage - Cut Items for Storage */}
        <TabsContent value="warehouse" className="mt-0">
          <CardContent className="p-6">
            <CardTitle className="text-lg mb-4">استلام المستودع</CardTitle>
            <OrderProgress />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
