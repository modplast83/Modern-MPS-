import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobOrdersTable from "./JobOrdersTable";
import RollsTable from "./RollsTable";
import type { ProductionStage } from "@/types";

interface ProductionTabsProps {
  onCreateRoll: () => void;
}

const stages: ProductionStage[] = [
  { id: "film", name: "Film Stage", name_ar: "مرحلة الفيلم", key: "film", active: true },
  { id: "printing", name: "Printing Stage", name_ar: "مرحلة الطباعة", key: "printing", active: true },
  { id: "cutting", name: "Cutting Stage", name_ar: "مرحلة التقطيع", key: "cutting", active: true },
];

export default function ProductionTabs({ onCreateRoll }: ProductionTabsProps) {
  const [activeStage, setActiveStage] = useState<string>("film");

  return (
    <Card className="mb-6">
      <Tabs value={activeStage} onValueChange={setActiveStage}>
        <div className="border-b border-gray-200">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0">
            {stages.map((stage) => (
              <TabsTrigger 
                key={stage.id}
                value={stage.id}
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary py-4 px-1 text-sm font-medium rounded-none"
              >
                {stage.name_ar}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {stages.map((stage) => (
          <TabsContent key={stage.id} value={stage.id} className="mt-0">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2 lg:mb-0">
                  أوامر التشغيل - {stage.name_ar}
                </h3>
              </div>
              
              <JobOrdersTable stage={stage.key} onCreateRoll={onCreateRoll} />
              
              <div className="mt-6">
                <RollsTable stage={stage.key} />
              </div>
            </CardContent>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
