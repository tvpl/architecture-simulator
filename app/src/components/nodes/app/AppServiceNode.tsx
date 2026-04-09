"use client";
/**
 * AppServiceNode — rich node renderer for Layer 2 application components.
 * Shows icon, host badge, K8s resource overlay, scaling bar, and health indicator.
 */
import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { appComponentRegistry } from "@/registry/app-components";
import { useLayerStore } from "@/stores/layer-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useFlowStore, type AppFlowNode } from "@/stores/flow-store";
import { ServiceIcon } from "@/components/nodes/base/ServiceIcon";

const AppServiceNode = memo(function AppServiceNode({
  data,
  selected,
}: NodeProps<AppFlowNode>) {
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const hostNode = useFlowStore((s) =>
    s.nodes.find((n) => n.id === data.hostInfrastructureNodeId)
  );

  const def = appComponentRegistry.get(data.type);
  if (!def) return null;

  const handleClick = () => selectNode(data.id);

  const config = data.config as unknown as Record<string, unknown>;
  const replicas = config.replicas as number | undefined;
  const cpu = config.cpu as string | undefined;
  const memory = config.memory as string | undefined;
  const minReplicas = config.minReplicas as number | undefined;
  const maxReplicas = config.maxReplicas as number | undefined;
  const healthCheckPath = config.healthCheckPath as string | undefined;
  const metricsEnabled = config.metricsEnabled as boolean | undefined;

  // Scaling bar: how close to max replicas
  const hasHPA = minReplicas && maxReplicas && maxReplicas > (minReplicas ?? 1);
  const scalePct = hasHPA && replicas
    ? Math.round(((replicas - (minReplicas ?? 1)) / ((maxReplicas ?? 5) - (minReplicas ?? 1))) * 100)
    : 0;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative min-w-[160px] rounded-xl border-2 bg-card shadow-sm transition-all cursor-pointer",
        "hover:shadow-md",
        selected
          ? `${def.borderColor} shadow-lg ring-2 ring-offset-1 ring-primary/30`
          : "border-border hover:border-primary/40"
      )}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-500/60 !border-2 !border-background hover:!bg-indigo-500 transition-colors"
      />

      {/* Node body */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("p-1.5 rounded-lg", def.bgColor)}>
            <ServiceIcon
              iconName={def.iconName}
              className={cn("w-4 h-4", def.color)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">
              {data.label}
            </div>
            <div className="text-[10px] text-muted-foreground">{def.label}</div>
          </div>

          {/* Health/metrics indicators */}
          <div className="flex gap-0.5 shrink-0">
            {healthCheckPath && (
              <div className="w-2 h-2 rounded-full bg-green-500" title="Health check configurado" />
            )}
            {metricsEnabled && (
              <div className="w-2 h-2 rounded-full bg-blue-500" title="Métricas habilitadas" />
            )}
          </div>
        </div>

        {/* Host info badge */}
        {hostNode && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="truncate">{hostNode.data.label}</span>
            <span className="text-[9px] ml-auto opacity-60">{hostNode.data.type}</span>
          </div>
        )}

        {/* K8s resource overlay */}
        {activeLayer === "solution-design" && (replicas || cpu || memory) && (
          <div className="mt-1.5 pt-1.5 border-t border-border/50 text-[10px] text-muted-foreground space-y-0.5">
            {replicas !== undefined && (
              <div className="flex justify-between">
                <span>Réplicas</span>
                <span className="font-medium text-foreground">
                  {replicas}
                  {hasHPA && <span className="text-muted-foreground font-normal"> ({minReplicas}-{maxReplicas})</span>}
                </span>
              </div>
            )}
            {cpu && (
              <div className="flex justify-between">
                <span>CPU</span>
                <span className="font-medium text-foreground">{cpu}</span>
              </div>
            )}
            {memory && (
              <div className="flex justify-between">
                <span>Memória</span>
                <span className="font-medium text-foreground">{memory}</span>
              </div>
            )}

            {/* HPA scaling bar */}
            {hasHPA && (
              <div className="pt-1">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      scalePct > 80 ? "bg-red-500" : scalePct > 50 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.max(scalePct, 5)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] mt-0.5 text-muted-foreground">
                  <span>HPA</span>
                  <span>{scalePct}% capacidade</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-500/60 !border-2 !border-background hover:!bg-indigo-500 transition-colors"
      />
    </div>
  );
});

export { AppServiceNode };
