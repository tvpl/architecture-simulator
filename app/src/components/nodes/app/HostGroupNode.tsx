"use client";
/**
 * HostGroupNode — background container that visually groups app components
 * by their hosting infrastructure node.
 *
 * Rendered on Layer 2 (solution-design) as a large, semi-transparent card
 * showing which infrastructure host (EC2, ECS, EKS, Lambda, Fargate) contains
 * which application components. Not user-draggable; purely a visual grouping.
 */
import React, { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { registry } from "@/registry";
import { ServiceIcon } from "@/components/nodes/base/ServiceIcon";

// ── Color schemes keyed by infrastructure type ──────────────────────────────

const HOST_COLOR_SCHEMES: Record<
  string,
  { border: string; bg: string; badge: string; accent: string }
> = {
  ec2: {
    border: "border-amber-400/60 dark:border-amber-500/40",
    bg: "bg-amber-500/[0.08] dark:bg-amber-400/[0.06]",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    accent: "text-amber-600 dark:text-amber-400",
  },
  ecs: {
    border: "border-teal-400/60 dark:border-teal-500/40",
    bg: "bg-teal-500/[0.08] dark:bg-teal-400/[0.06]",
    badge: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
    accent: "text-teal-600 dark:text-teal-400",
  },
  eks: {
    border: "border-blue-400/60 dark:border-blue-500/40",
    bg: "bg-blue-500/[0.08] dark:bg-blue-400/[0.06]",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    accent: "text-blue-600 dark:text-blue-400",
  },
  lambda: {
    border: "border-orange-400/60 dark:border-orange-500/40",
    bg: "bg-orange-500/[0.08] dark:bg-orange-400/[0.06]",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    accent: "text-orange-600 dark:text-orange-400",
  },
  fargate: {
    border: "border-cyan-400/60 dark:border-cyan-500/40",
    bg: "bg-cyan-500/[0.08] dark:bg-cyan-400/[0.06]",
    badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
    accent: "text-cyan-600 dark:text-cyan-400",
  },
};

const DEFAULT_COLOR_SCHEME = {
  border: "border-slate-400/50 dark:border-slate-500/30",
  bg: "bg-slate-500/[0.08] dark:bg-slate-400/[0.06]",
  badge: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300",
  accent: "text-slate-600 dark:text-slate-400",
};

// ── Data shape ──────────────────────────────────────────────────────────────

export interface HostGroupNodeData {
  /** Infrastructure node id from Layer 1 */
  hostId: string;
  /** Display name of the host */
  hostLabel: string;
  /** Infrastructure type (ec2, ecs, eks, lambda, fargate, etc.) */
  hostType: string;
  /** Number of app components currently assigned to this host */
  childCount: number;
  /** Index signature for React Flow Node<T> compatibility */
  [key: string]: unknown;
}

/** React Flow Node wrapping HostGroupNodeData */
export type HostGroupFlowNode = Node<HostGroupNodeData>;

// ── Component ───────────────────────────────────────────────────────────────

const HostGroupNode = memo(function HostGroupNode({
  data,
}: NodeProps<HostGroupFlowNode>) {
  const { hostLabel, hostType, childCount } = data as HostGroupNodeData;

  const scheme = HOST_COLOR_SCHEMES[hostType] ?? DEFAULT_COLOR_SCHEME;
  const def = registry.get(hostType as Parameters<typeof registry.get>[0]);

  return (
    <div
      className={cn(
        "min-w-[300px] min-h-[200px] w-full h-full rounded-2xl border-2 border-dashed",
        "pointer-events-none select-none",
        scheme.border,
        scheme.bg,
      )}
    >
      {/* Hidden handles (required by React Flow for group positioning, but invisible) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-0 !h-0 !border-0 !bg-transparent"
      />

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2">
        {/* Host identity */}
        <div className="flex items-center gap-2">
          {def && (
            <div
              className={cn(
                "p-1.5 rounded-lg shadow-sm",
                def.bgColor,
                "bg-opacity-80 dark:bg-opacity-80",
              )}
            >
              <ServiceIcon
                iconName={def.iconName}
                className={cn("w-4 h-4", def.color)}
              />
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground/80 leading-tight truncate max-w-[200px]">
              {hostLabel}
            </span>
            <span className={cn("text-[10px] leading-tight", scheme.accent)}>
              {def?.label ?? hostType}
            </span>
          </div>
        </div>

        {/* Component count badge */}
        {childCount > 0 && (
          <div
            className={cn(
              "flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 shadow-sm",
              scheme.badge,
            )}
          >
            <span>{childCount}</span>
            <span className="font-normal">
              {childCount === 1 ? "componente" : "componentes"}
            </span>
          </div>
        )}
      </div>

      {/* Hidden bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-0 !h-0 !border-0 !bg-transparent"
      />
    </div>
  );
});

export { HostGroupNode };
