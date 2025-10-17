import { useMemo } from "react";
export function useRemainingQuantity(order:any, rolls:any[]){
  return useMemo(()=>{
    if(!order || !order.quantity_kg) return 0;
    const required = Number.parseFloat(String(order.quantity_kg)) || 0;
    const orderRolls = (rolls||[]).filter((r:any)=> r.production_order_id === order.id);
    const produced = orderRolls.reduce((s:number, r:any)=> s + (Number.parseFloat(String(r.weight_kg))||0), 0);
    return Math.max(0, required - produced);
  }, [order, rolls]);
}