import { CheckCircle, XCircle, AlertTriangle, Timer } from "lucide-react";
import { calcOEE, pct } from "../utils/oee";
import Sparkline from "./Sparkline";
import { useTranslation } from 'react-i18next';

type Machine = {
  machine_id: string;
  machine_name: string;
  status: "active" | "maintenance" | "down" | string;
  current_rolls?: number;
  utilization?: number;
  lastDowntime?: string | null;
  last24hUtilization?: number[];
  operatingTimeSec?: number;
  plannedProductionSec?: number;
  producedUnits?: number;
  goodUnits?: number;
  idealCycleTimeSec?: number;
  oee?: number;
};

const statusColor = (s: string) => {
  switch (s) {
    case "active": return "bg-green-50 border-green-200";
    case "maintenance": return "bg-yellow-50 border-yellow-200";
    case "down": return "bg-red-50 border-red-200";
    default: return "bg-gray-50 border-gray-200";
  }
};

const statusIcon = (s: string) => {
  switch (s) {
    case "active": return <CheckCircle className={t("components.machinecard.name.w_4_h_4_text_green_500")} />{t('components.MachineCard.;_case_"maintenance":_return')}<AlertTriangle className={t("components.machinecard.name.w_4_h_4_text_yellow_500")} />{t('components.MachineCard.;_case_"down":_return')}<XCircle className={t("components.machinecard.name.w_4_h_4_text_red_500")} />{t('components.MachineCard.;_default:_return')}<Timer className={t("components.machinecard.name.w_4_h_4_text_gray_400")} />;
  }
};

export default function MachineCard({ machine }: { machine: Machine }) {
  const { t } = useTranslation();
  const {
    machine_name, status, current_rolls = 0, utilization = 0, lastDowntime,
    last24hUtilization = [], operatingTimeSec = 0, plannedProductionSec = 0,
    producedUnits = 0, goodUnits = 0, idealCycleTimeSec = 1,
  } = machine;

  const computed = calcOEE({
    operatingTimeSec,
    plannedProductionSec,
    producedUnits,
    goodUnits,
    idealCycleTimeSec,
  });

  const oeePct = pct(computed.oee);

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return t('machineCard.active');
      case "maintenance": return t('machineCard.maintenance');
      case "down": return t('machineCard.down');
      default: return status;
    }
  };

  return (
    <div className={`p-3 rounded-lg border ${statusColor(status)}`}>
      <div className={t("components.machinecard.name.flex_items_center_justify_between_mb_2")}>
        <div>
          <div className={t("components.machinecard.name.font_medium")}>{machine_name}</div>
          <div className={t("components.machinecard.name.text_xs_text_gray_500")}>{getStatusText(status)}</div>
        </div>
        <div className={t("components.machinecard.name.flex_items_center_gap_2")}>
          {statusIcon(status)}
        </div>
      </div>

      <div className={t("components.machinecard.name.flex_items_center_justify_between")}>
        <div>
          <div className={t("components.machinecard.name.text_xs_text_gray_600")}>{t('machineCard.utilization')}</div>
          <div className={t("components.machinecard.name.text_lg_font_bold")}>{Math.round(utilization * 100)}%</div>
        </div>

        <div className={t("components.machinecard.name.text_right")}>
          <div className={t("components.machinecard.name.text_xs_text_gray_600")}>{t('components.MachineCard.oee')}</div>
          <div className={t("components.machinecard.name.text_lg_font_bold")}>{oeePct}%</div>
        </div>
      </div>

      <div className={t("components.machinecard.name.mt_3_flex_items_center_justify_between")}>
        <div style={{ width: 90 }}>
          <Sparkline data={last24hUtilization} />
        </div>

        <div className={t("components.machinecard.name.text_xs_text_gray_500_text_right")}>
          <div>{t('machineCard.currentRolls')}: <strong>{current_rolls}</strong></div>
          <div>{t('machineCard.lastDowntime')}: <strong>{lastDowntime ? new Date(lastDowntime).toLocaleString() : "-"}</strong></div>
        </div>
      </div>

      <div className={t("components.machinecard.name.mt_3_text_xs_text_gray_600_grid_grid_cols_3_gap_2")}>
        <div className={t("components.machinecard.name.text_center")}>
          <div className={t("components.machinecard.name.font_semibold")}>{pct(computed.availability)}%</div>
          <div className={t("components.machinecard.name.text_11px_text_gray_500")}>{t('machineCard.availability')}</div>
        </div>
        <div className={t("components.machinecard.name.text_center")}>
          <div className={t("components.machinecard.name.font_semibold")}>{pct(computed.performance)}%</div>
          <div className={t("components.machinecard.name.text_11px_text_gray_500")}>{t('machineCard.performance')}</div>
        </div>
        <div className={t("components.machinecard.name.text_center")}>
          <div className={t("components.machinecard.name.font_semibold")}>{pct(computed.quality)}%</div>
          <div className={t("components.machinecard.name.text_11px_text_gray_500")}>{t('machineCard.quality')}</div>
        </div>
      </div>
    </div>
  );
}
