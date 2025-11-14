// src/hooks/useRealtime.ts
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

type WSMessage =
  | { type: "realTimeStats"; payload: any }
  | { type: "alert"; payload: any }
  | { type: "machineUpdate"; payload: any }
  | { type: "initialSnapshot"; payload: any };

export function useRealtime(wsUrl?: string) {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number>(0);
  const shouldReconnect = useRef(true);

  useEffect(() => {
    if (!wsUrl) return;

    let backoff = 1000;
    shouldReconnect.current = true;

    const connect = () => {
      wsRef.current = new WebSocket(wsUrl!);

      wsRef.current.onopen = () => {
        console.log("[WS] connected");
        backoff = 1000;
      };

      wsRef.current.onmessage = (ev) => {
        try {
          const msg: WSMessage = JSON.parse(ev.data);
          if (msg.type === "realTimeStats") {
            qc.setQueryData(["/api/production/real-time-stats"], msg.payload);
          } else if (msg.type === "alert") {
            qc.setQueryData(["/api/production/alerts"], (old: any) => {
              const existing = (old?.alerts || []);
              return { alerts: [msg.payload, ...existing] };
            });
          } else if (msg.type === "machineUpdate") {
            qc.setQueryData(["/api/production/real-time-stats"], (old: any) => {
              if (!old) return old;
              const machineStatus = (old.machineStatus || []).map((m:any) =>
                m.machine_id === msg.payload.machine_id ? { ...m, ...msg.payload } : m,
              );
              // if machine not present, add it
              const exists = machineStatus.find((m:any) => m.machine_id === msg.payload.machine_id);
              const finalMachineStatus = exists ? machineStatus : [msg.payload, ...machineStatus];
              return { ...old, machineStatus: finalMachineStatus };
            });
            qc.setQueryData(["/api/production/machine-utilization"], (old: any) => {
              if (!old) return { machineStatus: [msg.payload] };
              const machineStatus = (old.machineStatus || []).map((m:any) =>
                m.machine_id === msg.payload.machine_id ? { ...m, ...msg.payload } : m,
              );
              const exists = machineStatus.find((m:any) => m.machine_id === msg.payload.machine_id);
              const finalMachineStatus = exists ? machineStatus : [msg.payload, ...machineStatus];
              return { ...old, machineStatus: finalMachineStatus };
            });
          } else if (msg.type === "initialSnapshot") {
            if (msg.payload.realTimeStats) {
              qc.setQueryData(["/api/production/real-time-stats"], msg.payload.realTimeStats);
            }
            if (msg.payload.alerts) {
              qc.setQueryData(["/api/production/alerts"], { alerts: msg.payload.alerts });
            }
            if (msg.payload.machineUtilization) {
              qc.setQueryData(["/api/production/machine-utilization"], msg.payload.machineUtilization);
            }
          }
        } catch (e) {
          console.error("[WS] parse error", e);
        }
      };

      wsRef.current.onclose = () => {
        console.log("[WS] closed");
        if (!shouldReconnect.current) return;
        reconnectRef.current = window.setTimeout(() => {
          backoff = Math.min(backoff * 1.5, 30000);
          connect();
        }, backoff);
      };

      wsRef.current.onerror = (err) => {
        console.error("[WS] error", err);
        wsRef.current?.close();
      };
    };

    connect();

    return () => {
      shouldReconnect.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [wsUrl, qc]);
}
