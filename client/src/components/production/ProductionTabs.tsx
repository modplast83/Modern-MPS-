import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { Section } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Package, Scissors } from "lucide-react";
import ProductionOrdersTable from "./ProductionOrdersTable";
import RollsTable from "./RollsTable";
import ProductionQueue from "./ProductionQueue";
import GroupedPrintingQueue from "./GroupedPrintingQueue";
import GroupedCuttingQueue from "./GroupedCuttingQueue";
import HierarchicalOrdersView from "./HierarchicalOrdersView";

interface ProductionTabsProps {
  onCreateRoll: (productionOrderId?: number) => void;
}

const stages = [
  { id: "film", name: "Film Stage", name_ar: "مرحلة الفيلم", key: "film", icon: Package },
  { id: "printing", name: "Printing Stage", name_ar: "مرحلة الطباعة", key: "printing", icon: Play },
  { id: "cutting", name: "Cutting Stage", name_ar: "مرحلة التقطيع", key: "cutting", icon: Scissors },
];

export default function ProductionTabs({ onCreateRoll }: ProductionTabsProps) {
  const [activeStage, setActiveStage] = useState<string>("film");

  // Get current user information from auth context
  const { user: currentUser } = useAuth();

  // Get sections to map section IDs to names
  const { data: sections = [] } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Filter stages based on user's role and section
  const visibleStages = useMemo(() => {
    if (!currentUser) return stages;

    const userRole = currentUser.role_id;
    const userSectionId = currentUser.section_id;

    // Managers and Production Managers can see all tabs
    if (userRole === 1 || userRole === 2) { // Manager, Production Manager
      return stages;
    }

    // Get section information to match with production stages
    const userSection = sections.find((section) => section.id === String(userSectionId));
    const sectionName = userSection?.name?.toLowerCase();

    // Map sections to stages
    if (sectionName?.includes('film') || sectionName?.includes('فيلم')) {
      return stages.filter(stage => stage.key === 'film');
    }
    
    if (sectionName?.includes('print') || sectionName?.includes('طباعة')) {
      return stages.filter(stage => stage.key === 'printing');
    }
    
    if (sectionName?.includes('cut') || sectionName?.includes('تقطيع')) {
      return stages.filter(stage => stage.key === 'cutting');
    }

    // Default: show all stages if no specific section match
    return stages;
  }, [currentUser, sections]);

  // Fetch production queues - Optimized polling intervals to reduce server load
  const { data: filmQueue = [] } = useQuery<any[]>({
    queryKey: ['/api/production/film-queue'],
    refetchInterval: 90000, // Reduced from 30s to 90s (1.5 minutes)
    staleTime: 60000 // Cache for 1 minute to reduce unnecessary requests
  });

  const { data: printingQueue = [] } = useQuery<any[]>({
    queryKey: ['/api/production/printing-queue'],
    refetchInterval: 90000, // Reduced from 30s to 90s
    staleTime: 60000
  });

  const { data: cuttingQueue = [] } = useQuery<any[]>({
    queryKey: ['/api/production/cutting-queue'],
    refetchInterval: 90000, // Reduced from 30s to 90s
    staleTime: 60000
  });

  const { data: groupedCuttingQueue = [] } = useQuery<any[]>({
    queryKey: ['/api/production/grouped-cutting-queue'],
    refetchInterval: 90000, // Reduced from 30s to 90s
    staleTime: 60000
  });

  // Set default active stage based on visible stages
  const defaultStage = visibleStages.length > 0 ? visibleStages[0].id : "film";
  
  // Update active stage if it's not visible anymore
  if (!visibleStages.some(stage => stage.id === activeStage)) {
    setActiveStage(defaultStage);
  }

  return (
    <Card className="mb-6">
      <Tabs value={activeStage} onValueChange={setActiveStage}>
        <div className="border-b border-gray-200">
          <TabsList className={`grid w-full ${
            visibleStages.length === 1 ? 'grid-cols-1' :
            visibleStages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
          } bg-transparent p-0`}>
            {visibleStages.map((stage) => {
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

        {/* Film Stage - Hierarchical Orders View */}
        {visibleStages.some(stage => stage.key === 'film') && (
          <TabsContent value="film" className="mt-0">
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">طلبات الإنتاج - مرحلة الفيلم</CardTitle>
              <HierarchicalOrdersView stage="film" onCreateRoll={onCreateRoll} />
            </CardContent>
          </TabsContent>
        )}

        {/* Printing Stage - Rolls Ready for Printing */}
        {visibleStages.some(stage => stage.key === 'printing') && (
          <TabsContent value="printing" className="mt-0">
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">قائمة انتظار الطباعة</CardTitle>
              <GroupedPrintingQueue items={printingQueue} />
            </CardContent>
          </TabsContent>
        )}

        {/* Cutting Stage - Printed Rolls Ready for Cutting */}
        {visibleStages.some(stage => stage.key === 'cutting') && (
          <TabsContent value="cutting" className="mt-0">
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-4">قائمة انتظار التقطيع</CardTitle>
              <GroupedCuttingQueue items={groupedCuttingQueue} />
            </CardContent>
          </TabsContent>
        )}

      </Tabs>
    </Card>
  );
}
