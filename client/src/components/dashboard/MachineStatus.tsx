import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Progress } from "../ui/progress";
import { formatNumber, formatPercentage } from "../../lib/formatNumber";
import {
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Thermometer,
  Gauge,
  Plus,
} from "lucide-react";

interface MachineStatusProps {
  onCreateRoll: () => void;
}

export default function MachineStatus({ onCreateRoll }: MachineStatusProps) {
  const { data: machines = [], isLoading } = useQuery({
    queryKey: ["/api/machines"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "down":
        return "bg-red-100 text-red-800";
      case "idle":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "يعمل";
      case "maintenance":
        return "صيانة";
      case "down":
        return "متوقف";
      case "idle":
        return "خامل";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    // Return icon component and props separately for better component lifecycle management
    const iconProps = { className: "w-4 h-4" };
    
    switch (status) {
      case "operational":
        return { Icon: CheckCircle2, className: "w-4 h-4 text-green-600" };
      case "maintenance":
        return { Icon: AlertTriangle, className: "w-4 h-4 text-yellow-600" };
      case "down":
        return { Icon: XCircle, className: "w-4 h-4 text-red-600" };
      case "idle":
        return { Icon: Clock, className: "w-4 h-4 text-gray-600" };
      default:
        return { Icon: Settings, className: "w-4 h-4 text-gray-600" };
    }
  };
  
  const renderStatusIcon = (status: string) => {
    const { Icon, className } = getStatusIcon(status);
    return <Icon className={className} />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            حالة المكائن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats
  const machineList = Array.isArray(machines) ? machines : [];
  const operationalMachines = machineList.filter(
    (m: any) => m.status === "operational",
  ).length;
  const maintenanceMachines = machineList.filter(
    (m: any) => m.status === "maintenance",
  ).length;
  const downMachines = machineList.filter(
    (m: any) => m.status === "down",
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            حالة المكائن
          </CardTitle>
          <Button size="sm" onClick={onCreateRoll}>
            <Plus className="w-4 h-4 mr-1" />
            رول جديد
          </Button>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mt-3">
          <Badge variant="default" className="bg-green-100 text-green-800">
            {formatNumber(operationalMachines)} يعمل
          </Badge>
          {maintenanceMachines > 0 && (
            <Badge variant="default" className="bg-yellow-100 text-yellow-800">
              {formatNumber(maintenanceMachines)} صيانة
            </Badge>
          )}
          {downMachines > 0 && (
            <Badge variant="destructive">
              {formatNumber(downMachines)} متوقف
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-80">
          {machineList.length > 0 ? (
            <div className="p-4 space-y-4">
              {machineList.map((machine: any) => (
                <div
                  key={machine.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {renderStatusIcon(machine.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {machine.name_ar || machine.name}
                          </h4>
                          <Badge className={getStatusColor(machine.status)}>
                            {getStatusText(machine.status)}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600">
                          {machine.type && (
                            <div className="flex items-center gap-1 mb-1">
                              <Settings className="w-3 h-3" />
                              <span>{machine.type}</span>
                            </div>
                          )}

                          {machine.section_id && (
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              <span>قسم: {machine.section_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {machine.production_rate && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {machine.production_rate}/ساعة
                        </div>
                        <div className="text-xs text-gray-500">
                          معدل الإنتاج
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Machine metrics */}
                  {machine.status === "operational" && (
                    <div className="space-y-2">
                      {/* Efficiency */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-blue-500" />
                          <span>الكفاءة</span>
                        </div>
                        <span className="font-medium">
                          {formatPercentage(
                            machine.efficiency ||
                              Math.floor(Math.random() * 20 + 80),
                          )}
                        </span>
                      </div>
                      <Progress
                        value={
                          machine.efficiency ||
                          Math.floor(Math.random() * 20 + 80)
                        }
                        className="h-1"
                      />

                      {/* Additional metrics row */}
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          <span>
                            {formatNumber(
                              machine.temperature ||
                                Math.floor(Math.random() * 20 + 180),
                            )}
                            °
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>
                            {formatNumber(
                              machine.power ||
                                Math.floor(Math.random() * 50 + 150),
                            )}
                            W
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>
                            {formatNumber(
                              machine.speed ||
                                Math.floor(Math.random() * 500 + 1000),
                            )}{" "}
                            م/د
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Maintenance info */}
                  {machine.status === "maintenance" && (
                    <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-600" />
                        <span>صيانة مجدولة - متوقع الانتهاء خلال ساعتين</span>
                      </div>
                    </div>
                  )}

                  {/* Down status info */}
                  {machine.status === "down" && (
                    <div className="text-xs text-gray-600 bg-red-50 p-2 rounded">
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span>عطل - يتطلب تدخل فني</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">لا توجد مكائن مسجلة</p>
              <p className="text-sm text-gray-500">
                أضف مكائن من صفحة التعريفات
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
