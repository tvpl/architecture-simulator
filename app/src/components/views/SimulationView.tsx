"use client";
/**
 * SimulationView — Layer 4 specialized visualization.
 * Shows simulation results with latency, throughput, capacity, and bottleneck overlays.
 * Wraps the existing FlowCanvas with simulation-specific panels.
 */
import React from "react";
import { Activity, AlertTriangle, Zap, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulationStore } from "@/stores/simulation-store";
import { useFlowStore, selectDomainNodes } from "@/stores/flow-store";
import { formatLatency } from "@/lib/formatters";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";

export function SimulationView() {
  const simStatus = useSimulationStore((s) => s.status);
  const simResults = useSimulationStore((s) => s.result);
  const domainNodes = useFlowStore(selectDomainNodes);

  if (domainNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3 opacity-50">
          <Activity className="w-12 h-12 mx-auto text-muted-foreground" />
          <div className="text-sm font-medium text-muted-foreground">
            Nenhum componente de infraestrutura
          </div>
          <div className="text-xs text-muted-foreground">
            Adicione componentes na aba Arquitetura para simular
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Simulation status bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Activity
            className={cn(
              "w-4 h-4",
              simStatus === "complete"
                ? "text-green-500"
                : simStatus === "running"
                ? "text-yellow-500 animate-pulse"
                : "text-muted-foreground"
            )}
          />
          <span className="text-xs font-medium">
            {simStatus === "idle" && "Simulação não executada"}
            {simStatus === "running" && "Simulação em execução..."}
            {simStatus === "complete" && "Simulação completa"}
            {simStatus === "error" && "Erro na simulação"}
          </span>
        </div>

        {simResults && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Timer className="w-3.5 h-3.5" />
                <span>
                  Latência total:{" "}
                  <span className="font-medium text-foreground">
                    {formatLatency(simResults.totalLatencyMs)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>
                  Mensagens:{" "}
                  <span className="font-medium text-foreground">
                    {simResults.totalMessages.toLocaleString()}
                  </span>
                </span>
              </div>
              {simResults.bottlenecks && simResults.bottlenecks.length > 0 && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{simResults.bottlenecks.length} gargalo(s)</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Canvas with simulation overlays (existing FlowCanvas handles simulation layer rendering) */}
      <div className="flex-1 relative min-h-0">
        <FlowCanvas />
      </div>
    </div>
  );
}
