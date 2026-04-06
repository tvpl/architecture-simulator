"use client";
import React from "react";
import { Layers, Network, DollarSign, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayerStore } from "@/stores/layer-store";
import { LAYER_CONFIGS } from "@/domain/entities/layer";
import type { LayerType } from "@/domain/entities/layer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LAYER_ICONS: Record<LayerType, React.ElementType> = {
  architecture: Layers,
  services: Network,
  cost: DollarSign,
  simulation: Play,
};

export function LayerSwitcher() {
  const { activeLayer, setActiveLayer } = useLayerStore();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-1">
        {(Object.keys(LAYER_CONFIGS) as LayerType[]).map((layer) => {
          const config = LAYER_CONFIGS[layer];
          const Icon = LAYER_ICONS[layer];
          const isActive = activeLayer === layer;

          return (
            <Tooltip key={layer}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveLayer(layer)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{config.displayName}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{config.displayName}</p>
                <p className="text-xs opacity-80">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
