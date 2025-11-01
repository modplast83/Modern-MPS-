// src/utils/oee.ts
export function calcOEE({
  operatingTimeSec,
  plannedProductionSec,
  producedUnits,
  goodUnits,
  idealCycleTimeSec,
}: {
  operatingTimeSec: number;
  plannedProductionSec: number;
  producedUnits: number;
  goodUnits: number;
  idealCycleTimeSec: number;
}) {
  const availability = plannedProductionSec > 0 ? operatingTimeSec / plannedProductionSec : 0;
  const performance = operatingTimeSec > 0 ? ((producedUnits * idealCycleTimeSec) / operatingTimeSec) : 0;
  const quality = producedUnits > 0 ? goodUnits / producedUnits : 1;
  const oee = availability * performance * quality;

  return {
    availability: Math.max(0, Math.min(1, availability)),
    performance: Math.max(0, Math.min(1, performance)),
    quality: Math.max(0, Math.min(1, quality)),
    oee: Math.max(0, Math.min(1, oee)),
  };
}

export function pct(v: number) {
  return Math.round(v * 100);
}
