"use client";
/**
 * SimulationPanel — bottom panel displaying simulation results.
 * Tabs: Visão Geral | Caminhos | Recursos | Custos
 * Slides in/out via framer-motion. Charts powered by recharts.
 */
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  Info,
  AlertCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  Zap,
  Network,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { useSimulationStore } from "@/stores/simulation-store";
import { useUIStore } from "@/stores/ui-store";
import { formatUSD, formatLatency, formatThroughput } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import type { SimulationResult, Recommendation } from "@/domain/entities/simulation";

const PIE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
];

export function SimulationPanel() {
  const { simulationPanelOpen, closeSimulationPanel } = useUIStore();
  const { status, result, error } = useSimulationStore();

  return (
    <AnimatePresence>
      {simulationPanelOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 h-80 z-20 bg-background border-t border-border flex flex-col shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Resultados da Simulação</span>
              {status === "running" && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Simulando...
                </div>
              )}
              {status === "complete" && result && (
                <Badge variant="success" className="text-[10px]">Concluído</Badge>
              )}
              {status === "error" && (
                <Badge variant="critical" className="text-[10px]">Erro</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeSimulationPanel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          {status === "idle" && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Execute uma simulação para ver os resultados
            </div>
          )}

          {status === "running" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Analisando arquitetura...</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {status === "complete" && result && (
            <SimulationResults result={result} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Results ───────────────────────────────────────────────────────────────────

function SimulationResults({ result }: { result: SimulationResult }) {
  return (
    <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
      <TabsList className="shrink-0 mx-4 mt-2 h-8 w-fit">
        <TabsTrigger value="overview" className="text-xs px-3">Visão Geral</TabsTrigger>
        <TabsTrigger value="paths" className="text-xs px-3">Caminhos</TabsTrigger>
        <TabsTrigger value="resources" className="text-xs px-3">Recursos</TabsTrigger>
        <TabsTrigger value="cost" className="text-xs px-3">Custos</TabsTrigger>
      </TabsList>

      <ScrollArea className="flex-1">
        {/* Overview */}
        <TabsContent value="overview" className="m-0 px-4 py-3">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <MetricCard
              icon={<Zap className="w-4 h-4 text-yellow-500" />}
              label="Latência Total"
              value={formatLatency(result.totalLatencyMs)}
            />
            <MetricCard
              icon={<Network className="w-4 h-4 text-blue-500" />}
              label="Mensagens"
              value={result.totalMessages.toLocaleString()}
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4 text-green-500" />}
              label="Throughput"
              value={formatThroughput(result.totalMessages)}
            />
            <MetricCard
              icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
              label="Custo Mensal"
              value={formatUSD(result.totalMonthlyCostUSD)}
            />
          </div>

          {result.bottlenecks.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Gargalos</h3>
              <div className="space-y-1.5">
                {result.bottlenecks.map((b) => (
                  <div key={b.nodeId} className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-foreground">{b.nodeName}</span>
                      <p className="text-[10px] text-muted-foreground">{b.reason}</p>
                    </div>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                      {formatLatency(b.latencyMs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recomendações</h3>
              <div className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Paths */}
        <TabsContent value="paths" className="m-0 px-4 py-3">
          <div className="space-y-2">
            {result.pathAnalysis.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum caminho analisado.</p>
            )}
            {result.pathAnalysis.map((path, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg border p-3",
                  path.isLongest
                    ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">Caminho {i + 1}</span>
                    {path.isLongest && (
                      <Badge variant="critical" className="text-[10px]">Crítico</Badge>
                    )}
                  </div>
                  <span className="text-xs font-bold">{formatLatency(path.totalLatencyMs)}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {path.pathNames.map((name, ni) => (
                    <React.Fragment key={ni}>
                      <span className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5">
                        {name}
                      </span>
                      {ni < path.pathNames.length - 1 && (
                        <span className="text-[10px] text-muted-foreground self-center">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources" className="m-0 px-4 py-3">
          {result.resourceUtilization.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Utilização por Serviço
              </h3>
              <ResponsiveContainer width="100%" height={Math.max(80, result.resourceUtilization.length * 24)}>
                <BarChart
                  data={result.resourceUtilization.map((r) => ({
                    name: r.nodeName.length > 12 ? r.nodeName.slice(0, 12) + "…" : r.nodeName,
                    utilization: parseFloat(r.utilization.toFixed(1)),
                  }))}
                  layout="vertical"
                  margin={{ left: 0, right: 24, top: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 9 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                  <ReTooltip formatter={(v) => [`${v}%`, "Utilização"]} />
                  <Bar dataKey="utilization" radius={[0, 3, 3, 0]}>
                    {result.resourceUtilization.map((r, i) => (
                      <Cell
                        key={i}
                        fill={
                          r.utilization >= 90
                            ? "#ef4444"
                            : r.utilization >= 70
                            ? "#f59e0b"
                            : "#10b981"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-2">
            {result.resourceUtilization.map((res) => (
              <div key={res.nodeId} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-medium">{res.nodeName}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{res.nodeType}</span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      res.utilization >= 90
                        ? "text-red-600 dark:text-red-400"
                        : res.utilization >= 70
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    )}
                  >
                    {res.utilization.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={res.utilization}
                  className="h-1.5"
                  indicatorClassName={cn(
                    res.utilization >= 90
                      ? "bg-red-500"
                      : res.utilization >= 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  )}
                />
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                  <span>Throughput: {res.throughput}</span>
                  <span>SLA: {res.availability}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Cost */}
        <TabsContent value="cost" className="m-0 px-4 py-3">
          <div className="mb-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
            <div className="text-xs text-muted-foreground">Custo Mensal Total Estimado</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatUSD(result.totalMonthlyCostUSD)}
            </div>
            <div className="text-xs text-muted-foreground">
              ~{formatUSD(result.totalMonthlyCostUSD * 12)}/ano
            </div>
          </div>

          {/* PieChart */}
          {result.costBreakdown.filter((i) => i.monthlyCostUSD > 0).length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Distribuição de Custos
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={result.costBreakdown
                      .filter((i) => i.monthlyCostUSD > 0)
                      .map((i) => ({ name: i.component, value: i.monthlyCostUSD }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={55}
                    dataKey="value"
                    label={false}
                  >
                    {result.costBreakdown
                      .filter((i) => i.monthlyCostUSD > 0)
                      .map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                  </Pie>
                  <ReTooltip formatter={(v) => [formatUSD(Number(v)), "Custo/mês"]} />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: "9px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Breakdown list */}
          <div className="space-y-2">
            {result.costBreakdown
              .filter((item) => item.monthlyCostUSD > 0)
              .sort((a, b) => b.monthlyCostUSD - a.monthlyCostUSD)
              .map((item) => (
                <div key={item.nodeId} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-xs font-medium">{item.component}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{item.serviceType}</span>
                    </div>
                    <span className="text-xs font-bold">{formatUSD(item.monthlyCostUSD)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${item.percentage.toFixed(1)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                    <span>{item.details}</span>
                    <span>{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-base font-bold text-foreground">{value}</div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const Icon =
    rec.severity === "critical"
      ? AlertCircle
      : rec.severity === "warning"
      ? AlertTriangle
      : Info;
  const badgeVariant =
    rec.severity === "critical"
      ? "critical"
      : rec.severity === "warning"
      ? "warning"
      : "info";

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1">
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            "w-3.5 h-3.5 mt-0.5 shrink-0",
            rec.severity === "critical"
              ? "text-red-500"
              : rec.severity === "warning"
              ? "text-yellow-500"
              : "text-blue-500"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium">{rec.title}</span>
            <Badge variant={badgeVariant} className="text-[9px]">
              {rec.category}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{rec.description}</p>
        </div>
      </div>
    </div>
  );
}
