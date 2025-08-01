import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wrench, Star, Trash2 } from "lucide-react";
import type { MachineStatus as MachineStatusType } from "@/types";

interface MachineStatusProps {
  onCreateRoll: () => void;
}

export default function MachineStatus({ onCreateRoll }: MachineStatusProps) {
  const { data: machines = [], isLoading } = useQuery<MachineStatusType[]>({
    queryKey: ['/api/machines'],
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          label: 'يعمل', 
          color: 'bg-success', 
          textColor: 'text-success',
          variant: 'default' as const
        };
      case 'maintenance':
        return { 
          label: 'صيانة', 
          color: 'bg-warning', 
          textColor: 'text-warning',
          variant: 'secondary' as const
        };
      case 'down':
        return { 
          label: 'متوقف', 
          color: 'bg-danger', 
          textColor: 'text-danger',
          variant: 'destructive' as const
        };
      default:
        return { 
          label: status, 
          color: 'bg-gray-500', 
          textColor: 'text-gray-500',
          variant: 'outline' as const
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>حالة المكائن</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>حالة المكائن</CardTitle>
      </CardHeader>
      <CardContent>
        {machines.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">لا توجد مكائن</p>
          </div>
        ) : (
          <div className="space-y-4">
            {machines.map((machine) => {
              const statusInfo = getStatusInfo(machine.status);
              
              return (
                <div key={machine.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`h-3 w-3 ${statusInfo.color} rounded-full`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {machine.name_ar || machine.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        العامل: {machine.current_employee || "غير مخصص"}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <Badge variant={statusInfo.variant} className="mb-1">
                      {statusInfo.label}
                    </Badge>
                    {machine.productivity && (
                      <p className="text-xs text-gray-600">
                        الإنتاجية: {machine.productivity}%
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">إجراءات سريعة</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="default" size="sm" className="btn-primary text-xs">
                  <AlertTriangle className="h-3 w-3 ml-1" />
                  تبليغ عطل
                </Button>
                <Button variant="secondary" size="sm" className="text-xs">
                  طباعة QR
                </Button>
                <Button variant="default" size="sm" className="btn-success text-xs">
                  <Star className="h-3 w-3 ml-1" />
                  فحص جودة
                </Button>
                <Button variant="default" size="sm" className="btn-warning text-xs">
                  <Trash2 className="h-3 w-3 ml-1" />
                  تسجيل هدر
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
