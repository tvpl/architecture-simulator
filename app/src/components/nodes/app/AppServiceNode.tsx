"use client";
/**
 * AppServiceNode — rich node renderer for Layer 2 application components.
 * K8s pod-inspired design: accent bar, replica badge, resource bars,
 * status indicator, and host link.
 */
import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { appComponentRegistry } from "@/registry/app-components";
import { useLayerStore } from "@/stores/layer-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useFlowStore, type AppFlowNode } from "@/stores/flow-store";
import { ServiceIcon } from "@/components/nodes/base/ServiceIcon";

// Converts "border-indigo-500" → "bg-indigo-500"
function borderToAccentBg(borderColor: string): string {
  return borderColor
    .split(" ")
    .filter((c) => c.startsWith("border-") && c !== "border-dashed")
    .map((c) => c.replace("border-", "bg-"))
    .join(" ");
}

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

  const hasHPA = minReplicas !== undefined && maxReplicas !== undefined && maxReplicas > (minReplicas ?? 1);
  const scalePct =
    hasHPA && replicas !== undefined
      ? Math.round(
          ((replicas - (minReplicas ?? 1)) / ((maxReplicas ?? 5) - (minReplicas ?? 1))) * 100
        )
      : 0;

  const accentBg = borderToAccentBg(def.borderColor);
  const isHealthy = !!(healthCheckPath || metricsEnabled);

  return (
    <motion.div
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.88, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
      whileHover={{ y: -1 }}
      className={cn(
        "relative min-w-[160px] rounded-xl bg-card transition-shadow cursor-pointer overflow-hidden",
        "border border-border/60",
        "hover:shadow-lg hover:border-border",
        selected && "ring-2 ring-offset-1 ring-violet-500/40 shadow-lg border-transparent"
      )}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-violet-500/60 !border-2 !border-background hover:!bg-violet-500 transition-colors"
      />

      {/* Left accent bar — purple (L2 layer color) */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", accentBg)} />

      {/* Content */}
      <div className="pl-4 pr-3 pt-2.5 pb-2.5">
        {/* Header row */}
        <div className="flex items-start gap-2">
          {/* Icon */}
          <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", def.bgColor)}>
            <ServiceIcon iconName={def.iconName} className={cn("w-3.5 h-3.5", def.color)} />
          </div>

          {/* Labels */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate leading-tight">
              {data.label}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{def.label}</div>
          </div>

          {/* Right badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {/* Replica count badge */}
            {replicas !== undefined && (
              <span className="text-[9px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 rounded-full leading-none">
                ×{replicas}
              </span>
            )}
            {/* Health dots */}
            <div className="flex gap-0.5">
              {healthCheckPath && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-emerald-300 dark:ring-emerald-700"
                  title="Health check"
                />
              )}
              {metricsEnabled && (
                <span
                  className="w-2 h-2 rounded-full bg-blue-500 ring-1 ring-blue-300 dark:ring-blue-700"
                  title="Métricas"
                />
              )}
            </div>
          </div>
        </div>

        {/* Host badge */}
        {hostNode && (
          <div className="mt-2 flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isHealthy ? "bg-emerald-500" : "bg-muted-foreground"
              )}
            />
            <span className="text-[10px] text-muted-foreground truncate flex-1">{hostNode.data.label}</span>
            <span className="text-[9px] text-muted-foreground/60 font-mono shrink-0">{hostNode.data.type}</span>
          </div>
        )}

        {/* K8s resource overlay */}
        {activeLayer === "solution-design" && (cpu || memory) && (
          <div className="mt-2 pt-1.5 border-t border-border/40 space-y-1">
            {cpu && (
              <ResourceBar
                label="CPU"
                value={cpu}
                color="bg-blue-500"
                max={hasHPA ? `${minReplicas}–${maxReplicas}` : undefined}
              />
            )}
            {memory && (
              <ResourceBar
                label="MEM"
                value={memory}
                color="bg-violet-500"
              />
            )}
            {/* HPA scaling bar */}
            {hasHPA && (
              <div className="pt-0.5">
                <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
                  <span>HPA</span>
                  <span>{scalePct}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      scalePct > 80 ? "bg-red-500" : scalePct > 50 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.max(scalePct, 5)}%` }}
                  />
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
        className="!w-3 !h-3 !bg-violet-500/60 !border-2 !border-background hover:!bg-violet-500 transition-colors"
      />
    </motion.div>
  );
});

function ResourceBar({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
  max?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-1.5 h-1.5 rounded-sm shrink-0", color)} />
      <span className="text-[9px] text-muted-foreground w-7 shrink-0">{label}</span>
      <span className="text-[10px] font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}

export { AppServiceNode };
