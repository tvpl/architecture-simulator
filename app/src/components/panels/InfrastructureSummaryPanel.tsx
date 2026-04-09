"use client";
/**
 * InfrastructureSummaryPanel — Layer 1 summary showing component counts by category.
 * Displayed as a floating panel on the architecture canvas.
 */
import React, { useMemo, useState } from "react";
import { Layers, ChevronDown, ChevronUp } from "lucide-react";
import { useFlowStore, selectDomainNodes } from "@/stores/flow-store";
import { registry } from "@/registry";
import { useLayerStore } from "@/stores/layer-store";

export function InfrastructureSummaryPanel() {
  const activeLayer = useLayerStore((s) => s.activeLayer);
  const domainNodes = useFlowStore(selectDomainNodes);
  const [collapsed, setCollapsed] = useState(false);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const node of domainNodes) {
      const def = registry.get(node.type);
      const cat = def?.category ?? "other";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [domainNodes]);

  // Only show on architecture layer with nodes
  if (activeLayer !== "architecture") return null;
  if (domainNodes.length === 0) return null;

  return (
    <div className="absolute top-3 right-3 z-10 w-52 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Resumo</span>
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5">
            {domainNodes.length}
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-3 pb-2 space-y-1">
          {categoryCounts.map(({ category, count }) => (
            <div
              key={category}
              className="flex items-center justify-between text-[11px]"
            >
              <span className="capitalize text-muted-foreground">{category}</span>
              <span className="font-medium text-foreground">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
