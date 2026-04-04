"use client";
/**
 * ContainerNode — renders VPC, Subnet, and SecurityGroup as visual containers.
 * Uses React Flow's built-in group node support with NodeResizer.
 */
import React, { memo } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { registry } from "@/registry";
import type { FlowNode } from "@/stores/flow-store";
import { ServiceIcon } from "./ServiceIcon";

const ContainerNode = memo(function ContainerNode({ data, selected }: NodeProps<FlowNode>) {
  const def = registry.get(data.type);

  const containerStyles: Record<string, string> = {
    vpc: "border-violet-400 bg-violet-50/30 dark:bg-violet-950/10",
    subnet: "border-violet-300 bg-violet-50/20 dark:bg-violet-950/5",
    "security-group": "border-slate-400 bg-slate-50/20 dark:bg-slate-950/5",
  };

  return (
    <div
      className={cn(
        "w-full h-full rounded-xl border-2 border-dashed",
        containerStyles[data.type] ?? "border-border bg-muted/10",
        selected && "ring-2 ring-primary/40 ring-offset-1"
      )}
    >
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        lineClassName="border-primary"
        handleClassName="h-3 w-3 bg-primary border-2 border-background rounded"
      />

      {/* Label badge in top-left */}
      <div className="absolute top-2 left-3 flex items-center gap-1.5">
        {def && (
          <div className={cn("p-1 rounded-md", def.bgColor)}>
            <ServiceIcon iconName={def.iconName} className={cn("w-3 h-3", def.color)} />
          </div>
        )}
        <span className="text-xs font-semibold text-foreground/70 bg-background/80 px-1.5 py-0.5 rounded">
          {data.label}
        </span>
        {data.type === "subnet" && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-medium",
            (data.config as { isPublic?: boolean }).isPublic
              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
              : "bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400"
          )}>
            {(data.config as { isPublic?: boolean }).isPublic ? "Pública" : "Privada"}
          </span>
        )}
      </div>
    </div>
  );
});

export { ContainerNode };
