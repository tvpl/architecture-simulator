"use client";
/**
 * ServiceNode — universal node renderer for all AWS services.
 * Reads the service definition from the registry to render icon, colors,
 * and layer-specific overlays.
 */
import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
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

const ServiceNode = memo(function ServiceNode({ data, selected }: NodeProps<FlowNode>) {
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const hasError = useValidationStore((s) => s.errorNodeIds.includes(data.id));
  const hasWarning = useValidationStore((s) => s.warningNodeIds.includes(data.id));

  const def = registry.get(data.type);
  if (!def) return null;

  const handleClick = () => selectNode(data.id);

  const costResult = calculateServiceCost(data);
  const availability = calculateAvailability(data);
  const maxThroughput = calculateMaxThroughput(data);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative min-w-[140px] rounded-xl border-2 bg-card shadow-sm transition-all cursor-pointer",
        "hover:shadow-md",
        selected
          ? `${def.borderColor} shadow-lg ring-2 ring-offset-1 ring-primary/30`
          : hasError
          ? "border-red-500 dark:border-red-500"
          : hasWarning
          ? "border-yellow-400 dark:border-yellow-400"
          : "border-border hover:border-primary/40"
      )}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary/60 !border-2 !border-background hover:!bg-primary transition-colors"
      />

      {/* Node body */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("p-1.5 rounded-lg", def.bgColor)}>
            <ServiceIcon iconName={def.iconName} className={cn("w-4 h-4", def.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{data.label}</div>
            <div className="text-[10px] text-muted-foreground">{def.label}</div>
          </div>
          {/* Validation badge */}
          {(hasError || hasWarning) && (
            <div
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                hasError
                  ? "bg-red-500 text-white"
                  : "bg-yellow-400 text-yellow-900"
              )}
              title={hasError ? "Erro de validação" : "Aviso de validação"}
            >
              {hasError ? "!" : "⚠"}
            </div>
          )}
        </div>

        {/* Layer-specific overlay */}
        {activeLayer === "solution-design" && (
          <div className="mt-1.5 pt-1.5 border-t border-border/50 text-[10px] text-muted-foreground space-y-0.5">
            <div className="flex justify-between">
              <span>Throughput</span>
              <span className="font-medium text-foreground">{formatThroughput(maxThroughput)}</span>
            </div>
            <div className="flex justify-between">
              <span>Latência</span>
              <span className="font-medium text-foreground">{data.latencyMs}ms</span>
            </div>
          </div>
        )}

        {activeLayer === "cost" && (
          <div className="mt-1.5 pt-1.5 border-t border-border/50">
            <div className={cn(
              "text-xs font-semibold text-center rounded px-1 py-0.5",
              costResult.monthlyCostUSD > 500
                ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                : costResult.monthlyCostUSD > 100
                ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
                : "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            )}>
              {formatUSD(costResult.monthlyCostUSD)}/mês
            </div>
          </div>
        )}

        {activeLayer === "simulation" && (
          <div className="mt-1.5 pt-1.5 border-t border-border/50 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className={cn(
                "font-medium",
                availability >= 99.99
                  ? "text-green-600 dark:text-green-400"
                  : availability >= 99.9
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {availability.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary/60 !border-2 !border-background hover:!bg-primary transition-colors"
      />
    </div>
  );
});

export { ServiceNode };
