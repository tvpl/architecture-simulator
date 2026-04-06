"use client";
/**
 * ProtocolEdge — connection renderer with protocol indicator and latency label.
 */
import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { PROTOCOL_INFO } from "@/domain/entities/edge";
import { useLayerStore } from "@/stores/layer-store";
import { useSelectionStore } from "@/stores/selection-store";
import type { FlowEdge } from "@/stores/flow-store";
import type { ConnectionEdge } from "@/domain/entities/edge";

const ProtocolEdge = memo(function ProtocolEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<FlowEdge>) {
  const edgeData = data as ConnectionEdge | undefined;
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const selectEdge = useSelectionStore((s) => s.selectEdge);

  const protocol = edgeData?.protocol ?? "https";
  const protocolInfo = PROTOCOL_INFO[protocol];
  const isAsync = protocolInfo.isAsync;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  const showLabel =
    activeLayer === "services" || activeLayer === "simulation" || selected;

  const edgeColor = selected ? "#6366f1" : protocolInfo.color;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: isAsync ? "6 3" : undefined,
        }}
        markerEnd={`url(#arrowhead-${protocol})`}
        interactionWidth={12}
        onClick={() => selectEdge(id)}
      />

      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "absolute pointer-events-all nopan",
              "flex items-center gap-1 rounded-full px-2 py-0.5",
              "text-[10px] font-semibold border",
              "cursor-pointer hover:ring-1 hover:ring-primary/40",
              "bg-background/90 backdrop-blur-sm shadow-sm"
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={() => selectEdge(id)}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: protocolInfo.color }}
            />
            <span style={{ color: protocolInfo.color }}>
              {protocolInfo.displayName}
            </span>
            {edgeData?.latencyMs && activeLayer === "simulation" && (
              <span className="text-muted-foreground ml-1">
                {edgeData.latencyMs}ms
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export { ProtocolEdge };
