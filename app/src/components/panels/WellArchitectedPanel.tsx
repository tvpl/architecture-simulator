"use client";
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Shield,
  Zap,
  DollarSign,
  Activity,
  Leaf,
  Settings2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useFlowStore,
  selectDomainNodes,
  selectDomainEdges,
} from "@/stores/flow-store";
import { useUIStore } from "@/stores/ui-store";
import {
  analyzeArchitecture,
  type WAPillar,
  type WAPillarScore,
  type WAFinding,
} from "@/domain/services/well-architected";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Score circle ─────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-black" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] text-muted-foreground">/100</div>
      </div>
    </div>
  );
}

// ─── Pillar icon map ─────────────────────────────────────────────────────────

const PILLAR_ICONS: Record<WAPillar, React.ReactNode> = {
  "operational-excellence": <Settings2 className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  reliability: <Activity className="w-4 h-4" />,
  performance: <Zap className="w-4 h-4" />,
  cost: <DollarSign className="w-4 h-4" />,
  sustainability: <Leaf className="w-4 h-4" />,
};

// ─── Pillar color map ─────────────────────────────────────────────────────────

const PILLAR_COLORS: Record<
  WAPillar,
  { bar: string; badge: string; text: string }
> = {
  "operational-excellence": {
    bar: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    text: "text-blue-600 dark:text-blue-400",
  },
  security: {
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    text: "text-red-600 dark:text-red-400",
  },
  reliability: {
    bar: "bg-violet-500",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
    text: "text-violet-600 dark:text-violet-400",
  },
  performance: {
    bar: "bg-orange-500",
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
    text: "text-orange-600 dark:text-orange-400",
  },
  cost: {
    bar: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  sustainability: {
    bar: "bg-green-500",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    text: "text-green-600 dark:text-green-400",
  },
};

// ─── Severity icon ────────────────────────────────────────────────────────────

function SeverityIcon({
  severity,
}: {
  severity: WAFinding["severity"];
}) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    case "high":
      return (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      );
    case "medium":
      return <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    case "low":
    case "info":
      return (
        <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      );
  }
}

// ─── Severity badge text ──────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<WAFinding["severity"], string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
  info: "Info",
};

const SEVERITY_COLORS: Record<WAFinding["severity"], string> = {
  critical:
    "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  medium:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  low: "bg-muted text-muted-foreground",
  info: "bg-muted text-muted-foreground",
};

// ─── Finding item ─────────────────────────────────────────────────────────────

function FindingItem({ finding }: { finding: WAFinding }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 text-xs">
      <SeverityIcon severity={finding.severity} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold leading-snug">{finding.title}</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              SEVERITY_COLORS[finding.severity]
            )}
          >
            {SEVERITY_LABELS[finding.severity]}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 leading-relaxed">
          {finding.description}
        </p>
        <p className="mt-1 text-foreground/80 leading-relaxed">
          <span className="font-medium">Recomendação:</span>{" "}
          {finding.recommendation}
        </p>
      </div>
    </div>
  );
}

// ─── Pillar section ───────────────────────────────────────────────────────────

function PillarSection({ pillar }: { pillar: WAPillarScore }) {
  const [expanded, setExpanded] = useState(false);
  const colors = PILLAR_COLORS[pillar.pillar];
  const scoreColor =
    pillar.score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : pillar.score >= 60
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
      >
        <span className={cn("shrink-0", colors.text)}>
          {PILLAR_ICONS[pillar.pillar]}
        </span>
        <span className="flex-1 text-sm font-medium leading-none">
          {pillar.displayName}
        </span>
        {pillar.findings.length > 0 && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
              colors.badge
            )}
          >
            {pillar.findings.length}
          </span>
        )}
        <span className={cn("text-sm font-bold tabular-nums shrink-0", scoreColor)}>
          {pillar.score}
        </span>
        <span className="text-muted-foreground shrink-0">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {/* Score bar */}
      <div className="px-3 pb-2">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", colors.bar)}
            initial={{ width: 0 }}
            animate={{ width: `${pillar.score}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          />
        </div>
      </div>

      {/* Findings */}
      <AnimatePresence initial={false}>
        {expanded && pillar.findings.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5 border-t border-border pt-2">
              {pillar.findings.map((finding, i) => (
                <FindingItem key={i} finding={finding} />
              ))}
            </div>
          </motion.div>
        )}
        {expanded && pillar.findings.length === 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-border pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Nenhuma descoberta para este pilar.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function WellArchitectedPanel() {
  const domainNodes = useFlowStore(selectDomainNodes);
  const domainEdges = useFlowStore(selectDomainEdges);
  const { wellArchitectedPanelOpen, toggleWellArchitectedPanel } = useUIStore();

  const report = useMemo(
    () => analyzeArchitecture(domainNodes, domainEdges),
    [domainNodes, domainEdges]
  );

  const handleExport = () => {
    try {
      const summary = {
        generatedAt: new Date(report.generatedAt).toISOString(),
        overallScore: report.overallScore,
        totalFindings: report.totalFindings,
        criticalCount: report.criticalCount,
        highCount: report.highCount,
        pillars: report.pillars.map((p) => ({
          pillar: p.pillar,
          displayName: p.displayName,
          score: p.score,
          findingsCount: p.findings.length,
          findings: p.findings.map((f) => ({
            severity: f.severity,
            title: f.title,
            description: f.description,
            recommendation: f.recommendation,
          })),
        })),
      };
      const blob = new Blob([JSON.stringify(summary, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `well-architected-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado.");
    } catch {
      toast.error("Erro ao exportar relatório.");
    }
  };

  const scoreLabel =
    report.overallScore >= 80
      ? "Bem Arquitetado"
      : report.overallScore >= 60
      ? "Em Conformidade"
      : "Precisa de Atenção";

  const scoreLabelColor =
    report.overallScore >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : report.overallScore >= 60
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <AnimatePresence>
      {wellArchitectedPanelOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute top-2 right-2 bottom-2 w-96 z-20 flex flex-col bg-background border border-border rounded-xl shadow-xl overflow-hidden"
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="flex-1 text-sm font-semibold">
              Well-Architected Report
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={toggleWellArchitectedPanel}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* ── Score summary ──────────────────────────────────────── */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                <ScoreCircle score={report.overallScore} />
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Score geral
                    </p>
                    <p className={cn("text-base font-bold", scoreLabelColor)}>
                      {scoreLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.criticalCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                        {report.criticalCount} crítico
                        {report.criticalCount > 1 ? "s" : ""}
                      </span>
                    )}
                    {report.highCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                        {report.highCount} alto
                        {report.highCount > 1 ? "s" : ""}
                      </span>
                    )}
                    {report.totalFindings > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                        {report.totalFindings} total
                      </span>
                    )}
                    {report.totalFindings === 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Sem descobertas
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Pillar sections ────────────────────────────────────── */}
              <div className="space-y-2">
                {report.pillars.map((pillar) => (
                  <PillarSection key={pillar.pillar} pillar={pillar} />
                ))}
              </div>

              {/* ── Export button ──────────────────────────────────────── */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={handleExport}
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Gerar Relatório
              </Button>
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
