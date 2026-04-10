"use client";
import React from "react";
import { Layers, Boxes, DollarSign, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayerStore } from "@/stores/layer-store";
import { LAYER_CONFIGS } from "@/domain/entities/layer";
import type { LayerType } from "@/domain/entities/layer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFlowStore } from "@/stores/flow-store";
import { useSimulationStore } from "@/stores/simulation-store";

const LAYER_ICONS: Record<LayerType, React.ElementType> = {
  architecture: Layers,
  "solution-design": Boxes,
  cost: DollarSign,
  simulation: Play,
};

const LAYER_META: Record<
  LayerType,
  { num: string; activeText: string; activeBg: string; activeRing: string; numActive: string; numInactive: string }
> = {
  architecture: {
    num: "L1",
    activeText: "text-blue-600 dark:text-blue-400",
    activeBg: "bg-background",
    activeRing: "ring-blue-500/40",
    numActive: "bg-blue-500 text-white",
    numInactive: "bg-muted-foreground/20 text-muted-foreground",
  },
  "solution-design": {
    num: "L2",
    activeText: "text-violet-600 dark:text-violet-400",
    activeBg: "bg-background",
    activeRing: "ring-violet-500/40",
    numActive: "bg-violet-500 text-white",
    numInactive: "bg-muted-foreground/20 text-muted-foreground",
  },
  cost: {
    num: "L3",
    activeText: "text-emerald-600 dark:text-emerald-400",
    activeBg: "bg-background",
    activeRing: "ring-emerald-500/40",
    numActive: "bg-emerald-500 text-white",
    numInactive: "bg-muted-foreground/20 text-muted-foreground",
  },
  simulation: {
    num: "L4",
    activeText: "text-orange-600 dark:text-orange-400",
    activeBg: "bg-background",
    activeRing: "ring-orange-500/40",
    numActive: "bg-orange-500 text-white",
    numInactive: "bg-muted-foreground/20 text-muted-foreground",
  },
};

export function LayerSwitcher() {
  const { activeLayer, setActiveLayer } = useLayerStore();
  const nodeCount = useFlowStore((s) => s.nodes.length);
  const solutionCount = useFlowStore((s) => s.solutionNodes.length);
  const simStatus = useSimulationStore((s) => s.status);

  function getBadge(layer: LayerType): string | null {
    if (layer === "architecture" && nodeCount > 0) return String(nodeCount);
    if (layer === "solution-design" && solutionCount > 0) return String(solutionCount);
    if (layer === "simulation" && simStatus === "complete") return "✓";
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-1 border border-border/40 shadow-sm">
        {(Object.keys(LAYER_CONFIGS) as LayerType[]).map((layer) => {
          const config = LAYER_CONFIGS[layer];
          const Icon = LAYER_ICONS[layer];
          const meta = LAYER_META[layer];
          const isActive = activeLayer === layer;
          const badge = getBadge(layer);

          return (
            <Tooltip key={layer}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveLayer(layer)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                    isActive
                      ? `${meta.activeBg} shadow-sm ring-2 ${meta.activeRing} ${meta.activeText}`
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  )}
                >
                  {/* Layer number tag */}
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1 py-0.5 rounded leading-none transition-all",
                      isActive ? meta.numActive : meta.numInactive
                    )}
                  >
                    {meta.num}
                  </span>

                  <Icon className="w-3.5 h-3.5 shrink-0" />

                  <span className="hidden lg:inline whitespace-nowrap">{config.displayName}</span>

                  {/* Count / status badge */}
                  {badge && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full",
                        "text-[9px] font-bold flex items-center justify-center leading-none",
                        isActive ? meta.numActive : "bg-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px]" side="bottom">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", meta.numActive)}>
                    {meta.num}
                  </span>
                  <p className="font-semibold text-sm">{config.displayName}</p>
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
