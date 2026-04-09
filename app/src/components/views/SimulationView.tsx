"use client";
/**
 * SimulationView — Layer 4 specialized visualization.
 * Shows simulation results with bottleneck sidebar, critical path, and resource utilization.
 * Wraps FlowCanvas with simulation-specific panels and bottleneck list.
 */
import React, { useMemo } from "react";
import { Activity, AlertTriangle, Zap, Timer, TrendingDown, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulationStore } from "@/stores/simulation-store";
import { useFlowStore, selectDomainNodes } from "@/stores/flow-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { formatLatency } from "@/lib/formatters";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SimulationView() {
  const simStatus = useSimulationStore((s) => s.status);
  const simResults = useSimulationStore((s) => s.result);
  const domainNodes = useFlowStore(selectDomainNodes);
  const { selectNode } = useSelectionStore();
  const { openPropertiesPanel } = useUIStore();

  // Sort resources by utilization descending
  const sortedResources = useMemo(() => {
    if (!simResults?.resourceUtilization) return [];
    return [...simResults.resourceUtilization].sort((a, b) => b.utilization - a.utilization);
  }, [simResults]);

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
            {simStatus === "idle" && "Simulação não executada — clique em Simular"}
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
                  Latência:{" "}
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
              {simResults.bottlenecks.length > 0 && (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-medium">{simResults.bottlenecks.length} gargalo(s)</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main area: canvas + side panel */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas */}
        <div className="flex-1 relative min-w-0">
          <FlowCanvas />
        </div>

        {/* Simulation insights panel */}
        {simResults && (
          <div className="w-64 border-l border-border bg-card shrink-0 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* Bottlenecks */}
                {simResults.bottlenecks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                        Gargalos
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {simResults.bottlenecks.map((b, i) => (
                        <button
                          key={i}
                          className="w-full text-left p-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          onClick={() => { selectNode(b.nodeId); openPropertiesPanel(); }}
                        >
                          <div className="text-xs font-medium text-red-700 dark:text-red-400 truncate">
                            {b.nodeName}
                          </div>
                          <div className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-0.5">
                            {b.reason}
                          </div>
                          <div className="text-[10px] font-mono text-red-500 mt-0.5">
                            {formatLatency(b.latencyMs)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical path */}
                {simResults.pathAnalysis.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Caminhos Críticos
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {simResults.pathAnalysis
                        .filter((p) => p.isLongest)
                        .slice(0, 3)
                        .map((path, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20"
                          >
                            <div className="text-[10px] text-muted-foreground truncate">
                              {path.pathNames.join(" → ")}
                            </div>
                            <div className="text-xs font-mono font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                              {formatLatency(path.totalLatencyMs)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Resource utilization heatmap */}
                {sortedResources.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Utilização
                      </span>
                    </div>
                    <div className="space-y-1">
                      {sortedResources.map((r) => (
                        <button
                          key={r.nodeId}
                          className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                          onClick={() => { selectNode(r.nodeId); openPropertiesPanel(); }}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] truncate max-w-[140px]">{r.nodeName}</span>
                            <span
                              className={cn(
                                "text-[10px] font-mono font-medium",
                                r.utilization >= 90
                                  ? "text-red-600 dark:text-red-400"
                                  : r.utilization >= 70
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-green-600 dark:text-green-400"
                              )}
                            >
                              {r.utilization.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                r.utilization >= 90
                                  ? "bg-red-500"
                                  : r.utilization >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              )}
                              style={{ width: `${Math.max(r.utilization, 3)}%` }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {simResults.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Recomendações
                    </div>
                    <div className="space-y-1.5">
                      {simResults.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className={cn(
                            "p-2 rounded-lg border text-[10px]",
                            rec.severity === "critical"
                              ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
                              : rec.severity === "warning"
                              ? "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/20"
                              : "border-border bg-muted/30"
                          )}
                        >
                          <div className="font-medium">{rec.title}</div>
                          <div className="text-muted-foreground mt-0.5">{rec.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
