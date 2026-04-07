"use client";
/**
 * CostDashboard — Layer 3 view replacing the canvas with a cost report/dashboard.
 * Shows cost breakdown by service, category charts, and projections.
 */
import React, { useMemo } from "react";
import { DollarSign, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowStore, selectDomainNodes } from "@/stores/flow-store";
import { calculateServiceCost } from "@/domain/services/cost";
import { formatUSD } from "@/lib/formatters";
import { registry } from "@/registry";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CostDashboard() {
  const domainNodes = useFlowStore(selectDomainNodes);

  const serviceCosts = useMemo(
    () =>
      domainNodes
        .map((node) => {
          const cost = calculateServiceCost(node);
          const def = registry.get(node.type);
          return {
            id: node.id,
            label: node.label,
            type: node.type,
            typeName: def?.label ?? node.type,
            color: def?.color ?? "text-muted-foreground",
            bgColor: def?.bgColor ?? "bg-muted",
            monthlyCost: cost.monthlyCostUSD,
            details: cost.details,
          };
        })
        .sort((a, b) => b.monthlyCost - a.monthlyCost),
    [domainNodes]
  );

  const totalMonthlyCost = serviceCosts.reduce((sum, s) => sum + s.monthlyCost, 0);
  const annualProjection = totalMonthlyCost * 12;

  // Group by category
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of serviceCosts) {
      const cat = registry.get(s.type)?.category ?? "other";
      map.set(cat, (map.get(cat) ?? 0) + s.monthlyCost);
    }
    return Array.from(map.entries())
      .map(([cat, cost]) => ({ category: cat, cost }))
      .sort((a, b) => b.cost - a.cost);
  }, [serviceCosts]);

  if (domainNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3 opacity-50">
          <DollarSign className="w-12 h-12 mx-auto text-muted-foreground" />
          <div className="text-sm font-medium text-muted-foreground">
            Nenhum componente de infraestrutura
          </div>
          <div className="text-xs text-muted-foreground">
            Adicione componentes na aba Arquitetura para ver a análise de custos
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Custo Mensal"
            value={formatUSD(totalMonthlyCost)}
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-50 dark:bg-blue-950/30"
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Projeção Anual"
            value={formatUSD(annualProjection)}
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-50 dark:bg-emerald-950/30"
          />
          <SummaryCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="Componentes"
            value={String(domainNodes.length)}
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-50 dark:bg-purple-950/30"
          />
        </div>

        {/* Category breakdown */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Custo por Categoria</h3>
          </div>
          <div className="space-y-2">
            {categoryBreakdown.map(({ category, cost }) => {
              const pct = totalMonthlyCost > 0 ? (cost / totalMonthlyCost) * 100 : 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{category}</span>
                    <span className="font-medium">{formatUSD(cost)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service-level breakdown table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Detalhamento por Serviço</h3>
          </div>
          <div className="divide-y divide-border">
            {serviceCosts.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground">{s.typeName}</div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-xs font-semibold",
                      s.monthlyCost > 500
                        ? "text-red-600 dark:text-red-400"
                        : s.monthlyCost > 100
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    )}
                  >
                    {formatUSD(s.monthlyCost)}/mês
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  bg: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border p-4", bg)}>
      <div className={cn("flex items-center gap-2 mb-2", accent)}>{icon}<span className="text-xs font-medium">{label}</span></div>
      <div className={cn("text-2xl font-bold", accent)}>{value}</div>
    </div>
  );
}
