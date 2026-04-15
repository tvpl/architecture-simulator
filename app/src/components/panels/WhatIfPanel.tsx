"use client";
/**
 * WhatIfPanel — cost what-if analysis.
 * Shows current total cost vs projected cost after tweaking key parameters.
 * Uses a virtual copy of nodes to compute new costs without modifying the canvas.
 */
import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, TrendingDown, TrendingUp, Minus, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowStore, selectDomainNodes } from "@/stores/flow-store";
import { useUIStore } from "@/stores/ui-store";
import { calculateServiceCost } from "@/domain/services/cost";
import { formatUSD } from "@/lib/formatters";
import { registry } from "@/registry";
import type { ArchitectureNode } from "@/domain/entities/node";
import type { NumberField } from "@/registry/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

// Tweak-able parameters per service type
type Multiplier = { label: string; key: string; min: number; max: number; step: number; current: number; unit?: string };

/** Auto-discovers cost-impacting NumberFields from the registry for each node. */
function buildMultipliers(nodes: ArchitectureNode[]): Record<string, Multiplier> {
  const result: Record<string, Multiplier> = {};

  // Keys that are non-cost-impacting — skip these
  const skipKeys = new Set(["inboundRules", "outboundRules", "alarmsCount", "retentionDays",
    "idleTimeoutSec", "timeoutSec", "bounceRateTarget", "replicationFactor"]);

  nodes.forEach((node) => {
    if (node.type === "note" || node.type === "vpc" || node.type === "subnet" || node.type === "security-group") return;

    const def = registry.get(node.type);
    if (!def) return;

    const cfg = node.config as unknown as Record<string, unknown>;

    // Collect all number fields from all configSections
    const numberFields: NumberField[] = [];
    def.configSections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.kind === "number" && !skipKeys.has(field.key)) {
          numberFields.push(field);
        }
      });
    });

    // Keep at most 2 fields per node (the most cost-impacting ones)
    const priorityKeys = ["memoryMB", "count", "taskCount", "nodeCount", "storageGB",
      "storageSizeGB", "requestsPerMonth", "shardCount", "brokerCount",
      "messagesPerMonth", "dpuHoursPerMonth", "instanceCount", "queriesPerMonth", "dataScanTB"];

    const sorted = [...numberFields].sort((a, b) => {
      const ai = priorityKeys.indexOf(a.key);
      const bi = priorityKeys.indexOf(b.key);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    sorted.slice(0, 2).forEach((field) => {
      const current = typeof cfg[field.key] === "number" ? (cfg[field.key] as number) : (field.min ?? 0);
      const id = `${node.id}-${field.key}`;
      result[id] = {
        label: `${node.label} — ${field.label}`,
        key: field.key,
        min: field.min ?? 0,
        max: field.max ?? 1000,
        step: field.step ?? 1,
        current,
        unit: field.unit,
      };
    });
  });

  return result;
}

export function WhatIfPanel() {
  const { whatIfPanelOpen, toggleWhatIfPanel } = useUIStore();
  const nodes = useFlowStore((s) => selectDomainNodes(s));

  // Local overrides: nodeId-key -> new value
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const multipliers = useMemo(() => buildMultipliers(nodes), [nodes]);

  // Current total cost
  const currentTotal = useMemo(
    () => nodes.reduce((sum, n) => sum + calculateServiceCost(n).monthlyCostUSD, 0),
    [nodes]
  );

  // Projected cost with overrides applied
  const projectedTotal = useMemo(() => {
    return nodes.reduce((sum, node) => {
      // Find any override keys for this node
      const patchedConfig = { ...(node.config as unknown as Record<string, unknown>) };
      Object.entries(overrides).forEach(([k, v]) => {
        if (k.startsWith(node.id + "-")) {
          // Find which config key this override affects
          const mId = k;
          const mDef = multipliers[mId];
          if (mDef) patchedConfig[mDef.key] = v;
        }
      });
      const patchedNode = { ...node, config: patchedConfig } as unknown as ArchitectureNode;
      return sum + calculateServiceCost(patchedNode).monthlyCostUSD;
    }, 0);
  }, [nodes, overrides, multipliers]);

  const delta = projectedTotal - currentTotal;
  const deltaPercent = currentTotal > 0 ? (delta / currentTotal) * 100 : 0;

  const handleReset = () => setOverrides({});

  if (nodes.length === 0) return null;

  return (
    <AnimatePresence>
      {whatIfPanelOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute top-2 right-2 bottom-2 w-80 z-20 flex flex-col bg-background border border-border rounded-xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
            <Calculator className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Análise What-if</div>
              <div className="text-xs text-muted-foreground">Simule alterações de custo</div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleWhatIfPanel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Cost comparison */}
          <div className="p-3 border-b border-border shrink-0 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <div className="text-[10px] text-muted-foreground mb-1">Atual</div>
                <div className="text-base font-bold text-foreground">{formatUSD(currentTotal)}</div>
                <div className="text-[10px] text-muted-foreground">/mês</div>
              </div>
              <div className={cn(
                "rounded-lg p-3 text-center",
                delta > 0 ? "bg-red-50 dark:bg-red-950/20" : delta < 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/50"
              )}>
                <div className="text-[10px] text-muted-foreground mb-1">Projetado</div>
                <div className={cn(
                  "text-base font-bold",
                  delta > 0 ? "text-red-600 dark:text-red-400" : delta < 0 ? "text-green-600 dark:text-green-400" : "text-foreground"
                )}>
                  {formatUSD(projectedTotal)}
                </div>
                <div className="text-[10px] text-muted-foreground">/mês</div>
              </div>
            </div>

            {/* Delta badge */}
            {delta !== 0 && (
              <div className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold",
                delta > 0
                  ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              )}>
                {delta > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {delta > 0 ? "+" : ""}{formatUSD(delta)} ({delta > 0 ? "+" : ""}{deltaPercent.toFixed(1)}%)
              </div>
            )}
            {delta === 0 && (
              <div className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm text-muted-foreground bg-muted/50">
                <Minus className="w-4 h-4" />
                Sem alteração
              </div>
            )}
          </div>

          {/* Parameter sliders */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Parâmetros
              </div>
              {Object.keys(multipliers).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Adicione serviços ao canvas para configurar parâmetros de custo.
                </p>
              )}
              {Object.entries(multipliers).map(([id, m], idx) => {
                const current = overrides[id] ?? m.current;
                return (
                  <div key={id} className="space-y-1.5">
                    {idx > 0 && <Separator />}
                    <div className="flex items-center justify-between pt-1">
                      <Label className="text-xs leading-tight">{m.label}</Label>
                      <span className="text-xs font-medium text-foreground">{current.toLocaleString()}{m.unit ? ` ${m.unit}` : ""}</span>
                    </div>
                    <Slider
                      min={m.min}
                      max={m.max}
                      step={m.step}
                      value={[current]}
                      onValueChange={([v]) =>
                        setOverrides((prev) => ({ ...prev, [id]: v }))
                      }
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{m.min}</span>
                      <span className="text-muted-foreground/60">original: {m.current}</span>
                      <span>{m.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Footer */}
          {Object.keys(overrides).length > 0 && (
            <div className="p-3 border-t border-border shrink-0">
              <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                Resetar alterações
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
