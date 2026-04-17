"use client";
/**
 * ContainerNode — renders VPC, Subnet, and SecurityGroup as visual containers.
 * Upgraded: colored top accent bar, children count badge, improved visual design.
 */
import React, { memo } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { registry } from "@/registry";
import { useFlowStore, type FlowNode } from "@/stores/flow-store";
import { ServiceIcon } from "./ServiceIcon";

// Per-type visual theme
const CONTAINER_THEMES: Record<
  string,
  {
    border: string;
    bg: string;
    accentBg: string;
    badge: string;
    label?: (data: { config: unknown; label: string }) => string;
  }
> = {
  vpc: {
    border: "border-violet-400/60",
    bg: "bg-violet-50/20 dark:bg-violet-950/10",
    accentBg: "bg-violet-500",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  subnet: {
    border: "border-blue-400/60",
    bg: "bg-blue-50/20 dark:bg-blue-950/10",
    accentBg: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  "security-group": {
    border: "border-slate-400/60",
    bg: "bg-slate-50/20 dark:bg-slate-950/5",
    accentBg: "bg-slate-500",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  },
  region: {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/[0.04]",
    accentBg: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400",
    label: (data) =>
      `\u{1F30E} ${(data.config as { regionCode?: string }).regionCode ?? "region"}`,
  },
};

const ContainerNode = memo(function ContainerNode({ data, selected }: NodeProps<FlowNode>) {
  const def = registry.get(data.type);
  const theme = CONTAINER_THEMES[data.type] ?? CONTAINER_THEMES["security-group"];
  const displayLabel = theme.label ? theme.label({ config: data.config, label: data.label }) : data.label;

  // Count direct children of this container
  const childCount = useFlowStore((s) =>
    s.nodes.filter((n) => n.parentId === data.id || n.data.parentId === data.id).length
  );

  const isSubnet = data.type === "subnet";
  const isPublic = (data.config as { isPublic?: boolean }).isPublic;

  return (
    <div
      className={cn(
        "w-full h-full rounded-xl border-2 border-dashed relative overflow-hidden",
        theme.border,
        theme.bg,
        selected && "ring-2 ring-primary/40 ring-offset-1 border-solid"
      )}
    >
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="border-primary/60"
        handleClassName="h-3 w-3 bg-primary border-2 border-background rounded-sm shadow"
      />

      {/* Top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 rounded-t-xl", theme.accentBg)} />

      {/* Label row */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-1.5">
        {def && (
          <div className={cn("p-1 rounded-md shrink-0", def.bgColor)}>
            <ServiceIcon iconName={def.iconName} className={cn("w-3 h-3", def.color)} />
          </div>
        )}
        <span className="text-xs font-semibold text-foreground/80 bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded truncate">
          {displayLabel}
        </span>

        {/* Subnet public/private badge */}
        {isSubnet && (
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0",
              isPublic
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400"
            )}
          >
            {isPublic ? "Public" : "Private"}
          </span>
        )}

        {/* Children count badge */}
        {childCount > 0 && (
          <span className={cn("ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0", theme.badge)}>
            {childCount} {childCount === 1 ? "nó" : "nós"}
          </span>
        )}
      </div>
    </div>
  );
});

export { ContainerNode };
