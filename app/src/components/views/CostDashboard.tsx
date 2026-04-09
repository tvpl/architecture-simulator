"use client";
/**
 * CostDashboard — Layer 3 view replacing the canvas with a cost report/dashboard.
 * Shows cost breakdown by service, category charts, and projections.
 */
import React, { useMemo } from "react";
import { DollarSign, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlowStore, selectDomainNodes, selectSolutionDomainNodes } from "@/stores/flow-store";
import { calculateServiceCost, estimateAppComponentCost } from "@/domain/services/cost";
import { formatUSD } from "@/lib/formatters";
import { registry } from "@/registry";
import { appComponentRegistry } from "@/registry/app-components";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CostDashboard() {
  const domainNodes = useFlowStore(selectDomainNodes);
  const appNodes = useFlowStore(selectSolutionDomainNodes);

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

  const appCosts = useMemo(
    () =>
      appNodes
        .map((node) => {
          const cost = estimateAppComponentCost(node);
          const def = appComponentRegistry.get(node.type);
          return {
            id: node.id,
            label: node.label,
            type: node.type,
            typeName: def?.label ?? node.type,
            color: def?.color ?? "text-muted-foreground",
            bgColor: def?.bgColor ?? "bg-muted",
            monthlyCost: cost.monthlyCostUSD,
            details: cost.details,
            isAppComponent: true,
          };
        })
        .sort((a, b) => b.monthlyCost - a.monthlyCost),
    [appNodes]
  );

  const totalMonthlyCost = serviceCosts.reduce((sum, s) => sum + s.monthlyCost, 0)
    + appCosts.reduce((sum, s) => sum + s.monthlyCost, 0);
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

        {/* Category breakdown with SVG pie chart */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Custo por Categoria</h3>
          </div>
          <div className="flex gap-6">
            {/* SVG Pie Chart */}
            <div className="shrink-0">
              <MiniPieChart data={categoryBreakdown} total={totalMonthlyCost} />
            </div>
            {/* Bar breakdown */}
            <div className="flex-1 space-y-2">
              {categoryBreakdown.map(({ category, cost }, i) => {
                const pct = totalMonthlyCost > 0 ? (cost / totalMonthlyCost) * 100 : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 capitalize text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {category}
                      </span>
                      <span className="font-medium">{formatUSD(cost)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Infrastructure cost breakdown */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Infraestrutura (Layer 1)</h3>
          </div>
          <div className="divide-y divide-border">
            {serviceCosts.map((s) => (
              <CostRow key={s.id} label={s.label} typeName={s.typeName} cost={s.monthlyCost} />
            ))}
          </div>
        </div>

        {/* App component cost breakdown */}
        {appCosts.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Componentes de Solução (Layer 2)</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Estimativa de consumo de recursos nos hosts</p>
            </div>
            <div className="divide-y divide-border">
              {appCosts.map((s) => (
                <CostRow key={s.id} label={s.label} typeName={s.typeName} cost={s.monthlyCost} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function CostRow({ label, typeName, cost }: { label: string; typeName: string; cost: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{label}</div>
        <div className="text-[10px] text-muted-foreground">{typeName}</div>
      </div>
      <div className="text-right">
        <div
          className={cn(
            "text-xs font-semibold",
            cost > 500
              ? "text-red-600 dark:text-red-400"
              : cost > 100
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-green-600 dark:text-green-400"
          )}
        >
          {formatUSD(cost)}/mês
        </div>
      </div>
    </div>
  );
}

// ── SVG Pie Chart ──────────────────────────────────────────────────────────

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#06b6d4", "#f97316"];

function MiniPieChart({ data, total }: { data: { category: string; cost: number }[]; total: number }) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 45;

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={2} className="text-muted" />
      </svg>
    );
  }

  // Pre-compute slice geometry to avoid mutable state inside .map()
  const sliceData = data.reduce<{ startAngle: number; endAngle: number; color: string }[]>(
    (acc, { cost }, i) => {
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : -90;
      const angle = (cost / total) * 360;
      acc.push({ startAngle: prevEnd, endAngle: prevEnd + angle, color: PIE_COLORS[i % PIE_COLORS.length] });
      return acc;
    },
    [],
  );

  const slices = sliceData.map(({ startAngle, endAngle, color }, i) => {
    if (data.length === 1) {
      return <circle key={i} cx={cx} cy={cy} r={r} fill={color} />;
    }

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return (
      <path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={color}
        stroke="white"
        strokeWidth={1}
        className="dark:stroke-background"
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
      {/* Center hole for donut effect */}
      <circle cx={cx} cy={cy} r={r * 0.55} className="fill-card" />
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">
        {formatUSD(total)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-muted-foreground text-[8px]">
        /mês
      </text>
    </svg>
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
