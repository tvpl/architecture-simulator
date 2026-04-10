"use client";
import React from "react";
import { Layers, Boxes, DollarSign, Play } from "lucide-react";
import { motion } from "framer-motion";
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
  {
    num: string;
    activeText: string;
    numActive: string;
    numInactive: string;
    dotColor: string;
  }
> = {
  architecture: {
    num: "L1",
    activeText: "text-blue-600 dark:text-blue-400",
    numActive: "bg-blue-500 text-white",
    numInactive: "bg-transparent text-muted-foreground",
    dotColor: "bg-blue-500",
  },
  "solution-design": {
    num: "L2",
    activeText: "text-violet-600 dark:text-violet-400",
    numActive: "bg-violet-500 text-white",
    numInactive: "bg-transparent text-muted-foreground",
    dotColor: "bg-violet-500",
  },
  cost: {
    num: "L3",
    activeText: "text-emerald-600 dark:text-emerald-400",
    numActive: "bg-emerald-500 text-white",
    numInactive: "bg-transparent text-muted-foreground",
    dotColor: "bg-emerald-500",
  },
  simulation: {
    num: "L4",
    activeText: "text-orange-600 dark:text-orange-400",
    numActive: "bg-orange-500 text-white",
    numInactive: "bg-transparent text-muted-foreground",
    dotColor: "bg-orange-500",
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
                    "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 z-10",
                    isActive ? meta.activeText : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Sliding animated background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="active-layer-pill"
                      className="absolute inset-0 rounded-lg bg-background shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}

                  {/* Content above the animated bg */}
                  <span className="relative flex items-center gap-1.5">
                    {/* Layer number tag */}
                    <motion.span
                      className={cn(
                        "text-[9px] font-bold px-1 py-0.5 rounded leading-none transition-colors",
                        isActive ? meta.numActive : meta.numInactive
                      )}
                      animate={{ scale: isActive ? 1 : 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      {meta.num}
                    </motion.span>

                    <Icon className="w-3.5 h-3.5 shrink-0" />

                    <span className="hidden lg:inline whitespace-nowrap">{config.displayName}</span>
                  </span>

                  {/* Count badge */}
                  {badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full z-20",
                        "text-[9px] font-bold flex items-center justify-center leading-none",
                        meta.numActive
                      )}
                    >
                      {badge}
                    </motion.span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px]" side="bottom">
                <div className="flex items-center gap-2 mb-0.5">
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
