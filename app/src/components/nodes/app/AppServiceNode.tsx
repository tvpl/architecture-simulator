"use client";
/**
 * AppServiceNode — universal node renderer for Layer 2 application components.
 * Reads from AppComponentRegistry for icon, colors, and displays host info.
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

  // Extract key config values for overlay
  const config = data.config as unknown as Record<string, unknown>;
  const replicas = config.replicas as number | undefined;
  const cpu = config.cpu as string | undefined;
  const memory = config.memory as string | undefined;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative min-w-[150px] rounded-xl border-2 bg-card shadow-sm transition-all cursor-pointer",
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
        </div>

        {/* Host info badge */}
        {hostNode && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="truncate">{hostNode.data.label}</span>
          </div>
        )}

        {/* K8s overlay — show replicas / resources when on solution-design layer */}
        {activeLayer === "solution-design" && (replicas || cpu || memory) && (
          <div className="mt-1.5 pt-1.5 border-t border-border/50 text-[10px] text-muted-foreground space-y-0.5">
            {replicas !== undefined && (
              <div className="flex justify-between">
                <span>Réplicas</span>
                <span className="font-medium text-foreground">{replicas}</span>
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
