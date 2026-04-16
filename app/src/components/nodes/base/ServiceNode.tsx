"use client";
/**
 * ServiceNode — universal node renderer for all AWS services.
 * Premium card with category accent bar, metric pills, layer overlays.
 * Framer-motion: entrance animation + selection glow pulse.
 */
import React, { memo, useMemo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { registry } from "@/registry";
import { useLayerStore } from "@/stores/layer-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useValidationStore } from "@/stores/validation-store";
import { formatUSD } from "@/lib/formatters";
import { calculateServiceCost } from "@/domain/services/cost";
import { calculateAvailability } from "@/domain/services/availability";
import { calculateMaxThroughput } from "@/domain/services/throughput";
import { formatThroughput } from "@/lib/formatters";
import type { FlowNode } from "@/stores/flow-store";
import { ServiceIcon } from "./ServiceIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function borderToAccentBg(borderColor: string): string {
  return borderColor
    .split(" ")
    .filter((c) => c.startsWith("border-") && c !== "border-dashed")
    .map((c) => c.replace("border-", "bg-"))
    .join(" ");
}

const ServiceNode = memo(function ServiceNode({ data, selected }: NodeProps<FlowNode>) {
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const selectNode = useSelectionStore((s) => s.selectNode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hasError = useValidationStore(
    useMemo(() => (s: { errorNodeIds: string[] }) => s.errorNodeIds.includes(data.id), [data.id])
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hasWarning = useValidationStore(
    useMemo(() => (s: { warningNodeIds: string[] }) => s.warningNodeIds.includes(data.id), [data.id])
  );

  const def = registry.get(data.type);

  const costResult = useMemo(
    () => calculateServiceCost(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.config, data.type]
  );

  const availability = useMemo(
    () => calculateAvailability(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.config, data.type]
  );

  const maxThroughput = useMemo(
    () => calculateMaxThroughput(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.config, data.type]
  );

  if (!def) return null;

  const accentBg = borderToAccentBg(def.borderColor);

  return (
    <motion.div
      layout
      onClick={() => selectNode(data.id)}
      initial={{ opacity: 0, scale: 0.88, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
      whileHover={{ y: -1 }}
      className={cn(
        "relative min-w-[150px] rounded-xl bg-card transition-shadow cursor-pointer overflow-hidden",
        "border border-border/60",
        "hover:shadow-lg hover:border-border",
        selected && "ring-2 ring-offset-1 ring-primary/40 shadow-lg border-transparent",
        hasError && !selected && "ring-1 ring-red-500/60 border-red-200 dark:border-red-900",
        hasWarning && !selected && !hasError && "ring-1 ring-yellow-400/60 border-yellow-200 dark:border-yellow-900"
      )}
      style={{ boxShadow: selected ? "0 0 0 2px var(--ring), 0 4px 24px rgba(0,0,0,0.1)" : undefined }}
    >
      {/* Top handle — target (incoming) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3.5 !h-3.5 !bg-primary/60 !border-2 !border-background hover:!bg-primary hover:!shadow-[0_0_6px_2px_hsl(var(--primary)/0.5)] transition-all"
      />

      {/* Left handle — target (incoming) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3.5 !h-3.5 !bg-primary/60 !border-2 !border-background hover:!bg-primary hover:!shadow-[0_0_6px_2px_hsl(var(--primary)/0.5)] transition-all"
      />

      {/* Left category accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl", accentBg)} />

      {/* Content */}
      <div className="pl-3.5 pr-3 pt-2.5 pb-2.5">
        {/* Header row */}
        <div className="flex items-start gap-2.5">
          <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", def.bgColor)}>
            <ServiceIcon iconName={def.iconName} className={cn("w-3.5 h-3.5", def.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs font-semibold text-foreground truncate leading-tight cursor-default">{data.label}</div>
                </TooltipTrigger>
                <TooltipContent side="top">{data.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{def.label}</div>
          </div>

          {(hasError || hasWarning) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="shrink-0 mt-0.5"
            >
              {hasError ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
              )}
            </motion.div>
          )}
        </div>

        {/* Layer-specific overlays */}
        {activeLayer === "solution-design" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 pt-2 border-t border-border/40 flex gap-1.5"
          >
            <MetricPill label="Throughput" value={formatThroughput(maxThroughput)} />
            <MetricPill label="Latência" value={`${data.latencyMs}ms`} />
          </motion.div>
        )}

        {activeLayer === "cost" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 pt-1.5 border-t border-border/40"
          >
            <div
              className={cn(
                "text-xs font-bold text-center rounded-md px-2 py-1",
                costResult.monthlyCostUSD > 500
                  ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                  : costResult.monthlyCostUSD > 100
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
              )}
            >
              {formatUSD(costResult.monthlyCostUSD)}
              <span className="font-normal text-[10px] opacity-75">/mês</span>
            </div>
          </motion.div>
        )}

        {activeLayer === "simulation" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 pt-1.5 border-t border-border/40"
          >
            <div className="flex items-center gap-1.5">
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  availability >= 99.99
                    ? "bg-emerald-500"
                    : availability >= 99.9
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
              />
              <span className="text-[10px] text-muted-foreground">Uptime</span>
              <span
                className={cn(
                  "text-[10px] font-bold ml-auto",
                  availability >= 99.99
                    ? "text-emerald-600 dark:text-emerald-400"
                    : availability >= 99.9
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {availability.toFixed(2)}%
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right handle — source (outgoing) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3.5 !h-3.5 !bg-primary/60 !border-2 !border-background hover:!bg-primary hover:!shadow-[0_0_6px_2px_hsl(var(--primary)/0.5)] transition-all"
      />

      {/* Bottom handle — source (outgoing) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3.5 !h-3.5 !bg-primary/60 !border-2 !border-background hover:!bg-primary hover:!shadow-[0_0_6px_2px_hsl(var(--primary)/0.5)] transition-all"
      />
    </motion.div>
  );
});

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-muted/70 rounded-md px-1.5 py-1 text-center">
      <div className="text-[9px] text-muted-foreground leading-none mb-0.5">{label}</div>
      <div className="text-[10px] font-bold text-foreground leading-none">{value}</div>
    </div>
  );
}

export { ServiceNode };
