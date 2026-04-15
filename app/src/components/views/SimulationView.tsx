"use client";
/**
 * SimulationView — Layer 4 specialized visualization.
 * Shows simulation results with bottleneck sidebar, critical path, and resource utilization.
 * Wraps FlowCanvas with simulation-specific panels, timeline playback, and bottleneck list.
 */
import React, { useMemo, useReducer, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Zap,
  Timer,
  TrendingDown,
  Gauge,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulationStore } from "@/stores/simulation-store";
import { useFlowStore, selectDomainNodes } from "@/stores/flow-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { formatLatency } from "@/lib/formatters";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SimulationResult } from "@/domain/entities/simulation";

// ── Timeline step definitions ─────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { id: "bottlenecks", label: "Gargalos", icon: AlertTriangle },
  { id: "critical-path", label: "Caminho Crítico", icon: TrendingDown },
  { id: "utilization", label: "Utilização", icon: Gauge },
  { id: "recommendations", label: "Recomendações", icon: Lightbulb },
] as const;

type TimelineStepId = (typeof TIMELINE_STEPS)[number]["id"];

// ── Timeline state machine ────────────────────────────────────────────────────

type TimelineState = { step: TimelineStepId; isPlaying: boolean };
type TimelineAction =
  | { type: "GOTO"; step: TimelineStepId }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "NEXT" }
  | { type: "STOP_AT_END" }
  | { type: "RESET" };

function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  const idx = TIMELINE_STEPS.findIndex((s) => s.id === state.step);
  switch (action.type) {
    case "GOTO":
      return { step: action.step, isPlaying: false };
    case "PLAY":
      return { ...state, isPlaying: true };
    case "PAUSE":
      return { ...state, isPlaying: false };
    case "NEXT": {
      const next = idx + 1;
      if (next >= TIMELINE_STEPS.length) return { ...state, isPlaying: false };
      return { step: TIMELINE_STEPS[next].id, isPlaying: state.isPlaying };
    }
    case "STOP_AT_END":
      return { ...state, isPlaying: false };
    case "RESET":
      return { step: "bottlenecks", isPlaying: false };
  }
}

// ── SimulationInsightsPanel — isolated state for timeline ─────────────────────
// Keyed by simResults.timestamp so state resets automatically on new simulation.

function SimulationInsightsPanel({ simResults }: { simResults: SimulationResult }) {
  const { selectNode } = useSelectionStore();
  const { openPropertiesPanel } = useUIStore();

  const [{ step: activeStep, isPlaying }, dispatch] = useReducer(timelineReducer, {
    step: "bottlenecks",
    isPlaying: false,
  });

  const stepIndex = TIMELINE_STEPS.findIndex((s) => s.id === activeStep);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      const next = stepIndex + 1;
      if (next >= TIMELINE_STEPS.length) {
        dispatch({ type: "STOP_AT_END" });
      } else {
        dispatch({ type: "NEXT" });
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex]);

  const sortedResources = useMemo(
    () => [...simResults.resourceUtilization].sort((a, b) => b.utilization - a.utilization),
    [simResults.resourceUtilization]
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      dispatch({ type: "PAUSE" });
    } else {
      if (stepIndex >= TIMELINE_STEPS.length - 1) dispatch({ type: "GOTO", step: TIMELINE_STEPS[0].id });
      dispatch({ type: "PLAY" });
    }
  };

  return (
    <div className="w-72 border-l border-border bg-card shrink-0 flex flex-col">
      {/* Timeline playback controls */}
      <div className="border-b border-border p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Análise — Passo {stepIndex + 1}/{TIMELINE_STEPS.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: "GOTO", step: TIMELINE_STEPS[Math.max(0, stepIndex - 1)].id })}
              disabled={stepIndex === 0}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              title="Passo anterior"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handlePlayPause}
              className={cn(
                "p-1 rounded transition-colors",
                isPlaying
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
              title={isPlaying ? "Pausar" : "Reproduzir análise"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => dispatch({ type: "GOTO", step: TIMELINE_STEPS[Math.min(TIMELINE_STEPS.length - 1, stepIndex + 1)].id })}
              disabled={stepIndex >= TIMELINE_STEPS.length - 1}
              className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              title="Próximo passo"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {TIMELINE_STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = s.id === activeStep;
            const isPast = i < stepIndex;
            return (
              <button
                key={s.id}
                onClick={() => dispatch({ type: "GOTO", step: s.id })}
                title={s.label}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 rounded p-1 transition-all",
                  isActive ? "bg-primary/10 text-primary" : isPast ? "text-muted-foreground/60 hover:bg-muted/50" : "text-muted-foreground/40 hover:bg-muted/50"
                )}
              >
                <Icon className={cn("w-3 h-3", isActive && "animate-pulse")} />
                <div className={cn("h-0.5 w-full rounded-full", isActive ? "bg-primary" : isPast ? "bg-muted-foreground/30" : "bg-border")} />
              </button>
            );
          })}
        </div>
        <div className="text-[10px] text-center text-muted-foreground mt-1">
          {TIMELINE_STEPS[stepIndex].label}
        </div>
      </div>

      {/* Panel content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">

          {/* Bottlenecks */}
          {activeStep === "bottlenecks" && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Gargalos</span>
              </div>
              {simResults.bottlenecks.length === 0 ? (
                <div className="text-[10px] text-muted-foreground p-2 bg-muted/30 rounded-lg">
                  Nenhum gargalo detectado — ótimo desempenho!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {simResults.bottlenecks.map((b, i) => (
                    <button
                      key={i}
                      className="w-full text-left p-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      onClick={() => { selectNode(b.nodeId); openPropertiesPanel(); }}
                    >
                      <div className="text-xs font-medium text-red-700 dark:text-red-400 truncate">{b.nodeName}</div>
                      <div className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-0.5">{b.reason}</div>
                      <div className="text-[10px] font-mono text-red-500 mt-0.5">{formatLatency(b.latencyMs)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Critical path */}
          {activeStep === "critical-path" && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caminhos Críticos</span>
              </div>
              {simResults.pathAnalysis.filter((p) => p.isLongest).length === 0 ? (
                <div className="text-[10px] text-muted-foreground p-2 bg-muted/30 rounded-lg">Nenhum caminho crítico identificado.</div>
              ) : (
                <div className="space-y-1.5">
                  {simResults.pathAnalysis.filter((p) => p.isLongest).slice(0, 3).map((path, i) => (
                    <div key={i} className="p-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                      <div className="text-[10px] text-muted-foreground truncate">{path.pathNames.join(" → ")}</div>
                      <div className="text-xs font-mono font-medium text-amber-700 dark:text-amber-400 mt-0.5">
                        {formatLatency(path.totalLatencyMs)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Utilization heatmap */}
          {activeStep === "utilization" && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Utilização de Recursos</span>
              </div>
              {sortedResources.length === 0 ? (
                <div className="text-[10px] text-muted-foreground p-2 bg-muted/30 rounded-lg">Nenhum dado de utilização.</div>
              ) : (
                <div className="space-y-1">
                  {sortedResources.map((r) => (
                    <button
                      key={r.nodeId}
                      className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                      onClick={() => { selectNode(r.nodeId); openPropertiesPanel(); }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] truncate max-w-[160px]">{r.nodeName}</span>
                        <span className={cn("text-[10px] font-mono font-medium", r.utilization >= 90 ? "text-red-600 dark:text-red-400" : r.utilization >= 70 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400")}>
                          {r.utilization.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", r.utilization >= 90 ? "bg-red-500" : r.utilization >= 70 ? "bg-yellow-500" : "bg-green-500")} style={{ width: `${Math.max(r.utilization, 3)}%` }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {activeStep === "recommendations" && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recomendações</span>
              </div>
              {simResults.recommendations.length === 0 ? (
                <div className="text-[10px] text-muted-foreground p-2 bg-muted/30 rounded-lg">Sem recomendações — arquitetura otimizada!</div>
              ) : (
                <div className="space-y-1.5">
                  {simResults.recommendations.map((rec, i) => (
                    <div key={i} className={cn("p-2 rounded-lg border text-[10px]", rec.severity === "critical" ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20" : rec.severity === "warning" ? "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/20" : "border-border bg-muted/30")}>
                      <div className="font-medium">{rec.title}</div>
                      <div className="text-muted-foreground mt-0.5">{rec.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Progress bar */}
      <div className="border-t border-border p-2 shrink-0">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${((stepIndex + 1) / TIMELINE_STEPS.length) * 100}%` }} />
        </div>
        {isPlaying && <div className="text-[9px] text-center text-muted-foreground mt-1">Reproduzindo automaticamente...</div>}
      </div>
    </div>
  );
}

// ── Main SimulationView ───────────────────────────────────────────────────────

export function SimulationView() {
  const simStatus = useSimulationStore((s) => s.status);
  const simResults = useSimulationStore((s) => s.result);
  const domainNodes = useFlowStore(selectDomainNodes);

  if (domainNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3 opacity-50">
          <Activity className="w-12 h-12 mx-auto text-muted-foreground" />
          <div className="text-sm font-medium text-muted-foreground">Nenhum componente de infraestrutura</div>
          <div className="text-xs text-muted-foreground">Adicione componentes na aba Arquitetura para simular</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Simulation status bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className={cn("w-4 h-4", simStatus === "complete" ? "text-green-500" : simStatus === "running" ? "text-yellow-500 animate-pulse" : "text-muted-foreground")} />
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
                <span>Latência: <span className="font-medium text-foreground">{formatLatency(simResults.totalLatencyMs)}</span></span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Mensagens: <span className="font-medium text-foreground">{simResults.totalMessages.toLocaleString()}</span></span>
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

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-w-0">
          <FlowCanvas />
        </div>

        {/* Insights panel — keyed by timestamp so state resets on new simulation */}
        {simResults && (
          <SimulationInsightsPanel key={simResults.timestamp} simResults={simResults} />
        )}
      </div>
    </div>
  );
}
