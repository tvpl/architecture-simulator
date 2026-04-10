"use client";
/**
 * ProtocolEdge — connection renderer with protocol indicator and latency label.
 * Shows animated particles (SVG animateMotion) during simulation.
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
import { useSimulationStore } from "@/stores/simulation-store";
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
  const simStatus = useSimulationStore((s) => s.status);
  const simResults = useSimulationStore((s) => s.result);

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
    activeLayer === "solution-design" || activeLayer === "simulation" || selected;

  const edgeColor = selected ? "#6366f1" : protocolInfo.color;

  // ── Particle animation (T-7.6) ────────────────────────────────────────────
  // Show particles on edges when simulation is running or complete (L4 layer)
  const isSimActive =
    activeLayer === "simulation" &&
    (simStatus === "running" || simStatus === "complete");

  // Determine particle count and speed based on throughput
  const edgeThroughput = edgeData?.throughputRPS ?? 1000;
  const particleCount = edgeThroughput >= 5000 ? 3 : edgeThroughput >= 1000 ? 2 : 1;
  const baseSpeedSec = edgeThroughput >= 5000 ? 1.2 : edgeThroughput >= 1000 ? 1.8 : 2.5;

  // Color-code particles by latency (if simulation has results)
  const edgeLatency = edgeData?.latencyMs ?? 0;
  const hasBottleneck = simResults?.bottlenecks.some(
    (b) => b.nodeId === edgeData?.target
  ) ?? false;

  const particleColor = hasBottleneck
    ? "#ef4444"
    : edgeLatency > 500
    ? "#f59e0b"
    : edgeColor;

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

      {/* Particle animation — SVG animateMotion along the edge path */}
      {isSimActive &&
        Array.from({ length: particleCount }, (_, idx) => {
          const delay = (idx / particleCount) * baseSpeedSec;
          const dur = simStatus === "running"
            ? `${baseSpeedSec * 0.7}s`
            : `${baseSpeedSec}s`;
          return (
            <g key={idx} style={{ pointerEvents: "none" }}>
              {/* Glow halo */}
              <circle r={5} fill={particleColor} opacity={0.2}>
                <animateMotion
                  dur={dur}
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                  path={edgePath}
                  rotate="auto"
                />
              </circle>
              {/* Core dot */}
              <circle r={2.5} fill={particleColor} opacity={0.9}>
                <animateMotion
                  dur={dur}
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                  path={edgePath}
                  rotate="auto"
                />
              </circle>
            </g>
          );
        })}

      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "absolute pointer-events-all nopan",
              "flex items-center gap-1 rounded-full px-2 py-0.5",
              "text-[10px] font-semibold border",
              "cursor-pointer hover:ring-1 hover:ring-primary/40",
              "bg-background/90 backdrop-blur-sm shadow-sm",
              hasBottleneck && activeLayer === "simulation" && "ring-1 ring-red-400"
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
