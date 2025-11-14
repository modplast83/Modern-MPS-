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
import { useTranslation } from 'react-i18next';

interface MachineStatusProps {
  onCreateRoll: () => void;
}

export default function MachineStatus({ onCreateRoll }: MachineStatusProps) {
  const { t } = useTranslation();
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
        return t('machineStatus.operational');
      case "maintenance":
        return t('machineStatus.maintenance');
      case "down":
        return t('machineStatus.down');
      case "idle":
        return t('machineStatus.idle');
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
          <CardTitle className={t("components.dashboard.machinestatus.name.flex_items_center_gap_2")}>
            <Settings className={t("components.dashboard.machinestatus.name.w_5_h_5")} />
            {t('dashboard.machineStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={t("components.dashboard.machinestatus.name.space_y_4")}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={t("components.dashboard.machinestatus.name.animate_pulse")}>
                <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_3")}>
                  <div className={t("components.dashboard.machinestatus.name.w_10_h_10_bg_gray_200_rounded")}></div>
                  <div className={t("components.dashboard.machinestatus.name.flex_1")}>
                    <div className={t("components.dashboard.machinestatus.name.h_4_bg_gray_200_rounded_mb_2")}></div>
                    <div className={t("components.dashboard.machinestatus.name.h_3_bg_gray_200_rounded_w_2_3")}></div>
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
    (m: any) =>{t('components.dashboard.MachineStatus.m.status_===_"down",_).length;_return_(')}<Card>
      <CardHeader className={t("components.dashboard.machinestatus.name.pb_3")}>
        <div className={t("components.dashboard.machinestatus.name.flex_items_center_justify_between")}>
          <CardTitle className={t("components.dashboard.machinestatus.name.flex_items_center_gap_2")}>
            <Settings className={t("components.dashboard.machinestatus.name.w_5_h_5")} />
            {t('dashboard.machineStatus')}
          </CardTitle>
          <Button size="sm" onClick={onCreateRoll}>
            <Plus className={t("components.dashboard.machinestatus.name.w_4_h_4_mr_1")} />
            {t('machineStatus.newRoll')}
          </Button>
        </div>

        {/* Summary badges */}
        <div className={t("components.dashboard.machinestatus.name.flex_gap_2_mt_3")}>
          <Badge variant="default" className={t("components.dashboard.machinestatus.name.bg_green_100_text_green_800")}>
            {formatNumber(operationalMachines)} {t('machineStatus.operational')}
          </Badge>
          {maintenanceMachines >{t('components.dashboard.MachineStatus.0_&&_(')}<Badge variant="default" className={t("components.dashboard.machinestatus.name.bg_yellow_100_text_yellow_800")}>
              {formatNumber(maintenanceMachines)} {t('machineStatus.maintenance')}
            </Badge>
          )}
          {downMachines >{t('components.dashboard.MachineStatus.0_&&_(')}<Badge variant="destructive">
              {formatNumber(downMachines)} {t('machineStatus.down')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={t("components.dashboard.machinestatus.name.p_0")}>
        <ScrollArea className={t("components.dashboard.machinestatus.name.h_80")}>
          {machineList.length >{t('components.dashboard.MachineStatus.0_?_(')}<div className={t("components.dashboard.machinestatus.name.p_4_space_y_4")}>
              {machineList.map((machine: any) => (
                <div
                  key={machine.id}
                  className={t("components.dashboard.machinestatus.name.border_rounded_lg_p_3_hover_bg_gray_50_transition_colors")}
                >
                  <div className={t("components.dashboard.machinestatus.name.flex_items_start_justify_between_mb_3")}>
                    <div className={t("components.dashboard.machinestatus.name.flex_items_start_gap_3")}>
                      <div className={t("components.dashboard.machinestatus.name.mt_1")}>
                        {renderStatusIcon(machine.status)}
                      </div>
                      <div className={t("components.dashboard.machinestatus.name.flex_1_min_w_0")}>
                        <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_2_mb_1")}>
                          <h4 className={t("components.dashboard.machinestatus.name.font_medium_text_gray_900_truncate")}>
                            {machine.name_ar || machine.name}
                          </h4>
                          <Badge className={getStatusColor(machine.status)}>
                            {getStatusText(machine.status)}
                          </Badge>
                        </div>

                        <div className={t("components.dashboard.machinestatus.name.text_sm_text_gray_600")}>
                          {machine.type && (
                            <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_1_mb_1")}>
                              <Settings className={t("components.dashboard.machinestatus.name.w_3_h_3")} />
                              <span>{machine.type}</span>
                            </div>
                          )}

                          {machine.section_id && (
                            <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_1")}>
                              <Activity className={t("components.dashboard.machinestatus.name.w_3_h_3")} />
                              <span>{t('machineStatus.section')}: {machine.section_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {machine.production_rate && (
                      <div className={t("components.dashboard.machinestatus.name.text_right")}>
                        <div className={t("components.dashboard.machinestatus.name.text_sm_font_medium_text_gray_900")}>
                          {machine.production_rate}/{t('machineStatus.perHour')}
                        </div>
                        <div className={t("components.dashboard.machinestatus.name.text_xs_text_gray_500")}>
                          {t('machineStatus.productionRate')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Machine metrics */}
                  {machine.status === "operational" && (
                    <div className={t("components.dashboard.machinestatus.name.space_y_2")}>
                      {/* Efficiency */}
                      <div className={t("components.dashboard.machinestatus.name.flex_items_center_justify_between_text_xs")}>
                        <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_1")}>
                          <Gauge className={t("components.dashboard.machinestatus.name.w_3_h_3_text_blue_500")} />
                          <span>{t('machineStatus.efficiency')}</span>
                        </div>
                        <span className={t("components.dashboard.machinestatus.name.font_medium")}>
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
                        className={t("components.dashboard.machinestatus.name.h_1")}
                      />

                      {/* Additional metrics row */}
                      <div className={t("components.dashboard.machinestatus.name.grid_grid_cols_3_gap_2_text_xs_text_gray_600_mt_2")}>
                        <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_1")}>
                          <Thermometer className={t("components.dashboard.machinestatus.name.w_3_h_3")} />
                          <span>
                            {formatNumber(
                              machine.temperature ||
                                Math.floor(Math.random() * 20 + 180),
                            )}
                            °
                          </span>
                        </div>
                        <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_1")}>
                          <Zap className={t("components.dashboard.machinestatus.name.w_3_h_3")} />
                          <span>
                            {formatNumber(
                              machine.power ||
                                Math.floor(Math.random() * 50 + 150),
                            )}
                            W
                          </span>
                        </div>
                        <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_1")}>
                          <Activity className={t("components.dashboard.machinestatus.name.w_3_h_3")} />
                          <span>
                            {formatNumber(
                              machine.speed ||
                                Math.floor(Math.random() * 500 + 1000),
                            )}{" "}
                            {t('machineStatus.speedUnit')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Maintenance info */}
                  {machine.status === "maintenance" && (
                    <div className={t("components.dashboard.machinestatus.name.text_xs_text_gray_600_bg_yellow_50_p_2_rounded")}>
                      <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_1")}>
                        <AlertTriangle className={t("components.dashboard.machinestatus.name.w_3_h_3_text_yellow_600")} />
                        <span>{t('machineStatus.scheduledMaintenance')}</span>
                      </div>
                    </div>
                  )}

                  {/* Down status info */}
                  {machine.status === "down" && (
                    <div className={t("components.dashboard.machinestatus.name.text_xs_text_gray_600_bg_red_50_p_2_rounded")}>
                      <div className={t("components.dashboard.machinestatus.name.flex_items_center_gap_1")}>
                        <XCircle className={t("components.dashboard.machinestatus.name.w_3_h_3_text_red_600")} />
                        <span>{t('machineStatus.requiresTechnicalIntervention')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>{t('components.dashboard.MachineStatus.)_:_(')}<div className={t("components.dashboard.machinestatus.name.p_8_text_center")}>
              <Settings className={t("components.dashboard.machinestatus.name.w_12_h_12_text_gray_400_mx_auto_mb_3")} />
              <p className={t("components.dashboard.machinestatus.name.text_gray_600_mb_2")}>{t('machineStatus.noMachines')}</p>
              <p className={t("components.dashboard.machinestatus.name.text_sm_text_gray_500")}>
                {t('machineStatus.addMachinesFromDefinitions')}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
